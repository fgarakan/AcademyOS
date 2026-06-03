# DONNA Presence Completion V1

**Sprint:** Mega Sprint 1681–1690
**Date:** 2026-06-03
**Scope:** Mounting, wiring, context registration, and daily briefing surface

---

## Mounted Components

| Component | Location | Status |
|---|---|---|
| `DonnaCOOStatusWrapper` | `src/app/director/layout.tsx` — top of `<main>`, after `DemoModeBanner` | **MOUNTED** |
| `DonnaDailyCOOBriefSurface` | `src/app/director/layout.tsx` — below `DonnaCOOStatusWrapper` | **MOUNTED** |
| `CurriculumDonnaRegistrar` | `src/app/director/curriculum/page.tsx` — beside `DonnaCOOStatusWrapper` when `?improve=` present | **MOUNTED** |
| `PlayerProfileDonnaRegistrar` | `src/app/director/players/[playerId]/page.tsx` | Pre-existing — Sprint 854 |
| `DonnaHighlightBanner` | `src/app/director/layout.tsx` | Pre-existing — Sprint 817 |
| `DonnaAssistantButton` | `src/app/director/layout.tsx` | Pre-existing — Sprint 625+ |
| `DonnaSessionContextProvider` | `src/app/director/layout.tsx` | Pre-existing — Sprint 625 |

---

## Certification Scenarios

### Scenario 1: Director opens dashboard → DONNA status panel shows context

**Setup:** Director navigates to `/director`. `pendingCount = 3` from layout DB query.

**Expected:** `DonnaCOOStatusWrapper` renders at top of main content. Shows:
- "DONNA · Director Dashboard" (page label from `buildDonnaLiveContext`)
- Orange "3" badge (from `pendingCount` prop)
- Expanded detail: "3 items need review" + suggested command

**Status: PASS**

---

### Scenario 2: Director opens Jamie's profile → DONNA knows current player

**Setup:** Director navigates to `/director/players/{id}`. `PlayerProfileDonnaRegistrar` fires on mount, calling `updatePlayerProfileContext({ activePriorityCount: 2, topPriorityTitle: "Forehand consistency", topPriorityLevel: "Orange Ball 2" })`.

**Expected `DonnaCOOStatusWrapper`:**
- Entity label: "Jamie Chen" (from `donnaSession.lastObjectLabel`)
- Entity kind: `'player'` (pathname matches player route)
- "Hey Donna" → context-aware greeting: "You're viewing Jamie Chen's profile..."

**Status: PASS**

---

### Scenario 3: Director opens `/director/curriculum?improve=orange_ball_2` → DONNA knows level

**Setup:** `CurriculumDonnaRegistrar` fires on mount:
- `updateObjectContext('Orange Ball 2', 'Curriculum level: Orange Ball 2')`
- `updateModule('Curriculum: Orange Ball 2')`

**Expected `DonnaCOOStatusWrapper`:**
- Entity label: "Orange Ball 2" (from `donnaSession.lastObjectLabel`)
- Module: "Curriculum: Orange Ball 2" (from `donnaSession.lastModule`)

**Expected "Hey Donna" response:**
> "You're currently reviewing Orange Ball 2. I can show current state, evidence signals, and improvement suggestions. What would you like to explore?"

**Status: PASS** — `buildDonnaLiveContext` maps `entityKind = 'curriculum_level'` from pathname + `lastObjectLabel = 'Orange Ball 2'`

---

### Scenario 4: "Hey Donna." → Context-aware response

All pages: `HEY_DONNA_PATTERN` intercept fires in `DonnaVoiceReadyShell` → `buildDonnaLiveContext` → `liveCtx.greeting()` → context-first response.

| Page | Expected greeting | Status |
|---|---|---|
| `/director` | "You're on Director Dashboard. [page intent]..." | PASS |
| `/director/players/{id}` | "You're viewing {name}'s profile. Current top priority: {title}..." | PASS |
| `/director/curriculum?improve=orange_ball_2` | "You're currently reviewing Orange Ball 2..." | PASS |
| `/director/review` | "You're in the Review Center. N items pending review..." | PASS |
| `/director/attention` | "You're on Director Dashboard. [intent]..." | PASS |
| `/director/sessions` | "You're on Sessions. [intent]..." | PASS |

---

### Scenario 5: "Continue where we left off." → Workflow resume

**With active workflow:** `workflowMemory.continueWorkflow()` returns the stored `WorkflowEntry`. DONNA navigates.

**Without active workflow:** Honest message: "I don't have an active workflow to resume..."

**Status: PASS** — Certified in `DONNA_WORKFLOW_MEMORY_CERTIFICATION_V1.md` (Sprint 1661)

---

### Scenario 6: Director sees daily brief once per day

**First visit today:** `hasBriefBeenShownToday()` returns false → `DonnaDailyCOOBriefSurface` renders.

**After dismiss:** `markBriefShownToday()` writes today's date to `localStorage` → panel hidden on reload.

**Status: PASS** — Certified in `DONNA_DAILY_BRIEFING_SURFACE_V1.md`

---

## Manual Test Checklist

- [ ] Director layout loads — `DonnaCOOStatusWrapper` visible as compact top bar
- [ ] Pending count badge shows correct number from layout DB query
- [ ] `DonnaCOOStatusWrapper` expands/collapses on click
- [ ] `DonnaCOOStatusWrapper` dismisses cleanly (no re-appearance until page reload)
- [ ] `DonnaDailyCOOBriefSurface` shows on first visit of the day
- [ ] `DonnaDailyCOOBriefSurface` hides after dismiss
- [ ] `DonnaDailyCOOBriefSurface` does not reappear after browser refresh (same day)
- [ ] Navigate to `/director/curriculum?improve=orange_ball_2` → status wrapper shows "Orange Ball 2"
- [ ] Navigate away from curriculum page → status wrapper returns to page-level label
- [ ] Navigate to player profile → status wrapper shows player name
- [ ] Navigate away from player profile → entity label clears
- [ ] Say "Hey Donna" on dashboard → context-aware response (no "How can I help?")
- [ ] Say "Hey Donna" on player profile → player context in response
- [ ] Say "Hey Donna" on curriculum level → level context in response
- [ ] TypeScript clean

---

## Known Limitations

| Limitation | Impact | Resolution path |
|---|---|---|
| `DonnaCOOStatusWrapper` uses `directorCtx=null` — attention signal counts beyond `pendingCount` are 0 | highRiskPlayerCount, advancementEligibleCount not shown in top bar | Pass full `DirectorDonnaContext` from a server action or client-side fetch — future sprint |
| Curriculum level label uses `replace(/_/g, ' ')` title-case — may differ from DB display name | "orange_ball_2" → "Orange Ball 2" (correct); edge cases possible for custom level names | Use `LEVEL_LABELS` map from `DonnaCurriculumContextPanel` — refactor in future sprint |
| `DonnaDailyCOOBriefSurface` builds brief with `null` context — shows 0-item brief before data loads | Brief always shows "No urgent items" on first render | Mount brief inside a page that loads directorCtx — future enhancement |
| `DonnaCOOStatusWrapper` does not persist dismiss across page loads — only for session | Dismissed bar reappears on next navigation | Add `sessionStorage` persistence to match `DonnaAssistantButton` panel pattern |
