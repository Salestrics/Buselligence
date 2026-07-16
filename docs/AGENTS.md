# Agents

Agents are versioned AI workers in the Buselligence runtime.

## Agent Registry

Every agent has lifecycle metadata:

```
Name: Security Reviewer
Version: 1.2.0
Capabilities: Code scanning, Dependency analysis
Permissions: Read repository, Run tests
Status: Active
```

View and manage at `/kernel` → Agents, or via `GET /api/kernel/registry`.

## Creating agents

### CLI

```bash
bus create my-agent
bus test agent my-agent
bus evaluate my-agent "Review security of auth module"
```

### Kernel API

```bash
POST /api/kernel/execute
{
  "action": "run_agent",
  "agentId": "software_engineer",
  "input": { "task": "Implement user auth" }
}
```

## Built-in agents

17 specialized agents in `server/src/agents/definitions.ts`:

- Universal Assistant, Software Engineer, Code Review
- Data Analyst, Financial Analyst, Sales Analyst
- Business Analyst, Research Assistant, and more

## Agent lifecycle

```
Define → Register → Install skills → Execute → Trace → Evaluate → Version
```

## Evaluation

```bash
bus evaluate software_engineer "Generate REST API"
```

Tracks: accuracy, cost, speed, reliability, tool usage.

See [KERNEL.md](./KERNEL.md) for the evaluation framework.
