# Sprint 805 — Curriculum Builder Known Gaps V1

**Date:** 2026-05-18
**Sprint:** 805

---

## Known gaps — curriculum builder V1

### Gap 1 — DONNA drafts are UI shell only

**What works:** Director types a drill/gate/fitness description, clicks "Create draft", sees a success message.

**What doesn't work yet:** No record is written to `proposed_actions`. The director will not see the item in their Review Queue.

**Impact:** High for real use; low for pilot demo.

**V2 fix:** Add server action with `assertNotPreviewMode()` guard that inserts into `proposed_actions` with `action_type = 'curriculum_add_drill'` (or gate/fitness), `source = 'donna'`, `status = 'pending_review'`, full `audit_logs` entry.

---

### Gap 2 — CurriculumChangeQueue has no live data

**What works:** The `CurriculumChangeQueue` component renders correctly with items passed via props.

**What doesn't work yet:** No page queries `proposed_actions` and passes items to the component. The component always shows the empty state.

**Impact:** Medium — the queue UI exists but doesn't yet reflect real proposals.

**V2 fix:** Add a server-side query on the curriculum main page: `SELECT * FROM proposed_actions WHERE action_type LIKE 'curriculum_%' ORDER BY created_at DESC LIMIT 20`.

---

### Gap 3 — Impact preview has no live calculation

**What works:** `CurriculumImpactPreviewPanel` renders three metric cells cleanly with null state fallback.

**What doesn't work yet:** No function calculates players affected / levels affected / rollout weeks from real data.

**Impact:** Low — the UI is ready for when the calculation exists.

**V2 fix:** Write a `getCurriculumImpactEstimate(levelId, changeType, scope)` function that queries player enrolment counts.

---

### Gap 4 — No sidebar nav link to curriculum builder

**What works:** Director can navigate to `/director/curriculum` via URL or from the demo script.

**What doesn't work yet:** The director sidebar does not have a "Curriculum" nav item.

**Impact:** Low for pilot (director knows where to go); higher for self-serve use.

**V2 fix:** Add nav item in the director sidebar layout.

---

### Gap 5 — No curriculum-specific filter in review queue

**What works:** All `proposed_actions` appear in `/director/review`.

**What doesn't work yet:** No filter for `action_type LIKE 'curriculum_%'`.

**Impact:** Low — when curriculum drafts are wired (V2), the queue will mix types.

**V2 fix:** Add filter tabs or dropdown to review queue page.

---

### Gap 6 — No breadcrumb trail from level builder back to map

**What works:** Level builder has a back arrow (`ArrowLeft`) to `/director/curriculum/map`.

**What doesn't work yet:** No breadcrumb showing path: Curriculum → Map → Level Name.

**Impact:** Very low — arrow navigation is clear enough for pilot.

**V2 fix:** Add `<Breadcrumb>` component to level builder page header.
