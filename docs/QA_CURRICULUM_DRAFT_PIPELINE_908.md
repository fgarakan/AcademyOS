# QA Checklist — Curriculum Draft Pipeline
## Sprint 908 — Internal QA V1

**Sprint context:** Sprints 899–907 built the full curriculum draft pipeline.
This document records the Sprint 908 internal QA audit: what was tested,
what passed, what gaps were found, and what was fixed.

**Date:** 2026-05-27
**Auditor:** Sprint 908 internal review

---

## Pipeline Map

```
DONNA panel (UI)
  └─ createCurriculumContentItemDraft()       [curriculumDraftActions.ts]
       └─ INSERT academy_curriculum_overrides status='pending_review'
            └─ CurriculumBuilderChangeQueue   [server component, live query]
                 └─ CurriculumChangeQueue     [client component, shows queue]
                      └─ Approve button
                           └─ approveCurriculumOverrideDraft()  [approval action]
                                ├─ Step 1: UPDATE status='approved'
                                ├─ Step 2: execute_curriculum_override() [RPC]
                                │    └─ curriculum_content_items mutated
                                │    └─ status='applied'
                                │    └─ audit_logs entry
                                ├─ On RPC failure: attemptResetApprovedToPending()
                                │    └─ UPDATE status='pending_review' (if still approved)
                                │    └─ audit_logs: curriculum_override.approve_cleanup
                                └─ Step 3: Verify status='applied' by re-fetch
                      └─ Reject button
                           └─ rejectCurriculumOverrideDraft()   [approval action]
                                └─ UPDATE status='rejected'
                                └─ audit_logs: curriculum_override.rejected
                 └─ CurriculumApprovalRecoveryNotice [Sprint 907, read-only]
                      └─ Query: status='approved' AND approved_at < now()-10min
```

---

## Test Checklist

### TC-1 — Create Drill Draft

| Step | Expected | Status |
|------|----------|--------|
| Director opens level page | Level builder renders with DONNA panel | ✅ |
| Director clicks "Add a drill" chip | `DonnaAddDrillDraft` panel opens | ✅ |
| Director types ≥20 chars and clicks "Create draft" | `createCurriculumContentItemDraft({ contentType: 'drill', source: 'typed' })` called | ✅ |
| Server action returns `{ ok: true, draftId }` | `submitted = true`, success card shown | ✅ |
| `academy_curriculum_overrides` row created | `status='pending_review'`, `target_type='content_item'`, `override_type='add'`, `scope='academy'`, `proposed_change.content_type='drill'`, `academy_id = profile.academy_id` | ✅ |
| `audit_logs` entry written | `action='curriculum_override.draft.created'` (non-fatal) | ✅ |
| Input shorter than 20 chars | "Create draft" button disabled | ✅ |
| Auth check | Unauthenticated → `'Not authenticated.'` blocked=true | ✅ |
| Role check | Non-director/head_coach → `'Only directors and head coaches can create curriculum drafts.'` blocked=true | ✅ |
| Preview mode | `assertNotPreviewMode()` blocks write | ✅ |

**Gap TC-1-G1:** After success, `DonnaAddDrillDraft` does NOT call `router.refresh()`. The sidebar queue does not auto-update until a manual page refresh. Draft exists in DB, but director will not see it in the pending queue without reloading. **Sprint 909 candidate.** (Minimal fix this sprint: `revalidatePath` added to server action so the next full page load reflects the new draft — see Fix F-1.)

---

### TC-2 — Create Fitness Exercise Draft

| Step | Expected | Status |
|------|----------|--------|
| Director uses `DonnaAddFitnessExerciseDraft` | `createCurriculumContentItemDraft({ contentType: 'fitness' })` called | ✅ |
| `proposed_change.content_type = 'fitness'` | Correct | ✅ |
| Error on blocked result | "Only authorized academy leaders can create curriculum drafts." | ✅ |
| Error on non-blocked result | "I couldn't create this curriculum draft yet. Please check the required fields and try again." | ⚠️ See Note |

**Note TC-2-N1:** The non-blocked error copy says "Please check the required fields" — but the action may fail for reasons unrelated to fields (DB error, network, version not found). The copy is slightly misleading in those cases but acceptable for V1. Sprint 909 candidate for improved error specificity.

---

### TC-3 — Create Assessment Gate Draft

| Step | Expected | Status |
|------|----------|--------|
| Director uses `DonnaAddAssessmentGateDraft` | `createCurriculumContentItemDraft({ contentType: 'assessment' })` called | ✅ |
| `proposed_change.content_type = 'assessment'` | Correct | ✅ |

---

### TC-4 — Draft Appears in Pending Queue

| Step | Expected | Status |
|------|----------|--------|
| `CurriculumBuilderChangeQueue` renders | Queries `academy_curriculum_overrides` WHERE `status IN ('pending_review', 'draft')` AND `academy_id = profile.academy_id` | ✅ |
| New draft visible | Title, content type badge, source badge, status="Pending review", date shown | ✅ |
| Approve/Reject buttons visible | `status === 'pending_review'` → buttons rendered | ✅ |
| Queue scoped to academy | `academy_id` from authenticated `profiles.academy_id`, never from client | ✅ |
| Draft from another academy | Excluded by RLS + explicit `eq('academy_id', academyId)` filter | ✅ |
| Error state | Query failure → "I couldn't load curriculum drafts yet." | ✅ |

**Gap TC-4-G1:** Same as TC-1-G1 — queue does not auto-refresh after draft creation (no `router.refresh()` in DONNA panels). **Sprint 909 candidate.**

---

### TC-5 — Approve Draft (Happy Path)

| Step | Expected | Status |
|------|----------|--------|
| Director clicks "Approve" on a `pending_review` item | `approveCurriculumOverrideDraft(id)` called | ✅ |
| Spinner shown while approving | `loading: 'approving'` | ✅ |
| Step 1: UPDATE status='approved' | `approved_by`, `approved_at` set | ✅ |
| Step 2: `execute_curriculum_override()` RPC | Called with `{ p_override_id, p_executor_id }` | ✅ |
| DB function validates status='approved' | Function checks status before executing | ✅ |
| DB function validates role via `p_executor_id` | Explicit `academy_memberships` check, not `auth.uid()` | ✅ |
| `curriculum_content_items` row created (add path) | `source_type='academy_custom'`, `academy_id = override.academy_id` | ✅ |
| Override row marked `status='applied'` | `applied_by`, `applied_at`, `applied_change` set by DB function | ✅ |
| `audit_logs` entry written | `action='curriculum_override.applied'` by DB function | ✅ |
| Step 3: Verify status='applied' | Server action re-fetches row and confirms `status === 'applied'` | ✅ |
| `revalidatePath` called | `/director/curriculum` and `/director/curriculum/builder` | ✅ |
| UI success feedback | "Draft approved and applied." (lime text + icon) | ✅ |
| `router.refresh()` called | RSC re-renders, applied item disappears from queue | ✅ |
| Buttons disabled during in-flight action | `isBusy = loading !== null` | ✅ |
| Global curriculum NOT mutated | DB function Step 4 guard + branch-level `academy_id` check | ✅ |

---

### TC-6 — Approve Draft — RPC Failure Path

| Step | Expected | Status |
|------|----------|--------|
| `rpcError` (network/PostgREST failure) | `attemptResetApprovedToPending()` called | ✅ |
| Cleanup UPDATE guard | `.eq('status', 'approved')` — no-op if row already 'applied' | ✅ |
| Cleanup clears `approved_by`/`approved_at` | `null` set on reset | ✅ |
| Audit log written | `action='curriculum_override.approve_cleanup'`, `source_type='system'` | ✅ |
| `revalidatePath` called after cleanup | Yes, both curriculum paths | ✅ |
| Error returned to director | "I couldn't approve this curriculum draft yet." | ✅ |
| UI error shown | Per-item error text, buttons remain for retry | ✅ |
| DB function RPC failure (`rpcResult.success = false`) | Same cleanup + same error message | ✅ |
| DB `WHEN OTHERS` handler | Writes `curriculum_override.apply_failed` audit entry independently | ✅ |
| Row stuck in 'approved' due to cleanup failure | Row remains; captured by recovery notice after 10 min threshold | ✅ |

---

### TC-7 — Approve Draft — Verification Failure Path

| Step | Expected | Status |
|------|----------|--------|
| RPC returns `{ success: true }` but row not 'applied' | Verification re-fetch detects mismatch | ✅ |
| Error returned | "The draft was approved, but I couldn't verify that it applied yet." | ✅ |
| `revalidatePath` still called | Yes — queue reflects actual state | ✅ |
| Director not told curriculum changed | Error message prevents false positive | ✅ |

---

### TC-8 — Reject Draft

| Step | Expected | Status |
|------|----------|--------|
| Director clicks "Reject" | `rejectCurriculumOverrideDraft(id)` called | ✅ |
| Spinner shown while rejecting | `loading: 'rejecting'` | ✅ |
| UPDATE status='rejected' | `override_reason` set (null — no reason input field in V1) | ✅ |
| `approved_by`/`approved_at` NOT set | Correct — override never reached 'approved' state | ✅ |
| `audit_logs` entry written | `action='curriculum_override.rejected'`, `actor_id=user.id` | ✅ |
| `execute_curriculum_override()` NOT called | Confirmed — rejection path never calls RPC | ✅ |
| `curriculum_content_items` NOT mutated | Confirmed | ✅ |
| `revalidatePath` called | Yes — both curriculum paths | ✅ |
| UI success feedback | "Draft rejected." (muted icon + text) | ✅ |
| `router.refresh()` called | RSC re-renders, rejected item disappears from queue | ✅ |

---

### TC-9 — Non-Actionable Items (Applied / Rejected / Rolled Back)

| Step | Expected | Status |
|------|----------|--------|
| Item with `status='applied'` | No approve/reject buttons rendered | ✅ |
| Item with `status='rejected'` | No buttons rendered | ✅ |
| Item with `status='rolled_back'` | No buttons rendered | ✅ |
| Queue query filter | Only `pending_review`/`draft` items queried — others never appear | ✅ |

---

### TC-10 — Recovery Notice

| Step | Expected | Status |
|------|----------|--------|
| No stuck rows | `CurriculumApprovalRecoveryNotice` returns `null` — hidden | ✅ |
| Stuck row (status='approved', approved_at < 10 min ago) | Recovery card visible below pending queue | ✅ |
| Recovery query failure | Non-fatal, degraded to empty array, notice hidden | ✅ |
| Newly approved row (< 10 min) | Excluded by `lt('approved_at', tenMinutesAgo)` — no false alarm | ✅ |
| Recovery card has no buttons | No approve/reject/retry/delete controls | ✅ |
| Copy is director-safe | "Needs Review" / "Some approved curriculum drafts may need review." | ✅ |
| Footer guidance | "These drafts were approved, but I haven't confirmed that they finished applying yet." | ✅ |
| Row with `approved_at IS NULL` | Excluded by SQL `<` semantics on NULL | ✅ |

---

## Architecture Invariants — Verified

### INV-1 — `proposed_actions` not used

**Finding:** Zero actual code usage. Two comment-only references in `curriculumDraftActions.ts`
(lines 165–166) document WHY it's excluded (`voice_command_id NOT NULL` constraint).

**Status: ✅ PASS**

---

### INV-2 — `execute_curriculum_override()` single call site

**Finding:** One `.rpc()` call — `src/lib/actions/curriculumOverrideApprovalActions.ts:293`.
All other `.rpc()` calls in the codebase are for unrelated functions
(`score_academy_players`, `finalize_player_placement`, `execute_approved_action`, etc.).

**Status: ✅ PASS**

---

### INV-3 — `academy_id` always from authenticated profile

**Finding:** Both `createCurriculumContentItemDraft()` and both approval actions resolve
`academy_id` via `profiles.select('academy_id').eq('id', user.id).single()`. Never trusted
from client input. Comments in both files explicitly document this.

**Status: ✅ PASS**

---

### INV-4 — Global curriculum never mutated

**Finding:** Multi-layered protection:
- DB function Step 4: explicit guard comment
- `add` branch: always sets `academy_id = v_override.academy_id` (NOT NULL)
- `update` branch: `WHERE academy_id = v_override.academy_id` — blocks global items
- `remove` branch: same guard + RAISE EXCEPTION if target is global
- Function COMMENT documents: "Global curriculum (academy_id IS NULL) is never mutated."

**Status: ✅ PASS**

---

### INV-5 — RLS enforced on both tables

**Finding:** `academy_curriculum_overrides` and `academy_curriculum_versions` both have RLS
enabled (migration 048). Policies use `auth_academy_id()` + `auth_is_director_or_head()`.
All server actions also apply explicit `eq('academy_id', academyId)` filters as belt-and-suspenders.

**Status: ✅ PASS**

---

### INV-6 — UI language is director-safe

**Finding:** All user-facing copy reviewed:
- "Draft created. It is now waiting for director review." — clear ✅
- "Draft approved and applied." — clear ✅
- "Draft rejected." — clear ✅
- "I couldn't approve this curriculum draft yet." — non-alarming ✅
- "The draft was approved, but I couldn't verify that it applied yet." — informative, not alarming ✅
- "Needs Review" / "Some approved curriculum drafts may need review." — calm ✅
- No raw DB language ("stuck", "RPC", "execute_curriculum_override", "academy_id", "status='approved'") exposed to director anywhere. ✅

**Status: ✅ PASS**

---

## Bugs and Gaps Found

### BUG-1 — `DonnaAddPlayerMissionDraft` is a stub (no server action called) [CRITICAL]

**File:** `src/components/curriculum/builder/DonnaAddPlayerMissionDraft.tsx`

**Description:** The component renders a text area and "Submit" button. On submit, it calls
a local `handleSubmit()` that only sets `submitted = true`. No call to
`createCurriculumContentItemDraft()` or any server action is made.
The director sees a success UI ("submitted") but **no draft is created in the database**.

This is deceptive behavior — director believes a draft was submitted but nothing happened.

**Impact:** High — director-facing data loss.

**Root cause:** Component was scaffolded as a placeholder and never wired.

**Recommended fix:** Wire to `createCurriculumContentItemDraft({ contentType: ??? })`.
Player missions don't map to an existing `content_type` — this needs product clarification
on the target content_type or a new type. **Do not wire without a defined content_type.**

**Sprint 909 candidate.** Block until content_type is defined.

---

### BUG-2 — `DonnaRewriteLevelDraft` is a stub (no server action called) [HIGH]

**File:** `src/components/curriculum/builder/DonnaRewriteLevelDraft.tsx`

**Description:** Same pattern as BUG-1. Local `handleSubmit()` sets `submitted = true`
only. No draft created. Director is given false confidence.

**Impact:** High — director-facing data loss.

**Root cause:** Placeholder component, never wired. `target_type='level'` overrides are
not yet handled by `execute_curriculum_override()` (migration 069 raises RAISE EXCEPTION
for `target_type='level'`). Wiring this requires both a new server action for level rewrites
and a future migration expanding `execute_curriculum_override()`.

**Sprint 909+ candidate.** Blocked until target_type='level' is supported in execution function.

---

### GAP-1 — No `router.refresh()` in DONNA draft panels after success [MEDIUM]

**Files:** `DonnaAddDrillDraft.tsx`, `DonnaAddFitnessExerciseDraft.tsx`, `DonnaAddAssessmentGateDraft.tsx`

**Description:** After `createCurriculumContentItemDraft()` returns `{ ok: true }`, none
of the three wired DONNA panels call `router.refresh()`. The sidebar
`CurriculumBuilderChangeQueue` (RSC slot) does not re-render. The new draft appears in
the pending queue only after a manual page refresh.

Compare: `CurriculumChangeQueue.tsx` correctly calls `router.refresh()` after approve/reject
(`router.refresh()` at lines 119 and 130).

**Minimal fix this sprint:** Added `revalidatePath` to `createCurriculumContentItemDraft()`
(Fix F-1 below) so the server-side cache is stale. Full fix (adding `router.refresh()` to
each DONNA panel) is Sprint 909.

---

### GAP-2 — `curriculum_version_id` not found is a silent onboarding blocker [MEDIUM]

**File:** `src/lib/actions/curriculumDraftActions.ts:304`

**Description:** If an academy has no `academy_curriculum_versions` row with
`status IN ('active', 'draft')`, draft creation fails with:
"No academy curriculum version found. Create one first from the Curriculum page."

New academies or academies whose curriculum version was archived will hit this blocker.
There is no UI affordance on the level builder page to create or activate a curriculum version.
The director must know to navigate to the Curriculum page separately.

**Impact:** Medium — onboarding blocker for some academies.

**Sprint 909 candidate.** Consider surfacing a curriculum version creation path from the error state.

---

### GAP-3 — `rawDb` typing inconsistency in `curriculumDraftActions.ts` [LOW]

**File:** `src/lib/actions/curriculumDraftActions.ts:264–289`

**Description:** `rawDb` is typed as a complex inline structural type (lines 264–289)
instead of `supabase as any`. The inline type is incomplete — the `audit_logs` INSERT
at line 380 uses `(supabase as any)` directly, bypassing the typed rawDb entirely.
This creates a maintenance inconsistency.

**Impact:** Low — no runtime behavior impact. TypeScript safety is minimal since it's `as any` anyway.

**Sprint 909 candidate.** Consolidate to `supabase as any` or regenerate types.

---

### GAP-4 — Non-blocked error copy suggests field validation failure for all errors [LOW]

**Files:** `DonnaAddDrillDraft.tsx`, `DonnaAddFitnessExerciseDraft.tsx`, `DonnaAddAssessmentGateDraft.tsx`

**Description:** Non-blocked error copy: "I couldn't create this curriculum draft yet.
Please check the required fields and try again." The "check the required fields" phrasing
is misleading when the actual failure is a DB error, network error, or missing curriculum
version (GAP-2). Field validation errors are caught earlier as `blocked=true`.

**Impact:** Low — minor copy issue.

**Sprint 909 candidate.**

---

### GAP-5 — Recovery notice threshold hardcoded (not a constant) [LOW]

**File:** `src/app/director/curriculum/builder/CurriculumBuilderChangeQueue.tsx:171`

**Description:** `new Date(Date.now() - 10 * 60 * 1000).toISOString()` — the 10-minute
threshold is an inline magic number. No named constant. Low maintenance risk but
inconsistent with codebase constant conventions.

**Sprint 909 candidate.** Extract to `APPROVAL_STUCK_THRESHOLD_MS = 10 * 60 * 1000`.

---

## Fixes Made This Sprint

### Fix F-1 — Added `revalidatePath` to `createCurriculumContentItemDraft()`

**File modified:** `src/lib/actions/curriculumDraftActions.ts`

**Change:** Added `import { revalidatePath } from 'next/cache'` and two `revalidatePath`
calls after successful draft creation:
```
revalidatePath('/director/curriculum')
revalidatePath('/director/curriculum/builder')
```

**Why:** Consistent with approval action pattern. Ensures server-side cache is stale after
draft creation, so the next full page load reflects the new draft in the pending queue.
`router.refresh()` in the DONNA panels (GAP-1) remains a follow-up for Sprint 909.

**Impact:** Minimal — one import, two lines. No behavior change for the success/error paths.
No migration. No mutation. No new dependency.

---

## Not Fixed — Deferred to Sprint 909

| ID | Description | Reason deferred |
|----|-------------|-----------------|
| BUG-1 | DonnaAddPlayerMissionDraft stub | Needs content_type product decision |
| BUG-2 | DonnaRewriteLevelDraft stub | Blocked on target_type='level' execution support |
| GAP-1 | router.refresh() in DONNA panels | Multi-file change, not minimal |
| GAP-2 | curriculum_version_id blocker UX | Requires new UI flow |
| GAP-3 | rawDb typing inconsistency | Low risk, cleanup sprint |
| GAP-4 | Error copy for non-validation failures | Minor copy sprint |
| GAP-5 | Hardcoded threshold constant | Minor cleanup |

---

## Recommendations for Sprint 909

Priority order:
1. **Wire `DonnaAddPlayerMissionDraft`** — requires product decision on `content_type` mapping for player missions. Once decided, wire to `createCurriculumContentItemDraft()` with the correct type, or scope it as a `target_type='mission'` override (future execution path).
2. **Add `router.refresh()` to `DonnaAddDrillDraft`, `DonnaAddFitnessExerciseDraft`, `DonnaAddAssessmentGateDraft`** — so the queue auto-updates after draft creation.
3. **Surface curriculum version creation affordance** — if `curriculum_version_id` is missing, show a director-facing prompt/link to create one, instead of a generic error.
4. **Mark `DonnaRewriteLevelDraft` and `DonnaAddPlayerMissionDraft` as not-yet-active** — add a visible "(Coming soon)" label or disable the UI trigger so directors do not see false-positive submission feedback.
