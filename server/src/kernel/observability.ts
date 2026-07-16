import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import type { TraceSpan } from "./types.js";

export function startTrace(userId: string, request: string, input: unknown): string {
  const id = randomUUID();
  const initialSpans: TraceSpan[] = [
    {
      id: randomUUID(),
      name: "User Request",
      type: "kernel",
      input: { request, payload: input },
      status: "ok",
    },
  ];

  db.prepare(
    `INSERT INTO kernel_traces (id, user_id, request, spans, status) VALUES (?, ?, ?, ?, 'running')`
  ).run(id, userId, request, JSON.stringify(initialSpans));

  return id;
}

export function completeTrace(traceId: string, spans: TraceSpan[], durationMs: number): void {
  db.prepare(
    `UPDATE kernel_traces SET spans = ?, status = 'completed', duration_ms = ? WHERE id = ?`
  ).run(JSON.stringify(spans), durationMs, traceId);
}

export function getTrace(traceId: string, userId: string) {
  const row = db
    .prepare("SELECT * FROM kernel_traces WHERE id = ? AND user_id = ?")
    .get(traceId, userId) as {
    id: string;
    request: string;
    spans: string;
    status: string;
    duration_ms: number | null;
    created_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    request: row.request,
    spans: parseJson<TraceSpan[]>(row.spans, []),
    status: row.status,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    flow: ["User Request", "Agent Planner", "Tool Calls", "Model Responses", "Final Output"],
  };
}

export function listTraces(userId: string) {
  const rows = db
    .prepare("SELECT id, request, status, duration_ms, created_at FROM kernel_traces WHERE user_id = ? ORDER BY created_at DESC LIMIT 30")
    .all(userId) as Array<{
    id: string;
    request: string;
    status: string;
    duration_ms: number | null;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    request: r.request,
    status: r.status,
    durationMs: r.duration_ms,
    createdAt: r.created_at,
  }));
}
