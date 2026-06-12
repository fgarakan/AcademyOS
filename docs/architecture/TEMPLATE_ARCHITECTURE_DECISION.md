# Template Architecture Decision Record
Date: June 2026
Status: DECIDED
Sprint: Mega Sprint 2141–2170

---

## Decision

Template creation uses Direct Save for all academy-owned operational objects.
Proposed Actions is reserved for global curriculum governance.

---

## Governance Tiers

### Tier 1 — Academy Operational (Direct Save)

Director creates, owns, and manages. Changes are immediate. No approval queue
because the director IS the approver for their own academy's operational structure.

| Object            | Route                         | Save behavior |
|-------------------|-------------------------------|---------------|
| Class Templates   | /director/class-templates/*   | Direct Save   |
| Fitness Templates | /director/fitness/templates/* | Direct Save   |
| Sessions          | /director/sessions/*          | Direct Save   |

### Tier 2 — Global Curriculum Governance (Proposed Actions)

Platform-level content. Changes are proposed, reviewed, and approved before
becoming canonical across academies.

| Object              | Save behavior    |
|---------------------|------------------|
| Global Curriculum   | Proposed Actions |
| Global Skills       | Proposed Actions |
| Global Progressions | Proposed Actions |
| Global Knowledge    | Proposed Actions |

---

## Canonical Route Tree

Implemented in Sprint 2171–2200.

### Templates Hub

/director/templates is the canonical entry point for all template operations.
It is not a redirect — it is a first-class hub page with real template count
data and navigation to both specialized builders.

Hub surfaces:
- Class Templates (count + link to builder)
- Fitness Templates (count + link to builder)
- Create Template (→ /director/class-templates/new)
- Generate Session (→ /director/sessions/new)

### Builder Routes (Tree B — canonical)

- /director/class-templates   (src/app/director/class-templates/)
- /director/fitness/templates (src/app/director/fitness/templates/)

### Tree A Status

The /director/templates/page.tsx has been rewritten as the canonical hub.
Tree A sub-routes (/director/templates/class/*, /director/templates/fitness/*,
/director/templates/coach-preview/, etc.) are unreachable from navigation after
Sprint 2171–2200. Not yet deleted — flagged for cleanup in a future sprint.

No data migration needed. Tree A and Tree B wrote to the same templates and
template_blocks tables.

---

## Object Models

### Class Template
- Lives in `templates` table, type: 'class'
- Contains ordered template_blocks
- Each block references a curriculum phase plus optional coach note
- May include embedded Fitness Template blocks as reusable units

### Fitness Template
- Lives in `templates` table, type: 'fitness'
- Contains ordered template_block_exercises
- Standalone: usable independently or embedded in a Class Template block
- Cannot contain Class Template blocks — no circular nesting

### Session
- Generated from a Class Template
- Copies template structure at generation time — not a live link
- A template change does not retroactively modify existing sessions
- Live session data lives in session_blocks (separate table from template_blocks)

---

## DONNA Interaction Model

DONNA interacts with templates in two modes:

1. Navigation — routes director to /director/templates (the hub) when template
   intent is detected in the brief or quick actions. The hub then provides
   navigation to the specialized builders.

2. Context — surfaces template gaps in DONNA insights (e.g., "This curriculum
   phase has no template assigned").

DONNA does not propose template creation through proposed_actions. Template
creation is a direct director action.

---

## Rationale

The "AI proposes → Director approves" pipeline protects decisions with
academy-wide consequences or involving data owned by other roles (players,
coaches, parents). A director building their own operational templates is
authorship, not governance. Requiring proposed_actions approval for a director
creating their own templates adds friction with no safety benefit.

Global curriculum content carries different stakes. Changes to a skill
progression or global standard affect all academies using that content.
Proposed Actions is correct there.
