# AI Suggestion Review Engine — Architecture

Sprint 176 | 2026-05-02

---

## Purpose

This document audits the existing review/suggestion infrastructure and defines the architecture for Sprints 177–185.

---

## Existing Review Systems

### 1. `proposed_actions` table (migrations 001–050)
The central review pipeline for voice-originated and system-drafted mutations.

- **Used for:** session_recap_structuring, priority_recommendation, requirement_evidence_link, attendance_exception, curriculum_override
- **Pattern:** status ∈ {pending_review, approved, clarification_needed, rejected, applied}
- **UI:** `/director/review` — Draft Review Queue
- **Key rule:** `execute_approved_action()` is the only function that executes approved voice actions

### 2. `session_adjustment_suggestions` table (migration 049)
Per-session block suggestions from the adaptive session intelligence engine.

- **Scope:** session-level (linked to a specific session_id)
- **Status:** draft → pending_review → approved → applied / rejected / dismissed
- **UI:** session detail pages
- **Limitation:** Session-scoped only. Not suitable for academy-wide suggestions.

### 3. AI Intelligence Backend (`src/lib/backend/intelligence.ts`)
Stable backend with internal `getSupabaseServer()` pattern. Contains cohort intelligence, behavioral models, coaching messages.

- **Pattern:** Uses `rawDb = supabase as any` (intentional TS2589 workaround)
- **Status:** Stable. Do not modify.

---

## Gap Identified

There is no academy-wide, multi-type, reviewable suggestion table.

The `proposed_actions` table is the right pattern but is optimized for specific voice-originated draft types. For proactive, deterministic system suggestions (player focus gaps, private lesson opportunities, level readiness, parent preview opportunities), a dedicated table gives cleaner isolation and simpler queries.

---

## Available Data Sources for Generation

| Source | Table/View | Available Fields |
|---|---|---|
| Active players | `v_player_summary` | player_id, full_name, focus_areas, overall_score, score_delta, player_status, advancement_eligible |
| Private lesson requests | `private_lesson_requests` | id, player_id, status (new/reviewed/scheduled), preferred_days, preferred_times, goal |
| Development summaries | `player_development_summary` | player_id, current_strengths, things_to_work_on, development_focus, student_friendly_summary, show_to_student |
| Player priorities | `player_priorities` | player_id, title, priority_rank, is_active |
| Coach observations | `coach_observations` | player_id, content, created_at, is_private |
| Curriculum state | `player_curriculum_states` | player_id, current_level_id, advancement_eligible, advancement_blocked_by |
| Sessions | `sessions` | id, status, scheduled_date, name |
| Reassessment pipeline | `v_player_summary` + `getReassessmentPipeline()` | urgency (overdue / due_soon) |

---

## Recommended Table: `academy_suggestions`

### Rationale
- Scope: academy-wide (not session-scoped like session_adjustment_suggestions)
- Type-agnostic: single table for all suggestion categories
- Lifecycle: pending → accepted/denied/deferred/applied/failed
- Evidence and impact stored as JSONB for flexibility
- RLS: director/head_coach only — no parent/player access

### Suggestion Types (V1)
| Type | Trigger | Priority |
|---|---|---|
| player_focus_update | Active player with no focus_areas | Medium |
| private_lesson_opportunity | New private lesson request pending | Medium |
| level_readiness_review | Player with advancement_eligible = true + no action | High |
| parent_safe_update_draft | Player with dev summary but no student_friendly_summary | Low |
| coach_note_followup | Player with no observations in 30+ days | Low |
| session_adjustment | Session needs attention (future) | Medium |
| curriculum_gap | Level with no content mapped (future) | Medium |
| fitness_adjustment | Fitness observation needs review (future) | Low |
| attendance_exception_followup | Unresolved attendance exception (future) | Medium |

---

## Impact Preview Model

Each suggestion stores `impact_preview` as JSONB:

```json
{
  "if_accepted": [
    "Director is routed to player profile to add development focus",
    "Coach snapshot becomes actionable at next session"
  ],
  "next_step": "Open player profile and add Current Focus"
}
```

And `will_not_change` as a JSONB string array:
```json
[
  "Player level is not changed",
  "No parent notification is sent",
  "No automatic profile update occurs"
]
```

---

## Accept / Deny / Defer Lifecycle

```
pending
  → accepted   (director reviewed, marked accepted)
  → denied     (director reviewed, not appropriate)
  → deferred   (director wants to revisit)
  → applied    (accepted + downstream action taken — future)
  → failed     (error during application — future)
```

### V1 Accept Behavior (safe defaults)
For each suggestion type, accepting marks status = 'accepted' and may provide a redirect link. No automatic mutations to core data.

| Type | Accept Behavior |
|---|---|
| player_focus_update | Status = accepted. Link to player profile. |
| private_lesson_opportunity | Status = accepted. Link to /director/private-lessons. |
| level_readiness_review | Status = accepted. Link to player profile Skill Path tab. |
| parent_safe_update_draft | Status = accepted. Link to player profile Notes tab. |
| coach_note_followup | Status = accepted. Link to player profile. |

### Future Apply Behavior (not V1)
When a safe apply path exists, status moves from accepted → applied + audit_log entry.

---

## Audit Trail Plan

V1: `reviewed_by` + `reviewed_at` + `review_note` stored on each suggestion row.

Future: write to `audit_logs` table with action_type = 'suggestion_reviewed', subject_id = suggestion.id, before/after state.

The `audit_logs` table exists (from migrations) but using it for suggestion reviews is a future enhancement.

---

## Dashboard Card Plan

Location: new section on Director Dashboard between Priority Queue / Pending Placement and Academy Alerts panel.

Display:
- Pending count
- High priority count
- Link to /director/ai-suggestions

---

## Implementation Plan (Sprints 177–185)

| Sprint | Deliverable |
|---|---|
| 177 | `academy_suggestions` table + RLS migration + data model doc |
| 178 | Deterministic suggestion generators (pure functions, no DB calls) |
| 179 | Server actions: generate, accept, deny, defer |
| 180 | Dashboard AI Suggestions section + pending count |
| 181 | `/director/ai-suggestions` review page with filter tabs |
| 182 | `SuggestionCard` + `ImpactPreviewPanel` components |
| 183 | Wire up accept/deny/defer lifecycle + status transitions |
| 184 | Duplicate prevention + lifecycle audit doc |
| 185 | QA doc + Brian demo script + changelog |

---

## Guardrails

- No suggestion auto-applies — all are review-only until explicitly accepted
- No parent/player data exposed via suggestions (no parent/player portal access)
- No level mutations — level_readiness_review only links to profile
- No AI API — V1 is fully deterministic
- All queries scoped to academy_id + RLS enforced
- reviewed_by / reviewed_at recorded on every status change
