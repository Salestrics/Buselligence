# Client

React + Vite frontend for Buselligence.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (proxies `/api` to `:3001`) |
| `npm run build` | Production build |
| `npm run lint` | Run Oxlint |

## Routes

| Path | Page |
|------|------|
| `/` | Landing page |
| `/chat` | BI chat interface |
| `/settings` | BYOK provider + MCP configuration |
| `/sign-in` | Sign in |
| `/sign-up` | Create account |

The dev server proxies API requests to the backend — see `vite.config.ts`.
