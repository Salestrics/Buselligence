import "./load-env.js";
import { betterAuth } from "better-auth";
import { toNodeHandler } from "better-auth/node";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDbPath = path.join(__dirname, "..", "data", "auth.db");

export const auth = betterAuth({
  database: new Database(authDbPath),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  trustedOrigins: [process.env.CLIENT_URL ?? "http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
});

export const authHandler = toNodeHandler(auth);
