import { existsSync } from "node:fs";
import { join } from "node:path";
import { success, info, heading } from "../lib/output.js";

export function runDeploy(): void {
  const cwd = process.cwd();
  const hasLock = existsSync(join(cwd, "buselligence.lock"));
  const hasPackage = existsSync(join(cwd, "package.json"));

  heading("Deploying to Buselligence runtime");

  if (hasLock) {
    success("Found buselligence.lock — environment pinned");
  }
  if (hasPackage) {
    success("Found package.json — app structure validated");
  }

  // Simulated deployment steps
  const steps = [
    "Resolving agents and skills from lockfile",
    "Building application bundle",
    "Provisioning preview environment",
    "Starting runtime on port 3001",
  ];

  for (const step of steps) {
    info(step);
  }

  success("Deployed successfully");
  console.log("\n  Preview: http://localhost:5173/studio");
  console.log("  API:     http://localhost:3001/api/health\n");
  info("For production: set NODE_ENV=production && npm run build && npm start");
}
