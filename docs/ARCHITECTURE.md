# Buselligence Architecture (v8)

The open-source runtime for building, running, and extending AI-powered applications.

## Runtime architecture

```mermaid
flowchart TB
    subgraph Client["React Client"]
        Start["/start Hello World"]
        KernelUI["/kernel Dashboard"]
        Studio["/studio IDE"]
        Chat["/chat Assistant"]
        Workspace["/workspace Hub"]
    end

    subgraph API["Express API"]
        KernelRoutes["/api/kernel/*"]
        CoreRoutes["/api/core/*"]
        StudioRoutes["/api/studio/*"]
        ChatRoutes["/api/chat"]
    end

    subgraph Kernel["Buselligence Kernel"]
        Identity["Identity"]
        Context["Context"]
        Permissions["Permissions"]
        Memory["Memory"]
        Tools["Tools"]
        Agents["Agents"]
        Models["Models"]
        Events["Events"]
        Execution["Execution"]
    end

    Client --> API
    KernelRoutes --> Kernel
    Execution --> Identity & Context & Permissions & Memory
    Execution --> Tools & Agents & Models
    Execution --> Events
```

## Kernel execution flow

```mermaid
sequenceDiagram
    participant User
    participant Kernel
    participant Planner
    participant Skills
    participant Agent
    participant Model
    participant Trace

    User->>Kernel: execute(action, input)
    Kernel->>Trace: startTrace()
    Kernel->>Planner: routeModel(action)
    Planner->>Skills: resolveSkills()
    Planner->>Agent: getAgentFromRegistry()
    Agent->>Model: provider call
    Model-->>Kernel: response
    Kernel->>Trace: recordCost()
    Kernel->>Trace: completeTrace()
    Kernel-->>User: result + traceId
```

## Agent lifecycle

```mermaid
stateDiagram-v2
    [*] --> Defined: Agent definition
    Defined --> Registered: seedAgentRegistry()
    Registered --> Active: status=active
    Active --> Executing: kernelExecute()
    Executing --> Traced: observability
    Traced --> Evaluated: runEvaluation()
    Evaluated --> Active: benchmark recorded
    Active --> Deprecated: version bump
    Deprecated --> [*]
```

## MCP flow

```mermaid
flowchart LR
    User["User Settings"] --> MCPManager["MCP Manager"]
    MCPManager --> Stdio["stdio process"]
    MCPManager --> HTTP["HTTP/SSE server"]
    Stdio --> Tools["Namespaced tools"]
    HTTP --> Tools
    Tools --> Kernel["Kernel Tools layer"]
    Kernel --> Chat["Chat / Execute"]
    CLI["bus add mcp github"] --> MCPJson["mcp.json"]
    MCPJson --> MCPManager
```

## Memory architecture

```mermaid
flowchart TB
    subgraph Memory["Memory Engine"]
        ContextMem["Context memory"]
        ProjectMem["Project-scoped"]
        UserMem["User-scoped"]
    end

    Kernel --> Memory
    Chat --> Memory
    CoreRuntime["Core Runtime"] --> Memory
    PromptWorkspace["Prompt rules"] --> Memory
```

## Plugin system

```mermaid
flowchart TB
    SDK["Extension SDK"] --> Manifest["Plugin manifest"]
    Manifest --> Validate["validateExtension()"]
    Validate --> Registry["kernel_extensions"]
    Registry --> KernelTools["Kernel tools layer"]
    Hooks["onInstall / onExecute / onTrace"] --> Kernel
```

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, Tailwind |
| Backend | Express 5, TypeScript |
| Database | SQLite (better-sqlite3) |
| Auth | BetterAuth |
| AI | OpenAI, Anthropic, Google, local |
| Protocol | MCP (Model Context Protocol) |
| CLI | Node.js, TypeScript |

## Frontend routes

| Route | Purpose |
|-------|---------|
| `/start` | Hello World — 60-second onboarding |
| `/why` | Why Buselligence |
| `/kernel` | Kernel dashboard |
| `/core` | AI Operating Layer |
| `/workspace` | AI workspace hub |
| `/studio` | Developer studio |
| `/chat` | Universal assistant |
| `/platform` | Data intelligence |
| `/settings` | BYOK, MCP |

## Database

Kernel tables: `kernel_skills`, `kernel_agent_registry`, `kernel_evaluations`, `kernel_prompts`, `kernel_traces`, `kernel_costs`, `kernel_lockfiles`, `kernel_extensions`, `kernel_community_items`.

See [KERNEL.md](./KERNEL.md) for API reference.

## Extension points

| Area | How to extend |
|------|---------------|
| Skills | Add to `kernel/skills.ts` or community |
| Agents | `agents/definitions.ts` + registry |
| MCP | Settings UI or `bus add mcp` |
| Plugins | Extension SDK |
| CLI templates | `cli/src/lib/templates.ts` |
| Examples | `examples/` directory |

## Production

See [DEPLOYMENT.md](./DEPLOYMENT.md).
