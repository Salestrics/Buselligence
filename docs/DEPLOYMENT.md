# Deployment

Deploy Buselligence and AI applications built on the runtime.

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
| `OPENAI_API_KEY` | No | Demo mode only |
| `KMS_PROVIDER` | No | aws, vault, gcp, local |

## Docker

```bash
docker build -t buselligence .
docker run -p 3001:3001 --env-file .env buselligence
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
