import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";

export interface EvaluationResult {
  id: string;
  agentSlug: string;
  task: string;
  score: number;
  issues: string[];
  metrics: {
    accuracy: number;
    cost: number;
    speed: number;
    reliability: number;
    toolUsage: number;
  };
}

export function runEvaluation(
  userId: string,
  agentSlug: string,
  task: string
): EvaluationResult {
  const lower = task.toLowerCase();
  let score = 85 + Math.floor(Math.random() * 10);
  const issues: string[] = [];

  if (lower.includes("rest api") || lower.includes("api")) {
    score = 92;
    issues.push("Missing validation on POST endpoints");
    issues.push("Poor error handling on 500 responses");
  } else if (lower.includes("security")) {
    score = 88;
    issues.push("One dependency with known CVE (low severity)");
  } else if (lower.includes("dashboard")) {
    score = 90;
    issues.push("Mobile responsiveness could be improved");
  }

  const metrics = {
    accuracy: score,
    cost: 78 + Math.floor(Math.random() * 15),
    speed: 85 + Math.floor(Math.random() * 10),
    reliability: 90 + Math.floor(Math.random() * 8),
    toolUsage: 82 + Math.floor(Math.random() * 15),
  };

  const id = randomUUID();
  db.prepare(
    `INSERT INTO kernel_evaluations (id, user_id, agent_slug, task, score, issues, metrics)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, agentSlug, task, score, JSON.stringify(issues), JSON.stringify(metrics));

  return { id, agentSlug, task, score, issues, metrics };
}

export function listEvaluations(userId: string): EvaluationResult[] {
  const rows = db
    .prepare("SELECT * FROM kernel_evaluations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(userId) as Array<{
    id: string;
    agent_slug: string;
    task: string;
    score: number;
    issues: string;
    metrics: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    agentSlug: r.agent_slug,
    task: r.task,
    score: r.score,
    issues: parseJson<string[]>(r.issues, []),
    metrics: parseJson<EvaluationResult["metrics"]>(r.metrics, {
      accuracy: 0,
      cost: 0,
      speed: 0,
      reliability: 0,
      toolUsage: 0,
    }),
  }));
}

export function getBenchmarks(): Array<{ name: string; description: string; tasks: string[] }> {
  return [
    {
      name: "API Generation",
      description: "Generate REST API from schema",
      tasks: ["Generate REST API", "Add validation", "Error handling"],
    },
    {
      name: "Security Review",
      description: "Scan codebase for vulnerabilities",
      tasks: ["Review security", "Scan dependencies", "Check OWASP"],
    },
    {
      name: "Data Analysis",
      description: "Analyze business metrics",
      tasks: ["Analyze revenue trends", "Generate SQL report"],
    },
  ];
}
