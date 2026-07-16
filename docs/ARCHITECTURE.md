# Architecture

Buselligence is a monorepo with a React frontend, Express API, and SQLite persistence. Version 2.0 is built around **BYOK** (bring your own API) and **MCP** (Model Context Protocol) integrations.

## High-level diagram

```
┌─────────────────┐     SSE / REST      ┌──────────────────────────────────┐
│  React Client   │ ◄──────────────────►│  Express API (server/src/index.ts)│
│  Vite + Tailwind│                     │                                   │
└─────────────────┘                     │  ┌────────────┐  ┌─────────────┐ │
                                        │  │ BetterAuth │  │ Chat Engine │ │
                                        │  └─────┬──────┘  └──────┬──────┘ │
                                        │        │                 │        │
                                        │  ┌─────▼──────┐  ┌──────▼──────┐ │
                                        │  │ auth.db    │  │ Providers   │ │
                                        │  └────────────┘  │ OpenAI      │ │
                                        │                  │ Anthropic   │ │
                                        │  ┌────────────┐  │ Google      │ │
                                        │  │ buselligence│  └──────┬──────┘ │
                                        │  │ .db        │         │        │
                                        │  │ - settings │  ┌──────▼──────┐ │
                                        │  │ - mcp      │  │ MCP Manager │ │
                                        │  │ - convos   │  │ (stdio/sse/ │ │
                                        │  └────────────┘  │  http)      │ │
                                        └──────────────────┴──────┬──────┴──┘
                                                                │
                                                    ┌───────────▼───────────┐
                                                    │  External MCP Servers   │
                                                    │  Postgres, FS, custom... │
                                                    └─────────────────────────┘
```

## Chat flow

1. Client sends `POST /api/chat` with message history
2. Server resolves credentials:
   - Authenticated user → decrypt key from `user_settings`
   - Anonymous → optional `OPENAI_API_KEY` demo mode
3. Server loads enabled MCP servers for the user
4. MCP manager connects, lists tools, namespaces them
5. Provider adapter streams chat with tool-calling loop:
   - Model requests tool → execute via MCP → feed result back → continue
6. Events stream to client: `delta`, `tool_call`, `tool_result`, `status`, `done`

## Database schema

### `buselligence.db` (application)

| Table | Purpose |
|-------|---------|
| `user_settings` | Provider, model, encrypted API key, base URL |
| `mcp_servers` | MCP server config per user |
| `conversations` | Saved chat history (authenticated) |
| `anonymous_sessions` | Demo token usage (optional) |

### `auth.db` (BetterAuth)

Managed by BetterAuth — users, sessions, accounts.

## Provider abstraction

All AI providers implement `AIProviderAdapter`:

```typescript
interface AIProviderAdapter {
  id: AIProviderId;
  streamChat(context: StreamChatContext): AsyncGenerator<ChatStreamEvent>;
  estimateUsage(messages, completionText): StreamUsage;
}
```

`StreamChatContext` includes messages, credentials, MCP tools, and an `executeTool` callback.

## Encryption

User API keys are encrypted with AES-256-GCM (`server/src/crypto.ts`):

```
stored = base64(iv) : base64(authTag) : base64(ciphertext)
```

Key derived from `ENCRYPTION_KEY` or `BETTER_AUTH_SECRET` via SHA-256.

## MCP manager

`server/src/mcp/manager.ts`:

- Creates transports (stdio, SSE, HTTP) per server config
- Connects ephemeral MCP clients per request
- Namespaces tools: `{server}__{tool}`
- Executes `callTool` and normalizes results for the LLM

## Frontend routes

| Route | Component | Auth |
|-------|-----------|------|
| `/` | LandingPage | — |
| `/chat` | ChatPage | Optional |
| `/settings` | SettingsPage | Required |
| `/sign-in` | SignInPage | — |
| `/sign-up` | SignUpPage | — |

## Configuration layers

| Layer | Controls |
|-------|----------|
| `.env` | Server secrets, optional demo key, CORS |
| User Settings | Per-user provider, model, API key |
| MCP Servers | Per-user data source connections |

## Production considerations

- Set `NODE_ENV=production` — serves built client from Express
- Use strong `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY`
- Back up `server/data/*.db` or migrate to PostgreSQL for scale
- MCP stdio processes run on the same host — isolate in containers if needed
- Set `DISABLE_SIGN_UP=true` for private deployments

## Extension points

| Area | How to extend |
|------|---------------|
| AI providers | Add adapter in `server/src/providers/` |
| MCP transports | Extend `createTransport()` in MCP manager |
| Auth | BetterAuth plugins / OAuth |
| Storage | Replace SQLite with Postgres adapter |
