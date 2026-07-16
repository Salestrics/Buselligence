# Contributing to The Buselligence Project

Thank you for contributing to the open-source AI runtime from Salestrics Inc.

## Quick links

- [Development Guide](./DEVELOPMENT.md)
- [Roadmap](./ROADMAP.md)
- [Documentation](./docs/README.md)
- [Branding & Trademark](./docs/TRADEMARK.md)

## How to contribute

1. **Fork** the repository
2. **Create a branch** — `cursor/your-feature-2871` or `feature/your-feature`
3. **Make changes** — follow existing code conventions
4. **Test** — `npm run build` must pass
5. **Commit** — clear, descriptive messages
6. **Open a PR** — use the pull request template

## Good first issues

Look for issues labeled `good first issue`:

- Documentation improvements
- Example templates
- CLI commands
- Skill definitions
- Test coverage

## Code guidelines

- Minimize scope — focused diffs only
- Match existing patterns in surrounding code
- No over-engineering or unnecessary abstractions
- TypeScript strict mode for server and client

## Areas we welcome contributions

| Area | Path |
|------|------|
| Kernel runtime | `server/src/kernel/` |
| CLI | `cli/` |
| Agents | `server/src/agents/` |
| Skills | `server/src/kernel/skills.ts` |
| Examples | `examples/` |
| Documentation | `docs/` |
| UI | `client/src/` |

## Branding and trademark

Contributions are welcome under the MIT License. Please note:

- **Contributions do not grant trademark rights.** Submitting a pull request does not give permission to use Buselligence™, The Buselligence Project™, logos, or official branding for separate products or services.
- **Unofficial products** built from forks or derivatives must not use Buselligence branding or imply they are the official Buselligence Project or Buselligence by Salestrics unless authorized by Salestrics Inc.
- **Forks should rebrand.** Use a different project name, your own logos, and a distinct visual identity. You may attribute that your project is based on The Buselligence Project source code.
- **Official repository branding** (logos, names in this repo) is for The Buselligence Project and official Salestrics distributions.

Full policy: [docs/TRADEMARK.md](docs/TRADEMARK.md).

## Community

- Be respectful and constructive
- AI should be owned by everyone — help make that real

## License

By contributing, you agree your contributions will be licensed under the MIT License.
