# Adaptive Session Planning Architecture

**Sprint:** 91
**Date:** 2026-05-01

---

## Product Goal

Given an actual class roster with real player data, the system suggests specific modifications to a planned session that would better fit the specific group of players present that day.

The OS suggests. The human approves. Nothing changes without explicit approval.

---

## Source Inputs

| Input | Source Table | Available in V1 |
|-------|-------------|----------------|
| Session/blocks | `sessions`, `session_blocks` | Yes |
| Source template | `templates`, `template_blocks` | Yes |
| Group roster | `group_memberships`, `players` | Yes |
| Player strengths/needs | `player_development_summary` | Yes |
| Player priorities | `player_priorities` | Yes |
| Curriculum level | `player_curriculum_states`, `curriculum_levels` | Yes |
| Academy overrides | `academy_curriculum_overrides` | Yes |
| Attendance (current session) | `session_attendance` | Yes |
| Coach notes | `voice_notes` | Partial — raw text |
| Requirement progress | `player_requirement_progress` | Yes |

---

## Suggestion Types

| Type | Description |
|------|-------------|
| `add_constraint` | Add a rule that constrains how a drill is played |
| `simplify_drill` | Suggest a simpler version of the drill |
| `increase_challenge` | Suggest making the drill harder |
| `adjust_scoring` | Change the scoring rule to address a need |
| `add_recovery_requirement` | Add a recovery constraint to a block |
| `add_target_zone` | Suggest using target zones in a drill |
| `adjust_partner_grouping` | Pair specific players together |
| `extend_block` | Add time to a block |
| `shorten_block` | Reduce time from a block |
| `add_assessment_moment` | Suggest an assessment checkpoint |
| `add_watch_for_cue` | Give the coach a specific thing to observe |
| `add_progression` | Suggest a harder version if players are ready |
| `add_regression` | Suggest an easier entry point |

---

## Draft Lifecycle

```
[Rule Engine Run]
      ↓
   draft
      ↓
pending_review  ←→  [Director/Coach views suggestion card]
      ↓                      ↓              ↓
   approved              rejected       dismissed
      ↓
   applied
```

Status values: `draft` | `pending_review` | `approved` | `applied` | `rejected` | `dismissed`

---

## Review / Apply Flow

1. **Generate** — Director clicks "Generate Suggestions for This Class" on the session page.
2. **Persist** — `createSessionAdjustmentSuggestionsAction` runs the rule engine and inserts rows into `session_adjustment_suggestions` with status `pending_review`.
3. **Review** — Director sees `SessionAdjustmentSuggestionsPanel` with suggestion cards.
4. **Approve / Reject / Dismiss** — Status is updated. No session mutation yet.
5. **Apply** — Director clicks "Apply" on an approved suggestion. `applyApprovedSessionAdjustmentAction` appends the adjustment text to `session_blocks.notes` (or `sessions.session_notes` if no target block).
6. **Audit** — All applies write to `audit_logs`.

---

## Guardrails

- Suggestions are read-only drafts until explicitly approved AND applied.
- Only `session_blocks.notes` or `sessions.session_notes` may be modified on apply — never `template_blocks`.
- No changes to player records, levels, evidence, or parent/player communications.
- No AI API calls — all suggestions are deterministic rule engine output.
- All session mutations are scoped to the specific session; the master template is never touched.
- `academy_id` must be resolved from the authenticated user's profile — never from client input.
- Membership check required: `academy_director` or `head_coach` role only.

---

## Session-Only Application Model

```
                    master template (read-only)
                           │
                           ▼ (at session generation time)
                    session_blocks (copy of template_blocks)
                           │
                           ▼ (on apply)
                    session_blocks.notes += "\n\n[Adaptive Adjustment]\n..."
```

The `template_blocks` table is NEVER modified. The `session_blocks` table is the only mutation target.

---

## Master Template Protection

- `applyApprovedSessionAdjustmentAction` verifies the target row is a `session_block`, not a `template_block`.
- The server action never queries or mutates `template_blocks`.
- TypeScript types enforce the separation.

---

## Academy Curriculum Protection

- No `academy_curriculum_versions` or `academy_curriculum_overrides` mutations.
- Curriculum context is read-only input to the rule engine.

---

## Player Record Protection

- No `players`, `player_development_summary`, `player_priorities`, `player_requirement_progress`, `player_curriculum_states` mutations.
- All player data is read-only input to the rule engine.

---

## Future AI-Ready Path (V2+)

In V1, all suggestions are deterministic rules. The architecture is designed so that:
- The rule engine can be replaced or augmented with an LLM call.
- The suggestion schema supports `confidence: 'low' | 'medium' | 'high'` which AI can use.
- The review/apply flow is identical whether suggestions come from rules or an LLM.
- No UI or schema changes needed to wire in AI — only the rule engine changes.

In V2, `generateSessionModificationSuggestions` would call an AI API instead of (or in addition to) deterministic rules, returning the same `SuggestionDraft[]` shape.

---

## Recommended Schema

Table: `session_adjustment_suggestions`

```sql
CREATE TABLE session_adjustment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  source_template_id UUID REFERENCES templates(id),
  group_id UUID REFERENCES groups(id),
  curriculum_level_id UUID REFERENCES curriculum_levels(id),
  academy_curriculum_version_id UUID,
  target_session_block_id UUID REFERENCES session_blocks(id),
  suggestion_type TEXT NOT NULL,
  suggested_change TEXT NOT NULL,
  reason TEXT NOT NULL,
  players_supported JSONB DEFAULT '[]',
  player_needs_considered JSONB DEFAULT '[]',
  curriculum_context JSONB DEFAULT '{}',
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  scope TEXT NOT NULL DEFAULT 'this_session_only',
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'applied', 'rejected', 'dismissed')),
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  applied_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ
);

ALTER TABLE session_adjustment_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy members can read session_adjustment_suggestions"
  ON session_adjustment_suggestions FOR SELECT
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "academy directors and head coaches can insert session_adjustment_suggestions"
  ON session_adjustment_suggestions FOR INSERT
  WITH CHECK (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND is_active = true
        AND role IN ('academy_director', 'head_coach')
    )
  );

CREATE POLICY "academy directors and head coaches can update session_adjustment_suggestions"
  ON session_adjustment_suggestions FOR UPDATE
  USING (
    academy_id IN (
      SELECT academy_id FROM academy_memberships
      WHERE profile_id = auth.uid()
        AND is_active = true
        AND role IN ('academy_director', 'head_coach')
    )
  );
```

---

## Sprint Path (92–100)

| Sprint | Deliverable |
|--------|-------------|
| 92 | `groupNeedsAggregation.ts` — read roster/development/priority data |
| 93 | `sessionModificationRules.ts` — deterministic rule engine |
| 94 | Migration 049 + `createSessionAdjustmentSuggestionsAction` |
| 95 | `SessionAdjustmentSuggestionsPanel` + approve/reject/dismiss actions |
| 96 | `applyApprovedSessionAdjustmentAction` — session-only block note append |
| 97 | Coach Briefing shows suggestion counts + top suggestions |
| 98 | Diff preview in suggestion card |
| 99 | QA doc |
| 100 | Demo doc + CHANGELOG |
