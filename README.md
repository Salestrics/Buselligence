<p align="center">
  <img src="./Buselligence_Logo" alt="Buselligence — Unlocking the Power of AI" width="520" />
</p>

<h1 align="center">AI for Everyone. Owned by Everyone.</h1>

<p align="center">
  <strong>The open-source runtime for building, running, and extending AI-powered applications.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://github.com/Salestrics/Buselligence"><img src="https://img.shields.io/badge/Built%20with-Buselligence%20AI%20Runtime-6366f1" alt="Built with Buselligence" /></a>
</p>

---

## 60-second Hello World

```bash
git clone https://github.com/Salestrics/Buselligence.git
cd Buselligence
npm install
npm run setup
npm run dev
```

Open **http://localhost:5173/start** — create an agent, connect MCP, generate an app, run it.

Demo login: `demo@buselligence.com` / `demo123456`

## Build Anything Mode

**Describe it. Watch it come alive.**

```bash
npm run dev
# Open http://localhost:5173/build
```

Or: `npm run bus -- build "restaurant inventory platform"`

See [docs/GENESIS.md](docs/GENESIS.md).

## Buselligence CLI

```bash
npm run bus -- hello
npm run bus -- create my-agent
npm run bus -- create crm --ai      # Full AI app: agent, DB, UI, API, tests, docs
npm run bus -- add mcp github
npm run bus -- deploy
npm run bus -- test agent my-agent
npm run bus -- evaluate software_engineer "Generate REST API"
```

## Why Buselligence?

> AI should be programmable, extensible, and owned by everyone.

Not 200 features — one primitive: the **Buselligence Kernel**.

Read [docs/WHY.md](docs/WHY.md) or visit [/why](http://localhost:5173/why).

## Buselligence Kernel

Everything runs through the unified execution layer:

**Identity · Context · Permissions · Memory · Tools · Agents · Models · Events · Execution**

| Capability | Description |
|------------|-------------|
| Skills | Reusable capabilities agents compose |
| Agent registry | Versioned lifecycle with permissions |
| Evaluation | Accuracy, cost, speed, reliability benchmarks |
| Observability | Full AI execution traces |
| Cost intelligence | BYOK token and spend tracking |
| buselligence.lock | Reproducible AI environments |
| Extension SDK | `createBuselligencePlugin()` |
| Local-first | Local models, embeddings, offline dev |

See [docs/KERNEL.md](docs/KERNEL.md).

## Reference applications

| Example | Shows |
|---------|-------|
| [personal-ai-assistant](examples/personal-ai-assistant) | Memory, tools, agents |
| [ai-coding-agent](examples/ai-coding-agent) | Monaco, repo understanding, execution |
| [bi-analyst](examples/bi-analyst) | Data connectors, SQL, insights |
| [autonomous-business-app](examples/autonomous-business-app) | Agents, workflows, automation |

## URLs

| URL | Description |
|-----|-------------|
| http://localhost:5173/build | **Build Anything** — AI Project Genesis |
| http://localhost:5173/start | Hello World — 60-second wow |
| http://localhost:5173/why | Why Buselligence |
| http://localhost:5173/kernel | Kernel dashboard |
| http://localhost:5173/workspace | AI workspace |
| http://localhost:5173/studio | Developer studio |
| http://localhost:5173/chat | Universal assistant |

## Documentation

Full docs at [docs/README.md](docs/README.md):

| Section | Docs |
|---------|------|
| Getting Started | [GETTING_STARTED.md](docs/GETTING_STARTED.md) |
| Architecture | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| AI Runtime | [KERNEL.md](docs/KERNEL.md), [AGENTS.md](docs/AGENTS.md), [SKILLS.md](docs/SKILLS.md) |
| MCP & Extensions | [MCP.md](docs/MCP.md), [EXTENSIONS.md](docs/EXTENSIONS.md) |
| Deployment | [DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md), [ROADMAP.md](ROADMAP.md) |

## Powered by Buselligence

```markdown
[![Built with Buselligence](https://img.shields.io/badge/Built%20with-Buselligence%20AI%20Runtime-6366f1)](https://github.com/Salestrics/Buselligence)
```

See [docs/BADGE.md](docs/BADGE.md).

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) and [DEVELOPMENT.md](DEVELOPMENT.md).

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Salestrics Inc.
