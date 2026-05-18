# Director DONNA Page Wiring — Sprint 1038

**Date:** 2026-05-18
**Sprint:** 1038 — Director DONNA Page Wiring V1

---

## What changed

Rewired `/director/donna` from a static link hub into a fully connected Director DONNA command center.

### Files created
- `src/app/director/donna/DonnaDirectorShellClient.tsx` — thin client wrapper that receives `DirectorDonnaContext` (server-loaded) and renders `DonnaVoiceReadyShell`. Keeps the page as a Server Component.

### Files modified
- `src/app/director/donna/page.tsx` — full rewrite:
  - Loads `loadDirectorDonnaContext` server-side (reads live Supabase data with demo fallback)
  - Renders 2-column layout on desktop (left: context panels; right: DONNA chat shell)
  - Left column: Today at a Glance (4 KPI tiles), Attention Needed (player flags), Academy Risks (urgency-labeled), Next Best Actions (role-specific), Quick Navigation
  - Right column: `DonnaDirectorShellClient` wrapping `DonnaVoiceReadyShell` at 620px height
  - Data status indicator (Live / Demo mode) in header
  - Safety notice at bottom

---

## Director DONNA page sections

| Section | Source | Behavior |
|---|---|---|
| Today at a Glance | `DirectorDonnaContext` | 4 KPI tiles: sessions, pending reviews, missing wrap-ups, attention flags |
| Attention Needed | `ctx.attentionItems` | Up to 4 player flags with risk badges; links to `/director/players` |
| Academy Risks | `ctx.academyRisks` | Up to 3 risks with urgency color; links to relevant action pages |
| Next Best Actions | `ctx.recommendedActions` | Up to 4 actions with category icons; links to action targets |
| Quick Navigation | Static | 6 director portal links |
| DONNA Chat Shell | `DonnaVoiceReadyShell` | Full interactive chat with suggested questions, voice input, boundary responses, confidence labels |

---

## Data behavior

- If user is authenticated and has `academy_id`: `loadDirectorDonnaContext` loads live data
- If any field fails to load: that field shows demo fallback (function is fault-tolerant)
- If no live data is found overall: full demo fallback activates
- Demo fallback shows clear "Demo mode" label in header and note in KPI section
- No DB writes anywhere on this page

---

## Role safety

- Page is under `/director` route — director middleware protects it
- DONNA shell receives `role="director"` and `donnaRole="director"`
- `DonnaVoiceReadyShell` enforces `donnaBoundaryResponses` for blocked questions
- All suggested questions are director-scoped via `donnaSuggestedQuestions`
- No parent data visible
- No auto-approval, no mutations

---

## TypeScript

Clean (`npx tsc --noEmit` — no errors).
