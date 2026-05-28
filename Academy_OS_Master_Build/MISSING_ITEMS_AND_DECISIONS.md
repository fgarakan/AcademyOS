# MISSING ITEMS AND DECISIONS
**Updated:** 2026-04-27 | **Owner:** Review before every sprint

---

## HOW TO USE THIS FILE

Each item has:
- **Why it matters** — the downstream consequence
- **Recommended default** — what to go with if still unresolved
- **Risk if unresolved** — blocks or risks
- **Blocks V1?** — yes/no

Resolve items before Phase starts. Do not build on top of open decisions.

---

## PRODUCT DECISIONS

### P1 — V1 user roles (exact list)
**Why it matters:** Drives auth, RLS, UI routing, and every access decision.
**Recommended default:** Director, Head Coach, Coach, Player (read-only), Parent (read-only). Add more in V2.
**Risk if unresolved:** RLS policies cannot be finalized. Auth routing breaks.
**Blocks V1?** YES

### P2 — Parent portal: V1 or later?
**Why it matters:** Parent-facing screens are a separate UX context. If V1, must design update delivery.
**Recommended default:** Defer parent portal to V2. V1 focuses on staff workflow.
**Risk if unresolved:** Scope creep in V1. Better to ship staff tools first, add parent view later.
**Blocks V1?** NO (but must decide before building parent-visible note fields)

### P3 — Voice input in V1: shell only or functional?
**Why it matters:** Full voice AI (Whisper + Claude) is complex. A UI shell with typed input that follows the same pipeline is buildable now.
**Recommended default:** V1 = typed input through voice pipeline UI. V2 = real audio recording. V1 must respect the pipeline architecture even with typed input.
**Risk if unresolved:** If we skip pipeline architecture in V1, refactoring cost is high.
**Blocks V1?** NO — but architecture must be respected

### P4 — First live feature: placement or templates?
**Why it matters:** Determines sprint order and what Supabase schema to complete first.
**Recommended default:** Placement engine first. It is the highest-value, highest-visibility V1 feature and forces clean player/group schema.
**Risk if unresolved:** Development energy misdirected.
**Blocks V1?** YES — must pick one

### P5 — Billing / multi-academy: V1 or later?
**Why it matters:** Multi-tenancy affects every table, every RLS policy, every query.
**Recommended default:** Single-academy V1. Multi-tenancy deferred to V3. Use `academy_id` column from day one for safety.
**Risk if unresolved:** Adding multi-tenancy later without `academy_id` columns is expensive.
**Blocks V1?** NO — but add `academy_id` to all tables regardless

---

## TECHNICAL DECISIONS

### T1 — Current framework
**Status:** Static HTML prototype (`index.html`, `app.html`)
**Recommended path:** Build Next.js 14 app with Supabase backend. Use `app.html` prototype as UX specification.
**Blocks V1?** YES — framework choice determines project setup

### T2 — Supabase project status
**Status:** No Supabase project connected. No credentials.
**Action required:** Create Supabase project, run Package 02 migrations, add env vars.
**Blocks V1?** YES

### T3 — Auth method
**Recommended default:** Supabase Auth with email+password for V1. Magic link in V2.
**Blocks V1?** YES

### T4 — Deployment target
**Recommended default:** Vercel (Next.js native) for V1. Custom domain in V2.
**Blocks V1?** YES — needed for testing

### T5 — Existing SQL
**Status:** No existing SQL files. Package 02 contains all schema from scratch.
**Blocks V1?** NO

### T6 — RLS policies
**Status:** Designed in Package 02 but not tested against real Supabase.
**Blocks V1?** YES — must test before launch

### T7 — Generated TypeScript types
**Status:** Not yet generated. Will be done after Supabase project created using `supabase gen types typescript`.
**Blocks V1?** YES — required for type-safe frontend

### T8 — Test setup
**Status:** No test setup exists.
**Recommended default:** Vitest for unit tests, Playwright for E2E. Add in Phase 8.
**Blocks V1?** NO — add after core feature ships

---

## UX DECISIONS

### U1 — First screens to build
**Recommended default:** Login → Director Dashboard → New Student Placement flow → Player Profile.
**Blocks V1?** YES

### U2 — How closely to match Manus UI
**Recommended default:** Match Manus closely. Diverge only for placement workflow clarity and mobile.
**Blocks V1?** NO

### U3 — Mobile-first or desktop-first per workflow
**Recommended default:**
- Director dashboard: desktop-first (split pane)
- Coach live session: mobile-first (one-handed use)
- Placement flow: desktop-first for intake, mobile-friendly for on-court assessment
**Blocks V1?** NO — but must decide before building components

### U4 — Approval review pattern
**Recommended default:** Slide-in panel on desktop, full page on mobile. Always shows: proposed action → affected objects → risk level → approve/edit/reject.
**Blocks V1?** YES for voice pipeline V1

### U5 — Voice command entry point naming
**Recommended default:** "Tell the OS" — accessible from top nav on all director/head coach screens.
**Blocks V1?** NO

---

## DATA DECISIONS

### D1 — Track taxonomy (final)
**Recommended default:**
- `skill` — technical and tactical development
- `competition` — match readiness and tournament performance
- `fitness` — physical conditioning and movement
- `combined` — players on all three tracks
**Blocks V1?** YES — affects schema

### D2 — Group / level naming conventions
**Recommended default:**
- Levels: 1–6 (numeric, academy-configurable labels)
- Groups: Academy-defined (e.g., "Elite-A", "Orange Development", "Green Beginners")
- Age bands: academy-configurable (U8, U10, U12, U14, U16, U18, Adult)
**Blocks V1?** YES — affects schema

### D3 — Assessment scoring scale
**Recommended default:** 1–10 decimal (e.g., 7.5). Allows precision without overwhelming coaches.
**Blocks V1?** YES

### D4 — Intensity scale
**Recommended default:** 1–5 (Low / Moderate / Medium-High / High / Maximum)
**Blocks V1?** YES — needed for session builder and load management

### D5 — Skill category taxonomy
**Recommended default:**
- Technical: forehand, backhand, serve, return, volley, overhead, movement
- Tactical: patterns, positioning, decision-making, game-style
- Physical: speed, agility, recovery, endurance, strength
- Competition: pressure handling, consistency, match tactics, mental resilience
- Behavioral: attitude, effort, coachability, communication
**Blocks V1?** YES — needed for assessment forms and note tagging

### D6 — Reassessment schedule rules
**Recommended default:** Every 8–12 weeks (academy-configurable). System creates reassessment event at placement + every interval. Overdue at +14 days past due date.
**Blocks V1?** YES — needed for player status calculations

---

## DECISION LOG

| ID | Decision | Made By | Date | Status |
|---|---|---|---|---|
| — | — | — | — | Open |

*Fill in as decisions are made.*
