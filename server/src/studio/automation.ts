import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import type { AutomationStep, StudioAutomation } from "./types.js";

interface AutomationRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: string;
  steps: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

function mapAutomation(row: AutomationRow): StudioAutomation {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    triggerType: row.trigger_type as StudioAutomation["triggerType"],
    triggerConfig: parseJson<Record<string, unknown>>(row.trigger_config, {}),
    steps: parseJson<AutomationStep[]>(row.steps, []),
    enabled: row.enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listAutomations(userId: string): StudioAutomation[] {
  const rows = db
    .prepare(
      "SELECT * FROM studio_automations WHERE user_id = ? ORDER BY updated_at DESC"
    )
    .all(userId) as AutomationRow[];
  return rows.map(mapAutomation);
}

export function createAutomation(
  userId: string,
  input: {
    name: string;
    description?: string;
    triggerType: StudioAutomation["triggerType"];
    triggerConfig?: Record<string, unknown>;
    steps?: AutomationStep[];
  }
): StudioAutomation {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO studio_automations (id, user_id, name, description, trigger_type, trigger_config, steps, enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(
    id,
    userId,
    input.name,
    input.description ?? null,
    input.triggerType,
    JSON.stringify(input.triggerConfig ?? {}),
    JSON.stringify(input.steps ?? []),
    now,
    now
  );
  return mapAutomation(
    db.prepare("SELECT * FROM studio_automations WHERE id = ?").get(id) as AutomationRow
  );
}

export function deleteAutomation(userId: string, id: string): boolean {
  const result = db
    .prepare("DELETE FROM studio_automations WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return result.changes > 0;
}

export function getAutomationTemplate(
  type: "salesforce_lead" | "cron" | "webhook"
): StudioAutomation {
  const templates: Record<string, StudioAutomation> = {
    salesforce_lead: {
      id: "template",
      userId: "",
      name: "New Lead → Opportunity",
      description: "When a new Salesforce lead arrives, analyze and create opportunity",
      triggerType: "salesforce_lead",
      triggerConfig: { event: "new_lead", source: "salesforce" },
      steps: [
        { id: "1", type: "ai_agent", label: "Analyze company", config: { agent: "sales_analyst" } },
        { id: "2", type: "action", label: "Create opportunity", config: { system: "salesforce" } },
        { id: "3", type: "notification", label: "Notify team", config: { channels: ["slack", "email"] } },
      ],
      enabled: true,
      createdAt: "",
      updatedAt: "",
    },
    cron: {
      id: "template",
      userId: "",
      name: "Weekly Revenue Briefing",
      triggerType: "cron",
      triggerConfig: { schedule: "0 8 * * 1", timezone: "UTC" },
      steps: [
        { id: "1", type: "query", label: "Pull revenue data", config: { metric: "revenue" } },
        { id: "2", type: "ai_agent", label: "Generate briefing", config: { agent: "financial_analyst" } },
        { id: "3", type: "notification", label: "Send briefing", config: { channels: ["email"] } },
      ],
      enabled: true,
      createdAt: "",
      updatedAt: "",
    },
    webhook: {
      id: "template",
      userId: "",
      name: "Stripe Payment Alert",
      triggerType: "webhook",
      triggerConfig: { url: "/webhooks/stripe", events: ["payment.failed"] },
      steps: [
        { id: "1", type: "ai_agent", label: "Assess risk", config: { agent: "financial_analyst" } },
        { id: "2", type: "notification", label: "Alert finance", config: { channels: ["slack"] } },
      ],
      enabled: true,
      createdAt: "",
      updatedAt: "",
    },
  };
  return templates[type] ?? templates.salesforce_lead!;
}
