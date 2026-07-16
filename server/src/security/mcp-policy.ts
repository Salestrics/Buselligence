import path from "node:path";
import type { McpServerConfig, McpTransport } from "../mcp/types.js";

const DEFAULT_STDIO_ALLOWLIST = ["npx", "node", "uvx", "python", "python3"];

function stdioAllowlist(): Set<string> {
  const raw = process.env.MCP_STDIO_ALLOWLIST ?? DEFAULT_STDIO_ALLOWLIST.join(",");
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function assertMcpTransportAllowed(
  transport: McpTransport,
  userId?: string
): void {
  if (transport !== "stdio") return;

  if (process.env.MCP_ALLOW_STDIO !== "true") {
    throw new Error(
      "stdio MCP transport is disabled. Set MCP_ALLOW_STDIO=true and configure MCP_STDIO_ALLOWLIST for trusted commands only."
    );
  }

  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (adminIds.length > 0 && userId && !adminIds.includes(userId)) {
    throw new Error("stdio MCP transport is restricted to administrators");
  }
}

export function assertStdioCommandAllowed(config: McpServerConfig): void {
  const command = config.stdio?.command?.trim();
  if (!command) {
    throw new Error("stdio transport requires a command");
  }

  const baseCommand = path.basename(command).toLowerCase();
  if (!stdioAllowlist().has(baseCommand)) {
    throw new Error(
      `Command "${baseCommand}" is not in MCP_STDIO_ALLOWLIST. Add it explicitly if you trust this binary.`
    );
  }

  if (config.stdio?.cwd) {
    const resolved = path.resolve(config.stdio.cwd);
    if (resolved.includes("..")) {
      throw new Error("stdio cwd must not contain path traversal");
    }
  }
}

export function sanitizeStdioEnv(
  env?: Record<string, string>
): Record<string, string> {
  const safe: Record<string, string> = {};
  if (!env) return safe;

  for (const [key, value] of Object.entries(env)) {
    if (/^[A-Z][A-Z0-9_]*$/.test(key)) {
      safe[key] = value;
    }
  }

  return safe;
}

export function mcpConnectionTimeoutMs(): number {
  const parsed = Number(process.env.MCP_CONNECTION_TIMEOUT_MS ?? 30_000);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30_000;
}
