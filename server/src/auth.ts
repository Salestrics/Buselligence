import "./load-env.js";
import { betterAuth } from "better-auth";
import { toNodeHandler } from "better-auth/node";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });
const authDbPath = path.join(dataDir, "auth.db");

const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
const trustedOrigins = Array.from(new Set([clientUrl, baseURL]));

export const auth = betterAuth({
  database: new Database(authDbPath),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins,
  advanced: {
    // Self-hosted users often run production mode over plain HTTP (no TLS terminator).
    useSecureCookies: baseURL.startsWith("https://"),
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.DISABLE_SIGN_UP === "true",
  },
});

export const authHandler = toNodeHandler(auth);
