#!/usr/bin/env node
/**
 * Ensures a usable .env exists for local self-hosted runs.
 * Creates from .env.example and generates secrets when missing or still placeholders.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

const PLACEHOLDER_SECRETS = new Set([
  "change-me-to-a-long-random-string",
  "change-me-to-another-long-random-string",
]);

function randomSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64");
}

function readExample() {
  if (!fs.existsSync(examplePath)) {
    console.error("Missing .env.example — cannot bootstrap environment.");
    process.exit(1);
  }
  return fs.readFileSync(examplePath, "utf8");
}

function upsertSecret(content, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) {
    return content.replace(pattern, `${key}=${value}`);
  }
  return `${content.trimEnd()}\n${key}=${value}\n`;
}

function needsSecret(value) {
  if (!value) return true;
  const trimmed = value.trim();
  return PLACEHOLDER_SECRETS.has(trimmed) || trimmed.length < 24;
}

function parseEnv(content) {
  const values = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    values[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return values;
}

let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : readExample();
let created = !fs.existsSync(envPath);
const parsed = parseEnv(content);

if (needsSecret(parsed.BETTER_AUTH_SECRET)) {
  content = upsertSecret(content, "BETTER_AUTH_SECRET", randomSecret());
  created = true;
}

if (needsSecret(parsed.ENCRYPTION_KEY)) {
  content = upsertSecret(content, "ENCRYPTION_KEY", randomSecret());
  created = true;
}

fs.writeFileSync(envPath, content.endsWith("\n") ? content : `${content}\n`, "utf8");

if (created) {
  console.log("✓ .env ready (secrets generated from .env.example)");
} else {
  console.log("✓ .env already configured");
}
