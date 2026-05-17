---
name: academy-os-donna-integration-guard
description: Guards DONNA integration points in AcademyOS. Use before any sprint that adds DONNA commands, expands DONNA data access, changes DONNA response behavior, or adds AI-generated content to any portal. Prevents DONNA from implying certainty from insufficient data, bypassing the review queue, or operating outside its role-scoped boundaries.
---

# AcademyOS DONNA Integration Guard

## Purpose

DONNA is the AI operating layer of AcademyOS. Her operating contract is:

> DONNA proposes. Director reviews. System executes.

DONNA is not an AI that takes action. She is a structured intelligence layer that surfaces signals, drafts proposals, and routes them to humans for approval. This skill ensures every DONNA integration point respects that contract.

---

## When to Use

Use this skill before any sprint that:

- Adds a new DONNA command type to `donnaCommandRouter.ts`
- Adds new AI-generated content to any portal view
- Changes how DONNA presents confidence, source, or status
- Adds DONNA to the coach portal (`/coach`)
- Expands DONNA's data access (new tables, new query scopes)
- Changes what DONNA can draft (parent updates, level signals, wrap-ups)
- Modifies the `kpiNextBestActionMap.ts` next best actions
- Adds DONNA TTS, voice, or realtime features

---

## DONNA Operating Contract

### What DONNA can do

- Surface live counts from `proposed_actions`, `sessions`, `players`
- Match typed or spoken commands to predefined response chips (V1: deterministic, not AI inference)
- Create a `proposed_action` in the review queue (`pending_review` status)
- Surface Academy Health signals with source and confidence
- Draft coach wrap-up structure from voice intake
- Draft parent update content for director review
- Show "what needs attention today?" with prioritized context

### What DONNA must never do

- Execute any mutation without a `proposed_action` entry
- Bypass the director review queue for any change
- Show data from another academy (not scoped to `academy_id`)
- Imply certainty from insufficient data — always disclose data quality
- Auto-send parent communications
- Auto-move player levels
- Auto-apply curriculum changes
- Infer when deterministic pattern matching is available (V1 is deterministic first)

---

## Honest Data Disclosure

DONNA must classify the quality of every data signal she presents:

| Status | Meaning | UI Treatment |
|---|---|---|
| `live` | Real data, sufficient for the signal | No qualifier needed |
| `partial` | Some data present, some missing | Show "Partial data" label |
| `insufficient_data` | Too few records to compute reliably | Show "Not enough data yet" |
| `no_data` | No records exist for this signal | Show empty state |
| `blocked_by_rls` | RLS prevents access (user lacks permission) | Show "Access restricted" |
| `blocked_by_schema` | Table or column does not exist yet | Show "Coming soon" |
| `demo` | Sandbox/demo data only | Show "Demo" badge |
| `draft` | AI-generated, not yet reviewed | Show "Draft — needs review" |

DONNA must never make `demo` data feel `live`. Never use present-tense confident language for `insufficient_data` or `draft` statuses.

---

## Role-Aware DONNA Separation

### Director DONNA (`/director`)

Can surface:
- Academy Health with source and confidence
- Review queue items with urgency and next action
- Coach wrap-up drafts
- Parent update drafts
- Player risk signals
- Curriculum builder guidance
- Academy-wide priorities

### Coach DONNA (`/coach`)

Can surface:
- Session plan and context
- Wrap-up priority (their session only)
- Player observations for their players
- Coach-safe session notes
- Follow-up suggestions

Must never surface:
- Academy-wide approval power
- Parent send actions
- Level movement controls
- Curriculum mutation tools
- Full review queue approval interface
- Director-only KPI intelligence

---

## `NEVER_AUTOMATIC` Integrity

`src/lib/voice/structureVoiceIntake.ts` contains `NEVER_AUTOMATIC: string[]` — the list of behaviors DONNA must never automate.

Before any sprint that touches voice intake or DONNA:

1. Read `NEVER_AUTOMATIC` and confirm the new behavior is not in the list
2. If the new behavior should be in the list, add it before implementing
3. Never remove items from `NEVER_AUTOMATIC` without explicit approval from Farshad

---

## `kpiNextBestActionMap` Copy Rules

Next best action CTAs in `kpiNextBestActionMap.ts` must:

- Use action verbs that describe what the director actually does: "View wrap-up queue", "Open review queue", "Review draft"
- Never imply an automated action: "Send reminder", "Auto-approve", "Apply change"
- Never suggest an action that requires infrastructure that does not exist yet

---

## Command Routing Integrity

Every command type in `donnaCommandRouter.ts` must include:

- `intent` — what the user said
- `routingNote` — why this route is safe and what it does
- `isReadOnly: true` if no mutation is involved
- `proposedActionType` if a `proposed_action` is created
- `responseType` — one of `answer`, `draft`, `alert`, `redirect`

---

## Pre-Sprint Checklist

1. Does the new DONNA feature create a `proposed_action` for any mutation?
2. Does DONNA correctly disclose data quality status for every signal?
3. Does coach DONNA avoid exposing director-only intelligence?
4. Does the new command type include a `routingNote`?
5. Does the new CTA copy use an internal action verb (not "send", "auto-apply")?
6. Does the new feature touch `NEVER_AUTOMATIC`? If so, is the list updated?
7. Is V1 deterministic pattern matching used instead of AI inference where possible?
8. Does DONNA correctly label demo/draft content as distinct from live data?

---

## Hard Stop Conditions

Stop and ask before proceeding if a sprint would:

- Add a DONNA command that executes a mutation without a `proposed_action` entry
- Allow DONNA to send parent communications automatically
- Allow DONNA to move players between levels automatically
- Remove or weaken `NEVER_AUTOMATIC`
- Show live data as confident when actual status is `insufficient_data` or `draft`
- Give coach DONNA access to the director review queue approval interface
- Add AI inference to a flow that can be handled deterministically in V1

---

## AcademyOS-Specific Rules

- `DONNA_PUBLIC_NAME` constant — never hardcode "DONNA" in component text; always use this constant.
- All DONNA response chips must include a `responseType` field.
- V1 DONNA is deterministic-first. AI inference is reserved for structuring voice intake only.
- The director command center (`/director/command-center`) is a DONNA interface, not an admin panel. It does not bypass the review queue.
- `api/donna/attention` and `api/donna/brief` both require authentication — never make them public.

---

## Commit Rule

```bash
git commit -m "Sprint XXX — Sprint Name"
```

Single line only. No `Co-Authored-By`. No AI attribution.

---

## Required Output Format

```
## DONNA Integration Guard Report — Sprint XXX

**Surface:** [director / coach / both]
**proposed_actions pipeline:** [all mutations create a PA / flag: what bypasses]
**Data quality disclosure:** [all signals labeled / flag: what is unlabeled]
**Role-aware separation:** [coach DONNA scoped correctly / flag: what leaks]
**NEVER_AUTOMATIC integrity:** [unchanged / flag: what was removed or violated]
**Command routing integrity:** [all routes have routingNote / flag: which are missing]
**CTA copy rules:** [all CTAs use internal action verbs / flag: which imply sends]
**Deterministic-first:** [V1 uses pattern matching / flag: where AI is used unnecessarily]

**Hard stops triggered:** [none / list]

**Verdict:** CLEAR / HOLD — [reason if hold]
```
