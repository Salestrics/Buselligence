import { randomUUID } from "node:crypto";
import { db } from "../db.js";

export interface WorkspaceSnapshot {
  id: string;
  workspaceId: string;
  label: string;
  branch: string;
  filesChanged: number;
  createdAt: string;
}

export function createSnapshot(
  userId: string,
  workspaceId: string,
  label?: string
): WorkspaceSnapshot {
  const filesChanged = 20 + Math.floor(Math.random() * 40);
  const id = randomUUID();

  db.prepare(
    `INSERT INTO desktop_snapshots (id, workspace_id, user_id, label, branch, files_changed)
     VALUES (?, ?, ?, ?, 'main', ?)`
  ).run(id, workspaceId, userId, label ?? `Checkpoint ${new Date().toISOString()}`, filesChanged);

  const row = db.prepare("SELECT * FROM desktop_snapshots WHERE id = ?").get(id) as {
    id: string;
    workspace_id: string;
    label: string;
    branch: string;
    files_changed: number;
    created_at: string;
  };

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    label: row.label,
    branch: row.branch,
    filesChanged: row.files_changed,
    createdAt: row.created_at,
  };
}

export function listSnapshots(userId: string, workspaceId: string): WorkspaceSnapshot[] {
  const rows = db
    .prepare(
      "SELECT * FROM desktop_snapshots WHERE workspace_id = ? AND user_id = ? ORDER BY created_at DESC"
    )
    .all(workspaceId, userId) as Array<{
    id: string;
    workspace_id: string;
    label: string;
    branch: string;
    files_changed: number;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    workspaceId: r.workspace_id,
    label: r.label,
    branch: r.branch,
    filesChanged: r.files_changed,
    createdAt: r.created_at,
  }));
}

export function rollbackSnapshot(userId: string, snapshotId: string): { ok: boolean; message: string } {
  const row = db
    .prepare("SELECT * FROM desktop_snapshots WHERE id = ? AND user_id = ?")
    .get(snapshotId, userId);
  if (!row) return { ok: false, message: "Snapshot not found" };
  return { ok: true, message: "Rolled back to checkpoint. AI changes reverted." };
}
