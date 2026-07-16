# AI Outbound

AI Outbound is Buselligence's **web lead discovery and contact management** layer. It crawls the public web to find business leads matching your ideal customer profile (ICP), qualifies them with your BYOK AI provider, and feeds them into a lightweight CRM.

## How it works

```
Campaign (ICP) → Web Search (Tavily/Serper/Brave) → AI Lead Extraction → Leads → Contacts → Pipeline
```

1. **Define a campaign** — industry, keywords, geography, target titles, company size
2. **Run discovery** — Buselligence generates search queries and crawls the web
3. **AI qualification** — your OpenAI/Anthropic/Google key extracts structured leads with relevance scores
4. **Contact management** — convert leads to contacts, track stages, log activities

## Search providers (BYOK)

| Provider | Best for | Get a key |
|----------|----------|-----------|
| Tavily | AI-native research, lead agents | [tavily.com](https://tavily.com) |
| Serper | Google-quality results | [serper.dev](https://serper.dev) |
| Brave | Independent index, free tier | [brave.com/search/api](https://brave.com/search/api) |

Configure in **AI Outbound → Dashboard → Web search API**.

Keys are encrypted at rest with AES-256-GCM, same as AI provider keys.

## Campaign fields

| Field | Example | Purpose |
|-------|---------|---------|
| Name | `Q1 SaaS VP Sales` | Campaign identifier |
| Industry | `B2B SaaS` | ICP vertical |
| Keywords | `usage-based pricing, PLG` | Search terms |
| Geography | `United States` | Location filter |
| Target titles | `VP Sales, CRO, Head of Revenue` | Decision-maker focus |
| Company size | `50-500 employees` | Firmographic filter |
| Custom queries | Optional manual search strings | Override auto-generated queries |

## Lead lifecycle

| Status | Meaning |
|--------|---------|
| `new` | Just discovered |
| `qualified` | Marked as good fit |
| `converted` | Promoted to contact |
| `contacted` | Outreach started |
| `dismissed` | Not a fit |

## Contact pipeline stages

`new` → `researching` → `contacted` → `replied` → `qualified` → `customer`

Or `unqualified` to exit the pipeline.

## Contact management features

- **Companies** — auto-created from discovered leads, deduplicated by name/domain
- **Contacts** — manual entry or convert from leads
- **Activity timeline** — notes, calls, emails, meetings, status changes
- **Stage tracking** — pipeline management per contact
- **Follow-ups** — `nextFollowUpAt` field (API-supported)

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/outbound/stats` | Pipeline stats |
| `GET/PUT` | `/api/outbound/settings` | Search API config |
| `POST` | `/api/outbound/settings/test` | Test search connection |
| `GET/POST` | `/api/outbound/campaigns` | Campaign CRUD |
| `POST` | `/api/outbound/campaigns/:id/run` | Run lead discovery |
| `GET/PATCH/DELETE` | `/api/outbound/leads` | Lead management |
| `POST` | `/api/outbound/leads/:id/convert` | Convert lead → contact |
| `GET/POST/PUT/DELETE` | `/api/outbound/contacts` | Contact CRUD |
| `GET/POST/PUT/DELETE` | `/api/outbound/companies` | Company CRUD |
| `GET/POST` | `/api/outbound/activities` | Activity timeline |

## Example: run a campaign via API

```bash
# Create campaign
curl -X POST http://localhost:3001/api/outbound/campaigns \
  -H "Content-Type: application/json" \
  --cookie "session=..." \
  -d '{
    "name": "Series A SaaS",
    "industry": "B2B SaaS",
    "keywords": ["usage-based", "product-led growth"],
    "geography": "United States",
    "targetTitles": ["VP Sales", "CRO"]
  }'

# Run discovery
curl -X POST http://localhost:3001/api/outbound/campaigns/<id>/run \
  --cookie "session=..."
```

## Requirements

- Signed-in user with **AI provider key** (for lead extraction)
- **Search API key** (for web discovery)
- Both configured under Settings / Outbound Dashboard

## Privacy & compliance

- Only searches the public web via your search provider
- You are responsible for compliance with outreach laws (CAN-SPAM, GDPR, etc.)
- Do not scrape personal data beyond what search APIs return
- Review leads before outreach — AI extraction may need manual verification
