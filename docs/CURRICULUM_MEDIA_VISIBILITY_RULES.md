# Curriculum Media Visibility Rules

**Sprint:** 573 — Curriculum Media QA V1
**Date:** 2026-05-21

---

## Core rule: Director approves, role controls distribution

All media assets start as `pending_review`. Only directors can see unapproved assets.
After director approval, the `visibilityLevel` field controls which roles can view.

```
pending_review → approved (director action) → distributed to allowed roles
```

No media asset is visible to parents or players unless:
1. It is `approved`
2. Its `visibilityLevel` is `parent_safe`, `player_safe`, or `parent_player_safe`
3. It is linked to an object the parent/player has access to

---

## Role access matrix

| Visibility Level | Director | Coach | Parent | Player | Notes |
|---|---|---|---|---|---|
| `internal_only` | ✓ | ✗ | ✗ | ✗ | Coaching team use only |
| `coach_director_only` | ✓ | ✓ | ✗ | ✗ | Default for coach cues + video pairings |
| `parent_safe` | ✓ | ✓ | ✓ | ✗ | Parent portal eligible |
| `player_safe` | ✓ | ✓ | ✗ | ✓ | Player portal eligible |
| `parent_player_safe` | ✓ | ✓ | ✓ | ✓ | Shared content |
| `platform_owner_only` | ✓ | ✗ | ✗ | ✗ | Admin/platform only |
| `licensed_partner_content` | ✓ | ✓ | ✗ | ✗ | Licensing restrictions |

---

## Default visibility per asset type

| Asset Type | Default Visibility | Rationale |
|---|---|---|
| Coach cue video pairing | `coach_director_only` | Coach language is internal |
| Drill demo video | `coach_director_only` | Start internal, promote if appropriate |
| Tactical concept video | `coach_director_only` | Internal by default |
| Mental performance video | `coach_director_only` | Internal by default |
| Skill demonstration | `player_safe` | Can be player-visible after review |
| Parent guidance video | `parent_safe` | Parent portal eligible |
| Homework video | `parent_player_safe` | Shared content |

---

## Blocked reason explanations

When a role cannot view an asset, the system shows one of these messages:

| Reason | Message |
|---|---|
| `internal_only` | "Internal use only — not shared outside the coaching team" |
| `coach_director_only` | "Coach and director access only — not shared with families" |
| `not_reviewed` | "Not yet reviewed — requires director approval before sharing" |
| `not_parent_safe` | "Not designated as parent-safe content" |
| `not_player_safe` | "Not designated as player-safe content" |
| `licensing_restricted` | "Licensing restricts who can access this content" |
| `platform_owner_only` | "Restricted to platform administration" |

---

## What coaches can and cannot do

**Can:**
- View `coach_director_only`, `parent_safe`, `player_safe`, `parent_player_safe` assets (approved only)
- Draft new video link proposals
- Pair videos with coach cues

**Cannot:**
- Approve media assets (director only)
- Change visibility settings
- View `internal_only` or `platform_owner_only` assets

---

## What parents and players never see

- Internal coach cues and coaching language
- `internal_only` assets
- `coach_director_only` assets
- Unapproved (pending_review) assets
- Gate criteria or assessment scores
- Other players' data

---

## Licensing safety rules

Assets with `licensed_partner_content` visibility:
- Coach and director can view
- Parent and player cannot view
- Must include `licenseNote` field with attribution
- Should not be shared outside the platform environment

Assets with `unlicensed` license status should be treated as `internal_only`
until license status is confirmed.

---

## Media review checklist (before approving an asset)

- [ ] Content is appropriate for the intended audience
- [ ] Source URL is valid and accessible
- [ ] License status is correctly set
- [ ] Attribution label is present if required
- [ ] Visibility level is correctly set for intended audience
- [ ] No identifying player information in the video
- [ ] No internal coaching criticism that should not be shared
- [ ] Duration/thumbnail correct if provided
