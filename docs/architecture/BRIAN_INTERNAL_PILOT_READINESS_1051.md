# Brian Internal Pilot Readiness Release — Sprint 1051

**Sprint:** 1051 — Brian Internal Pilot Readiness Release V1
**Date:** 2026-05-31
**Type:** Release summary — no code changes
**Pilot:** Brian Dabul — Dabul Tennis Academy

---

## What is ready

### Director experience (Brian's primary role)

| Module | Status | Entry point |
|---|---|---|
| Dashboard | Ready | `/director` |
| Today | Ready | `/director/today` |
| Review Queue (all 8 tabs) | Ready | `/director/review` |
| Player Directory | Ready | `/director/players` |
| Player Profile (6 tabs) | Ready | `/director/players/[id]` |
| Academy Health / KPI | Ready | `/director/kpi` |
| Class Templates | Ready | `/director/class-templates` |
| Fitness Templates | Ready | `/director/fitness/templates` |
| Session List + Create | Ready | `/director/sessions` |
| Curriculum Explorer | Ready | `/director/curriculum` |
| DONNA Sidebar | Ready | Floating button (all director pages) |

### Coach experience

| Module | Status | Entry point |
|---|---|---|
| Coach Home | Ready | `/coach` |
| Sessions List | Ready | `/coach/sessions` |
| Session Detail + Execute | Ready | `/coach/sessions/[id]` |
| Wrap-Up Flow (6 questions) | Ready | `/coach/sessions/[id]/wrap-up` |
| Player List | Ready | `/coach/players` |
| DONNA Sidebar | Ready | Floating button (all coach pages) |

### Parent + Player experience

| Module | Status | Entry point |
|---|---|---|
| Parent Home | Ready | `/parent` |
| Parent Progress | Ready | `/parent/progress` |
| Player Home | Ready | `/player` |
| Player Missions | Ready | `/player/missions` |

---

## Completed UX simplification (Sprints 1034–1049)

18 sprints. Every page in the critical director/coach/parent/player path received a targeted simplification:

- Subtitles condensed to one action line across all director pages
- 3 PageExplainerCard always-visible Q&A blocks removed (class templates, fitness templates, sessions)
- DONNA sidebar unified: one response thread, chip deduplication, "DONNA says" duplication eliminated
- Coach home: duplicate DONNA card and Quick Actions grid removed
- Coach wrap-up: duplicate safety notices and 3rd DONNA entry removed
- Player home: duplicate "Ask DONNA CTA" card removed
- Player profile header: urgent orange signal for missing curriculum level
- Players directory: DONNA attention chip now conditional on actual signals
- Session creation: consistent eyebrow, both template types in empty state

---

## What to do for Brian's first session

1. **Verify Supabase auth** — Brian's director account linked to Dabul Tennis Academy (`academy_id`)
2. **Seed demo players** — confirm players are in the DB with `profile_id` linked for player portal access
3. **Apply pending migrations** (see `docs/KNOWN_LIMITATIONS.md`) — especially migration 045 (curriculum_level_id on templates) if Brian will be editing class templates during the demo
4. **Set `OPENAI_API_KEY`** in the server environment if voice transcription is needed
5. **Walk Brian through the golden path**:
   - Director logs in → `/director` hero card
   - Opens a player profile → curriculum level status
   - Reviews the review queue → approves a coach wrap-up
   - Creates a session from a class template
   - Opens DONNA sidebar → asks "What needs my attention?"

---

## Known limitations for the pilot

- Session template attachment cannot be changed after creation (no UI to edit)
- `/director/configuration` does not exist yet
- Two class template list routes exist — use `/director/class-templates` (live data)
- Player profile is not mobile-responsive below ~900px
- Voice transcription requires `OPENAI_API_KEY`
- Gate evidence and level confirmation UI are partially complete

---

## Commit range for this block

| Sprint | Commit | Description |
|---|---|---|
| 1034 | 66fa227 | Replace DirectorTodayCommandCenter With Primary Action Hero |
| 1035 | dd2a24b | Director Today Page Simplification |
| 1036 | 77734e7 | Director Approvals Page Simplification |
| 1037 | 04a2ecf | Director Academy Health Page Simplification |
| 1038 | 052287d | Director Curriculum Entry Simplification |
| 1039 | 6583e21 | Director Template Builder UX Simplification |
| 1040 | 54536fd | DONNA Sidebar 10/10 Simplification Pass |
| 1041 | 1c08c22 | Director Session Creation UX Simplification |
| 1042 | c2c095d | Director Players Directory UX Simplification |
| 1043 | aa22996 | Director Player Profile Header Priority Clarity |
| 1044 | 72b0d73 | Coach Assigned Sessions Dashboard UX Polish |
| 1045 | e9454e9 | Coach Session Detail Execution UX Polish |
| 1046 | 64f784f | Coach Wrap-Up Low-Friction UX |
| 1047 | 1639a3b | Parent Progress Clarity UX |
| 1048 | 04d97da | Player Mission Current Focus UX |
| 1049 | f9223f0 | Site-Wide UX Standard Enforcement |
| 1050 | 832fa43 | Internal Pilot Visual QA Screenshot Audit |
| 1051 | (this) | Brian Internal Pilot Readiness Release |
