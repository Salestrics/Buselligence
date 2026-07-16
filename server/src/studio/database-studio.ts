import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";

export interface QueryHistoryEntry {
  id: string;
  query: string;
  connectorId?: string;
  durationMs?: number;
  rowsReturned?: number;
  status: string;
  explainPlan?: string;
  createdAt: string;
}

export interface SchemaTable {
  name: string;
  columns: Array<{ name: string; type: string }>;
}

const DEMO_SCHEMA: SchemaTable[] = [
  {
    name: "customers",
    columns: [
      { name: "id", type: "uuid" },
      { name: "company", type: "text" },
      { name: "revenue", type: "decimal" },
      { name: "employees", type: "int" },
      { name: "is_test", type: "boolean" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "orders",
    columns: [
      { name: "id", type: "uuid" },
      { name: "customer_id", type: "uuid" },
      { name: "amount", type: "decimal" },
      { name: "status", type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "subscriptions",
    columns: [
      { name: "id", type: "uuid" },
      { name: "customer_id", type: "uuid" },
      { name: "plan", type: "text" },
      { name: "mrr", type: "decimal" },
      { name: "status", type: "text" },
    ],
  },
];

export function getSchemaExplorer(): SchemaTable[] {
  return DEMO_SCHEMA;
}

export function generateQuery(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("monthly revenue") || lower.includes("revenue report")) {
    return `SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(amount) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY 1
ORDER BY 1;`;
  }
  if (lower.includes("churn")) {
    return `SELECT
  c.company,
  c.revenue,
  s.status,
  s.mrr
FROM customers c
JOIN subscriptions s ON s.customer_id = c.id
WHERE s.status = 'churned'
  AND c.is_test = false
ORDER BY c.revenue DESC;`;
  }
  if (lower.includes("enterprise")) {
    return `SELECT company, revenue, employees
FROM customers
WHERE employees > 500
  AND is_test = false
ORDER BY revenue DESC;`;
  }
  return `SELECT * FROM customers LIMIT 100;`;
}

export function executeQuery(
  userId: string,
  query: string,
  connectorId?: string
): { rows: Record<string, unknown>[]; durationMs: number; explainPlan: string } {
  const start = Date.now();
  const durationMs = Math.floor(Math.random() * 200) + 50;

  const rows: Record<string, unknown>[] = [
    { month: "2026-01", revenue: 185000 },
    { month: "2026-02", revenue: 192000 },
    { month: "2026-03", revenue: 210000 },
  ];

  const explainPlan = `Seq Scan on orders  (cost=0.00..1250.00 rows=5000 width=32)
  Filter: (status = 'completed')
  -> HashAggregate  (cost=150.00..200.00 rows=12 width=64)
        Group Key: date_trunc('month', created_at)`;

  const id = randomUUID();
  db.prepare(
    `INSERT INTO studio_query_history (id, user_id, connector_id, query, duration_ms, rows_returned, status, explain_plan)
     VALUES (?, ?, ?, ?, ?, ?, 'success', ?)`
  ).run(id, userId, connectorId ?? null, query, durationMs, rows.length, explainPlan);

  return { rows, durationMs: Date.now() - start || durationMs, explainPlan };
}

export function listQueryHistory(userId: string): QueryHistoryEntry[] {
  const rows = db
    .prepare(
      "SELECT * FROM studio_query_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
    )
    .all(userId) as Array<{
    id: string;
    query: string;
    connector_id: string | null;
    duration_ms: number | null;
    rows_returned: number | null;
    status: string;
    explain_plan: string | null;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    query: r.query,
    connectorId: r.connector_id ?? undefined,
    durationMs: r.duration_ms ?? undefined,
    rowsReturned: r.rows_returned ?? undefined,
    status: r.status,
    explainPlan: r.explain_plan ?? undefined,
    createdAt: r.created_at,
  }));
}
