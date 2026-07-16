# BI Analyst

Official reference application — data connectors, SQL, and AI-powered insights.

## What it demonstrates

- **Data connectors** — PostgreSQL, Snowflake, Salesforce
- **SQL generation** — natural language to queries
- **Insights** — analyst agents with semantic layer context

## Architecture

```
Business question
    ↓
Data Analyst agent
    ↓
Semantic layer (metrics, relationships, rules)
    ↓
Connector → SQL → Results → Narrative + charts
```

## Quick start

```bash
npm run dev
# Open http://localhost:5173/platform

# Connect data in Settings, then chat with Data Analyst
```

## Skills used

- `analyze-database`
- `analyze-metrics`

## Agents

- `data_analyst` — SQL and exploration
- `financial_analyst` — revenue metrics
- `executive_assistant` — cross-functional summaries

## Semantic layer

Define metrics at `/platform`:

```json
{
  "name": "Monthly Recurring Revenue",
  "formula": "SUM(subscriptions.amount)",
  "source": "postgres.revenue"
}
```

## Learn more

- [SEMANTIC_LAYER.md](../docs/SEMANTIC_LAYER.md)
- [PLATFORM.md](../docs/PLATFORM.md)
