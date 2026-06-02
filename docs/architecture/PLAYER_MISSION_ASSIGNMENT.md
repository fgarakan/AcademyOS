# Player Mission Assignment Architecture

**Sprint:** Mega Sprint 1101-1110
**Date:** 2026-06-02
**Migration:** `076_player_mission_assignments.sql`
**Server action:** `src/lib/actions/playerMissionDraftAction.ts`

## Purpose

Player mission assignments are curriculum-derived focus statements given to individual players for a coaching period. They make the curriculum concrete and personal. Coaches and DONNA can suggest missions; only directors activate them.

## Status flow

```
draft → pending_review → active → completed
                       ↘           ↘
                        skipped     archived
```

| Status | Who can set |
|---|---|
| `draft` | Coach, head_coach, director |
| `pending_review` | Coach, head_coach, director |
| `active` | Director only (direct or via approveMissionAction) |
| `completed` | Coach, head_coach, director |
| `skipped` | Director, head_coach |
| `archived` | Director |

Director direct assignment uses `status = 'active'` immediately.

## Assignment paths

**Director direct:** `playerMissionDraftAction({ status: 'active' })` → INSERT active row → audit_log: mission_assigned_direct

**Coach suggestion:** `playerMissionDraftAction({ status: 'draft' })` → draft → coach submits as `pending_review` → `approveMissionAction()` → active

**DONNA suggestion:** `playerMissionDraftAction({ sourceType: 'donna', status: 'pending_review' })` → director reviews → `approveMissionAction()`

**Voice pipeline:** `proposed_actions` path → `execute_approved_action()` → inserts row with `status='active'` + `proposed_action_id` back-link

## RLS summary

| Role | SELECT | INSERT | UPDATE |
|---|---|---|---|
| director | All | Any status | Any |
| head_coach | active/completed/archived | draft or pending_review | Own drafts + complete active |
| coach | active/completed/archived | draft or pending_review | Own drafts + complete active |
| player | Own active only | None | None |
| parent | None | None | None |

## Architecture invariants

1. Coaches and DONNA may propose but never activate — only director can set `status='active'`
2. Curriculum fields are text snapshots — no FK to curriculum tables — missions survive restructuring
3. Voice pipeline uses `proposed_actions`, not this action
4. Every status change writes an `audit_logs` entry
5. No parent or player INSERT (RLS enforces)
6. Schema-missing detection: returns `isSchemaMissing: true` if migration 076 not yet applied
