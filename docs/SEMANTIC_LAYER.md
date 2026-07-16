# Semantic Layer

Buselligence's semantic layer turns raw data into business meaning. Without it, the AI is an SQL generator. With it, Buselligence becomes an actual BI analyst.

## Concepts

### Metrics

Define KPIs with formulas, sources, and categories:

```json
{
  "name": "Net Revenue Retention",
  "slug": "nrr",
  "formula": "(Current Revenue - Churn - Contraction + Expansion) / Starting Revenue",
  "sources": ["stripe.customers", "salesforce.accounts"],
  "category": "revenue"
}
```

### Relationships

Map how entities connect:

```
Customer → Account → Subscription → Revenue
```

### Business Rules

Encode domain logic the AI must follow:

- Exclude test accounts (`is_test = false`)
- Recognize revenue monthly
- Enterprise customers = >500 employees

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/semantic/metrics` | GET/POST | List or create metrics |
| `/api/semantic/relationships` | GET/POST | Entity relationships |
| `/api/semantic/rules` | GET/POST | Business rules |
| `/api/semantic/seed` | POST | Seed default metrics (Revenue, NRR, CAC, Churn, Pipeline) |
| `/api/semantic/explain/:slug` | GET | "Explain this metric" narrative |

## Chat Integration

When you chat, the semantic layer is injected into the system prompt:

1. Metric definitions and formulas
2. Entity relationship graph
3. Active business rules
4. Connected data source names

## "Explain This Metric"

Click a metric or ask "Why is ARR up?" The AI traces:

- Deals won
- Expansions
- Churn
- Renewals
- Pipeline

…and writes an executive narrative — BI that operates, not just reports.

## UI

Manage everything at `/platform` → **Semantic Layer** tab.
