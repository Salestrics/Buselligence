import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { createMcpServer } from "../mcp/manager.js";
import { createConnector } from "../connectors/manager.js";
import type { ConnectorType } from "../connectors/types.js";
import type { McpTransport } from "../mcp/types.js";

import "../bi/schema.js";

export interface MarketplacePreset {
  id: string;
  name: string;
  description: string;
  category: "database" | "business_app" | "analytics" | "devtools";
  type: "mcp" | "connector" | "both";
  author: string;
  installs: number;
  mcpConfig?: {
    transport: McpTransport;
    config: {
      transport: McpTransport;
      stdio?: { command: string; args: string[] };
      remote?: { url: string };
    };
  };
  connectorType?: ConnectorType;
  featured?: boolean;
}

export const MARKETPLACE_PRESETS: MarketplacePreset[] = [
  {
    id: "postgres",
    name: "PostgreSQL MCP",
    description: "Query PostgreSQL databases with natural language",
    category: "database",
    type: "mcp",
    author: "Anthropic",
    installs: 12400,
    featured: true,
    mcpConfig: {
      transport: "stdio",
      config: {
        transport: "stdio",
        stdio: { command: "npx", args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:pass@localhost:5432/db"] },
      },
    },
  },
  {
    id: "stripe",
    name: "Stripe MCP",
    description: "Revenue, subscriptions, and customer data from Stripe",
    category: "business_app",
    type: "both",
    author: "Stripe",
    installs: 8900,
    featured: true,
    connectorType: "stripe",
    mcpConfig: {
      transport: "stdio",
      config: {
        transport: "stdio",
        stdio: { command: "npx", args: ["-y", "@stripe/mcp", "--tools=all"] },
      },
    },
  },
  {
    id: "salesforce",
    name: "Salesforce MCP",
    description: "CRM accounts, opportunities, and pipeline data",
    category: "business_app",
    type: "connector",
    author: "Community",
    installs: 5600,
    featured: true,
    connectorType: "salesforce",
  },
  {
    id: "snowflake",
    name: "Snowflake MCP",
    description: "Query Snowflake data warehouse",
    category: "database",
    type: "mcp",
    author: "Snowflake",
    installs: 7200,
    mcpConfig: {
      transport: "stdio",
      config: {
        transport: "stdio",
        stdio: { command: "npx", args: ["-y", "snowflake-mcp-server"] },
      },
    },
  },
  {
    id: "filesystem",
    name: "Filesystem MCP",
    description: "Read CSV, JSON, and data files from disk",
    category: "database",
    type: "mcp",
    author: "Anthropic",
    installs: 15200,
    mcpConfig: {
      transport: "stdio",
      config: {
        transport: "stdio",
        stdio: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "/data"] },
      },
    },
  },
  {
    id: "github",
    name: "GitHub MCP",
    description: "Repos, issues, PRs for engineering metrics",
    category: "devtools",
    type: "mcp",
    author: "GitHub",
    installs: 9800,
    mcpConfig: {
      transport: "stdio",
      config: {
        transport: "stdio",
        stdio: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] },
      },
    },
  },
  {
    id: "jira",
    name: "Jira MCP",
    description: "Sprint velocity, ticket metrics, project tracking",
    category: "devtools",
    type: "mcp",
    author: "Atlassian",
    installs: 4300,
    mcpConfig: {
      transport: "stdio",
      config: {
        transport: "stdio",
        stdio: { command: "npx", args: ["-y", "jira-mcp-server"] },
      },
    },
  },
  {
    id: "hubspot",
    name: "HubSpot Connector",
    description: "Marketing & sales CRM data",
    category: "business_app",
    type: "connector",
    author: "HubSpot",
    installs: 3100,
    connectorType: "hubspot",
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    description: "Web traffic, conversions, and attribution",
    category: "analytics",
    type: "connector",
    author: "Google",
    installs: 6700,
    connectorType: "google_analytics",
  },
  {
    id: "sqlite",
    name: "SQLite MCP",
    description: "Local SQLite database queries",
    category: "database",
    type: "mcp",
    author: "Anthropic",
    installs: 8100,
    mcpConfig: {
      transport: "stdio",
      config: {
        transport: "stdio",
        stdio: { command: "npx", args: ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "./data.db"] },
      },
    },
  },
];

export function listMarketplacePresets(category?: string): MarketplacePreset[] {
  let presets = MARKETPLACE_PRESETS;
  if (category) presets = presets.filter((p) => p.category === category);
  return presets.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.installs - a.installs);
}

export function getMarketplacePreset(id: string): MarketplacePreset | undefined {
  return MARKETPLACE_PRESETS.find((p) => p.id === id);
}

export function installMarketplacePreset(
  userId: string,
  presetId: string,
  config?: Record<string, string>
): { mcpServerId?: string; connectorId?: string; preset: MarketplacePreset } {
  const preset = getMarketplacePreset(presetId);
  if (!preset) throw new Error("Preset not found");

  let mcpServerId: string | undefined;
  let connectorId: string | undefined;

  if ((preset.type === "mcp" || preset.type === "both") && preset.mcpConfig) {
    const server = createMcpServer(userId, {
      name: preset.name,
      transport: preset.mcpConfig.transport,
      config: preset.mcpConfig.config,
    });
    mcpServerId = server.id;
  }

  if ((preset.type === "connector" || preset.type === "both") && preset.connectorType) {
    const connector = createConnector(userId, {
      name: preset.name,
      connectorType: preset.connectorType,
      config: config ?? {},
    });
    connectorId = connector.id;
  }

  const installId = randomUUID();
  db.prepare(
    `INSERT INTO marketplace_installs (id, user_id, preset_id, mcp_server_id, connector_id) VALUES (?, ?, ?, ?, ?)`
  ).run(installId, userId, presetId, mcpServerId ?? null, connectorId ?? null);

  return { mcpServerId, connectorId, preset };
}

export function listUserInstalls(userId: string): Array<{ presetId: string; installedAt: string }> {
  return (db.prepare("SELECT preset_id, installed_at FROM marketplace_installs WHERE user_id = ? ORDER BY installed_at DESC").all(userId) as Array<{ preset_id: string; installed_at: string }>).map((r) => ({
    presetId: r.preset_id,
    installedAt: r.installed_at,
  }));
}
