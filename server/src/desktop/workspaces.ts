import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import { detectStack, scanProject, type ProjectIntelligence } from "./scanner.js";
import { getRepo } from "./github.js";

export interface DesktopWorkspace {
  id: string;
  name: string;
  repoUrl?: string;
  repoName?: string;
  localPath?: string;
  stack: string[];
  status: "provisioning" | "running" | "stopped" | "error";
  framework?: string;
  intelligence: ProjectIntelligence;
  githubOrg?: string;
  createdAt: string;
}

function mapWorkspace(row: {
  id: string;
  name: string;
  repo_url: string | null;
  repo_name: string | null;
  local_path: string | null;
  stack: string;
  status: string;
  framework: string | null;
  intelligence: string;
  github_org: string | null;
  created_at: string;
}): DesktopWorkspace {
  return {
    id: row.id,
    name: row.name,
    repoUrl: row.repo_url ?? undefined,
    repoName: row.repo_name ?? undefined,
    localPath: row.local_path ?? undefined,
    stack: parseJson<string[]>(row.stack, []),
    status: row.status as DesktopWorkspace["status"],
    framework: row.framework ?? undefined,
    intelligence: parseJson<ProjectIntelligence>(row.intelligence, {
      framework: "Unknown",
      language: "TypeScript",
      database: "PostgreSQL",
      architecture: "Full-stack",
      entryPoints: 0,
      importantFiles: 0,
      packageManager: "npm",
      detected: [],
    }),
    githubOrg: row.github_org ?? undefined,
    createdAt: row.created_at,
  };
}

export function listWorkspaces(userId: string): DesktopWorkspace[] {
  const rows = db
    .prepare("SELECT * FROM desktop_workspaces WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId) as Parameters<typeof mapWorkspace>[0][];
  return rows.map(mapWorkspace);
}

export function getWorkspace(userId: string, id: string): DesktopWorkspace | null {
  const row = db
    .prepare("SELECT * FROM desktop_workspaces WHERE id = ? AND user_id = ?")
    .get(id, userId) as Parameters<typeof mapWorkspace>[0] | undefined;
  return row ? mapWorkspace(row) : null;
}

export interface ProvisionResult {
  workspace: DesktopWorkspace;
  steps: Array<{ step: string; status: "ok" | "running" }>;
}

export function provisionWorkspace(
  userId: string,
  repoFullName: string
): ProvisionResult {
  const repo = getRepo(repoFullName);
  const repoName = repo?.name ?? repoFullName.split("/").pop() ?? "workspace";
  const stackDetect = detectStack(repoName);
  const intelligence = scanProject(repoName, stackDetect.items);

  const id = randomUUID();
  const localPath = `~/buselligence/workspaces/${repoName}`;

  db.prepare(
    `INSERT INTO desktop_workspaces (id, user_id, name, repo_url, repo_name, local_path, stack, status, framework, intelligence, github_org)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'provisioning', ?, ?, ?)`
  ).run(
    id,
    userId,
    repoName,
    `https://github.com/${repo?.fullName ?? repoFullName}`,
    repoName,
    localPath,
    JSON.stringify(stackDetect.items),
    intelligence.framework,
    JSON.stringify(intelligence),
    repo?.org ?? null
  );

  const steps = [
    { step: `Cloning ${repoFullName}`, status: "ok" as const },
    { step: `Installing dependencies (${stackDetect.packageManager})`, status: "ok" as const },
    { step: "Configuring environment", status: "ok" as const },
    { step: `Detected: ${stackDetect.items.join(", ")}`, status: "ok" as const },
    { step: "Creating AI context", status: "ok" as const },
    { step: "Starting runtime", status: "ok" as const },
  ];

  db.prepare(
    "UPDATE desktop_workspaces SET status = 'running', updated_at = datetime('now') WHERE id = ?"
  ).run(id);

  return {
    workspace: getWorkspace(userId, id)!,
    steps,
  };
}

export function setWorkspaceStatus(
  userId: string,
  id: string,
  status: DesktopWorkspace["status"]
): DesktopWorkspace | null {
  db.prepare(
    "UPDATE desktop_workspaces SET status = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
  ).run(status, id, userId);
  return getWorkspace(userId, id);
}

export function seedDemoWorkspaces(userId: string): void {
  const existing = listWorkspaces(userId);
  if (existing.length > 0) return;

  provisionWorkspace(userId, "Salestrics/Buselligence");
  const ws = listWorkspaces(userId)[0];
  if (ws) {
    db.prepare("UPDATE desktop_workspaces SET name = 'Salestrics' WHERE id = ?").run(ws.id);
  }

  const id2 = randomUUID();
  const intel = scanProject("sales-dashboard", ["React", "TypeScript", "Node.js", "PostgreSQL"]);
  db.prepare(
    `INSERT INTO desktop_workspaces (id, user_id, name, repo_name, stack, status, framework, intelligence, github_org)
     VALUES (?, ?, 'Client Project', 'sales-dashboard', ?, 'stopped', ?, ?, 'Salestrics')`
  ).run(id2, userId, JSON.stringify(intel.detected), intel.framework, JSON.stringify(intel));
}
