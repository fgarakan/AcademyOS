# DONNA Academy Intelligence Answering — Sprint 1013

**Date:** 2026-05-31
**Sprint:** 1013
**Status:** Complete

---

## Problem solved

The `interpretAcademyState` and `interpretPlayerDevelopmentSummary` functions in `toolResultInterpreter.ts` (Sprint 1002) returned raw data dump text:

> "Here is your live academy state: Pending review items: 3. Today's sessions: 2. Missing coach recaps: none. Active players: 24. ..."

This is not a COO-quality answer. It exposes the raw summary string without:
- Prioritizing the most urgent signal
- Framing the information in COO terms
- Providing a clear primary action when one is indicated
- Pointing to the right part of the UI

Sprint 1013 replaces this with `academyIntelligenceAnswering.ts`.

---

## New module: `academyIntelligenceAnswering.ts`

Location: `src/lib/donna/llmOrchestration/academyIntelligenceAnswering.ts`

Pure TypeScript — no DB, no API, no mutations.

### `buildAcademyStateAnswer(state: AcademyStateSummary): AcademyIntelligenceAnswer`

Takes a live `AcademyStateSummary` and returns a structured answer.

Priority order for signal inclusion:
1. Pending review items → "X items waiting for your decision" + route to Review Queue
2. Missing recaps → "sessions missing wrap-ups"
3. Players needing placement → "players waiting for placement decision"
4. Advancement-eligible players → "players flagged for advancement review"
5. Today's sessions → contextual day-of info
6. Active player count → baseline context

Health signal → headline framing:
- `on_track` → "Your academy is on track."
- `attention_needed` → "A few things need your attention."
- `critical` → "Your academy has critical items that need your decision now."
- `unknown` → "Academy status is not fully available — here is what I can see."

Returns:
- `donnaText` — complete DONNA response (~2-4 sentences)
- `suggestedRoute` — `/director/review` when pending reviews exist
- `highlightTargetId` — `review-queue-primary` when reviews pending
- `primaryActionLabel` — "Review N pending items" or "Check missing session recaps"

### `buildPlayerDevelopmentAnswer(dev: PlayerDevelopmentSummary): AcademyIntelligenceAnswer`

Takes a live `PlayerDevelopmentSummary` and returns a structured answer.

Priority order:
1. Players needing placement → blocking signal
2. Advancement-eligible → action signal
3. Assessment overdue → attention signal
4. Players without curriculum level → gap signal
5. Total active + level coverage → baseline

Returns:
- `donnaText` — complete DONNA response
- `suggestedRoute` → `/director/players` when placement or advancement signals exist
- `highlightTargetId` → `player-list`
- `primaryActionLabel` → "Review N players needing placement" or "Review N advancement-eligible players"

---

## Updated: `toolResultInterpreter.ts`

`interpretAcademyState` (Sprint 1002) and `interpretPlayerDevelopmentSummary` (Sprint 1002) are updated:
- Error path: clearer messages, no raw summary dump
- Success path: calls `buildAcademyStateAnswer(result.data)` / `buildPlayerDevelopmentAnswer(result.data)` instead of building text from `result.summary`
- Highlight and navigation are now driven by the answer builder's return, not hardcoded

The two Sprint 1003 and 1004 interpreters (`interpretPlayerProfileSummary`, `interpretSessionContext`) are **not changed** — those are addressed in Sprints 1014 and 1016.

---

## Safety invariants

- No player names returned in any answer
- No coach notes referenced
- No raw IDs in output text
- "Nothing changes until you take an explicit action" included in all answers
- Pending review highlight → routes to Review Queue only (no auto-approval)
- Answer builders never throw (all fields have safe defaults)

---

## Example output

**Before Sprint 1013:**
> "Here is your live academy state: Pending review items: 3. Today's sessions: 2. Missing coach recaps: none. Active players: 24. Players needing placement: none. Advancement-eligible players: yes. Academy health: attention_needed. This data is retrieved directly from your academy database."

**After Sprint 1013:**
> "A few things need your attention. 3 items are waiting for your decision in the Review Queue. Some players have been flagged as advancement-eligible — a review may be appropriate. Active players: 24. This data is retrieved live from your academy database — nothing here is estimated."

With primary action: "Review 3 pending items" → routes to `/director/review`.
