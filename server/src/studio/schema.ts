import { db } from "../db.js";

db.exec(`
  -- Studio Projects
  CREATE TABLE IF NOT EXISTS studio_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    project_type TEXT NOT NULL DEFAULT 'app',
    stack TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'draft',
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS studio_files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    path TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT 'typescript',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(project_id, path),
    FOREIGN KEY (project_id) REFERENCES studio_projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS studio_branches (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(project_id, name),
    FOREIGN KEY (project_id) REFERENCES studio_projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS studio_commits (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'user',
    additions INTEGER NOT NULL DEFAULT 0,
    deletions INTEGER NOT NULL DEFAULT 0,
    files_changed TEXT NOT NULL DEFAULT '[]',
    snapshot TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES studio_projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS studio_query_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    connector_id TEXT,
    query TEXT NOT NULL,
    duration_ms INTEGER,
    rows_returned INTEGER,
    status TEXT NOT NULL DEFAULT 'success',
    explain_plan TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS studio_automations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    trigger_config TEXT NOT NULL DEFAULT '{}',
    steps TEXT NOT NULL DEFAULT '[]',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS studio_deployments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    environment TEXT NOT NULL DEFAULT 'preview',
    stack TEXT NOT NULL DEFAULT '[]',
    domain TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    url TEXT,
    logs TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES studio_projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS studio_packages (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    author TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    manifest TEXT NOT NULL DEFAULT '{}',
    installs INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS studio_package_installs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    package_id TEXT NOT NULL,
    installed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, package_id),
    FOREIGN KEY (package_id) REFERENCES studio_packages(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_studio_files_project ON studio_files(project_id);
  CREATE INDEX IF NOT EXISTS idx_studio_commits_project ON studio_commits(project_id);
  CREATE INDEX IF NOT EXISTS idx_studio_query_history_user ON studio_query_history(user_id);
`);

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
