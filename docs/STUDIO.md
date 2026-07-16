# Buselligence Studio

The AI Development Studio — go from "I need a dashboard" to "Build the dashboard, connect the data, deploy it."

## Architecture

```
Buselligence Studio
├── Explorer          src/, components/, queries/, workflows/
├── Monaco Editor     TypeScript, Python, SQL, JSON, YAML, Markdown
├── AI Copilot Panel  Software Engineer agent
└── Preview Runtime   React, Node, Python, SQL notebooks
```

## Getting Started

1. Sign in and navigate to `/studio`
2. A default project is created automatically
3. Use the **AI Copilot** to describe what you want to build
4. Edit generated code in Monaco
5. **Preview** in the sandbox runtime
6. **Review** with the code review agent
7. **Deploy** to production

## AI Software Engineer

Example prompt:

> Create a customer churn prediction dashboard.

The AI will:
1. Analyze available data (semantic layer + connectors)
2. Create SQL queries (`queries/churn_features.sql`)
3. Generate React components (`src/components/ChurnDashboard.tsx`)
4. Create API endpoints (`src/api/churn.ts`)
5. Commit changes with an AI-generated message

## App Builder

```
POST /api/studio/app-builder
{ "prompt": "Build me a customer onboarding tracker" }
```

Generates pages, database schema, roles, and starter code.

## Database Studio

- Schema explorer with table/column tree
- SQL editor with Monaco
- Natural language → SQL generation
- Query execution with explain plans
- Query history

## Git Workflows

- Branch management
- Commit history
- AI-generated commits: `fix/revenue-calculation` (+12 -5)
- Code review before deploy

## Automation Builder

Templates:
- **Salesforce Lead** → AI analyze → Create opportunity → Notify
- **Cron** → Weekly revenue briefing
- **Webhook** → Stripe payment alerts

## Package Marketplace

Categories: AI Agents, Connectors, Apps, Templates

Install from `/studio` → Marketplace tab or `GET /api/studio/marketplace`.

## Model Router

`POST /api/router/route` — routes prompts to optimal models:

| Task | Model |
|------|-------|
| Simple questions | GPT-5.6 Sol |
| Complex analysis | GPT-5.6 Luna |
| Code generation | Claude Sonnet |
| Data reasoning | GPT-5.6 Terra + semantic layer |

## API Reference

| Endpoint | Description |
|----------|-------------|
| `GET/POST /api/studio/projects` | Project CRUD |
| `GET/PUT /api/studio/projects/:id/files/*` | File operations |
| `POST /api/studio/projects/:id/engineer` | AI Software Engineer |
| `POST /api/studio/projects/:id/review` | Code review |
| `POST /api/studio/projects/:id/deploy` | Deploy |
| `POST /api/studio/app-builder` | Generate app from prompt |
| `GET /api/studio/database/schema` | Schema explorer |
| `POST /api/studio/database/execute` | Run SQL |
| `GET/POST /api/studio/automations` | Automation workflows |
| `GET /api/studio/marketplace` | Package marketplace |

## Positioning

> Buselligence is an open-source AI business operating system. Analyze data, build software, automate workflows, and create custom applications using your own AI models and infrastructure.

The strongest differentiator: the AI doesn't just write code — it understands the business context that the code serves.
