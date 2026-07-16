# Architecture

Buselligence v4 is a self-hosted AI analyst platform: React frontend, Express API, SQLite persistence, semantic layer, first-class data connectors, analyst agents, dashboards, governance, and MCP as an extension layer.

## High-level diagram

```
┌─────────────────┐     SSE / REST      ┌────────────────────────────────────────────┐
│  React Client   │ ◄──────────────────►│  Express API (server/src/index.ts)         │
│  /platform      │                     │                                            │
│  /chat          │                     │  ┌──────────┐  ┌────────────────────────┐  │
└─────────────────┘                     │  │BetterAuth│  │ Chat + Analyst Agents  │  │
                                        │  └────┬─────┘  └───────────┬────────────┘  │
                                        │       │                    │               │
                                        │  ┌────▼────────────────────▼────────────┐  │
                                        │  │         Semantic Layer Manager         │  │
                                        │  │  metrics · relationships · rules       │  │
                                        │  └────┬────────────────────┬────────────┘  │
                                        │       │                    │               │
                    ┌───────────────────┤  ┌────▼─────┐  ┌──────────▼──────────┐     │
                    │ Data Connectors   │  │Governance│  │ Dashboard Generator │     │
                    │ PG·Snowflake·SF   │  │ Audit Log│  │ Scheduled Intel     │     │
                    └───────────────────┤  └──────────┘  └─────────────────────┘     │
                                        │                                            │
                                        │  ┌────────────┐  ┌─────────────────────┐   │
                                        │  │ Providers  │  │ MCP Manager         │   │
                                        │  │ OpenAI     │  │ + Marketplace       │   │
                                        │  │ Anthropic  │  │ (extension layer)   │   │
                                        │  │ Google     │  └──────────┬──────────┘   │
                                        │  └────────────┘             │              │
                                        └─────────────────────────────┼──────────────┘
                                                                      │
                                                          ┌───────────▼───────────┐
                                                          │ External Data Sources   │
                                                          │ DBs · SaaS · MCP servers│
                                                          └─────────────────────────┘
```

## Chat flow (v4)

1. Client sends `POST /api/chat` with `agentId`, `noSqlMode`, and message history
2. Server resolves credentials (BYOK or demo key)
3. Server builds semantic context (metrics, relationships, rules, connector sources)
4. Selected analyst agent system prompt is injected (Financial, Sales, etc.)
5. MCP tools are loaded and namespaced
6. Provider streams with tool-calling loop; audit log records data access
7. In no-SQL mode, SQL is hidden from the user — only business narrative, charts, recommendations

## Analyst agents

| Agent | Focus |
|-------|-------|
| Data Analyst | SQL, schema exploration, data quality |
| Financial Analyst | Revenue, NRR, churn, CAC, forecasting |
| Sales Analyst | Pipeline, win rates, deal velocity |
| Marketing Analyst | Acquisition, campaigns, attribution |
| Operations Analyst | Efficiency, capacity, SLAs |
| Executive Assistant | Cross-functional summaries and narratives |
| Buselligence AI | General orchestrator (default) |

## Database schema

### `buselligence.db` (application)

| Table | Purpose |
|-------|---------|
| `user_settings` | Provider, model, encrypted API key |
| `mcp_servers` | MCP server config per user |
| `conversations` | Saved chat history |
| `semantic_metrics` | KPI definitions, formulas, sources |
| `semantic_relationships` | Entity graph (Customer → Account → Revenue) |
| `semantic_rules` | Business rules (exclude test accounts, etc.) |
| `data_connectors` | First-class connector configs (encrypted) |
| `dashboards` | AI-generated dashboard specs |
| `audit_logs` | Governance: who accessed what |
| `scheduled_jobs` | Cron-style intelligence briefings |
| `intelligence_briefings` | Generated briefing content |
| `marketplace_installs` | Installed MCP marketplace presets |
| `encryption_keys` | Envelope encryption DEK metadata |

### `auth.db` (BetterAuth)

Managed by BetterAuth — users, sessions, accounts.

## Encryption

Two layers:

1. **AES-256-GCM** (`server/src/crypto.ts`) — direct key encryption for API keys
2. **Envelope encryption** (`server/src/crypto/envelope.ts`) — KMS/Vault DEK wrapping

```
KMS/Vault → Data Encryption Key → Encrypted User Key
```

Providers: `local` (default), `aws`, `vault`, `gcp` via `KMS_PROVIDER`.

## Frontend routes

| Route | Component | Auth |
|-------|-----------|------|
| `/` | LandingPage | — |
| `/platform` | BiPlatformPage | Required |
| `/chat` | ChatPage | Optional |
| `/outbound` | OutboundPage | Required |
| `/settings` | SettingsPage | Required |
| `/sign-in` | SignInPage | — |
| `/sign-up` | SignUpPage | — |

## Configuration layers

| Layer | Controls |
|-------|----------|
| `.env` | Server secrets, KMS provider, demo key |
| Semantic Layer | Metrics, relationships, business rules |
| Data Connectors | Warehouse and SaaS connections |
| User Settings | Per-user AI provider and API key |
| MCP Servers / Marketplace | Extension integrations |

## Production considerations

- Set `NODE_ENV=production` — serves built client from Express
- Use strong `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY`
- Consider `KMS_PROVIDER=aws` or `vault` for envelope encryption
- Back up `server/data/*.db` or migrate to PostgreSQL for scale
- MCP stdio processes run on the same host — isolate in containers if needed

## Extension points

| Area | How to extend |
|------|---------------|
| Metrics | Add via `/api/semantic/metrics` or UI at `/platform` |
| Connectors | Extend `server/src/connectors/types.ts` definitions |
| Analyst agents | Add definition in `server/src/agents/definitions.ts` |
| MCP marketplace | Add preset in `server/src/marketplace/presets.ts` |
| AI providers | Add adapter in `server/src/providers/` |
