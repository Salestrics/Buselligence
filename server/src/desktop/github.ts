import { randomUUID } from "node:crypto";
import { decryptSecret, encryptSecret } from "../crypto.js";
import { db } from "../db.js";
import { assertSafeOutboundUrl } from "../security/url-policy.js";

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  org: string;
  description?: string;
  language?: string;
  defaultBranch: string;
}

export interface GitHubOrg {
  id: string;
  name: string;
  login: string;
}

export const DEMO_ORGS: GitHubOrg[] = [
  { id: "1", name: "Salestrics", login: "Salestrics" },
  { id: "2", name: "Personal", login: "personal" },
];

export const DEMO_REPOS: GitHubRepo[] = [
  {
    id: "r1",
    name: "sales-dashboard",
    fullName: "Salestrics/sales-dashboard",
    org: "Salestrics",
    description: "Sales analytics dashboard with AI insights",
    language: "TypeScript",
    defaultBranch: "main",
  },
  {
    id: "r2",
    name: "Buselligence",
    fullName: "Salestrics/Buselligence",
    org: "Salestrics",
    description: "Open-source AI runtime",
    language: "TypeScript",
    defaultBranch: "main",
  },
];

db.exec(`
  CREATE TABLE IF NOT EXISTS desktop_github_connections (
    user_id TEXT PRIMARY KEY,
    access_token_encrypted TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function githubOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function getGitHubAuthorizeUrl(userId: string): string | null {
  if (!githubOAuthConfigured()) return null;

  const state = encryptSecret(userId);
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.BETTER_AUTH_URL ?? "http://localhost:3001"}/api/desktop/github/callback`,
    scope: "read:user,repo",
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeGitHubCode(
  code: string,
  state: string
): Promise<{ userId: string; username: string; avatarUrl?: string } | null> {
  if (!githubOAuthConfigured()) return null;

  let userId: string;
  try {
    userId = decryptSecret(state);
  } catch {
    return null;
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) return null;

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!userRes.ok) return null;
  const user = (await userRes.json()) as { login: string; avatar_url?: string };

  db.prepare(
    `INSERT INTO desktop_github_connections (user_id, access_token_encrypted, username, avatar_url)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       access_token_encrypted = excluded.access_token_encrypted,
       username = excluded.username,
       avatar_url = excluded.avatar_url,
       updated_at = datetime('now')`
  ).run(userId, encryptSecret(tokenData.access_token), user.login, user.avatar_url ?? null);

  return { userId, username: user.login, avatarUrl: user.avatar_url };
}

function getStoredToken(userId: string): string | null {
  const row = db
    .prepare("SELECT access_token_encrypted FROM desktop_github_connections WHERE user_id = ?")
    .get(userId) as { access_token_encrypted: string } | undefined;
  if (!row) return null;
  try {
    return decryptSecret(row.access_token_encrypted);
  } catch {
    return null;
  }
}

export interface GitHubConnection {
  connected: boolean;
  username: string;
  avatarUrl?: string;
  demoMode: boolean;
}

export function getGitHubConnection(userId: string): GitHubConnection {
  const row = db
    .prepare("SELECT username, avatar_url FROM desktop_github_connections WHERE user_id = ?")
    .get(userId) as { username: string; avatar_url: string | null } | undefined;

  if (row) {
    return {
      connected: true,
      username: row.username,
      avatarUrl: row.avatar_url ?? undefined,
      demoMode: false,
    };
  }

  if (!githubOAuthConfigured()) {
    return {
      connected: false,
      username: "demo-developer",
      avatarUrl: "https://github.com/identicons/demo.png",
      demoMode: true,
    };
  }

  return {
    connected: false,
    username: "",
    demoMode: false,
  };
}

export async function listOrgs(userId: string): Promise<GitHubOrg[]> {
  const token = getStoredToken(userId);
  if (!token) return DEMO_ORGS;

  const res = await fetch("https://api.github.com/user/orgs", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return [];

  const orgs = (await res.json()) as Array<{ id: number; login: string }>;
  return orgs.map((org) => ({
    id: String(org.id),
    name: org.login,
    login: org.login,
  }));
}

export async function listRepos(userId: string, org?: string): Promise<GitHubRepo[]> {
  const token = getStoredToken(userId);
  if (!token) {
    if (!org) return DEMO_REPOS;
    return DEMO_REPOS.filter((r) => r.org === org);
  }

  const url = org
    ? `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?per_page=50`
    : "https://api.github.com/user/repos?per_page=50";

  assertSafeOutboundUrl(url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return [];

  const repos = (await res.json()) as Array<{
    id: number;
    name: string;
    full_name: string;
    description?: string;
    language?: string;
    default_branch: string;
    owner: { login: string };
  }>;

  return repos.map((repo) => ({
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    org: repo.owner.login,
    description: repo.description ?? undefined,
    language: repo.language ?? undefined,
    defaultBranch: repo.default_branch,
  }));
}

export function getRepo(userId: string, fullName: string): GitHubRepo | null {
  const token = getStoredToken(userId);
  if (!token) {
    return DEMO_REPOS.find((r) => r.fullName === fullName || r.name === fullName) ?? null;
  }

  return null;
}
