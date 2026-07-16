import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import { listFiles } from "./manager.js";
import type { StudioCommit } from "./types.js";

interface CommitRow {
  id: string;
  project_id: string;
  branch_id: string;
  user_id: string;
  message: string;
  author: string;
  additions: number;
  deletions: number;
  files_changed: string;
  snapshot: string;
  created_at: string;
}

function mapCommit(row: CommitRow): StudioCommit {
  return {
    id: row.id,
    projectId: row.project_id,
    branchId: row.branch_id,
    userId: row.user_id,
    message: row.message,
    author: row.author as "user" | "ai",
    additions: row.additions,
    deletions: row.deletions,
    filesChanged: parseJson<string[]>(row.files_changed, []),
    createdAt: row.created_at,
  };
}

export function createBranch(
  userId: string,
  projectId: string,
  name: string
): { id: string; name: string } {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO studio_branches (id, project_id, user_id, name, is_default) VALUES (?, ?, ?, ?, 0)`
  ).run(id, projectId, userId, name);
  return { id, name };
}

export function listCommits(
  userId: string,
  projectId: string,
  branchId?: string
): StudioCommit[] {
  const query = branchId
    ? "SELECT * FROM studio_commits WHERE project_id = ? AND user_id = ? AND branch_id = ? ORDER BY created_at DESC"
    : "SELECT * FROM studio_commits WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC";
  const rows = (branchId
    ? db.prepare(query).all(projectId, userId, branchId)
    : db.prepare(query).all(projectId, userId)) as CommitRow[];
  return rows.map(mapCommit);
}

export function createCommit(
  userId: string,
  projectId: string,
  branchId: string,
  message: string,
  author: "user" | "ai" = "user",
  changedFiles?: Array<{ path: string; additions: number; deletions: number }>
): StudioCommit {
  const files = listFiles(userId, projectId);
  const snapshot: Record<string, string> = {};
  for (const f of files) snapshot[f.path] = f.content;

  const filesChanged = changedFiles?.map((f) => f.path) ?? files.map((f) => f.path);
  const additions = changedFiles?.reduce((s, f) => s + f.additions, 0) ?? 0;
  const deletions = changedFiles?.reduce((s, f) => s + f.deletions, 0) ?? 0;

  const id = randomUUID();
  db.prepare(
    `INSERT INTO studio_commits (id, project_id, branch_id, user_id, message, author, additions, deletions, files_changed, snapshot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    projectId,
    branchId,
    userId,
    message,
    author,
    additions,
    deletions,
    JSON.stringify(filesChanged),
    JSON.stringify(snapshot)
  );

  return mapCommit(
    db.prepare("SELECT * FROM studio_commits WHERE id = ?").get(id) as CommitRow
  );
}

export function getDefaultBranch(
  userId: string,
  projectId: string
): { id: string; name: string } | null {
  const row = db
    .prepare(
      "SELECT id, name FROM studio_branches WHERE project_id = ? AND user_id = ? AND is_default = 1"
    )
    .get(projectId, userId) as { id: string; name: string } | undefined;
  return row ?? null;
}

export function aiCommit(
  userId: string,
  projectId: string,
  message: string,
  changedFiles: Array<{ path: string; additions: number; deletions: number }>
): StudioCommit {
  const branch = getDefaultBranch(userId, projectId);
  if (!branch) throw new Error("No default branch");
  return createCommit(userId, projectId, branch.id, message, "ai", changedFiles);
}
