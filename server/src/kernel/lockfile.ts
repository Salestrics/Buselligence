import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import { listSkills, getInstalledSkills } from "./skills.js";
import { listRegisteredAgents } from "./registry.js";
import { listMcpServers } from "../mcp/manager.js";
import type { BuselligenceLock } from "./types.js";

export function generateLockfile(userId: string, projectId?: string): BuselligenceLock {
  const skills = getInstalledSkills(userId);
  const allSkills = listSkills();
  const agents = listRegisteredAgents();
  const mcp = listMcpServers(userId);

  const lock: BuselligenceLock = {
    version: "1.0.0",
    models: {
      default: "gpt-5.6-sol",
      reasoning: "gpt-5.6-terra",
      code: "claude-sonnet-4-20250514",
    },
    agents: Object.fromEntries(agents.map((a) => [a.slug, a.version])),
    skills: Object.fromEntries(
      (skills.length ? skills : allSkills.filter((s) => s.builtin)).map((s) => [s.slug, s.version])
    ),
    mcpServers: mcp.map((s) => s.name),
    dependencies: {
      buselligence: "8.0.0",
      kernel: "1.0.0",
    },
    generatedAt: new Date().toISOString(),
  };

  const existing = projectId
    ? (db.prepare("SELECT id FROM kernel_lockfiles WHERE user_id = ? AND project_id = ?").get(userId, projectId) as { id: string } | undefined)
    : undefined;

  if (existing) {
    db.prepare(
      "UPDATE kernel_lockfiles SET content = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(JSON.stringify(lock, null, 2), existing.id);
  } else {
    db.prepare(
      "INSERT INTO kernel_lockfiles (id, user_id, project_id, content) VALUES (?, ?, ?, ?)"
    ).run(randomUUID(), userId, projectId ?? null, JSON.stringify(lock, null, 2));
  }

  return lock;
}

export function getLockfile(userId: string, projectId?: string): BuselligenceLock | null {
  const row = (projectId
    ? db.prepare("SELECT content FROM kernel_lockfiles WHERE user_id = ? AND project_id = ?").get(userId, projectId)
    : db.prepare("SELECT content FROM kernel_lockfiles WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1").get(userId)) as { content: string } | undefined;

  if (!row) return null;
  return parseJson<BuselligenceLock>(row.content, {} as BuselligenceLock);
}
