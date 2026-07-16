# The Buselligence Project — Examples

AI-native project templates for the Buselligence Kernel runtime.

> Source code: MIT License. Buselligence™ and The Buselligence Project™ are trademarks of Salestrics Inc. Forks and derivatives should use their own branding. See [docs/TRADEMARK.md](../docs/TRADEMARK.md).

## Official reference applications

| Example | Demonstrates |
|---------|--------------|
| [personal-ai-assistant](./personal-ai-assistant) | Memory, tools, agents |
| [ai-coding-agent](./ai-coding-agent) | Monaco, repo understanding, execution |
| [bi-analyst](./bi-analyst) | Data connectors, SQL, insights |
| [autonomous-business-app](./autonomous-business-app) | Agents, workflows, automation |

## Templates

| Example | Description |
|---------|-------------|
| [ai-chatbot](./ai-chatbot) | Conversational AI with memory and tool use |
| [autonomous-agent](./autonomous-agent) | Self-directed agent with planning and execution |
| [crm-app](./crm-app) | CRM with AI insights |
| [analytics-dashboard](./analytics-dashboard) | Data visualization and BI |
| [coding-agent](./coding-agent) | AI pair programmer with codebase context |
| [mcp-server](./mcp-server) | Custom Model Context Protocol server |
| [rag-system](./rag-system) | RAG with local embeddings |
| [saas-builder](./saas-builder) | Full-stack SaaS starter |

## Quick start

```bash
# Copy a template
cp -r examples/ai-chatbot my-project
cd my-project

# Initialize with kernel lockfile
curl -X POST http://localhost:3001/api/kernel/lockfile \
  -H "Content-Type: application/json" \
  --cookie "session=..." \
  -d '{}'

# Run through the kernel
curl -X POST http://localhost:3001/api/kernel/execute \
  -H "Content-Type: application/json" \
  --cookie "session=..." \
  -d '{"action":"chat","input":{"message":"Hello"}}'
```

## buselligence.lock

Each project should include a `buselligence.lock` file for reproducible AI environments:

```json
{
  "version": "1.0.0",
  "models": { "default": "gpt-5.6-sol", "reasoning": "gpt-5.6-terra" },
  "agents": { "software_engineer": "1.0.0" },
  "skills": { "build-react-app": "1.0.0" },
  "mcpServers": ["filesystem"],
  "dependencies": { "buselligence": "8.0.0", "kernel": "1.0.0" }
}
```

Generate from the Kernel UI at `/kernel` or via the API.

## Learn more

- [Kernel documentation](../docs/KERNEL.md)
- [Platform overview](../docs/PLATFORM.md)
