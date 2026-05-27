# AcademyOS Documentation Information Architecture

**Version:** 1.0 — Sprint 898
**Authority:** Sprint 897 Audit (`docs/ACADEMYOS_DOCUMENTATION_INFORMATION_ARCHITECTURE_AUDIT_897.md`)
**Purpose:** One-page navigation guide for which docs to load, when, and which to avoid.

---

## The Problem

The `docs/` directory contains **784 markdown files** across 6 zones. The 5 files that govern
every session are visually indistinguishable from 671 sprint log files. Loading the wrong docs
into context is the primary AI context-drift risk.

This file is the practical answer to: "which docs actually govern this project?"

---

## Tier 1 — Always Load (Canonical Authority, Every Session)

Defined in `CLAUDE.md`. Non-negotiable. Supersede all other docs.

| File | What it governs |
|---|---|
| `docs/AI_BACKEND_RULES.md` | Supabase call patterns, RLS, service role, migration safety |
| `docs/CURRENT_BUILD_TARGET.md` | What is being built right now and in what order |
| `docs/LOCKED_MODULES.md` | Files that cannot be touched; files in progress |
| `docs/KNOWN_LIMITATIONS.md` | Current gaps, broken/incomplete things |
| `docs/MODULE_BUILD_PROCESS.md` | Required build process for every sprint |

If any Tier 1 doc conflicts with any other doc, the Tier 1 doc wins.

---

## Tier 2 — Load When Relevant (Feature Canonical)

Load only when actively working on the named feature area. Do not load by default.

| When working on | Load |
|---|---|
| DONNA resolver / normalizer | `DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_V2_891.md`, `DONNA_NORMALIZER_FINAL_AUDIT_894.md` |
| DONNA guided highlight | `DONNA_GUIDED_NAVIGATION_HIGHLIGHT_ARCHITECTURE_816.md` |
| Curriculum intelligence loop | `CURRICULUM_INTELLIGENCE_LOOP.md`, `CURRICULUM_INFORMATION_ARCHITECTURE.md`, `CURRICULUM_RIPPLE_ARCHITECTURE.md` |
| Curriculum builder | `CURRICULUM_BUILDER_ARCHITECTURE_759.md`, `CURRICULUM_BUILDER_V2_WIRING_PLAN_831.md` |
| Director dashboard | `COO_LIVE_DATA_WIRING_MAP.md` |
| Role / permission work | `docs/permissions-matrix.md`, `docs/trust-stack.md` |
| Voice architecture | `docs/conversational-os/voice-intake-architecture.md` (LOCKED) |
| DONNA conversation principles | `docs/conversational-os/conversational-os-master-plan.md` (LOCKED) |
| UI quality work | `ACADEMY_INTERFACE_QUALITY_STANDARD.md`, `DONNA_CONVERSATIONAL_QUALITY_STANDARD.md` |
| Supabase migrations | `PRE_MIGRATION_DIRTY_TREE_AUDIT_895.md` |
| DONNA context / knowledge | `DONNA_ACADEMY_KNOWLEDGE_CONTEXT.md` |
| Curriculum safety | `DONNA_CURRICULUM_IMPACT_MAP.md` |

---

## Tier 3 — Historical Record (Do Not Load Into Sprint Context)

These are sprint execution logs. They document what was built in a past sprint.
They are preserved for reference but should not govern current decisions.

- All `DONNA_*_NNN.md` files not listed in Tier 2
- All `FEATURE_QA_NNN.md` files
- All `FEATURE_AUDIT_NNN.md` files (except the most recent certified audit per feature)
- All `AIQS_*_NNN.md` files
- All `SPRINT_NNN_*.md` files (early sprint format, Sprints 379–398)
- All `BRIAN_*_DEMO_*.md` files

**Load a historical sprint doc only when you are actively reviewing or extending that specific sprint's work. Do not load as general context.**

---

## Never Load (Stale or Actively Harmful)

Loading these files into context will produce incorrect guidance.

| File / Zone | Why |
|---|---|
| `Academy_OS_Master_Build/` (all 48 files) | Pre-app planning artifacts; CLAUDE.md explicitly excludes; do not load |
| `Academy_OS_Master_Build/packages/08_UI_UX_WIREFRAMES/DESIGN_SYSTEM.md` | Actively harmful — describes a different design system; CLAUDE.md warns explicitly |
| `docs/SPRINT_BOARD.md` | Stale at Sprint 397 — never accurate again |
| `docs/NEXT_SPRINT_RECOMMENDATION.md` | Stale Sprint 397 recommendation |
| `BUILD_ORDER.md` (root, untracked) | Superseded by `docs/CURRENT_BUILD_TARGET.md` |
| `PRODUCT_BLUEPRINT.md` (root, untracked) | Pre-app blueprint; not the current product |

---

## Document Categories (Reference)

| Category | Count | Status |
|---|---|---|
| Tier 1 canonical standards | 5 | Maintained — always load |
| Feature canonical docs (Tier 2) | ~15 | Maintained — load per feature |
| DONNA sprint docs | 179 | Historical after sprint commit |
| QA / Certification / Audit docs | 235 | Historical after sprint commit |
| Demo / Pilot / Script docs | 57 | Reference only — never sprint context |
| Architecture docs | 32 | Mixed — some current, some historical |
| Early sprint format (`SPRINT_NNN_*`) | 25 | Historical |
| Lowercase early architecture layer | 31 | Mixed — see `docs/conversational-os/` for LOCKED items |
| `Academy_OS_Master_Build/` | 48 | Never load |

---

## Document Naming Convention

| Type | Convention | Signal |
|---|---|---|
| Sprint execution log | `FEATURE_DESCRIPTION_NNN.md` | Sprint number suffix = historical |
| Canonical standard | `FEATURE_STANDARD.md` (no number) | No number = canonical |
| Certified audit | `FEATURE_AUDIT_NNN.md` or `FEATURE_CERTIFICATION_NNN.md` | Highest number = most current |
| Architecture | `FEATURE_ARCHITECTURE.md` or `FEATURE_ARCHITECTURE_NNN.md` | No number = current; number = historical version |
| Deprecated format | `SPRINT_NNN_FEATURE.md` | Number leads = deprecated format |

**The `SPRINT_NNN_FEATURE.md` format is deprecated.** New sprint docs use `FEATURE_DESCRIPTION_NNN.md`.

---

## Future Folder Structure (Do Not Implement Yet)

The recommended future structure (defined in Sprint 897) separates standards from sprint logs:

```
docs/standards/    ← Tier 1 canonical (move after updating CLAUDE.md references)
docs/architecture/ ← Feature architecture docs
docs/audits/       ← Certified audit docs
docs/sprints/      ← Sprint log records
docs/planning/     ← Working docs
docs/archive/      ← Stale/superseded
```

**Do not move files until CLAUDE.md session-load references are updated in the same commit.**

---

## Single Rule

When in doubt: load fewer docs, not more. The Tier 1 set is the complete governance layer.
Every other doc is context for a specific feature or historical record of a completed sprint.
