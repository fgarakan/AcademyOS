# Sprint 1093 — Director DONNA Daily Brief Integration V1

## What was built

Wired the existing `DirectorDonnaDailyBrief` component into the director DONNA page (`/director/donna`). The brief renders as a full-width section between the main two-column layout and the Review Queue Surface.

The brief gives directors a structured, scannable overview of:
- Sessions today
- Missing wrap-ups
- Attendance exceptions
- Drafts awaiting approval
- Academy risks
- Recommended actions

## Files modified

- `src/app/director/donna/page.tsx` — imported `DirectorDonnaDailyBrief` and `BriefItem`; added brief render block between main grid and review queue surface; mapped `ctx.recommendedActions` → `BriefItem[]`; mapped `ctx.academyRisks` → `string[]`

## Files created

- `docs/DIRECTOR_DONNA_DAILY_BRIEF_1093.md` — sprint doc

## Data mapping

| Brief prop | Source |
|---|---|
| `date` | `new Date().toLocaleDateString(...)` |
| `todaySessions` | `ctx.todaySessions` |
| `missingWrapUps` | `ctx.missingWrapUps` |
| `attendanceExceptions` | `ctx.attendanceExceptions ?? 0` |
| `unrosteredPlayers` | `0` (not tracked in context) |
| `observationDrafts` | `pendingReviews` |
| `parentSafeDrafts` | `0` (not tracked separately) |
| `templateDrafts` | `ctx.templateDrafts ?? 0` |
| `evidenceDrafts` | `ctx.evidenceDrafts ?? 0` |
| `academyRisks` | `ctx.academyRisks.map(r => r.signal)` |
| `recommendedActions` | `ctx.recommendedActions.slice(0, 3).map(a => { text: a.label, href: a.href })` |
| `isLive` | `ctx.isLive` |

## TypeScript

Clean.
