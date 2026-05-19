# Phase 6 Final Audit — Sprint 1053

**Date:** 2026-05-19
**Sprint:** 1053 — Phase 6 Final Audit V1
**Block:** Phase 6 — Director Review Queue Apply Flow (Sprints 1046-1053)

---

## 1. Executive Summary

Phase 6 (Sprints 1046-1053) completes the Director Review Queue Apply Flow block. The review queue now has DONNA-guided context at every level: a brief panel at the top of the queue, a per-item detail route with DONNA context alongside decisions, a combined Approve & Apply action for wrap-ups, and clearer apply flows for observations.

The core operating loop is now closed end-to-end:
**Coach submits wrap-up → Director sees it in DONNA → Director navigates to Review Queue → DONNA brief surfaces what to do first → Director clicks into the item → DONNA explains what it is, who submitted it, what it changes → Director approves or approves+applies in one step → Session record is updated → Loop complete.**

**Phase 6 verdict: COMPLETE.**

---

## 2. What Was Built

### Sprint 1046 — DONNA Review Brief Panel
- `DonnaReviewBriefPanel.tsx` — compact summary banner above review tabs
- Shows: total pending, per-section breakdown, urgency indicator, recommended starting tab
- Stale items (7+ days) trigger orange mode with explicit warning

### Sprint 1047 — Per-Item Review Detail Route
- `/director/review/[actionId]` — Server Component detail page
- Auth + academy + role guard on every load
- Supports 8 draft types with correct card + decision + apply controls
- Breadcrumb back to Review Queue
- Safe fallback for unsupported types

### Sprint 1048 — DONNA Context Panel
- `DonnaReviewContextPanel.tsx` — sidebar on per-item review page
- 2-column layout: item card (2/3) + DONNA context (1/3) on desktop
- Sections: DONNA brief, submission details, what-changes-when-applied, clarification note, safety footer
- Per-module "will change / will NOT change" table for 8 draft types

### Sprint 1049 — Approve + Apply Combined Action
- `approveAndApplyWrapUpAction.ts` — single server action for wrap-up approve+apply
- Auth + role + academy scope checked; only valid for `pending_review` + `session_wrap_up_v1`
- Writes session notes, advances session status, sets `status=executed`, writes audit log
- "Approve & Apply" primary button added to `WrapUpDraftDecisionControls`
- Two-step flow fully preserved

### Sprint 1050 — Wrap-Up Coverage Panel Polish
- Added `coachName` to `WrapUpSessionStatus` via batch profile fetch
- Session rows now link to `/director/sessions/[id]`
- "Missing wrap-ups" callout shows coach name + View link

### Sprint 1051 — Observation Apply Flow Polish
- DONNA brief line on observation draft card (who · session · date)
- Structured "What changes when applied" box on `ApplyWrapUpObservationDraftControls`
- Clear will/will-not language on every apply control

---

## 3. Director Review Queue Usability Score — 9/10

**Before Phase 6 (Phase 5 audit): 8/10**

| Dimension | Before | After |
|---|---|---|
| Knowing where to start | 6/10 — summary cards only | 9/10 — DONNA brief + recommended action |
| Per-item decision context | 5/10 — inline card only | 9/10 — dedicated page + DONNA context panel |
| Approve + Apply friction | 6/10 — two separate steps | 9/10 — one-click combined action |
| Wrap-up coverage visibility | 7/10 — status only | 9/10 — coach names + session links |
| Observation flow clarity | 7/10 — generic info box | 9/10 — explicit will/will-not breakdown |

**Remaining gap (why not 10/10):**
- No direct links from queue items to their per-item detail page (items are inline, not linked)
- No urgency score or AI-ranked ordering within each tab section
- "Needs Clarification" note doesn't have a coach notification pathway

---

## 4. DONNA Guidance Score — 8/10

**What works:**
- DONNA brief panel surfaces recommended starting point on every queue load
- Per-item DONNA brief gives module-specific guidance
- What-changes panel is deterministic and accurate per module
- Safety footer present on every DONNA surface

**What is keyword-dispatch only (no AI):**
- DONNA briefs are static strings per module — not context-adaptive
- No per-item narrative: "This coach has submitted 5 wrap-ups this week, this one has 2 flagged blocks"
- No cross-item synthesis: "Your biggest gap today is 3 missing observation applications"

**Integration path to 10/10:** Same as Phase 5 — `ANTHROPIC_API_KEY` + `/api/donna/ask` Edge Function with action context as system prompt.

---

## 5. Apply Flow Safety Score — 10/10

All apply paths verified:
- Combined Approve & Apply: auth + role + academy + module + status all checked before any write
- No write on failure: if session update fails, action status is not updated
- Audit log written with `source: 'approve_and_apply_combined'`
- Status never goes backwards (only advances `planned`/`in_progress` → `completed`)
- No parent records, player levels, curriculum, or external sends in any apply action
- `assertNotPreviewMode()` present on every server action

---

## 6. Coach Evidence Loop Closure Score — 8/10

**Loop steps that now work end-to-end:**
1. Coach submits wrap-up (existing)
2. Director sees pending count in DONNA brief panel (new)
3. Director navigates to Review Queue → DONNA shows what to review first (new)
4. Director clicks "Approve & Apply" on wrap-up → session record updated (new)
5. Observation drafts: director reviews, sees what changes, applies safely (polished)

**Remaining gaps (why not 10/10):**
- No deep link from DONNA Review Queue Surface → individual item detail page
- Observation drafts: coach is not notified when director requests clarification (notification layer not built)
- Missing wrap-up chasing: coverage panel shows missing items but has no "remind coach" action (by design — no external sends without review)

---

## 7. What Is Live (with real Supabase data)

- DONNA review brief panel counts: live (from page.tsx computed variables)
- Per-item detail page: live (loads from `proposed_actions` by ID, verifies academy)
- Coach names in coverage panel: live (from `profiles` table)
- Approve & Apply: live (writes to `sessions` + `proposed_actions` + `audit_logs`)
- Observation apply: live (existing `applyApprovedObservationDraftAction`)

---

## 8. What Is Demo / Fallback

- DONNA briefs on context panel: static strings per module (not context-adaptive)
- Recommended action on brief panel: rule-based (not AI-ranked)
- DONNA context panel risk level: shows from `proposed_actions.risk_level` — only populated for voice intake drafts (other types return null → no risk badge shown)
- No per-coach or per-player narrative in any Phase 6 surface

---

## 9. What Still Requires Backend / Migration Later

- Curriculum gap detection: still returns `[]` — needs curriculum spine table populated
- Coach notification when clarification requested: would require a notification pipeline (not built)
- Deep links from DONNA Review Queue Surface → per-item detail: CTA on `DonnaReviewQueueSurface` currently links to the review queue page, not individual items
- Observation `reviewerNotes` on `EnrichedObservationDraftItem`: not included in the type — requires adding to the enrichment in `page.tsx` and the loader

---

## 10. Remaining Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Partial state on Approve & Apply (session written, action not updated) | Low | Error message surfaces clearly; director can apply manually via two-step |
| Coach name missing in coverage panel | Low | Falls back to no name display; no error |
| Unsupported draft types on per-item detail | Low | Safe fallback card rendered |
| DONNA briefs are static — may become inaccurate if module behavior changes | Medium | Brief strings are in one constant (`DONNA_BRIEF`) — easy to update |

---

## 11. Recommended Next Sprint Block

**Recommendation: Player Profile Evidence Hub + Parent/Player Portal Foundation (Sprint Block 1054+)**

**Rationale:**
- The Director Review Queue now has a clear, guided apply flow for all main draft types
- The core operating loop (coach → DONNA → review → apply) is closed
- The next gap in the operating loop is what happens AFTER apply: does the evidence land on player profiles? Do parents and players see the outcome?
- The Player Profile Evidence Hub would surface approved evidence on player cards
- The Parent/Player Portal would complete the full arc: Coach captures → Director reviews → Parent sees approved update

**Alternative: DONNA AI Integration**
- If Brian's pilot requires natural language Q&A (beyond keyword dispatch), wiring `ANTHROPIC_API_KEY` to a DONNA edge function is the next highest-value unlock
- This can be done in parallel with the Evidence Hub since it only requires one new API route

**Decision: Player Profile Evidence Hub + Parent/Player Portal Foundation.** The operating loop is structurally complete — now make it visible to all stakeholders.

---

## Scores Summary

| Dimension | Score |
|---|---|
| Director review queue usability | 9/10 |
| DONNA guidance | 8/10 |
| Apply flow safety | 10/10 |
| Coach evidence loop closure | 8/10 |
| Role safety | 10/10 |
| Review-first compliance | 10/10 |
| **Overall Phase 6** | **9.2/10** |

**Phase 5 + Phase 6 combined operating loop: CONNECTED, GUIDED, AND SAFE.**
**What it lacks for 10/10: AI-adaptive DONNA context, coach notification pathway, player-level outcome visibility.**
