# DONNA Relationship Graph Audit — V1

**Sprint:** Mega Sprint 2341–2370  
**Date:** 2026-06-06  
**Purpose:** Full audit of all academy entity relationships, their current availability in DONNA's context, and gaps.

---

## 1. Relationship Inventory

### Player ↔ Coach

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Player's coach | `coach_sessions` / `session_coaches` | ❌ Not loaded | Honest fallback: "Check player profile" |
| Coach's players | Inverse of above | ❌ Not loaded | Honest fallback |
| Primary coach | No schema field | ❌ Not defined | Gap |

**Gap:** Coach-player assignment data is not part of `PlayerCurriculumStateSummary` or `GroupSummary`. Requires additional DB query. Coaches array in `AcademyEntityContext` is always empty in current sprint.

---

### Player ↔ Parent / Guardian

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Player's guardian | `guardian_player_links` table | ❌ Not loaded | Honest fallback in `donnaRelationshipGraph.ts` |
| Parent's children | Inverse | ❌ Not loaded | Honest fallback |
| Parent contact info | `profiles` | ❌ Not loaded | Honest fallback |

**Gap:** Parents array in `AcademyEntityContext` is always empty. No loader exists for the entity context slice.

---

### Player ↔ Group

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Player's group | `player.currentLevelId` ↔ `group.levelId` | ✅ Inferred via index | `groupByLevelId.get(player.currentLevelId)` |
| Group's members | Same inference | ✅ Inferred | `playersByLevelId.get(group.levelId)` |
| Co-group members | Same | ✅ Inferred | Filter out sourcePlayer |

**Status:** Fully supported via `getCoGroupResult()`.

---

### Player ↔ Assessment

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Player's assessments | `AssessmentSummary.playerId` | ✅ Direct | `assessmentsByPlayerId.get(playerId)` |
| Recent assessments | Filter by `assessedDate` | ✅ Computed | ≤ 90 days check |
| Missing assessment | No recent entry | ✅ Inferred | `!hasRecentAssessment(playerId, ...)` |

**Status:** Fully supported.

---

### Player ↔ Curriculum Progress

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Current level | `player.currentLevelDisplayName` | ✅ Direct | Direct field |
| Level UUID | `player.currentLevelId` | ✅ Direct | Direct field |
| Advancement eligible | `player.advancementEligible` | ✅ Direct | Direct field |
| Stall signal | Computed from `enrolledAt` + threshold | ✅ Computed | `computeStallSignal()` |
| Days at level | `enrolledAt` → `Date.now()` diff | ✅ Computed | `getDaysSince(enrolledAt)` |

**Status:** Fully supported. Stall detection mirrors `playerProgressStallDetector.ts` constants (90/180 days).

---

### Player ↔ Missions

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Active missions | `player_missions` / mission engine | ❌ Not loaded | Honest fallback |
| Completed missions | Same | ❌ Not loaded | Honest fallback |

**Gap:** Mission data is not in `AcademyEntityContext`. Future sprint could extend the entity context loader.

---

### Player ↔ Badges

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Earned badges | `player_badges` | ❌ Not loaded | Honest fallback |
| Badge eligibility | `badgeEligibilityEngine.ts` | ❌ Not loaded | Library module exists, not wired to context |

**Gap:** Badge data is not in `AcademyEntityContext`.

---

### Coach ↔ Players

See Player ↔ Coach above. Same gap — coach assignments not loaded.

---

### Coach ↔ Groups

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Coach's groups | `session_coaches` / `group_coaches` | ❌ Not loaded | Honest fallback |

**Gap:** No coach assignment data in current context.

---

### Coach ↔ Curriculum

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Coach's curriculum focus | No schema field | ❌ Not defined | Gap |
| Coach's session templates | `session_templates.coach_id` | ❌ Not loaded | Gap |

---

### Parent ↔ Children

See Player ↔ Parent above. Same gap.

---

### Group ↔ Curriculum

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Group's curriculum level | `group.levelId` → level UUID | ✅ Direct | Direct field match |
| Level's groups | Inverse | ✅ Inferred | `groups.filter(g => g.levelId === levelId)` |

**Status:** Fully supported.

---

### Group ↔ Coaches

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Coach responsible for group | No direct field in `GroupSummary` | ❌ Not available | Honest fallback |

**Gap:** `GroupSummary` does not include coach assignment.

---

### Assessment ↔ Placement

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Assessment's placement recommendation | `AssessmentSummary.promotionReady` | ✅ Partial | Boolean field available |
| Assessment score | `AssessmentSummary.overallScore` | ✅ Direct | Direct field |
| Assessment type | `AssessmentSummary.type` | ✅ Direct | Direct field |

**Status:** Partially supported — promotion readiness flag available.

---

### Assessment ↔ Curriculum

| Relationship | Data source | Available in context | Resolution method |
|---|---|---|---|
| Assessment's level | Via player → currentLevelId | ✅ Inferred | Find player, get their level |
| Level's assessment history | Via `assessmentsByPlayerId` + level filter | ✅ Inferred | Filter by players at level |

**Status:** Inferred via player pivot.

---

## 2. Relationship Resolution Summary Matrix

| Relationship | Available | Method | Confidence |
|---|---|---|---|
| Player → Group | ✅ | `player.currentLevelId` → `groupByLevelId` | High |
| Player → Co-group members | ✅ | `playersByLevelId` filter | High |
| Player → Assessment history | ✅ | `assessmentsByPlayerId` | High |
| Player → Stall signal | ✅ | `enrolledAt` threshold | High |
| Player → Advancement status | ✅ | `advancementEligible` field | High |
| Player → Current level | ✅ | `currentLevelDisplayName` | High |
| Group → Members | ✅ | `playersByLevelId.get(levelId)` | High |
| Group → Templates | ✅ | `templatesByLevelId.get(levelId)` | High |
| Level → Players | ✅ | `playersByLevelName` or `playersByLevelId` | High |
| Level → Groups | ✅ | `groups.filter(g => g.levelId === id)` | High |
| Level → Templates | ✅ | `templatesByLevelId` | High |
| Level hotspot (most stalled) | ✅ | Computed from stall signals | High |
| Player → Coach | ❌ | Honest fallback | N/A |
| Player → Parent | ❌ | Honest fallback | N/A |
| Coach → Players | ❌ | Honest fallback | N/A |
| Parent → Children | ❌ | Honest fallback | N/A |
| Player → Missions | ❌ | Honest fallback | N/A |
| Player → Badges | ❌ | Honest fallback | N/A |
| Group → Coach | ❌ | Honest fallback | N/A |

---

## 3. Missing Relationships (Prioritized)

| Priority | Relationship | What it enables | Data source |
|---|---|---|---|
| P1 | Player ↔ Coach | "Who coaches Jake?", coach load analysis | `session_coaches` join or dedicated `coach_id` on `player_curriculum_states` |
| P2 | Player ↔ Parent | "Show Katrina's player", parent communication tracking | `guardian_player_links` |
| P3 | Group ↔ Coach | "Which coach owns Orange Ball 2?" | `group_coaches` or coach field on `groups` |
| P4 | Player ↔ Missions | "Which missions are incomplete?" | `player_missions` |
| P5 | Player ↔ Badges | "How many badges does Jake have?" | `player_badges` |

---

## 4. Inferred Relationships

These relationships are not directly stored but can be computed from existing data:

| Inferred relationship | From fields | Confidence |
|---|---|---|
| Player is in group | `player.currentLevelId` = `group.levelId` | High (UUID match) |
| Player is stalled | `enrolledAt` + `!advancementEligible` + days threshold | Medium (proxy signal) |
| Level is a hotspot | Players at that level / stall rate | High |
| Group is at risk | >50% members stalled | Medium |
| Assessment gap | No assessment in last 90 days | High |

---

## 5. Relationship Confidence Thresholds

| Confidence | Interpretation | DONNA behavior |
|---|---|---|
| ≥ 0.85 | Direct field match or verified index | Return immediately, no qualification |
| 0.72–0.85 | Inferred via 1 join | Return with brief reasoning note |
| 0.50–0.72 | Computed signal (stall, hotspot) | Return with confidence caveat |
| < 0.50 | Unavailable data | Honest fallback message |
