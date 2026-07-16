import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { db } from "../db.js";
import { parseJson } from "../bi/schema.js";
import { resolveCredentials } from "../settings.js";
import { buildSemanticContext } from "../semantic/manager.js";
import { logAudit } from "../governance/audit.js";

import "../bi/schema.js";

export interface DashboardWidget {
  id: string;
  type: "metric" | "chart" | "table" | "text";
  title: string;
  metric?: string;
  value?: string;
  change?: string;
  chartType?: "line" | "bar" | "area";
  data?: unknown[];
  content?: string;
  span?: number;
}

export interface DashboardPublic {
  id: string;
  title: string;
  description: string | null;
  prompt: string | null;
  layout: string[];
  widgets: DashboardWidget[];
  exportFormats: string[];
  createdAt: string;
  updatedAt: string;
}

interface DashboardRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  prompt: string | null;
  layout: string;
  widgets: string;
  export_formats: string;
  created_at: string;
  updated_at: string;
}

function toPublic(row: DashboardRow): DashboardPublic {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    prompt: row.prompt,
    layout: parseJson(row.layout, []),
    widgets: parseJson(row.widgets, []),
    exportFormats: parseJson(row.export_formats, ["react"]),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listDashboards(userId: string): DashboardPublic[] {
  return (db.prepare("SELECT * FROM dashboards WHERE user_id = ? ORDER BY updated_at DESC").all(userId) as DashboardRow[]).map(toPublic);
}

export function getDashboard(id: string, userId: string): DashboardPublic | undefined {
  const row = db.prepare("SELECT * FROM dashboards WHERE id = ? AND user_id = ?").get(id, userId) as DashboardRow | undefined;
  return row ? toPublic(row) : undefined;
}

export function deleteDashboard(id: string, userId: string): boolean {
  return db.prepare("DELETE FROM dashboards WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

const SAAS_DASHBOARD_TEMPLATE: DashboardWidget[] = [
  { id: "w1", type: "metric", title: "ARR", metric: "arr", value: "$2.4M", change: "↑12%", span: 1 },
  { id: "w2", type: "metric", title: "Pipeline", metric: "pipeline", value: "$780k", span: 1 },
  { id: "w3", type: "metric", title: "Churn", metric: "churn", value: "3.2%", change: "↓0.4%", span: 1 },
  { id: "w4", type: "metric", title: "CAC", metric: "cac", value: "$420", span: 1 },
  { id: "w5", type: "chart", title: "Revenue Trend", chartType: "line", span: 2 },
  { id: "w6", type: "chart", title: "Cohort Analysis", chartType: "bar", span: 2 },
  { id: "w7", type: "text", title: "Executive Summary", content: "Revenue growing 12% YoY driven by expansion revenue. Monitor enterprise churn in Q2.", span: 4 },
];

export async function generateDashboard(
  userId: string,
  prompt: string
): Promise<DashboardPublic> {
  const semanticContext = buildSemanticContext(userId);
  const credentials = resolveCredentials(userId);

  let widgets = SAAS_DASHBOARD_TEMPLATE;
  let title = "Executive Dashboard";
  let description = `Generated from: "${prompt}"`;

  if (credentials) {
    try {
      const client = new OpenAI({ apiKey: credentials.apiKey, baseURL: credentials.baseUrl });
      const response = await client.chat.completions.create({
        model: credentials.model,
        messages: [
          {
            role: "system",
            content: `Generate a BI dashboard spec as JSON: { "title": string, "description": string, "widgets": [{ "id": string, "type": "metric"|"chart"|"table"|"text", "title": string, "metric"?: string, "value"?: string, "change"?: string, "chartType"?: "line"|"bar"|"area", "content"?: string, "span"?: number }] }. Use semantic metrics. Include 4-8 widgets.`,
          },
          { role: "user", content: `${semanticContext}\n\nPrompt: ${prompt}` },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}") as {
        title?: string;
        description?: string;
        widgets?: DashboardWidget[];
      };
      if (parsed.widgets?.length) {
        widgets = parsed.widgets.map((w, i) => ({ ...w, id: w.id ?? `w${i + 1}` }));
        title = parsed.title ?? title;
        description = parsed.description ?? description;
      }
    } catch (error) {
      console.error("Dashboard generation AI failed, using template:", error);
    }
  }

  const id = randomUUID();
  const layout = ["metrics", "charts", "summary"];

  db.prepare(
    `INSERT INTO dashboards (id, user_id, title, description, prompt, layout, widgets, export_formats)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, title, description, prompt, JSON.stringify(layout), JSON.stringify(widgets), JSON.stringify(["react", "pdf", "slides", "iframe"]));

  logAudit(userId, {
    action: "dashboard_generated",
    resourceType: "dashboard",
    resourceId: id,
    resourceName: title,
    metadata: { prompt, widgetCount: widgets.length },
  });

  return getDashboard(id, userId)!;
}

export function exportDashboardSpec(dashboard: DashboardPublic, format: string): unknown {
  switch (format) {
    case "react":
      return {
        format: "react",
        component: "BuselligenceDashboard",
        props: { title: dashboard.title, widgets: dashboard.widgets },
        code: generateReactCode(dashboard),
      };
    case "pdf":
      return { format: "pdf", title: dashboard.title, sections: dashboard.widgets.map((w) => ({ title: w.title, content: w.value ?? w.content ?? "" })) };
    case "slides":
      return { format: "slides", slides: dashboard.widgets.map((w) => ({ title: w.title, body: w.value ?? w.content ?? w.title })) };
    case "iframe":
      return { format: "iframe", embedUrl: `/dashboards/${dashboard.id}/embed`, width: "100%", height: "600px" };
    default:
      return dashboard;
  }
}

function generateReactCode(dashboard: DashboardPublic): string {
  return `// Buselligence Dashboard: ${dashboard.title}
export function Dashboard() {
  return (
    <div className="grid grid-cols-4 gap-4 p-6">
${dashboard.widgets.map((w) =>
  w.type === "metric"
    ? `      <MetricCard title="${w.title}" value="${w.value ?? "—"}" change="${w.change ?? ""}" />`
    : w.type === "chart"
    ? `      <ChartCard title="${w.title}" type="${w.chartType ?? "line"}" />`
    : `      <TextCard title="${w.title}" content="${(w.content ?? "").replace(/"/g, '\\"')}" />`
).join("\n")}
    </div>
  );
}`;
}
