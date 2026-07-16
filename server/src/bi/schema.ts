import { db } from "../db.js";

db.exec(`
  -- Semantic Layer: Business Context
  CREATE TABLE IF NOT EXISTS semantic_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    formula TEXT NOT NULL,
    unit TEXT,
    category TEXT,
    sources TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS semantic_relationships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    from_entity TEXT NOT NULL,
    to_entity TEXT NOT NULL,
    relationship_type TEXT NOT NULL DEFAULT 'one_to_many',
    join_key TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS semantic_rules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL DEFAULT 'filter',
    expression TEXT NOT NULL,
    applies_to TEXT NOT NULL DEFAULT '[]',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- First-class Data Connectors
  CREATE TABLE IF NOT EXISTS data_connectors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    connector_type TEXT NOT NULL,
    config_encrypted TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_tested_at TEXT,
    last_test_ok INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Dashboards
  CREATE TABLE IF NOT EXISTS dashboards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    prompt TEXT,
    layout TEXT NOT NULL DEFAULT '[]',
    widgets TEXT NOT NULL DEFAULT '[]',
    export_formats TEXT NOT NULL DEFAULT '["react"]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Data Governance: Audit Log
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    resource_name TEXT,
    query_text TEXT,
    data_sources TEXT NOT NULL DEFAULT '[]',
    rows_returned INTEGER,
    agent_id TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Scheduled Intelligence
  CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    cron_expression TEXT NOT NULL DEFAULT '0 8 * * 1',
    job_type TEXT NOT NULL DEFAULT 'weekly_briefing',
    config TEXT NOT NULL DEFAULT '{}',
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run_at TEXT,
    last_run_result TEXT,
    next_run_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS intelligence_briefings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    job_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    metrics_snapshot TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES scheduled_jobs(id) ON DELETE SET NULL
  );

  -- MCP Marketplace installs (tracks marketplace origin)
  CREATE TABLE IF NOT EXISTS marketplace_installs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    preset_id TEXT NOT NULL,
    mcp_server_id TEXT,
    connector_id TEXT,
    installed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Envelope encryption key metadata
  CREATE TABLE IF NOT EXISTS encryption_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    key_type TEXT NOT NULL DEFAULT 'dek',
    encrypted_key TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'local',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    rotated_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_semantic_metrics_user ON semantic_metrics(user_id);
  CREATE INDEX IF NOT EXISTS idx_semantic_rules_user ON semantic_rules(user_id);
  CREATE INDEX IF NOT EXISTS idx_data_connectors_user ON data_connectors(user_id);
  CREATE INDEX IF NOT EXISTS idx_dashboards_user ON dashboards(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_user ON scheduled_jobs(user_id);
  CREATE INDEX IF NOT EXISTS idx_briefings_user ON intelligence_briefings(user_id);
`);

export function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
