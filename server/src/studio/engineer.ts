import { buildSemanticContext } from "../semantic/manager.js";
import { listConnectors } from "../connectors/manager.js";
import { listFiles } from "./manager.js";
import { completeWithOptionalCredentials } from "../llm/complete.js";
import type { FileLanguage } from "./types.js";

export const SOFTWARE_ENGINEER_PROMPT = `You are the Buselligence AI Software Engineer — a development agent that understands business context, database schemas, APIs, existing code, MCP tools, and user requirements.

Your capabilities:
1. Analyze available data sources and semantic layer metrics
2. Create SQL queries aligned with business rules
3. Generate React/TypeScript components and dashboards
4. Build API endpoints and database schemas
5. Create automation workflows
6. Prepare deployment-ready code

When building:
- Use the semantic layer metric definitions
- Apply business rules (exclude test accounts, etc.)
- Generate production-quality TypeScript/React code
- Include proper types and error handling
- Structure projects: src/, components/, queries/, workflows/
- Always explain what you built and why

Output format for code changes:
\`\`\`file:path/to/file.tsx
// code here
\`\`\``;

export interface EngineerPlan {
  summary: string;
  steps: string[];
  files: Array<{ path: string; content: string; language: FileLanguage }>;
  sqlQueries: string[];
  apis: string[];
  simulated?: boolean;
  provider?: string;
  model?: string;
}

export function buildEngineerContext(
  userId: string,
  projectId: string,
  requirement: string
): string {
  const semantic = buildSemanticContext(userId);
  const connectors = listConnectors(userId);
  const files = listFiles(userId, projectId);

  return [
    SOFTWARE_ENGINEER_PROMPT,
    "",
    `## User Requirement`,
    requirement,
    "",
    `## Semantic Layer`,
    semantic,
    "",
    `## Connected Data Sources`,
    connectors.length
      ? connectors.map((c) => `- ${c.name} (${c.connectorType})`).join("\n")
      : "No connectors configured",
    "",
    `## Existing Project Files`,
    files.map((f) => `- ${f.path} (${f.language})`).join("\n") || "Empty project",
  ].join("\n");
}

export function generateEngineerPlan(requirement: string): EngineerPlan {
  const lower = requirement.toLowerCase();
  const isChurn = lower.includes("churn");
  const isDashboard = lower.includes("dashboard");
  const isOnboarding = lower.includes("onboarding");

  if (isChurn && isDashboard) {
    return {
      summary: "Customer churn prediction dashboard with ML scoring and executive views",
      steps: [
        "Analyze Stripe subscriptions and Salesforce accounts",
        "Create churn feature SQL queries",
        "Build churn risk scoring model",
        "Generate React dashboard with cohort analysis",
        "Create API endpoints for real-time scores",
        "Deploy preview",
      ],
      files: [
        {
          path: "queries/churn_features.sql",
          content: `SELECT
  c.id,
  c.company,
  c.mrr,
  DATEDIFF('day', c.last_login, CURRENT_DATE) AS days_inactive,
  s.support_tickets_30d,
  CASE WHEN c.mrr > 10000 THEN 'enterprise' ELSE 'smb' END AS segment
FROM customers c
LEFT JOIN support_metrics s ON s.customer_id = c.id
WHERE c.is_test = false;`,
          language: "sql",
        },
        {
          path: "src/components/ChurnDashboard.tsx",
          content: `import React from "react";

interface ChurnMetrics {
  atRiskCount: number;
  atRiskArr: number;
  churnRate: number;
  topRisks: Array<{ company: string; arr: number; score: number }>;
}

export function ChurnDashboard({ metrics }: { metrics: ChurnMetrics }) {
  return (
    <div className="grid gap-6 p-6">
      <h1 className="text-2xl font-bold">Churn Prediction Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="At-Risk Accounts" value={metrics.atRiskCount} />
        <MetricCard label="At-Risk ARR" value={\`$\${(metrics.atRiskArr / 1000).toFixed(0)}k\`} />
        <MetricCard label="Churn Rate" value={\`\${metrics.churnRate}%\`} />
      </div>
      <RiskTable risks={metrics.topRisks} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function RiskTable({ risks }: { risks: ChurnMetrics["topRisks"] }) {
  return (
    <table className="w-full">
      <thead><tr><th>Company</th><th>ARR</th><th>Risk Score</th></tr></thead>
      <tbody>
        {risks.map((r) => (
          <tr key={r.company}><td>{r.company}</td><td>\${r.arr}</td><td>{r.score}%</td></tr>
        ))}
      </tbody>
    </table>
  );
}`,
          language: "typescript",
        },
        {
          path: "src/api/churn.ts",
          content: `import { Router } from "express";

const router = Router();

router.get("/api/churn/metrics", async (_req, res) => {
  // Query churn_features.sql and score model
  res.json({
    atRiskCount: 12,
    atRiskArr: 142000,
    churnRate: 3.2,
    topRisks: [
      { company: "Acme Corp", arr: 48000, score: 87 },
      { company: "Globex", arr: 52000, score: 82 },
      { company: "Initech", arr: 42000, score: 79 },
    ],
  });
});

export default router;`,
          language: "typescript",
        },
      ],
      sqlQueries: ["queries/churn_features.sql"],
      apis: ["/api/churn/metrics"],
    };
  }

  if (isOnboarding) {
    return {
      summary: "Customer onboarding tracker app with dashboard, tasks, and reports",
      steps: [
        "Design database schema (customers, onboarding_steps, users)",
        "Create React pages: Dashboard, Customers, Tasks, Reports",
        "Set up role-based permissions (Admin, Manager, Viewer)",
        "Build API layer with authentication",
        "Generate deployment package",
      ],
      files: [
        {
          path: "schema/onboarding.sql",
          content: `CREATE TABLE customers (
  id UUID PRIMARY KEY,
  company TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_steps (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  step_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  assigned_to UUID,
  due_date DATE
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'viewer'))
);`,
          language: "sql",
        },
        {
          path: "src/pages/Customers.tsx",
          content: `export function CustomersPage() {
  return <div><h1>Customers</h1><CustomerList /></div>;
}`,
          language: "typescript",
        },
      ],
      sqlQueries: ["schema/onboarding.sql"],
      apis: ["/api/customers", "/api/onboarding-steps"],
    };
  }

  return {
    summary: `Build: ${requirement}`,
    steps: [
      "Analyze available data and semantic layer",
      "Create SQL queries",
      "Generate React components",
      "Create API endpoints",
      "Deploy preview",
    ],
    files: [
      {
        path: "src/components/GeneratedView.tsx",
        content: `// Generated for: ${requirement}\nexport function GeneratedView() {\n  return <div>Generated view</div>;\n}`,
        language: "typescript",
      },
    ],
    sqlQueries: [],
    apis: [],
    simulated: true,
  };
}

export async function generateEngineerPlanWithLlm(
  userId: string,
  projectId: string,
  requirement: string
): Promise<EngineerPlan> {
  const context = buildEngineerContext(userId, projectId, requirement);
  const template = generateEngineerPlan(requirement);

  const llm = await completeWithOptionalCredentials(
    userId,
    context,
    `Create an implementation plan for: ${requirement}\nReturn JSON with keys summary, steps (array), files (array of {path, content, language}).`,
    () => template.summary
  );

  if (llm.simulated) {
    return { ...template, simulated: true };
  }

  try {
    const parsed = JSON.parse(llm.text) as Partial<EngineerPlan>;
    if (parsed.files?.length) {
      return {
        summary: parsed.summary ?? template.summary,
        steps: parsed.steps ?? template.steps,
        files: parsed.files.map((file) => ({
          path: file.path,
          content: file.content,
          language: (file.language ?? "typescript") as FileLanguage,
        })),
        sqlQueries: parsed.sqlQueries ?? template.sqlQueries,
        apis: parsed.apis ?? template.apis,
        simulated: false,
        provider: llm.provider,
        model: llm.model,
      };
    }
  } catch {
    // fall through to template
  }

  return {
    ...template,
    summary: llm.text.split("\n")[0] ?? template.summary,
    simulated: false,
    provider: llm.provider,
    model: llm.model,
  };
}
