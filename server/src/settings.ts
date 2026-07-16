import { decryptSecret, encryptSecret, maskSecret } from "./crypto.js";
import { db } from "./db.js";
import type { AIProviderId } from "./providers/index.js";
import { getProviderDefinition } from "./providers/index.js";

export interface UserSettingsRow {
  user_id: string;
  provider: AIProviderId;
  model: string | null;
  api_key_encrypted: string | null;
  api_base_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsPublic {
  provider: AIProviderId;
  model: string;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  apiBaseUrl: string | null;
}

export interface ResolvedCredentials {
  provider: AIProviderId;
  model: string;
  apiKey: string;
  baseUrl?: string;
  source: "user" | "server";
}

db.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'openai',
    model TEXT,
    api_key_encrypted TEXT,
    api_base_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function getUserSettings(userId: string): UserSettingsRow | undefined {
  return db
    .prepare("SELECT * FROM user_settings WHERE user_id = ?")
    .get(userId) as UserSettingsRow | undefined;
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
  };
}

export function saveUserSettings(
  userId: string,
  input: {
    provider: AIProviderId;
    model?: string;
    apiKey?: string | null;
    apiBaseUrl?: string | null;
  }
): UserSettingsPublic {
  const existing = getUserSettings(userId);
  const definition = getProviderDefinition(input.provider);
  const encryptedKey =
    input.apiKey === undefined
      ? existing?.api_key_encrypted ?? null
      : input.apiKey
        ? encryptSecret(input.apiKey)
        : null;

  if (existing) {
    db.prepare(
      `UPDATE user_settings
       SET provider = ?, model = ?, api_key_encrypted = ?, api_base_url = ?, updated_at = datetime('now')
       WHERE user_id = ?`
    ).run(
      input.provider,
      input.model ?? definition.defaultModel,
      encryptedKey,
      input.apiBaseUrl ?? null,
      userId
    );
  } else {
    db.prepare(
      `INSERT INTO user_settings (user_id, provider, model, api_key_encrypted, api_base_url)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      userId,
      input.provider,
      input.model ?? definition.defaultModel,
      encryptedKey,
      input.apiBaseUrl ?? null
    );
  }

  return getPublicSettings(userId);
}

export function resolveCredentials(
  userId?: string
): ResolvedCredentials | null {
  if (userId) {
    const row = getUserSettings(userId);
    if (row?.api_key_encrypted) {
      const provider = row.provider as AIProviderId;
      const definition = getProviderDefinition(provider);
      return {
        provider,
        model: row.model ?? definition.defaultModel,
        apiKey: decryptSecret(row.api_key_encrypted),
        baseUrl: row.api_base_url ?? undefined,
        source: "user",
      };
    }
  }

  const serverKey = process.env.OPENAI_API_KEY;
  if (serverKey) {
    return {
      provider: "openai",
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      apiKey: serverKey,
      source: "server",
    };
  }

  return null;
}
