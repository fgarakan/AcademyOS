# DONNA Onboarding — Coaching DNA Step V1

**Date:** 2026-05-19
**Sprint:** O-5

---

## Summary

Created `CoachingDnaStep` (Step 3 of 7) combining prototype Coaching Philosophy and Coach Communication into one stronger step. No DB writes.

---

## Data Captured

| Field | Type | Constraint |
|---|---|---|
| Coaching Styles | Multi-select cards | Up to 3, ordered by selection rank |
| Primary Communication | Single select | Required before rank badge appears |
| Secondary Communication | Single select | Optional, cannot match primary |

## Coaching Styles (8)
Fundamentals First / Game-Based Learning / High-Performance Discipline / Player-Centered Coaching / Tactical First / Movement First / Competition-Ready / Joy + Retention

Each card shows: name, description, and (when selected) downstream AcademyOS impact.

## Communication Styles (6)
Direct + Clear / Encouraging + Positive / Question-Led / High-Energy Motivator / Calm + Precise / Standards-Based

Each card shows: name, description, and example coach behavior. Primary/Secondary buttons on each card.

## UX Patterns
- Selection counter (0/3) with lime bars
- Rank badge (1, 2, 3) on selected coaching style cards
- Primary/Secondary labels shown as badges + pills
- DONNA confirmation after selections: "I'll shape coach notes, session cues..."
- Continue always enabled (no required fields — coaching DNA is optional to complete)

## Safety Rules
- No DB writes
- "I'll shape..." (future tense) not "Applied" or "Updated"
