# DONNA Human Approval Bridge V1 — Sprint 987

**Date:** 2026-05-30
**Sprint:** 987
**Status:** Implemented — TypeScript clean

## Purpose
The bridge between DONNA draft proposals and the proposed_actions review pipeline.

## V1 Draft Action Types
coach_observation, session_note, parent_update_draft, curriculum_adjustment, attendance_exception, level_readiness_signal

## Approval Flow
1. DONNA generates a draft via `buildDraftApprovalPayload(input)`
2. `validateDraftInput(input)` checks for invalid IDs, missing rationale, blocked content, parent/player flags
3. Director sees `buildConfirmationPrompt(payload)` — explicit confirmation required
4. Director clicks "Submit to Review Queue" → server action writes proposed_action
5. Draft lands in /director/review with status `pending_review`
6. Director approves/rejects in review queue

## Safety Guarantees
- `status: 'pending_review'` always — never `approved` or `executed` from bridge
- `generated_by_donna: true` flag for audit trail
- Blocked content patterns checked before payload is built
- Parent-facing and player-facing warnings always surface
- No DB write in bridge — caller (server action) handles the write
