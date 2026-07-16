import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJsonArray } from "./schema.js";
import { createActivity } from "./activities.js";
import { findOrCreateCompany } from "./companies.js";
import type {
  ContactStage,
  LeadStatus,
  OutboundContactInput,
  OutboundContactPublic,
  OutboundLeadPublic,
} from "./types.js";
import type { ExtractedLead } from "./types.js";

import "./schema.js";

interface LeadRow {
  id: string;
  user_id: string;
  campaign_id: string;
  company_id: string | null;
  contact_id: string | null;
  company_name: string;
  website: string | null;
  contact_name: string | null;
  email: string | null;
  linkedin: string | null;
  phone: string | null;
  title: string | null;
  industry: string | null;
  location: string | null;
  snippet: string | null;
  source_url: string;
  relevance_score: number;
  ai_summary: string;
  qualification_notes: string | null;
  status: LeadStatus;
  discovered_at: string;
}

interface ContactRow {
  id: string;
  user_id: string;
  company_id: string | null;
  lead_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  title: string | null;
  stage: ContactStage;
  tags: string;
  notes: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
}

function getCampaignName(campaignId: string): string | null {
  const row = db
    .prepare("SELECT name FROM outbound_campaigns WHERE id = ?")
    .get(campaignId) as { name: string } | undefined;
  return row?.name ?? null;
}

function getCompanyName(companyId: string | null): string | null {
  if (!companyId) return null;
  const row = db
    .prepare("SELECT name FROM outbound_companies WHERE id = ?")
    .get(companyId) as { name: string } | undefined;
  return row?.name ?? null;
}

function leadToPublic(row: LeadRow): OutboundLeadPublic {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    campaignName: getCampaignName(row.campaign_id),
    companyId: row.company_id,
    contactId: row.contact_id,
    companyName: row.company_name,
    website: row.website,
    contactName: row.contact_name,
    email: row.email,
    linkedin: row.linkedin,
    phone: row.phone,
    title: row.title,
    industry: row.industry,
    location: row.location,
    snippet: row.snippet,
    sourceUrl: row.source_url,
    relevanceScore: row.relevance_score,
    aiSummary: row.ai_summary,
    qualificationNotes: row.qualification_notes,
    status: row.status,
    discoveredAt: row.discovered_at,
  };
}

function contactToPublic(row: ContactRow): OutboundContactPublic {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: getCompanyName(row.company_id),
    leadId: row.lead_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    linkedin: row.linkedin,
    title: row.title,
    stage: row.stage,
    tags: parseJsonArray(row.tags),
    notes: row.notes,
    lastContactedAt: row.last_contacted_at,
    nextFollowUpAt: row.next_follow_up_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function splitName(fullName?: string | null): {
  firstName: string;
  lastName: string | null;
} {
  if (!fullName?.trim()) return { firstName: "Unknown", lastName: null };
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "Unknown",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

export function listLeads(
  userId: string,
  filters?: { campaignId?: string; status?: LeadStatus }
): OutboundLeadPublic[] {
  let query = "SELECT * FROM outbound_leads WHERE user_id = ?";
  const params: unknown[] = [userId];

  if (filters?.campaignId) {
    query += " AND campaign_id = ?";
    params.push(filters.campaignId);
  }
  if (filters?.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  query += " ORDER BY relevance_score DESC, discovered_at DESC";

  const rows = db.prepare(query).all(...params) as LeadRow[];
  return rows.map(leadToPublic);
}

export function getLead(
  id: string,
  userId: string
): OutboundLeadPublic | undefined {
  const row = db
    .prepare("SELECT * FROM outbound_leads WHERE id = ? AND user_id = ?")
    .get(id, userId) as LeadRow | undefined;
  return row ? leadToPublic(row) : undefined;
}

export function saveDiscoveredLead(
  userId: string,
  campaignId: string,
  lead: ExtractedLead,
  companyId?: string | null
): OutboundLeadPublic {
  const existing = db
    .prepare(
      "SELECT id FROM outbound_leads WHERE user_id = ? AND campaign_id = ? AND source_url = ?"
    )
    .get(userId, campaignId, lead.sourceUrl) as { id: string } | undefined;

  if (existing) {
    return getLead(existing.id, userId)!;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO outbound_leads
     (id, user_id, campaign_id, company_id, company_name, website, contact_name, email,
      linkedin, phone, title, industry, location, snippet, source_url, relevance_score,
      ai_summary, qualification_notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
  ).run(
    id,
    userId,
    campaignId,
    companyId ?? null,
    lead.companyName,
    lead.website ?? null,
    lead.contactName ?? null,
    lead.email ?? null,
    lead.linkedin ?? null,
    lead.phone ?? null,
    lead.title ?? null,
    lead.industry ?? null,
    lead.location ?? null,
    lead.snippet,
    lead.sourceUrl,
    lead.relevanceScore,
    lead.aiSummary,
    lead.qualificationNotes ?? null
  );

  createActivity(userId, {
    leadId: id,
    companyId: companyId ?? undefined,
    type: "discovered",
    subject: `Lead discovered: ${lead.companyName}`,
    body: lead.aiSummary,
    metadata: { sourceUrl: lead.sourceUrl, relevanceScore: lead.relevanceScore },
  });

  return getLead(id, userId)!;
}

export function updateLeadStatus(
  id: string,
  userId: string,
  status: LeadStatus
): OutboundLeadPublic | undefined {
  db.prepare(
    "UPDATE outbound_leads SET status = ? WHERE id = ? AND user_id = ?"
  ).run(status, id, userId);
  return getLead(id, userId);
}

export function deleteLead(id: string, userId: string): boolean {
  const result = db
    .prepare("DELETE FROM outbound_leads WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return result.changes > 0;
}

export function listContacts(
  userId: string,
  filters?: { companyId?: string; stage?: ContactStage }
): OutboundContactPublic[] {
  let query = "SELECT * FROM outbound_contacts WHERE user_id = ?";
  const params: unknown[] = [userId];

  if (filters?.companyId) {
    query += " AND company_id = ?";
    params.push(filters.companyId);
  }
  if (filters?.stage) {
    query += " AND stage = ?";
    params.push(filters.stage);
  }

  query += " ORDER BY updated_at DESC";

  const rows = db.prepare(query).all(...params) as ContactRow[];
  return rows.map(contactToPublic);
}

export function getContact(
  id: string,
  userId: string
): OutboundContactPublic | undefined {
  const row = db
    .prepare("SELECT * FROM outbound_contacts WHERE id = ? AND user_id = ?")
    .get(id, userId) as ContactRow | undefined;
  return row ? contactToPublic(row) : undefined;
}

export function createContact(
  userId: string,
  input: OutboundContactInput
): OutboundContactPublic {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO outbound_contacts
     (id, user_id, company_id, first_name, last_name, email, phone, linkedin, title,
      stage, tags, notes, next_follow_up_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.companyId ?? null,
    input.firstName,
    input.lastName ?? null,
    input.email ?? null,
    input.phone ?? null,
    input.linkedin ?? null,
    input.title ?? null,
    input.stage ?? "new",
    JSON.stringify(input.tags ?? []),
    input.notes ?? null,
    input.nextFollowUpAt ?? null
  );

  createActivity(userId, {
    contactId: id,
    companyId: input.companyId ?? undefined,
    type: "note",
    subject: "Contact created",
    body: `Added ${input.firstName} ${input.lastName ?? ""}`.trim(),
  });

  return getContact(id, userId)!;
}

export function updateContact(
  id: string,
  userId: string,
  input: Partial<OutboundContactInput>
): OutboundContactPublic | undefined {
  const existing = getContact(id, userId);
  if (!existing) return undefined;

  const newStage = input.stage ?? existing.stage;

  db.prepare(
    `UPDATE outbound_contacts SET
      company_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?,
      linkedin = ?, title = ?, stage = ?, tags = ?, notes = ?,
      next_follow_up_at = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  ).run(
    input.companyId !== undefined ? input.companyId : existing.companyId,
    input.firstName ?? existing.firstName,
    input.lastName !== undefined ? input.lastName : existing.lastName,
    input.email !== undefined ? input.email : existing.email,
    input.phone !== undefined ? input.phone : existing.phone,
    input.linkedin !== undefined ? input.linkedin : existing.linkedin,
    input.title !== undefined ? input.title : existing.title,
    newStage,
    JSON.stringify(input.tags ?? existing.tags),
    input.notes !== undefined ? input.notes : existing.notes,
    input.nextFollowUpAt !== undefined
      ? input.nextFollowUpAt
      : existing.nextFollowUpAt,
    id,
    userId
  );

  if (input.stage && input.stage !== existing.stage) {
    createActivity(userId, {
      contactId: id,
      companyId: existing.companyId ?? undefined,
      type: "status_change",
      subject: "Stage updated",
      body: `Changed from ${existing.stage} to ${input.stage}`,
      metadata: { from: existing.stage, to: input.stage },
    });
  }

  return getContact(id, userId);
}

export function deleteContact(id: string, userId: string): boolean {
  const result = db
    .prepare("DELETE FROM outbound_contacts WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return result.changes > 0;
}

export function convertLeadToContact(
  leadId: string,
  userId: string
): OutboundContactPublic | undefined {
  const lead = getLead(leadId, userId);
  if (!lead) return undefined;
  if (lead.contactId) return getContact(lead.contactId, userId);

  const company = findOrCreateCompany(userId, {
    name: lead.companyName,
    website: lead.website ?? undefined,
    industry: lead.industry ?? undefined,
    location: lead.location ?? undefined,
  });

  const { firstName, lastName } = splitName(lead.contactName);

  const contactId = randomUUID();
  db.prepare(
    `INSERT INTO outbound_contacts
     (id, user_id, company_id, lead_id, first_name, last_name, email, phone, linkedin, title, stage, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'researching', ?)`
  ).run(
    contactId,
    userId,
    company.id,
    leadId,
    firstName,
    lastName,
    lead.email,
    lead.phone,
    lead.linkedin,
    lead.title,
    lead.aiSummary
  );

  db.prepare(
    `UPDATE outbound_leads SET company_id = ?, contact_id = ?, status = 'converted' WHERE id = ? AND user_id = ?`
  ).run(company.id, contactId, leadId, userId);

  createActivity(userId, {
    contactId,
    companyId: company.id,
    leadId,
    type: "status_change",
    subject: "Lead converted to contact",
    body: `Converted lead ${lead.companyName} into contact pipeline.`,
    metadata: { leadId, relevanceScore: lead.relevanceScore },
  });

  return getContact(contactId, userId);
}

export function getOutboundStats(userId: string) {
  const campaigns = (
    db
      .prepare("SELECT COUNT(*) as count FROM outbound_campaigns WHERE user_id = ?")
      .get(userId) as { count: number }
  ).count;
  const leads = (
    db
      .prepare("SELECT COUNT(*) as count FROM outbound_leads WHERE user_id = ?")
      .get(userId) as { count: number }
  ).count;
  const contacts = (
    db
      .prepare("SELECT COUNT(*) as count FROM outbound_contacts WHERE user_id = ?")
      .get(userId) as { count: number }
  ).count;
  const companies = (
    db
      .prepare("SELECT COUNT(*) as count FROM outbound_companies WHERE user_id = ?")
      .get(userId) as { count: number }
  ).count;
  const qualified = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM outbound_contacts WHERE user_id = ? AND stage IN ('qualified', 'customer')"
      )
      .get(userId) as { count: number }
  ).count;
  const followUps = (
    db
      .prepare(
        `SELECT COUNT(*) as count FROM outbound_contacts
         WHERE user_id = ? AND next_follow_up_at IS NOT NULL
         AND date(next_follow_up_at) <= date('now')`
      )
      .get(userId) as { count: number }
  ).count;

  return { campaigns, leads, contacts, companies, qualified, followUps };
}
