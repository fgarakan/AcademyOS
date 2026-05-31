# DONNA Panel God Mode Integration — Sprint 1011

**Date:** 2026-05-31
**Sprint:** 1011
**Status:** Complete

---

## Context: state before Sprint 1011

After Sprint 1010, all God Mode infrastructure was built but not wired to the DONNA panel:

| Sprint | What it built |
|---|---|
| 999 | Live LLM API client — real Anthropic Claude call |
| 1000 | Tool execution loop — deterministic + LLM dispatch |
| 1001 | Multi-turn tool loop — grounded second LLM turn |
| 1002 | Live academy context tools |
| 1003 | Player-specific context tools |
| 1004 | Session context tools |
| 1005–1007 | Usage tracking, aggregation, DB store |
| 1008 | DonnaResponseCard — pure display component |
| 1009 | donnaGuidedAction.ts — client highlight/nav helpers |
| 1010 | donnaOrchestratorAction.ts — server action bridge |

Sprint 1011 wires these together into the existing DONNA panel without creating a new surface.

---

## Integration point

**File:** `src/components/assistant/DonnaAssistantButton.tsx`
**No new files added to the DONNA shell.**
**No duplicate button or panel created.**

---

## Submit flow (after Sprint 1011)

```
handleCommandSubmit(text)
  ↓
[early returns: close phrase, onboarding, attendance, controller drafts, ...]
  ↓
[intent matchers: templates, tasks, review queue, daily brief, attention, follow-up, ...]
  ↓
UI action dispatcher (handleUIDispatch)
  ↓
setIsProcessingCommand(true) + 600ms safety timer
  ↓
handleDonnaCooPrompt(text)          → if handled: cooThread bubble
  ↓ not handled
detectAndHandleCommand(text)        → if handled: commandResponse card
  ↓ not handled
★ God Mode fallback (handleGodModeQuery)
    cancel 600ms timer
    setIsGodModeLoading(true)
    → runDonnaOrchestratorAction() [server action]
        → getAuthorizedContext() [server-side auth — no client trust]
        → orchestrate() [full LLM tool loop]
        → writeUsageEventToDb() [fire-and-forget]
    → setGodModeOutput(result.output)
    → setGodModeHistory(prev + user turn + donna turn)
    finally: setIsGodModeLoading(false) + setIsProcessingCommand(false)
```

All existing deterministic paths are preserved. God Mode only fires if every handler before it passes.

---

## Server action call

`runDonnaOrchestratorAction()` (Sprint 1010):
- `academyId` and `role` always resolved server-side — never from client
- `userInput` max 800 chars, validated
- `pathname` must start with `/`
- Usage event written to `donna_usage_events` (fire-and-forget)
- Returns: `{ ok, output, hadBlockedAttempt, error }`
- `safetyAudit`, `contextSummary`, raw errors NOT returned to client

---

## Response card render path

After `DonnaWorkflowCards` in the panel body:

1. **Loading state** (`isGodModeLoading === true`): DONNA avatar + three pulsing dots + "Thinking…" label
2. **Response state** (`godModeOutput !== null && !isGodModeLoading`): `DonnaResponseCard` with:
   - `onNavigate` → `router.push(route)` + `closePanel()`
   - `onHighlight` → `executeDonnaHighlight({ targetId, route, label }, pathname, router.push)` + `closePanel()`

`DonnaResponseCard` is pure display — it fires callbacks, never navigates itself.

---

## Guided highlight path

`executeDonnaHighlight` (Sprint 1009):

- **Same page** (`highlightTarget.route === pathname`): `setDonnaFocusTarget` → `dispatchEvent('donna:highlight')` → panel closes
- **Cross-page** (`highlightTarget.route !== pathname`): `setDonnaFocusTarget` → `router.push(route)` → panel closes
- Route validation: only `/director`, `/coach`, `/player`, `/parent` prefixes accepted

---

## Fallback behavior

If `runDonnaOrchestratorAction()` returns `ok: false` or throws, `handleGodModeQuery` calls `setCommandResponse` with a safe message: `"DONNA is temporarily unavailable. Please try again."` The existing `commandResponse` card in `DonnaWorkflowCards` renders this — same as any other error response.

---

## isThinking propagation

`isGodModeLoading` is added to the `isThinking` prop on `DonnaInputPanel`. This ensures the panel's input area shows a thinking indicator during the async orchestrator call, matching the existing UX for daily brief, context fetches, and review queue loads.

---

## God Mode history

Up to 10 turns stored in `godModeHistory` (RAM only, never persisted). Passed back to `runDonnaOrchestratorAction` on subsequent queries so the orchestrator has recent conversation context for follow-up questions. History is cleared on panel close.

Content stored per turn:
- `role`: `'user'` or `'donna'`
- `content`: the text (user input or `output.text` — never raw coach/player notes)
- `timestamp`: `Date.now()`
- `outputType`: DONNA's output type (only for donna turns)

---

## No duplicate DONNA surface guarantee

- No new button added
- No new panel component added
- All integration is inside the existing `DonnaAssistantButton`
- `godModeOutput` state is scoped to the existing panel open/close lifecycle
- Panel close clears `godModeOutput`, `isGodModeLoading`, `godModeHistory`

---

## Safety invariants

- No mutations — God Mode is read + answer + highlight + navigate only
- No parent/player communication triggered
- No approval bypass — `approval_gated` outputs show warning in card
- Raw prompts, raw notes, raw IDs never rendered (`DonnaResponseCard` only renders `output.text`)
- `academyId` and `role` never accepted from client

---

## V2 simplification roadmap

Sprint 1025 (DONNA Panel Simplification + Premium Response UI) will:
- Replace the existing legacy `commandResponse` card with `DonnaResponseCard` for all paths
- Unify `cooThread` and `godModeOutput` into a single conversation thread
- Remove the sprint comment noise from the import block
- Apply premium response styling
