import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "../platform/schema.js";

export interface KnowledgeItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  sourceType: "note" | "document" | "email" | "code" | "research" | "data";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export function listKnowledge(userId: string): KnowledgeItem[] {
  const rows = db
    .prepare("SELECT * FROM knowledge_items WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId) as Array<{
    id: string;
    user_id: string;
    title: string;
    content: string;
    source_type: string;
    tags: string;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    content: r.content,
    sourceType: r.source_type as KnowledgeItem["sourceType"],
    tags: parseJson<string[]>(r.tags, []),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function createKnowledge(
  userId: string,
  input: { title: string; content?: string; sourceType?: KnowledgeItem["sourceType"]; tags?: string[] }
): KnowledgeItem {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO knowledge_items (id, user_id, title, content, source_type, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.title,
    input.content ?? "",
    input.sourceType ?? "note",
    JSON.stringify(input.tags ?? []),
    now,
    now
  );
  return listKnowledge(userId).find((k) => k.id === id)!;
}

export function deleteKnowledge(userId: string, id: string): boolean {
  const result = db
    .prepare("DELETE FROM knowledge_items WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return result.changes > 0;
}

export function buildKnowledgeContext(userId: string): string {
  const items = listKnowledge(userId).slice(0, 20);
  if (!items.length) return "No knowledge base items yet.";
  return items
    .map((k) => `- [${k.sourceType}] ${k.title}: ${k.content.slice(0, 200)}`)
    .join("\n");
}
