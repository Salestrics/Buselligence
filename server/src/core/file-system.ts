import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import { listFiles } from "../studio/manager.js";

export interface FileContext {
  path: string;
  meaning?: string;
  summary?: string;
  relationships: string[];
  actions: string[];
  history: Array<{ event: string; date: string }>;
}

export function getFileContext(
  userId: string,
  projectId: string,
  filePath: string
): FileContext {
  const row = db
    .prepare(
      "SELECT * FROM core_file_context WHERE user_id = ? AND project_id = ? AND file_path = ?"
    )
    .get(userId, projectId, filePath) as {
    meaning: string | null;
    summary: string | null;
    relationships: string;
    actions: string;
    history: string;
  } | undefined;

  if (row) {
    return {
      path: filePath,
      meaning: row.meaning ?? undefined,
      summary: row.summary ?? undefined,
      relationships: parseJson<string[]>(row.relationships, []),
      actions: parseJson<string[]>(row.actions, []),
      history: parseJson<Array<{ event: string; date: string }>>(row.history, []),
    };
  }

  const files = listFiles(userId, projectId);
  const file = files.find((f) => f.path === filePath);
  if (!file) return { path: filePath, relationships: [], actions: [], history: [] };

  const context: FileContext = {
    path: filePath,
    meaning: inferMeaning(file.path, file.content),
    summary: file.content.slice(0, 200) + (file.content.length > 200 ? "..." : ""),
    relationships: files
      .filter((f) => f.path !== filePath && file.content.includes(f.path.split("/").pop() ?? ""))
      .map((f) => f.path)
      .slice(0, 5),
    actions: inferActions(file.path),
    history: [{ event: "Created", date: new Date().toISOString().split("T")[0]! }],
  };

  db.prepare(
    `INSERT INTO core_file_context (id, user_id, project_id, file_path, meaning, summary, relationships, actions, history)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    userId,
    projectId,
    filePath,
    context.meaning ?? null,
    context.summary ?? null,
    JSON.stringify(context.relationships),
    JSON.stringify(context.actions),
    JSON.stringify(context.history)
  );

  return context;
}

export function indexProjectFiles(userId: string, projectId: string): FileContext[] {
  const files = listFiles(userId, projectId);
  return files.map((f) => getFileContext(userId, projectId, f.path));
}

function inferMeaning(path: string, content: string): string {
  if (path.includes("auth")) return "Authentication and authorization layer";
  if (path.includes("Dashboard")) return "Main dashboard UI component";
  if (path.endsWith(".sql")) return "Database query or schema definition";
  if (path.includes("api/")) return "API endpoint handler";
  if (content.includes("export function")) return "React/TypeScript module";
  return "Application source file";
}

function inferActions(path: string): string[] {
  const actions = ["View", "Edit"];
  if (path.endsWith(".sql")) actions.push("Run query", "Explain plan");
  if (path.endsWith(".tsx")) actions.push("Preview", "Generate tests");
  if (path.includes("api/")) actions.push("Test endpoint", "Security scan");
  return actions;
}
