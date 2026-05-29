# Entity Summary Auto-Population QA
**Sprint:** 925 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. Triggers Wired

| Trigger Event | Server Action | Entity Type | Fire-and-Forget? |
|---|---|---|---|
| Coach observation draft created | `saveWrapUpObservationsAction.ts` | Player | ✅ |
| Session wrap-up draft saved | `saveWrapUpDraftAction.ts` | Group | ✅ |

---

## 2. Populator Functions

| Function | Entity | Safe Text Source |
|---|---|---|
| `upsertPlayerEntitySummary` | player | Name, level, priority count, observation count, attendance rate |
| `upsertGroupEntitySummary` | group | Group name, player count, session count, wrap-up coverage, at-risk count |
| `upsertCurriculumLevelEntitySummary` | curriculum_level | Level name, player count, template count, gaps, advancement eligible |

---

## 3. Safety Checks

| Check | Result |
|---|---|
| Raw coach notes in summary text? | No — count/date signals only |
| Raw player IDs in summary text? | No — names and labels only |
| Failure breaks main workflow? | No — all triggers are fire-and-forget (void + .catch) |
| Academy-scoped RLS? | Yes — `upsertEntitySummary` always passes `academyId` |
| Sensitive observation text exposed? | No — only observation count and date |

---

## 4. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```
