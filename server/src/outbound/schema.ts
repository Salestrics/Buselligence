import { db } from "../db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS outbound_settings (
    user_id TEXT PRIMARY KEY,
    search_provider TEXT NOT NULL DEFAULT 'tavily',
    search_api_key_encrypted TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS outbound_campaigns (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    keywords TEXT NOT NULL DEFAULT '[]',
    geography TEXT,
    target_titles TEXT NOT NULL DEFAULT '[]',
    company_size TEXT,
    custom_queries TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'draft',
    leads_count INTEGER NOT NULL DEFAULT 0,
    last_run_at TEXT,
    last_run_error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS outbound_companies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    size TEXT,
    location TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'prospect',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS outbound_contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company_id TEXT,
    lead_id TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    linkedin TEXT,
    title TEXT,
    stage TEXT NOT NULL DEFAULT 'new',
    tags TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    last_contacted_at TEXT,
    next_follow_up_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES outbound_companies(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS outbound_leads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    company_id TEXT,
    contact_id TEXT,
    company_name TEXT NOT NULL,
    website TEXT,
    contact_name TEXT,
    email TEXT,
    linkedin TEXT,
    phone TEXT,
    title TEXT,
    industry TEXT,
    location TEXT,
    snippet TEXT,
    source_url TEXT NOT NULL,
    relevance_score REAL NOT NULL DEFAULT 0,
    ai_summary TEXT NOT NULL DEFAULT '',
    qualification_notes TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (campaign_id) REFERENCES outbound_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES outbound_companies(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES outbound_contacts(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS outbound_activities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    contact_id TEXT,
    company_id TEXT,
    lead_id TEXT,
    type TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contact_id) REFERENCES outbound_contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES outbound_companies(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES outbound_leads(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_outbound_campaigns_user ON outbound_campaigns(user_id);
  CREATE INDEX IF NOT EXISTS idx_outbound_leads_user ON outbound_leads(user_id);
  CREATE INDEX IF NOT EXISTS idx_outbound_leads_campaign ON outbound_leads(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_outbound_companies_user ON outbound_companies(user_id);
  CREATE INDEX IF NOT EXISTS idx_outbound_contacts_user ON outbound_contacts(user_id);
  CREATE INDEX IF NOT EXISTS idx_outbound_contacts_company ON outbound_contacts(company_id);
  CREATE INDEX IF NOT EXISTS idx_outbound_activities_contact ON outbound_activities(contact_id);
`);

export function parseJsonArray<T = string>(raw: string): T[] {
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}
