# Autonomous Business App

Official reference application — agents, workflows, and automation.

## What it demonstrates

- **Agents** — business analyst + software engineer collaboration
- **Workflows** — multi-step automation pipelines
- **Automation** — triggers, schedules, and actions

## Architecture

```
Business goal (natural language)
    ↓
Autonomous Project Manager
    ↓
Multi-agent team assignment
    ↓
Workflow execution → App generation → Deployment
```

## Quick start

```bash
npm run dev
# Open http://localhost:5173/core → Projects

# Or one-command generation
bus create crm --ai
bus deploy
```

## Generated structure (crm --ai)

- Project structure
- Agent configuration
- Database schema
- UI components
- API routes
- Tests
- Documentation

## Skills used

- `generate-api`
- `analyze-database`
- `build-react-app`
- `deploy-application`

## Agents

- `business_analyst` — requirements
- `software_engineer` — implementation
- `product_manager` — prioritization

## Core API

```bash
POST /api/core/projects
{ "prompt": "Build a CRM for small businesses" }

POST /api/core/projects/{id}/execute
```

## Learn more

- [CORE.md](../docs/CORE.md)
- [KERNEL.md](../docs/KERNEL.md)
