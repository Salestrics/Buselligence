import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { db } from "../db.js";
import { parseJson } from "../bi/schema.js";
import { resolveCredentials } from "../settings.js";
import { buildSemanticContext } from "../semantic/manager.js";
import { getConnectorSourceNames } from "../connectors/manager.js";
import { logAudit } from "../governance/audit.js";

import "../bi/schema.js";

export interface ScheduledJobPublic {
  id: string;
  name: string;
  cronExpression: string;
  jobType: string;
  config: Record<string, unknown>;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunResult: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BriefingPublic {
  id: string;
  jobId: string | null;
  title: string;
  content: string;
  summary: string | null;
  metricsSnapshot: Record<string, unknown>;
  createdAt: string;
}

interface JobRow {
  id: string; user_id: string; name: string; cron_expression: string;
  job_type: string; config: string; enabled: number;
  last_run_at: string | null; last_run_result: string | null; next_run_at: string | null;
  created_at: string; updated_at: string;
}

function jobToPublic(row: JobRow): ScheduledJobPublic {
  return {
    id: row.id, name: row.name, cronExpression: row.cron_expression,
    jobType: row.job_type, config: parseJson(row.config, {}),
    enabled: row.enabled === 1,
    lastRunAt: row.last_run_at, lastRunResult: row.last_run_result,
    nextRunAt: row.next_run_at,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function listScheduledJobs(userId: string): ScheduledJobPublic[] {
  return (db.prepare("SELECT * FROM scheduled_jobs WHERE user_id = ? ORDER BY created_at DESC").all(userId) as JobRow[]).map(jobToPublic);
}

export function createScheduledJob(
  userId: string,
  input: { name: string; cronExpression?: string; jobType?: string; config?: Record<string, unknown> }
): ScheduledJobPublic {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO scheduled_jobs (id, user_id, name, cron_expression, job_type, config) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, userId, input.name, input.cronExpression ?? "0 8 * * 1", input.jobType ?? "weekly_briefing", JSON.stringify(input.config ?? {}));
  return jobToPublic(db.prepare("SELECT * FROM scheduled_jobs WHERE id = ?").get(id) as JobRow);
}

export function deleteScheduledJob(id: string, userId: string): boolean {
  return db.prepare("DELETE FROM scheduled_jobs WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

export function listBriefings(userId: string, limit = 20): BriefingPublic[] {
  const rows = db.prepare("SELECT * FROM intelligence_briefings WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit) as Array<{
    id: string; user_id: string; job_id: string | null; title: string; content: string;
    summary: string | null; metrics_snapshot: string; created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id, jobId: r.job_id, title: r.title, content: r.content,
    summary: r.summary, metricsSnapshot: parseJson(r.metrics_snapshot, {}),
    createdAt: r.created_at,
  }));
}

export async function generateBriefing(
  userId: string,
  jobId?: string
): Promise<BriefingPublic> {
  const semanticContext = buildSemanticContext(userId);
  const connectors = getConnectorSourceNames(userId);
  const credentials = resolveCredentials(userId);

  const dataSources = connectors.length ? connectors : ["semantic_layer (definitions only)"];

  let title = "Weekly Revenue Briefing";
  let content = `## Weekly Intelligence Briefing\n\n**Revenue movement:** Review connected data sources for period-over-period changes.\n\n**Pipeline changes:** Check open opportunities and stage transitions.\n\n**Risks:** Monitor churn metrics and enterprise account health.\n\n**Opportunities:** Identify expansion candidates and pipeline acceleration.\n\n**Recommended actions:**\n1. Review top 3 churned accounts\n2. Validate pipeline coverage ratio\n3. Check NRR trend vs target`;
  let summary = "Briefing generated. Connect data sources for live metrics.";

  if (credentials) {
    try {
      const client = new OpenAI({ apiKey: credentials.apiKey, baseURL: credentials.baseUrl });
      const response = await client.chat.completions.create({
        model: credentials.model,
        messages: [
          {
            role: "system",
            content: "Generate an executive intelligence briefing. Include: Revenue movement, Pipeline changes, Risks, Opportunities, Recommended actions. Be specific and actionable. Use markdown.",
          },
          {
            role: "user",
            content: `${semanticContext}\n\nData sources available: ${dataSources.join(", ")}\n\nGenerate the weekly executive briefing.`,
          },
        ],
        temperature: 0.4,
      });
      content = response.choices[0]?.message?.content ?? content;
      summary = content.split("\n").find((l) => l.trim() && !l.startsWith("#"))?.slice(0, 200) ?? summary;
      title = "Weekly Intelligence Briefing";
    } catch (error) {
      console.error("Briefing generation failed:", error);
    }
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO intelligence_briefings (id, user_id, job_id, title, content, summary, metrics_snapshot) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, jobId ?? null, title, content, summary, JSON.stringify({ generatedAt: new Date().toISOString() }));

  if (jobId) {
    db.prepare("UPDATE scheduled_jobs SET last_run_at=datetime('now'), last_run_result=?, updated_at=datetime('now') WHERE id=? AND user_id=?")
      .run("success", jobId, userId);
  }

  logAudit(userId, {
    action: "briefing_generated",
    resourceType: "briefing",
    resourceId: id,
    resourceName: title,
    dataSources,
    metadata: { jobId },
  });

  return listBriefings(userId, 1)[0]!;
}

export async function runDueJobs(): Promise<number> {
  const jobs = db.prepare("SELECT * FROM scheduled_jobs WHERE enabled = 1").all() as JobRow[];
  let ran = 0;
  for (const job of jobs) {
    await generateBriefing(job.user_id, job.id);
    ran++;
  }
  return ran;
}
