# Coach Player Profile Wrap-Up Signal QA
**Sprint:** 930 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. Observation draft query

| Check | Result |
|---|---|
| Queries proposed_actions (read-only) | ✅ |
| Scoped to academy_id | ✅ |
| Scoped to target_module = 'coach_observation_draft_v1' | ✅ |
| Scoped to target_object_id = player.id | ✅ |
| Filters to status = 'pending_review' only | ✅ |
| Returns count only (no raw IDs, no note content) | ✅ |
| Wrapped in try/catch | ✅ |
| pendingDraftCount defaults to 0 on failure | ✅ |

---

## 2. Group session wrap-up query

| Check | Result |
|---|---|
| Queries sessions via rawDb (group_id filter) | ✅ |
| Scoped to academy_id | ✅ |
| Scoped to firstGroupId (already academy-scoped) | ✅ |
| Excludes cancelled sessions | ✅ |
| Limits to 3 most recent | ✅ |
| Uses loadWrapUpStatusMap (Sprint 928, academy-scoped) | ✅ |
| Wrapped in try/catch | ✅ |
| All signal vars default to false/0/undefined on failure | ✅ |

---

## 3. Signal card display

| Check | Result |
|---|---|
| "Wrap-up needed" shown when no draft exists for completed session | ✅ |
| "Pending review" shown for pending_review status | ✅ |
| "Approved" shown for approved status | ✅ |
| "Applied" shown for executed status | ✅ |
| "Needs revision" shown for rejected status | ✅ |
| "Director has questions" shown for clarification_needed status | ✅ |
| Observation draft row hidden when pendingDraftCount = 0 | ✅ |
| Group wrap-up row hidden when no completed session in group | ✅ |
| "N group sessions still need a wrap-up" only shows when > 1 | ✅ |
| No raw DB status strings in UI | ✅ |
| No raw proposed_action IDs in UI | ✅ |
| No observation note content in signal card | ✅ |

---

## 4. Empty state

| Check | Result |
|---|---|
| Empty state shown when hasSignals = false | ✅ |
| Empty state message: "No recent signals — add observations after sessions." | ✅ |
| Non-alarming, helpful copy | ✅ |

---

## 5. Existing page behavior preserved

| Check | Result |
|---|---|
| CoachPlayerSnapshot unchanged | ✅ (props unchanged) |
| Recent Observations list unchanged | ✅ |
| Level indicator unchanged | ✅ |
| Back link unchanged | ✅ |
| Header (player name, level, stage) unchanged | ✅ |
| Queries 1–5 unchanged | ✅ |

---

## 6. Safety / protected systems

| Check | Result |
|---|---|
| No parent/player communication sent | ✅ |
| No player level movement | ✅ |
| No curriculum mutation | ✅ |
| No roster/placement change | ✅ |
| Sprint 904 approve/reject paths unchanged | ✅ |
| CoachWrapUpDrawer unchanged | ✅ |
| proposed_actions pipeline unchanged (read only) | ✅ |
| No migrations created | ✅ |

---

## 7. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```

---

## 8. Sprint compatibility

| Check | Result |
|---|---|
| Sprint 929 /coach/sessions still compiles | ✅ (not touched) |
| Sprint 928 coach home wrapUpStatusMap still compiles | ✅ (not touched) |
| Sprint 927 /wrap-up page still compiles | ✅ (not touched) |
| Sprint 926 CoachDailyBriefCard still compiles | ✅ (not touched) |
