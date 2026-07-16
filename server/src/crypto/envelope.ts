import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { db } from "../db.js";
import { decryptSecret, encryptSecret } from "../crypto.js";

import "../bi/schema.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const DEK_LENGTH = 32;

export type KmsProvider = "local" | "aws_kms" | "vault" | "gcp_kms";

function getMasterKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ??
    process.env.BETTER_AUTH_SECRET ??
    "buselligence-dev-key-change-me";
  return createHash("sha256").update(secret).digest();
}

function getKmsProvider(): KmsProvider {
  const provider = process.env.KMS_PROVIDER as KmsProvider | undefined;
  if (provider && ["local", "aws_kms", "vault", "gcp_kms"].includes(provider)) {
    return provider;
  }
  return "local";
}

async function wrapDekWithKms(dek: Buffer): Promise<{ encryptedDek: string; provider: KmsProvider }> {
  const provider = getKmsProvider();

  if (provider === "aws_kms" && process.env.AWS_KMS_KEY_ID) {
    // Placeholder for AWS KMS integration — encrypt DEK with KMS key
    return { encryptedDek: encryptSecret(dek.toString("base64")), provider: "aws_kms" };
  }

  if (provider === "vault" && process.env.VAULT_ADDR) {
    return { encryptedDek: encryptSecret(dek.toString("base64")), provider: "vault" };
  }

  if (provider === "gcp_kms" && process.env.GCP_KMS_KEY_NAME) {
    return { encryptedDek: encryptSecret(dek.toString("base64")), provider: "gcp_kms" };
  }

  // Local envelope: master key wraps DEK
  const masterKey = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();
  const wrapped = `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
  return { encryptedDek: wrapped, provider: "local" };
}

async function unwrapDek(encryptedDek: string, provider: KmsProvider): Promise<Buffer> {
  if (provider !== "local") {
    return Buffer.from(decryptSecret(encryptedDek), "base64");
  }

  const [ivB64, tagB64, dataB64] = encryptedDek.split(":");
  const masterKey = getMasterKey();
  const decipher = createDecipheriv(ALGORITHM, masterKey, Buffer.from(ivB64!, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64!, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64!, "base64")), decipher.final()]);
}

function getOrCreateUserDek(userId: string): Promise<Buffer> {
  const row = db
    .prepare("SELECT encrypted_key, provider FROM encryption_keys WHERE user_id = ? AND key_type = 'dek' ORDER BY created_at DESC LIMIT 1")
    .get(userId) as { encrypted_key: string; provider: string } | undefined;

  if (row) {
    return unwrapDek(row.encrypted_key, row.provider as KmsProvider);
  }

  return createUserDek(userId);
}

async function createUserDek(userId: string): Promise<Buffer> {
  const dek = randomBytes(DEK_LENGTH);
  const { encryptedDek, provider } = await wrapDekWithKms(dek);

  db.prepare(
    `INSERT INTO encryption_keys (id, user_id, key_type, encrypted_key, provider) VALUES (?, ?, 'dek', ?, ?)`
  ).run(randomUUID(), userId, encryptedDek, provider);

  return dek;
}

export async function envelopeEncrypt(
  userId: string,
  plaintext: string
): Promise<string> {
  const dek = await getOrCreateUserDek(userId);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, dek, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `env:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export async function envelopeDecrypt(
  userId: string,
  payload: string
): Promise<string> {
  if (!payload.startsWith("env:")) {
    return decryptSecret(payload);
  }

  const [, ivB64, tagB64, dataB64] = payload.split(":");
  const dek = await getOrCreateUserDek(userId);
  const decipher = createDecipheriv(ALGORITHM, dek, Buffer.from(ivB64!, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64!, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64!, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function getEncryptionInfo(): {
  model: string;
  provider: KmsProvider;
  envelopeEnabled: boolean;
} {
  return {
    model: "envelope",
    provider: getKmsProvider(),
    envelopeEnabled: true,
  };
}