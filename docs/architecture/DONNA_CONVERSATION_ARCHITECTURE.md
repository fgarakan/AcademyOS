# DONNA Conversation Architecture
Date: June 2026
Status: DECIDED — Roadmap only. No implementation in this sprint.
Sprint: Mega Sprint 2141–2170

---

## Why DONNA Feels Non-Conversational

DONNA's output is deterministic and correct. The infrastructure for real
conversation exists: LLM wiring, multi-turn tool loop, donnaFollowUpResolver.ts.
But conversation requires more than response generation — it requires memory
of what was said before and awareness of where the director is in their workflow.

Three gaps create the non-conversational feeling:

1. No session memory — Each DONNA interaction starts cold. Context is rebuilt
   from scratch every session. DONNA has no knowledge of what the director
   asked or decided yesterday.

2. No workflow continuity — DONNA cannot say "Last time you were reviewing
   coach attendance. Three coaches are still flagged." Workflow state is not
   persisted between sessions.

3. No onboarding state — DONNA cannot guide a director through first-time
   setup because it doesn't track which setup steps are complete. The Today
   setup card shows steps; DONNA cannot narrate them conversationally.

---

## What Exists Today

| Component                  | Status                                |
|----------------------------|---------------------------------------|
| LLM API wiring             | Exists (src/lib/donna/)               |
| Multi-turn tool loop       | Exists                                |
| donnaFollowUpResolver.ts   | Exists — deterministic follow-up      |
| donnaQuickActions.ts       | Exists — pre-defined quick actions    |
| donnaInsightEngine.ts      | Exists                                |
| donnaUIActionDispatcher.ts | Exists                                |
| Session persistence        | Does not exist                        |
| Workflow state persistence | Does not exist                        |
| Onboarding state machine   | Does not exist                        |

---

## Three-Phase Roadmap

### Phase 1 — Conversation Memory

Goal: DONNA remembers what happened in previous director sessions.

Required:
- director_conversation_sessions table: stores session summaries, key
  decisions, workflow state at session close
- Session writer: at end of each DONNA interaction, write a compressed summary
- Session reader: at Today load, inject recent session context into DONNA's brief

Outcome: DONNA can say "Since your last visit, 3 players were placed and 2
approvals resolved."

### Phase 2 — Workflow Guidance

Goal: DONNA tracks active director workflows across sessions.

Rationale: Workflow guidance is the foundational capability. It is the general
case. Onboarding (Phase 3) is one instance of a workflow — a director's first
workflow on a new academy.

Required:
- Workflow state model: a director can have an open workflow (e.g.,
  "conducting player evaluations for this cohort")
- DONNA surface: upcoming workflow step appears in Today brief
- Workflow completion: DONNA acknowledges when a multi-day workflow closes
- Workflow library: a set of named workflows DONNA can initiate and track

Outcome: DONNA becomes a reliable co-pilot across multi-day director
initiatives, not just a daily brief narrator.

### Phase 3 — Guided Onboarding

Goal: DONNA narrates the first-time setup flow as a workflow instance.

Rationale: Once workflow guidance exists (Phase 2), onboarding is simply the
"new academy setup" workflow. No new architecture is required — the onboarding
flow becomes a first-class workflow with its own steps, completions, and
DONNA narration.

Required:
- academy_onboarding_state column or table: tracks completed onboarding milestones
- Onboarding workflow definition: steps, order, DONNA narration per step
- todayBriefEngine.ts integration: DONNA knows which steps are done
  and celebrates completions

Outcome: A new director gets a narrated first week delivered through the same
workflow guidance engine that handles all other multi-day initiatives.

---

## What This Is Not

This roadmap does not describe:
- Open-ended freeform chat with DONNA
- DONNA making autonomous decisions
- External AI API calls without explicit sprint approval

The operating model is unchanged:

  AI proposes → Director approves → System records → System executes

Conversation memory makes DONNA more useful within that model.
It does not change the model.
