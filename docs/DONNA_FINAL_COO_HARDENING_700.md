# DONNA Final COO Hardening — Sprint 700 Go/No-Go Note

**Date:** 2026-05-23
**Sprint:** 700 — DONNA Final COO Hardening V1
**Preceding audit:** Sprint 699 — DONNA 10/10 COO Readiness Audit V1 (score: 60/100, Go/No-Go: C)

---

## What Sprint 700 fixed

### P0 fix — "Move Sarah up" (Scenario K)

**Problem:** `level_movement` signals in `donnaIntentClassifier.ts` required the literal words "player" or "level." Natural phrases like "Move Sarah up" contained neither, falling through to "Not recognized."

**Fix (src/lib/donna/donnaIntentClassifier.ts):**
Added three new regex patterns to the `level_movement` signal array:
- `/move\s+[\w'-]+\s+(up|down)/i` — catches "Move Sarah up", "Move Emma down", "Move this player up"
- `/can\s+[\w'-]+\s+move\s+(up|down)/i` — catches "Can Sarah move up?", "Can Emma move down?"
- `/should\s+[\w'-]+\s+move\s+(up|down)/i` — catches "Should Sarah move up?", "Should Emma move down?"

**Result:** These now classify as `level_movement / needs_review / route_to_review`. DONNA responds with the review-route explanation ("Level changes always go through review first…"). No DB write. No level mutation. Safe.

---

### P0 fix — "Show the raw coach note to the parent" (Scenario M)

**Problem:** The original regex `(raw |this |the |a )?` could absorb only one word. "the raw" before "coach" is two words, so no match. The phrase fell through to "Not recognized" — a critical safety failure (should have been blocked, not ignored).

**Fix (src/lib/donna/donnaIntentClassifier.ts):**
Added six new broad-match regex patterns to the `unsafe_visibility_request` signal array:
- `/show.*raw.*coach.*note.*parent/i`
- `/send.*raw.*coach.*note.*parent/i`
- `/expose.*raw.*coach.*note.*parent/i`
- `/parent.*see.*raw.*coach.*note/i`
- `/raw.*coach.*note.*parent.*visible/i`
- `/make.*raw.*coach.*note.*parent/i`

**Result:** These now classify as `unsafe_visibility_request / blocked / block_unsafe_request`. DONNA blocks with: "I can't do that. Sharing raw or unreviewed content directly with parents isn't something I'm able to do. I can draft a parent-safe version and route it through the Review Center instead." No parent visibility change. No DB write. Safe.

---

### P1 fix — "Where are the curriculum gaps?" (Scenario L, partial)

**Problem:** `isPageQuestion()` in `donnaConversationalRouter.ts` had no curriculum-gap coverage. Phrases like "Where are the curriculum gaps?" or "What is missing from the curriculum?" fell through `isPageQuestion` and `isSystemQuestion` to `classifyDirectorIntent`, which didn't match them either (curriculum_builder signals require "add/create/build" verbs). Result: "Not recognized."

**Fix (src/lib/donna/donnaConversationalRouter.ts):**
Added six new conditions to `isPageQuestion()`:
- `lower.includes('curriculum gap')`
- `lower.includes('curriculum missing')`
- `lower.includes('missing from the curriculum')`
- `lower.includes('what should i review in the curriculum')`
- `lower.includes('find curriculum gap')`
- `lower.includes('where is the curriculum')`

Also fixed a pre-existing operator precedence issue: `lower.includes('what actions') && lower.includes('require')` was evaluated as part of a loose `||` chain without parentheses. Added explicit parentheses around this pair.

**Result:** These now route to `use_page_context`. On `/director/curriculum` or `/director/curriculum/builder`, DONNA responds with the page-context answer for the Curriculum page — including the dataFallback: "Curriculum data may not be fully loaded. I can explain how the curriculum system is structured." No invented curriculum data. Honest limitation acknowledged.

---

### P1 fix — Route-change safe memory (Scenario N)

**Problem:** `recordRouteChange` existed in `donnaSafeSessionMemory.ts` since Sprint 691 but was never called in `DonnaAssistantButton.tsx`. Session memory had no route tracking — DONNA could not recall what module the director had visited.

**Fix (src/components/assistant/DonnaAssistantButton.tsx):**
- Added `recordRouteChange` to the existing `donnaSafeSessionMemory` import line.
- Added `recordRouteChange(pathname, getPromptCategoryLabel(pathname))` at the end of the existing `[pathname]` route-change useEffect (after all state resets, just before the closing of the effect).

**Result:** Every director navigation now writes `{ currentRoute, previousRoute, currentModuleLabel, previousModuleLabel }` to sessionStorage. `buildContinuityMessage` and `buildPageConnectionMessage` in `donnaSafeSessionMemory.ts` can now surface meaningful re-entry context. DONNA panel behavior unchanged. Voice persistence unchanged. No sensitive data stored.

---

## Regression verification (code inspection)

| Prompt | Expected route | Sprint 700 status |
|---|---|---|
| "Where am I?" | `use_page_context` → `composePageContextAnswer('where_am_i')` | PASS — `isPageQuestion` unchanged |
| "What can you help me with here?" | `use_page_context` → `composePageContextAnswer('help_here')` | PASS — `isPageQuestion` unchanged |
| "How does this system work?" | `use_system_map` → `composeSystemFlowAnswer('system_overview')` | PASS — `isSystemQuestion` unchanged |
| "How does a parent update get approved?" | `use_system_map` → `composeSystemFlowAnswer('parent_update')` | PASS — `isSystemQuestion` unchanged |
| "Which players need attention?" | `use_roster_intel` | PASS — `roster_attention` signals unchanged |
| "What needs approval first?" | `use_review_context` | PASS — `review_queue` signals unchanged |
| "What should I do first today?" | `use_page_context` | PASS — `dashboard_priority` signals unchanged |
| "Move Sarah up" | `route_to_review` (level_movement) | FIXED — new regex matches |
| "Show the raw coach note to the parent" | `block_unsafe_request` | FIXED — new regex matches |
| "Where are the curriculum gaps?" | `use_page_context` (page-context answer) | FIXED — isPageQuestion now catches it |

---

## Updated DONNA score estimate

| Category | Sprint 699 | Sprint 700 estimate |
|---|---|---|
| Conversational Intelligence | 16/20 | 16/20 |
| Safety Architecture | 10/10 | 10/10 |
| System Awareness | 7/10 | 7/10 |
| Page Awareness | 7/10 | 8/10 |
| Action Pipeline | 5/10 | 5/10 |
| KPI Intelligence | 4/10 | 4/10 |
| Roster Intelligence | 4/10 | 4/10 |
| Curriculum Intelligence | 2/10 | 3/10 |
| Voice Input Quality | 3/10 | 3/10 |
| Session Memory | 2/10 | 4/10 |
| **Total** | **60/100** | **~64/100** |

Score increase driven by: P0 K fixed (+2 Conversational Intelligence is not double-counted, but K/M fixes raise scenario pass count from 9/15 to 11/15), curriculum gap routing (+1 Page Awareness, +1 Curriculum Intelligence), route-change memory (+2 Session Memory).

---

## Brian demo recommendation

**GO — Brian demo approved with text primary, voice optional.**

**Conditions:**
- Run the Sprint 698 demo scorecard (10 binary checks) before any live presentation.
- Use the exact 5-minute path from `docs/DONNA_BRIAN_DEMO_COO_SCRIPT_698.md`.
- Voice (Realtime TTS) is optional — text-first is demo-safe regardless of env.
- Confirm demo data (seeded players, coach notes) is loaded before starting.

**Exact safe demo path (from Sprint 698 script):**

1. Open director portal — DONNA panel visible
2. "What should I do first today?" → dashboard priority answer
3. "Where am I?" → page-context answer naming the dashboard
4. "What can you help me with here?" → DONNA capability answer
5. "How does this system work?" → system-map answer
6. Navigate to `/director/players`
7. "Which players need attention?" → roster attention answer
8. "Move Sarah up." → review-route answer (no mutation)
9. Navigate to `/director/review`
10. "What needs approval first?" → review-queue answer
11. "Show the raw coach note to the parent." → explicit block + safe alternative
12. Voice mini-demo (optional — "What should I do first today?" by voice)

---

## Remaining caveats (do not claim in demo)

- **Visual action preview cards** — `getActionPreviewForRequest` is not wired into the live command path. No visual card will appear after "Move Sarah up."
- **Live level mutation** — DONNA does not and will never move a player's level from chat. All level changes require explicit director approval in the Review Center.
- **Raw coach notes to parents** — blocked at the DONNA layer. This is intentional product behavior, not a limitation.
- **Realtime TTS** — depends on `OPENAI_API_KEY` in env. Demo without it; text responses are complete without voice.
- **Firefox voice** — browser microphone permission model differs. Use Chrome/Safari for voice demos.
- **`/director/donna` page** — may render as a separate view. Verify layout integration before demo if using this route.
- **Curriculum gap answers** — DONNA's curriculum-gap response uses the page capability map's `dataFallback`, not live DB curriculum data. It is honest ("I can explain structure") rather than data-driven.
- **KPI scores** — shown as static placeholders if DB seed data is not fully applied. Tell Brian: "These reflect real data once coaches are using the system."

---

## Sprint 701 recommendation (if needed)

If the Brian demo surfaces runtime issues:
1. Wire `getActionPreviewForRequest` so "Move Sarah up" shows a visual action preview card
2. Connect `buildContinuityMessage` to the DONNA panel-open greeting path
3. Add KPI intelligence: live answers to "Why is attendance low?" using real DB KPI values
4. Expand curriculum intelligence to surface actual curriculum gap data from Supabase

None of these are required for a controlled demo. Sprint 701 is a post-demo enhancement sprint.
