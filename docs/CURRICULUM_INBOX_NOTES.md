# Curriculum Inbox

> Sprint 478 — Curriculum Inbox V1
> See also: `src/lib/curriculum/inbox/index.ts`, `docs/DONNA_MULTI_TURN_TASK_FLOWS.md`

---

## Purpose

The curriculum inbox is the staging area for curriculum ideas before they enter the official curriculum. Voice-to-curriculum, coach suggestions, and DONNA proposals all land here first — pending director review and approval.

---

## Source types

| Source | Description |
|---|---|
| voice | Director or coach spoke a curriculum idea |
| text | Director typed an idea in the command center |
| coach_suggestion | Coach-submitted idea from coach portal |
| donna_proposal | DONNA identified a gap and proposed an addition |

---

## Item lifecycle

```
idea created → pending_review
→ similarity check → similar_exists (if flagged)
→ director reviews → approved / rejected / merged
```

Items never bypass the review step. Approval creates a `proposed_action` via the standard pipeline.

---

## Similarity detection

`scoreCurriculumSimilarity(ideaA, ideaB)` is deterministic (token overlap, no AI).

`applySimliarityFlags(items, threshold)` runs across all pending items and marks duplicates.

Default threshold: 0.4 (40% token overlap). Flags items as `similar_exists`.

---

## Validation rules

- Idea text: 10–500 characters, required
- Domain: optional; defaults to 'general' with a warning
- Level: optional; informs template assignment downstream

---

## Main functions

- `buildCurriculumInboxItem(params)` — create a new inbox item
- `validateCurriculumIdea(idea, domain)` — validate before creating
- `scoreCurriculumSimilarity(ideaA, ideaB)` — deterministic similarity
- `applySimliarityFlags(items, threshold)` — bulk flag similar items
- `rankInboxByPriority(items)` — flagged items first, then oldest
- `buildCurriculumInboxSummary(items)` — summary for director dashboard

---

## Safety invariants

- Curriculum inbox items never directly update the curriculum — all changes require a proposed_action
- Voice-to-curriculum never bypasses director review
- Similarity detection uses token overlap only — no external AI API calls
- Raw coach/voice text is never published without director approval
