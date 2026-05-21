# Player Portal Experience

> Sprints 488–489 — Player Portal V1
> See also: `src/lib/player/playerPortalExperience.ts`, `src/lib/player/progressIndicators.ts`

---

## Player Portal Experience Builder (Sprint 488)

`buildPlayerPortalExperience(profile)` produces the view model for `/player`.

Input is a `PlayerPortalProfile` from `playerPortalQueries.ts` — already gated:
- `is_player_visible=true` (curriculum requirement progress)
- `show_to_student=true` (development summary)

### View model fields

| Field | Source |
|---|---|
| summary | v_player_summary view — level, group, coach, score |
| developerSummaryText | developmentProfileQueries — show_to_student=true |
| strengths / workOn | developmentProfileQueries — student-facing content |
| topPriorities | developmentProfileQueries — priority_rank order |
| progressIndicators | progressIndicators.ts — computed from progress data |
| homeCards | computed from all of the above |
| challenges | top 3 priorities formatted as player challenges |
| welcomeMessage | player first name + level |

### What players never see

- Coach internal notes
- Assessment scores or UTR data (unless explicitly added to player profile in a future sprint)
- Parent communication content
- Any field not marked show_to_student=true

---

## Progress Indicators (Sprint 489)

`buildPlayerProgressIndicators(summary, progress, previousPct?)` returns:

- `overallCompletionPct` — completed / total requirements × 100
- `domainBands` — per-domain completion grouped from RequirementProgressRecord[]
- `milestones` — first_completion / halfway / near_complete / all_complete / domain_complete
- `motivationLine` — encouraging text based on completion pct

### Domain status labels

| Status | Condition |
|---|---|
| ahead | completionPct = 100% |
| on_track | completionPct ≥ 60% |
| needs_work | completionPct > 0 |
| not_started | no completed or in-progress records |
