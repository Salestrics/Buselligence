# AI Coding Agent

Official reference application — Monaco editor, repository understanding, and execution.

## What it demonstrates

- **Monaco IDE** — full code editing in Studio
- **Repository understanding** — codebase engine explains architecture
- **Execution** — engineer agent plans, writes, reviews, and deploys

## Architecture

```
Natural language requirement
    ↓
Software Engineer agent
    ↓
Codebase context + Skills (build-react-app, review-security)
    ↓
Monaco editor ← generated files
    ↓
Test → Review → Deploy
```

## Quick start

```bash
npm run dev
# Open http://localhost:5173/studio

# Or CLI
bus create coding-agent
bus add mcp github
bus deploy
```

## Skills used

- `build-react-app`
- `review-security`
- `generate-api`

## Agents

- `software_engineer` — implementation
- `code_review` — security and quality

## Studio API

```bash
POST /api/studio/projects/{id}/engineer
{ "requirement": "Add JWT authentication" }

POST /api/studio/projects/{id}/review
POST /api/studio/projects/{id}/deploy
```

## Learn more

- [STUDIO.md](../docs/STUDIO.md)
- [CORE.md](../docs/CORE.md) — codebase engine
