import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";

export interface CollaborativeWorkspace {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  sharedContext: Record<string, unknown>;
  features: string[];
}

export function createWorkspace(
  ownerId: string,
  name: string,
  members: string[] = []
): CollaborativeWorkspace {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO core_workspaces (id, name, owner_id, members, shared_context) VALUES (?, ?, ?, ?, '{}')`
  ).run(id, name, ownerId, JSON.stringify([ownerId, ...members]));

  return getWorkspace(ownerId, id)!;
}

export function listWorkspaces(userId: string): CollaborativeWorkspace[] {
  const rows = db
    .prepare("SELECT * FROM core_workspaces WHERE owner_id = ? OR members LIKE ?")
    .all(userId, `%${userId}%`) as Array<{
    id: string;
    name: string;
    owner_id: string;
    members: string;
    shared_context: string;
  }>;

  return rows.map(mapWorkspace);
}

export function getWorkspace(userId: string, id: string): CollaborativeWorkspace | null {
  const row = db.prepare("SELECT * FROM core_workspaces WHERE id = ?").get(id) as {
    id: string;
    name: string;
    owner_id: string;
    members: string;
    shared_context: string;
  } | undefined;

  if (!row) return null;
  const members = parseJson<string[]>(row.members, []);
  if (row.owner_id !== userId && !members.includes(userId)) return null;

  return mapWorkspace(row);
}

function mapWorkspace(row: {
  id: string;
  name: string;
  owner_id: string;
  members: string;
  shared_context: string;
}): CollaborativeWorkspace {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    members: parseJson<string[]>(row.members, []),
    sharedContext: parseJson<Record<string, unknown>>(row.shared_context, {}),
    features: [
      "Shared agents",
      "Shared context",
      "Team memory",
      "AI reviewers",
      "AI project managers",
    ],
  };
}
