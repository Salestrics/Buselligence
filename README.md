# Buselligence

**The open-source AI workspace where businesses analyze, build, and automate.**

Buselligence is an open-source AI business operating system. Analyze data, build software, automate workflows, and create custom applications — using your own AI models and infrastructure, without vendor lock-in.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Why Buselligence

- **AI Development Studio** — Monaco editor, multi-file projects, AI copilot, preview runtime, one-click deploy
- **Semantic layer** — Define metrics, relationships, and business rules so AI understands your business
- **AI Software Engineer** — Builds dashboards, APIs, and apps from natural language prompts
- **Analyst agents** — Data, Financial, Sales, Marketing, Operations, Engineering, Code Review
- **Database Studio** — Schema explorer, SQL editor, AI query generation, explain plans
- **Automation Builder** — Visual workflows connecting MCP, APIs, webhooks, and cron jobs
- **Package Marketplace** — Install agents, connectors, app templates, and dashboards
- **Model Router** — Routes tasks to optimal AI models (OpenAI, Anthropic, Google, local)
- **Freedom of AI usage** — BYOK. You pay your provider directly.
- **Open source MIT** — Fork, self-host, and extend freely.

## Quick start

```bash
npm install
npm install --prefix client
npm install --prefix server
cp .env.example .env
npm run dev
```

- Frontend: http://localhost:5173
- Studio: http://localhost:5173/studio
- BI Platform: http://localhost:5173/platform
- API: http://localhost:3001

### First-time setup

1. Create an account at `/sign-up`
2. Add your API key in **Settings**
3. Open **Studio** (`/studio`) — build apps with the AI Software Engineer
4. Seed the semantic layer at **BI Platform** (`/platform`)
5. Chat with analyst agents at `/chat`

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/STUDIO.md](docs/STUDIO.md) | AI Development Studio, App Builder, Deploy |
| [docs/SEMANTIC_LAYER.md](docs/SEMANTIC_LAYER.md) | Metrics, relationships, business rules |
| [docs/BYOK.md](docs/BYOK.md) | Bring your own API keys |
| [docs/MCP.md](docs/MCP.md) | MCP server setup |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Salestrics Inc.
