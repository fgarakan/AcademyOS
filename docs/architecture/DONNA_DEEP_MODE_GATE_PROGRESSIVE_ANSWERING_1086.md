# Sprint 1086 — DONNA Deep Mode Gate + Progressive Answering V1

**Date:** 2026-06-01
**Sprint:** 1086

---

## Problem

After Sprints 1080–1084 improved token efficiency, deep multi-tool requests could still trigger Tier 5/6 God Mode automatically. A director typing "audit the whole academy" would immediately fire `callDonnaLlm` + `runLiveToolExecutionLoop` (possibly twice) with no warning and no confirmation.

---

## Solution

A two-part implementation:

1. **`donnaDeepModeGate.ts`** — detection + progressive response builder (pure TypeScript, no DB)
2. **`DonnaAssistantButton.tsx`** — 18-line gate in `handleCommandSubmit` just before `handleGodModeQuery`

---

## Request Flow (post-Sprint 1086)

```
handleCommandSubmit
    │
    ├── handleDonnaCooPrompt
    │    ├── [1073] context-pack lookup          ← Tier 1
    │    ├── [1077] action-registry intercept     ← Tier 2
    │    └── routeDonnaPrompt                     ← Tier 3
    │
    ├── detectAndHandleCommand (legacy)           ← Tier 0/3
    │
    ├── [1086] Deep Mode Gate                     ← NEW
    │    isDeepModeRequest(text)?
    │    ├── YES → buildDeepModeFirstPassResponse
    │    │          setCommandResponse + cooThread
    │    │          speakDonna + recordTurn
    │    │          return (God Mode NOT called)
    │    └── NO  → continue
    │
    └── handleGodModeQuery                        ← Tier 4–6 (normal queries)
```

---

## Deep Mode Detection

### `isDeepModeRequest(text)` — `donnaDeepModeGate.ts`

Uses two guard layers:

**1. Exclusion guard (runs first — never triggers gate for these patterns):**
```
^(how is|tell me about|explain|what is|what are|show me|open|go to)
health of (my|the|this) academy
what needs attention
what should i (do|focus|check|look at)
make this (more ...)
^(why|who|when|where|which)
```

**2. Deep Mode patterns (only checked if exclusion guard passes):**

| Pattern category | Examples |
|---|---|
| Academy-wide audit | "audit the whole academy", "audit the academy" |
| All-players analysis | "analyze all players", "analysis of all coaches" |
| Find every gap | "find every gap", "find every curriculum gap", "all gaps" |
| Full/complete/deep analysis | "full diagnosis", "complete analysis", "deep dive", "thorough review" |
| Comprehensive review | "comprehensive review", "in-depth assessment", "comprehensive audit" |
| Compare all coaches | "compare all coaches", "coaching performance analysis" |
| Full strategy/plan | "full parent communication strategy", "complete plan" |
| Everything scope | "everything about my academy", "all the data" |
| Academy-wide scope | "academy-wide analysis", "whole academy" |

---

## Progressive Response

`buildDeepModeFirstPassResponse(text, pathname)` produces a 3-part response:

1. **Quick read** — grounded, page-aware first answer using visible/known signals:
   - Players context: time in level, absences, advancement eligibility
   - Coaches context: wrap-up coverage, observation frequency
   - Curriculum context: template-level mapping, curriculum gaps
   - Parent comms: update cadence, approval queue
   - Strategy: 5 key dimensions (players, coaches, curriculum, comms, review queue)

2. **Transparency note** — explains that a deeper analysis queries multiple data sources and takes longer

3. **Confirmation ask** — "Want me to run the deeper analysis? Say 'yes, go deep' or ask the specific question."

---

## What Does NOT Trigger the Gate

These pass straight through to their normal handlers:

| Input | Handler |
|---|---|
| "how is my academy?" | routeDonnaPrompt → `dashboard_priority` |
| "tell me about academy health" | context-pack (Sprint 1073) |
| "what needs attention?" | handleFetchAttention (Sprint 370) |
| "open approvals" | handleUIDispatch → navigation |
| "make this fitness template more game-based" | action-registry (Sprint 1077) |
| "explain this KPI" | routeDonnaPrompt → `use_kpi_answer` |
| "draft a parent update" | handleUIDispatch → resolveDraftIntent |
| Any question < 20 chars | God Mode (too short to be deep) |

---

## Safety Invariants

- Deep Mode is NOT auto-executed — the gate returns a first-pass response and waits
- When director confirms ("yes, go deep"), the follow-up typed input goes through the normal flow and reaches God Mode — no new special path needed
- No mutations, no DB writes, no schema changes
- All Sprint 1073/1077/1080–1084 changes preserved
