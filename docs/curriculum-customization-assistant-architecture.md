# Curriculum Customization Assistant Architecture

**Sprint 26 — Architecture V1**
**Date:** 2026-05-05
**Status:** Architecture-only. The underlying `academy_curriculum_overrides` system is already built.
This document designs the guided UX assistant layer on top of the existing system.

---

## Product Goal

The Curriculum Customization Assistant helps a director (or consultant like Brian) adapt the
global or academy-master curriculum to their specific teaching context — one question at a time,
with full audit trail and downstream impact preview before any change is applied.

**Design principle:** The assistant asks; the director decides. Nothing changes without a click.

---

## Assistant Flow

```
Director opens Curriculum Customization Assistant
  → Assistant shows current academy curriculum summary
    → "What would you like to customise today?"
      (one focused scope question — not a form)
      
  Scope answers:
    A. For one session: session picker → show affected template blocks → propose overrides
    B. For one group: group picker → show group curriculum state → propose overrides
    C. For one level: level picker → show requirements, gates, cues, drills → propose overrides
    D. For the whole academy: summarise all active overrides → propose batch changes
    E. For Brian's master: locked for non-consultants → show read-only → consultant mode if authorised

  → Director selects scope
    → Assistant shows: "What aspect would you like to change?"
      (targeted pick from the customization targets list)
      
  → Director selects target
    → Assistant shows current value (from resolved curriculum with overrides applied)
    → Director types new value or selects from suggested options
    
  → Assistant shows impact preview:
    - Which templates will be affected?
    - Which sessions will inherit this change?
    - Which players in that level/group?
    - Will any Gap Class modules or assessments be affected?
    - Will any parent/player explanations change? (only if published)
    
  → Director confirms → creates proposed_action (target_module = 'curriculum_override')
  → Director reviews in Director Review Queue → applies via existing flow
```

---

## One-Question-at-a-Time Director Experience

The assistant must not overwhelm the director with a form. Instead:

1. **Question 1:** "What level or scope do you want to customise?"
2. **Question 2:** "What part of the curriculum?" (the target list below)
3. **Question 3:** "Here is the current value. What should it say instead?"
4. **Confirmation:** "This will affect: [list]. Proceed?"
5. **Submit:** Creates draft in proposed_actions. Director reviews in queue.

Between each question, the assistant shows only the answer to the previous question — no long lists, no multi-form UI.

---

## Supported Customization Targets

| Target | What it changes | Where stored |
|---|---|---|
| Level gates | Advancement criteria for a curriculum level | `academy_curriculum_overrides` override_type = 'level_gate' |
| Progression requirements | Required domains or skills before advancement | `academy_curriculum_overrides` override_type = 'requirement' |
| Key questions | The 5 coaching questions per domain | `academy_curriculum_overrides` override_type = 'question' |
| Key exercises | The 3 primary exercises per domain | `academy_curriculum_overrides` override_type = 'exercise' |
| Key drills | The 2-4 preferred drills per domain | `academy_curriculum_overrides` override_type = 'drill' |
| Coach cues | The exact language coaches use | `academy_curriculum_overrides` override_type = 'coach_cue' |
| Assessment criteria | What constitutes pass/fail for a requirement | `academy_curriculum_overrides` override_type = 'assessment_criterion' |
| Parent/player explanations | The public-facing description of a skill | `academy_curriculum_overrides` override_type = 'parent_explanation' |

---

## Curriculum Override Draft Model

The existing system already handles this:

```
1. Director submits customization via assistant
     ↓
2. `createVoiceIntakeDraftAction` OR new `createCurriculumOverrideDraftAction`
   creates proposed_action with:
     target_module = 'curriculum_override'
     draft_type = 'curriculum_override_v1'
     proposed_payload = { override_type, target_type, scope, proposed_change, ... }
     status = 'pending_review'
     ↓
3. Director reviews in /director/review (Curriculum tab)
     ↓
4. Director approves → `applyApprovedCurriculumOverrideDraftAction`
   creates `academy_curriculum_overrides` row
     ↓
5. Override is applied to all downstream resolution calls
   (`resolveAcademyCurriculumContext`, `buildOverrideSummaryLines`, etc.)
```

The assistant does NOT bypass this flow. The propose→review→apply sequence is always required.

---

## Scope Prompts

| Scope | What it means | Downstream impact |
|---|---|---|
| One session | Override applies to a specific generated session | Template snapshot; next generation may differ |
| One group | Override applies to all sessions for a specific group | All future sessions for that group |
| One level | Override applies to all sessions/players at that curriculum level | All future sessions at that level across all groups |
| Whole academy | Override applies to all levels and groups | Maximum impact — requires explicit confirmation |
| Consultant / Brian master | Modifies the global Brian master curriculum | Blocked for non-consultants. Requires special role. |

Scope is stored in `academy_curriculum_overrides.scope`.

---

## Source Preservation

### Global master curriculum (`curriculum_versions` where is_global_master = true)
- Read-only for all academy directors.
- All customizations go to `academy_curriculum_overrides`.
- Global master is never modified by the assistant.

### Brian master curriculum (`curriculum_versions` where source = 'brian_master')
- Read-only for academy directors.
- Consultant mode (explicit role required) would allow modifications — not in V1.
- The assistant shows Brian's master content as the "base" when the academy has no override.

### Academy clone (`academy_curriculum_versions`)
- The academy's editable layer.
- All assistant changes write to `academy_curriculum_overrides` against this version.
- Rollback is always possible — overrides are never destructive.

---

## Versioning

- Each assistant customization creates a new `academy_curriculum_overrides` row.
- Previous overrides are preserved with their own status history.
- `rollback_of_override_id` field links a rollback override to the original.
- Directors can see their override history per level/domain via the academy version view.

---

## Rollback

- Director selects an applied override in the version history.
- Assistant shows: "This override changed [target] from [original] to [current]. Would you like to restore the original?"
- Director confirms → creates a new rollback override (override_type = 'remove', rollback_of_override_id set).
- Rollback is itself a proposed_action → requires director review → applies.
- No immediate undo. Rollback is deliberate, reviewed, audited.

---

## Diff / Compare

The curriculum compare view shows:
- Left column: global master (or Brian master) value
- Right column: academy current value (with overrides applied)
- Highlight: fields that differ
- Source indicator: which override introduced each difference

V1 can use `buildOverrideSummaryLines()` (already built) to show active override context.

---

## Approval Model

All customizations follow the same pipeline:

```
AI/Assistant suggests → Director reviews → Director approves → System applies
```

No customization is applied automatically. No curriculum override executes without a director click.

---

## Downstream Impact Preview

Before the director submits a customization, the assistant shows:

| Impact category | What it shows |
|---|---|
| Templates | Which class templates will inherit this change |
| Sessions | Approximate number of future sessions affected |
| Assessments | Whether assessment criteria are changing |
| Player gaps | Which player gap items may be reassessed |
| Gap Class questions | Whether any gap_class_questions reference this requirement |
| Parent/player explanations | Whether any published explanations will change |

V1 impact preview is read-only text ("approximately N templates may be affected").
V2 can show a live diff.

---

## Future Schema Needs

The existing `academy_curriculum_overrides` system covers most needs. Gaps:

| Need | Current state | Future |
|---|---|---|
| Consultant mode (Brian modify) | Not built | Requires new role + RLS |
| Per-session override (not per-level) | Scope field supports it but not enforced | V2 — session-scoped override type |
| Override history UI | Data exists | Build version history panel |
| Override conflict detection | Not built | V3 — detect overlapping overrides |
| Cross-academy compare | Not built | Enterprise tier only |

---

## Sprint Sequence

| Sprint | Deliverable |
|---|---|
| Sprint 26 (this) | Architecture doc |
| Sprint 27+ | Assistant scope selector UI on curriculum page |
| Sprint 28+ | Target picker + current value display |
| Sprint 29+ | Impact preview panel (read-only) |
| Sprint 30+ | Submit override draft via assistant (connects to existing proposed_actions pipeline) |
| Sprint 31+ | Override history / version view |
| Sprint 32+ | Rollback UI |
| Sprint 33+ | Consultant mode (Brian write access) — requires explicit role + migration approval |

---

## Reusing the Existing Override Draft System

The `VoiceOverrideInputPanel` on `/director/curriculum` already handles:
- Free-form text override submission
- Creates `curriculum_override` proposed_action
- Director reviews and applies in /director/review

The Customization Assistant is a **structured, guided front-end** for the same pipeline.
The backend action (`applyApprovedCurriculumOverrideDraftAction`) does not need changes.
Only the input layer changes — from free-form voice to one-question-at-a-time structured flow.

---

## Known V1 Limitations

- No assistant UI built in Sprint 26 — architecture only.
- VoiceOverrideInputPanel remains the current input mechanism.
- Brian master is fully read-only in V1.
- Impact preview is advisory text only — no live query.
- Consultant mode is not implemented.
- Knowledge gap questions linked to overrides require Gap Class architecture (Sprint 25/27+).
