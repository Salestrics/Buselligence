# Bring Your Own API (BYOK)

Buselligence is designed around **freedom of AI usage**. You choose the provider, model, and API key. The platform does not resell tokens or lock you into a single vendor.

## Supported providers

| Provider | Default model | API key source |
|----------|---------------|----------------|
| OpenAI | `gpt-5.6-sol` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Anthropic | `claude-sonnet-4-20250514` | [Anthropic Console](https://console.anthropic.com/) |
| Google AI | `gemini-2.0-flash` | [Google AI Studio](https://aistudio.google.com/apikey) |

Additional models are selectable in Settings for each provider.

## How it works

1. **Sign up** — Create a free account at `/sign-up`
2. **Add your key** — Open Settings and paste your provider API key
3. **Chat** — All requests use your key and your chosen model

Keys are encrypted with **AES-256-GCM** before storage in SQLite. The encryption key comes from `ENCRYPTION_KEY` (recommended) or falls back to `BETTER_AUTH_SECRET`.

```bash
# Generate a strong encryption key
openssl rand -base64 32
```

Add to `.env`:

```env
ENCRYPTION_KEY=your-generated-key
```

## Server default key (optional demo mode)

For anonymous trials without sign-up, you can set a shared server key:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6-sol
```

When configured:

- Anonymous users get 50,000 demo tokens
- Signed-in users **always** use their own key (never the server key)

Remove `OPENAI_API_KEY` in production if you want sign-up + BYOK only.

## Custom API base URL

For OpenAI-compatible proxies or Azure OpenAI-style endpoints, set an optional base URL in Settings:

```
https://your-proxy.example.com/v1
```

## Security notes

- API keys are never returned in full after save — only a masked preview (`sk-1••••abcd`)
- Keys are decrypted only in memory during chat requests
- Each user's keys are isolated by `user_id`
- Self-host and control your own `ENCRYPTION_KEY` and database

## Provider tool calling

All three providers support **tool calling**, which Buselligence uses to invoke MCP server tools during chat. See [MCP.md](./MCP.md).

## Expanding providers

To add a new provider:

1. Create `server/src/providers/<name>.ts` implementing `AIProviderAdapter`
2. Register it in `server/src/providers/index.ts`
3. Add models to `PROVIDER_DEFINITIONS`

Pull requests welcome — see [CONTRIBUTING.md](../CONTRIBUTING.md).
