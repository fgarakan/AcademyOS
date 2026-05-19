# DONNA Context Panel on Per-Item Review — Sprint 1048

**Date:** 2026-05-19
**Sprint:** 1048 — DONNA Review Context Panel V1
**Phase:** Phase 6 — Director Review Queue Apply Flow (Sprints 1046-1053)

---

## What changed

Added a DONNA context panel as a right-column sidebar on the per-item review detail page (`/director/review/[actionId]`). The page now renders in a 2-column layout on large screens (card left, DONNA context right), stacked on mobile.

### Files created
- `src/app/director/review/[actionId]/DonnaReviewContextPanel.tsx` — DONNA context sidebar panel

### Files modified
- `src/app/director/review/[actionId]/page.tsx` — imported `DonnaReviewContextPanel`, replaced single-column card render with `lg:grid-cols-3` 2-column layout (card 2/3 width, DONNA panel 1/3)

---

## Panel sections

### DONNA Brief
- Keyword-based guidance text per `target_module`
- One paragraph per type explaining what to check before approving
- No AI API needed — deterministic per module

### Submission details
- Draft type label
- Proposer name
- Submission timestamp
- Risk level badge (shown only for medium/high risk)
- Link to view session → `/director/sessions/[id]` (if session-linked)
- Link to view player profile → `/director/players/[id]` (if player-linked)

### What changes when applied
Per-module breakdown showing:
- Will change: specific fields/records that are written
- Will NOT change: records protected by review-first model

Covered modules and their change sets:
| Module | Will change | Will NOT change |
|---|---|---|
| session_wrap_up_v1 | Session notes + status → completed | Template, player profiles, parent records, attendance |
| attendance_exception | Attendance records + placement follow-ups | Player profiles, parent records, curriculum |
| coach_observation_draft_v1 | One internal coach observation | Visible to parents/players, level, curriculum |
| priority_recommendation | Player training priority | Level, parent records, sessions |
| requirement_evidence_link | Evidence link to curriculum requirement | Level (informational only), parent records |
| development_summary_draft_v1 | Player development summary (internal) | Visible to parents/players (by default), level |
| session_recap_structuring | Session recap notes | Template, player profiles, parent records |
| curriculum_override | Session template block override | Core curriculum spine, player profiles, parent records |

### Director clarification note
- Shown only when `reviewer_notes` is set
- Orange-accented card
- Note text + "visible to coach" label

### Safety footer
- "DONNA proposes — you approve. Nothing changes until you act on the item to the left."

---

## Layout

- Desktop (lg+): `grid grid-cols-1 lg:grid-cols-3 gap-6` — item card spans 2 columns, DONNA panel spans 1
- Mobile: stacked single column — DONNA panel below the item card

---

## Safety

- No DB writes
- No mutations
- No automatic approvals
- All links are read-only navigation
- Safety footer present on every render

---

## TypeScript

Clean (`npx tsc --noEmit` — zero errors).
