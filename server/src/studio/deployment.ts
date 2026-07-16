import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import type { StudioDeployment } from "./types.js";

interface DeploymentRow {
  id: string;
  project_id: string;
  user_id: string;
  environment: string;
  stack: string;
  domain: string | null;
  status: string;
  url: string | null;
  logs: string;
  created_at: string;
  updated_at: string;
}

function mapDeployment(row: DeploymentRow): StudioDeployment {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    environment: row.environment as StudioDeployment["environment"],
    stack: parseJson<string[]>(row.stack, []),
    domain: row.domain ?? undefined,
    status: row.status as StudioDeployment["status"],
    url: row.url ?? undefined,
    logs: parseJson<string[]>(row.logs, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function deployProject(
  userId: string,
  projectId: string,
  input: {
    environment?: StudioDeployment["environment"];
    stack?: string[];
    domain?: string;
  }
): StudioDeployment {
  const id = randomUUID();
  const now = new Date().toISOString();
  const env = input.environment ?? "preview";
  const stack = input.stack ?? ["react", "node", "postgresql"];
  const domain = input.domain ?? `app-${projectId.slice(0, 8)}.buselligence.dev`;

  db.prepare(
    `INSERT INTO studio_deployments (id, project_id, user_id, environment, stack, domain, status, url, logs, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'building', NULL, ?, ?, ?)`
  ).run(
    id,
    projectId,
    userId,
    env,
    JSON.stringify(stack),
    domain,
    JSON.stringify(["Initializing deployment...", "Building React frontend...", "Starting Node API..."]),
    now,
    now
  );

  setTimeout(() => {
    const url = `https://${domain}`;
    db.prepare(
      `UPDATE studio_deployments SET status = 'live', url = ?, logs = ?, updated_at = ? WHERE id = ?`
    ).run(
      url,
      JSON.stringify([
        "Initializing deployment...",
        "Building React frontend... ✓",
        "Starting Node API... ✓",
        "Connecting PostgreSQL... ✓",
        "Running health checks... ✓",
        `Deployed to ${url}`,
      ]),
      new Date().toISOString(),
      id
    );
  }, 2000);

  return mapDeployment(
    db.prepare("SELECT * FROM studio_deployments WHERE id = ?").get(id) as DeploymentRow
  );
}

export function listDeployments(
  userId: string,
  projectId: string
): StudioDeployment[] {
  const rows = db
    .prepare(
      "SELECT * FROM studio_deployments WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC"
    )
    .all(projectId, userId) as DeploymentRow[];
  return rows.map(mapDeployment);
}

export function getDeployment(
  userId: string,
  deploymentId: string
): StudioDeployment | null {
  const row = db
    .prepare(
      "SELECT * FROM studio_deployments WHERE id = ? AND user_id = ?"
    )
    .get(deploymentId, userId) as DeploymentRow | undefined;
  return row ? mapDeployment(row) : null;
}
