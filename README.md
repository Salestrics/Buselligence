# Buselligence

Business intelligence chatbot powered by **BizzyB**, the Buselligence AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- Marketing landing page
- BetterAuth sign-in (direct sign-up disabled)
- Optional invoice-verified account requests via external signup form
- Free anonymous chat with 50,000 token limit
- In-flight responses complete even when the limit is reached
- Saved conversations for authenticated users only

## Quick start

```bash
npm install
npm install --prefix client
npm install --prefix server
cp .env.example .env
npm run dev
```

- Frontend: http://localhost:5173
- API / Auth: http://localhost:3001

## Environment

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for BizzyB |
| `OPENAI_MODEL` | OpenAI model ID used by BizzyB (optional) |
| `BETTER_AUTH_SECRET` | Secret for BetterAuth sessions |
| `BETTER_AUTH_URL` | Server URL (default `http://localhost:3001`) |
| `CLIENT_URL` | Frontend URL for CORS (default `http://localhost:5173`) |
| `VITE_SIGNUP_FORM_URL` | Optional external account request form URL |
| `SEED_USER_EMAIL` | Demo user email for `db:seed` (optional) |
| `SEED_USER_PASSWORD` | Demo user password for `db:seed` (optional) |

## Demo user

After the server starts once (to initialize auth tables), seed a demo account:

```bash
npm run db:seed --prefix server
```

Default credentials (override with `SEED_USER_EMAIL` / `SEED_USER_PASSWORD`):

- Email: `demo@buselligence.com`
- Password: `demo123456`

## Account requests

New accounts can require invoice verification. Set `VITE_SIGNUP_FORM_URL` to your hosted signup or survey form. Direct sign-up is disabled in BetterAuth.

## Production

```bash
npm run build
NODE_ENV=production npm start
```

## License

MIT — see [LICENSE](LICENSE).
