# Monthly Sweep Simulator — Task Plan

## Project: Monthly Sweep Simulator (Lead Magnet / Trust Magnet)
**Status:** 🟡 Phase 1 — Blueprint Complete, Awaiting Approval

---

## Phase 0: Initialization ✅
- [x] Create `task_plan.md`
- [x] Create `findings.md`
- [x] Create `progress.md`
- [x] Create `gemini.md` (Project Constitution)
- [x] Discovery Questions answered
- [x] Data Schema defined in `gemini.md`
- [ ] **Blueprint approved by user** ← BLOCKING

## Phase 1: Blueprint (Vision & Logic) ✅
- [x] Discovery answers captured
- [x] Data schema (input/output JSON shapes) finalized
- [x] Scoring logic formalized (6 signals, max 80 pts)
- [x] Statement formula defined (8% fee, 5% reserve, utilities logic)
- [x] Research: studied `ltr-leaseup` patterns, PDF generation, Close CRM field reuse
- [x] `gemini.md` updated as Project Constitution
- [ ] **Blueprint approved by user** ← BLOCKING

## Phase 2: Link (Connectivity)
- [ ] Initialize Next.js project (mirror `ltr-leaseup` structure)
- [ ] Create `.env.local` with all credentials
- [ ] Verify Close CRM API connection
- [ ] Verify Discord webhook
- [ ] Test PDF generation library

## Phase 3: Architect (3-Layer Build)
### Architecture SOPs
- [ ] `architecture/form-flow.md` — multi-step form UX
- [ ] `architecture/statement-engine.md` — statement generation logic
- [ ] `architecture/scoring-engine.md` — lead scoring logic
- [ ] `architecture/integrations.md` — Close + Discord + PDF

### Lib Modules
- [ ] `lib/types.ts` — Zod schemas + TypeScript types
- [ ] `lib/config.ts` — centralized env config
- [ ] `lib/statement.ts` — statement generation (deterministic)
- [ ] `lib/scoring.ts` — lead scoring engine
- [ ] `lib/reserve.ts` — reserve recommendation logic
- [ ] `lib/close.ts` — Close CRM lead creation
- [ ] `lib/discord.ts` — Discord webhook notification
- [ ] `lib/pdf.ts` — PDF generation

### API Routes
- [ ] `app/api/submit/route.ts` — validate → generate → score → Close + Discord → respond
- [ ] `app/api/pdf/route.ts` — PDF generation endpoint

## Phase 4: Stylize (Refinement & UI)
- [ ] `app/globals.css` — design system (premium, operational aesthetic)
- [ ] Landing page with headline + form
  - [ ] Multi-step form component
  - [ ] Step 1: Contact info (name, email, phone)
  - [ ] Step 2: Property info (address, rent, fee, management type)
  - [ ] Step 3: Estimate inputs (repairs, reserves, utilities, HOA, switch date)
- [ ] Results page
  - [ ] Sample Monthly Sweep statement
  - [ ] Net owner distribution highlight
  - [ ] Reserve recommendation
  - [ ] "Owner Approves vs Hearth Handles" breakdown
  - [ ] PDF download button
  - [ ] CTA: Book a Switch Call / Start Onboarding
- [ ] Mobile responsive
- [ ] Premium visual design
- [ ] User feedback round

## Phase 5: Trigger (Deployment)
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Configure `sweep.hearthproperty.com` subdomain in Squarespace DNS
- [ ] Set environment variables in Vercel
- [ ] End-to-end test: form → results → Close lead → Discord alert → PDF download
- [ ] Documentation finalized in `gemini.md`

---

## Primary Problem Values Addressed
1. Messy statements
2. Unclear owner payout
3. Approval confusion
4. Too many pass-through surprises
5. No real portfolio visibility

## Key Architecture Decisions
- **Mirrors `ltr-leaseup`** pattern for consistency
- **No Zillow scraping** — direct property input
- **Multi-step form** — more inputs than leaseup, needs progressive disclosure
- **PDF generation** — puppeteer-core + @sparticuz/chromium-min on Vercel serverless
- **Close CRM fields reused** — same IDs, repurposed labels
- **Different Discord webhook** — separate channel from leaseup
