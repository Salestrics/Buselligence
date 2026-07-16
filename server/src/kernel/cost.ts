import { randomUUID } from "node:crypto";
import { db } from "../db.js";

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
  "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  "claude-sonnet-4-20250514": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  "gemini-2.0-flash": { input: 0.1 / 1_000_000, output: 0.4 / 1_000_000 },
  local: { input: 0, output: 0 },
};

export function estimateCost(
  provider: string,
  model: string,
  tokensIn: number,
  tokensOut: number
): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING["gpt-4o-mini"]!;
  if (provider === "local") return 0;
  return tokensIn * pricing.input + tokensOut * pricing.output;
}

export function recordCost(
  userId: string,
  task: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
  costUsd: number
): void {
  const optimization =
    model.includes("4o") && !model.includes("mini")
      ? `Could reduce ~42% using gpt-4o-mini for simpler steps`
      : undefined;

  db.prepare(
    `INSERT INTO kernel_costs (id, user_id, task, model, tokens_in, tokens_out, cost_usd, optimization)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(randomUUID(), userId, task, model, tokensIn, tokensOut, costUsd, optimization ?? null);
}

export function getCostSummary(userId: string) {
  const rows = db
    .prepare(
      "SELECT task, model, tokens_in, tokens_out, cost_usd, optimization, created_at FROM kernel_costs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
    )
    .all(userId) as Array<{
    task: string;
    model: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    optimization: string | null;
    created_at: string;
  }>;

  const total = rows.reduce((s, r) => s + r.cost_usd, 0);
  const totalTokens = rows.reduce((s, r) => s + r.tokens_in + r.tokens_out, 0);

  return {
    totalCostUsd: Math.round(total * 100) / 100,
    totalTokens,
    recent: rows.map((r) => ({
      task: r.task,
      model: r.model,
      tokensIn: r.tokens_in,
      tokensOut: r.tokens_out,
      costUsd: r.cost_usd,
      optimization: r.optimization,
      createdAt: r.created_at,
    })),
  };
}

export function analyzeTaskCost(task: string, model = "gpt-4o"): {
  task: string;
  estimatedCostUsd: number;
  optimization: string;
} {
  const tokensIn = 2000;
  const tokensOut = 1500;
  const cost = estimateCost("openai", model, tokensIn, tokensOut);
  return {
    task,
    estimatedCostUsd: Math.round(cost * 100) / 100,
    optimization:
      model !== "gpt-4o-mini"
        ? `Could reduce ~42% using gpt-4o-mini for non-reasoning steps`
        : "Already using cost-optimized model",
  };
}
