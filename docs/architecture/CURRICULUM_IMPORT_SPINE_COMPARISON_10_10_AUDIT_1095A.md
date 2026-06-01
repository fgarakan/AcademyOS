# Curriculum Import + Spine Comparison 10/10 Audit — Sprint 1095A

**Date:** 2026-06-01
**Sprint:** 1095A — Audit only. No code changes. No migrations.

---

## Executive Summary

The 10/10 curriculum import and spine comparison vision requires: (1) an academy uploading its curriculum, (2) DONNA parsing and mapping it to the AcademyOS spine, (3) comparison against existing content, (4) classification of each item, (5) director review and approval, (6) approved changes becoming versioned academy curriculum layers.

**Current overall readiness: 3/10.**

The spine and academy override architecture are strong foundations. The knowledge ingestion classifier and similarity detector are sound but have no DB backing. The entire import pipeline — file parsing, spine mapping, conflict classification, and merge review UX — does not yet exist.

---

## 1. AcademyOS Core Curriculum Spine — Current State

### Live DB (confirmed)
- **5 stages** with `stage_goal`, `age_range`, `utr_range` in `curriculum_stages`
- **15 sub-levels** (Red 1-3, Orange 1-3, Green 1-3, Yellow 1-3, HP 1-3) in `curriculum_levels`
- **57 gates** (4 per level) with domain, criterion, threshold in `curriculum_gates`
- **92 curriculum_content_items** — all `source_type = 'global_default'`, tagged to levels

### Not yet in DB
- `curriculum_levels.level_description` column — not present
- `curriculum_levels.exit_player_profile` column — not present
- `skill_progressions` — extremely sparse (1 row)
- `parent_level_descriptions` — placeholder data only

**Spine readiness: 7/10** — Structure is solid, textual goal/exit data is missing per level.

---

## 2. Global vs Academy Curriculum Separation

### Architecture
```
Global Spine (platform-owned)
├── curriculum_stages (5 rows) — immutable by directors
├── curriculum_levels (15 rows) — immutable by directors
├── curriculum_gates (57 rows) — immutable by directors
└── curriculum_content_items (92 rows, source_type='global_default') — immutable

Academy Layer (director-controlled)
├── academy_curriculum_versions — version header
│   ├── status: draft | active
│   ├── base_curriculum_version_id → global spine reference
│   └── version_number, cloned_from_global_at
└── academy_curriculum_overrides — per-item change records
    ├── target_type, target_id → which global item is being overridden
    ├── override_type, scope, pathway
    ├── proposed_change (JSON) — what the director wants to change
    ├── applied_change (JSON) — what was actually applied
    ├── original_snapshot (JSON) — what the global value was before override
    ├── rollback_of_override_id → supports rollback
    ├── source — where the override came from
    └── status: proposed | approved | applied | rolled_back
```

**Key finding**: `academy_curriculum_overrides.rollback_of_override_id` provides rollback support. `original_snapshot` preserves the pre-override state. **This table is the right destination for approved curriculum import merge decisions.**

**Academy curriculum version status**: 0 rows in `academy_curriculum_versions` — no academy has activated a version. The override architecture exists but is unused.

**Separation readiness: 8/10** — Architecture is clean and well-designed. No academy has activated it yet.

---

## 3. Where Uploaded Curriculum Would Attach

Approved import decisions would become `academy_curriculum_overrides` rows, scoped to a specific `academy_curriculum_versions.id`. The `source` field could be set to `'import'` or `'partner_pack'` to distinguish from DONNA-drafted changes.

However, no import pipeline exists to get content into the override table.

---

## 4. Knowledge Library — Current State

The entire knowledge library is **TypeScript-only** — no DB backing.

### TypeScript modules that exist (pure, no DB)
| Module | Purpose |
|---|---|
| `knowledgeTypes.ts` | `KnowledgeItem`, `KnowledgeStatus`, `KnowledgeReviewDecision` types |
| `knowledgeIngestionTypes.ts` | `IngestionPayload`, `IngestionStatus`, `IngestionMethod` types |
| `knowledgeIngestionClassifier.ts` | Deterministic domain + source type inference from text |
| `knowledgeSimilarityDetector.ts` | Token overlap scoring, suspected duplicate detection |
| `knowledgeCurriculumBridge.ts` | Maps approved `KnowledgeItem` to curriculum draft |
| `knowledgeCurriculumIntelligence.ts` | Matches knowledge items to curriculum gaps |
| `knowledgeLibrary.ts` | Library view model builder |
| `knowledgeReviewQueue.ts` | Review queue model |
| `knowledgeDonnaInterface.ts` | DONNA actions for the knowledge library |
| `knowledgePrivacyGuards.ts` | Privacy guards for knowledge content |

### DB tables — NOT in live DB
```
knowledge_items      ❌ DOES NOT EXIST (DB returns PGRST205 error)
knowledge_ingestion  ❌ DOES NOT EXIST
```

The knowledge library is a well-designed TypeScript specification with no database implementation. This is the single most important blocker for the curriculum import pipeline, because the import system needs to store extracted items before they are reviewed.

---

## 5. Curriculum Import Pipeline — Gap Analysis

### The 10-step import model vs current state

| Step | Target | Current State | Gap |
|---|---|---|---|
| 1. Upload curriculum | PDF/Doc/CSV/URL/text/voice | Audio upload only (`/api/coach/sessions/.../transcribe`) | No document upload endpoint |
| 2. Parse into objects | Drills, gates, levels, goals | Ingestion types exist in TS. No parser. | Document parsing engine missing |
| 3. Map to spine | Each item → AcademyOS level/domain | No spine mapping algorithm | Spine mapper missing |
| 4. Classify each item | Exact/Similar/New/Conflict/Missing/Unclear | `knowledgeSimilarityDetector` (text overlap only) | Curriculum-specific classifier missing |
| 5. Recommend actions | Keep/Add/Merge/Override/Hide/Reject | No recommendation engine | Recommendation engine missing |
| 6. Director review | Item-by-item review UI | No import review UI | Import review surface missing |
| 7. Approve decisions | Per-item approval | `proposed_actions` + `academy_curriculum_overrides` | ✅ **REUSABLE** |
| 8. Apply approved changes | Write to academy override layer | `execute_approved_action()` (partial coverage) | Override application exists |
| 9. Version tracking | Audit trail, rollback | `academy_curriculum_overrides.rollback_of_override_id` | ✅ **REUSABLE** |
| 10. Protect global spine | Never auto-modify global content | `CurriculumEditPermissionGuard` | ✅ **WORKS** |

---

## 6. Component-by-Component Readiness Ratings

| Component | Rating | Status | Notes |
|---|---|---|---|
| **Curriculum spine** | 7/10 | Partial | 15 levels, 57 gates, 92 content items; missing level text fields |
| **Global vs academy separation** | 8/10 | Good | Clean override architecture, 0 active versions |
| **Curriculum data model clarity** | 7/10 | Partial | Missing level_description, exit_player_profile |
| **Upload source support** | 2/10 | Missing | Audio only; no PDF/CSV/URL/paste endpoint |
| **Document parsing** | 1/10 | Missing | No PDF/Word/CSV parser |
| **Text intake (paste/voice)** | 4/10 | Partial | Voice-to-text exists; no structured extraction for curriculum |
| **Ingestion type system** | 6/10 | Partial | TS types + classifier exist; no DB tables |
| **DONNA curriculum structuring** | 4/10 | Partial | God Mode LLM could extract, but no dedicated pipeline |
| **Spine mapping** | 1/10 | Missing | No mapping algorithm or table |
| **Similarity / overlap detection** | 4/10 | Partial | `knowledgeSimilarityDetector` works for text; not adapted for curriculum |
| **Conflict detection** | 1/10 | Missing | No conflict classifier |
| **Missing content detection** | 4/10 | Partial | Gap analysis exists; not framed for import comparison |
| **Merge review UX** | 1/10 | Missing | No import comparison UI |
| **Approval / versioning pipeline** | 7/10 | Good | `proposed_actions` + `academy_curriculum_overrides` reusable |
| **Permission safety** | 8/10 | Good | Global spine protected, guard components exist |
| **Parent/player visibility safety** | 8/10 | Good | `is_parent_visible`, `is_player_visible` flags on content items |
| **Partner/federation pack architecture** | 1/10 | Missing | No partner pack concept |
| **Rollback support** | 7/10 | Good | `rollback_of_override_id` + `original_snapshot` in overrides |
| **Knowledge library DB backing** | 1/10 | Missing | Entire knowledge library is TypeScript-only; no DB |
| **Overall 10/10 model** | **3/10** | Early | Foundation solid; pipeline stages 1-6 are missing |

---

## 7. Already Built

| Item | Location |
|---|---|
| Core curriculum spine (15 levels, 57 gates) | DB: `curriculum_levels`, `curriculum_gates` |
| 92 curriculum content items | DB: `curriculum_content_items` |
| Academy override architecture | DB: `academy_curriculum_overrides`, `academy_curriculum_versions` |
| Override rollback + snapshot | DB: `academy_curriculum_overrides.rollback_of_override_id`, `original_snapshot` |
| Approval pipeline | DB: `proposed_actions`, `execute_approved_action()` RPC |
| Permission guards | `CurriculumEditPermissionGuard`, RLS policies |
| Ingestion type system (TS) | `knowledgeIngestionTypes.ts`, `knowledgeIngestionClassifier.ts` |
| Similarity detector (TS) | `knowledgeSimilarityDetector.ts` (token overlap, tag overlap) |
| Knowledge→curriculum bridge (TS) | `knowledgeCurriculumBridge.ts` |
| Gap analysis engine (TS) | `gapAnalysis.ts`, `knowledgeCurriculumIntelligence.ts` |
| Content safety patterns | `INGESTION_CONTENT_SAFETY_PATTERNS` |
| DONNA level descriptions (static) | `curriculumLevelDonnaAnswer.ts` |
| `import_existing` source option | `CURRICULUM_SOURCE_OPTIONS` in `curriculumSetupTypes.ts` |
| Parent/player visibility flags | `is_parent_visible`, `is_player_visible` on `curriculum_content_items` |
| Audit log concepts | `knowledgeAuditLog.ts` (TS only) |

---

## 8. Partially Built

| Item | Status | Gap |
|---|---|---|
| Knowledge ingestion (TS types) | TS model complete; no DB | Need `knowledge_items`, `knowledge_ingestion_jobs` tables |
| Voice-to-text intake | Works for wrap-up notes; not for curriculum items | No curriculum extraction from voice |
| DONNA curriculum answering | Static text answers; no live import comparison | Needs import-aware query paths |
| Gap analysis | TS engine exists; not framed for import comparison | Import-specific gap detection layer needed |
| Coverage model | TS engine works on live data; doesn't see import data | Import pipeline needs to feed coverage model |
| `CURRICULUM_SOURCE_OPTIONS` includes `import_existing` | Option surfaced in onboarding; not implemented | The actual import flow after "import existing" is missing |

---

## 9. Missing — Can Be Added Without Schema Changes

| Item | Notes |
|---|---|
| `CURRICULUM_ITEM_SIMILARITY_MAP` TypeScript helper | Adapt `knowledgeSimilarityDetector` for curriculum-to-curriculum comparison |
| Text-paste intake endpoint | Accept plain text, send to DONNA for extraction (no file parsing) |
| DONNA curriculum extraction prompt | System prompt to extract drills/gates/goals from pasted text |
| Static import classification labels | `IMPORT_CLASSIFICATION_LABELS` constant for UI display |
| Gap-based missing content detector for import | Extend `gapAnalysis.ts` to take import items as input |

---

## 10. Missing — Requires New Schema

| Table | Purpose | Priority |
|---|---|---|
| `knowledge_items` | Persistent knowledge library (currently TS-only) | **P0** — prerequisite for all import staging |
| `curriculum_sources` | Track import origin: name, type, trust score, attribution | P1 |
| `curriculum_import_jobs` | Track import process state, original content, parsing status | P1 |
| `curriculum_extracted_items` | Store parsed curriculum objects pre-review | P1 |
| `curriculum_spine_matches` | Store item → level/gate/domain mapping results | P2 |
| `curriculum_merge_decisions` | Director per-item decisions: keep/add/merge/hide/reject | P2 (or reuse `academy_curriculum_overrides`) |
| `curriculum_import_audit_log` | Audit trail for import events | P3 |

**Note**: `curriculum_merge_decisions` may not need a new table. The `academy_curriculum_overrides` table already has `source`, `proposed_change`, `approved_by`, `status`, `original_snapshot` fields. It could serve double duty as merge decision storage if the `source = 'import'` and `override_type` values are defined clearly.

---

## 11. Future / V2 Only

| Item | Why V2 |
|---|---|
| PDF document parsing | Requires PDF extraction library (pdfjs, Apache Tika, etc.) — new dependency |
| Word/DOCX parsing | Same — document parsing library |
| URL metadata scraping | Copyright risk, ToS compliance needed |
| AI-powered semantic similarity | Current detector is token overlap only; AI semantic would be more accurate |
| Partner/federation pack format | Needs external stakeholder agreements first |
| Live ITF/USTA curriculum sync | Requires external API partnerships |
| Multi-academy spine merge (platform owner) | Different scope — platform owner, not director |
| Curriculum IP ownership tracking | Legal/licensing layer needed |

---

## 12. Risky — Should NOT Be Built Yet

| Item | Risk |
|---|---|
| Auto-applying import changes without director review | Violates core AI safety contract |
| Modifying global spine from import | Must never happen; would affect all academies |
| Storing full copyrighted curriculum text | Copyright violation risk |
| Parent/player exposure of imported items before approval | Must go through review-first pipeline |
| Importing player names or personal data embedded in curriculum docs | PII risk |

---

## 13. Recommended Backend Model

### Tables needed (priority order)

**P0 — prerequisite**:
```sql
CREATE TABLE knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT,
  source_type TEXT NOT NULL,   -- research_paper | coaching_manual | import | etc.
  domain TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'pending_review',  -- pending | approved | promoted | rejected
  access_level TEXT NOT NULL DEFAULT 'director_only',
  is_parent_answerable BOOLEAN NOT NULL DEFAULT false,
  is_player_answerable BOOLEAN NOT NULL DEFAULT false,
  submitted_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: academy_id scoped + platform_owner can see all
```

**P1 — import pipeline**:
```sql
CREATE TABLE curriculum_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id),
  source_name TEXT NOT NULL,       -- "Dabul Academy Curriculum 2024"
  source_type TEXT NOT NULL,       -- text_paste | file_upload | url | voice
  raw_content TEXT,                -- original pasted text (truncated for large files)
  file_storage_path TEXT,          -- Supabase Storage path if file upload
  status TEXT NOT NULL DEFAULT 'processing',  -- processing | extracted | mapped | reviewed | applied | cancelled
  item_count INT,
  mapped_count INT,
  approved_count INT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE curriculum_extracted_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id UUID NOT NULL REFERENCES curriculum_import_jobs(id),
  academy_id UUID NOT NULL REFERENCES academies(id),
  raw_title TEXT NOT NULL,
  raw_description TEXT,
  raw_domain TEXT,                 -- as extracted from source
  inferred_content_type TEXT,      -- drill | gate | goal | coach_cue | assessment
  inferred_domain TEXT,            -- Technical | Tactical | etc.
  mapped_level_id UUID REFERENCES curriculum_levels(id),
  mapping_confidence TEXT,         -- high | medium | low | unmapped
  classification TEXT,             -- exact_match | similar | new_addition | conflict | aca_missing | unclear
  similar_item_id UUID,            -- references curriculum_content_items or curriculum_gates
  similarity_score NUMERIC(4,3),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**P2 — merge decisions** (or reuse `academy_curriculum_overrides`):
```sql
-- Option A: New table
CREATE TABLE curriculum_merge_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id UUID NOT NULL REFERENCES curriculum_import_jobs(id),
  extracted_item_id UUID NOT NULL REFERENCES curriculum_extracted_items(id),
  decision TEXT NOT NULL,          -- keep_aca | add_import | merge | use_import_override | hide_aca | reject
  reviewer_notes TEXT,
  decided_by UUID REFERENCES profiles(id),
  decided_at TIMESTAMPTZ,
  resulting_override_id UUID REFERENCES academy_curriculum_overrides(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Option B: Reuse academy_curriculum_overrides with source = 'import' and pathway = job_id
-- (simpler, no new table, already has rollback support)
```

---

## 14. Recommended UX Model — Director Import Flow

```
Step 1 — Upload / Paste
  Director opens: Curriculum → Import
  Options: Paste text | Upload file (future) | Add URL (future)
  DONNA note: "I'll organize this into our curriculum spine. Nothing changes until you approve."

Step 2 — DONNA Extraction (background)
  DONNA parses content → extracts items → stores in curriculum_extracted_items
  Classification: Exact Match / Similar / New / Conflict / AcademyOS-Only / Unclear
  Status: processing → extracted

Step 3 — Comparison Summary
  Director sees:
  - [X] Exact matches with AcademyOS spine
  - [Y] Similar content (possible overlap)
  - [Z] New items not in spine
  - [W] Conflicts with existing content
  - [V] AcademyOS recommended content your upload doesn't include
  - [U] Items that need clarification

Step 4 — Review by Category (or by level)
  Director reviews each item:
  - Keep AcademyOS content (default)
  - Add uploaded item (becomes new academy content item)
  - Merge wording (propose a text blend for director edit)
  - Use uploaded version as academy override
  - Hide/defer AcademyOS item for this academy
  - Reject uploaded item

Step 5 — Approve Decisions
  "Approve selected decisions" → creates academy_curriculum_overrides rows
  Nothing applies to the spine yet — goes to director review queue

Step 6 — Publish Layer (optional batch apply)
  Director clicks "Apply approved import" → apply_curriculum_import_batch()
  Each approved item becomes an applied override in the academy layer
  Rollback available per item via existing rollback mechanism
```

---

## 15. Readiness Matrix

| Feature | Current Status | Existing Files/Tables | Gap | Risk | Rec Sprint | Priority |
|---|---|---|---|---|---|---|
| Core curriculum spine | ✅ Built | `curriculum_levels`, `curriculum_gates`, 15+57 rows | Missing level text fields | Low | 1095B (insight) | P0 done |
| Academy override layer | ✅ Built | `academy_curriculum_overrides`, `academy_curriculum_versions` | 0 active versions | Low | No sprint needed | P0 done |
| Knowledge library DB | ❌ Missing | `knowledgeTypes.ts` (TS only) | `knowledge_items` table | Blocking import staging | 1096A | P0 |
| Text/paste intake | ⚠️ Partial | `IngestionPayload` TS type; no endpoint | API endpoint + DB insert | Low | 1096B | P1 |
| DONNA extraction engine | ⚠️ Partial | God Mode LLM; `knowledgeIngestionClassifier.ts` | Curriculum-specific extraction prompt | Medium | 1096C | P1 |
| Spine mapping | ❌ Missing | None | Algorithm + `curriculum_spine_matches` table | Medium | 1097A | P1 |
| Similarity/overlap detection | ⚠️ Partial | `knowledgeSimilarityDetector.ts` | Adapt for curriculum; add to extraction pipeline | Low | 1097A | P1 |
| Conflict classification | ❌ Missing | None | Classification engine + labels | Low | 1097A | P1 |
| Missing content detection | ⚠️ Partial | `gapAnalysis.ts` | Adapt for import comparison context | Low | 1097A | P1 |
| Import job tracking | ❌ Missing | None | `curriculum_import_jobs` table | Low | 1096A | P1 |
| Extracted items storage | ❌ Missing | None | `curriculum_extracted_items` table | Low | 1096A | P1 |
| Merge decision storage | ❌ Missing | Reuse `academy_curriculum_overrides`? | Decide architecture | Medium | 1097B | P2 |
| Director merge review UX | ❌ Missing | None | New route + UI | Medium | 1097B | P2 |
| Approval pipeline reuse | ✅ Built | `proposed_actions`, `execute_approved_action()` | Wire import decisions → override applications | Low | 1097C | P2 |
| File upload (PDF/CSV) | ❌ Missing | Audio upload only | New upload endpoint + parser | High (copyright) | 1098+ | P3/V2 |
| Partner pack architecture | ❌ Missing | None | External stakeholder agreements + schema | Very High | V2 | P4 |

---

## 16. Recommended Sprint Sequence (10 sprints to 10/10)

| Sprint | Goal |
|---|---|
| **1095B** | Curriculum Director Insight View (already planned — improve existing UX) |
| **1096A** | Knowledge Library DB foundations: `knowledge_items` + `curriculum_import_jobs` + `curriculum_extracted_items` tables + RLS |
| **1096B** | Text/paste curriculum intake: API endpoint → DONNA extraction → store as extracted_items |
| **1096C** | DONNA curriculum extraction engine: prompt + structured output + validation against spine |
| **1097A** | Spine mapping + classification: match extracted_items to spine levels/gates, classify each (exact/similar/new/conflict) |
| **1097B** | Missing content detection: identify AcademyOS recommended items absent from upload |
| **1097C** | Director import review UX: comparison summary + item-by-item review + merge decision UI |
| **1097D** | Merge decision approval: wire director decisions → `academy_curriculum_overrides` via approval pipeline |
| **1098A** | Rollback + audit: per-item rollback from import, import audit log, import history view |
| **1099A** | File upload support: PDF/CSV/URL (requires dependency decision + copyright policy) |

---

## 17. What Should NOT Be Built Yet

| Item | Reason |
|---|---|
| PDF/document parsing | New dependency, copyright risk — needs legal policy first |
| Partner/federation pack architecture | External stakeholder agreements required |
| Auto-applying import without review | Core safety violation |
| Modifying global spine from import | Would affect all academies — architectural no |
| Player/parent exposure of import items | Must go through review-first pipeline |
| Full-text copyrighted curriculum storage | Copyright risk |
| Live external curriculum sync (ITF/USTA) | API partnership required |

---

## Specific Audit Question Answers

| Question | Answer |
|---|---|
| Curriculum source/import table? | ❌ Does not exist |
| Extracted curriculum object storage? | ❌ Does not exist |
| Spine mapping storage? | ❌ Does not exist |
| Merge decision storage? | ❌ But `academy_curriculum_overrides` is reusable |
| Academy override/versioning? | ✅ Exists, fully designed, 0 active rows |
| Approval/review infrastructure reusable? | ✅ `proposed_actions` + `execute_approved_action()` |
| File upload support? | ❌ Audio only |
| PDF/doc/CSV/link/video support? | ❌ None |
| Voice/text intake? | ⚠️ Voice→text exists; no curriculum extraction |
| DONNA can parse curriculum text? | ⚠️ God Mode LLM could; no dedicated pipeline |
| DONNA can compare against spine? | ⚠️ Gap analysis exists; no import-specific comparison |
| DONNA can detect overlap/conflict? | ❌ Similarity detector exists in TS but not adapted |
| Director can review merge map? | ❌ No UI |
| Approved import → academy changes? | ⚠️ Pipeline exists; import-to-override wire is missing |
| Preserve AcademyOS unreferenced content? | ⚠️ Logically yes; no missing-content detector for import |
| Director can hide/defer AcademyOS content? | ⚠️ Override mechanism supports it; no UX for it |
