# Internal Pilot Visual QA Screenshot Audit — Sprint 1050

**Sprint:** 1050 — Internal Pilot Visual QA Screenshot Audit V1
**Date:** 2026-05-31
**Type:** Audit-only — no code changes

---

## UX Simplification Block Summary (Sprints 1034–1049)

### Director experience

| Sprint | Page | What changed |
|---|---|---|
| 1034 | `/director` | Replaced DirectorTodayCommandCenter with DirectorPrimaryActionHero |
| 1035 | `/director/today` | Removed duplicate TodayCommandBrief; collapsed duplicate Review Queue CTAs |
| 1036 | `/director/review` | Simplified 2-paragraph subtitle to one clear line |
| 1037 | `/director/kpi` | Subtitle simplified from technical to director-friendly |
| 1038 | `/director/curriculum` | Title/subtitle simplified |
| 1039 | `/director/class-templates` | Removed always-on PageExplainerCard; simplified empty state |
| 1040 | DONNA sidebar | Removed "DONNA says" duplication; chip deduplication; removed pathname label |
| 1041 | `/director/sessions` + `/new` | Subtitle simplified; eyebrow fixed; empty state shows both template types |
| 1042 | `/director/players` | DONNA chip conditional on signals; empty subtitle improved |
| 1043 | Player profile header | "No curriculum placement" → orange warning with icon |
| 1049 | `/director/fitness/templates` | Removed always-on PageExplainerCard |

### Coach experience

| Sprint | Page | What changed |
|---|---|---|
| 1044 | `/coach` (home) | Removed duplicate DONNA card; removed Quick Actions grid (bottom tab covers it) |
| 1045 | `/coach/sessions/[id]` | Removed technical "Snapshot notice"; simplified "After Session" description |
| 1046 | Wrap-up saved state | Removed duplicate safety notice; removed "Ask DONNA" link (3rd DONNA entry) |

### Parent experience

| Sprint | Page | What changed |
|---|---|---|
| 1047 | `/parent/progress` | Removed redundant bottom safety note |

### Player experience

| Sprint | Page | What changed |
|---|---|---|
| 1048 | `/player` (home) | Removed duplicate "Ask DONNA CTA" card at bottom |

---

## Pre-pilot visual QA checklist

### Director — critical path

- [ ] `/director` — Hero card visible, KPI grid, no duplicate DONNA cards
- [ ] `/director/today` — Today's sessions, no duplicate Review Queue CTAs
- [ ] `/director/review` — Single clear subtitle, approval tabs working
- [ ] `/director/kpi` — Director-friendly subtitle, DONNA chip visible
- [ ] `/director/players` — Player list, DONNA chip hidden when no signals
- [ ] `/director/players/[id]` — Orange warning when no curriculum level
- [ ] `/director/curriculum` — Clean entry, DONNA chips
- [ ] `/director/class-templates` — No PageExplainerCard, NextBestActionCard empty state
- [ ] `/director/fitness/templates` — No PageExplainerCard, template list
- [ ] `/director/sessions` — Simplified subtitle, data-donna-focus-id on CTA
- [ ] `/director/sessions/new` — "Sessions" eyebrow, both template types in empty state

### DONNA sidebar

- [ ] Floating button opens DONNA panel
- [ ] No "DONNA says" duplication above input
- [ ] Page chips only (no generic chips) on registered routes
- [ ] Generic chips fallback on unregistered routes (e.g. /director/today, /director/kpi)
- [ ] Player profile page: player-specific chips visible alongside DonnaPanelPageChips

### Coach — critical path

- [ ] `/coach` — No DONNA card body, no Quick Actions grid, wrap-up alert visible
- [ ] `/coach/sessions` — Sessions list with wrap-up status badges
- [ ] `/coach/sessions/[id]` — No snapshot notice, simplified after-session text
- [ ] `/coach/sessions/[id]/wrap-up` — 6-question flow, voice input, player chips
- [ ] Wrap-up saved state — No duplicate safety notice, no "Ask DONNA" link

### Parent — critical path

- [ ] `/parent` — "{firstName}'s Journey" or "Parent Home"
- [ ] `/parent/progress` — Level journey, observation counts, no duplicate safety footer

### Player — critical path

- [ ] `/player` — Hero card, 4 path cards, mid-page DONNA chips, no bottom DONNA card
- [ ] `/player/missions` — Mission list loads

---

## Known gaps not addressed in this block (deferred)

1. **Session detail template attachment UI** — not built; template is set at creation only
2. **Director configuration screen** — not built; `/director/configuration` 404s
3. **Two class template list routes** — `/director/class-templates` (live) and `/director/templates/class` (demo data) both exist; future sprint should redirect or merge
4. **Pending Supabase migrations** — multiple migrations documented in `docs/KNOWN_LIMITATIONS.md` not yet applied to live DB
5. **Player profile mobile layout** — not responsive below ~900px (noted in KNOWN_LIMITATIONS.md)
6. **Voice transcription** — requires `OPENAI_API_KEY` in environment for production

---

## Sprint 1051 readiness

The codebase is ready for internal pilot review by Brian Dabul (Dabul Tennis Academy).

Pages that need manual QA before Brian's first session:
1. Director: `/director` → `/director/today` → `/director/review` → player profile
2. Coach: `/coach` → session detail → wrap-up
3. DONNA sidebar: open panel, ask a question, confirm single response thread

No TypeScript errors. All sprints 1034–1050 committed and pushed.
