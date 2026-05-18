# Director DONNA Review Queue Integration
Sprint 1006 — 2026-05-18

## Summary

Created `src/components/donna/DirectorDonnaReviewPanel.tsx` — surfaces all 6 draft categories with counts, urgency, and Review CTAs.

## Categories

1. Session Wrap-Ups — from coaches, pending approval
2. Attendance Exceptions — no roster change until approved
3. Player Observation Drafts — not linked to player profile until approved
4. Curriculum Evidence Drafts — no level movement without director confirmation
5. Parent-Safe Summaries — nothing sent to parents automatically
6. Template Drafts — template library management

## Key Features

- `activeCategories` shown with risk badge (high/medium/low) and Review CTA
- `clearCategories` shown as green-check pills when all active items are present
- Demo categories builder (`buildDemoReviewCategories()`) for fallback
- Safety notice: "DONNA never approves automatically"
- All Review CTAs route to `/director/review` — no actions on this panel

## Relation to Existing Components

- `DONNAReviewQueueSummary` (Sprint 623) — compact single card for the DONNA panel; `DirectorDonnaReviewPanel` is a full-width panel with per-category rows
- `/director/review` (existing) — the actual review queue with approve/reject controls
