# Player Development Center Architecture

**Sprint:** Mega Sprint 1113-1120
**Date:** 2026-06-02

## Overview

The Player Development Center adds three new tabs to the director player profile:

| Tab | Label | Purpose |
|---|---|---|
| `development` | Blueprint | Active development blueprint — priorities, 30-day plan, coach focus |
| `missions` | Missions | Player missions grouped by status with director approval controls |
| `assessments` | Assessments | Assessment history + new assessment event CTA |

Each tab is a **self-contained Server Component** that fetches its own data via `rawDb`. This keeps the parent `page.tsx` changes minimal and avoids adding more queries to the already large page function.

## Tab architecture

```
page.tsx
  └── PlayerProfileTabs
        ├── development → <DevelopmentCenterTab playerId academyId />
        ├── missions    → <MissionsTab playerId academyId />
        └── assessments → <AssessmentsTab playerId academyId />
```

## DevelopmentCenterTab

**File:** `src/app/director/players/[playerId]/_components/DevelopmentCenterTab.tsx`

Reads from `player_development_blueprints` (rawDb — migration 078). Shows:
- Current level header + blueprint generated date
- Pending missions alert badge (from `player_mission_assignments`)
- Strengths vs development focus grid
- 4-pathway priorities (skill, competition, fitness, mental) — each as a color-coded card with 3 ranked priorities
- First 30-day plan — 4 focus boxes + rationale
- Coach focus areas
- DONNA Development Brief in a collapsible `<details>` block

When blueprint is not yet generated: shows a clear empty state with directions.

## MissionsTab

**File:** `src/app/director/players/[playerId]/_components/MissionsTab.tsx`

Reads from `player_mission_assignments` (rawDb — migration 076). Groups missions by status:
1. **Pending Review** — with Approve / Skip form buttons (using `missionFormActions.ts` wrappers)
2. **Active** — visible to coach
3. **Completed** — with completion note
4. **Archived / Skipped**

Mission cards show: title, description, curriculum level key, period label, source type, date.

Form actions use `approveMissionFormAction` and `skipMissionFormAction` wrapper functions (needed because Next.js 14 requires `(formData: FormData)` signature for form actions).

## AssessmentsTab

**File:** `src/app/director/players/[playerId]/_components/AssessmentsTab.tsx`

Reads from existing `assessments` table (always available) + `assessment_events` (migration 079, graceful fallback if not applied).

Shows:
- Assessment count header with "Start Reassessment" CTA placeholder
- Scheduled/draft assessment events (if migration 079 applied)
- Assessment history cards with score bars per domain + change arrows
- Blueprint recommendation from completed events

## Role labels (Phase 9 mapping)

| Role | Tab label |
|---|---|
| Director | Blueprint |
| Coach | Game Plan (future sprint — same tab, different label) |
| Parent | Development Plan (future sprint — portal-safe view) |
| Player | My Journey (future sprint — missions + progress) |

V1 only shows the director view. Parent and player portal extensions are a future sprint.

## Parent/Player safety

The `DevelopmentCenterTab` shows `coach_brief` and internal priorities — director-only route, no parent/player access risk.

The parent-safe summary in the blueprint (`parent_summary`) is never surfaced in the director Development Center — it is shown only via the parent portal's `/parent/updates` page when `show_to_parent = true`.

## V1 limitations

- No UI for "Start Reassessment" — form/modal is a future sprint; CTA placeholder shown
- Parent/player portal view of blueprint is a future sprint
- Role-specific labels (Game Plan, Development Plan, My Journey) are a future sprint
- AssessmentsTab shows a placeholder CTA for creating new events; the actual form is not built
