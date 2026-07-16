import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJsonObject } from "./schema.js";
import type { ActivityType, OutboundActivityPublic } from "./types.js";

import "./schema.js";

interface ActivityRow {
  id: string;
  user_id: string;
  contact_id: string | null;
  company_id: string | null;
  lead_id: string | null;
  type: ActivityType;
  subject: string | null;
  body: string;
  metadata: string;
  created_at: string;
}

function toPublic(row: ActivityRow): OutboundActivityPublic {
  return {
    id: row.id,
    contactId: row.contact_id,
    companyId: row.company_id,
    leadId: row.lead_id,
    type: row.type,
    subject: row.subject,
    body: row.body,
    metadata: parseJsonObject(row.metadata),
    createdAt: row.created_at,
  };
}

export function listActivities(
  userId: string,
  filters?: { contactId?: string; companyId?: string; leadId?: string }
): OutboundActivityPublic[] {
  let query = "SELECT * FROM outbound_activities WHERE user_id = ?";
  const params: unknown[] = [userId];

  if (filters?.contactId) {
    query += " AND contact_id = ?";
    params.push(filters.contactId);
  }
  if (filters?.companyId) {
    query += " AND company_id = ?";
    params.push(filters.companyId);
  }
  if (filters?.leadId) {
    query += " AND lead_id = ?";
    params.push(filters.leadId);
  }

  query += " ORDER BY created_at DESC LIMIT 100";

  const rows = db.prepare(query).all(...params) as ActivityRow[];
  return rows.map(toPublic);
}

export function createActivity(
  userId: string,
  input: {
    contactId?: string;
    companyId?: string;
    leadId?: string;
    type: ActivityType;
    subject?: string;
    body: string;
    metadata?: Record<string, unknown>;
  }
): OutboundActivityPublic {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO outbound_activities
     (id, user_id, contact_id, company_id, lead_id, type, subject, body, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.contactId ?? null,
    input.companyId ?? null,
    input.leadId ?? null,
    input.type,
    input.subject ?? null,
    input.body,
    JSON.stringify(input.metadata ?? {})
  );

  if (input.contactId && ["email", "call", "meeting"].includes(input.type)) {
    db.prepare(
      "UPDATE outbound_contacts SET last_contacted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?"
    ).run(input.contactId, userId);
  }

  return listActivities(userId, { contactId: input.contactId }).find(
    (activity) => activity.id === id
  )!;
}

export function deleteActivity(id: string, userId: string): boolean {
  const result = db
    .prepare("DELETE FROM outbound_activities WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return result.changes > 0;
}
