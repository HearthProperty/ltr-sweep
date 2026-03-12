# Monthly Sweep Simulator — Project Constitution

> **This file is LAW.** Update only when schemas change, rules are added, or architecture is modified.

---

## North Star

Get an LTR owner to trust Hearth enough to book a switch call or go directly into onboarding by making the owner money experience feel real, clean, and hands-free.

- **Primary KPI:** Booked switch call or click-through to onboarding
- **Secondary KPI:** Qualified lead captured in Close with enough information to follow up intelligently

---

## Integrations

### Required
- **Close CRM** — lead capture (source of truth for lead records)
- **Discord** — internal lead notifications (fire-and-forget)
- **Vercel** — hosting + serverless API routes (Done)
- **Squarespace DNS** — subdomain CNAME (Done)
- **GitHub** — repo + deploy workflow (Done)
- **PDF generation** — branded sample Monthly Sweep statement (puppeteer-core + @sparticuz/chromium-min)

### Optional (v1.1+)
- Analytics (PostHog, GA4)
- Email automation (transactional follow-up via Close sequences)

### Not Needed for v1
- AppFolio, Slack, Google Sheets, standalone database
- Email automation (can follow up inside Close)

### Credentials Required
- `CLOSE_API_KEY`
- `CLOSE_LEAD_STATUS_ID`
- `CLOSE_CF_PROPERTY_ADDRESS`
- `CLOSE_CF_ASKING_RENT` (repurposed for monthly rent)
- `CLOSE_CF_DAYS_ON_MARKET` (repurposed for switch timeline)
- `CLOSE_CF_URGENCY_SCORE`
- `CLOSE_CF_AUDIT_SUMMARY` (repurposed for sweep summary)
- `CLOSE_CF_LEAD_SOURCE`
- `DISCORD_WEBHOOK_URL`
- `NEXT_PUBLIC_SITE_URL` — `https://sweep.hearthproperty.com`

---

## Source of Truth

| Data | Owner |
|------|-------|
| Lead/contact metadata | Close CRM |
| Notification stream | Discord |
| Form submission payload | In-memory / server-side request |
| Scoring logic / rules | Hardcoded config in codebase |
| Statement generation | Deterministic formulas in codebase |
| Management fee | 8% of Rental Proceeds (hardcoded) |
| Reserve formula | 5% of monthly rent, $250 floor |
| Owner Approves / Hearth Handles | Fixed lists (hardcoded) |

No standalone database in v1.

---

## Delivery Payload

### To the Prospect (In-Browser)
- Branded sample Monthly Sweep statement
- Estimated net owner distribution
- Reserve recommendation
- "What you approve vs what Hearth handles" breakdown
- CTA: Book a Switch Call / Start Onboarding
- Downloadable PDF of the statement

### To Close CRM
| Field | Value |
|-------|-------|
| Lead name | `Monthly Sweep Lead: {ownerName} — {propertyAddress}` |
| Contact | name, email, phone |
| `CLOSE_CF_PROPERTY_ADDRESS` | property address |
| `CLOSE_CF_ASKING_RENT` | monthly rent |
| `CLOSE_CF_DAYS_ON_MARKET` | switch timeline |
| `CLOSE_CF_URGENCY_SCORE` | lead score + classification |
| `CLOSE_CF_AUDIT_SUMMARY` | summary string (rent, fee, management type, key findings) |
| `CLOSE_CF_LEAD_SOURCE` | "Monthly Sweep Simulator" |

### To Discord
Embed with: lead magnet name, owner name, email, phone, property address, monthly rent, current fee, management situation, switch date, score, primary problem, result link.

---

## Data Schema

### Form Input (client → server)

```json
{
  "ownerName": "string",
  "email": "string",
  "phone": "string",
  "propertyAddress": "string",
  "monthlyRent": "number",
  "managementFeeCurrent": "number",
  "managementType": "self-managed | current_pm",
  "numUnits": "number",
  "hasCleanStatement": "boolean",
  "avgMonthlyRepairs": "number",
  "reserveTarget": "number (optional)",
  "utilitiesResponsibility": "owner | tenant | split",
  "hoaPassthrough": "number",
  "passthroughCategories": "string[]",
  "desiredSwitchDate": "string (date)",
  "switchTimeline": "< 30 days | 30-60 days | 60-90 days | 90+ days"
}
```

### Statement Output (server → client)

```json
{
  "sampleStatement": {
    "grossRent": "number",
    "hearthManagementFee": "number (8% of grossRent)",
    "repairsEstimate": "number",
    "reserveContribution": "number",
    "hoaPassthrough": "number",
    "utilities": "number",
    "otherDeductions": "number",
    "totalDeductions": "number",
    "netOwnerDistribution": "number"
  },
  "reserveRecommendation": {
    "targetAmount": "number",
    "monthlyContribution": "number",
    "rationale": "string"
  },
  "approvalBreakdown": {
    "ownerApproves": [
      "Major repairs above threshold",
      "Unusual or non-routine spend",
      "Capital improvements",
      "Policy exceptions"
    ],
    "hearthHandles": [
      "Monthly Sweep statement generation",
      "Owner distribution cadence",
      "Pass-through itemization",
      "Routine coordination",
      "Maintenance triage and routing",
      "Vendor communication",
      "Approval requests when needed"
    ]
  },
  "leadScore": "number (0-90)",
  "scoreClassification": "low | moderate | high | immediate",
  "scoringBreakdown": "object"
}
```

### Scoring Logic (Deterministic)

| Signal | Points |
|--------|--------|
| Self-managed | +15 |
| Current PM | +10 |
| No clean statement today | +20 |
| Multiple pass-through categories (2+) | +10 |
| Switch in next 60 days (< 30 or 30-60) | +20 |
| 2+ units | +15 |

**Max possible: 80** (self-managed path) or **75** (current PM path)

Classification:
- 0–24: Low urgency
- 25–49: Moderate
- 50–74: High intent
- 75+: Immediate sales follow-up

### Close CRM Lead Payload (`POST /api/v1/lead/`)

```json
{
  "name": "Monthly Sweep Lead: {ownerName} — {propertyAddress}",
  "status_id": "env:CLOSE_LEAD_STATUS_ID",
  "contacts": [{
    "name": "{ownerName}",
    "emails": [{ "type": "office", "email": "{email}" }],
    "phones": [{ "type": "mobile", "phone": "{phone}" }]
  }],
  "custom.{CF_PROPERTY_ADDRESS}": "{propertyAddress}",
  "custom.{CF_ASKING_RENT}": "{monthlyRent}",
  "custom.{CF_DAYS_ON_MARKET}": "{switchTimeline}",
  "custom.{CF_URGENCY_SCORE}": "{leadScore}/{maxScore} — {scoreClassification}",
  "custom.{CF_AUDIT_SUMMARY}": "{summaryString}",
  "custom.{CF_LEAD_SOURCE}": "Monthly Sweep Simulator"
}
```

### Discord Webhook Embed

Fields: Lead Magnet, Owner, Email, Phone, Property, Monthly Rent, Current Fee, Manager, Switch Date, Score, Primary Problem, Result URL.

---

## Statement Formula

```
Gross Rent:                  {monthlyRent}
- Hearth Management Fee:     {monthlyRent * 0.08}
- Repairs Estimate:          {avgMonthlyRepairs}
- Reserve Contribution:      {max(monthlyRent * 0.05, 250) OR reserveTarget}
- HOA Pass-through:          {hoaPassthrough}
- Utilities:                 {utilitiesAmount based on responsibility}
---------------------------------
= Net Owner Distribution:   {grossRent - totalDeductions}
```

### Reserve Logic
- Default: 5% of monthly rent
- Floor: $250 minimum
- If repairs or pass-through complexity are high → show higher recommendation band
- Label: "Suggested operating reserve" (not exact accounting)

### Utilities Logic
- `tenant`: $0 (tenant pays)
- `owner`: estimate 5% of rent
- `split`: estimate 2.5% of rent

---

## Behavioral Rules

### Tone
Premium, clear, trustworthy, operational.
Not corporate-boring. Not playful. Not "fintech app."
Should feel like: *"These people know how rental money should move."*

### Copy Rules
- Emphasize hands-free service, not "software features"
- Result should feel like a mini consulting deliverable
- Form: short, high-conversion, minimum fields
- Strong CTA on every result page: Book a Switch Call / Start Onboarding
- Highlight urgency, not false precision

### Do Not
- Do not position Hearth as software
- Do not promise exact accounting outcomes
- Do not compare against specific competitors by name
- Do not make the statement look fake or overdesigned
- Do not use vague fluff like "better owner experience" without showing actual money flow
- Do not overload the page with jargon
- Do not require login or account creation
- Do not make AppFolio visible in the user experience
- Do not make it look like a generic landlord calculator
- Do not make it feel playful or gimmicky
- Do not make Close submission dependent on client-side JS only
- Do not make Discord the source of truth
- Do not add unnecessary integrations

---

## Architectural Invariants

- **Stack:** Next.js App Router · TypeScript · Vanilla CSS · Vercel Serverless
- **Pattern:** Mirrors `ltr-leaseup` project structure
- All business logic is deterministic (no LLM in critical path)
- All tools in `lib/` are atomic, testable functions
- Environment variables in `.env.local` (never hard-coded)
- Temporary files in `.tmp/` — ephemeral only
- SOPs in `architecture/` are updated **before** code changes
- Close CRM is the critical path — if Close fails, the submission fails
- Discord is fire-and-forget — if Discord fails, log but do not block
- All monetary calculations round to 2 decimal places
- Lead data must be captured before showing results (gated output)
- All actions happen synchronously on form submit (no cron, no queues)
- PDF generation via puppeteer-core + @sparticuz/chromium-min on Vercel serverless
- Project is only "complete" when payload reaches Close + Discord + results page

---

## Owner Approves vs Hearth Handles (Fixed)

### Owner Approves
- Major repairs above threshold
- Unusual or non-routine spend
- Capital improvements
- Policy exceptions

### Hearth Handles
- Monthly Sweep statement generation
- Owner distribution cadence
- Pass-through itemization
- Routine coordination
- Maintenance triage and routing
- Vendor communication
- Approval requests when needed

---

## Maintenance Log

| Date | Change | Author |
|---|---|---|
| 2026-03-12 | Initial constitution created | System Pilot |
| 2026-03-12 | Discovery complete. Full schema, behavioral rules, formulas, and architectural invariants finalized. | System Pilot |
