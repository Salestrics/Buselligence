import { join } from "node:path";
import { ensureDir, generateAiApp } from "../lib/templates.js";
import { heading, info, nextSteps, success } from "../lib/output.js";

export function runBuild(args: string[]): void {
  const prompt = args.slice(1).join(" ") || args[1];
  if (!prompt) {
    console.error('Usage: bus build "<your idea>"');
    console.error('Example: bus build "restaurant inventory and loyalty platform"');
    process.exit(1);
  }

  const lower = prompt.toLowerCase();
  const name =
    lower.includes("restaurant") ? "RestaurantOS" :
    lower.includes("crm") ? "CRM" :
    "MyApp";

  const dir = join(process.cwd(), name.toLowerCase().replace(/\s+/g, "-"));
  ensureDir(dir);
  generateAiApp(name, dir, lower.includes("crm") ? "crm" : "app");

  success(`Build Anything: "${name}" scaffold created`);
  info(`From idea: ${prompt.slice(0, 80)}${prompt.length > 80 ? "..." : ""}`);

  heading("For the full live experience");
  nextSteps([
    "npm run dev",
    "Open http://localhost:5173/build",
    "Paste your idea and watch the AI Build Room",
    `cd ${name.toLowerCase().replace(/\s+/g, "-")} && bus deploy`,
  ]);
}
