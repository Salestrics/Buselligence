# Buselligence

Open-source business intelligence chatbot with **bring-your-own-API** (BYOK) and **Model Context Protocol (MCP)** support.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Buselligence is an MIT-licensed BI copilot you self-host. Use your own OpenAI, Anthropic, or Google API keys, connect MCP servers for live data access, and chat about KPIs, SQL, forecasting, and executive narratives — without platform lock-in.

## Why Buselligence

- **Freedom of AI usage** — You pay your provider directly. No token markup, no vendor lock-in.
- **Bring your own API** — Per-user encrypted API keys for OpenAI, Anthropic, and Google.
- **MCP integrations** — Connect stdio, SSE, or HTTP MCP servers to query warehouses, files, and custom tools during chat.
- **Open source MIT** — Fork, self-host, and extend freely.

## Features

- Multi-provider AI chat (OpenAI, Anthropic, Google)
- MCP client with tool calling during conversations
- Encrypted API key storage (AES-256-GCM)
- Saved conversations for authenticated users
- Optional anonymous demo mode when `OPENAI_API_KEY` is configured
- React + Express + SQLite stack

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
3. Optionally add MCP servers (Postgres, filesystem, custom tools)
4. Start chatting at http://localhost:5173/chat

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
| `ENCRYPTION_KEY` | Recommended | Encrypts user API keys at rest (falls back to `BETTER_AUTH_SECRET`) |
| `BETTER_AUTH_URL` | No | Server URL (default `http://localhost:3001`) |
| `CLIENT_URL` | No | Frontend URL for CORS (default `http://localhost:5173`) |
| `OPENAI_API_KEY` | No | Optional server default key for anonymous demo mode |
| `OPENAI_MODEL` | No | Model for demo mode (default `gpt-4o-mini`) |
| `DISABLE_SIGN_UP` | No | Set `true` to disable self-serve sign-up |
| `PORT` | No | API port (default `3001`) |
| `SEED_USER_EMAIL` | No | Demo user email for `db:seed` |
| `SEED_USER_PASSWORD` | No | Demo user password for `db:seed` |

See [docs/BYOK.md](docs/BYOK.md) and [docs/MCP.md](docs/MCP.md) for detailed configuration.

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/BYOK.md](docs/BYOK.md) | Bring your own API — providers, keys, security |
| [docs/MCP.md](docs/MCP.md) | MCP server setup and examples |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |

## API overview

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/health` | — | Health and feature flags |
| `GET /api/providers` | — | Supported AI providers |
| `GET/PUT /api/settings` | Yes | User AI provider settings |
| `GET/POST/PUT/DELETE /api/mcp/servers` | Yes | MCP server management |
| `POST /api/mcp/servers/:id/test` | Yes | Test MCP connection |
| `POST /api/chat` | Optional | SSE chat stream with tool events |
| `GET/POST/DELETE /api/conversations` | Yes | Saved conversations |

## Production

```bash
npm run build
NODE_ENV=production npm start
```

Set strong values for `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY` in production. User API keys are encrypted at rest but the encryption key must be protected.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Salestrics Inc.
