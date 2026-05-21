# Roadmap and Sprint Impact Map

**Last updated:** Sprint 402 (Mega Sprint 402–451 Phase 1)
**Audience:** All — engineering, PM, directors
**Purpose:** Shows the planned sprint phases, what each phase builds, and the cumulative impact on system capability.
**Related docs:** `docs/ENGINEERING_MODULE_REGISTRY.md`, `docs/SCALABILITY_COST_CONTROL_AUDIT.md`
**When to update:** After every phase commit — update the status column.

---

## Phase Overview

```mermaid
gantt
    title AcademyOS Mega Sprint 402–451
    dateFormat  YYYY-MM-DD
    section Phase 1: Engineering Clarity
    Sprint 402 Visual System Atlas       :done, p1s402, 2026-05-21, 1d
    Sprint 403 Rate Limiting V1          :done, p1s403, 2026-05-21, 1d
    Sprint 404 Debounce + Duplicate      :done, p1s404, 2026-05-21, 1d
    Sprint 405 Cache Layer               :done, p1s405, 2026-05-21, 1d
    Sprint 406 Cache Invalidation Map    :done, p1s406, 2026-05-21, 1d
    section Phase 2: Scale + Cost
    Sprint 407 AI Usage Metering         :p2s407, 2026-05-22, 1d
    Sprint 408 Slow Query Audit          :p2s408, 2026-05-22, 1d
    Sprint 409-410 Background Jobs       :p2s409, 2026-05-22, 2d
    Sprint 411 Optimistic Locking        :p2s411, 2026-05-22, 1d
    Sprint 412 Persistent Idempotency    :p2s412, 2026-05-22, 1d
    Sprint 413 Audit Log Application     :p2s413, 2026-05-22, 1d
    Sprint 414-415 Feature Flags/Kills   :p2s414, 2026-05-22, 2d
    Sprint 416 Diagnostics Console       :p2s416, 2026-05-22, 1d
    section Phase 3: DONNA Reliability
    Sprints 417-426                      :p3, 2026-05-23, 5d
    section Phase 4: Director OS
    Sprints 427-436                      :p4, 2026-05-26, 5d
    section Phase 5: Coach OS
    Sprints 437-446                      :p5, 2026-05-28, 5d
    section Phase 6: Player Evidence
    Sprints 447-451                      :p6, 2026-05-30, 3d
```

---

## Phase Capability Map

| Phase | Sprints | Key Capabilities Added | Status |
|---|---|---|---|
| Phase 1 | 402–406 | Visual system maps, module registry, rate limit helpers, cache utilities, debounce docs | ✅ In progress |
| Phase 2 | 407–416 | AI usage metering, select-star fixes, background job design, optimistic locking, persistent idempotency, audit log application, feature flags, kill switches, diagnostics | ⏳ Planned |
| Phase 3 | 417–426 | DONNA action contract, context packs, draft queue, approval path, screen-aware display, voice warm start, trust copy, cost guardrails, explainability | ⏳ Planned |
| Phase 4 | 427–436 | Director command center, approval center, academy setup tracker, staff management, groups, curriculum viewer, override review, template versioning, session generation | ⏳ Planned |
| Phase 5 | 437–446 | Coach dashboard, session plan mobile view, attendance exception workflow, quick capture, recap assistant, structuring engine, player observations, session actuals, parent-safe summaries | ⏳ Planned |
| Phase 6 | 447–451 | Player profile command center, development priorities, evidence graph, level-up requirements, end-to-end demo readiness | ⏳ Planned |

---

## Cumulative Safety Score by Phase

```mermaid
graph LR
    BASE["Baseline\n(Sprint 401)\nRate: None\nCache: revalidatePath only\nIdempotency: Best-effort\nAudit: Partial\nObservability: 4 paths"] 
    P1["After Phase 1\nRate: Helper foundation\nCache: Key/TTL helpers\nIdempotency: Documented\nAudit: Partial\nObservability: 4+ paths"]
    P2["After Phase 2\nRate: Applied\nCache: Applied\nIdempotency: Persistent\nAudit: Broad\nObservability: All paths\nFlags: Foundation"]
    P3["After Phase 3\nDONNA: Full contract\nDONNA: Context packs\nDONNA: Cost guardrails\nDONNA: Explainability"]
    P4["After Phase 4\nDirector: Full OS\nCurriculum: Governed\nTemplates: Versioned"]
    P5["After Phase 5\nCoach: Full OS\nEvidence: Captured"]
    P6["After Phase 6\nPlayer: Full profile\nEvidence: Graph\nDemo: Ready"]

    BASE --> P1 --> P2 --> P3 --> P4 --> P5 --> P6
```

---

## Stop Conditions by Phase

A phase STOPS if it encounters:
- A required database migration (not pre-approved)
- A required RLS policy change (not pre-approved)
- A new npm dependency requirement
- A parent/player data visibility risk
- A DONNA direct mutation risk
- A destructive or irreversible operation

Each stop is reported immediately before proceeding to the next phase.
