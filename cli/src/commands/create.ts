import { join } from "node:path";
import { ensureDir, generateAgent, generateAiApp, generateApp } from "../lib/templates.js";
import { heading, nextSteps, success } from "../lib/output.js";

export function runCreate(args: string[]): void {
  const aiFlag = args.includes("--ai");
  const filtered = args.filter((a) => !a.startsWith("--"));
  const name = filtered[1];
  const type = filtered[0] === "create" ? filtered[2] : undefined;

  if (!name) {
    console.error("Usage: bus create <name> [--ai]  |  bus create my-agent  |  bus create crm --ai");
    process.exit(1);
  }

  const dir = join(process.cwd(), name);
  ensureDir(dir);

  if (name.endsWith("-agent") || name.endsWith("_agent") || type === "agent") {
    generateAgent(name.replace(/-agent$/, "").replace(/_agent$/, ""), dir);
    success(`Agent "${name}" created`);
  } else if (aiFlag || name.toLowerCase() === "crm") {
    generateAiApp(name, dir, name.toLowerCase() === "crm" ? "crm" : "app");
    success(`AI app "${name}" created with agent, database, UI, API, tests, and docs`);
  } else {
    generateApp(name, dir);
    success(`App "${name}" created`);
  }

  heading("Created files");
  console.log(`  ${dir}/`);

  nextSteps([
    `cd ${name}`,
    aiFlag ? "bus deploy" : "npm install",
    "Open http://localhost:5173/start for the guided experience",
    aiFlag ? `bus evaluate ${name}_agent "Analyze pipeline"` : "bus add mcp github",
  ]);
}
