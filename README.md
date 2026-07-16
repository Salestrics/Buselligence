# Buselligence

**The self-hosted AI analyst that understands your business.**

Open-source AI analyst for your business data. Connect your systems, define what metrics mean, ask questions in plain English, and get executive insights — without vendor lock-in.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Why Buselligence

- **Semantic layer** — Define Revenue, NRR, CAC, Churn, relationships, and business rules so the AI knows what your business means.
- **Analyst agents** — Data, Financial, Sales, Marketing, Operations, and Executive Assistant — each with specialized workflows.
- **First-class connectors** — PostgreSQL, Snowflake, BigQuery, Salesforce, Stripe, HubSpot, and more. MCP is the extension layer.
- **No SQL required** — Ask "Why did revenue drop?" and get queries, charts, explanations, and recommendations.
- **Dashboard generation** — "Build me a SaaS executive dashboard" → React, PDF, slides, or iframe export.
- **Data governance** — Audit log of who accessed what, which sources were queried, and rows returned.
- **Freedom of AI usage** — BYOK for OpenAI, Anthropic, Google. You pay your provider directly.
- **Open source MIT** — Fork, self-host, and extend freely.

## Features (v4)

| Area | Capabilities |
|------|--------------|
| **Semantic Layer** | Metrics, formulas, entity relationships, business rules, "Explain this metric" |
| **Data Connectors** | PostgreSQL, MySQL, Snowflake, BigQuery, Redshift, Salesforce, HubSpot, Stripe, QuickBooks, Shopify, GA, Zendesk |
| **Analyst Agents** | Data, Financial, Sales, Marketing, Operations, Executive Assistant |
| **Dashboards** | AI-generated executive dashboards with multi-format export |
| **Governance** | Audit logs for data access, queries, and AI responses |
| **Marketplace** | One-click MCP installs (Postgres, Stripe, Salesforce, Snowflake, GitHub, Jira) |
| **Scheduled Intelligence** | Weekly revenue briefings, pipeline updates, risk alerts |
| **Envelope Encryption** | AES-256-GCM + KMS/Vault envelope encryption for API keys |
| **AI Outbound** | Web lead discovery with contact management |
| **MCP** | stdio, SSE, HTTP transports with tool calling during chat |

## Quick start

```bash
npm install
npm install --prefix client
npm install --prefix server
cp .env.example .env
# Edit .env — set BETTER_AUTH_SECRET and ENCRYPTION_KEY at minimum
npm run dev
```

- Frontend: http://localhost:5173
- API / Auth: http://localhost:3001

### First-time setup

1. Open http://localhost:5173/sign-up and create an account
2. Go to **Settings** and add your API key (OpenAI, Anthropic, or Google)
3. Open **BI Platform** (`/platform`) → seed the semantic layer and add connectors
4. Install MCP servers from the Marketplace or configure custom ones in Settings
5. Chat with an analyst agent — enable **No SQL** mode for executive-friendly answers
6. Optionally use **AI Outbound** for web lead discovery

### Demo user (optional)

```bash
npm run db:seed --prefix server
```

Default credentials:

- Email: `demo@buselligence.com`
- Password: `demo123456`

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | Yes | Secret for BetterAuth sessions |
| `ENCRYPTION_KEY` | Recommended | Encrypts user API keys at rest |
| `KMS_PROVIDER` | No | `local` (default), `aws`, `vault`, or `gcp` for envelope encryption |
| `BETTER_AUTH_URL` | No | Server URL (default `http://localhost:3001`) |
| `CLIENT_URL` | No | Frontend URL for CORS (default `http://localhost:5173`) |
| `OPENAI_API_KEY` | No | Optional server default key for anonymous demo mode |
| `DISABLE_SIGN_UP` | No | Set `true` to disable self-serve sign-up |
| `PORT` | No | API port (default `3001`) |

See [docs/BYOK.md](docs/BYOK.md), [docs/MCP.md](docs/MCP.md), and [docs/SEMANTIC_LAYER.md](docs/SEMANTIC_LAYER.md) for detailed configuration.

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/SEMANTIC_LAYER.md](docs/SEMANTIC_LAYER.md) | Metrics, relationships, business rules |
| [docs/BYOK.md](docs/BYOK.md) | Bring your own API — providers, keys, security |
| [docs/MCP.md](docs/MCP.md) | MCP server setup and examples |
| [docs/OUTBOUND.md](docs/OUTBOUND.md) | AI Outbound lead discovery & contact management |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |

## API overview

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/health` | — | Health and v4 feature flags |
| `GET /api/agents` | — | Analyst agent definitions |
| `GET/POST /api/semantic/*` | Yes | Semantic layer (metrics, rules, relationships) |
| `GET/POST /api/connectors/*` | Yes | Data connector management |
| `GET/POST /api/dashboards/*` | Yes | Dashboard generation and export |
| `GET /api/governance/audit` | Yes | Audit log |
| `GET/POST /api/marketplace/*` | Yes | MCP marketplace installs |
| `GET/POST /api/intelligence/*` | Yes | Scheduled jobs and briefings |
| `POST /api/chat` | Optional | SSE chat with `agentId` and `noSqlMode` |
| `GET/POST/DELETE /api/conversations` | Yes | Saved conversations |

## Production

```bash
npm run build
NODE_ENV=production npm start
```

Set strong values for `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY` in production. Consider `KMS_PROVIDER=aws` or `vault` for envelope encryption.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Salestrics Inc.
