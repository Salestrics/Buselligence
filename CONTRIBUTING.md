# Contributing to Buselligence

Thank you for helping make Buselligence a better open-source BI chatbot. This project is MIT-licensed — contributions are welcome.

## Getting started

```bash
git clone https://github.com/Salestrics/Buselligence.git
cd Buselligence
npm install
npm install --prefix client
npm install --prefix server
cp .env.example .env
npm run dev
```

## Development workflow

1. Create a branch from `main`
2. Make focused changes with clear commit messages
3. Run `npm run build` to verify client and server compile
4. Open a pull request with a description of what changed and why

## Project structure

```
├── client/          # React frontend
├── server/          # Express API
├── docs/            # Documentation
├── README.md
└── LICENSE          # MIT
```

## Areas we'd love help with

- Additional AI providers (Mistral, Ollama, OpenRouter)
- OAuth sign-in providers via BetterAuth
- PostgreSQL database adapter
- Docker / docker-compose setup
- MCP server presets and examples
- Tests for chat, settings, and MCP flows
- Accessibility improvements

## Code style

- Match existing TypeScript patterns
- Keep changes minimal and focused
- Prefer extending existing abstractions over duplication
- Update docs when changing behavior or env vars

## Security

If you discover a security issue involving API key handling or MCP execution, please report it responsibly rather than opening a public issue with exploit details.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
