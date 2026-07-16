import { decryptSecret, encryptSecret, maskSecret } from "../crypto.js";
import { db } from "../db.js";
import type { SearchProviderId } from "./types.js";
import { SEARCH_PROVIDER_DEFINITIONS } from "./types.js";

import "./schema.js";

export interface OutboundSettingsRow {
  user_id: string;
  search_provider: SearchProviderId;
  search_api_key_encrypted: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutboundSettingsPublic {
  searchProvider: SearchProviderId;
  hasSearchApiKey: boolean;
  searchApiKeyPreview: string | null;
}

export interface ResolvedSearchCredentials {
  provider: SearchProviderId;
  apiKey: string;
}

export function getOutboundSettings(
  userId: string
): OutboundSettingsRow | undefined {
  return db
    .prepare("SELECT * FROM outbound_settings WHERE user_id = ?")
    .get(userId) as OutboundSettingsRow | undefined;
}

export function getPublicOutboundSettings(
  userId: string
): OutboundSettingsPublic {
  const row = getOutboundSettings(userId);
  const provider = (row?.search_provider ?? "tavily") as SearchProviderId;

  let searchApiKeyPreview: string | null = null;
  if (row?.search_api_key_encrypted) {
    try {
      searchApiKeyPreview = maskSecret(
        decryptSecret(row.search_api_key_encrypted)
      );
    } catch {
      searchApiKeyPreview = "configured";
    }
  }

  return {
    searchProvider: provider,
    hasSearchApiKey: Boolean(row?.search_api_key_encrypted),
    searchApiKeyPreview,
  };
}

export function saveOutboundSettings(
  userId: string,
  input: {
    searchProvider: SearchProviderId;
    searchApiKey?: string | null;
  }
): OutboundSettingsPublic {
  const existing = getOutboundSettings(userId);
  const encryptedKey =
    input.searchApiKey === undefined
      ? existing?.search_api_key_encrypted ?? null
      : input.searchApiKey
        ? encryptSecret(input.searchApiKey)
        : null;

  if (existing) {
    db.prepare(
      `UPDATE outbound_settings
       SET search_provider = ?, search_api_key_encrypted = ?, updated_at = datetime('now')
       WHERE user_id = ?`
    ).run(input.searchProvider, encryptedKey, userId);
  } else {
    db.prepare(
      `INSERT INTO outbound_settings (user_id, search_provider, search_api_key_encrypted)
       VALUES (?, ?, ?)`
    ).run(userId, input.searchProvider, encryptedKey);
  }

  return getPublicOutboundSettings(userId);
}

export function resolveSearchCredentials(
  userId: string
): ResolvedSearchCredentials | null {
  const row = getOutboundSettings(userId);
  if (!row?.search_api_key_encrypted) return null;

  return {
    provider: row.search_provider as SearchProviderId,
    apiKey: decryptSecret(row.search_api_key_encrypted),
  };
}

export function listSearchProviders() {
  return SEARCH_PROVIDER_DEFINITIONS;
}
