# Sprint 846 — draftSummaryUpdateAction Observation Scope Expansion V1

**Date:** 2026-05-26
**Sprint:** 846
**Type:** Data — observation query scope expansion in director-only draft action
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 833 Dimension 9 — Coach-to-Director Evidence Handoff (8/10)
**Confirmed remaining gap at Sprint 845 audit**

`draftSummaryUpdateAction` fetched only `is_private = true` observations when building
development summary drafts. Non-private (public) coach observations were silently excluded.

**Impact:** A player with 20 non-private technical/tactical coach notes and 2 private ones
would produce a 2-observation draft — the 20 public notes would not inform the director's
development summary at all. This makes the draft less representative of the player's actual
observed development.

---

## Audit Findings

### Current filter (before Sprint 846)

```ts
const { data: observations } = await supabase
  .from('coach_observations')
  .select('id, content, observation_type, is_private, created_at')
  .eq('player_id', playerId)
  .eq('academy_id', academyId)
  .eq('is_private', true)    ← only internal observations
  .order('created_at', { ascending: false })
  .limit(10)
```

### Summary draft destination — confirmed director-only and review-gated

`draftSummaryUpdateAction` produces a `proposed_actions` row:
- `status: 'pending_review'`
- `target_module: 'development_summary_draft_v1'`
- `risk_level: 'low'`
- `risk_notes`:
  - "Updates internal development summary only."
  - "Does not change player level, curriculum, or parent/player-facing communication."
  - "Requires director review and explicit apply before writing to `player_development_summary`."

The draft never touches:
- `player_development_summary` (only the apply action does)
- Parent portal or player portal tables
- Any parent-facing or player-facing communication

**Safety conclusion: SAFE to expand scope.** Including non-private observations in a
director-internal `pending_review` draft does not expose those observations to parents or
players. The draft goes through the full review queue before any content reaches the summary.

### `is_private` field not used in strength/work_on logic

Lines 91–99 (the deterministic summary generation) filter only by `observation_type`:
- `strengths` ← `positive` or `positive_highlight` observation types
- `workOn` ← `needs_attention` observation type
- `summaryParts` ← first 5 observations regardless of type

None of these reference `is_private`. The filter was purely a data scope limiter, not a
content-type guard.

---

## Solution

One file modified: `src/app/director/players/[playerId]/draftSummaryUpdateAction.ts`.

### Before

```ts
// Fetch recent coach_observations (is_private = true, ordered newest first)
const { data: observations } = await supabase
  .from('coach_observations')
  .select('id, content, observation_type, is_private, created_at')
  .eq('player_id', playerId)
  .eq('academy_id', academyId)
  .eq('is_private', true)
  .order('created_at', { ascending: false })
  .limit(10)

const obs = observations ?? []
if (obs.length === 0) {
  return fail('No internal observations found for this player. ...')
}
```

### After

```ts
// Sprint 846: Fetch recent coach_observations — both private and non-private.
// The is_private = true filter was removed because this draft is director-only and review-gated:
// it creates a proposed_actions row (pending_review) that requires explicit director apply
// before writing to player_development_summary. Expanding scope gives a fuller evidence picture.
// Non-private observations are not automatically exposed to parents/players by being included here.
// is_private is still selected so it is available for future logic if needed.
const { data: observations } = await supabase
  .from('coach_observations')
  .select('id, content, observation_type, is_private, created_at')
  .eq('player_id', playerId)
  .eq('academy_id', academyId)
  .order('created_at', { ascending: false })
  .limit(20)

const obs = observations ?? []
if (obs.length === 0) {
  return fail('No observations found for this player. ...')
}
```

**Changes:**
1. Removed `.eq('is_private', true)` filter
2. Increased `.limit(10)` → `.limit(20)` — broader pool warrants a larger sample
3. Updated comment to document the reasoning
4. Updated error message: removed "internal" (no longer accurate with expanded scope)

---

## Query Behavior Before/After

| Property | Before | After |
|---|---|---|
| Observation types fetched | `is_private = true` only | All observations (private + non-private) |
| Observation count limit | 10 | 20 |
| `academy_id` scoping | ✅ | ✅ |
| `player_id` scoping | ✅ | ✅ |
| Sort order | Newest first | Newest first |
| Strength detection | `positive` / `positive_highlight` obs_type | Same (unchanged) |
| Work-on detection | `needs_attention` obs_type | Same (unchanged) |
| `summaryParts` | First 5 observations | First 5 observations (from broader pool) |
| `is_private` field selected | ✅ | ✅ (still selected for future use) |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| Draft never auto-applied to player_development_summary | ✅ `pending_review` proposed_action only |
| Draft never exposed to parent/player portals | ✅ review-gated |
| No parent/player messages sent | ✅ |
| No player level movement | ✅ |
| No review queue bypass | ✅ |
| No RLS weakening | ✅ academy_id + player_id scoping preserved |
| Non-private observations not auto-published | ✅ draft is director-internal only |
| Schema unchanged | ✅ no migrations |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| Strength/work_on detection logic | Still filters by observation_type only — no change needed |
| `proposedCoachSummary` construction | Same (first 5 obs — now from a broader pool) |
| `proposed_actions` insert | Unchanged |
| `voice_commands` insert | Unchanged |
| Review queue apply path (`upsertPlayerDevelopmentSummary`) | Not touched |
| Parent/player visibility gates | Not touched |

---

## Files Created

### `docs/DRAFT_SUMMARY_OBSERVATION_SCOPE_EXPANSION_846.md`

This file.

---

## Files Modified

### `src/app/director/players/[playerId]/draftSummaryUpdateAction.ts`

1. Removed `.eq('is_private', true)` filter from observation query
2. Changed `.limit(10)` to `.limit(20)`
3. Updated comment to document expansion rationale
4. Updated empty-state error message (removed "internal")

---

## Score Impact (estimated)

Dimension 9 — Coach-to-Director Evidence Handoff: **8/10 → 8.5/10**

Development summary drafts now draw from a fuller observation pool, making them more
representative of the player's actual observed development.

---

## Remaining Player Priority Gaps

| Gap | Source | Priority |
|---|---|---|
| DONNA attention answers link to player list, not specific flagged player | Sprint 833 | Low |
| Player DONNA chips static — not priority-aware | Sprint 833 | Low |
| Tab trigger focus IDs (`player-notes-tab`) not added | Sprint 841 | Low |
| No deep-link from attention signals to specific profile tab | Sprint 833 | Low |
| No "View in review queue →" link from active priority to originating proposed_action | Sprint 845 | Low |
| DONNA attention context not live-requeried per interaction | Sprint 833 | Low |
| Priority title/description are minimal machine-assembled strings | Sprint 833 | Low |

---

## Recommended Sprint 847

**Sprint 847 — DONNA Attention Answer Deep-link V1**

Change `src/lib/donna/directorPlayersDonnaIntelligence.ts` to include a direct link to
the flagged player's profile (`/director/players/${playerId}`) in attention risk answers,
instead of linking only to the player list (`/director/players`).

This is the Option B from Sprint 845's recommendation. The pattern already exists:
`buildAttentionQueue()` links to `/director/players/${alert.playerId}` for high-priority
alerts. `directorPlayersDonnaIntelligence.ts` needs the same treatment for the DONNA
"who needs attention?" attention items.

Risk: Low — read-only display change in DONNA answer construction. No data changes.
