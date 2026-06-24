import "./load-env.js";
import Database from "better-sqlite3";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDbPath = path.join(__dirname, "..", "data", "auth.db");

async function seed() {
  const email = process.env.SEED_USER_EMAIL ?? "demo@buselligence.com";
  const password = process.env.SEED_USER_PASSWORD ?? "demo123456";
  const name = process.env.SEED_USER_NAME ?? "Demo User";

  const db = new Database(authDbPath);

  const existing = db
    .prepare("SELECT id FROM user WHERE email = ?")
    .get(email) as { id: string } | undefined;

  if (existing) {
    console.log(`User already exists: ${email}`);
    return;
  }

  const userId = randomUUID();
  const accountId = randomUUID();
  const hashedPassword = await hashPassword(password);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
     VALUES (?, ?, ?, 1, ?, ?)`
  ).run(userId, name, email, now, now);

  db.prepare(
    `INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
     VALUES (?, ?, 'credential', ?, ?, ?, ?)`
  ).run(accountId, email, userId, hashedPassword, now, now);

  console.log(`Seeded demo user: ${email}`);
  console.log(`Password: ${password}`);
}

seed().catch(console.error);
