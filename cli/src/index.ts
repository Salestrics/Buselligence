#!/usr/bin/env node
import { runCreate } from "./commands/create.js";
import { runAdd } from "./commands/add.js";
import { runDeploy } from "./commands/deploy.js";
import { runTest } from "./commands/test.js";
import { runEvaluate } from "./commands/evaluate.js";
import { runBuild } from "./commands/build.js";
import { logo, heading, nextSteps } from "./lib/output.js";

const args = process.argv.slice(2);
const command = args[0];

function showHelp(): void {
  logo();
  heading("Commands");
  console.log(`
  bus create <name> [--ai]     Create agent, app, or full AI app (crm --ai)
  bus add mcp <name>           Add MCP server (github, filesystem, postgres)
  bus deploy                   Deploy to Buselligence runtime
  bus test agent <slug>        Test agent configuration
  bus evaluate <slug> <task>   Run agent benchmark evaluation
  bus build "<idea>"           Build Anything — AI Project Genesis (live at /build)
  bus hello                    60-second getting started guide
  bus --help                   Show this help
`);
}

function showHello(): void {
  logo();
  heading("Hello World — 60 seconds to wow");
  nextSteps([
    "git clone https://github.com/Salestrics/Buselligence && cd Buselligence",
    "npm install && npm run setup",
    "npm run dev",
    "Open http://localhost:5173/start",
    "Sign in: demo@buselligence.com / demo123456",
    "Create an agent → Connect MCP → Generate an app → Run it",
  ]);
  console.log("\n  Or from CLI:");
  console.log("    bus create my-agent");
  console.log("    bus create crm --ai");
  console.log("    bus add mcp github");
  console.log("    bus deploy\n");
}

if (!command || command === "--help" || command === "-h") {
  showHelp();
} else if (command === "hello") {
  showHello();
} else if (command === "create") {
  logo();
  runCreate(args);
} else if (command === "add") {
  logo();
  runAdd(args.slice(1));
} else if (command === "deploy") {
  logo();
  runDeploy();
} else if (command === "test") {
  logo();
  runTest(args.slice(1));
} else if (command === "evaluate") {
  logo();
  runEvaluate(args.slice(1));
} else if (command === "build") {
  logo();
  runBuild(args);
} else {
  console.error(`Unknown command: ${command}`);
  showHelp();
  process.exit(1);
}
