# Engineering Update Protocol

**Last updated:** Sprint 402
**Audience:** Engineering team
**Purpose:** Defines when and how to update the visual system maps, module registry, and architecture docs.
**Related docs:** `docs/visual-system/00_SYSTEM_ATLAS.md`, `docs/ENGINEERING_MODULE_REGISTRY.md`

---

## The Core Rule

**The visual maps and registry must stay in sync with the code.** A doc that describes a past architecture is worse than no doc — it creates false confidence and misdirects debugging.

Update protocol is not optional. It is part of the definition of "done" for any sprint that changes the architecture.

---

## When to Update Each Document

### `docs/visual-system/00_SYSTEM_ATLAS.md`
Update when: A new visual map is added to the atlas.

### `docs/visual-system/01_EXECUTIVE_PRODUCT_MAP.md`
Update when:
- A new portal is added (new role type)
- A major feature changes the product flow
- The operating model changes

### `docs/visual-system/02_ROLE_AND_PERMISSION_MAP.md`
Update when:
- A new role is added or removed
- A route's role requirements change
- RLS policies change significantly
- A new table is added (add to Data Visibility section)

### `docs/visual-system/03_DONNA_ACTION_FLOW_MAP.md`
Update when:
- A new DONNA action type is registered
- The voice pipeline adds a step
- The approval flow changes
- DONNA's write surface changes

### `docs/visual-system/04_DATA_MODEL_AND_EVIDENCE_MAP.md`
Update when:
- A new core table is added
- A relationship between entities changes
- Evidence sources change

### `docs/visual-system/05_TRUST_AND_SAFETY_MAP.md`
Update when:
- A new Trust Stack enforcement layer is added
- RLS policy strategy changes
- A new safety invariant is established

### `docs/visual-system/06_RUNTIME_REQUEST_FLOW_MAP.md`
Update when:
- The auth architecture changes
- New server patterns are introduced (e.g., streaming, edge functions)
- Middleware rules change

### `docs/visual-system/07_DEBUGGING_AND_OBSERVABILITY_MAP.md`
Update when:
- New paths are instrumented
- The log format changes
- A log drain or external observability tool is connected
- Known gaps are resolved

### `docs/visual-system/08_MODULE_DEPENDENCY_MAP.md`
Update when:
- A new `src/lib/` module is created
- A cross-module dependency is introduced or removed

### `docs/visual-system/09_ROADMAP_AND_SPRINT_IMPACT_MAP.md`
Update when:
- A phase is completed (mark as done)
- A phase scope changes
- A new phase is added

### `docs/ENGINEERING_MODULE_REGISTRY.md`
Update when:
- A new module is created (add a row)
- A module's risk level or status changes
- A module's planned capabilities are implemented

### `docs/architecture-index.md`
Update when:
- A new major doc is created

---

## How to Update (Checklist)

When a sprint changes architecture, before committing:

1. Identify which of the above documents is affected by the sprint changes.
2. Open each affected document.
3. Update the "Last updated" sprint number.
4. Update the relevant diagrams or tables.
5. If a planned item is now implemented, mark it `✅` in the registry.
6. If a new stop condition was reached, document it in the phase roadmap.
7. Run `npx tsc --noEmit` to confirm no TypeScript regressions.
8. Stage the doc changes alongside the code changes.

---

## Mermaid Diagram Guidelines

All diagrams in this system use Mermaid syntax. Guidelines:

- Use `graph LR` or `graph TD` for flow diagrams.
- Use `sequenceDiagram` for request/response flows involving multiple actors.
- Use `erDiagram` for data model diagrams.
- Use `gantt` for roadmap timelines.
- Test diagrams in a Mermaid-compatible renderer (GitHub renders them natively in `.md` files).
- Keep diagrams readable at a screen width of ~900px.
- Do not embed sensitive data (real UUIDs, real names, real API keys) in diagrams.

---

## What Not to Put in Visual Docs

- Specific UUIDs, email addresses, or user names
- API keys or secrets (even in comments)
- Code implementations (put those in source files, reference from docs)
- Speculative features with no sprint assigned
- Deprecated patterns that no longer apply (remove them; the git history preserves them)

---

## Ownership

Every doc in this system is owned by the **engineering team collectively**. Any engineer who makes a change that makes a visual doc stale is responsible for updating it before their changes are merged.

There is no dedicated "docs owner." Stale docs are a code review failure, not a doc-owner failure.
