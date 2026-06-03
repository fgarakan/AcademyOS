# Director Attention Queue V1 — QA Document

**Sprint:** Mega Sprint 1351–1375 — Director Attention Queue V1  
**Date:** 2026-06-03  
**Route:** `/director/attention`  
**Status:** Complete

---

## Design principle

> Deep system. Simple screen. DONNA explains complexity.
>
> The Attention Queue tells the director: **Who needs attention, why, and what should happen next.**

---

## Attention categories

| Category | Data source | Priority | Filter chip |
|---|---|---|---|
| Reassessment Due (overdue) | `v_reassessment_pipeline` where `urgency = 'overdue'` | High | players, reassessment |
| Reassessment Due (due soon) | `v_reassessment_pipeline` where `urgency = 'due_soon'` | Medium | players, reassessment |
| Onboarding Incomplete | `v_player_summary` where `player_status IN ('pending_placement', 'placement_in_progress', 'pending_approval')` | High | players, onboarding |
| Placement Review Needed | `proposed_actions` where `target_module IN ('placement_review', 'placement_recommendation_draft', 'level_review')` and `status = 'pending_review'` | High | placements |
| Level Readiness Review | `v_player_summary` where `promotion_ready = true` and `player_status = 'active'` | Medium | players, placements |
| Missing Assessment | `v_player_summary` where `last_assessed_at IS NULL` and `overall_score IS NULL` and `player_status = 'active'` | Medium | players |
| Parent Update Pending | `proposed_actions` where `target_module = 'parent_communication'` and `status = 'pending_review'` | Medium | parent-updates |
| Coach Follow-Up Needed | `proposed_actions` where `target_module = 'session_wrap_up_v1'` and `status = 'pending_review'` | Medium | coach |
| Missing Evidence | `v_player_summary` where `player_status = 'active'` and no `focus_areas` and no `group_name` | Low | players |

---

## Scoring

| Priority | Meaning | Visual |
|---|---|---|
| High | Time-sensitive or blocking player progress | Red `AlertCircle` icon |
| Medium | Important, review before end of week | Orange `Clock` icon |
| Low | Informational, best-effort improvement | Muted `Info` icon |

Sort order: High → Medium → Low, then alphabetically by player name within each tier.

---

## Filter chips

| Filter | Shows |
|---|---|
| All | Every item |
| Players | Items linked to a specific player (reassessment, onboarding, level readiness, missing assessment, missing evidence) |
| Reassessment | `reassessment_due` category only |
| Onboarding | `onboarding_incomplete` category only |
| Placements | `placement_review_needed` + `level_readiness_review` |
| Parent Updates | `parent_update_pending` only |
| Coach | `coach_followup_needed` only |

Filter chips that would show 0 items are hidden automatically.

---

## Attention Drawer

Clicking any row expands an inline drawer (no page navigation). Drawer shows:

- Player name, current level, group, coach (if player-linked)
- Link to player profile
- Reason (medium-length sentence)
- Recommended Action (bold, directive)
- DONNA Explanation (lime accent box, italic, deterministic text — no AI)
- Action link to the relevant workflow

---

## DONNA integration

- `DonnaScreenBriefStatic` at the top of the page summarises the queue in 1–2 sentences.
- DONNA's `academy_attention_today` and `players_needing_attention` answers now include: "Open the Attention Queue for the full prioritised list."
- `go_to_attention_queue` action added to DONNA's action library, wired to intents: `academy_attention_today`, `players_needing_attention`, `stalled_players`, `overdue_assessments`, `due_assessments`, `pending_placements`, `placement_overrides`, `resume_onboarding`.

---

## KPI card deep links

All 7 KPI tiles now link into the attention queue with filter params:

| KPI tile | Destination |
|---|---|
| Players need attention | `/director/attention?filter=players` |
| Pending onboarding | `/director/attention?filter=onboarding` |
| Ready for reassessment | `/director/attention?filter=reassessment` |
| Parent updates pending | `/director/attention?filter=parent-updates` |
| Coach recaps missing | `/director/attention?filter=coach` |
| Placement reviews active | `/director/attention?filter=placements` |
| Assessments to review | `/director/review?tab=needs-approval` (unchanged — separate flow) |

---

## Data safety

- All queries scoped by `academy_id`.
- No parent or player personal data (email, phone, notes) exposed — only names, levels, groups.
- Coach wrap-up items are aggregate rows (count only, no per-player detail in the queue row itself).
- DONNA explanations are deterministic text — no AI inference, no data from external APIs.
- RLS active on all queried tables via the authenticated session.

---

## Empty state

When all categories return 0 items:
- Page header: "All clear — no items need attention."
- Queue shows a green `✓` card with DONNA text: "No urgent academy issues today. Recommended focus: curriculum execution and coach development."

---

## Acceptance checklist

- [ ] `/director/attention` loads without errors (TypeScript clean)
- [ ] Real data appears from live Supabase
- [ ] All 7 filter chips work — counts match visible items
- [ ] Clicking a row opens the inline drawer
- [ ] Drawer shows: reason, recommended action, DONNA explanation, action link
- [ ] Items sorted High → Medium → Low
- [ ] Empty state renders when queue is clear
- [ ] KPI tiles on dashboard link to correct `/director/attention?filter=xxx`
- [ ] DONNA "Open Attention Queue" action appears in relevant query responses
- [ ] No parent or player unsafe data exposed
- [ ] No migrations applied

---

## Known limitations (V1)

| Limitation | Status |
|---|---|
| **Mission Stalled** category not built | Requires `player_mission_assignments` query + mission inactivity calculation. Deferred to V2. |
| Coach wrap-up items are aggregate | A single queue row covers all pending wrap-ups. Per-session breakdown deferred to V2. |
| Placement items (from `proposed_actions`) have no player name | `proposed_actions.action_label` is used as the item title; player name not always present in the label. |
| Filter state is client-side only | Selecting a filter chip does not update the URL. Use the `?filter=` search param (from KPI tiles) for URL-driven filtering; client chips use React state. |
