# AcademyOS System Atlas

**Last updated:** Sprint 402
**Audience:** Engineering team, product leads, onboarding developers
**Purpose:** Index of all visual system maps. Read this first; follow links to the map you need.

This atlas is the navigation layer for the AcademyOS visual documentation system. Each map covers one architectural dimension of the product.

---

## Map Index

| # | Map | What it answers | Key audience |
|---|---|---|---|
| [01](01_EXECUTIVE_PRODUCT_MAP.md) | Executive Product Map | What does the product do end-to-end? | PM, new engineers |
| [02](02_ROLE_AND_PERMISSION_MAP.md) | Role and Permission Map | Who can do what? Where is access enforced? | Engineering, security |
| [03](03_DONNA_ACTION_FLOW_MAP.md) | DONNA Action Flow Map | How does an AI action go from input to approved database write? | Engineering, product |
| [04](04_DATA_MODEL_AND_EVIDENCE_MAP.md) | Data Model and Evidence Map | What are the core objects and how do they connect? | Engineering, data |
| [05](05_TRUST_AND_SAFETY_MAP.md) | Trust and Safety Map | How does the Trust Stack enforce safety at every layer? | Engineering, compliance |
| [06](06_RUNTIME_REQUEST_FLOW_MAP.md) | Runtime Request Flow Map | How does a request move from browser to database? | Engineering |
| [07](07_DEBUGGING_AND_OBSERVABILITY_MAP.md) | Debugging and Observability Map | How do we trace, debug, and understand failures? | Engineering, on-call |
| [08](08_MODULE_DEPENDENCY_MAP.md) | Module Dependency Map | Which src/lib/ modules depend on what? | Engineering |
| [09](09_ROADMAP_AND_SPRINT_IMPACT_MAP.md) | Roadmap and Sprint Impact Map | What is planned and what did each phase change? | All |

---

## Supporting Docs

| Doc | Purpose |
|---|---|
| [ENGINEERING_MODULE_REGISTRY.md](../ENGINEERING_MODULE_REGISTRY.md) | Every src/lib/ module: purpose, owner, risk level |
| [ENGINEERING_UPDATE_PROTOCOL.md](../ENGINEERING_UPDATE_PROTOCOL.md) | When and how to update these maps |
| [architecture-index.md](../architecture-index.md) | Full doc index including Trust Stack docs |

---

## When to Update This Atlas

- When a new major module is added to `src/lib/`
- When a new product role is introduced
- When DONNA's action types change
- When the data model gains a new core entity
- When a new phase of the roadmap begins

Update protocol: see `docs/ENGINEERING_UPDATE_PROTOCOL.md`.

---

## Core Product Doctrine (for context)

> AI proposes. Human approves. System applies. Audit log records. Permissions constrain. Safe defaults protect. Logs explain.

Every map in this atlas should be readable through the lens of this doctrine. If a map cannot be explained in terms of these seven layers, it is incomplete.
