import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data", "buselligence.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS anonymous_sessions (
    id TEXT PRIMARY KEY,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    messages TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
`);

export const FREE_TOKEN_LIMIT = 50_000;

export function getAnonymousTokens(sessionId: string): number {
  const row = db
    .prepare("SELECT tokens_used FROM anonymous_sessions WHERE id = ?")
    .get(sessionId) as { tokens_used: number } | undefined;
  return row?.tokens_used ?? 0;
}

export function addAnonymousTokens(sessionId: string, tokens: number): number {
  const existing = getAnonymousTokens(sessionId);
  const total = existing + tokens;

  if (existing === 0) {
    db.prepare(
      "INSERT INTO anonymous_sessions (id, tokens_used) VALUES (?, ?)"
    ).run(sessionId, total);
  } else {
    db.prepare(
      "UPDATE anonymous_sessions SET tokens_used = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(total, sessionId);
  }

  return total;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  messages: string;
  created_at: string;
  updated_at: string;
}

export function listConversations(userId: string): ConversationRow[] {
  return db
    .prepare(
      "SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC"
    )
    .all(userId) as ConversationRow[];
}

export function getConversation(
  id: string,
  userId: string
): ConversationRow | undefined {
  return db
    .prepare("SELECT * FROM conversations WHERE id = ? AND user_id = ?")
    .get(id, userId) as ConversationRow | undefined;
}

export function saveConversation(
  id: string,
  userId: string,
  title: string,
  messages: ChatMessage[]
): ConversationRow {
  const payload = JSON.stringify(messages);
  const existing = getConversation(id, userId);

  if (existing) {
    db.prepare(
      "UPDATE conversations SET title = ?, messages = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
    ).run(title, payload, id, userId);
  } else {
    db.prepare(
      "INSERT INTO conversations (id, user_id, title, messages) VALUES (?, ?, ?, ?)"
    ).run(id, userId, title, payload);
  }

  return getConversation(id, userId)!;
}

export function deleteConversation(id: string, userId: string): boolean {
  const result = db
    .prepare("DELETE FROM conversations WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return result.changes > 0;
}
