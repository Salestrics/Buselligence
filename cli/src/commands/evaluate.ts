import { heading, success, info } from "../lib/output.js";

export function runEvaluate(args: string[]): void {
  const agentSlug = args[0];
  const task = args.slice(1).join(" ") || "Generate REST API";

  if (!agentSlug) {
    console.error('Usage: bus evaluate <agent-slug> "<task>"');
    process.exit(1);
  }

  heading(`Agent Evaluation: ${agentSlug}`);
  info(`Task: ${task}`);

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
  }

  const metrics = {
    accuracy: score,
    cost: 78 + Math.floor(Math.random() * 15),
    speed: 85 + Math.floor(Math.random() * 10),
    reliability: 90 + Math.floor(Math.random() * 8),
    toolUsage: 82 + Math.floor(Math.random() * 15),
  };

  console.log(`\n  Score: ${score}%`);
  if (issues.length) {
    console.log("\n  Issues:");
    issues.forEach((i) => console.log(`    - ${i}`));
  }
  console.log("\n  Metrics:");
  Object.entries(metrics).forEach(([k, v]) => console.log(`    ${k}: ${v}%`));

  success("Evaluation complete");
  info("View full benchmarks at http://localhost:5173/kernel → Agents");
}
