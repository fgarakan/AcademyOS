# Sprint 897 — AcademyOS Documentation Information Architecture Audit V1

**Date:** 2026-05-27
**Sprint:** 897
**Type:** Audit — documentation ecosystem inventory, information architecture design, canonical-authority definition
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no code changes)
**Status:** ✅ COMPLETE — full inventory, category classification, authority levels, hierarchy recommendation
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Pre-migration documentation hygiene — define canonical structure before adding new standards docs

---

## Executive Summary

The AcademyOS documentation ecosystem contains **784 markdown files** across 6 zones. Documentation
scale has crossed the threshold where AI context drift, duplicate governance, and stale-spec
contamination become real risks. This audit defines canonical authority, identifies noise sources,
and recommends a controlled information architecture for the next phase of the build.

**Critical finding:** The docs/ directory is a flat 676-file sprint log masquerading as a standards
system. The 5 actual canonical standard docs (`AI_BACKEND_RULES.md`, `CURRENT_BUILD_TARGET.md`,
`LOCKED_MODULES.md`, `KNOWN_LIMITATIONS.md`, `MODULE_BUILD_PROCESS.md`) are indistinguishable from
sprint logs by filename alone. This is the primary context-drift risk.

---

## Section 1 — Total Inventory

| Zone | Location | File count | Status |
|---|---|---|---|
| Main standards + sprint docs | `docs/*.md` (flat) | 676 | Active — all categories mixed |
| Subdirectory architecture docs | `docs/conversational-os/`, `docs/curriculum/`, `docs/player-development/`, `docs/templates/`, `docs/visual-system/` | 35 | Semi-active — early architecture layer |
| Root-level specs | `/*.md` root (9 files) | 9 | Untracked — mostly stale |
| Pre-app planning artifacts | `Academy_OS_Master_Build/` | 48 | Stale — explicitly called out in CLAUDE.md |
| Operational commands/agents | `.claude/commands/`, `.claude/agents/`, `.claude/skills/` | 16 | Active operational — load at runtime |
| Prototype reference | `prototype-reference/` | 0 md files | N/A |
| **TOTAL** | | **784** | |

---

## Section 2 — Category Inventory by Zone

### 2.1 — Zone A: `docs/*.md` — 676 Files (Main Working Zone)

#### 2.1.1 — Session-Load Standards (Canonical, Authority Level: ABSOLUTE)

These 5 documents are loaded in every session per `CLAUDE.md`. They are the non-negotiable
rules of the system. They must be treated as the **highest-authority documents in the repo**.

| File | Purpose | Authority | Load in context? |
|---|---|---|---|
| `docs/AI_BACKEND_RULES.md` | Backend safety rules — Supabase call patterns, RLS, service role, migration guardrails | ABSOLUTE | ✅ Always |
| `docs/CURRENT_BUILD_TARGET.md` | What is being built right now and in what order | ABSOLUTE | ✅ Always |
| `docs/LOCKED_MODULES.md` | What files cannot be touched; what is in progress | ABSOLUTE | ✅ Always |
| `docs/KNOWN_LIMITATIONS.md` | Current gaps, broken/incomplete things | ABSOLUTE | ✅ Always |
| `docs/MODULE_BUILD_PROCESS.md` | Required process for every build task | ABSOLUTE | ✅ Always |

**Risk:** These 5 files are visually indistinguishable from 671 other docs/ files. Filename alone
does not signal canonical status. Future mitigation: a `/docs/standards/` subfolder.

---

#### 2.1.2 — Operational Support Standards (High Authority, Maintained)

| File | Purpose | Authority | Load in context? |
|---|---|---|---|
| `docs/CHANGELOG.md` | Rolling sprint changelog — all merged sprints | HIGH — living record | Per-sprint (for entry) |
| `docs/CLAUDE_CODE_OPERATING_SYSTEM.md` | Claude Code setup guide — commands, agents, skills | HIGH — session setup | Reference only |
| `docs/ACADEMY_INTERFACE_QUALITY_STANDARD.md` | UI/UX quality standard | HIGH — design authority | Reference for UI sprints |
| `docs/AGENT_GUARDRAILS.md` | Agent safety rules | HIGH | Reference for agent use |
| `docs/AGENT_ASSIGNMENTS.md` | Agent role assignments | HIGH | Reference for agent use |
| `docs/ENGINEERING_MODULE_REGISTRY.md` | Module registry | MEDIUM | Reference |
| `docs/ENGINEERING_UPDATE_PROTOCOL.md` | Engineering update process | MEDIUM | Reference |
| `docs/QA_GATE.md` | QA requirements and results | MEDIUM | Per-QA sprint |

---

#### 2.1.3 — DONNA Sprint Docs (179 files, Sprint-Historical)

All files with `DONNA_` prefix. These are **sprint execution records** — not canonical standards.
They document what was built in each sprint and should be treated as historical once their sprint
is committed.

**Naming pattern:** `DONNA_FEATURE_DESCRIPTION_NNN.md` (where NNN = sprint number)

| Range | Count | Status |
|---|---|---|
| Early DONNA work (no number suffix) | ~30 | Historical — architecture decisions baked into code |
| Sprint 600s–700s era | ~45 | Historical — shipped features |
| Sprint 800–891 era | ~80 | Historical (sprint committed) |
| Sprint 892–896 era (recent) | ~24 | Historical — Mega Sprint 858–920 DONNA track, current |

**Context-load policy:** Do NOT load DONNA sprint docs into general context. Load only the most recent
sprint doc for the active feature track (e.g., current normalizer sprint doc when working on normalizer).

**High-value DONNA reference docs** (not sprint-specific, should be preserved as reference):
- `docs/DONNA_CONVERSATIONAL_QUALITY_STANDARD.md` — quality benchmark
- `docs/DONNA_UNIVERSAL_DIRECTOR_ACTION_REGISTRY.md` — action registry
- `docs/DONNA_SCREEN_CAPABILITY_MAP.md` — page capability map
- `docs/DONNA_DIRECTOR_COVERAGE_MATRIX.md` — intent coverage matrix
- `docs/DONNA_ACTION_SAFETY_CLASSES.md` — safety classification
- `docs/DONNA_CONVERSATIONAL_DEPTH_785.md` — first principles conversation doc (high value despite number suffix)
- `docs/DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_V2_891.md` — current certified resolver state
- `docs/DONNA_NORMALIZER_FINAL_AUDIT_894.md` — current certified normalizer state

---

#### 2.1.4 — QA / Certification / Audit Docs (235 files, Sprint-Historical)

The largest single category. These document QA results and certification passes at specific sprint
numbers. Once a feature ships, its QA doc is historical.

**Naming patterns:**
- `FEATURE_QA_NNN.md` — QA for a specific feature at sprint N
- `FEATURE_AUDIT_NNN.md` — audit at sprint N
- `FEATURE_CERTIFICATION_NNN.md` — certification at sprint N
- `AIQS_FEATURE_NNN.md` — Academy Interface Quality Standard audit at sprint N

**Context-load policy:** Never load QA/certification docs into general context. Load only when
actively QA-ing that specific feature (e.g., `DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_V2_891.md`
when working on the resolver).

**Known overlap risk:** Multiple QA docs exist for the same feature at different sprint numbers
(e.g., `DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_886.md` and `_V2_891.md`). Only the highest-
numbered version is authoritative. Earlier versions are superseded.

---

#### 2.1.5 — Architecture Docs (32 files, Mixed)

These describe system design decisions — some are still current, some are historical.

**Current-relevant architecture docs:**
- `docs/ACADEMY_ONBOARDING_ARCHITECTURE.md`
- `docs/ACADEMY_CURRICULUM_RESOLUTION_ENGINE.md`
- `docs/ACADEMY_CURRICULUM_CLONE_ARCHITECTURE.md`
- `docs/ADAPTIVE_SESSION_PLANNING_ARCHITECTURE.md`
- `docs/AI_SUGGESTION_REVIEW_ENGINE_ARCHITECTURE.md`
- `docs/COO_LIVE_DATA_WIRING_MAP.md`
- `docs/CURRICULUM_INFORMATION_ARCHITECTURE.md`
- `docs/CURRICULUM_RIPPLE_ARCHITECTURE.md`
- `docs/DEMO_SANDBOX_ARCHITECTURE.md`
- `docs/DONNA_CONVERSATION_ARCHITECTURE.md`
- `docs/DONNA_GUIDED_NAVIGATION_HIGHLIGHT_ARCHITECTURE_816.md`
- `docs/PLAYER_ASSESSMENT_ARCHITECTURE.md`
- `docs/REVIEW_EXECUTION_ADAPTER_ARCHITECTURE.md`

**Historical/superseded architecture docs (candidates for archive):**
- `docs/DONNA_GODMODE_FOUNDATION_ARCHITECTURE_742A.md` — early godmode concept; architecture evolved
- `docs/DONNA_MODULARIZATION_MAP.md` — early modularization concept
- `docs/DONNA_MULTI_TURN_TASK_FLOWS.md` — superseded by actual conversation architecture

---

#### 2.1.6 — Demo / Pilot / Script Docs (57 files, Reference)

These are for demos, pilot launches, and walk-through scripts. They reference real product behavior
but do not govern code. They are generally safe — low context-noise risk for code sprints.

**Examples:**
- `BRIAN_*` — named-demo scripts for Brian (pilot director persona)
- `PILOT_*` — pilot readiness and launch docs
- `*_DEMO_SCRIPT.md` — demo scripts

**Context-load policy:** Never load into sprint context unless the sprint is explicitly about
demo polish or pilot prep.

---

#### 2.1.7 — SPRINT_NNN_ Numbered Docs (25 files, Early Sprint Format)

Early sprint format: `SPRINT_NNN_DESCRIPTION.md` (sprints 379–398).
Later sprint format: `FEATURE_DESCRIPTION_NNN.md`.

These are historical sprint records. The feature-description-first naming used from Sprint ~400
onward is clearly superior for searchability and pattern-matching.

**Recommendation:** The SPRINT_NNN_ format should be formally deprecated. Future sprint docs
should use `FEATURE_DESCRIPTION_NNN.md`.

---

#### 2.1.8 — CHANGELOG.md (Living Record)

The single rolling changelog. Maintained by convention at the top of each sprint.
**Authority:** AUTHORITATIVE record of what shipped. Do not use as a source-of-truth for
current code state (use actual files), but use as authoritative for sprint sequence and history.

---

#### 2.1.9 — Miscellaneous Maintenance Docs

| File | Purpose | Status |
|---|---|---|
| `docs/SPRINT_BOARD.md` | Sprint board — last updated Sprint 397 | STALE — do not load |
| `docs/NEXT_SPRINT_RECOMMENDATION.md` | Sprint 397 recommendation | STALE — do not load |
| `docs/MERGE_QUEUE.md` | Merge queue tracking | Status unknown |
| `docs/NO_COAUTHOR_COMMIT_AUDIT_727.md` | Commit hygiene audit | Historical |
| `docs/NO_MIGRATION_DRIFT_AUDIT_726.md` | Migration drift audit | Historical |
| `docs/NO_LEVEL_MOVEMENT_AUDIT_724.md` | Level movement audit | Historical |
| `docs/NO_PARENT_SENDS_AUDIT_723.md` | Parent data safety audit | Historical |
| `docs/NO_ROSTER_MUTATION_AUDIT_725.md` | Roster mutation audit | Historical |

---

### 2.2 — Zone B: `docs/` Subdirectories (35 files)

These are early-generation architecture docs with a different naming convention (lowercase, hyphenated).
They predate the sprint-numbered convention.

| Subdirectory | Files | Content | Status |
|---|---|---|---|
| `docs/conversational-os/` | 6 | Voice intake architecture, parent-safe rules, guardrails, master plan | Partially current (voice-intake-architecture.md is referenced in LOCKED_MODULES.md as canonical) |
| `docs/curriculum/` | 10 | Curriculum data model, research, seed files | Mixed — some active (curriculum-learning-module-model.md), some research-only |
| `docs/player-development/` | 5 | Player development architecture | Status unknown — needs review |
| `docs/templates/` | 3 | Template version history, session plans | Status unknown — needs review |
| `docs/visual-system/` | 10 | Visual system standards | Partially current |

**Locked reference docs in conversational-os/ per LOCKED_MODULES.md:**
- `docs/conversational-os/conversational-os-master-plan.md` — LOCKED, update only on architecture change
- `docs/conversational-os/voice-intake-architecture.md` — LOCKED, North Star for voice architecture

---

### 2.3 — Zone C: Root-Level `.md` Files (9 files, Untracked)

All 9 root-level `.md` files are **untracked** in git. Most are planning/spec artifacts that predate
the current build.

| File | Purpose | Recommendation |
|---|---|---|
| `CLAUDE.md` | Master session entry — loaded automatically by Claude Code | ✅ TRACKED — canonical, highest priority |
| `BUILD_ORDER.md` | Pre-app build order | Review — may duplicate `CURRENT_BUILD_TARGET.md`; stale candidate |
| `DATA_FLOW_MAP.md` | Data flow diagram | Inspect next — possible architecture reference value |
| `MULTI_TENANT_SECURITY_AUDIT.md` | Multi-tenant security | Inspect next — may have value beyond `AI_BACKEND_RULES.md` |
| `PLAYER_PROFILE_SPEC.md` | Player profile spec | Inspect next — check alignment with `docs/PLAYER_ASSESSMENT_ARCHITECTURE.md` |
| `PRODUCT_BLUEPRINT.md` | Product blueprint | Archive candidate — superseded by implemented app |
| `README_BACKEND.md` | Backend README | Inspect next — could become `docs/BACKEND_README.md` |
| `ROLE_CONNECTION_MAP.md` | Role connection map | Inspect next — alignment with current role model |
| `UI_SCREEN_MAP.md` | UI screen map | Inspect next — alignment with current route structure |

---

### 2.4 — Zone D: `Academy_OS_Master_Build/` (48 files, Stale)

Pre-app planning artifacts. **Explicitly excluded from context authority in CLAUDE.md:**
> "Do not treat `Academy_OS_Master_Build/generated/` docs as current truth. Those were written
> before the app existed and are stale. Verify against actual files."

| Subdirectory | Files | Content | Status |
|---|---|---|---|
| `Academy_OS_Master_Build/` root | 5 | Master org, build order, package index | STALE — superseded |
| `generated/` | 5 | Acceptance report, inventories, risk register | STALE — pre-app generated |
| `packages/01–10/` | ~38 | Product vision, DB schema, voice arch, placement, player profile, sessions, coach notes, UI specs, AI prompts, roadmap | STALE — written before app existed |

**Action:** Never load into sprint context. Future archive candidate.

---

### 2.5 — Zone E: `.claude/` Operational Files (16 files, Active)

These are operational runtime files — not documentation. They are loaded by Claude Code at runtime.

| Category | Files | Purpose | Authority |
|---|---|---|---|
| `commands/` | 5 | Sprint protocols: academy-sprint, guardrails, supabase-sprint, review-queue-workflow, voice-workflow | OPERATIONAL — active |
| `agents/` | 2 | schema-auditor, guardrail-auditor | OPERATIONAL — active |
| `skills/` | 9 | Guard skills for role, DONNA, curriculum, pilot, etc. | OPERATIONAL — active |

**These are not documentation — they are executable tools.** They should not be counted in the doc
ecosystem and should never be modified as part of a documentation sprint.

---

## Section 3 — Overlapping / Duplicate Docs

| Overlap | Files | Risk | Resolution |
|---|---|---|---|
| DONNA follow-up resolver audit (two versions) | `DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_886.md` and `DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_V2_891.md` | Medium — V1 is superseded; loading both creates conflicting info | V2_891 is canonical. V1_886 is archive candidate. |
| Multiple DONNA context/certification docs | `DONNA_10_10_CERTIFICATION_790.md`, `DONNA_DASHBOARD_10_10_CERTIFICATION_805.md`, etc. | Low — different scope per doc | Each covers a different surface. Low risk, but naming could be clearer. |
| Root BUILD_ORDER.md vs docs/CURRENT_BUILD_TARGET.md | `BUILD_ORDER.md` (root), `docs/CURRENT_BUILD_TARGET.md` | HIGH — root file is untracked/stale; could override if loaded | `CURRENT_BUILD_TARGET.md` is canonical. `BUILD_ORDER.md` is stale archive candidate. |
| Root PLAYER_PROFILE_SPEC.md vs docs/PLAYER_ASSESSMENT_ARCHITECTURE.md | Both cover player data model | Medium | Inspect and reconcile in future sprint |
| SPRINT_BOARD.md vs CURRENT_BUILD_TARGET.md | Sprint board is stale (Sprint 397); CURRENT_BUILD_TARGET.md is live | HIGH | Never load SPRINT_BOARD.md |
| Multiple CURRICULUM_BUILDER audit docs at different sprint numbers | `CURRICULUM_BUILDER_V1_COMPLETION_AUDIT_798.md` and `CURRICULUM_BUILDER_V1_COMPLETION_AUDIT_915.md` | Medium | 915 supersedes 798 |

---

## Section 4 — Stale Planning / Spec Artifacts — Do Not Load

The following should NEVER be loaded into sprint context. They predate the current app or describe
a version that no longer exists.

| File / Zone | Reason | Action |
|---|---|---|
| `Academy_OS_Master_Build/` (entire zone) | Pre-app planning; CLAUDE.md explicitly excludes generated/ | Never load; future archive |
| `Academy_OS_Master_Build/packages/08_UI_UX_WIREFRAMES/DESIGN_SYSTEM.md` | CLAUDE.md explicitly states: "Do not use the colors in this file" | Actively harmful to load |
| `docs/SPRINT_BOARD.md` | Stale — Sprint 397; does not reflect current sprint track | Never load |
| `docs/NEXT_SPRINT_RECOMMENDATION.md` | Stale — Sprint 397 recommendation | Never load |
| `BUILD_ORDER.md` (root) | Superseded by `docs/CURRENT_BUILD_TARGET.md` | Archive candidate |
| `PRODUCT_BLUEPRINT.md` (root) | Pre-app blueprint; app architecture is the truth | Archive candidate |
| `docs/DONNA_MODULARIZATION_MAP.md` | Early concept; superseded by actual DONNA architecture | Historical |
| `docs/DONNA_MULTI_TURN_TASK_FLOWS.md` | Early concept; actual implementation is authoritative | Historical |
| `docs/DONNA_GODMODE_FOUNDATION_ARCHITECTURE_742A.md` | "Godmode" concept evolved into actual DONNA COO | Historical |
| `Academy_OS_Master_Build/packages/09_AI_WORKFLOW/ACADEMY_OS_MASTER_BUILD_KIT_PROMPT.md` | Old master prompt — superseded by CLAUDE.md | Archive candidate |

---

## Section 5 — Canonical Source-of-Truth Documents

These are the documents that govern what is true. All others are historical records or references.

### Tier 1 — Session-Load Canonical (loaded every session, must be current)

| File | Last updated | Maintained by |
|---|---|---|
| `CLAUDE.md` (root) | Current | Updated with major changes to session protocol |
| `docs/AI_BACKEND_RULES.md` | Maintained | Updated when new backend rules are established |
| `docs/CURRENT_BUILD_TARGET.md` | 2026-05-21 | Updated at phase completion |
| `docs/LOCKED_MODULES.md` | 2026-05-04 | Updated when modules lock/unlock |
| `docs/KNOWN_LIMITATIONS.md` | 2026-05-08 | Updated when gaps are created or resolved |
| `docs/MODULE_BUILD_PROCESS.md` | 2026-04-28 | Process doc — stable |

### Tier 2 — Feature Canonical (reference when working on that feature)

| File | Domain |
|---|---|
| `docs/CHANGELOG.md` | Sprint history — authoritative |
| `docs/DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_V2_891.md` | DONNA resolver — certified state |
| `docs/DONNA_NORMALIZER_FINAL_AUDIT_894.md` | DONNA normalizer — certified state |
| `docs/DONNA_GUIDED_NAVIGATION_HIGHLIGHT_ARCHITECTURE_816.md` | DONNA guided highlight architecture |
| `docs/ACADEMY_INTERFACE_QUALITY_STANDARD.md` | UI quality standard |
| `docs/PRE_MIGRATION_DIRTY_TREE_AUDIT_895.md` | Working tree state before migration |
| `docs/conversational-os/conversational-os-master-plan.md` | Voice OS master plan (LOCKED) |
| `docs/conversational-os/voice-intake-architecture.md` | Voice intake north star (LOCKED) |
| `docs/DONNA_ACTION_SAFETY_CLASSES.md` | DONNA action safety |
| `docs/DONNA_CONVERSATIONAL_QUALITY_STANDARD.md` | DONNA quality standard |
| `docs/ROLE_ROUTE_MAP.md` | Route-to-role mapping |
| `docs/permissions-matrix.md` | Permission model |
| `docs/trust-stack.md` | Trust layer architecture |

### Tier 3 — Historical Record (do not load, preserve for reference)

All sprint docs outside the active sprint track. All QA docs. All superseded audit docs.
All `Academy_OS_Master_Build/` files.

---

## Section 6 — Documentation Sprawl Assessment

| Risk | Rating | Evidence |
|---|---|---|
| **Documentation sprawl** | 🔴 CRITICAL | 784 .md files; 676 in a flat docs/ directory; no structural separation of standards from sprint logs |
| **AI context-noise risk** | 🔴 HIGH | Flat directory means any prompt loading docs/ files may accidentally load 600+ sprint logs |
| **Duplicate-governance risk** | 🟡 MEDIUM | Root BUILD_ORDER.md vs CURRENT_BUILD_TARGET.md; multiple version audit docs; DESIGN_SYSTEM.md conflict |
| **Stale-spec risk** | 🔴 HIGH | Academy_OS_Master_Build/ (48 files) and root untracked specs contradict current implementation |
| **Sprint-log vs standards confusion** | 🔴 HIGH | Session-load docs and sprint logs use identical naming conventions and are in the same directory |
| **Historical-value preservation** | 🟢 LOW RISK | Sprint docs do not need to be deleted — just archived and excluded from context |

---

## Section 7 — Recommended Documentation Hierarchy

### 7.1 — Future Folder Structure

```
/
├── CLAUDE.md                          ← Tier 1 canonical, root-level, auto-loaded
│
├── docs/
│   ├── standards/                     ← Tier 1 canonical standards (new)
│   │   ├── AI_BACKEND_RULES.md        ← Move from docs/
│   │   ├── CURRENT_BUILD_TARGET.md    ← Move from docs/
│   │   ├── LOCKED_MODULES.md          ← Move from docs/
│   │   ├── KNOWN_LIMITATIONS.md       ← Move from docs/
│   │   ├── MODULE_BUILD_PROCESS.md    ← Move from docs/
│   │   ├── ACADEMY_INTERFACE_QUALITY_STANDARD.md  ← Move from docs/
│   │   ├── DONNA_CONVERSATIONAL_QUALITY_STANDARD.md  ← Move from docs/
│   │   └── DONNA_ACTION_SAFETY_CLASSES.md  ← Move from docs/
│   │
│   ├── architecture/                  ← Tier 2 feature canonicals (new)
│   │   ├── DONNA_CONVERSATION_ARCHITECTURE.md
│   │   ├── DONNA_GUIDED_NAVIGATION_HIGHLIGHT_ARCHITECTURE_816.md
│   │   ├── ACADEMY_CURRICULUM_RESOLUTION_ENGINE.md
│   │   ├── REVIEW_EXECUTION_ADAPTER_ARCHITECTURE.md
│   │   ├── PLAYER_ASSESSMENT_ARCHITECTURE.md
│   │   └── ... (other current architecture docs)
│   │
│   ├── audits/                        ← Current certified audit docs (new)
│   │   ├── DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_V2_891.md
│   │   ├── DONNA_NORMALIZER_FINAL_AUDIT_894.md
│   │   ├── PRE_MIGRATION_DIRTY_TREE_AUDIT_895.md
│   │   └── ACADEMYOS_DOCUMENTATION_INFORMATION_ARCHITECTURE_AUDIT_897.md
│   │
│   ├── sprints/                       ← Sprint execution records, historical (new)
│   │   ├── (all DONNA_*_NNN.md sprint docs)
│   │   ├── (all FEATURE_*_NNN.md sprint docs)
│   │   └── (all SPRINT_NNN_*.md sprint docs)
│   │
│   ├── planning/                      ← Working planning docs, not-yet-shipped (new)
│   │   ├── (in-flight sprint planning docs)
│   │   └── CHANGELOG.md              ← Living record — stays accessible
│   │
│   ├── archive/                       ← Archived/superseded docs (new)
│   │   ├── (Academy_OS_Master_Build/ contents, moved)
│   │   ├── (root-level stale specs, moved)
│   │   ├── (superseded QA docs, V1 versions when V2 exists)
│   │   └── (SPRINT_BOARD.md, NEXT_SPRINT_RECOMMENDATION.md)
│   │
│   ├── conversational-os/             ← Keep (contains LOCKED docs)
│   ├── curriculum/                    ← Keep (active architecture)
│   ├── player-development/            ← Keep (review needed)
│   ├── templates/                     ← Keep (review needed)
│   └── visual-system/                 ← Keep (review needed)
```

### 7.2 — Implementation note

**Do not implement the folder restructure yet.** Moving 676 files risks breaking CLAUDE.md session
references and any prompt that hardcodes `docs/AI_BACKEND_RULES.md`. Plan the restructure as a
dedicated sprint with CLAUDE.md reference updates happening in the same commit.

---

## Section 8 — Future Sprint Prompt Context Policy

### 8.1 — Always load (Tier 1 — mandatory every session)

```
docs/AI_BACKEND_RULES.md
docs/CURRENT_BUILD_TARGET.md
docs/LOCKED_MODULES.md
docs/KNOWN_LIMITATIONS.md
docs/MODULE_BUILD_PROCESS.md
```

These are already prescribed by `CLAUDE.md`. No change needed.

### 8.2 — Load per-feature-track (Tier 2 — conditional)

| When working on | Also load |
|---|---|
| DONNA resolver/normalizer | `DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_V2_891.md`, `DONNA_NORMALIZER_FINAL_AUDIT_894.md` |
| DONNA guided highlight | `DONNA_GUIDED_NAVIGATION_HIGHLIGHT_ARCHITECTURE_816.md` |
| Supabase migrations | `PRE_MIGRATION_DIRTY_TREE_AUDIT_895.md`, `docs/conversational-os/conversational-os-master-plan.md` |
| Director dashboard | `COO_LIVE_DATA_WIRING_MAP.md`, `DIRECTOR_DASHBOARD_*` (most recent) |
| Coach portal | `COACH_PORTAL_ARCHITECTURE_AUDIT_986.md` (or most recent) |
| Player/parent portal | `permissions-matrix.md`, `trust-stack.md` |
| UI quality work | `ACADEMY_INTERFACE_QUALITY_STANDARD.md`, `DONNA_CONVERSATIONAL_QUALITY_STANDARD.md` |
| Voice work | `docs/conversational-os/voice-intake-architecture.md` |

### 8.3 — Never load into sprint context

```
Academy_OS_Master_Build/ (any file)
Academy_OS_Master_Build/packages/08_UI_UX_WIREFRAMES/DESIGN_SYSTEM.md (actively harmful)
docs/SPRINT_BOARD.md (stale Sprint 397)
docs/NEXT_SPRINT_RECOMMENDATION.md (stale Sprint 397)
BUILD_ORDER.md (root, stale)
PRODUCT_BLUEPRINT.md (root, pre-app)
```

---

## Section 9 — Naming Convention Recommendations

### Current state

Three naming conventions coexist, creating ambiguity:

| Convention | Example | Era | Assessment |
|---|---|---|---|
| `SPRINT_NNN_FEATURE.md` | `SPRINT_384_DIRECTOR_CLASS_TEMPLATE_BUILDER.md` | Early (Sprints 379–398) | Deprecated — sprint number leads, feature trails |
| `FEATURE_DESCRIPTION_NNN.md` | `DONNA_NORMALIZER_FINAL_AUDIT_894.md` | Current standard | ✅ Best — feature leads, sprint number trails |
| `kebab-case-feature.md` | `voice-transcription-security-architecture.md` | Early architecture layer | ✅ Good for standards — lowercase signals "not a sprint log" |
| `FEATURE_DESCRIPTION.md` (no number) | `DONNA_CONVERSATIONAL_QUALITY_STANDARD.md` | Standards docs | ✅ Good — no number signals canonical, not sprint-specific |

### Recommended naming conventions

| Doc type | Convention | Example |
|---|---|---|
| **Sprint execution docs** | `FEATURE_DESCRIPTION_NNN.md` (uppercase, feature-first, sprint number suffix) | `DONNA_NORMALIZER_FINAL_AUDIT_894.md` |
| **Audit / certification docs** | `FEATURE_AUDIT_NNN.md` or `FEATURE_CERTIFICATION_NNN.md` | `DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_V2_891.md` |
| **Standards docs** | `FEATURE_STANDARD.md` (no number — signals canonical) | `DONNA_CONVERSATIONAL_QUALITY_STANDARD.md` |
| **Architecture docs** | `FEATURE_ARCHITECTURE.md` or `FEATURE_ARCHITECTURE_NNN.md` | `DONNA_CONVERSATION_ARCHITECTURE.md` |
| **Deprecated docs** | `DEPRECATED_FEATURE_DESCRIPTION_NNN.md` | `DEPRECATED_SPRINT_BOARD.md` |
| **Archive docs** | Use `/docs/archive/` subfolder prefix — no rename needed | `docs/archive/SPRINT_BOARD.md` |
| **Working planning docs** | `DESCRIPTION_PLAN.md` or `DESCRIPTION_ROADMAP.md` | `MIGRATION_READINESS_PLAN.md` |

---

## Section 10 — Future Archive Candidates

**Do not archive yet.** These are candidates for a future `/docs/archive/` migration sprint.

| File / Zone | Archive reason |
|---|---|
| `Academy_OS_Master_Build/` (all 48 files) | Pre-app planning artifacts; CLAUDE.md explicitly excludes |
| `docs/SPRINT_BOARD.md` | Stale Sprint 397 — never accurate again |
| `docs/NEXT_SPRINT_RECOMMENDATION.md` | Stale Sprint 397 recommendation |
| `BUILD_ORDER.md` (root) | Superseded by `CURRENT_BUILD_TARGET.md` |
| `PRODUCT_BLUEPRINT.md` (root) | Pre-app; superseded by implemented product |
| `docs/DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_886.md` | Superseded by V2_891 |
| `docs/CURRICULUM_BUILDER_V1_COMPLETION_AUDIT_798.md` | Superseded by _915 |
| `docs/DONNA_MODULARIZATION_MAP.md` | Early concept; actual modularization is in code |
| `docs/DONNA_GODMODE_FOUNDATION_ARCHITECTURE_742A.md` | "Godmode" concept; evolved significantly |
| All `AIQS_*_NNN.md` files (AIQS sprint docs) | Sprint-historical QA records; no longer active tracking |
| All `NO_*.md` audit docs (726–725) | Point-in-time safety audits; valid historically but stale |

---

## Section 11 — Minimum Viable Standards-Doc System

After this audit, the minimum viable standards-doc system needed is:

### 11.1 — What exists and is sufficient

The 5 Tier 1 session-load docs already provide a functional standards system. They are the
minimum required set and are loaded every session. No immediate action needed.

### 11.2 — What should be added next (in order)

| Priority | Document | Purpose | Sprint |
|---|---|---|---|
| 1 | `docs/standards/` directory + README | Create the standards zone to signal authority | Sprint 898 or later |
| 2 | `docs/BUILD_STANDARD.md` | Codify the sprint execution standard (the one in the user's prompt header) | Sprint 899 or later |
| 3 | `docs/SPRINT_NAMING_CONVENTION.md` | Document the canonical naming convention for sprint docs | Sprint 899 or later |
| 4 | `docs/CONTEXT_LOAD_POLICY.md` | Document which docs should and shouldn't be loaded in context | Sprint 899 or later |
| 5 | `docs/DOCUMENTATION_IA.md` (pointer doc) | One-paragraph summary of this audit's conclusions + hierarchy | Sprint 898 or later |

### 11.3 — What should NOT be added yet

- Do not create `/docs/standards/` by moving existing files until CLAUDE.md references are updated
- Do not create a `BUILD_STANDARD.md` that duplicates `MODULE_BUILD_PROCESS.md` content
- Do not create a `SPRINT_LOG_INDEX.md` — the CHANGELOG.md is the authoritative sprint log

---

## Section 12 — Risk Matrix

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| AI loads stale Academy_OS_Master_Build/ spec | CRITICAL | Low (CLAUDE.md warns) | Keep CLAUDE.md exclusion warning; never load explicitly |
| AI loads superseded DESIGN_SYSTEM.md | CRITICAL | Low (CLAUDE.md warns) | CLAUDE.md note is clear; maintain it |
| Sprint prompts load wrong QA doc version | HIGH | Medium | Use most-recent doc by sprint number; V2 naming convention |
| Stale root-level .md files conflict with docs/ | HIGH | Medium | Audit root .md files; commit or archive; keep untracked but .gitignore-note |
| Context window exceeded by doc volume | HIGH | High (676 files) | Never glob-load docs/; always load by specific filename |
| SPRINT_BOARD.md loaded as current state | HIGH | Low | Exclude explicitly; add to context-load blocklist |
| New developer reads `BUILD_ORDER.md` instead of `CURRENT_BUILD_TARGET.md` | MEDIUM | Medium | Archive BUILD_ORDER.md or add deprecation header |
| Documentation sprawl accelerates past 800 files | MEDIUM | High | Define doc creation standards; sprint docs only per sprint; purge after freeze |

---

## Section 13 — Recommended Sprint 898

**Sprint 898 — Documentation Standards Zone Bootstrap V1**

Create `docs/standards/` directory (empty placeholder + README) and a `docs/DOCUMENTATION_IA.md`
pointer document that summarizes this audit's canonical-authority decisions and context-load policy.

Do NOT move files yet. Do NOT rename files. Create only two new files:
1. `docs/standards/README.md` — defines the standards zone and its authority
2. `docs/DOCUMENTATION_IA.md` — one-page summary of canonical docs, context-load policy, naming convention decisions

Both files are documentation-only, no code, no migrations. Stage only those two files plus a
CHANGELOG entry.

After Sprint 898: the documentation IA is recorded in durable form, the standards zone exists,
and the next developer/AI session has a single navigation point for "what docs are canonical."

**Alternative Sprint 898 — Begin Migration Sprint**
If migration readiness takes priority over documentation hygiene, initiate `/supabase-sprint`
to apply the 38 pending migrations. Documentation bootstrap can follow.

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB changes | ✅ |
| No migrations | ✅ |
| No server action changes | ✅ |
| No source code modified | ✅ |
| No files moved or renamed | ✅ |
| No files deleted or archived | ✅ |
| No new standards docs created (per sprint spec) | ✅ |
| TypeScript clean | ✅ |

---

## Files Created

| File | Purpose |
|---|---|
| `docs/ACADEMYOS_DOCUMENTATION_INFORMATION_ARCHITECTURE_AUDIT_897.md` | This audit document |

## Files Modified

| File | Change |
|---|---|
| `docs/CHANGELOG.md` | Sprint 897 dated entry added |

## Files Read (not modified)

| File | Purpose |
|---|---|
| `docs/AI_BACKEND_RULES.md` | Verified content and authority level |
| `docs/CURRENT_BUILD_TARGET.md` | Verified build phase and next steps |
| `docs/LOCKED_MODULES.md` | Confirmed locked files list |
| `docs/KNOWN_LIMITATIONS.md` | Confirmed known gap list |
| `docs/MODULE_BUILD_PROCESS.md` | Confirmed process doc |
| `CLAUDE.md` | Verified session-load protocol and exclusions |
| `docs/CLAUDE_CODE_OPERATING_SYSTEM.md` | Verified operational commands |
| `docs/CHANGELOG.md` | Confirmed current sprint record |
| `docs/PRE_MIGRATION_DIRTY_TREE_AUDIT_895.md` | Prior audit context |
| All file listings from `find` and `ls` commands | Full inventory |
