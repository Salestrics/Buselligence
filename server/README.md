# Server

Express API for Buselligence — BYOK AI chat, MCP integrations, and conversation persistence.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run production build |
| `npm run db:migrate` | Run BetterAuth migrations |
| `npm run db:seed` | Seed demo user |

## Key modules

| Path | Purpose |
|------|---------|
| `src/index.ts` | HTTP routes |
| `src/chat.ts` | Chat orchestration |
| `src/providers/` | OpenAI, Anthropic, Google adapters |
| `src/mcp/manager.ts` | MCP client and tool execution |
| `src/settings.ts` | Encrypted user API key storage |
| `src/crypto.ts` | AES-256-GCM encryption |

See [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for full system design.
