# Group Needs Aggregation

**Sprint:** 92
**File:** `src/lib/session-planning/groupNeedsAggregation.ts`

---

## Purpose

Aggregate the development needs, strengths, curriculum context, and attendance data for every player in a session's class roster into a single structured object.

This object is the input to the Session Modification Rule Engine (Sprint 93).

---

## Function

```typescript
getGroupNeedsForSession({
  supabase,
  academyId,
  sessionId,
}): Promise<GroupNeedsResult>
```

---

## Queries (sequential, per AI_BACKEND_RULES rule 5)

1. `sessions` — verify session belongs to academy, get `group_id` and `template_id`
2. `group_memberships` — get current player IDs for the group
3. `players` — get display names
4. `session_attendance` — get current attendance status per player
5. `player_curriculum_states` — get `current_level_id` and `curriculum_version_id`
6. `curriculum_levels` — get level display names for found level IDs
7. `player_development_summary` — get `current_strengths`, `things_to_work_on`, `development_focus`
8. `player_priorities` — get top active priority per player
9. `voice_notes` — count evidence notes per player
10. `voice_notes` — get last coach note snippet per player
11. `templates` → `academy_curriculum_versions` → `academy_curriculum_overrides` — get applied override summaries for the session's curriculum level

---

## Return Shape

```typescript
{
  sessionId: string
  groupId: string | null
  playerCount: number
  players: PlayerNeedsItem[]
  commonStrengths: string[]       // top-N across class
  commonNeeds: string[]           // top-N across class
  commonPriorities: string[]      // top-N across class
  missingCurriculumAssignments: number
  missingDevelopmentSummaries: number
  attendanceWarnings: string[]
  curriculumLevelCounts: Record<string, number>
  academyOverrideSummaries: string[]
  warnings: string[]
}
```

---

## Graceful Fallbacks

- No group assigned → empty result with warning
- No members → empty result with warning
- Missing development summaries → `strengths: []`, `thingsToWorkOn: []`
- Missing curriculum state → `curriculumLevelName: null`
- Missing attendance → `attendanceStatus: null`, warning added

---

## Guardrails

- No mutations
- `academy_id` verified from caller (caller verifies from auth profile)
- No AI API calls
- No fake data — all data comes from DB
