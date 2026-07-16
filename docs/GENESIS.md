# Build Anything Mode

**Describe it. Watch it come alive.**

The AI Project Genesis Engine turns ideas into living project universes — not just code snippets, but full architectures, roadmaps, engineering teams, and deployable applications.

## Tagline

> From idea to application in minutes.

## How it works

1. User describes what they want to build
2. **AI Architect** creates project blueprint (architecture + modules)
3. **AI Product Manager** creates sprint roadmap
4. **AI Engineering Team** builds in parallel (database, backend, frontend, QA)
5. **Live Build Room** shows real-time progress — agents, files, tests, decisions
6. **Instant Preview** when complete — open in Studio

## Example

```
I want to build a platform that helps local restaurants manage 
inventory, suppliers, employees, and customer loyalty.
```

Creates **RestaurantOS** with:

- Multi-tenant SaaS architecture
- Modules: Inventory, Suppliers, Employees, Loyalty, Analytics
- 3-sprint product roadmap
- 100+ generated files in Studio
- Kernel execution trace

## UI

http://localhost:5173/build

## API

```bash
POST /api/genesis/build
{ "prompt": "Build a restaurant management platform..." }

GET /api/genesis/builds/:id/stream   # SSE live build events
GET /api/genesis/builds/:id          # Final build state
```

## CLI

```bash
bus build "I want to build a CRM for small businesses"
```

## What it demonstrates

- Monaco / Studio integration
- Multi-agent teams
- Kernel execution + tracing
- Database schema generation
- MCP-ready architecture
- Memory and decisions
- Live observability

## Architecture

```
User prompt
    ↓
Genesis Parser → Blueprint + Roadmap
    ↓
Studio Project + File Generation
    ↓
Kernel Execute (trace + memory)
    ↓
SSE Build Room → Preview
```
