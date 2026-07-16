import { decryptSecret, encryptSecret, maskSecret } from "./crypto.js";
import { db } from "./db.js";
import type { AIProviderId } from "./providers/index.js";
import { getProviderDefinition } from "./providers/index.js";
import { OPENAI_DEFAULT_MODEL } from "./providers/openai-models.js";
import { assertSafeApiBaseUrl } from "./security/url-policy.js";

export interface UserSettingsRow {
  user_id: string;
  provider: AIProviderId;
  model: string | null;
  api_key_encrypted: string | null;
  api_base_url: string | null;
  auto_approve_mcp_tools: number;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsPublic {
  provider: AIProviderId;
  model: string;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  apiBaseUrl: string | null;
  autoApproveMcpTools: boolean;
}

export interface ResolvedCredentials {
  provider: AIProviderId;
  model: string;
  apiKey: string;
  baseUrl?: string;
  source: "user" | "server";
}

export interface ResolveCredentialsOptions {
  allowServerKey?: boolean;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'openai',
    model TEXT,
    api_key_encrypted TEXT,
    api_base_url TEXT,
    auto_approve_mcp_tools INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

try {
  db.exec(
    "ALTER TABLE user_settings ADD COLUMN auto_approve_mcp_tools INTEGER NOT NULL DEFAULT 0"
  );
} catch {
  // column exists
}

export function getUserSettings(userId: string): UserSettingsRow | undefined {
  return db
    .prepare("SELECT * FROM user_settings WHERE user_id = ?")
    .get(userId) as UserSettingsRow | undefined;
}

export function userAutoApprovesMcpTools(userId?: string): boolean {
  if (!userId) return false;
  if (process.env.MCP_AUTO_EXECUTE_TOOLS === "true") return true;
  const row = getUserSettings(userId);
  return row?.auto_approve_mcp_tools === 1;
}

export function getPublicSettings(userId: string): UserSettingsPublic {
  const row = getUserSettings(userId);
  const provider = (row?.provider ?? "openai") as AIProviderId;
  const definition = getProviderDefinition(provider);

  let apiKeyPreview: string | null = null;
  if (row?.api_key_encrypted) {
    try {
      apiKeyPreview = maskSecret(decryptSecret(row.api_key_encrypted));
    } catch {
      apiKeyPreview = "configured";
    }
  }

  return {
    provider,
    model: row?.model ?? definition.defaultModel,
    hasApiKey: Boolean(row?.api_key_encrypted),
    apiKeyPreview,
    apiBaseUrl: row?.api_base_url ?? null,
    autoApproveMcpTools: userAutoApprovesMcpTools(userId),
  };
}

export function saveUserSettings(
  userId: string,
  input: {
    provider: AIProviderId;
    model?: string;
    apiKey?: string | null;
    apiBaseUrl?: string | null;
    autoApproveMcpTools?: boolean;
  }
): UserSettingsPublic {
  const existing = getUserSettings(userId);
  const definition = getProviderDefinition(input.provider);

  if (input.apiBaseUrl) {
    assertSafeApiBaseUrl(input.apiBaseUrl);
  }

  const encryptedKey =
    input.apiKey === undefined
      ? existing?.api_key_encrypted ?? null
      : input.apiKey
        ? encryptSecret(input.apiKey)
        : null;

  const autoApprove =
    input.autoApproveMcpTools === undefined
      ? existing?.auto_approve_mcp_tools ?? 0
      : input.autoApproveMcpTools
        ? 1
        : 0;

  if (existing) {
    db.prepare(
      `UPDATE user_settings
       SET provider = ?, model = ?, api_key_encrypted = ?, api_base_url = ?,
           auto_approve_mcp_tools = ?, updated_at = datetime('now')
       WHERE user_id = ?`
    ).run(
      input.provider,
      input.model ?? definition.defaultModel,
      encryptedKey,
      input.apiBaseUrl ?? null,
      autoApprove,
      userId
    );
  } else {
    db.prepare(
      `INSERT INTO user_settings (user_id, provider, model, api_key_encrypted, api_base_url, auto_approve_mcp_tools)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      input.provider,
      input.model ?? definition.defaultModel,
      encryptedKey,
      input.apiBaseUrl ?? null,
      autoApprove
    );
  }

  return getPublicSettings(userId);
}

export function resolveCredentials(
  userId?: string,
  options: ResolveCredentialsOptions = {}
): ResolvedCredentials | null {
  const allowServerKey = options.allowServerKey ?? false;

  if (userId) {
    const row = getUserSettings(userId);
    if (row?.api_key_encrypted) {
      const provider = row.provider as AIProviderId;
      const definition = getProviderDefinition(provider);
      const baseUrl = row.api_base_url ?? undefined;
      if (baseUrl) assertSafeApiBaseUrl(baseUrl);

      return {
        provider,
        model: row.model ?? definition.defaultModel,
        apiKey: decryptSecret(row.api_key_encrypted),
        baseUrl,
        source: "user",
      };
    }
  }

  if (!allowServerKey) return null;

  const serverKey = process.env.OPENAI_API_KEY;
  if (serverKey && !userId) {
    return {
      provider: "openai",
      model: process.env.OPENAI_MODEL ?? OPENAI_DEFAULT_MODEL,
      apiKey: serverKey,
      source: "server",
    };
  }

  return null;
}

export function serverDemoKeyEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && process.env.ALLOW_SERVER_DEMO_KEY !== "false";
}
