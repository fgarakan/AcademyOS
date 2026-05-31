# Sprint 1072 — DONNA Context Pack Architecture V1

**Date:** 2026-05-31
**Sprint:** 1072

---

## Problem

Sprint 1071 fixed three specific DONNA gaps (academy health answer, approvals navigation, voice status) with targeted patches. But the underlying problem remained: DONNA context is scattered across four parallel systems with no shared standard. Every new page-specific answer requires a different patch in a different file.

This sprint creates the scalable architecture so future DONNA page-awareness is additive data, not code changes.

---

## Existing Context Architecture (pre-1072)

Four parallel systems, no shared interface, no unified source of truth:

| System | File | Used by | Gaps |
|---|---|---|---|
| Page Context Registry | `src/components/assistant/donnaPageContextRegistry.ts` | `DonnaAssistantButton` context card and chips | No metrics, no Q&A pairs, no commands, no role scope |
| Page Capability Map | `src/lib/donna/donnaPageContextEngine.ts` | `composePageContextAnswer()` | No metrics, no Q&A, no commands, no navigation graph |
| Chip Registry | `src/lib/donna/donnaPageChipRegistry.ts` | `DonnaPanelPageChips` | Isolated — not connected to other context systems |
| Per-entity packages | `academyHealthContextPackage.ts`, `contextPackages.ts`, etc. | Answer engines | Entity-scoped, not page-scoped |

---

## New: DonnaContextPack Standard

### File

`src/lib/donna/donnaContextPackRegistry.ts`

Pure TypeScript, no DB, no API. Safe to import from any client or server context.

### Interfaces

```typescript
export type DonnaContextPackRole =
  | 'academy_director' | 'head_coach' | 'coach' | 'player' | 'parent'

export interface DonnaContextPackAnswer {
  triggers: string[]      // case-insensitive substring triggers
  response: string        // DONNA's response (markdown supported)
  nextStepHref?: string
  nextStepLabel?: string
}

export interface DonnaContextPackNeverDoRule {
  action: string  // what is forbidden
  reason: string  // why — product or safety rationale
}

export interface DonnaContextPack {
  route: string
  pageName: string
  roles: DonnaContextPackRole[]
  pagePurpose: string
  availableData: string[]          // what the server component actually renders
  keyMetrics: Array<{ id: string; label: string; description: string }>
  commonQuestions: string[]
  commonCommands: Array<{ phrase: string; action: string; route?: string }>
  safeActions: string[]
  approvalRequiredActions: string[]
  neverDoRules: DonnaContextPackNeverDoRule[]
  relatedRoutes: Array<{ label: string; route: string }>
  exampleAnswers: DonnaContextPackAnswer[]
  missingDataFallback: string
}
```

### Key design principles

- `availableData`: only things actually rendered server-side. Never speculate.
- `keyMetrics`: what a director would ask DONNA to explain — maps to visible numbers.
- `exampleAnswers`: direct Q&A pairs. Never fake numeric data. Never claim to know DB values.
- `neverDoRules`: each rule has an explicit `reason` so future guards can produce precise refusals.
- `missingDataFallback`: honest. Never implies data exists when not yet loaded.

---

## Initial Context Packs (Sprint 1072)

| Page | Route | Role | Key Q&A | Notes |
|---|---|---|---|---|
| Today | `/director` | academy_director | "What needs my attention?" | Daily command center |
| Approvals | `/director/review` | academy_director | "Approve vs. apply explained", "What should I review first?" | Highest safety stakes |
| Academy Health | `/director/kpi` | academy_director | "Tell me about the health of my academy" | Formalises Sprint 1071 intercept |
| Fitness Builder | `/director/fitness/templates/[templateId]` | director, head_coach | "Make this more game-based", "What does a load flag mean?" | Dynamic route |
| Class Builder | `/director/class-templates/[templateId]` | director, head_coach | "What blocks should this template have?", "Session flow check" | Dynamic route |
| Players | `/director/players` | director, head_coach | "Which players need attention?", "Who is missing a level?" | |
| Sessions | `/director/sessions` | director, head_coach | "Which sessions are missing wrap-ups?", "How do I create a session?" | |
| Parent Updates | `/director/parents` | academy_director | "What can I include?", "After approval workflow" | Most never-do rules |

---

## Lookup Helpers

### `getDonnaContextPackForRoute(pathname)`

Resolution order:
1. Exact match (`/director/kpi` → Academy Health)
2. Dynamic segment match (`/director/fitness/templates/<uuid>` → Fitness Builder by prefix + depth)
3. `null` for unknown routes — callers fall back to existing `donnaPageContextEngine`

### `lookupAnswerInContextPack(pack, prompt)`

Case-insensitive substring match against each answer's `triggers` array. Returns first match or `null`. Designed for future wiring in `handleDonnaCooPrompt` before the intent classifier.

---

## What Is Intentionally NOT Wired in This Sprint

- Context packs are **data only** — no routing behavior changes.
- `handleDonnaCooPrompt` still uses the existing intent classifier. Context pack Q&A is available but not yet checked there.
- The existing `donnaPageContextRegistry.ts` and `donnaPageContextEngine.ts` are untouched.
- No chips, nav, or orchestrator changes.
- No DB queries, no server actions.

---

## Future Wiring (Sprint 1073+)

When ready to wire:
1. In `handleDonnaCooPrompt`, add before `routeDonnaPrompt()`:
   ```typescript
   const pack = getDonnaContextPackForRoute(pathname)
   if (pack) {
     const answer = lookupAnswerInContextPack(pack, text)
     if (answer) {
       // setCommandResponse, speakDonna, setCooThread
       return true
     }
   }
   ```
2. The `missingDataFallback` field can replace hard-coded fallback strings in the orchestrator.
3. `keyMetrics` can populate DONNA's context packet sent to the LLM.
4. `neverDoRules` can drive structured refusal responses when blocked patterns are detected.
5. `relatedRoutes` can power "from here you can also go to…" navigation suggestions.

---

## Relationship to Existing Systems

```
Director question
        │
        ▼
handleDonnaCooPrompt
        │
        ├── [future: getDonnaContextPackForRoute → lookupAnswerInContextPack]  ← Sprint 1072 data
        │       fast, deterministic, zero-latency
        │
        ├── routeDonnaPrompt → intent classifier                              ← existing
        │       medium speed, template responses
        │
        └── handleGodModeQuery → LLM orchestrator                            ← existing
                slowest, most capable, LLM-powered
```

Context packs sit at the top of the stack: the fastest, most accurate, zero-latency path.

---

## Safety Invariants Preserved

- No schema changes, no migrations.
- No record mutations — pure read/display data.
- `proposed_actions` pipeline untouched.
- Role boundaries untouched.
- All Sprint 1071 fixes preserved.
- All builder sprints (1061–1070) untouched.
