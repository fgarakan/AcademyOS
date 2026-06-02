# DONNA Global Command Layer Architecture

**Sprint:** Mega Sprint 1141-1155
**Date:** 2026-06-02

## Summary

The DONNA Global Command Layer makes DONNA the primary interface to AcademyOS complexity. Users ask any natural language question; DONNA routes it to a structured, evidence-backed, role-safe answer with proposed actions.

## Core philosophy

> AcademyOS should feel like Google + ChatGPT for academy operations.
> Users should not need to know where things live — they ask DONNA.

## Pipeline

```
User question
  → classifyDonnaIntent()          [deterministic, 30+ intents]
  → data fetch (scoped by intent)  [server-side, RLS enforced]
  → answer generation              [deterministic or role-aware summary]
  → buildEvidenceSummary()         [evidence points + missing evidence]
  → getProposedActions()           [risk-classified, max 3]
  → buildFollowUpQuestions()       [follow-up chips]
  → command logging                [donna_events table, best-effort]
  → return DonnaCommandResult
```

## Component files

| File | Purpose |
|---|---|
| `src/lib/donna/donnaGlobalIntentRouter.ts` | Classifies questions into 30+ intents across 8 categories |
| `src/lib/donna/donnaActionProposalEngine.ts` | Risk-classifies actions: low/medium/high |
| `src/lib/donna/donnaEvidenceSynthesizer.ts` | Assembles evidence points for each intent |
| `src/app/director/_actions/donnaGlobalCommandAction.ts` | Server action orchestrating the full pipeline |
| `src/components/donna/DonnaCommandBar.tsx` | Global command bar UI (client) |
| `src/components/donna/DonnaResultCards.tsx` | Six result card types |

## Intent categories (8)

1. **player_status** — summarize, readiness, blockers, progress, missions, parent summary
2. **assessment** — due, overdue, submitted, start, compare
3. **placement** — explain recommendation, pending, overrides
4. **level_readiness** — candidates, blockers, create review
5. **coach_workflow** — today sessions, watch-fors, missing wrap-ups
6. **parent_communication** — pending updates, draft update
7. **academy_health** — attention, stalled players, curriculum gaps, missing data
8. **navigation_action** — go to page, assign mission

## Action risk classification

| Risk | Type | Behavior |
|---|---|---|
| low | navigate, filter, expand | Execute immediately |
| medium | create_draft, start_workflow | Creates proposed_action in review queue |
| high | approval_required | Always routes to Approvals — never auto-executes |

## Evidence layer

Every answer includes:
- Evidence points: source, label, detail, strength (strong/moderate/weak)
- Missing evidence: what's missing, why it matters, how to resolve
- Overall strength assessment

If no evidence: "I can't answer this because X is missing. Next step: Y."

## Role safety

| Role | What DONNA shows |
|---|---|
| Director/head_coach | Full operational data + evidence |
| Coach | Assigned players, watch-fors, missions — no parent comms |
| Parent | Parent-safe summary only — no scores, no coach notes |
| Player | Mission, journey, encouragement — no assessment detail |

## Command logging

Commands are logged to `donna_events` table (best-effort, non-blocking):
- user_id, role, academy_id, route, intent, confidence
- question (first 200 chars), answer summary (first 200 chars)
- player_id if player context, proposed action
- High-risk proposals also write to `audit_logs`

## Result card types

1. `PlayerResultCard` — name, level, status, next action
2. `ReviewResultCard` — type, title, why it matters, risk, href
3. `AssessmentResultCard` — player, due/overdue/submitted, action
4. `PlacementResultCard` — recommended level, confidence, decision state
5. `LevelReadinessResultCard` — readiness state, gate progress
6. `ParentUpdateResultCard` — player, status, updated date

## Follow-up questions

Each intent generates 2-3 follow-up question chips shown below the answer.
These make DONNA feel conversational rather than static.

## V1 limitations

- Deterministic answers only for structured intents (no LLM call)
- Freeform questions fall back to academy health summary + navigation links
- `donna_events` table must exist for command logging (graceful fallback if not)
- Page context is passed as a string — deep entity context (e.g. specific session details) is not yet fetched
