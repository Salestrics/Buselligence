import { randomUUID } from "node:crypto";
import { encryptSecret, decryptSecret } from "../crypto.js";
import { db } from "../db.js";
import type { ConnectorType, DataConnectorInput, DataConnectorPublic } from "./types.js";
import { CONNECTOR_DEFINITIONS } from "./types.js";

import "../bi/schema.js";

interface ConnectorRow {
  id: string;
  user_id: string;
  name: string;
  connector_type: ConnectorType;
  config_encrypted: string;
  enabled: number;
  last_tested_at: string | null;
  last_test_ok: number | null;
  created_at: string;
  updated_at: string;
}

function toPublic(row: ConnectorRow): DataConnectorPublic {
  return {
    id: row.id,
    name: row.name,
    connectorType: row.connector_type,
    enabled: row.enabled === 1,
    lastTestedAt: row.last_tested_at,
    lastTestOk: row.last_test_ok === null ? null : row.last_test_ok === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listConnectorDefinitions() {
  return CONNECTOR_DEFINITIONS;
}

export function listConnectors(userId: string): DataConnectorPublic[] {
  return (db.prepare("SELECT * FROM data_connectors WHERE user_id = ? ORDER BY created_at DESC").all(userId) as ConnectorRow[]).map(toPublic);
}

export function getConnector(id: string, userId: string): DataConnectorPublic | undefined {
  const row = db.prepare("SELECT * FROM data_connectors WHERE id = ? AND user_id = ?").get(id, userId) as ConnectorRow | undefined;
  return row ? toPublic(row) : undefined;
}

export function getConnectorConfig(id: string, userId: string): Record<string, string> | null {
  const row = db.prepare("SELECT config_encrypted FROM data_connectors WHERE id = ? AND user_id = ?").get(id, userId) as { config_encrypted: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(decryptSecret(row.config_encrypted)) as Record<string, string>;
  } catch {
    return null;
  }
}

export function createConnector(userId: string, input: DataConnectorInput): DataConnectorPublic {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO data_connectors (id, user_id, name, connector_type, config_encrypted, enabled)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, userId, input.name, input.connectorType, encryptSecret(JSON.stringify(input.config)), input.enabled === false ? 0 : 1);
  return getConnector(id, userId)!;
}

export function updateConnector(id: string, userId: string, input: Partial<DataConnectorInput>): DataConnectorPublic | undefined {
  const existing = db.prepare("SELECT * FROM data_connectors WHERE id = ? AND user_id = ?").get(id, userId) as ConnectorRow | undefined;
  if (!existing) return undefined;

  const config = input.config
    ? encryptSecret(JSON.stringify(input.config))
    : existing.config_encrypted;

  db.prepare(
    `UPDATE data_connectors SET name=?, connector_type=?, config_encrypted=?, enabled=?, updated_at=datetime('now') WHERE id=? AND user_id=?`
  ).run(
    input.name ?? existing.name,
    input.connectorType ?? existing.connector_type,
    config,
    input.enabled === undefined ? existing.enabled : input.enabled ? 1 : 0,
    id, userId
  );
  return getConnector(id, userId);
}

export function deleteConnector(id: string, userId: string): boolean {
  return db.prepare("DELETE FROM data_connectors WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

export async function testConnector(id: string, userId: string): Promise<{ ok: boolean; message: string }> {
  const row = db.prepare("SELECT * FROM data_connectors WHERE id = ? AND user_id = ?").get(id, userId) as ConnectorRow | undefined;
  if (!row) return { ok: false, message: "Connector not found" };

  const config = JSON.parse(decryptSecret(row.config_encrypted)) as Record<string, string>;
  let result: { ok: boolean; message: string };

  if (row.connector_type === "postgresql" && config.connectionString) {
    result = await testPostgres(config.connectionString);
  } else if (row.connector_type === "stripe" && config.secretKey) {
    result = await testStripe(config.secretKey);
  } else {
    result = { ok: true, message: `Configuration saved for ${row.connector_type}. Live connection test available for PostgreSQL and Stripe.` };
  }

  db.prepare(
    "UPDATE data_connectors SET last_tested_at=datetime('now'), last_test_ok=?, updated_at=datetime('now') WHERE id=?"
  ).run(result.ok ? 1 : 0, id);

  return result;
}

async function testPostgres(connectionString: string): Promise<{ ok: boolean; message: string }> {
  try {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });
    await client.connect();
    const res = await client.query("SELECT 1 as ok");
    await client.end();
    return { ok: res.rows[0]?.ok === 1, message: "PostgreSQL connection successful." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "PostgreSQL connection failed" };
  }
}

async function testStripe(secretKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `Stripe API error: ${res.status} ${text}` };
    }
    return { ok: true, message: "Stripe API connection successful." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Stripe connection failed" };
  }
}

export function getConnectorSourceNames(userId: string): string[] {
  return listConnectors(userId)
    .filter((c) => c.enabled)
    .map((c) => `${c.connectorType}.${c.name.toLowerCase().replace(/\s+/g, "_")}`);
}
