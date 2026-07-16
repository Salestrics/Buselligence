import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { success, info } from "../lib/output.js";

const MCP_PRESETS: Record<string, { name: string; transport: string; url?: string; command?: string }> = {
  github: { name: "GitHub", transport: "stdio", command: "npx -y @modelcontextprotocol/server-github" },
  filesystem: { name: "Filesystem", transport: "stdio", command: "npx -y @modelcontextprotocol/server-filesystem ." },
  postgres: { name: "PostgreSQL", transport: "stdio", command: "npx -y @modelcontextprotocol/server-postgres" },
  slack: { name: "Slack", transport: "stdio", command: "npx -y @modelcontextprotocol/server-slack" },
};

export function runAdd(args: string[]): void {
  if (args[0] !== "mcp" || !args[1]) {
    console.error("Usage: bus add mcp <name>  (github, filesystem, postgres, slack)");
    process.exit(1);
  }

  const preset = MCP_PRESETS[args[1]];
  if (!preset) {
    console.error(`Unknown MCP preset: ${args[1]}. Available: ${Object.keys(MCP_PRESETS).join(", ")}`);
    process.exit(1);
  }

  const configPath = join(process.cwd(), "mcp.json");
  const existing = existsSync(configPath)
    ? (JSON.parse(readFileSync(configPath, "utf8")) as { servers: unknown[] })
    : { servers: [] };

  existing.servers.push({
    name: preset.name,
    slug: args[1],
    transport: preset.transport,
    command: preset.command,
    addedAt: new Date().toISOString(),
  });

  writeFileSync(configPath, JSON.stringify(existing, null, 2));
  success(`MCP server "${preset.name}" added to mcp.json`);
  info("Import in Buselligence: Settings → MCP → paste config or use UI");
  info("Or POST /api/mcp/servers with your session cookie");
}
