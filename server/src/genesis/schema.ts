import { db } from "../db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS genesis_builds (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    project_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    current_agent TEXT,
    current_file TEXT,
    blueprint TEXT NOT NULL DEFAULT '{}',
    roadmap TEXT NOT NULL DEFAULT '[]',
    stats TEXT NOT NULL DEFAULT '{}',
    studio_project_id TEXT,
    preview TEXT NOT NULL DEFAULT '{}',
    events TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_genesis_builds_user ON genesis_builds(user_id);
`);

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
