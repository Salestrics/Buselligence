import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 5 * 60 * 1000;

interface PendingApproval {
  userId: string;
  payload: string;
  expiresAt: number;
}

const pending = new Map<string, PendingApproval>();

function signingSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET ?? process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error("Signing secret required for approval tokens");
  return secret;
}

export function createApprovalToken(
  userId: string,
  payload: Record<string, unknown>
): string {
  const id = randomUUID();
  const serialized = JSON.stringify(payload);
  pending.set(id, {
    userId,
    payload: serialized,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });

  const signature = createHmac("sha256", signingSecret())
    .update(`${id}:${serialized}`)
    .digest("base64url");

  return `${id}.${signature}`;
}

export function consumeApprovalToken(
  userId: string,
  token: string
): Record<string, unknown> | null {
  const separator = token.lastIndexOf(".");
  if (separator === -1) return null;

  const id = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const entry = pending.get(id);
  if (!entry || entry.userId !== userId || entry.expiresAt < Date.now()) {
    pending.delete(id);
    return null;
  }

  const expected = createHmac("sha256", signingSecret())
    .update(`${id}:${entry.payload}`)
    .digest("base64url");

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  pending.delete(id);
  return JSON.parse(entry.payload) as Record<string, unknown>;
}

export function pruneExpiredApprovals(): void {
  const now = Date.now();
  for (const [id, entry] of pending) {
    if (entry.expiresAt < now) pending.delete(id);
  }
}
