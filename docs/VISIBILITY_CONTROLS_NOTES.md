# Visibility Controls

> Sprint 490 — Visibility Control Layer V1
> See also: `src/lib/player/visibilityControls.ts`, `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_EXPERIENCE_AUDIT.md`

---

## Purpose

`visibilityControls.ts` is the single source of truth for "can this role see this content?" decisions. All parent/player content gates flow through this module.

---

## Flag matrix

| Flag | Location | Controls |
|---|---|---|
| `show_to_student` | player_development_summary | Development summary text visible to player |
| `show_to_parent` | player_development_summary | Development summary text visible to parent |
| `is_player_visible` | curriculum_requirements | Requirement progress visible to player |
| `is_parent_visible` | curriculum_requirements | Requirement progress visible to parent |
| `is_parent_safe` | evidence_links | Evidence visible to parent |

---

## Visibility rules by role

| Role | Development summary | Progress records | Evidence |
|---|---|---|---|
| academy_director | Always | Always | Always |
| head_coach | Always | Always | Always |
| coach | Always | Always | Always |
| player | show_to_student=true | is_player_visible=true | is_player_visible=true |
| parent | show_to_parent=true AND is_parent_visible=true | is_parent_visible=true | is_parent_safe=true |

---

## Main functions

- `isDevelopmentSummaryVisible(input, role)` — checks show_to_student / show_to_parent
- `isProgressRecordVisible(input, role)` — checks is_parent_visible / is_player_visible
- `isEvidenceLinkVisible(input, role)` — checks is_parent_safe / is_player_visible
- `computeContentVisibility(input)` — comprehensive gate returning all visibility decisions
- `filterByVisibility(records, role)` — filters typed arrays by role
- `isCoachNoteVisibleToParent(isParentSafe)` — coach notes gate for parent (explicit false default)
- `isCoachNoteVisibleToPlayer(isPlayerVisible)` — coach notes gate for player

---

## Invariants

- Coach notes are NEVER visible to parents unless `is_parent_safe=true`
- Coach notes are NEVER visible to players unless `is_player_visible=true`
- `parent` role requires ALL applicable flags to be true (AND logic — most restrictive)
- These gates are defense-in-depth — database RLS also enforces the same rules
