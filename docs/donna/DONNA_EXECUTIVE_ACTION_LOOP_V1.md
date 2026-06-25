# DONNA Executive Action Loop V1

**Mega Sprint 4111–4140 · 2026-06-25**

> A recommendation is only valuable if DONNA knows whether it was completed. Conversation
> is one signal; UI activity is equally important. DONNA observes every significant
> action and immediately understands what changed, what completed, what failed, and what
> remains — without the Director explaining.

**No new routing, OpenAI integration, or memory architecture.** UI events are passed in
(the client emits them) and **reduced** — pure and idempotent, no new route, model call,
or store.

---

## 1. UI event architecture (Objective 1)

```ts
type UIEventKind =
  'page_change' | 'navigation' | 'click' | 'form_submit' | 'save'
  | 'approval' | 'workflow_complete' | 'validation_error' | 'cancel'

interface UIEvent { kind: UIEventKind; target?: string; route?: string; ok?: boolean; detail?: string; seq: number }
```

Events carry a **canonical target** (`dna`, `curriculum_level`, `assign_coach`,
`template`, `wrapup`, …) and a monotonic `seq` used for ordering and de-duplication.
`save / form_submit / approval / workflow_complete` are completion signals.

---

## 2. Action verification (Objective 2)

`verifyRecommendation(rec, events)` returns one of **completed · partial · failed ·
cancelled · pending** from events alone — no confirmation asked:

- a completion event for the target → **completed**,
- a `validation_error` (or `ok:false`) → **failed**, carrying the reason,
- a `cancel` → **cancelled**,
- activity (click/open) but no completion → **partial**,
- nothing for the target → **pending**.

The **latest meaningful event wins**, so a successful retry after a failed attempt
resolves to completed.

---

## 3. Workflow synchronization (Objective 5)

`reduceWorkflowState(area, events)` reduces the live workflow for each of the 7 areas
(Academy Setup, Curriculum, Templates, Players, Coaches, Sessions, Approvals) — a step
completes when a completion event for its target appears; a validation error on the
current step is the **blocker**; the first incomplete step is the **current step** and
drives the **next action**. State updates automatically — no manual confirmation.

---

## 4. The closed loop (Objectives 3 + 4 + 6)

```
Recommendation → Director action → UI event → Verification → Executive update → Next
```

`closeActionLoop(rec, events)` verifies the recommendation, updates the workflow, phrases
the executive update, and produces the next recommendation:

| Verdict | Executive update |
|---|---|
| completed (mid-workflow) | "… is done. Next, <step>." |
| completed (workflow end) | "I see you completed Academy Setup." / "The curriculum has been saved." |
| failed | "The coach assignment failed because a level wasn't selected. Let's fix that…" |
| cancelled | "… was cancelled. Want to pick it back up, or move on?" |
| partial | "… was started but not finished. Next, <step>." |

Recommendations adapt immediately; the loop is marked **closed** on completed / failed /
cancelled.

---

## 5. Completion detection — de-duplicated, significant-only

`emitExecutionGuidance(events, acknowledged)` narrates **only new significant events** —
never clicks or page changes, never the same event twice — and returns the updated
acknowledged set. The loop stays quiet unless something real happened, and never asks
the Director to confirm what the events already prove.

---

## 6. Developer diagnostics (Objective 7)

`buildActionLoopDiagnostics(area, events, rec)` exposes: the UI events, workflow + the
completed/remaining steps, verification status, the completed / failed / pending action,
the blocker, and a 0–1 execution confidence. Developer-only.

---

## 7. Wiring (minimal, additive)

- `uiEvents?` added to `DonnaMessageInput` and `ResolverState` (optional; absent when the
  client emits none).
- `liveResolverAdapter` passes them through.
- `executiveOperatingLayer` reduces the live `workflowState` from them, exposes it on the
  turn result, and folds a compact EXECUTION directive ("confirm from events, never ask")
  into the existing reasoning call — alongside the dialogue and session directives.

No new gateway, route, or store; the executive layer is unchanged.

---

## 8. Certification

`donnaExecutiveActionLoopCertification.ts` — **31/31**, offline + deterministic:

| Section | Proves |
|---|---|
| A | Four verdicts (completed/failed/cancelled/partial/pending) + retry-after-failure |
| B | All 7 workflows advance the current step from events; full completion has no remainder |
| C | Failed validation surfaces the blocker on the right step |
| D | Loop closes; next recommendation generated; updates acknowledge + explain, never confirm |
| E | Only significant events narrated, never twice, new event narrated once |
| F | Diagnostics expose events, workflow, verification, failed action, blocker, confidence |
| G | Live operating turn reduces workflow state from `uiEvents`; directive says "never ask" |

Full registered suite green (19/19, zero failures). `tsc --noEmit` clean.

---

## 9. Remaining gaps

- **Client emission.** The engine is ready and wired; the actual UI event emitters
  (instrumenting buttons/forms/saves to populate `uiEvents`) are a frontend follow-up.
  Until then events arrive only when a caller supplies them.
- **Heuristic target mapping** — robust + deterministic, but a UI action whose target
  isn't in the catalog won't verify; expanding the target vocabulary is incremental.
- **Executive layer dormant live** (`DONNA_EXECUTIVE_REASONING` unset) — the execution
  directive applies when enabled; the reduction runs and is certified now.
- **Single-area workflow** — the loop reduces the active objective's workflow; concurrent
  multi-area execution in one turn is out of scope for V1.

---

## 10. Scores

- **Executive Action Loop: 9 / 10** — DONNA verifies execution from UI events across all
  7 workflows, closes the loop, adapts on failure, and never asks for confirmation. Held
  from 10 by the pending client-side emitters and the live-flag gap.
- **God Mode: 9.7 / 10** — conversation and UI are now one operating experience: DONNA
  knows what was said AND what was done. Remaining lift: client event emitters, live-flag
  enablement, and durable learning.
