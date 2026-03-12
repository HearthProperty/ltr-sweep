# Monthly Sweep Simulator — Architecture SOP

## System Overview

The Monthly Sweep Simulator is a Next.js App Router application deployed on Vercel that generates sample owner statements for LTR property owners considering switching to Hearth Property Management.

## Data Flow

```
User fills 3-step form → POST /api/submit
  → Zod validates form input
  → statement.ts generates sample statement (deterministic math)
  → scoring.ts calculates lead score (deterministic rules)
  → reserve.ts generates reserve recommendation
  → close.ts creates lead in Close CRM (critical path)
  → discord.ts sends notification (fire-and-forget)
  → Response with all data → client redirects to /results?data=<base64>

Results page → decodes base64 → renders statement, distribution, reserve, approval breakdown
  → "Download PDF" → POST /api/pdf → puppeteer renders HTML → PDF

```

## Module Map

| Module | Purpose | Type |
|---|----|---|
| `lib/types.ts` | Zod schemas + TS types | Shared |
| `lib/config.ts` | Env vars + business constants | Shared |
| `lib/statement.ts` | Statement generation (8% fee, deductions) | Engine |
| `lib/reserve.ts` | Reserve recommendation (5%, $250 floor) | Engine |
| `lib/scoring.ts` | Lead scoring (6 signals, 0-80 max) | Engine |
| `lib/close.ts` | Close CRM lead creation | Integration |
| `lib/discord.ts` | Discord webhook embed | Integration |
| `lib/pdf.ts` | HTML template + puppeteer PDF gen | Integration |

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/submit` | POST | Main submission — validate, generate, score, push to CRM + Discord |
| `/api/pdf` | POST | PDF generation — accepts statement data, returns PDF binary |

## Statement Formula

```
Gross Rent:              monthlyRent
- Management Fee:        monthlyRent × 0.08
- Repairs:               avgMonthlyRepairs
- Reserve:               max(monthlyRent × 0.05, 250)  OR  reserveTarget
- HOA Pass-through:      hoaPassthrough
- Utilities:             tenant=$0 | owner=rent×0.05 | split=rent×0.025
= Net Distribution:      grossRent - totalDeductions
```

## Scoring Rules

| Signal | Points | Test |
|---|---|---|
| Self-managed | +15 | managementType === 'self-managed' |
| Current PM | +10 | managementType === 'current_pm' |
| No clean statement | +20 | !hasCleanStatement |
| 2+ pass-through categories | +10 | passthroughCategories.length >= 2 |
| Switch < 60 days | +20 | timeline is '< 30 days' or '30-60 days' |
| 2+ units | +15 | numUnits >= 2 |

Max: 80 (self-managed) / 75 (current PM)

Classification: 0-24 low, 25-49 moderate, 50-74 high, 75+ immediate

## Close CRM Field Mapping

| Env Var | Close Field | Value Sent |
|---|---|---|
| CLOSE_CF_PROPERTY_ADDRESS | Property Address | propertyAddress |
| CLOSE_CF_ASKING_RENT | Monthly Rent | monthlyRent (number) |
| CLOSE_CF_DAYS_ON_MARKET | Switch Timeline | switchTimeline (string) |
| CLOSE_CF_URGENCY_SCORE | Lead Score | "80/80 — immediate" |
| CLOSE_CF_AUDIT_SUMMARY | Sweep Summary | Multi-field summary string |
| CLOSE_CF_LEAD_SOURCE | Lead Source | "Monthly Sweep Simulator" |

## Error Handling

- **Close CRM fails:** Log error, return 200 anyway (lead data is in the response)
- **Discord fails:** Log error, never block submission
- **PDF fails:** Return 500 with error message
- **Validation fails:** Return 400 with field-level errors

## Edge Cases

- Reserve target is optional — defaults to max(5% of rent, $250)
- HOA and utilities can be $0 — hidden from statement when zero
- Pass-through categories are optional — used for scoring only
- Self-managed and current_pm are mutually exclusive scoring signals
