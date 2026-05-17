# Level Readiness Application Adapter Audit — Sprint 582

**Date:** 2026-05-17
**Sprint:** 582 — Level Readiness Application Adapter Audit V1
**No player movement in this sprint. Audit only.**

---

## Architecture Finding

Level readiness in Academy OS is governed by a CRITICAL protection:

> `finalize_player_placement()` is the ONLY function that activates or moves a player.
> This is a hard architectural invariant — never bypassed.

---

## What Exists

### Level Change Infrastructure

| File | Purpose | Status |
|---|---|---|
| `supabase/functions/finalize_player_placement` | Only authorized level change function | ✅ Protected DB function |
| `src/app/director/placement/placementDraftAction.ts:112` | Calls `finalize_player_placement` | ✅ Director-only action |
| `src/app/director/review/actions.ts:3839` | Calls `finalize_player_placement` for placement reviews | ✅ Director-only |
| `src/app/director/onboarding/level-gates/` | Configures level gate criteria | ✅ Built |
| `src/app/director/review/VoiceIntakeDraftCard.tsx` | Shows `level_change_requested` flag | ✅ Built (display only) |

### What Does NOT Exist

- **No automatic level change trigger** — no code path moves a player without calling `finalize_player_placement`
- **No level readiness → auto-apply adapter** — readiness flags surface for director review, not automatic action
- **No DONNA-triggered level movement** — DONNA can flag readiness but cannot call `finalize_player_placement`

---

## Level Readiness Path (Proposed Safe Flow)

```
Coach observation / assessment → readiness flag in proposed_actions
  → Director review queue (level_change_requested card)
  → Director reviews evidence (player profile, history)
  → Director approves level change
  → Director explicitly triggers apply
  → placementDraftAction.ts → finalize_player_placement() RPC
  → Player moved to new level
```

**Current state of this path:** Director review card exists (shows flag). Full apply-from-readiness-flag path not yet wired to `finalize_player_placement` in a single cohesive flow.

---

## Safety Status

| Rule | Status |
|---|---|
| `finalize_player_placement` is only level change path | ✅ Confirmed — no other path found |
| DONNA cannot trigger level movement | ✅ Confirmed — DONNA outputs proposals only |
| Level readiness flag ≠ automatic movement | ✅ Confirmed — flag surfaces for review |
| Director approval required | ✅ All existing paths require director role |
| No automatic level demotion | ✅ Not found in any code path |
| No parent notification on level change | ✅ Not built |

---

## Gaps

| Gap | Severity | Resolution |
|---|---|---|
| No preview UI for level movement impact | LOW | Sprint 583 |
| No approval guardrail component for level readiness | LOW | Sprint 584 |
| Readiness flag → apply flow not fully connected | MEDIUM | Future sprint (requires director intent) |

---

## Conclusion

Level readiness is the most protected pathway in the system. `finalize_player_placement()` is correctly the single gate. DONNA cannot bypass it. Director action required at every step. No migration needed in this sprint.
