# Sprint 1077 — DONNA Action Registry Runtime Wiring V1

**Date:** 2026-05-31
**Sprint:** 1077

---

## What was done

Sprint 1076 created the `DonnaActionRegistry` as pure data. Sprint 1077 wires `matchDonnaActionIntent` into `handleDonnaCooPrompt` as a pre-classifier for non-navigation actions, positioned after the context-pack lookup and before `routeDonnaPrompt`.

---

## Runtime Answer Stack (post-Sprint 1077)

```
Director sends text (typed or voice)
        │
        ▼
handleCommandSubmit / handleVoiceTranscript
        │
        ├── [existing] handleUIDispatch → dispatchUIIntent
        │       ↳ navigation commands ("open approvals") → router.push()  ← FAST, unchanged
        │       ↳ blocked phrases → refusal message
        │       ↳ returns false for unknown commands
        │
        └── handleDonnaCooPrompt(text)
                │
                ├── [1073] Context pack lookup                             ← page-specific, unchanged
                │       getDonnaContextPackForRoute(pathname)
                │       lookupAnswerInContextPack(pack, text)
                │       ↳ match → response → return true
                │       ↳ no match → continue
                │
                ├── [1077] Action registry pre-classifier                  ← NEW
                │       matchDonnaActionIntent(text, uiActionRole)
                │       if action found AND category !== 'navigation':
                │           ↳ confirmationMessage or safetyMessage
                │           ↳ responseType = requiresApproval ? 'honest' : 'info'
                │           ↳ setCommandResponse, cooThread, speakDonna, recordTurn
                │           ↳ return true
                │       ↳ no match → continue
                │
                ├── [existing] routeDonnaPrompt → intent classifier
                │       ↳ answer_directly → return false
                │       ↳ use_kpi_answer / use_page_context / etc → compose → return true
                │
                └── returns false
                        └── detectAndHandleCommand → legacy nav
                                └── handleGodModeQuery → LLM orchestrator
```

---

## Why After Context-Pack, Before routeDonnaPrompt

**After context-pack:** Context packs provide richer, page-specific answers. On `/director/kpi`, "explain academy health" → context pack fires with the full three-signal answer. The action registry would give only the action's `safetyMessage`. Context pack wins by position.

**Before routeDonnaPrompt:** `routeDonnaPrompt` classifies unknown intents as `answer_directly` which causes `handleDonnaCooPrompt` to return `false` and fall to God Mode. The action registry intercepts known intents (like "suggest level movement") before they unnecessarily reach the LLM.

---

## Actions Wired

### Explanation category (low risk, `responseType: 'info'`)

| Action | Trigger example | Response source |
|---|---|---|
| `explain_academy_health` | "tell me about the health of my academy" (off KPI page) | `safetyMessage` |
| `make_fitness_template_game_based` | "make this more game-based" (off builder page) | `safetyMessage` |

Note: On their home pages (KPI page, fitness builder), context-pack answers fire first and are richer. Registry answers these cross-page.

### Review category (low risk, `responseType: 'info'`)

| Action | Trigger example | Response source |
|---|---|---|
| `review_approvals` | "review approvals" | `confirmationMessage` |

### Draft category (medium risk, `responseType: 'honest'`)

| Action | Trigger example | Response source |
|---|---|---|
| `create_session_adjustment_draft` | "session adjustment", "propose session adjustment" | `confirmationMessage` |

Note: `draft_parent_update`, `create_class_template`, `create_fitness_template` are already handled by `handleUIDispatch` → `resolveDraftIntent` before reaching this path.

### Mutation_request category (high risk, `responseType: 'honest'`)

| Action | Trigger example | Response source |
|---|---|---|
| `suggest_level_movement` | "move this player up", "suggest level movement" | `blockedMessage` — explains DONNA only produces a proposal, never moves records |

---

## Actions NOT Wired (navigation category skipped)

All `category === 'navigation'` actions are explicitly skipped:
```typescript
if (registryAction && registryAction.category !== 'navigation') { ... }
```

These are handled upstream by `handleUIDispatch` → `dispatchUIIntent` and never reach `handleDonnaCooPrompt`.

---

## Response Type Rules

| Risk level | requiresApproval | responseType | Visual |
|---|---|---|---|
| low | false | `'info'` | Blue info card |
| medium/high | true | `'honest'` | Orange honest/approval card |

Using `'honest'` for approval-required actions surfaces the approval requirement visually — directors see it's not auto-executing.

---

## Safety Invariants Preserved

- Navigation commands ("open approvals") still handled exclusively by `handleUIDispatch`
- Context-pack answers still fire before registry (position guards page-specific priority)
- `routeDonnaPrompt` / God Mode still receive all unmatched prompts
- No mutations, no `proposed_actions` writes, no parent messages sent
- `suggest_level_movement` explicitly uses `blockedMessage` (references the Level Up review queue)
- Sprint 1075 academy profile in orchestrator unchanged
- Sprint 1073 context-pack wiring unchanged
- Sprint 1071 navigation fixes unchanged
