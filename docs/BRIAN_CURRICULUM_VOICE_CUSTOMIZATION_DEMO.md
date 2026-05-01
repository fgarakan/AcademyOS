# Brian's Curriculum Voice Customization Demo

**Sprint:** 70
**Demo actor:** Brian (academy_director at Dabul Academy)
**Route entry point:** `/director/curriculum`
**Last updated:** 2026-05-01

---

## Demo Setup

1. Sign in as `brian@dabulacademy.com` (academy_director role)
2. Migration 048 applied
3. No active academy curriculum version yet (fresh demo start)

---

## Step 1 — Show the Global Master Curriculum

**Action:** Navigate to `/director/curriculum`

**What Brian sees:**
- Page header: "Curriculum"
- Global / Academy Curriculum Spine card: 15 curriculum levels, track requirements count
- Orange Ball Starter Content card: 29 content items
- Curriculum-Aware Templates card: templates with curriculum level count
- Academy Curriculum Version card: orange warning — "No academy curriculum version found"
- Voice Curriculum Customization panel: disabled, shows warning

**Say:** "Brian, this is the global curriculum spine — 15 levels from Red Foundation to High Performance. Your academy will customize on top of this without ever touching the global master."

---

## Step 2 — Create Dabul Academy Curriculum Version

**Action:** Click "Create Academy Curriculum Version" button on the Academy Curriculum Version card

**What happens:**
- `createAcademyCurriculumCloneAction` runs server-side
- Academy ID resolved from Brian's authenticated profile
- Role check: `academy_director` ✓
- No existing active version → insert `academy_curriculum_versions` row
- name: "Dabul Academy Curriculum V1", status: "active", version_number: 1
- audit_logs entry: `curriculum_clone.version.created`

**What Brian sees after refresh:**
- Academy Curriculum Version card now shows: name, status = "active", version_number = 1
- Override count = 0
- Link to "View version details & overrides"
- Voice Curriculum Customization panel is now enabled

**Say:** "Dabul Academy now has its own curriculum version. All customizations stay in this version — the global master is unchanged."

---

## Step 3 — Director Speaks / Types a Curriculum Change

**Action:** In the Voice Curriculum Customization panel, type:

> "For our Orange 2 kids, I want more return-of-serve work before they move to Orange 3."

**Click:** "Create Override Draft"

**What happens:**
- `createCurriculumOverrideDraftAction` runs
- Deterministic parser V1:
  - `parsed_level` = "Orange 2 — Direction"
  - `parsed_pathway` = null (not specified)
  - `parsed_focus` = ["return-of-serve"]
  - `parsed_scope` = null (not specified → clarification question added)
- `affected_targets_guess` includes: curriculum level, track requirements, template block population, coach cues, player level-up requirements
- `clarification_questions` = ["What scope should this apply to? (one session / this group / all groups at this level / academy curriculum)"]
- Inserts `proposed_actions` row: `target_module = 'curriculum_override'`, `status = 'pending_review'`

**What Brian sees:**
- Success message: "Draft created — check Review Queue."
- Input cleared

**Say:** "The OS has parsed your intent and created a structured draft. Nothing has changed yet — it's waiting in the Review Queue for your approval."

---

## Step 4 — Draft Appears in Director Review Queue

**Action:** Navigate to `/director/review`

**What Brian sees:**
- Curriculum Override Drafts section with badge: "1 pending"
- `CurriculumOverrideDraftCard` shows:
  - Header: "Curriculum Override Draft V1 · Pending review"
  - Director input: "For our Orange 2 kids, I want more return-of-serve work before they move to Orange 3."
  - Parsed level: "Orange 2 — Direction"
  - Focus: "return-of-serve"
  - Scope: (not detected)
  - Proposed change summary
  - Clarification question: "What scope should this apply to?"
  - Safety banner: "Draft only. No curriculum has been changed."

**Say:** "The OS shows you exactly what it parsed, what it thinks will be affected, and what it's not sure about. You decide before anything applies."

---

## Step 5 — Director Approves

**Action:** Click "Approve for Application"

**What happens:**
- `updateCurriculumOverrideDraftDecisionAction` runs
- Verifies academy_id, membership, target_module, draft_type
- Updates proposed_action: `status = 'approved'`, `approved_by = brian.id`, `approved_at = now`

**What Brian sees:**
- Green success message: "Decision recorded. Refreshing queue…"
- Card moves to "Approved — Ready to Apply" section

---

## Step 6 — Apply the Override

**Action:** Click "Apply Academy Curriculum Override" button

**What happens:**
- `applyApprovedCurriculumOverrideDraftAction` runs
- Verifies status = 'approved', target_module = 'curriculum_override', academy ownership
- Inserts `academy_curriculum_overrides` row: status = 'applied', applied_by = brian.id
- Writes `audit_logs` entry: `curriculum_override.applied`
- Marks proposed_action as 'executed'

**What Brian sees:**
- Green success message: "Override applied. Refreshing…"
- Card disappears from Review Queue (moved to executed)

---

## Step 7 — Academy Override List Shows Active Customization

**Action:** Navigate to `/director/curriculum/academy-version`

**What Brian sees:**
- Version summary: "Dabul Academy Curriculum V1", status = active, version_number = 1
- Applied overrides count: 1
- Applied Curriculum Overrides section with `CurriculumOverrideDiffCard`:
  - Status: "applied"
  - Director input: the original quote
  - Level: "Orange 2 — Direction"
  - Focus: "return-of-serve"
  - Before: "Global default (no snapshot captured)"
  - After: summary of the applied change
  - Rollback button visible

---

## Step 8 — Diff / Impact Preview

**What Brian sees on the diff card:**
- Before state: "Global default (no snapshot captured at override time)"
- After state: proposed change summary
- Downstream impact: "Impact partially inferred. This override affects template block population, coach session cues, and player requirement interpretation for Orange 2 — Direction (focus: return-of-serve). Parent/player-safe summaries are not yet override-aware (V1 limitation)."

**Say:** "The system shows you exactly what changed and where it could flow downstream. In V1 the impact is inferred — future versions will show exact template and player profile changes."

---

## Step 9 — Director Rolls Back the Override

**Action:** Click "Rollback" button, then "Confirm Rollback"

**What happens:**
- `rollbackAcademyCurriculumOverrideAction` runs
- Verifies ownership, status = 'applied'
- Inserts rollback record: `rollback_of_override_id = <original id>`, status = 'applied', override_type = 'remove'
- Updates original override: status = 'rolled_back'
- Writes `audit_logs` entry: `curriculum_override.rolled_back`

**What Brian sees:**
- "Rolled back." success message
- Page refreshes
- Applied override moves to "Rolled Back Overrides" section
- Rollback record visible in Applied Overrides

---

## Step 10 — Confirm Global Master Unchanged

**Action:** Check `/director/curriculum` global stats

**What Brian sees:**
- `curriculum_levels` still 15
- `curriculum_content_items` still 29
- No changes to global curriculum tables

**Say:** "The global curriculum is exactly as it was. Your academy version holds all customizations — the global spine is protected and shared across all academies."

---

## Demo Complete

**Summary of what we demonstrated:**
1. Global master curriculum exists and is read-only for directors
2. Academy curriculum version cloned (lightweight reference, no physical duplication)
3. Voice input parsed deterministically — no AI called
4. Draft created in Review Queue with structured payload
5. Director approves in Review Queue
6. Applied → official `academy_curriculum_overrides` row created
7. Override visible in Academy Version screen with diff card
8. Director rollbacks — creates rollback record, marks original rolled_back
9. Global master unchanged throughout

**Guardrails demonstrated:**
- academy_id always from auth profile
- Role check on every action
- All mutations go through proposed_actions pipeline
- No player level changes
- No parent/player visibility
- No AI API calls
- All changes audited
