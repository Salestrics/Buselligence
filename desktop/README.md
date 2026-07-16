# Buselligence Desktop

**Your AI development environment in one click.**

Native desktop runtime built with **Tauri** — Cursor + GitHub Codespaces + VS Code + AI Agents, open source and extensible.

## Download

| Platform | File |
|----------|------|
| Windows | `Buselligence-setup.exe` |
| macOS | `Buselligence.dmg` |
| Linux | `Buselligence.AppImage` |

Build from source (requires Rust + Node.js):

```bash
# From repo root
npm run setup
npm install --prefix desktop

# Development
cd desktop && npm run dev

# Production build
cd desktop && npm run build
# Output: desktop/src-tauri/target/release/bundle/
```

## First launch

```
Install Buselligence
        ↓
Connect GitHub
        ↓
Choose Repository
        ↓
Provision Workspace
        ↓
Start Building
```

## Native capabilities

- Local Monaco editor (via embedded web UI)
- Native filesystem access
- Terminal & command bridge
- Git integration
- GitHub workspace provisioning
- Multi-workspace manager
- Workspace snapshots (rollback)
- Offline mode with Ollama / local models

## Architecture

```
Buselligence.exe (Tauri)
    ├── WebView → /desktop UI
    ├── Native filesystem bridge
    ├── Shell plugin → terminal commands
    └── Local AI Runtime
            ├── Ollama
            ├── llama.cpp
            └── Local embeddings
```

## Web fallback

The full Desktop Runtime UI is available in browser at:

http://localhost:5173/desktop

The native app adds filesystem, terminal, and offline capabilities.

See [docs/DESKTOP.md](../docs/DESKTOP.md).
