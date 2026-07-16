import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "../bi/schema.js";

import "../bi/schema.js";

export interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  queryText: string | null;
  dataSources: string[];
  rowsReturned: number | null;
  agentId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface AuditRow {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  query_text: string | null;
  data_sources: string;
  rows_returned: number | null;
  agent_id: string | null;
  metadata: string;
  ip_address: string | null;
  created_at: string;
}

function toPublic(row: AuditRow): AuditLogEntry {
  return {
    id: row.id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    queryText: row.query_text,
    dataSources: parseJson(row.data_sources, []),
    rowsReturned: row.rows_returned,
    agentId: row.agent_id,
    metadata: parseJson(row.metadata, {}),
    createdAt: row.created_at,
  };
}

export function logAudit(
  userId: string,
  entry: {
    action: string;
    resourceType?: string;
    resourceId?: string;
    resourceName?: string;
    queryText?: string;
    dataSources?: string[];
    rowsReturned?: number;
    agentId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }
): AuditLogEntry {
  const id = randomUUID();
  const sanitizedMetadata = entry.metadata
    ? Object.fromEntries(
        Object.entries(entry.metadata).map(([key, value]) => {
          if (key === "arguments" && typeof value === "object" && value !== null) {
            return [key, { keys: Object.keys(value as Record<string, unknown>) }];
          }
          return [key, value];
        })
      )
    : {};

  db.prepare(
    `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, resource_name, query_text, data_sources, rows_returned, agent_id, metadata, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, userId, entry.action,
    entry.resourceType ?? null, entry.resourceId ?? null, entry.resourceName ?? null,
    entry.queryText ?? null, JSON.stringify(entry.dataSources ?? []),
    entry.rowsReturned ?? null, entry.agentId ?? null,
    JSON.stringify(sanitizedMetadata), entry.ipAddress ?? null
  );
  return toPublic(db.prepare("SELECT * FROM audit_logs WHERE id = ?").get(id) as AuditRow);
}

export function listAuditLogs(userId: string, limit = 100): AuditLogEntry[] {
  return (db.prepare("SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit) as AuditRow[]).map(toPublic);
}

export function formatAuditForDisplay(entry: AuditLogEntry): string {
  const lines = [
    `**${entry.action}** — ${new Date(entry.createdAt).toUTCString()}`,
  ];
  if (entry.resourceName) lines.push(`Resource: ${entry.resourceName}`);
  if (entry.dataSources.length) lines.push(`Data accessed: ${entry.dataSources.map((s) => `✓ ${s}`).join(", ")}`);
  if (entry.rowsReturned !== null) lines.push(`Rows returned: ${entry.rowsReturned}`);
  if (entry.agentId) lines.push(`Agent: ${entry.agentId}`);
  if (entry.queryText) lines.push(`Query: \`${entry.queryText.slice(0, 200)}\``);
  return lines.join("\n");
}
