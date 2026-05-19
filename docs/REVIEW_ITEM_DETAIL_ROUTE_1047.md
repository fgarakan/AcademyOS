# Per-Item Review Detail Route — Sprint 1047

**Date:** 2026-05-19
**Sprint:** 1047 — Per-Item Review Detail Route V1
**Phase:** Phase 6 — Director Review Queue Apply Flow (Sprints 1046-1053)

---

## What changed

Created a dedicated per-item detail route at `/director/review/[actionId]`. Directors can now navigate directly to a single review item, see its full context, and act on it without scrolling through the full review queue.

### Files created
- `src/app/director/review/[actionId]/page.tsx` — Server Component detail page
- `src/app/director/review/[actionId]/ReviewItemRouter.tsx` — component that routes `target_module` to the correct card

---

## Route

`/director/review/[actionId]`

`actionId` is the UUID of a `proposed_actions` row.

---

## Security

- Auth required — `notFound()` if unauthenticated
- Academy context resolved from authenticated profile only — `actionId` in URL is never trusted for academy scope
- `academy_id` match verified on the loaded action — `notFound()` if mismatch
- Role guard — director or head_coach only — `notFound()` otherwise
- No params passed from URL to DB query other than the action ID (pattern: load → verify academy → render)

---

## Supported card types

| target_module | Card rendered |
|---|---|
| `session_wrap_up_v1` | `WrapUpDraftCard` (full decision + apply controls) |
| `attendance_exception` | `AttendanceExceptionDraftCard` (full decision + apply controls) |
| `coach_observation_draft_v1` | `WrapUpObservationDraftCard` (full decision + apply controls) |
| `priority_recommendation` | `PriorityRecommendationDraftCard` (full decision + apply controls) |
| `requirement_evidence_link` | `EvidenceRequirementDraftCard` (full decision + apply controls) |
| `development_summary_draft_v1` | `DevelopmentSummaryDraftCard` (full decision + apply controls) |
| `session_recap_structuring` | `StructuredDraftCard` (full decision + apply controls) |
| `curriculum_override` | `CurriculumOverrideDraftCard` (full decision + apply controls) |
| All other types | `UnsupportedCard` — safe fallback, no mutation |

---

## Entity loading

The page loads exactly one entity per item, based on module:
- Session-linked (`session_wrap_up_v1`, `attendance_exception`, `session_recap_structuring`) — loads session name + date from `sessions` table
- Player-linked (`coach_observation_draft_v1`, `priority_recommendation`, `requirement_evidence_link`, `development_summary_draft_v1`) — loads player name from `players` table
- No-entity (`curriculum_override`) — no entity lookup needed

---

## Page layout

- Breadcrumb: "← Review Queue" → `/director/review`
- Page header: module label + status badge + proposer name + entity name (session or player)
- Safety notice: "No action has been taken yet. Nothing is applied or sent until you explicitly act."
- Item card with existing decision + apply controls

Sprint 1048 will add a DONNA context panel as a right column on this page.

---

## TypeScript

Clean (`npx tsc --noEmit` — zero errors).
