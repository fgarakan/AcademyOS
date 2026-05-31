# Sprint 1073 — Page Context Pack Runtime Wiring V1

**Date:** 2026-05-31
**Sprint:** 1073

---

## What was done

Sprint 1072 created the `DonnaContextPack` architecture and 8 initial context packs as pure data. Sprint 1073 wires those packs into `handleDonnaCooPrompt` so page-specific questions are answered from the pack before falling through to the older intent classifier or God Mode.

---

## Change summary

**File:** `src/components/assistant/DonnaAssistantButton.tsx`

**Removed:**
- `isAcademyHealthQuestion()` helper function (Sprint 1071, 22 lines) — now superseded by the generalized pack lookup
- Sprint 1071 hard-coded Academy Health intercept block (~20 lines) — same answer now delivered via the Academy Health context pack

**Added:**
- Import: `getDonnaContextPackForRoute`, `lookupAnswerInContextPack` from `@/lib/donna/donnaContextPackRegistry`
- Generalized context-pack lookup block at the top of `handleDonnaCooPrompt` (~15 lines)

Net diff: ~27 lines removed, ~17 lines added.

---

## Runtime answer stack (post-Sprint 1073)

```
Director sends text (typed or voice)
        │
        ▼
handleCommandSubmit / handleVoiceTranscript
        │
        ├── handleUIDispatch → dispatchUIIntent
        │       ↳ navigation commands ("open approvals") → router.push()  ← FAST
        │       ↳ blocked phrases → refusal message
        │       ↳ returns false for unknown commands
        │
        └── handleDonnaCooPrompt(text)
                │
                ├── [1] Context pack lookup                                ← NEW (Sprint 1073)
                │       getDonnaContextPackForRoute(pathname)
                │       lookupAnswerInContextPack(pack, text)
                │       ↳ match → setCommandResponse, cooThread, speakDonna, recordTurn → return true
                │       ↳ no match → continue
                │
                ├── [2] routeDonnaPrompt → intent classifier               ← existing
                │       ↳ answer_directly → return false
                │       ↳ use_kpi_answer / use_page_context / etc → compose → return true
                │
                └── returns false
                        │
                        └── detectAndHandleCommand → legacy nav commands
                                └── handleGodModeQuery → LLM orchestrator  ← slowest
```

---

## Why context-pack lookup is at position [1]

- **Speed:** pack answers are pure TypeScript data — zero latency, no classifier, no LLM
- **Specificity:** pack answers are page-scoped — only fire when the director is on the matching route
- **Reliability:** deterministic triggers, never ambiguous
- **No interference:** navigation commands reach `handleUIDispatch` before `handleDonnaCooPrompt`, so "open approvals" can never match a context-pack answer

---

## Why the Sprint 1071 intercept was removed

The Sprint 1071 `isAcademyHealthQuestion()` + hard-coded answer were a targeted patch for one page. The Academy Health context pack (Sprint 1072) contains the same triggers and the same answer text. Running both would create two parallel code paths that could diverge in future sprints. The generalized lookup is cleaner, covers 8 pages, and produces the same output.

---

## TopicDomain mapping

`recordTurn` requires a `TopicDomain` from the `donnaChatSessionMemory` union:
```
'session' | 'wrap_up' | 'players' | 'review_queue' | 'academy_health' | 'curriculum' | 'templates' | 'general'
```

Context-pack answers use `'general'` as the domain. The page context is preserved in `commandResponse.label` (set to `pack.pageName`). A future sprint can add `'context_pack'` to the union if granular session memory tracking per pack is needed.

---

## Pages now answering from context packs

| Page | Route | Example triggers now handled |
|---|---|---|
| Today | `/director` | "What needs my attention?", "What should I focus on first?" |
| Approvals | `/director/review` | "What should I review first?", "Approve vs. apply difference" |
| Academy Health | `/director/kpi` | "Tell me about the health of my academy", "How is my academy doing?" |
| Fitness Builder | `/director/fitness/templates/<id>` | "Make this more game-based", "What does a load flag mean?" |
| Class Builder | `/director/class-templates/<id>` | "What blocks should this template have?", "Session flow check?" |
| Players | `/director/players` | "Which players need attention?", "Who is missing a level?" |
| Sessions | `/director/sessions` | "Which sessions are missing wrap-ups?", "How do I create a session?" |
| Parent Updates | `/director/parents` | "What can I include in a parent update?", "After approval workflow" |

---

## Fallback preserved

If `lookupAnswerInContextPack` returns `null` (no trigger match), `handleDonnaCooPrompt` continues exactly as before:
1. `routeDonnaPrompt` classifies the intent
2. If `answer_directly`, returns `false` → `detectAndHandleCommand` → God Mode
3. All other response modes continue through existing compose/render path

---

## Safety invariants

- No schema changes, no migrations
- No record mutations
- Navigation commands unchanged (handled upstream by `handleUIDispatch`)
- `proposed_actions` pipeline untouched
- Role boundaries untouched
- Sprint 1071 nav fixes (`donnaUIActionDispatcher.ts`) unchanged
- Sprint 1072 context pack data unchanged
