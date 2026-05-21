# AcademyOS Architecture Index

This file is the index of all architecture and engineering documentation. It is a navigation map — not a specification. Follow the links to the actual documents.

**Last updated:** Mega Sprint 417–426 Phase 3

---

## Visual System Atlas (Sprint 402)

| Document | Purpose |
|---|---|
| [`visual-system/00_SYSTEM_ATLAS.md`](visual-system/00_SYSTEM_ATLAS.md) | Index of all visual system maps |
| [`visual-system/01_EXECUTIVE_PRODUCT_MAP.md`](visual-system/01_EXECUTIVE_PRODUCT_MAP.md) | Full product ecosystem — who uses it, what they do |
| [`visual-system/02_ROLE_AND_PERMISSION_MAP.md`](visual-system/02_ROLE_AND_PERMISSION_MAP.md) | Role hierarchy, route access, enforcement layers |
| [`visual-system/03_DONNA_ACTION_FLOW_MAP.md`](visual-system/03_DONNA_ACTION_FLOW_MAP.md) | DONNA action flow — input to approved DB write |
| [`visual-system/04_DATA_MODEL_AND_EVIDENCE_MAP.md`](visual-system/04_DATA_MODEL_AND_EVIDENCE_MAP.md) | Core entities, relationships, evidence flow |
| [`visual-system/05_TRUST_AND_SAFETY_MAP.md`](visual-system/05_TRUST_AND_SAFETY_MAP.md) | Trust Stack layers, violation detection, safe defaults |
| [`visual-system/06_RUNTIME_REQUEST_FLOW_MAP.md`](visual-system/06_RUNTIME_REQUEST_FLOW_MAP.md) | Request from browser through Next.js to Supabase |
| [`visual-system/07_DEBUGGING_AND_OBSERVABILITY_MAP.md`](visual-system/07_DEBUGGING_AND_OBSERVABILITY_MAP.md) | Trace, debug, and understand failures |
| [`visual-system/08_MODULE_DEPENDENCY_MAP.md`](visual-system/08_MODULE_DEPENDENCY_MAP.md) | src/lib/ module dependencies |
| [`visual-system/09_ROADMAP_AND_SPRINT_IMPACT_MAP.md`](visual-system/09_ROADMAP_AND_SPRINT_IMPACT_MAP.md) | Phase roadmap and capability map |

## Engineering Process Docs (Sprint 402)

| Document | Purpose |
|---|---|
| [`ENGINEERING_MODULE_REGISTRY.md`](ENGINEERING_MODULE_REGISTRY.md) | Every src/lib/ module: purpose, risk, status |
| [`ENGINEERING_UPDATE_PROTOCOL.md`](ENGINEERING_UPDATE_PROTOCOL.md) | When and how to update the visual system |

## Infrastructure Implementation Notes (Sprints 401–416)

| Document | Purpose |
|---|---|
| [`OBSERVABILITY_IMPLEMENTATION_NOTES.md`](OBSERVABILITY_IMPLEMENTATION_NOTES.md) | Structured logging helpers (Sprint 401) |
| [`IDEMPOTENCY_IMPLEMENTATION_NOTES.md`](IDEMPOTENCY_IMPLEMENTATION_NOTES.md) | Duplicate guard helpers (Sprint 401) |
| [`RATE_LIMITING_IMPLEMENTATION_NOTES.md`](RATE_LIMITING_IMPLEMENTATION_NOTES.md) | Rate limit policies and helpers (Sprint 403) |
| [`DEBOUNCE_AND_DUPLICATE_SUBMIT_NOTES.md`](DEBOUNCE_AND_DUPLICATE_SUBMIT_NOTES.md) | Debounce strategy and UI patterns (Sprint 404) |
| [`CACHE_TTL_IMPLEMENTATION_NOTES.md`](CACHE_TTL_IMPLEMENTATION_NOTES.md) | Cache key builders and TTL policy (Sprint 405) |
| [`CACHE_INVALIDATION_MAP.md`](CACHE_INVALIDATION_MAP.md) | Per-mutation revalidation map (Sprint 406) |
| [`USAGE_METERING_IMPLEMENTATION_NOTES.md`](USAGE_METERING_IMPLEMENTATION_NOTES.md) | AI/voice usage metering and event types (Sprint 407) |
| [`SLOW_QUERY_AND_SELECT_STAR_AUDIT.md`](SLOW_QUERY_AND_SELECT_STAR_AUDIT.md) | Select-star audit and query remediation plan (Sprint 408) |
| [`BACKGROUND_JOB_QUEUE_NOTES.md`](BACKGROUND_JOB_QUEUE_NOTES.md) | Background job queue design and types (Sprint 409–410) |
| [`ENTITY_VERSIONING_NOTES.md`](ENTITY_VERSIONING_NOTES.md) | Optimistic locking pattern and usage (Sprint 411) |
| [`FEATURE_FLAGS_KILL_SWITCHES_NOTES.md`](FEATURE_FLAGS_KILL_SWITCHES_NOTES.md) | Feature flags and kill switch implementation (Sprint 414–415) |
| [`DONNA_ACTION_RELIABILITY_NOTES.md`](DONNA_ACTION_RELIABILITY_NOTES.md) | DONNA action reliability: state machine, guards, audit, gateway (Sprint 417–426) |

---

## Trust Stack (Root Doctrine)

The Trust Stack is the governance model for all mutations, AI actions, and access control in AcademyOS.

> AI proposes. Human approves. System applies. Audit log records. Permissions constrain. Safe defaults protect. Logs explain.

| Document | Purpose |
|---|---|
| [`trust-stack.md`](trust-stack.md) | Root doctrine — the seven-layer trust model |
| [`permissions-matrix.md`](permissions-matrix.md) | Role × data access table; RLS alignment |
| [`ai-action-safety.md`](ai-action-safety.md) | AI safety contract — layers 1–3 |
| [`data-classification.md`](data-classification.md) | Data sensitivity levels; what can go to AI |
| [`audit-log-strategy.md`](audit-log-strategy.md) | Audit log contract — layer 4 |
| [`feature-flags-and-kill-switches.md`](feature-flags-and-kill-switches.md) | Kill switches; safe-default protocol — layer 6 |
| [`debuggability-standard.md`](debuggability-standard.md) | Observability contract — layer 7 |
| [`cache-and-performance-principles.md`](cache-and-performance-principles.md) | Cache safety; query performance rules |
| [`donna-trust-modes.md`](donna-trust-modes.md) | DONNA operating modes and trust surface |
| [`ai-development-rules.md`](ai-development-rules.md) | Engineering rules for all AI feature PRs |
| [`release-safety-checklist.md`](release-safety-checklist.md) | Pre-release verification gate |

---

## Session-Level Operating Documents

These are read at the start of every Claude Code session.

| Document | Purpose |
|---|---|
| `docs/AI_BACKEND_RULES.md` | Non-negotiable backend safety rules |
| `docs/CURRENT_BUILD_TARGET.md` | Active sprint build target |
| `docs/LOCKED_MODULES.md` | What must not be touched |
| `docs/KNOWN_LIMITATIONS.md` | Current gaps and incomplete features |
| `docs/MODULE_BUILD_PROCESS.md` | Sprint execution process |

---

## Product and Domain Documentation

| Document | Purpose |
|---|---|
| `PRODUCT_BLUEPRINT.md` | High-level product vision and operating model |
| `PLAYER_PROFILE_SPEC.md` | Player profile object specification |
| `ROLE_CONNECTION_MAP.md` | How roles interact with each other |
| `DATA_FLOW_MAP.md` | How data moves through the system |
| `MULTI_TENANT_SECURITY_AUDIT.md` | Multi-tenancy security review |
| `BUILD_ORDER.md` | Module build sequence |

---

## Infrastructure and Database

| Document | Purpose |
|---|---|
| `README_BACKEND.md` | Backend setup and Supabase project notes |
| `docs/SCALABILITY_COST_CONTROL_AUDIT.md` | Scalability gaps and cost control roadmap |
| `supabase/migrations/` | All database migrations (numbered sequence) |
| `src/lib/supabase/database.types.ts` | Generated TypeScript types (do not edit manually) |

---

## Voice and AI

| Document | Purpose |
|---|---|
| `docs/VOICE_INPUT_DEMO_LAYER_ARCHITECTURE.md` | Voice input layer architecture |
| `docs/VOICE_TEXT_INPUT_COMPONENT.md` | VoiceTextInput component spec |
| `docs/VOICE_INPUT_DEMO_QA.md` | Voice demo QA results |
| `docs/BRIAN_VOICE_DEMO_SCRIPT.md` | Voice demo script |
| [`donna-trust-modes.md`](donna-trust-modes.md) | DONNA trust surface |
| [`ai-action-safety.md`](ai-action-safety.md) | AI action safety contract |

---

## Player Portal and Onboarding

| Document | Purpose |
|---|---|
| `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_DEMO_SCRIPT.md` | Player/parent portal demo script |
| `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_EXPERIENCE_AUDIT.md` | Portal experience audit |
| `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_EXPERIENCE_QA.md` | Portal QA results |
| `docs/PLAYER_IMPORT_PARSER.md` | Player import pipeline spec |
| `docs/ONBOARDING_TEMPLATE_ARCHITECTURE_ALIGNMENT_AUDIT.md` | Onboarding template audit |

---

## Curriculum

| Document | Purpose |
|---|---|
| `docs/curriculum/angles-master-spine.md` | Curriculum spine for the Angles academy |
| `docs/curriculum/angles-curriculum-synthesis.md` | Curriculum synthesis doc |
| `docs/curriculum/source-research-aggregation.md` | Research aggregation |

---

## UI and Screen Specifications

| Document | Purpose |
|---|---|
| `UI_SCREEN_MAP.md` | Screen inventory and navigation map |

---

## Changelog

| Document | Purpose |
|---|---|
| `docs/CHANGELOG.md` | Sprint-by-sprint change history |

---

## Source Code Map

| Path | Contents |
|---|---|
| `src/app/director/` | Director portal pages and layouts |
| `src/app/coach/` | Coach portal pages |
| `src/app/player/` | Player portal pages |
| `src/app/parent/` | Parent portal pages |
| `src/app/dev/` | Dev-only validation pages (hidden in production) |
| `src/components/ui/` | Design system components (Card, Button, etc.) |
| `src/lib/supabase/` | Supabase client setup and generated types |
| `src/lib/portal/` | Portal data access utilities |
| `src/lib/templates/` | Template repository and types |
| `src/lib/voice/` | Voice pipeline utilities |
| `src/lib/donna/` | DONNA intelligence context builders |
| `src/middleware.ts` | Auth middleware and route guards |
| `scripts/` | Dev-only validation and seed scripts |
| `supabase/migrations/` | Database migration files |

---

## Design System Reference

The authoritative design system is defined in:
- `tailwind.config.ts` — color tokens and spacing
- `src/app/globals.css` — CSS custom properties
- `src/components/ui/index.ts` — available UI components

Do not use the design system described in `Academy_OS_Master_Build/` — it describes a different version and does not match the implemented system.
