# DONNA Recommendation Feedback Loop V1
**Sprint:** 914.11 | **Date:** 2026-05-28

## Tables
- `donna_recommendations`: recommendation surfaced, source signal, type, safe text, confidence, status
- `donna_recommendation_feedback`: director response (accepted/rejected/modified/ignored/deferred)

## RLS
Both tables: academy-scoped INSERT for staff, SELECT for directors/staff (own rows).

## Helpers
- `createDonnaRecommendation()` — logs a recommendation
- `recordDonnaRecommendationFeedback()` — records director response
- `getRecentDonnaRecommendations()` — retrieves recent recs

## Wired
- Dashboard priority / director brief responses → `logDonnaRecommendation()` fire-and-forget

## Safety
- No automated learning model
- No recommendation executes without director approval
- No raw PII in recommendation_text or feedback_reason
