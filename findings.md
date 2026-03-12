# Monthly Sweep Simulator — Findings

## Research & Discoveries

### 2026-03-12 — Discovery Complete

**Magnet Identity**
- Trust magnet — makes Hearth's Monthly Sweep service tangible
- Core thesis: owners don't know what a clean statement looks like. Showing them one builds instant trust.
- One-line spec: "Turn a skeptical LTR owner into a high-intent switch lead by showing a believable sample monthly statement, expected distribution, reserve recommendation, and clear division of responsibility."

**Architecture Pattern — Mirrors `ltr-leaseup`**
- `ltr-leaseup` project already deployed at `leaseup.hearthproperty.com`
- Uses: Next.js App Router + TypeScript + vanilla CSS + Vercel serverless
- Pattern: `lib/` for atomic functions (types, scoring, close, discord, config)
- Pattern: `app/api/submit/route.ts` as sole API route
- Pattern: `app/results/page.tsx` for result display
- Pattern: `app/components/` for form + result components
- Uses Zod for schema validation
- Same Close CRM custom field IDs are reused (repurposed for this lead magnet)
- Same Discord webhook pattern (fire-and-forget)
- Result URL passes data via base64-encoded query param

**Custom Field Reuse Strategy**
The user explicitly provided the same Close CRM custom field IDs from `ltr-leaseup`. For this project:
- `CLOSE_CF_PROPERTY_ADDRESS` → property address (same purpose)
- `CLOSE_CF_ASKING_RENT` → monthly rent (repurposed — was asking rent)
- `CLOSE_CF_DAYS_ON_MARKET` → switch timeline (repurposed — was days on market)
- `CLOSE_CF_URGENCY_SCORE` → lead score + classification (same purpose)
- `CLOSE_CF_AUDIT_SUMMARY` → sweep summary string (repurposed — was audit summary)
- `CLOSE_CF_LEAD_SOURCE` → "Monthly Sweep Simulator" (same purpose)

**PDF Generation**
- Research confirms: `puppeteer-core` + `@sparticuz/chromium-min` is the standard for Vercel serverless PDF generation
- `jspdf` / `html2canvas` are client-side only — not viable for server-side
- Recommended versions: `@sparticuz/chromium-min@^129.0.0` + `puppeteer-core@^23.5.0`
- Need to increase Vercel function size limit (may need `maxDuration` config)
- Alternative: client-side `window.print()` with print stylesheet (simpler, fallback option)

**Scoring Signals**
| Signal | Points | Rationale |
|---|---|---|
| Self-managed | +15 | Higher pain, no current PM relationship |
| Current PM | +10 | Already paying, easier switch |
| No clean statement today | +20 | Core pain point — highest signal |
| Multiple pass-through categories (2+) | +10 | Complexity = confusion |
| Switch in next 60 days | +20 | Urgency signal |
| 2+ units | +15 | Portfolio scale = more value |

**Max score: 80** (self-managed) or **75** (current PM)

**Statement Formula**
- Management fee: 8% of gross rent (fixed)
- Reserve: max(5% of rent, $250)
- Utilities: tenant=$0, owner=5% of rent, split=2.5% of rent
- All monetary calculations round to 2 decimal places

**Discord Webhook**
- Different webhook URL than leaseup (different channel)
- Same embed pattern but different fields

**Key Differences from `ltr-leaseup`**
1. No Zillow scraping — this is a direct input form
2. More input fields (repairs, reserves, utilities, pass-throughs, etc.)
3. Statement generation is the core output (not scoring audit)
4. PDF download is v1 requirement (was v1.1 for leaseup)
5. "Owner Approves vs Hearth Handles" is fixed content in results
6. Reserve recommendation is calculated, not a finding
7. Form needs to be multi-step (more inputs)

### Open Questions — NONE
All discovery questions answered. Blueprint ready for approval.
