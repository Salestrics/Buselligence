# Models

Buselligence supports multiple AI providers with intelligent routing.

## Providers

| Provider | Models | Notes |
|----------|--------|-------|
| OpenAI | gpt-4o, gpt-4o-mini | Default for general tasks |
| Anthropic | claude-sonnet-4 | Code and reasoning |
| Google | gemini-2.0-flash | Fast, cost-effective |
| Local | llama3.2, custom | Ollama, llama.cpp, vLLM |

## BYOK (Bring Your Own Key)

Per-user API keys stored encrypted. Configure in Settings → `/settings`.

See [BYOK.md](./BYOK.md) for details.

## Model routing

The model router selects models by task type:

```bash
GET /api/router
POST /api/router/route  { "prompt": "Write a SQL query" }
```

Kernel execution uses `routeModel(action)` automatically.

## Cost intelligence

Track tokens and cost per task at `/kernel` → Costs.

Optimization suggestions: e.g. "Could reduce 42% using gpt-4o-mini for simpler steps."

## Local models

```bash
# .env
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_MODEL=llama3.2
KERNEL_OFFLINE=true
```

See kernel local config: `GET /api/kernel/local`

## buselligence.lock

Pin model versions for reproducibility:

```json
{
  "models": {
    "default": "gpt-4o-mini",
    "reasoning": "gpt-4o",
    "code": "claude-sonnet-4-20250514"
  }
}
```
