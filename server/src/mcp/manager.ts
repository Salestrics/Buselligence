import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { decryptSecret, encryptSecret } from "../crypto.js";
import { db } from "../db.js";
import type { ToolDefinition, ToolCall, ToolResult } from "../providers/types.js";
import {
  assertMcpTransportAllowed,
  assertStdioCommandAllowed,
  mcpConnectionTimeoutMs,
  sanitizeStdioEnv,
} from "../security/mcp-policy.js";
import { assertSafeMcpRemoteUrl } from "../security/url-policy.js";
import type {
  McpServerConfig,
  McpServerInput,
  McpServerPublic,
  McpServerRow,
  McpTestResult,
  McpTransport,
} from "./types.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    transport TEXT NOT NULL,
    config TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_mcp_servers_user_id ON mcp_servers(user_id);
`);

function encryptConfig(config: McpServerConfig): string {
  return encryptSecret(JSON.stringify(config));
}

function parseConfig(raw: string): McpServerConfig {
  try {
    return JSON.parse(decryptSecret(raw)) as McpServerConfig;
  } catch {
    return JSON.parse(raw) as McpServerConfig;
  }
}

function toPublic(row: McpServerRow): McpServerPublic {
  return {
    id: row.id,
    name: row.name,
    transport: row.transport,
    config: parseConfig(row.config),
    enabled: row.enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateServerInput(userId: string, input: McpServerInput): void {
  assertMcpTransportAllowed(input.transport, userId);
  if (input.transport === "stdio") {
    assertStdioCommandAllowed(input.config);
  } else if (input.config.remote?.url) {
    assertSafeMcpRemoteUrl(input.config.remote.url);
  }
}

export function listMcpServers(userId: string): McpServerPublic[] {
  const rows = db
    .prepare(
      "SELECT * FROM mcp_servers WHERE user_id = ? ORDER BY created_at DESC"
    )
    .all(userId) as McpServerRow[];

  return rows.map(toPublic);
}

export function getMcpServer(
  id: string,
  userId: string
): McpServerPublic | undefined {
  const row = db
    .prepare("SELECT * FROM mcp_servers WHERE id = ? AND user_id = ?")
    .get(id, userId) as McpServerRow | undefined;

  return row ? toPublic(row) : undefined;
}

export function createMcpServer(
  userId: string,
  input: McpServerInput
): McpServerPublic {
  validateServerInput(userId, input);

  const id = randomUUID();
  db.prepare(
    `INSERT INTO mcp_servers (id, user_id, name, transport, config, enabled)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.name,
    input.transport,
    encryptConfig(input.config),
    input.enabled === false ? 0 : 1
  );

  return getMcpServer(id, userId)!;
}

export function updateMcpServer(
  id: string,
  userId: string,
  input: Partial<McpServerInput>
): McpServerPublic | undefined {
  const existing = getMcpServer(id, userId);
  if (!existing) return undefined;

  const next: McpServerInput = {
    name: input.name ?? existing.name,
    transport: input.transport ?? existing.transport,
    config: input.config ?? existing.config,
    enabled: input.enabled ?? existing.enabled,
  };

  validateServerInput(userId, next);

  db.prepare(
    `UPDATE mcp_servers
     SET name = ?, transport = ?, config = ?, enabled = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  ).run(
    next.name,
    next.transport,
    encryptConfig(next.config),
    next.enabled ? 1 : 0,
    id,
    userId
  );

  return getMcpServer(id, userId);
}

export function deleteMcpServer(id: string, userId: string): boolean {
  const result = db
    .prepare("DELETE FROM mcp_servers WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return result.changes > 0;
}

async function createTransport(
  config: McpServerConfig,
  transport: McpTransport,
  userId: string
) {
  assertMcpTransportAllowed(transport, userId);

  if (transport === "stdio") {
    assertStdioCommandAllowed(config);
    if (!config.stdio?.command) {
      throw new Error("stdio transport requires a command");
    }

    return new StdioClientTransport({
      command: config.stdio.command,
      args: config.stdio.args ?? [],
      env: sanitizeStdioEnv(config.stdio.env),
      cwd: config.stdio.cwd,
    });
  }

  if (!config.remote?.url) {
    throw new Error(`${transport} transport requires a URL`);
  }

  const url = assertSafeMcpRemoteUrl(config.remote.url);
  const requestInit = config.remote.headers
    ? { headers: config.remote.headers }
    : undefined;

  if (transport === "sse") {
    return new SSEClientTransport(url, { requestInit });
  }

  return new StreamableHTTPClientTransport(url, { requestInit });
}

async function withMcpClient<T>(
  server: McpServerPublic,
  userId: string,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const timeoutMs = mcpConnectionTimeoutMs();
  const transport = await createTransport(server.config, server.transport, userId);
  const client = new Client({
    name: "buselligence",
    version: "8.0.0",
  });

  const connectPromise = client.connect(transport);
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("MCP connection timed out")), timeoutMs);
  });

  await Promise.race([connectPromise, timeout]);

  try {
    return await fn(client);
  } finally {
    await client.close().catch(() => undefined);
  }
}

function namespacedToolName(serverName: string, toolName: string): string {
  const safeServer = serverName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${safeServer}__${toolName}`;
}

function parseNamespacedToolName(
  fullName: string
): { serverKey: string; toolName: string } | null {
  const separator = fullName.indexOf("__");
  if (separator === -1) return null;
  return {
    serverKey: fullName.slice(0, separator),
    toolName: fullName.slice(separator + 2),
  };
}

export async function testMcpServer(
  server: McpServerPublic,
  userId: string
): Promise<McpTestResult> {
  try {
    const tools = await withMcpClient(server, userId, async (client) => {
      const response = await client.listTools();
      return response.tools;
    });

    return {
      ok: true,
      toolCount: tools.length,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
      })),
      message: `Connected successfully. Found ${tools.length} tool(s).`,
    };
  } catch (error) {
    return {
      ok: false,
      toolCount: 0,
      tools: [],
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export async function loadMcpTools(
  servers: McpServerPublic[],
  userId: string,
  options?: { autoApproveTools?: boolean }
): Promise<{
  tools: ToolDefinition[];
  executeTool: (call: ToolCall) => Promise<ToolResult>;
}> {
  const enabledServers = servers.filter((server) => server.enabled);
  const toolCatalog: Array<{
    server: McpServerPublic;
    serverKey: string;
    toolName: string;
    definition: ToolDefinition;
  }> = [];

  for (const server of enabledServers) {
    try {
      const tools = await withMcpClient(server, userId, async (client) => {
        const response = await client.listTools();
        return response.tools;
      });

      const serverKey = server.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

      for (const tool of tools) {
        toolCatalog.push({
          server,
          serverKey,
          toolName: tool.name,
          definition: {
            name: namespacedToolName(server.name, tool.name),
            description: `[${server.name}] ${tool.description ?? tool.name}`,
            inputSchema: (tool.inputSchema as Record<string, unknown>) ?? {
              type: "object",
              properties: {},
            },
          },
        });
      }
    } catch (error) {
      console.error(`Failed to load MCP tools for ${server.name}:`, error);
    }
  }

  const autoApprove = options?.autoApproveTools ?? false;

  async function executeTool(call: ToolCall): Promise<ToolResult> {
    if (!autoApprove) {
      return {
        toolCallId: call.id,
        content:
          "MCP tool execution requires approval. Enable auto-approve in Settings or pass approvedToolCalls in your chat request.",
        isError: true,
      };
    }

    const parsed = parseNamespacedToolName(call.name);
    if (!parsed) {
      return {
        toolCallId: call.id,
        content: `Unknown tool: ${call.name}`,
        isError: true,
      };
    }

    const entry = toolCatalog.find(
      (item) =>
        item.serverKey === parsed.serverKey && item.toolName === parsed.toolName
    );

    if (!entry) {
      return {
        toolCallId: call.id,
        content: `Tool not found: ${call.name}`,
        isError: true,
      };
    }

    try {
      const result = await withMcpClient(entry.server, userId, async (client) => {
        return client.callTool({
          name: entry.toolName,
          arguments: call.arguments,
        });
      });

      const textParts = Array.isArray(result.content)
        ? result.content
            .map((part) => {
              if (typeof part === "object" && part !== null && "text" in part) {
                return String((part as { text?: string }).text ?? "");
              }
              return JSON.stringify(part);
            })
            .filter(Boolean)
        : [];

      return {
        toolCallId: call.id,
        content:
          textParts.join("\n") ||
          JSON.stringify(result.content ?? result, null, 2),
        isError: Boolean(result.isError),
      };
    } catch (error) {
      return {
        toolCallId: call.id,
        content: error instanceof Error ? error.message : "Tool execution failed",
        isError: true,
      };
    }
  }

  return {
    tools: toolCatalog.map((item) => item.definition),
    executeTool,
  };
}

export type {
  McpServerConfig,
  McpServerInput,
  McpServerPublic,
  McpTestResult,
  McpTransport,
} from "./types.js";
