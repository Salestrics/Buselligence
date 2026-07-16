# Skills

Skills are reusable capabilities. Agents compose skills. Users install skills. Community can publish skills.

## Built-in skills

| Skill | Category | Description |
|-------|----------|-------------|
| `build-react-app` | development | Scaffold React applications |
| `analyze-database` | data | Schema analysis, query optimization |
| `generate-api` | development | REST/GraphQL endpoint generation |
| `review-security` | security | OWASP checks, dependency scanning |
| `create-presentation` | create | Slides and pitch decks |
| `deploy-application` | devops | One-click deployment |
| `teach-concept` | learn | Adaptive tutoring |
| `analyze-metrics` | data | Business intelligence |

## Install skills

### UI

`/kernel` → Skills → Install

### API

```bash
POST /api/kernel/skills/{id}/install
```

### CLI

Skills are referenced in `buselligence.lock` and agent configs.

## Create custom skills

Community skills follow the same manifest as built-ins:

```json
{
  "slug": "my-skill",
  "name": "My Skill",
  "version": "1.0.0",
  "category": "custom",
  "description": "What this skill does"
}
```

## Skill resolution

When executing through the kernel, skills are resolved in order:

1. Explicitly requested `skillIds`
2. Installed skills for the user
3. Built-in defaults (top 3 installed)

See [KERNEL.md](./KERNEL.md) for execution flow.
