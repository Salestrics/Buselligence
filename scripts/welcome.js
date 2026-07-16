#!/usr/bin/env node
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

console.log(`
${CYAN}${BOLD}  ✦ Buselligence${RESET}
  The open-source runtime for AI-powered applications

${GREEN}Ready in 60 seconds:${RESET}

  1. cp .env.example .env   (if you haven't already)
  2. npm run dev
  3. Open ${BOLD}http://localhost:5173/start${RESET}

  Demo login: demo@buselligence.com / demo123456

  CLI: npx bus hello  |  bus create crm --ai
`);
