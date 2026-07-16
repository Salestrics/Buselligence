# Development Guide

Part of **The Buselligence Project** (MIT). Buselligence™ is a trademark of Salestrics Inc. See [docs/TRADEMARK.md](docs/TRADEMARK.md).

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
git clone https://github.com/Salestrics/Buselligence.git
cd Buselligence
npm install
npm run setup
cp .env.example .env
npm run dev
```

## Project structure

```
Buselligence/
├── client/          React frontend (Vite + TypeScript)
├── server/          Express API (TypeScript)
├── cli/             Bus CLI (bus create, deploy, evaluate)
├── docs/            Platform documentation
├── examples/        Reference applications and templates
├── assets/          Badges and shared assets
└── scripts/         Setup and utility scripts
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server |
| `npm run build` | Build client, server, CLI |
| `npm run setup` | Install deps, migrate, seed |
| `npm run bus -- <cmd>` | Run CLI |
| `npm run db:seed --prefix server` | Seed demo user |

## Server development

```bash
cd server
npm run dev          # tsx watch
npm run build        # tsc
npm run db:migrate   # BetterAuth migrations
```

Key entry: `server/src/index.ts`

Route modules register via `register*Routes(app, getSession)`.

## Client development

```bash
cd client
npm run dev          # Vite dev server :5173
npm run build        # Production build
```

## CLI development

```bash
cd cli
npm run build
node dist/index.js hello
```

## Database

SQLite in `server/data/`:

- `buselligence.db` — app tables (kernel, studio, platform, etc.)
- `auth.db` — BetterAuth

Schema files: `server/src/*/schema.ts` (imported at startup).

## Adding a kernel feature

1. Types in `server/src/kernel/types.ts`
2. Logic in appropriate module
3. Route in `server/src/kernel/routes.ts`
4. Client API in `client/src/lib/kernel-api.ts`
5. UI in `client/src/pages/KernelPage.tsx`
6. Docs in `docs/KERNEL.md`

## Testing

```bash
npm run build   # TypeScript compile check
bus test agent software_engineer
bus evaluate software_engineer "Generate REST API"
```

## Demo credentials

```
demo@buselligence.com / demo123456
```

Created by `npm run db:seed --prefix server`.
