# Curriculum Information Architecture
**Sprint 503 — Mega Sprint 503-552 Phase 1**
**Date: 2026-05-21**

---

## Core doctrine

> Curriculum is the source tree for all downstream features.
> Knowledge Engine ≠ Curriculum — external knowledge cannot auto-become curriculum.
> Platform owner controls promotion of knowledge → curriculum / answers / missions / badges.
> DONNA can organize but not publish.
> Parent/player safety remains strict.

---

## Hierarchy

```
Curriculum
└── Stage (Red / Orange / Green / Yellow / High Performance)
    └── Level (e.g. "Orange Ball 2")
        ├── Gates (advancement criteria)
        │   └── Evidence Requirements (what counts as proof)
        ├── Skills
        │   └── Sub-skills
        ├── Drills (attached to level)
        ├── Assessment Criteria (formal assessment gates)
        ├── Coach Cues (language + observation prompts)
        ├── Learning Modules (player/parent-facing)
        ├── Missions (linked player goals)
        ├── Badges (linked recognition triggers)
        └── Parent Guidance (what to share with parents)
```

---

## Node types

| Node type | Visibility | Who manages |
|---|---|---|
| Stage | Director / Coach | Director |
| Level | Director / Coach / Player / Parent | Director |
| Gate | Director / Coach | Director |
| Evidence Requirement | Director / Coach | Director |
| Skill | Director / Coach / Player | Director |
| Sub-skill | Director / Coach | Director |
| Drill | Director / Coach | Director |
| Assessment Criteria | Director / Coach | Director |
| Coach Cue | Coach only | Director |
| Learning Module | Player / Parent (gated) | Director |
| Mission | Player / Parent | Director (platform curates) |
| Badge | Player / Parent | Director (platform curates) |
| Parent Guidance | Parent only | Director |

---

## Visual map layout model

```
Stage bar (horizontal) → Level cards (grid) → Node detail drawer (side panel)
```

Each level card shows:
- Level name
- Stage color
- Completion % (players in this level who have met all gates)
- Gate count
- Drill count
- Open issues (missing evidence, at-risk players)

Clicking a level opens the node detail drawer with tabs:
- Overview
- Gates + Evidence
- Skills
- Drills
- Coach Cues
- Missions / Badges
- Parent Guidance

---

## Expandable tree model

Used in the curriculum builder:

```
[▶] Red Ball        (collapsed — shows gate count, drill count)
    [▶] Red Ball 1  (collapsed — shows gate count)
        [▼] Gates   (expanded — lists individual gates)
            Gate 1: Consistent rally (10 balls)
            Gate 2: Forehand grip established
        [▼] Drills
        [▼] Coach Cues
    [▶] Red Ball 2
    [▶] Red Ball 3
```

---

## "+ Add" content type model

When a director clicks "+ Add" on a level node, they see:

| Content type | What it creates |
|---|---|
| Drill | Attach existing drill or create new drill reference |
| Coach Cue | Add coach observation language for this level |
| Assessment Criterion | Add formal assessment gate (requires evidence) |
| Mission | Link an existing mission to this level |
| Badge | Link an existing badge trigger to this level |
| Parent Guidance | Add parent-facing explanation for this level |
| Learning Module | Add player-facing learning module reference |

All additions go through `proposed_actions` → director approval. Never auto-applied.

---

## DONNA curriculum context model

When director opens curriculum, DONNA sees:
- Current level being viewed (node context)
- Active drafts attached to that node
- Pending approvals for that node
- Knowledge Library items tagged to that level (not yet promoted)

DONNA can:
- Draft a new curriculum change proposal (creates proposed_action)
- Summarize what's missing at a level
- Surface knowledge library items relevant to this level

DONNA cannot:
- Directly modify curriculum records
- Auto-promote knowledge items
- Publish to parent/player without approval

---

## Knowledge Library → Curriculum promotion path

```
External source
    → Knowledge Library (platform owner review)
    → [Approve as general knowledge] OR [Promote to curriculum draft]
    → Curriculum draft → director approval → curriculum record
```

The Knowledge Library is NOT part of the curriculum tree. It is a staging area.

---

## Connection map

| Curriculum entity | Connected downstream |
|---|---|
| Level | Player profiles (curriculum_level_id), session templates, group requirements |
| Gate | player_requirement_progress, session block evidence |
| Drill | session_blocks (template blocks and executed session blocks) |
| Mission | player_missions (active), missionEngine |
| Badge | badgeEligibilityEngine |
| Learning Module | player portal (gated by level) |
| Parent Guidance | parent portal (parent-safe only) |
| Coach Cue | coach session workspace (level context) |
| Assessment Criteria | assessments table, placement engine |
