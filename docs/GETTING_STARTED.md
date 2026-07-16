# Getting Started

Get from zero to wow in 60 seconds.

## Prerequisites

- Node.js 20+
- npm 10+

## 1. Clone and install

```bash
git clone https://github.com/Salestrics/Buselligence.git
cd Buselligence
npm install
npm run setup
```

`npm run setup` installs client/server/cli dependencies, runs database migrations, and seeds a demo user.

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — at minimum set `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY` (generate with `openssl rand -base64 32`).

Optional: add `OPENAI_API_KEY` for anonymous demo chat.

## 3. Start development

```bash
npm run dev
```

| URL | What to do |
|-----|------------|
| http://localhost:5173/start | **Hello World** — guided 60-second experience |
| http://localhost:5173/workspace | Open AI workspace |
| http://localhost:5173/kernel | Skills, agents, traces, costs |
| http://localhost:5173/studio | Generate and run apps |
| http://localhost:5173/settings | Connect MCP servers |

## 4. Sign in

Demo account (created by `npm run setup`):

```
Email:    demo@buselligence.com
Password: demo123456
```

Or create your own account at `/sign-up`.

## 5. The wow moment

On `/start`, click **Run the wow demo**. This will:

1. Install a built-in skill
2. Create a Studio project
3. Generate a CRM app with AI
4. Execute through the Buselligence Kernel (trace + cost recorded)

## CLI workflow

```bash
npm run bus -- hello
npm run bus -- create my-agent
npm run bus -- create crm --ai
npm run bus -- add mcp github
npm run bus -- deploy
npm run bus -- test agent my-agent
npm run bus -- evaluate software_engineer "Generate REST API"
```

## Next steps

- Read [KERNEL.md](./KERNEL.md) for the runtime primitive
- Browse [examples/](../examples/) for reference applications
- Read [WHY.md](./WHY.md) for the philosophical anchor
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production

## Troubleshooting

**Sign-in fails:** Run `npm run db:seed --prefix server` to recreate the demo user.

**Port in use:** Change `PORT` in `.env` (default 3001).

**No AI responses:** Add your API key in Settings (BYOK) or set `OPENAI_API_KEY` in `.env`.
