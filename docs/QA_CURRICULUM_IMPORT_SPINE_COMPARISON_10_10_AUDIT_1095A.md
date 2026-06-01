# QA — Curriculum Import + Spine Comparison 10/10 Audit

**Sprint:** 1095A
**Date:** 2026-06-01
**Type:** Audit-only — no code changes.

---

## Component Audit Verification

### Spine and data model

| Check | Result |
|---|---|
| `curriculum_stages` with `stage_goal` exists | ✅ 5 rows, all have real goal text |
| `curriculum_levels` 15 sub-levels exist | ✅ Red 1-3, Orange 1-3, Green 1-3, Yellow 1-3, HP 1-3 |
| `curriculum_gates` 57 gates exist | ✅ 4 per level (HP 3 has 1) |
| `curriculum_content_items` exist | ✅ 92 rows, all `source_type = 'global_default'` |
| `academy_curriculum_versions` active rows | ❌ 0 rows — no academy activated |
| `academy_curriculum_overrides` active rows | ❌ 0 rows (no active version) |
| `knowledge_items` table in DB | ❌ Does not exist (PGRST205 error confirmed) |
| `curriculum_import_jobs` table | ❌ Does not exist |
| `curriculum_extracted_items` table | ❌ Does not exist |
| `curriculum_spine_matches` table | ❌ Does not exist |
| Rollback support in overrides | ✅ `rollback_of_override_id` + `original_snapshot` fields exist |

### TypeScript infrastructure

| Module | Exists? | DB Backed? |
|---|---|---|
| `knowledgeTypes.ts` — `KnowledgeItem` | ✅ | ❌ No DB table |
| `knowledgeIngestionTypes.ts` — `IngestionPayload` | ✅ | ❌ No DB table |
| `knowledgeIngestionClassifier.ts` — domain/source inference | ✅ | ❌ No DB |
| `knowledgeSimilarityDetector.ts` — token overlap | ✅ | ❌ In-memory only |
| `knowledgeCurriculumBridge.ts` — promotion to curriculum | ✅ | ❌ TS only |
| `knowledgeCurriculumIntelligence.ts` — gap→knowledge matching | ✅ | ❌ TS only |
| `gapAnalysis.ts` — curriculum gap analysis | ✅ | ✅ Uses live DB data |
| `stageProgressionModel.ts` — stage gate descriptions | ✅ | ❌ Static only |

### File upload support

| Format | Supported? | Notes |
|---|---|---|
| Text/paste | ❌ | No endpoint; ingestion types exist in TS |
| Voice → text | ⚠️ | Works for wrap-up notes; no curriculum extraction |
| Audio (MP3/WAV/WebM) | ✅ | `/api/coach/sessions/[id]/transcribe` (Whisper) |
| PDF | ❌ | No parser, no upload endpoint |
| CSV | ❌ | No import endpoint |
| URL | ❌ | `url_metadata_only` in IngestionMethod but no implementation |
| Video | ❌ | No support |

---

## 10/10 Model Readiness Scores

| Dimension | Score | Justification |
|---|---|---|
| Curriculum spine | 7/10 | 15 levels, 57 gates, 92 items; missing level description text |
| Global vs academy separation | 8/10 | Clean architecture, 0 active versions |
| Curriculum data model clarity | 7/10 | Good structure; missing goal/exit fields per level |
| Upload source support | 2/10 | Audio only; no document/paste/URL |
| Document parsing | 1/10 | None |
| Text/voice intake | 4/10 | Voice → text works; no curriculum extraction engine |
| Ingestion type system | 6/10 | TS types complete; no DB backing |
| DONNA curriculum structuring | 4/10 | LLM + classifier exist; no dedicated extraction pipeline |
| Spine mapping | 1/10 | No mapping algorithm or storage |
| Similarity/overlap detection | 4/10 | Token overlap works; not adapted for curriculum comparison |
| Conflict detection | 1/10 | Missing entirely |
| Missing content detection | 4/10 | Gap analysis works; not framed for import |
| Merge review UX | 1/10 | No UI |
| Approval/versioning pipeline | 7/10 | `proposed_actions` + overrides reusable |
| Permission safety | 8/10 | Guards exist; global spine protected |
| Parent/player visibility safety | 8/10 | Visibility flags on all content items |
| Partner/federation readiness | 1/10 | Architecture not started |
| Knowledge library DB | 1/10 | TS-only; `knowledge_items` table missing |
| **Overall 10/10 model** | **3/10** | Foundation strong; pipeline stages 1-6 missing |

---

## Critical Path to 10/10

### Blocked by (P0 prerequisites)
1. `knowledge_items` table — the entire knowledge library has no DB. Without this, nothing can be staged, reviewed, or persisted in the import pipeline.
2. `curriculum_import_jobs` + `curriculum_extracted_items` tables — no way to track import state or store parsed items.

### Not blocked (can start now)
- Sprint 1095B: Curriculum Director Insight View (planned) — no import dependency
- Text/paste intake endpoint could be built and wired to DONNA, storing to proposed_actions temporarily, while waiting for `knowledge_items` table

---

## Permission Safety Verification

| Safety check | Result |
|---|---|
| Director cannot modify global spine directly | ✅ RLS + `CurriculumEditPermissionGuard` |
| Import changes go through academy override layer | ✅ Architecture supports this |
| All changes require director approval before applying | ✅ `proposed_actions` pipeline |
| Global content preserved by default | ✅ Overrides are additive/replacements; original_snapshot preserved |
| Parent/player content never auto-exposed | ✅ `is_parent_visible = false` default on new content items |
| Rollback is possible | ✅ `rollback_of_override_id` + `original_snapshot` fields |

---

## What is Confirmed NOT to Build Yet

| Item | Confirmed risk |
|---|---|
| Auto-apply import without review | Safety violation — confirmed |
| Modifying global `curriculum_levels` / `curriculum_gates` | Architecture violation — confirmed |
| PDF parsing before copyright policy | Legal risk — confirmed |
| Partner pack architecture | External agreements needed — confirmed |
| Player/parent exposure of import items before approval | Privacy/safety risk — confirmed |

---

## Recommended Sprint Sequence Summary

```
1095B  Curriculum Director Insight View (planned)
1096A  Knowledge Library DB foundations  ← P0 prerequisite for all import
1096B  Text/paste intake → DONNA extraction → extracted_items
1096C  DONNA curriculum extraction engine
1097A  Spine mapping + classification engine
1097B  Missing content detection from import context
1097C  Director import review UX (comparison + item-by-item)
1097D  Merge decision approval → academy_curriculum_overrides
1098A  Rollback + audit trail for imports
1099A  File upload (PDF/CSV) — only after copyright policy decision
```

---

## No TypeScript Run Needed

Sprint 1095A (this iteration) made no code changes. TypeScript is unchanged from Sprint 1094E.
