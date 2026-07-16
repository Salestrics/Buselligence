#!/usr/bin/env node
/**
 * Build and seed the app before Playwright e2e runs (production self-hosted path).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    ...opts,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("node", ["scripts/ensure-env.js"]);
run("npm", ["run", "build"]);
run("npm", ["run", "db:migrate", "--prefix", "server"]);
run("npm", ["run", "db:seed", "--prefix", "server"]);

console.log("✓ E2E environment prepared");
