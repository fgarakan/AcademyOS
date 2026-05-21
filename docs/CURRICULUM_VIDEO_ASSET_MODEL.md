# Curriculum Video Asset Model

**Sprint:** 564 — Curriculum Video Asset Model V1
**Date:** 2026-05-21

---

## Overview

This document describes the conceptual model for media assets in Academy OS curriculum.
No `media_assets` DB table exists yet. These types model the intended design.

Files:
- `src/lib/media/mediaAssetTypes.ts` — core types
- `src/lib/media/mediaVisibilityRules.ts` — visibility/access helpers

---

## Linkable Object Types

Videos and media can be conceptually attached to any of:

| Object Type | Description |
|---|---|
| `curriculum_level` | A development level (e.g., Orange 2) |
| `curriculum_gate` | An exit gate criterion |
| `curriculum_drill` | A curriculum drill |
| `skill` | A skill defined in the skill hierarchy |
| `sub_skill` | A sub-skill component (e.g., "unit turn") |
| `tactical_concept` | A tactical pattern (e.g., crosscourt control) |
| `mental_performance_concept` | A mental performance competency |
| `mission` | A player mission |
| `badge` | A badge |
| `coach_cue` | A coach observation/language cue |
| `parent_guidance` | Parent-facing guidance content |
| `assessment_criterion` | An assessment checkpoint |
| `evidence_requirement` | An evidence requirement |
| `session_block` | A session block |
| `player_homework` | A player homework task |

---

## MediaAsset fields

| Field | Type | Notes |
|---|---|---|
| `assetId` | string | UUID |
| `title` | string | Required |
| `description` | string \| null | Optional |
| `sourceType` | MediaSourceType | youtube \| vimeo \| external_url \| internal_upload \| academy_recorded \| platform_library |
| `sourceUrl` | string | External URL or internal path |
| `ownerType` | MediaOwnerType | platform \| academy \| coach \| third_party \| licensed_partner |
| `licenseStatus` | MediaLicenseStatus | open \| academy_licensed \| platform_licensed \| third_party_licensed \| unlicensed |
| `licenseNote` | string \| null | Attribution or license text |
| `visibilityLevel` | MediaVisibilityLevel | Controls which roles can view |
| `reviewStatus` | MediaReviewStatus | pending_review \| approved \| rejected \| needs_revision |
| `thumbnailUrl` | string \| null | Preview image |
| `durationSeconds` | number \| null | Video length |
| `attributionLabel` | string \| null | Display credit |
| `tags` | string[] | For filtering/search |
| `academyId` | string \| null | null = platform-wide |
| `createdAt` | string | ISO timestamp |
| `approvedAt` | string \| null | null = not yet approved |

---

## Visibility levels

| Level | Director | Coach | Parent | Player |
|---|---|---|---|---|
| `internal_only` | ✓ | ✗ | ✗ | ✗ |
| `coach_director_only` | ✓ | ✓ | ✗ | ✗ |
| `parent_safe` | ✓ | ✓ | ✓ | ✗ |
| `player_safe` | ✓ | ✓ | ✗ | ✓ |
| `parent_player_safe` | ✓ | ✓ | ✓ | ✓ |
| `platform_owner_only` | ✓ | ✗ | ✗ | ✗ |
| `licensed_partner_content` | ✓ | ✓ | ✗ | ✗ |

Note: All visibility is subject to `reviewStatus === 'approved'`. Non-approved assets
are only visible to directors (who can review them).

---

## Source type capabilities

| Source | Supports upload | Supports external link |
|---|---|---|
| `youtube` | No | Yes |
| `vimeo` | No | Yes |
| `external_url` | No | Yes |
| `internal_upload` | **Not yet implemented** | N/A |
| `academy_recorded` | **Not yet implemented** | N/A |
| `platform_library` | **Not yet implemented** | N/A |

**Sprint 564 scope:** External links only. No upload storage exists.

---

## Migration requirement (deferred)

To persist media assets in the DB, a future migration sprint must:

1. Create `media_assets` table with all fields above + academy_id scoping + RLS
2. Create `media_asset_links` table with: asset_id, linked_object_type, linked_object_id, display_order
3. Add RLS: directors see all academy assets; coaches see coach_director_only+; parents/players see approved safe content only
4. Create storage bucket: `curriculum-media` with size limits and content-type restrictions
5. Add bucket policy: only authenticated users with academy_id match can upload

Until this migration runs, all media operations are draft-only in the UI.

---

## Phase 2 UI capabilities (what was built)

| Component | Sprint | Location |
|---|---|---|
| `CurriculumVideoPanel` | 566 | Node drawer → Video tab |
| `CurriculumDrillDraftPanel` | 567 | Node drawer → Draft tab |
| `CurriculumSkillDraftPanel` | 568 | Node drawer → Draft tab |
| `CurriculumTacticalDraftPanel` | 569 | Node drawer → Draft tab |
| `CurriculumMentalDraftPanel` | 570 | Node drawer → Draft tab |
| `CoachCueVideoPairingPanel` | 571 | Node drawer → Draft tab |
| `MediaRolePreviewPanel` | 572 | Node drawer → Preview tab |
