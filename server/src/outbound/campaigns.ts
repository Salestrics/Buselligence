import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJsonArray } from "./schema.js";
import type {
  CampaignStatus,
  OutboundCampaignInput,
  OutboundCampaignPublic,
} from "./types.js";

import "./schema.js";

interface CampaignRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  industry: string | null;
  keywords: string;
  geography: string | null;
  target_titles: string;
  company_size: string | null;
  custom_queries: string;
  status: CampaignStatus;
  leads_count: number;
  last_run_at: string | null;
  last_run_error: string | null;
  created_at: string;
  updated_at: string;
}

function toPublic(row: CampaignRow): OutboundCampaignPublic {
  const contactsCount = (
    db
      .prepare(
        `SELECT COUNT(*) as count FROM outbound_contacts c
         JOIN outbound_leads l ON l.contact_id = c.id
         WHERE l.campaign_id = ? AND c.user_id = ?`
      )
      .get(row.id, row.user_id) as { count: number }
  ).count;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    industry: row.industry,
    keywords: parseJsonArray(row.keywords),
    geography: row.geography,
    targetTitles: parseJsonArray(row.target_titles),
    companySize: row.company_size,
    customQueries: parseJsonArray(row.custom_queries),
    status: row.status,
    leadsCount: row.leads_count,
    contactsCount,
    lastRunAt: row.last_run_at,
    lastRunError: row.last_run_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listCampaigns(userId: string): OutboundCampaignPublic[] {
  const rows = db
    .prepare(
      "SELECT * FROM outbound_campaigns WHERE user_id = ? ORDER BY updated_at DESC"
    )
    .all(userId) as CampaignRow[];
  return rows.map(toPublic);
}

export function getCampaign(
  id: string,
  userId: string
): OutboundCampaignPublic | undefined {
  const row = db
    .prepare("SELECT * FROM outbound_campaigns WHERE id = ? AND user_id = ?")
    .get(id, userId) as CampaignRow | undefined;
  return row ? toPublic(row) : undefined;
}

export function createCampaign(
  userId: string,
  input: OutboundCampaignInput
): OutboundCampaignPublic {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO outbound_campaigns
     (id, user_id, name, description, industry, keywords, geography, target_titles, company_size, custom_queries)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.name,
    input.description ?? null,
    input.industry ?? null,
    JSON.stringify(input.keywords ?? []),
    input.geography ?? null,
    JSON.stringify(input.targetTitles ?? []),
    input.companySize ?? null,
    JSON.stringify(input.customQueries ?? [])
  );
  return getCampaign(id, userId)!;
}

export function updateCampaign(
  id: string,
  userId: string,
  input: Partial<OutboundCampaignInput>
): OutboundCampaignPublic | undefined {
  const existing = getCampaign(id, userId);
  if (!existing) return undefined;

  db.prepare(
    `UPDATE outbound_campaigns SET
      name = ?, description = ?, industry = ?, keywords = ?, geography = ?,
      target_titles = ?, company_size = ?, custom_queries = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  ).run(
    input.name ?? existing.name,
    input.description !== undefined ? input.description : existing.description,
    input.industry !== undefined ? input.industry : existing.industry,
    JSON.stringify(input.keywords ?? existing.keywords),
    input.geography !== undefined ? input.geography : existing.geography,
    JSON.stringify(input.targetTitles ?? existing.targetTitles),
    input.companySize !== undefined ? input.companySize : existing.companySize,
    JSON.stringify(input.customQueries ?? existing.customQueries),
    id,
    userId
  );

  return getCampaign(id, userId);
}

export function deleteCampaign(id: string, userId: string): boolean {
  const result = db
    .prepare("DELETE FROM outbound_campaigns WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return result.changes > 0;
}

export function setCampaignStatus(
  id: string,
  userId: string,
  status: CampaignStatus,
  error?: string | null
): void {
  db.prepare(
    `UPDATE outbound_campaigns SET
      status = ?, last_run_error = ?, updated_at = datetime('now'),
      last_run_at = CASE WHEN ? IN ('completed', 'failed') THEN datetime('now') ELSE last_run_at END
     WHERE id = ? AND user_id = ?`
  ).run(status, error ?? null, status, id, userId);
}

export function refreshCampaignLeadCount(id: string, userId: string): void {
  const count = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM outbound_leads WHERE campaign_id = ? AND user_id = ?"
      )
      .get(id, userId) as { count: number }
  ).count;

  db.prepare(
    "UPDATE outbound_campaigns SET leads_count = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
  ).run(count, id, userId);
}

export function generateSearchQueries(
  campaign: OutboundCampaignPublic
): string[] {
  if (campaign.customQueries.length > 0) {
    return campaign.customQueries.slice(0, 6);
  }

  const queries: string[] = [];
  const industry = campaign.industry ?? "B2B";
  const geo = campaign.geography ? ` in ${campaign.geography}` : "";
  const keywords = campaign.keywords.slice(0, 3);
  const titles = campaign.targetTitles.slice(0, 2);

  if (keywords.length > 0) {
    queries.push(
      `${keywords.join(" ")} ${industry} companies${geo} contact email`
    );
    queries.push(`"${keywords[0]}" startup funding ${geo}`.trim());
  }

  if (titles.length > 0) {
    queries.push(
      `${titles.join(" OR ")} at ${industry} companies${geo} LinkedIn`
    );
  }

  if (campaign.companySize) {
    queries.push(
      `${industry} ${campaign.companySize} companies${geo} hiring ${titles[0] ?? "sales"}`
    );
  }

  queries.push(`${industry} companies${geo} "about us" team`);

  return [...new Set(queries.filter(Boolean))].slice(0, 5);
}
