# Curriculum Video Asset QA Checklist

**Sprint:** 573 — Curriculum Media QA V1
**Date:** 2026-05-21
**Covers:** Sprints 564–573 (Phase 2 of Mega Sprint 554–603)

---

## Pre-test setup

- [ ] Sign in as `academy_director`
- [ ] Navigate to `/director/curriculum`
- [ ] Open the Level Tree, click any level to open the node drawer
- [ ] TypeScript: `npx tsc --noEmit` exits clean

---

## Sprint 564 — Media Asset Model (library only)

- [ ] `src/lib/media/mediaAssetTypes.ts` exists and exports all types
- [ ] `MediaAsset`, `MediaAssetDraft`, `MediaAssetLink` types present
- [ ] All `MediaVisibilityLevel`, `MediaSourceType`, `MediaOwnerType` union types defined
- [ ] `LinkedObjectType` covers all 15 object types
- [ ] `VISIBILITY_LABELS`, `SOURCE_TYPE_LABELS`, `LINKED_OBJECT_LABELS` maps complete

---

## Sprint 565 — Visibility Rules (library only)

- [ ] `src/lib/media/mediaVisibilityRules.ts` exists and exports all helpers
- [ ] `canRoleViewMedia(role, asset)` returns correct result for all roles
- [ ] Director can view all visibility levels regardless of review status
- [ ] Coach cannot view `internal_only` approved assets
- [ ] Parent cannot view `coach_director_only` approved assets
- [ ] Player cannot view `parent_safe` approved assets
- [ ] Unapproved assets return `not_reviewed` for coach/parent/player
- [ ] `BLOCKED_REASON_LABELS` has a readable message for all 7 blocked reasons
- [ ] `getMediaVisibilityBadgeClass` returns distinct class for each visibility level

---

## Sprint 566 — Video Panel (node drawer)

- [ ] "Video" tab visible in node drawer (between Draft and DONNA)
- [ ] "External link draft only" orange disclaimer visible
- [ ] Source type selector shows: YouTube, Vimeo, External Link, Academy Recorded
- [ ] Video URL field accepts input
- [ ] Title field accepts input
- [ ] Description textarea accepts input
- [ ] Visibility selector shows 5 options with coloured badges
- [ ] License/attribution field accepts input
- [ ] "Save Video Draft" button disabled until URL + title filled
- [ ] After submit: draft preview card with lime border, visibility badge, external link
- [ ] "Requires director approval" warning in draft card
- [ ] "Add Another Video" resets form
- [ ] "Future: Internal uploads" note visible at bottom

---

## Sprint 567 — Drill Draft Panel

- [ ] "Draft Drill" accordion visible in Draft tab (collapsed by default)
- [ ] Clicking header expands the form
- [ ] Orange "Draft only" disclaimer visible when expanded
- [ ] Title, difficulty, ball colour fields present
- [ ] Setup, player count, equipment, rules fields present
- [ ] Progression, regression, coach cues fields present
- [ ] Evidence target, video link, safety notes fields present
- [ ] "Save Drill Draft" disabled until title filled
- [ ] Draft preview shows title, difficulty, ball colour after submit
- [ ] "Requires director approval" in draft preview
- [ ] "Draft Another" resets form

---

## Sprint 568 — Skill/Sub-Skill Draft Panel

- [ ] "Draft Skill / Sub-Skills" accordion visible in Draft tab (collapsed)
- [ ] Skill name, domain, player-facing label, coach description fields present
- [ ] Sub-skill input with Enter-to-add or + button
- [ ] Sub-skill chips show with × remove button
- [ ] Player and parent visibility checkboxes present
- [ ] Draft preview shows skill name, domain, sub-skill chips
- [ ] "Requires director approval" in preview

---

## Sprint 569 — Tactical Concept Draft Panel

- [ ] "Draft Tactical Concept" accordion visible in Draft tab (collapsed)
- [ ] Concept name field with example suggestion chips
- [ ] Example suggestions: Crosscourt control, Changing direction, etc.
- [ ] Description, When to use, Coaching notes, Player label, Video reference fields
- [ ] Draft preview shows concept name and description

---

## Sprint 570 — Mental Performance Draft Panel

- [ ] "Draft Mental Performance Concept" accordion visible in Draft tab (collapsed)
- [ ] Concept name with example chips: Mistake response, Loss response, etc.
- [ ] Domain selector with 7 domains (short labels)
- [ ] Description, observable markers, coaching cues fields
- [ ] Player label and parent label fields (separate)
- [ ] Draft preview shows name, domain, player label
- [ ] Orange disclaimer and lime approval note

---

## Sprint 571 — Coach Cue + Video Pairing Panel

- [ ] "Coach Cue + Video Pairing" accordion visible in Draft tab (collapsed)
- [ ] Yellow "Coach & Director only" warning prominent
- [ ] Cue type selector: 5 types (Observation, Correction, Reinforcement, Gate Check, Setup)
- [ ] Domain selector present
- [ ] Prompt/cue textarea present
- [ ] Context / when to use field present
- [ ] Video Reference section shows video title + URL fields
- [ ] Draft preview shows cue text, type badge, domain badge, video title
- [ ] "Coach & Director visibility only" in draft preview

---

## Sprint 572 — Media Role Preview Panel

- [ ] Appears in Preview tab, below the existing role toggle
- [ ] Shield icon and "Media Visibility Simulator" label visible
- [ ] 6 visibility options as clickable badges
- [ ] Selecting a visibility updates the access grid
- [ ] Grid shows Director, Coach, Parent, Player rows
- [ ] Eye icon (green) for roles that can view; EyeOff (gray) for blocked
- [ ] Blocked rows show readable reason from `BLOCKED_REASON_LABELS`
- [ ] `coach_director_only` → parent and player show blocked with correct reason
- [ ] `parent_player_safe` → all 4 roles show can view
- [ ] `internal_only` → only director shows can view
- [ ] No actual media is created — simulator only

---

## Security / data safety

- [ ] No parent/player data exposed in any Phase 2 component
- [ ] Coach cue panel shows yellow "internal only" warning — not shown to families
- [ ] Mental performance coaching cues field is labeled internal-only
- [ ] Video panel shows "requires director approval" before any distribution
- [ ] No DB writes from any component — all are draft/simulation UI
- [ ] `mediaVisibilityRules.ts` returns correct blocked reasons for each role
- [ ] `canRoleViewMedia` never allows parent/player to see internal assets
- [ ] No upload or storage bucket created — external links only

---

## Sprint 573 — Documentation

- [ ] `docs/CURRICULUM_VIDEO_ASSET_MODEL.md` exists and documents all fields
- [ ] `docs/CURRICULUM_MEDIA_VISIBILITY_RULES.md` exists with role matrix + defaults
- [ ] `docs/CURRICULUM_VIDEO_ASSET_QA.md` exists (this file)

---

## Migration readiness checklist

- [ ] `docs/CURRICULUM_VIDEO_ASSET_MODEL.md` documents migration requirements
- [ ] Blocked reason: no `media_assets` DB table — all operations are local draft UI only
- [ ] DB migration sprint must: create `media_assets` table, `media_asset_links` table, RLS, storage bucket
- [ ] Until migration: video panel shows "External link draft only" disclaimer prominently

---

## Known limitations (expected failures — not regressions)

- Draft data is local state only — refreshing the page discards it
- DONNA card does not wire to real AI API — echoes input
- Internal upload / academy_recorded source types shown as options but not functional
- Media role preview is a simulation — no real asset is tested
- Coach cue + video pairing does not write to DB
