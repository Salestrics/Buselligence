import { db } from "../db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS desktop_workspaces (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    repo_url TEXT,
    repo_name TEXT,
    local_path TEXT,
    stack TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'stopped',
    framework TEXT,
    intelligence TEXT NOT NULL DEFAULT '{}',
    github_org TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS desktop_snapshots (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    label TEXT NOT NULL,
    branch TEXT NOT NULL DEFAULT 'main',
    files_changed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspace_id) REFERENCES desktop_workspaces(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS desktop_permissions (
    user_id TEXT PRIMARY KEY,
    read_files INTEGER NOT NULL DEFAULT 1,
    modify_files INTEGER NOT NULL DEFAULT 1,
    run_commands INTEGER NOT NULL DEFAULT 1,
    install_packages INTEGER NOT NULL DEFAULT 0,
    deploy INTEGER NOT NULL DEFAULT 0,
    ask_before_execution INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS desktop_command_log (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    user_id TEXT NOT NULL,
    command TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    output TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_desktop_workspaces_user ON desktop_workspaces(user_id);
`);

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
