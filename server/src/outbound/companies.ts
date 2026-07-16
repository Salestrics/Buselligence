import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import type {
  CompanyStatus,
  OutboundCompanyInput,
  OutboundCompanyPublic,
} from "./types.js";

import "./schema.js";

interface CompanyRow {
  id: string;
  user_id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  description: string | null;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

function countForCompany(
  companyId: string,
  table: "outbound_contacts" | "outbound_leads"
): number {
  return (
    db
      .prepare(`SELECT COUNT(*) as count FROM ${table} WHERE company_id = ?`)
      .get(companyId) as { count: number }
  ).count;
}

function toPublic(row: CompanyRow): OutboundCompanyPublic {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    industry: row.industry,
    size: row.size,
    location: row.location,
    description: row.description,
    status: row.status,
    contactsCount: countForCompany(row.id, "outbound_contacts"),
    leadsCount: countForCompany(row.id, "outbound_leads"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeDomain(website?: string | null): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return website.toLowerCase();
  }
}

export function listCompanies(userId: string): OutboundCompanyPublic[] {
  const rows = db
    .prepare(
      "SELECT * FROM outbound_companies WHERE user_id = ? ORDER BY updated_at DESC"
    )
    .all(userId) as CompanyRow[];
  return rows.map(toPublic);
}

export function getCompany(
  id: string,
  userId: string
): OutboundCompanyPublic | undefined {
  const row = db
    .prepare("SELECT * FROM outbound_companies WHERE id = ? AND user_id = ?")
    .get(id, userId) as CompanyRow | undefined;
  return row ? toPublic(row) : undefined;
}

export function findCompanyByNameOrDomain(
  userId: string,
  name: string,
  website?: string | null
): OutboundCompanyPublic | undefined {
  const domain = normalizeDomain(website);
  const rows = db
    .prepare("SELECT * FROM outbound_companies WHERE user_id = ?")
    .all(userId) as CompanyRow[];

  const byName = rows.find(
    (row) => row.name.toLowerCase() === name.toLowerCase()
  );
  if (byName) return toPublic(byName);

  if (domain) {
    const byDomain = rows.find(
      (row) => normalizeDomain(row.website) === domain
    );
    if (byDomain) return toPublic(byDomain);
  }

  return undefined;
}

export function createCompany(
  userId: string,
  input: OutboundCompanyInput
): OutboundCompanyPublic {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO outbound_companies
     (id, user_id, name, website, industry, size, location, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.name,
    input.website ?? null,
    input.industry ?? null,
    input.size ?? null,
    input.location ?? null,
    input.description ?? null,
    input.status ?? "prospect"
  );
  return getCompany(id, userId)!;
}

export function findOrCreateCompany(
  userId: string,
  input: OutboundCompanyInput
): OutboundCompanyPublic {
  const existing = findCompanyByNameOrDomain(
    userId,
    input.name,
    input.website
  );
  if (existing) return existing;
  return createCompany(userId, input);
}

export function updateCompany(
  id: string,
  userId: string,
  input: Partial<OutboundCompanyInput>
): OutboundCompanyPublic | undefined {
  const existing = getCompany(id, userId);
  if (!existing) return undefined;

  db.prepare(
    `UPDATE outbound_companies SET
      name = ?, website = ?, industry = ?, size = ?, location = ?,
      description = ?, status = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  ).run(
    input.name ?? existing.name,
    input.website !== undefined ? input.website : existing.website,
    input.industry !== undefined ? input.industry : existing.industry,
    input.size !== undefined ? input.size : existing.size,
    input.location !== undefined ? input.location : existing.location,
    input.description !== undefined ? input.description : existing.description,
    input.status ?? existing.status,
    id,
    userId
  );

  return getCompany(id, userId);
}

export function deleteCompany(id: string, userId: string): boolean {
  const result = db
    .prepare("DELETE FROM outbound_companies WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return result.changes > 0;
}
