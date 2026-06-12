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

Tree B is canonical. Tree A (/director/templates/*) is deprecated.

Tree B routes:
- src/app/director/class-templates/     (Class Templates)
- src/app/director/fitness/templates/   (Fitness Templates)

Tree A deprecation (Phase B):
- /director/templates → redirect to /director/class-templates
- No data migration needed. Tree B writes to the same templates and
  template_blocks tables as Tree A.

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

1. Navigation — routes director to class-templates or fitness/templates when
   template creation intent is detected in the brief or quick actions.

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
