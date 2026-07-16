import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";

export interface SimulationResult {
  id: string;
  scenario: string;
  revenueImpact?: string;
  databaseImpact?: string;
  userImpact?: string;
  technicalImpact?: string;
  recommendation: string;
  status: string;
}

export function runSimulation(userId: string, scenario: string): SimulationResult {
  const lower = scenario.toLowerCase();
  const id = randomUUID();

  let results: Omit<SimulationResult, "id" | "scenario" | "status">;

  if (lower.includes("pricing")) {
    results = {
      revenueImpact: "Estimated +12% ARR if price increase is 15% with 8% churn uplift",
      databaseImpact: "No schema changes. Update pricing table rows.",
      userImpact: "Existing customers grandfathered for 90 days. New signups see new pricing.",
      technicalImpact: "Modify billing service + Stripe price IDs. 3 files affected.",
      recommendation: "Run A/B test on 10% of new signups before full rollout.",
    };
  } else if (lower.includes("checkout")) {
    results = {
      revenueImpact: "Optimized checkout could increase conversion by 8-15%",
      databaseImpact: "Add checkout_events table for funnel analytics",
      userImpact: "Reduced steps from 4 to 2. Mobile-optimized flow.",
      technicalImpact: "Refactor Checkout.tsx, add analytics middleware",
      recommendation: "Deploy to 50% traffic, measure conversion for 2 weeks.",
    };
  } else {
    results = {
      revenueImpact: "Impact analysis pending — insufficient scenario detail",
      databaseImpact: "Review affected tables after code analysis",
      userImpact: "User-facing changes require UX review",
      technicalImpact: "Run codebase model to identify affected components",
      recommendation: "Provide more specific scenario for accurate simulation.",
    };
  }

  db.prepare(
    `INSERT INTO core_simulations (id, user_id, scenario, results, status) VALUES (?, ?, ?, ?, 'completed')`
  ).run(id, userId, scenario, JSON.stringify(results));

  return { id, scenario, ...results, status: "completed" };
}

export function listSimulations(userId: string): SimulationResult[] {
  const rows = db
    .prepare("SELECT * FROM core_simulations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(userId) as Array<{
    id: string;
    scenario: string;
    results: string;
    status: string;
  }>;

  return rows.map((r) => {
    const results = parseJson<Record<string, string>>(r.results, {});
    return {
      id: r.id,
      scenario: r.scenario,
      status: r.status,
      revenueImpact: results.revenueImpact,
      databaseImpact: results.databaseImpact,
      userImpact: results.userImpact,
      technicalImpact: results.technicalImpact,
      recommendation: results.recommendation ?? "",
    };
  });
}
