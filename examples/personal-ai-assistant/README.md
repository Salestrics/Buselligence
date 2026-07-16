# Personal AI Assistant

Official reference application — memory, tools, and agents working together.

## What it demonstrates

- **Memory** — persistent context across conversations via kernel memory engine
- **Tools** — MCP integrations (filesystem, GitHub)
- **Agents** — universal assistant with skill composition

## Architecture

```
User message
    ↓
Kernel execute (universal_assistant)
    ↓
Memory retrieval → Skill resolution → MCP tools → Model
    ↓
Response + memory update + trace
```

## Quick start

```bash
# From Buselligence root
npm run dev

# Or scaffold standalone
bus create personal-assistant --ai
```

## Key files

```
personal-ai-assistant/
├── agent.json           # Agent manifest
├── buselligence.lock    # Pinned environment
├── src/
│   ├── memory.ts        # Memory rules
│   └── assistant.ts     # Main loop
└── mcp.json             # Tool connections
```

## Skills used

- `teach-concept` — adaptive explanations
- `analyze-metrics` — personal data insights

## Kernel integration

```typescript
// Execute through kernel
POST /api/kernel/execute
{
  "action": "chat",
  "agentId": "universal_assistant",
  "input": { "message": "Remember I prefer concise answers" },
  "skillIds": ["teach-concept"]
}
```

## Learn more

- [KERNEL.md](../docs/KERNEL.md)
- [AGENTS.md](../docs/AGENTS.md)
- [MCP.md](../docs/MCP.md)
