import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

const COOKIE_NAME = "buselligence_anon";

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};

  const cookies: Record<string, string> = {};
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function getSigningSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET ?? process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET or ENCRYPTION_KEY is required for anonymous sessions");
  }
  return secret;
}

function signSessionId(sessionId: string): string {
  const signature = createHmac("sha256", getSigningSecret())
    .update(sessionId)
    .digest("base64url");
  return `${sessionId}.${signature}`;
}

function verifySignedValue(value: string): string | null {
  const separator = value.lastIndexOf(".");
  if (separator === -1) return null;

  const sessionId = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!sessionId || !signature) return null;

  const expected = createHmac("sha256", getSigningSecret())
    .update(sessionId)
    .digest("base64url");

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return sessionId;
}

export function issueAnonymousSession(res: Response): string {
  const sessionId = randomUUID();
  const signed = signSessionId(sessionId);
  res.cookie(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
  return sessionId;
}

export function resolveAnonymousSessionId(req: Request, res: Response): string {
  const cookies = parseCookies(req);
  const cookieValue = cookies[COOKIE_NAME];
  if (cookieValue) {
    const sessionId = verifySignedValue(cookieValue);
    if (sessionId) return sessionId;
  }

  const headerValue = req.headers["x-anonymous-session"];
  if (typeof headerValue === "string" && headerValue) {
    const sessionId = verifySignedValue(headerValue);
    if (sessionId) return sessionId;
  }

  return issueAnonymousSession(res);
}
