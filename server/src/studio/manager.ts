import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import type {
  FileLanguage,
  ProjectType,
  StudioBranch,
  StudioFile,
  StudioProject,
} from "./types.js";
import { DEFAULT_PROJECT_FILES } from "./types.js";

interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: string;
  stack: string;
  status: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

interface FileRow {
  id: string;
  project_id: string;
  user_id: string;
  path: string;
  content: string;
  language: string;
  created_at: string;
  updated_at: string;
}

function mapProject(row: ProjectRow): StudioProject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    projectType: row.project_type as ProjectType,
    stack: parseJson<string[]>(row.stack, []),
    status: row.status as StudioProject["status"],
    metadata: parseJson<Record<string, unknown>>(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFile(row: FileRow): StudioFile {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    path: row.path,
    content: row.content,
    language: row.language as FileLanguage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listProjects(userId: string): StudioProject[] {
  const rows = db
    .prepare(
      "SELECT * FROM studio_projects WHERE user_id = ? ORDER BY updated_at DESC"
    )
    .all(userId) as ProjectRow[];
  return rows.map(mapProject);
}

export function getProject(
  userId: string,
  projectId: string
): StudioProject | null {
  const row = db
    .prepare("SELECT * FROM studio_projects WHERE id = ? AND user_id = ?")
    .get(projectId, userId) as ProjectRow | undefined;
  return row ? mapProject(row) : null;
}

export function createProject(
  userId: string,
  input: {
    name: string;
    description?: string;
    projectType?: ProjectType;
    stack?: string[];
  }
): StudioProject {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO studio_projects (id, user_id, name, description, project_type, stack, status, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', '{}', ?, ?)`
  ).run(
    id,
    userId,
    input.name,
    input.description ?? null,
    input.projectType ?? "app",
    JSON.stringify(input.stack ?? ["react", "node", "postgresql"]),
    now,
    now
  );

  const branchId = randomUUID();
  db.prepare(
    `INSERT INTO studio_branches (id, project_id, user_id, name, is_default) VALUES (?, ?, ?, 'main', 1)`
  ).run(branchId, id, userId);

  for (const file of DEFAULT_PROJECT_FILES) {
    createFile(userId, id, file.path, file.content, file.language);
  }

  return getProject(userId, id)!;
}

export function deleteProject(userId: string, projectId: string): boolean {
  const result = db
    .prepare("DELETE FROM studio_projects WHERE id = ? AND user_id = ?")
    .run(projectId, userId);
  return result.changes > 0;
}

export function listFiles(userId: string, projectId: string): StudioFile[] {
  const rows = db
    .prepare(
      "SELECT * FROM studio_files WHERE project_id = ? AND user_id = ? ORDER BY path"
    )
    .all(projectId, userId) as FileRow[];
  return rows.map(mapFile);
}

export function getFile(
  userId: string,
  projectId: string,
  filePath: string
): StudioFile | null {
  const row = db
    .prepare(
      "SELECT * FROM studio_files WHERE project_id = ? AND user_id = ? AND path = ?"
    )
    .get(projectId, userId, filePath) as FileRow | undefined;
  return row ? mapFile(row) : null;
}

export function createFile(
  userId: string,
  projectId: string,
  filePath: string,
  content: string,
  language: FileLanguage
): StudioFile {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO studio_files (id, project_id, user_id, path, content, language, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, projectId, userId, filePath, content, language, now, now);
  db.prepare(
    "UPDATE studio_projects SET updated_at = ? WHERE id = ?"
  ).run(now, projectId);
  return getFile(userId, projectId, filePath)!;
}

export function updateFile(
  userId: string,
  projectId: string,
  filePath: string,
  content: string
): StudioFile | null {
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `UPDATE studio_files SET content = ?, updated_at = ? WHERE project_id = ? AND user_id = ? AND path = ?`
    )
    .run(content, now, projectId, userId, filePath);
  if (result.changes === 0) return null;
  db.prepare(
    "UPDATE studio_projects SET updated_at = ? WHERE id = ?"
  ).run(now, projectId);
  return getFile(userId, projectId, filePath);
}

export function deleteFile(
  userId: string,
  projectId: string,
  filePath: string
): boolean {
  const result = db
    .prepare(
      "DELETE FROM studio_files WHERE project_id = ? AND user_id = ? AND path = ?"
    )
    .run(projectId, userId, filePath);
  return result.changes > 0;
}

export function searchFiles(
  userId: string,
  projectId: string,
  query: string
): Array<{ path: string; matches: number }> {
  const files = listFiles(userId, projectId);
  const lower = query.toLowerCase();
  return files
    .map((f) => {
      const idx = f.content.toLowerCase().indexOf(lower);
      if (idx === -1) return null;
      const matches = f.content.toLowerCase().split(lower).length - 1;
      return { path: f.path, matches };
    })
    .filter((r): r is { path: string; matches: number } => r !== null);
}

export function listBranches(
  userId: string,
  projectId: string
): StudioBranch[] {
  const rows = db
    .prepare(
      "SELECT * FROM studio_branches WHERE project_id = ? AND user_id = ? ORDER BY is_default DESC, name"
    )
    .all(projectId, userId) as Array<{
    id: string;
    project_id: string;
    user_id: string;
    name: string;
    is_default: number;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    userId: r.user_id,
    name: r.name,
    isDefault: r.is_default === 1,
    createdAt: r.created_at,
  }));
}

export function getFileTree(
  userId: string,
  projectId: string
): Record<string, unknown> {
  const files = listFiles(userId, projectId);
  const tree: Record<string, unknown> = {};
  for (const file of files) {
    const parts = file.path.split("/");
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (i === parts.length - 1) {
        current[part] = { type: "file", language: file.language, id: file.id };
      } else {
        if (!current[part]) current[part] = { type: "folder", children: {} };
        const folder = current[part] as { children: Record<string, unknown> };
        current = folder.children;
      }
    }
  }
  return tree;
}
