# Deployment

Deploy **The Buselligence Project** and AI applications built on the runtime. Source: MIT License. Trademarks: [TRADEMARK.md](./TRADEMARK.md).

## Development

```bash
npm run setup
npm run dev
```

## Production build

```bash
npm run build
NODE_ENV=production npm start
```

Express serves the built client from `client/dist`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | Yes | Auth signing secret |
| `ENCRYPTION_KEY` | Yes | API key encryption |
| `PORT` | No | Server port (default 3001) |
| `CLIENT_URL` | No | CORS origin (default localhost:5173) |
| `OPENAI_API_KEY` | No | Anonymous demo only when `ALLOW_SERVER_DEMO_KEY` is not `false` |
| `MCP_ALLOW_STDIO` | No | Default `false` — enable only with `MCP_STDIO_ALLOWLIST` |
| `KMS_PROVIDER` | No | `local`, `aws_kms`, `vault`, `gcp_kms` |

## Docker

```bash
docker compose up --build
```

Required secrets in `.env`: `BETTER_AUTH_SECRET`, `ENCRYPTION_KEY`. SQLite data persists in the `buselligence-data` volume.

Single-container alternative:

```bash
docker build -t buselligence .
docker run -p 3001:3001 -v buselligence-data:/app/server/data --env-file .env buselligence
```

## CLI deploy

```bash
bus deploy
```

Deploys from current directory using `buselligence.lock` for environment pinning.

## Studio deploy

From `/studio` → Deploy tab, or:

```bash
POST /api/studio/projects/{id}/deploy
```

## Data persistence

SQLite databases in `server/data/`:

- `buselligence.db` — application data
- `auth.db` — user sessions

Back up or migrate to PostgreSQL for scale.

## Security checklist

- [ ] Strong `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY`
- [ ] `KMS_PROVIDER=aws` or `vault` for production
- [ ] `DISABLE_SIGN_UP=true` if self-serve not needed
- [ ] HTTPS reverse proxy (nginx, Caddy)
- [ ] MCP stdio processes isolated in containers
