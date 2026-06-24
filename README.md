# Buselligence

Business intelligence ChatGPT-style chatbot powered by **GPT-5.4-mini**.

## Features

- Marketing landing page
- BetterAuth sign-in (direct sign-up disabled)
- Invoice-verified account requests via [PostHog hosted form](https://us.posthog.com/external_surveys/019ef6e9-52a9-0000-3656-79f8425b5e13)
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
| `OPENAI_API_KEY` | OpenAI API key for GPT-5.4-mini |
| `BETTER_AUTH_SECRET` | Secret for BetterAuth sessions |
| `BETTER_AUTH_URL` | Server URL (default `http://localhost:3001`) |
| `CLIENT_URL` | Frontend URL for CORS (default `http://localhost:5173`) |
| `VITE_SIGNUP_FORM_URL` | PostHog invoice request form URL |

## Demo user

After the server starts once (to initialize auth tables), seed a demo account:

```bash
npm run db:seed --prefix server
```

Default credentials:
- Email: `demo@buselligence.com`
- Password: `demo123456`

## Account requests

New accounts require invoice verification. Users submit the [Buselligence Account Request form](https://us.posthog.com/external_surveys/019ef6e9-52a9-0000-3656-79f8425b5e13) on PostHog. Direct sign-up is disabled in BetterAuth.

## Production

```bash
npm run build
NODE_ENV=production npm start
```
