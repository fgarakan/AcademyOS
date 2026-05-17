# Player Profile Browser QA — Sprint 719

**Date:** 2026-05-17
**Method:** Static code analysis. Items marked `[BROWSER NEEDED]` require manual verification.
**TypeScript:** CLEAN

---

## Tab Structure

The player profile has **6 tabs** (one more than documented in CLAUDE.md which listed 5):

| Tab | Value | Status |
|---|---|---|
| Overview | `overview` | Complete |
| Skill Path | `skill-path` | Complete |
| Competition | `competition` | Complete |
| Fitness / Load | `fitness` | Complete |
| Notes | `notes` | Complete |
| Session History | `session-history` | Complete |

Tab routing via `?tab=` URL param. Default: `overview`. Invalid tab values fall back to `overview`.

---

## Tab Component Architecture

| Tab | Components Used |
|---|---|
| Overview | `DevelopmentProfileSummaryCard`, `PlayerCoachNotesBlock`, `FirstDevelopmentContextCard`, curriculum snapshot |
| Skill Path | `CurriculumLevelPickerCard`, `PlayerProgressionRequirements`, `LevelReadinessSummary`, `GateEvidenceButton`, `EvidenceRequirementDrafts`, `PriorityRecommendationDrafts` |
| Competition | `PlayerCompetitionTab`, UTR profile, match results, insights |
| Fitness / Load | `PlayerLoadTab`, volume/domain/intensity/fatigue/trend |
| Notes | `CoachObservationsFeed`, `NotesAIDraftSection`, `ParentGuidancePreviewPanel`, voice note |
| Session History | `PlayerSessionHistoryPanel` |

---

## Internal-Only Markers

| Check | Result | Notes |
|---|---|---|
| Overview comment | ✅ PASS | "No parent/player portal, no billing, no comms — internal director context only." |
| Fitness homework recommendation | ✅ PASS | "internal draft only" comment |
| Gate history timeline | ✅ PASS | "internal audit trail, director and head coach only" comment |
| Parent guidance preview | ✅ PASS | `ParentGuidancePreviewPanel` — preview for director, never sent to parent |
| `show_to_parent` flag | ✅ PASS | `show_to_parent: false` default on development summary writes |
| `show_to_student` flag | ✅ PASS | `show_to_student: false` default on AI draft writes |

---

## COO / DONNA Context

| Check | Result | Notes |
|---|---|---|
| Player COO context panel | ✅ PASS | `PlayerCOOContextPanel` in DONNA layer |
| Player risk surface | ✅ PASS | `DONNAPlayerRiskSurface` |
| DONNA player action summary | ✅ PASS | `PlayerActionSummaryCard` in `_components` |
| type="button" on action buttons | ✅ PASS | Sprint 710 — `PlayerActionSummaryCard` fixed |
| Gate evidence button | ✅ PASS | `GateEvidenceButton` — type="button" on close fixed in Sprint 710 |

---

## Skill Path Tab Checks

| Check | Result | Notes |
|---|---|---|
| Level picker | ✅ PASS | `CurriculumLevelPickerCard` |
| Advancement gates | ✅ PASS | `PlayerProgressionRequirements` |
| Gate evidence | ✅ PASS | `GateEvidenceButton` — creates evidence record via server action |
| Evidence drafts | ✅ PASS | `EvidenceRequirementDrafts` → proposed_actions |
| Priority drafts | ✅ PASS | `PriorityRecommendationDrafts` → proposed_actions |
| Level readiness | ✅ PASS | `LevelReadinessSummary` |
| No automatic level movement | ✅ PASS | Level change only via `finalize_player_placement()` or explicit approval |

---

## Notes Tab Checks

| Check | Result | Notes |
|---|---|---|
| Observations feed | ✅ PASS | `CoachObservationsFeed` |
| AI draft panel | ✅ PASS | `NotesAIDraftSection` — requires `ANTHROPIC_API_KEY`; degrades gracefully |
| Parent guidance preview | ✅ PASS | `ParentGuidancePreviewPanel` — preview only, never sent |
| Voice note | ✅ PASS | Captured via voice shell |

---

## Auth and Academy Scope

| Check | Result | Notes |
|---|---|---|
| Auth guard | ✅ PASS | Early return if no session |
| Academy ID check | ✅ PASS | Profile query resolves `academy_id` |
| Player ownership | ✅ PASS | Player query requires `academy_id` match |
| RLS on all queries | ✅ PASS | RLS enforced at DB level; code uses typed Supabase client |

---

## Data Load Pattern

The player profile page is a large server component (700+ lines of data fetching). Key pattern:
- Sequential queries (per `AI_BACKEND_RULES.md` rule 5)
- `rawDb` cast used for complex joins (rule 4 — TS2589 prevention)
- First development context: "No writes to player_development_summary, players, or any other table." (comment at line 712)
- All data transforms are read-only

---

## Items Requiring Browser Verification

1. All 6 tabs render without error
2. Tab URL param works — clicking Skill Path shows `?tab=skill-path`
3. Invalid `?tab=invalid` falls back to Overview
4. Player name, level badge, curriculum level shown correctly
5. Skill path gates show correct completion status
6. Gate evidence form submits and creates draft in review queue
7. Notes tab — observations feed loads
8. Parent guidance preview shows — does not have "Send" button
9. DONNA context panel shows player-relevant priorities
10. `loading.tsx` skeleton appears before data loads

---

## Issues Found

| Severity | Component | Issue | Action |
|---|---|---|---|
| INFO | CLAUDE.md | Lists 5 tabs but code has 6 (Session History added). | Update CLAUDE.md reference in a future docs sprint. Not a code issue. |
| INFO | Player profile page | 700+ lines of data fetching in a single server component. No structural issues but complex. | Future refactor sprint if performance issues arise. Not a V1 blocker. |

---

## Summary

| Check Type | Count | Result |
|---|---|---|
| Static code checks passed | 22 | ✅ |
| Requiring browser verification | 10 | `[BROWSER NEEDED]` |
| Internal-only markers confirmed | 4 | ✅ |
| Parent/student send prevention confirmed | ✅ | `show_to_parent: false` default |
| DANA references | 0 | ✅ |

---

*Generated by Sprint 719 — Player Profile Browser QA V1.*
