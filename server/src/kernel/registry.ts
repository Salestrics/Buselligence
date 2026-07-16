import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import { listAgents } from "../agents/definitions.js";

export interface RegisteredAgent {
  id: string;
  slug: string;
  name: string;
  version: string;
  capabilities: string[];
  permissions: string[];
  status: "active" | "deprecated" | "disabled";
  manifest: Record<string, unknown>;
}

export function seedAgentRegistry(): void {
  const agents = listAgents();
  for (const agent of agents) {
    const existing = db.prepare("SELECT id FROM kernel_agent_registry WHERE slug = ?").get(agent.id);
    if (existing) continue;

    const capabilities = agent.focus;
    const permissions = derivePermissions(agent.id);

    db.prepare(
      `INSERT INTO kernel_agent_registry (id, slug, name, version, capabilities, permissions, status, manifest)
       VALUES (?, ?, ?, '1.0.0', ?, ?, 'active', ?)`
    ).run(
      randomUUID(),
      agent.id,
      agent.name,
      JSON.stringify(capabilities),
      JSON.stringify(permissions),
      JSON.stringify({ category: agent.category, title: agent.title, workflow: agent.workflow })
    );
  }

  // Add Security Reviewer as explicit registry entry
  const sec = db.prepare("SELECT id FROM kernel_agent_registry WHERE slug = ?").get("security_reviewer");
  if (!sec) {
    db.prepare(
      `INSERT INTO kernel_agent_registry (id, slug, name, version, capabilities, permissions, status, manifest)
       VALUES (?, 'security_reviewer', 'Security Reviewer', '1.2.0', ?, ?, 'active', '{}')`
    ).run(
      randomUUID(),
      JSON.stringify(["Code scanning", "Dependency analysis", "OWASP checks"]),
      JSON.stringify(["Read repository", "Run tests", "Scan dependencies"])
    );
  }
}

function derivePermissions(agentId: string): string[] {
  if (agentId.includes("engineer") || agentId === "software_engineer") {
    return ["Read repository", "Write code", "Run tests", "Deploy"];
  }
  if (agentId.includes("security") || agentId === "code_review") {
    return ["Read repository", "Run tests", "Scan dependencies"];
  }
  if (agentId.includes("analyst") || agentId.includes("data")) {
    return ["Read data", "Execute queries"];
  }
  return ["Read", "Respond"];
}

export function listRegisteredAgents(): RegisteredAgent[] {
  seedAgentRegistry();
  const rows = db
    .prepare("SELECT * FROM kernel_agent_registry ORDER BY name")
    .all() as Array<{
    id: string;
    slug: string;
    name: string;
    version: string;
    capabilities: string;
    permissions: string;
    status: string;
    manifest: string;
  }>;

  return rows.map(mapAgent);
}

export function getAgentFromRegistry(slug: string): RegisteredAgent | null {
  seedAgentRegistry();
  const row = db.prepare("SELECT * FROM kernel_agent_registry WHERE slug = ?").get(slug) as
    | Parameters<typeof mapAgent>[0]
    | undefined;
  return row ? mapAgent(row) : null;
}

function mapAgent(row: {
  id: string;
  slug: string;
  name: string;
  version: string;
  capabilities: string;
  permissions: string;
  status: string;
  manifest: string;
}): RegisteredAgent {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    version: row.version,
    capabilities: parseJson<string[]>(row.capabilities, []),
    permissions: parseJson<string[]>(row.permissions, []),
    status: row.status as RegisteredAgent["status"],
    manifest: parseJson<Record<string, unknown>>(row.manifest, {}),
  };
}
