# Parent/Player Visibility QA — Sprint 673

**Date:** 2026-05-23
**Scope:** Verify parents and players see only approved, sanitized content. Audit visibility gating logic, coach note exclusion, parent-safe text sanitization, and data boundaries.
**Method:** Static audit of `src/lib/player/evidenceQueries.ts`, `src/lib/player/developmentProfileQueries.ts`, `src/lib/parent/parentPortalQueries.ts`, `src/lib/communications/parentSafeResponseRules.ts`, `src/app/parent/page.tsx`, `src/app/player/page.tsx`.

---

## Summary

Parent and player visibility gating is correctly structured. All primary data paths (progress records, evidence links, development summaries) have explicit DB-level visibility flags. Text sanitization strips coach-internal annotations before parent-facing content is rendered. Coach observations are entirely excluded from parent and player query paths. One P2 gap found: `player_priorities` rows exposed to parents lack a `is_parent_visible` or `show_to_parent` gate — titles may contain internal coach language.

---

## Visibility Flag Architecture

The codebase implements a three-layer visibility model:

| Layer | Mechanism | Where enforced |
|---|---|---|
| DB-level flag | `is_parent_visible`, `is_parent_safe`, `show_to_parent`, `is_player_visible`, `show_to_student` | Query filters in data layer functions |
| Field-level allowlist | `PARENT_VISIBLE_FIELDS` set | `parentSafeResponseRules.ts:canShowParentField()` |
| Text sanitization | Regex rules strip internal annotations | `parentSafeResponseRules.ts:sanitizeParentFacingText()` |

---

## Parent Visibility Gates

### Progress records — `player_requirement_progress`

| Function | Visibility gate | Result |
|---|---|---|
| `fetchPlayerRequirementProgress()` | None — full coach/director view | Never called in parent portal |
| `fetchParentVisibleProgress()` | `.eq('is_parent_visible', true)` | ✅ Used by parent portal |
| `fetchPlayerVisibleProgress()` | `.eq('is_player_visible', true)` | Used by player portal only |

`parentPortalQueries.ts` calls only `fetchParentVisibleProgress()` — the ungated full-access function is never in the parent call path.

---

### Evidence links — `requirement_evidence_links`

| Function | Visibility gate | Result |
|---|---|---|
| `fetchRequirementEvidenceLinks()` | None — full access | Never called in parent portal |
| `fetchParentSafeEvidenceLinks()` | `.eq('is_parent_safe', true)` | ✅ Used by parent portal |

`fetchParentPortalProfile()` calls only `fetchParentSafeEvidenceLinks()`. The full-access function is for director/coach paths only.

---

### Development summary — `player_development_summary`

| Function | Visibility gate | Result |
|---|---|---|
| `fetchPlayerDevelopmentSummary()` | None — full coach/director view | Never called in parent portal |
| `fetchPlayerSummaryForParent()` | `.eq('show_to_parent', true)` | ✅ Used by parent portal |
| `fetchPlayerSummaryForStudent()` | `.eq('show_to_student', true)` | Used by player portal only |

Additionally, `getParentFacingContent()` is a pure guard function:
- Returns `null` if `!isProfileShownToParent(summary)`
- Returns only `parentSummary` (not `coachSummary`) — the internal coach-facing field is structurally excluded from parent output

| `DevelopmentSummaryRecord` field | Parent portal receives it? |
|---|---|
| `coachSummary` | ❌ Never — `getParentFacingContent()` only returns `parentSummary` |
| `parentSummary` | ✅ Only when `showToParent = true` |
| `studentFriendlySummary` | ❌ Not in parent path |
| `currentStrengths` | ✅ When `showToParent = true` |
| `thingsToWorkOn` | ❌ Not returned by `getParentFacingContent()` |
| `developmentFocus` | ✅ When `showToParent = true` |

---

### Parent portal profile assembly

`fetchParentPortalProfile()` orchestrates the parent view:

```
fetchParentPortalPlayerCard()   → players table: id, name, level, group only
fetchPlayerSummaryForParent()   → show_to_parent = true only
fetchTopPlayerPriorities()      → ⚠️ No visibility gate (see Gap 1)
fetchParentVisibleProgress()    → is_parent_visible = true only
fetchParentSafeEvidenceLinks()  → is_parent_safe = true only
```

All joins use both `playerId` and `academyId` — double-keyed.

---

### Parent home page (`src/app/parent/page.tsx`)

The parent page implements additional runtime guards:

- **Identity chain:** `auth.getUser()` → `profiles.academy_id` → `guardians.id` → `player_guardians.player_id` → verified player list. Player identity is never taken from URL params alone.
- **childId validation:** `validateChildBelongsToGuardian()` validates that the `childId` from URL params matches the authenticated guardian's linked players. An unlinked player ID results in a fallback to the default child, not an error that reveals data.
- **Multi-child lesson request suppression:** `canShowLessonRequest = false` when guardian has more than one selectable child, preventing cross-child leakage through `proposed_actions.target_object_id` (which is null for lesson requests in the current schema).
- **Parent-safe text pipeline:** `sanitizeParentFacingText()` applied to any free-form observation text before rendering.
- **IDP view:** `buildRoleSpecificIdpView()` with `parent` role — extracts only the parent-safe fields from the IDP structure.

---

## Player Visibility Gates

### Player identity — never from URL

```typescript
// From player/page.tsx:
// Resolve player via profile_id — never trust URL params for player identity
const { data: playerRow } = await rawDb
  .from('players')
  .select('id, first_name, last_name, full_name')
  .eq('academy_id', academyId)
  .eq('profile_id', user.id)  // ← linked to auth user
  .eq('is_active', true)
  .maybeSingle()
```

A player cannot view another player's data because the player record is resolved from their own `auth.getUser()` session.

---

### Player progress visibility

| Data category | Gate | Result |
|---|---|---|
| Requirement progress | `fetchPlayerVisibleProgress()` → `is_player_visible = true` | ✅ |
| Development summary | `fetchPlayerSummaryForStudent()` → `show_to_student = true` | ✅ |
| Coach observations (raw) | Not queried in player portal | ✅ Excluded |
| Other players' data | No cross-player queries exist in player portal | ✅ Excluded |
| Director notes | Not queried in player portal | ✅ Excluded |
| Assessment scores (raw) | Not exposed in player portal | ✅ Excluded |
| Private coach notes | `is_private` flag in `coach_observations` — not in player path | ✅ Excluded |

**Player-visible fields in player portal:**
- Own curriculum level + stage + next level
- Open gates (criteria to advance)
- Top drills for current level
- Coach language (current focus text, step, reflection)
- Own attendance history (own session IDs only)
- Badge eligibility (computed from own requirement progress)

The player portal does not query: `coach_observations`, `director_notes`, `player_recommendations` (director view), `recommendation_overrides`, `audit_logs`, or any other player's records.

---

## Coach Note Exclusion

Coach notes (`coach_observations` table) are excluded from both parent and player portals at the query layer:

| Portal | Is `coach_observations` queried? | Result |
|---|---|---|
| Parent portal (`/parent`) | ❌ No | ✅ Excluded |
| Player portal (`/player`) | ❌ No | ✅ Excluded |
| Director DONNA context | ✅ Yes — `observation_type = concern` only (count) | Director-only |
| Coach workspace | ✅ Yes — coach's own observations only | Coach-scoped |

The `coach_observations.is_private` flag provides additional protection when observations are used in director-facing surfaces.

---

## Text Sanitization (`parentSafeResponseRules.ts`)

The `sanitizeParentFacingText()` function applies 14 regex rules before any free-form observation text is rendered to a parent:

**Language softening (applied to all parent-facing text):**
- "poor performance" → "developing performance"
- "needs improvement" → "working on"
- "struggling with" → "working through"
- "failing" → "still developing"
- "deficient" → "developing"
- "weak" → "building"

**Internal annotation stripping:**
- `INTERNAL:[^\n]*` → removed
- `[COACH...]` annotations → removed
- `[INTERNAL...]` annotations → removed
- `[DIRECTOR...]` annotations → removed

This ensures that even if a coach note is inadvertently included in a parent-safe draft, the internal markers are stripped before rendering.

---

## Field Allowlist (`canShowParentField()`)

```typescript
const PARENT_VISIBLE_FIELDS = new Set<string>([
  'player.full_name',
  'player.first_name',
  'player.curriculum_level_display_name',
  'player.curriculum_stage',
  'session_attendance.status',
  'parent_safe_draft',
  'player_development_priorities.parent_message',
])
```

Only these 7 field paths are allowed in parent-facing contexts. All other field names return `false` from `canShowParentField()`.

---

## Gaps Identified

### Gap 1 — player_priorities exposed to parents without visibility gate (P2)

**Location:** `src/lib/parent/parentPortalQueries.ts:fetchParentPortalProfile()` → `fetchTopPlayerPriorities(db, playerId, academyId, 3)`

**Issue:** `player_priorities` rows are returned to the parent portal with no `is_parent_visible` or `show_to_parent` filter. The `PlayerPriorityRecord` type exposes `title`, `description`, `category`, `urgency`, and other fields. If a coach or AI system generates a priority title containing internal language (e.g., "Motor coordination deficit — Level 2 gap"), that text would be shown to the parent without sanitization.

**Current mitigation:** The `parentSafeResponseRules.ts` language softening is not applied to `player_priorities` titles — it's applied to free-form observation text only. No protection exists for this path.

**Recommendation:** Either:
a) Add `is_parent_visible` boolean to `player_priorities` table and gate the parent query on it (requires a migration — not for V1 sprint).
b) Apply `sanitizeParentFacingText()` to priority `title` and `description` before rendering in the parent portal.
c) Document that priority titles must be parent-safe when generated — enforce in DONNA prompt constraints.

**Severity: P2** — affects polish and trust, not security. No V1 blocker if priorities are not yet populated with internal language. Option (c) is the V1 mitigation.

---

### Gap 2 — Player portal coach language is not visibility-gated (P3)

**Location:** `src/app/player/page.tsx` — `curriculum_coach_language` table query
**Issue:** The player portal queries `curriculum_coach_language` (a structured curriculum text record with fields like `doing_well`, `working_on`, `current_focus`, `next_step`) with no player-specific visibility flag. This is curriculum-level text, not player-specific coach notes, so it applies equally to all players at that level. No individual player data is exposed.
**Severity: P3** — curriculum-level text is intentionally public to all players at that level. Not a visibility concern.

---

### Gap 3 — `hasDevelopmentSummary` flag uses raw `showToParent` (P3)

**Location:** `src/lib/parent/parentPortalQueries.ts` line 129
**Issue:** `hasDevelopmentSummary: developmentSummary !== null && developmentSummary.showToParent` — this derives `hasDevelopmentSummary` from the fetched `developmentSummary.showToParent` property. Because `fetchPlayerSummaryForParent()` already filters on `show_to_parent = true`, the property on the returned record will always be `true` when the summary exists. The double-check is redundant but harmless.
**Severity: P3** — no functional impact.

---

## What Parents Can See

| Data | Exposed? | Gate |
|---|---|---|
| Child's first name | ✅ | `player.first_name` (allowlist) |
| Child's curriculum level | ✅ | `player.curriculum_level_display_name` (allowlist) |
| Child's group / coach name | ✅ Level label only | `players` select (id, name, level, group) |
| Attendance status per session | ✅ | `session_attendance.status` (allowlist) |
| Parent-approved development summary | ✅ | `show_to_parent = true` gate |
| Parent-facing priorities (top 3) | ✅ (ungated — see Gap 1) | No visibility flag |
| Parent-visible requirement progress | ✅ | `is_parent_visible = true` gate |
| Parent-safe evidence links | ✅ | `is_parent_safe = true` gate |
| Raw coach observations | ❌ | Not queried |
| Internal assessment scores | ❌ | Not queried |
| Coach summary (internal text) | ❌ | `getParentFacingContent()` excludes `coachSummary` field |
| Other children's data | ❌ | `childId` server-validated per guardian |
| Director actions / audit logs | ❌ | Not queried |
| Private lesson requests | ❌ (multi-child) / ✅ (single child) | `canShowLessonRequest` flag |

## What Players Can See

| Data | Exposed? | Gate |
|---|---|---|
| Own curriculum level + next level | ✅ | Own `profile_id` → player record |
| Open gates (advancement criteria) | ✅ | `from_level_id = currentLevelId` |
| Top drills for current level | ✅ | Curriculum-level data, not player-specific |
| Student-friendly development summary | ✅ | `show_to_student = true` gate |
| Own attendance history | ✅ | Own player_id scoped |
| Badge eligibility | ✅ | Computed from own requirement progress |
| Raw coach observations | ❌ | Not queried |
| Other players' data | ❌ | `profile_id = user.id` linkage |
| Assessment scores / rankings | ❌ | Not queried |
| Director notes | ❌ | Not queried |

---

## Readiness Assessment

| Area | Status | Notes |
|---|---|---|
| Parent progress visibility (`is_parent_visible`) | Ready | DB-level gate correctly applied |
| Parent evidence visibility (`is_parent_safe`) | Ready | DB-level gate correctly applied |
| Parent development summary (`show_to_parent`) | Ready | DB-level gate + field-level exclusion of `coachSummary` |
| Text sanitization (internal annotations) | Ready | 14-rule regex pipeline strips all `[COACH]`/`[INTERNAL]` markers |
| Coach note exclusion from parent portal | Ready | `coach_observations` not queried in parent portal |
| Coach note exclusion from player portal | Ready | `coach_observations` not queried in player portal |
| Player identity isolation | Ready | `profile_id = user.id` — never URL-param |
| Player development summary (`show_to_student`) | Ready | DB-level gate correctly applied |
| Parent child switcher validation | Ready | `validateChildBelongsToGuardian()` — server-side |
| Multi-child lesson request suppression | Ready | `canShowLessonRequest` correctly gated |
| player_priorities parent visibility | Gap (P2) | No `is_parent_visible` gate — V1 mitigation: ensure priority titles use parent-safe language |

**No P0 blockers. One P2 gap (player_priorities visibility). V1 mitigation available without code change: document that AI-generated priority titles must use parent-safe language.**
