import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import { storeMemory } from "./runtime.js";

export interface ManagedProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: "planning" | "executing" | "completed" | "paused";
  plan: ProjectPlan;
  sprints: Sprint[];
  progress: number;
  createdAt: string;
}

export interface ProjectPlan {
  requirements: string[];
  architecture: string[];
  database: string[];
  ui: string[];
  tasks: string[];
}

export interface Sprint {
  number: number;
  name: string;
  tasks: string[];
  status: "pending" | "active" | "completed";
}

export interface ProjectTask {
  id: string;
  projectId: string;
  sprint: number;
  title: string;
  status: string;
  assignee?: string;
}

function mapProject(row: {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  plan: string;
  sprints: string;
  progress: number;
  created_at: string;
}): ManagedProject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status as ManagedProject["status"],
    plan: parseJson<ProjectPlan>(row.plan, {
      requirements: [],
      architecture: [],
      database: [],
      ui: [],
      tasks: [],
    }),
    sprints: parseJson<Sprint[]>(row.sprints, []),
    progress: row.progress,
    createdAt: row.created_at,
  };
}

export function createManagedProject(
  userId: string,
  prompt: string
): ManagedProject {
  const lower = prompt.toLowerCase();
  const isCrm = lower.includes("crm") || lower.includes("saas");

  const plan: ProjectPlan = {
    requirements: [
      "Requirements gathered from user prompt",
      isCrm ? "Multi-tenant organization support" : "Core feature set defined",
      "User roles and permissions mapped",
    ],
    architecture: [
      "React frontend + Node API + PostgreSQL",
      isCrm ? "Multi-tenant data isolation layer" : "Modular service architecture",
      "REST API with authentication middleware",
    ],
    database: [
      isCrm ? "users, organizations, contacts, deals, activities" : "users, records, settings",
      "Audit log and permissions tables",
      "Indexed foreign keys for performance",
    ],
    ui: [
      "Dashboard with key metrics",
      isCrm ? "Contacts, Deals, Pipeline views" : "Data management views",
      "Settings and user management",
    ],
    tasks: [],
  };

  const sprints: Sprint[] = isCrm
    ? [
        { number: 1, name: "Foundation", tasks: ["Auth system", "Database schema", "Dashboard"], status: "pending" },
        { number: 2, name: "CRM Modules", tasks: ["Contacts module", "Deals pipeline", "Automations"], status: "pending" },
        { number: 3, name: "Ship", tasks: ["Testing", "Security review", "Deployment"], status: "pending" },
      ]
    : [
        { number: 1, name: "Sprint 1", tasks: ["Setup", "Core features", "UI"], status: "pending" },
        { number: 2, name: "Sprint 2", tasks: ["Integrations", "Automations"], status: "pending" },
        { number: 3, name: "Sprint 3", tasks: ["Testing", "Deployment"], status: "pending" },
      ];

  for (const sprint of sprints) {
    plan.tasks.push(...sprint.tasks);
  }

  const id = randomUUID();
  const name = extractProjectName(prompt);

  db.prepare(
    `INSERT INTO core_projects (id, user_id, name, description, status, plan, sprints, progress)
     VALUES (?, ?, ?, ?, 'planning', ?, ?, 0)`
  ).run(id, userId, name, prompt, JSON.stringify(plan), JSON.stringify(sprints));

  for (const sprint of sprints) {
    for (const task of sprint.tasks) {
      db.prepare(
        `INSERT INTO core_tasks (id, project_id, user_id, sprint, title, status, assignee)
         VALUES (?, ?, ?, ?, ?, 'pending', 'AI Team')`
      ).run(randomUUID(), id, userId, sprint.number, task);
    }
  }

  storeMemory(userId, `project:${name}`, `Created from: ${prompt}`, "decision", id);
  db.prepare(
    `INSERT INTO core_decisions (id, user_id, project_id, decision, rationale, impact)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    userId,
    id,
    `Project plan created: ${name}`,
    "Autonomous project manager analyzed requirements and generated sprint plan",
    JSON.stringify(["architecture", "database", "ui", "sprints"])
  );

  return mapProject(
    db.prepare("SELECT * FROM core_projects WHERE id = ?").get(id) as Parameters<typeof mapProject>[0]
  );
}

export function listManagedProjects(userId: string): ManagedProject[] {
  const rows = db
    .prepare("SELECT * FROM core_projects WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as Parameters<typeof mapProject>[0][];
  return rows.map(mapProject);
}

export function getManagedProject(userId: string, projectId: string): ManagedProject | null {
  const row = db
    .prepare("SELECT * FROM core_projects WHERE id = ? AND user_id = ?")
    .get(projectId, userId) as Parameters<typeof mapProject>[0] | undefined;
  return row ? mapProject(row) : null;
}

export function listProjectTasks(userId: string, projectId: string): ProjectTask[] {
  const rows = db
    .prepare(
      "SELECT * FROM core_tasks WHERE project_id = ? AND user_id = ? ORDER BY sprint, created_at"
    )
    .all(projectId, userId) as Array<{
    id: string;
    project_id: string;
    sprint: number;
    title: string;
    status: string;
    assignee: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    sprint: r.sprint,
    title: r.title,
    status: r.status,
    assignee: r.assignee ?? undefined,
  }));
}

export function executeProject(userId: string, projectId: string): ManagedProject | null {
  const project = getManagedProject(userId, projectId);
  if (!project) return null;

  db.prepare(
    "UPDATE core_projects SET status = 'executing', progress = 10, updated_at = datetime('now') WHERE id = ?"
  ).run(projectId);

  const firstSprint = project.sprints[0];
  if (firstSprint) {
    db.prepare(
      "UPDATE core_tasks SET status = 'in_progress' WHERE project_id = ? AND sprint = ? AND title = ?"
    ).run(projectId, firstSprint.number, firstSprint.tasks[0]);
  }

  return getManagedProject(userId, projectId);
}

function extractProjectName(prompt: string): string {
  const match = prompt.match(/(?:build|create)\s+(?:a\s+)?(.+?)(?:\s+for|\s*$)/i);
  return match?.[1]?.trim() ?? "New Project";
}
