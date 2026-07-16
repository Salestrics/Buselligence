import { db } from "../db.js";

db.exec(`
  -- AI Runtime: Memory & Context
  CREATE TABLE IF NOT EXISTS core_memory (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'user',
    scope_id TEXT,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    memory_type TEXT NOT NULL DEFAULT 'fact',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS core_decisions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    decision TEXT NOT NULL,
    rationale TEXT,
    impact TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Autonomous Project Manager
  CREATE TABLE IF NOT EXISTS core_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'planning',
    plan TEXT NOT NULL DEFAULT '{}',
    sprints TEXT NOT NULL DEFAULT '[]',
    progress INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS core_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    sprint INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    assignee TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES core_projects(id) ON DELETE CASCADE
  );

  -- Knowledge Graph
  CREATE TABLE IF NOT EXISTS core_graph_nodes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    node_type TEXT NOT NULL,
    label TEXT NOT NULL,
    properties TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS core_graph_edges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    from_node TEXT NOT NULL,
    to_node TEXT NOT NULL,
    relationship TEXT NOT NULL,
    properties TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (from_node) REFERENCES core_graph_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (to_node) REFERENCES core_graph_nodes(id) ON DELETE CASCADE
  );

  -- Collaborative Workspaces
  CREATE TABLE IF NOT EXISTS core_workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    members TEXT NOT NULL DEFAULT '[]',
    shared_context TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Simulations
  CREATE TABLE IF NOT EXISTS core_simulations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    scenario TEXT NOT NULL,
    results TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Community Contributions
  CREATE TABLE IF NOT EXISTS core_contributions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    contribution_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    manifest TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- AI Native File Context
  CREATE TABLE IF NOT EXISTS core_file_context (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    file_path TEXT NOT NULL,
    meaning TEXT,
    summary TEXT,
    relationships TEXT NOT NULL DEFAULT '[]',
    actions TEXT NOT NULL DEFAULT '[]',
    history TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_core_memory_user ON core_memory(user_id);
  CREATE INDEX IF NOT EXISTS idx_core_projects_user ON core_projects(user_id);
  CREATE INDEX IF NOT EXISTS idx_core_graph_user ON core_graph_nodes(user_id);
`);

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
