# Buselligence Desktop Runtime

**Your AI development environment in one click.**

> Buselligence is an AI computer for developers.

Native AI development environment — Cursor + GitHub Codespaces + VS Code + AI Agents, open source and extensible.

## Tagline

Traditional setup:
```
Install editor → extensions → clone → deps → env → AI keys → tools
```

Buselligence:
```
Install Buselligence → Connect GitHub → Build.
```

## Features

### 1. Desktop App (Tauri)

- `Buselligence.exe` / `.dmg` / `.AppImage`
- Local Monaco instance
- Native filesystem
- Terminal integration
- Git integration
- Multi-workspace manager

### 2. One-Click Workspace Provisioning

Select a GitHub repo → Buselligence automatically:
- Clones repo
- Installs dependencies
- Configures environment
- Detects frameworks
- Creates AI context
- Starts runtime

### 3. Local Development Agent

AI uses the user's machine:

| Tool | Capability |
|------|------------|
| Filesystem | Read/write project files |
| Terminal | npm, git, docker, etc. |
| Git | Version control |
| Package Manager | npm, pnpm, yarn, cargo, go |
| Browser | Preview apps |
| Database | Local connections |
| Docker | Containers |

### 4. Project Intelligence

Auto-scan on open:
- Framework (Next.js, React, etc.)
- Language, database, architecture
- Entry points and important files

### 5. Command Bridge

Safe command execution with permissions:
- Read files / Modify files / Run commands / Install packages / Deploy
- Ask before execution (default: ON)

### 6. Offline / Local Mode

```
Buselligence Desktop → Local AI Runtime → Ollama / llama.cpp
```

### 7. GitHub-Native Workflow

Login → Select org → Select repo → Create workspace → AI understands project

### 8. Workspace Snapshots

Checkpoints before AI changes — rollback available.

### 9. Multi-Workspace Manager

```
Salestrics      ✓ Running
Client Project  ✓ Running
AI Experiment   ○ Stopped
```

## UI

http://localhost:5173/desktop

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/desktop` | Desktop runtime info |
| `GET /api/desktop/github` | GitHub orgs & repos |
| `POST /api/desktop/workspaces/provision` | One-click provision |
| `GET /api/desktop/workspaces` | List workspaces |
| `POST /api/desktop/command` | Command bridge |
| `GET/PUT /api/desktop/permissions` | AI permissions |
| `GET/POST /api/desktop/workspaces/:id/snapshots` | Checkpoints |

## Build native app

```bash
cd desktop
npm install
npm run dev    # Tauri dev mode
npm run build  # Buselligence-setup.exe
```

## Environment

```bash
OLLAMA_BASE_URL=http://localhost:11434
DESKTOP_OFFLINE=true
```
