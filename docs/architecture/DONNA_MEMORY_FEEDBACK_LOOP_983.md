# DONNA Memory + Recommendation Feedback Loop V1 — Sprint 983

**Date:** 2026-05-30
**Sprint:** 983
**Status:** Implemented — TypeScript clean

## Purpose
Tracks which DONNA recommendations were accepted/dismissed/acted on. localStorage-backed — no DB write.

## Signal Types
- `accepted` — director clicked recommended action
- `dismissed` — director dismissed without acting
- `acted_on` — director took related action (indirect acceptance)
- `overridden` — director took different action than recommended

## Key Functions
- `recordFeedback(outcome, actionId, pathname)` — localStorage write
- `loadFeedbackPreferences()` — aggregate scores from signals
- `getRecommendationScore(actionId)` — net score for one action
- `sortByFeedbackScore(recommendations)` — sort by preference
- `recordSessionFeedback/getSessionFeedbackSummary` — RAM-only session tracking

## Safety
- No player names, coach notes, or private data stored
- Only action IDs, pathnames, outcomes, timestamps
- localStorage only — no DB writes
- Capped at 100 signals to prevent bloat
