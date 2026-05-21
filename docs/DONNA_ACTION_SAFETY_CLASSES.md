# DONNA Action Safety Classes

**Sprint:** 606
**Date:** 2026-05-21
**Source:** `src/lib/donna/directorActionTypes.ts`, `src/lib/donna/directorActionRegistry.ts`

---

## Purpose

Every DONNA action is assigned one of eight safety classes. The class determines:
- Whether DONNA acts immediately, creates a draft, or refuses
- Whether director approval is required before any state change
- What DONNA says when asked to do something in that class

This document defines each class, its criteria, examples, and the DONNA response pattern.

---

## The eight classes

### 1. `answer_only`

**What it is:** DONNA explains, summarizes, or narrates. No draft. No state change. No approval gate.

**Criteria:**
- Output is read-only (text, numbers, analysis)
- Nothing is written to the database
- No proposed_actions row is created
- No downstream action is triggered

**Examples:**
- "Why is attendance red?" → DONNA explains the KPI
- "What should I do first?" → DONNA surfaces the top priority from AcademyContext
- "Explain this player's readiness score" → DONNA narrates the score components

**DONNA response pattern:**
> "Here is what I can see: [explanation]. No changes have been made."

---

### 2. `draft_only`

**What it is:** DONNA creates a `proposed_actions` row with `status: 'pending_review'`. Nothing else happens until the director reviews and approves it in the review queue.

**Criteria:**
- A `proposed_actions` row is created
- All content is director-visible only
- No player, parent, or coach-visible change occurs
- No curriculum or level change occurs until approval

**Examples:**
- "Draft a parent summary for this player" → creates `parent_communication` proposed_action
- "Draft a coach brief" → creates `coach_communication` proposed_action
- "Record an attendance exception" → creates `attendance_exception` proposed_action

**DONNA response pattern:**
> "I've drafted this for your review. Nothing has changed yet — you can review it in the queue and approve when ready."

---

### 3. `review_required`

**What it is:** DONNA proposes a significant change and routes it to the review queue. A stronger approval gate than `draft_only` — these actions touch player state, curriculum, or visibility.

**Criteria:**
- Action would change player-level data, group membership, or content visibility
- Proposed_actions row is created with explicit routing to review queue
- Director must review and approve before any execution

**Examples:**
- "Propose moving this player up a level" → creates `level_review` proposed_action
- "Recommend a group adjustment" → creates `move_player_group` proposed_action
- "Propose awarding a badge" → creates `badge_award` proposed_action

**DONNA response pattern:**
> "I've sent this to the review queue for your approval. No player data has changed. Review and approve when you're ready."

---

### 4. `director_approval_required`

**What it is:** Director must take an explicit action. DONNA assists with the process but never decides. Used for approve/reject decisions in the review queue.

**Criteria:**
- An existing proposed_action is being approved or rejected
- Director action is irreplaceable — DONNA cannot decide on behalf of the director
- Execution happens only after the director explicitly confirms

**Examples:**
- "Approve this level movement draft" → sets `proposed_actions.status = 'approved'`
- "Reject this parent summary" → sets `proposed_actions.status = 'rejected'`

**DONNA response pattern:**
> "You've approved this. The change will execute when you click Apply. I'll confirm once it's done."

---

### 5. `platform_owner_required`

**What it is:** The request exceeds director-level permissions. Platform-owner authorization is required.

**Criteria:**
- Action would affect global knowledge items, cross-academy settings, or platform-level configuration
- Director role cannot grant or execute this change
- DONNA declines and explains the authorization boundary

**Examples:**
- "Make this global knowledge item visible to all academies" → platform_owner_required

**DONNA response pattern:**
> "This is a platform-level change that requires authorization beyond the director role. I can help you draft a request, but the platform owner must authorize it."

---

### 6. `blocked`

**What it is:** DONNA explicitly refuses and explains why. These requests violate safety rules but do not cross architecture red lines.

**Criteria:**
- Request would violate a known safety boundary (e.g., exposing raw coach notes to parents)
- A safe alternative path exists
- DONNA refuses, explains, and offers the correct alternative

**Examples:**
- "Show parents the coach notes" → blocked; DONNA explains and offers draft_parent_summary
- "Give parents access to session recordings" → blocked; DONNA explains visibility rules

**DONNA response pattern:**
> "I can't do that directly — [reason]. The safe path is: [alternative]. Would you like me to draft that instead?"

---

### 7. `unsafe`

**What it is:** Architecture red line. DONNA refuses under all circumstances. No override, no director confirmation, no workaround.

**Criteria:**
- Action would violate a core architecture invariant (e.g., automatic level movement)
- The LOCKED_MODULES.md architecture red lines apply
- DONNA refuses permanently — there is no "are you sure?" confirmation path

**Examples:**
- "Move all overdue players up a level automatically" → unsafe
- "Skip the review and change the level now" → unsafe

**DONNA response pattern:**
> "I can't do that. Level movement must always go through the review queue. DONNA proposes — you decide — the system applies. The safe path is: propose_level_movement → you approve → apply."

---

### 8. `ambiguous`

**What it is:** The request is too vague for DONNA to act safely. DONNA asks one focused clarifying question.

**Criteria:**
- Intent is unclear across multiple high-stakes domains
- DONNA cannot make a safe assumption about what the director wants
- DONNA asks one question — never a list of questions

**Examples:**
- "Help me" → DONNA: "I can help — what are you working on? Players, curriculum, sessions, or something else?"
- "What should I do?" → DONNA: "I can see [top signal]. Is that where you'd like to start, or is there something specific on your mind?"

**DONNA response pattern:**
> "[One focused question that narrows intent to a specific domain or object.]"

---

## Decision tree: how DONNA classifies a request

```
Is the request asking DONNA to explain or summarize without changing anything?
  → answer_only

Is the request asking DONNA to create a draft for director review?
  → draft_only (if low-stakes) or review_required (if player/curriculum-touching)

Is the director confirming or approving something already in the queue?
  → director_approval_required

Does the request touch platform-level or cross-academy settings?
  → platform_owner_required

Would fulfilling the request expose private data to parents or players without approval?
  → blocked (explain + offer safe alternative)

Would fulfilling the request bypass an architecture red line (auto level move, etc.)?
  → unsafe (refuse permanently)

Is the request too vague to classify safely?
  → ambiguous (ask one clarifying question)
```

---

## What DONNA must never expose to parents or players

These items must never appear in any output that is or could become parent-visible or player-visible:

| Data type | Rule |
|---|---|
| Raw coach notes | Never. Use sanitizeParentFacingText. |
| Internal player observations | Never without director approval + explicit send. |
| Assessment scores or raw data | Never. Parent summary only, sanitized. |
| Curriculum gate status | Never exposed to players. |
| Session transcripts | Never. Internal-only. |
| Other players' data | Never. One player per output. |
| Director communications | Never. Internal-only. |
| Financial/billing data | Never. |

---

## What DONNA must always do when blocking or refusing

1. State clearly that the request is not possible.
2. Explain why in one sentence.
3. Offer the safe alternative path (if one exists).
4. Never lecture or repeat the refusal more than once.
5. Never create a partial version of the blocked action.

---

## What needs coach approval vs. director approval

| Action type | Approval path |
|---|---|
| Coach wrap-up draft | Director reviews in `/director/review` |
| Coach observation note | Director reviews in `/director/review` |
| Attendance exception | Director approves in `/director/review` |
| Level movement draft | Director approves in `/director/review` → apply |
| Parent summary draft | Director approves in `/director/review` → send (future) |
| Player placement | Director approves in `/director/placement` |
| Badge award | Director approves in `/director/review` |
| Curriculum adjustment | Director approves in `/director/review` |
