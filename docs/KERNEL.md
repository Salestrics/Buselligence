# Buselligence Kernel

**The open-source runtime for building, running, and extending AI-powered applications.**

*Part of The Buselligence Project (MIT). Buselligence™ is a trademark of Salestrics Inc. See [TRADEMARK.md](./TRADEMARK.md).*

## Primitive

Like Linux has a kernel, Kubernetes has orchestration, and MCP has tools — Buselligence has the **Kernel**: a unified execution layer that makes any feature AI-capable automatically.

```
Buselligence Kernel
├── Identity      — who is executing
├── Context       — project, environment, intent
├── Permissions   — granted and denied capabilities
├── Memory        — persistent context across sessions
├── Tools         — built-in + MCP + skills
├── Agents        — versioned, registered AI workers
├── Models        — routed by task type
├── Events        — execution lifecycle
└── Execution     — unified run path for all features
```

## Architecture

Every AI action flows through `kernelExecute()`:

```
User Request
    ↓
Kernel Planner (route model, resolve skills, check permissions)
    ↓
Agent / Skills
    ↓
Model Call
    ↓
Cost Recording + Memory Update
    ↓
Trace Completion → Final Output
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/kernel` | Kernel info and primitive |
| `GET /api/kernel/state` | Full kernel state for user |
| `POST /api/kernel/execute` | Execute through unified layer |
| `GET /api/kernel/skills` | List and install skills |
| `GET /api/kernel/registry` | Agent registry with versions |
| `POST /api/kernel/evaluations` | Run agent benchmarks |
| `GET /api/kernel/prompts` | Prompt engineering workspace |
| `GET /api/kernel/traces` | AI observability traces |
| `GET /api/kernel/costs` | Cost intelligence (BYOK) |
| `GET/POST /api/kernel/lockfile` | Reproducible environments |
| `GET /api/kernel/sdk` | Extension SDK spec |
| `GET /api/kernel/templates` | Project templates |
| `GET /api/kernel/local` | Local-first configuration |
| `GET /api/kernel/community` | Community hub (architected) |

## Skills System

Skills are reusable capabilities. Agents compose skills. Users install skills. Community can publish skills.

Built-in skills:

- `build-react-app` — Scaffold React applications
- `analyze-database` — Schema analysis and query optimization
- `generate-api` — REST/GraphQL endpoint generation
- `review-security` — OWASP and dependency scanning
- `create-presentation` — Slides and pitch decks
- `deploy-application` — One-click deployment
- `teach-concept` — Adaptive learning
- `analyze-metrics` — Business intelligence

## Agent Registry

Agents are versioned software:

```
Name: Security Reviewer
Version: 1.2.0
Capabilities: Code scanning, Dependency analysis
Permissions: Read repository, Run tests
Status: Active
```

## Evaluation Framework

Measure what matters:

- **Accuracy** — task completion quality
- **Cost** — token spend efficiency
- **Speed** — execution latency
- **Reliability** — success rate
- **Tool usage** — appropriate tool selection

## Prompt Workspace

IDE for AI behavior:

- System prompts
- Agent instructions
- Tool definitions
- Memory rules
- Model settings

Access at `/kernel` → Prompts tab.

## AI Observability

Full execution traces:

```
User Request → Agent Planner → Tool Calls → Model Responses → Final Output
```

## Cost Intelligence

Track tokens, models, cost per task. Optimization suggestions for BYOK users (e.g., "Could reduce 42% using GPT-5.6 Sol").

## buselligence.lock

Reproducible AI environments:

```json
{
  "version": "1.0.0",
  "models": { "default": "gpt-5.6-sol", "reasoning": "gpt-5.6-terra" },
  "agents": { "security_reviewer": "1.2.0" },
  "skills": { "build-react-app": "1.0.0" },
  "mcpServers": ["filesystem"],
  "dependencies": { "buselligence": "8.0.0", "kernel": "1.0.0" }
}
```

## Extension SDK

```typescript
import { createBuselligencePlugin } from '@buselligence/sdk';

export default createBuselligencePlugin({
  name: "Salesforce Agent",
  version: "1.0.0",
  tools: [
    { name: "query_accounts", description: "Query Salesforce accounts" },
    { name: "create_opportunity", description: "Create a new opportunity" },
  ],
  agents: ["sales_analyst"],
  skills: ["analyze-database"],
});
```

## Local-First

Your AI can run anywhere:

- Local models (Ollama, llama.cpp, vLLM)
- Local embeddings (nomic-embed-text)
- Local vector DB (SQLite-backed)
- Offline mode (`KERNEL_OFFLINE=true`)

## Examples

See [examples/](../examples/) for AI-native project templates:

- ai-chatbot, autonomous-agent, crm-app, analytics-dashboard
- coding-agent, mcp-server, rag-system, saas-builder

## UI

Kernel dashboard: http://localhost:5173/kernel

## Version

- Buselligence: **8.0.0**
- Kernel: **1.0.0**
