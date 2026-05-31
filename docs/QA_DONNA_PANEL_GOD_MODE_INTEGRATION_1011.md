# QA Checklist — DONNA Panel God Mode Integration (Sprint 1011)

**Date:** 2026-05-31
**Sprint:** 1011

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes with zero errors before commit
- [ ] No new `as any` introduced in sprint files
- [ ] `OrchestratorOutput` import resolves from `@/lib/donna/llmOrchestration/types`
- [ ] `ConversationTurn as OrchestratorTurn` import resolves
- [ ] `DonnaResponseCard` import resolves from `@/components/donna/DonnaResponseCard`
- [ ] `runDonnaOrchestratorAction` import resolves from `@/app/director/_actions/donnaOrchestratorAction`
- [ ] `executeDonnaHighlight` import resolves from `@/lib/donna/llmOrchestration/donnaGuidedAction`
- [ ] No TS errors in DonnaAssistantButton.tsx sprint edits

---

## Submit flow checklist

- [ ] Submitting a recognized COO phrase (e.g. "show daily brief") does NOT reach God Mode
- [ ] Submitting a known command (e.g. "create session") does NOT reach God Mode
- [ ] Submitting an unrecognized phrase (e.g. "how many players advanced this month?") reaches `handleGodModeQuery`
- [ ] `isProcessingCommand` is set to `true` before entering the God Mode path
- [ ] The 600ms `processingClear` timer is cancelled before `handleGodModeQuery` is called
- [ ] `setTypedText('')` fires after the fallback path (input cleared regardless of God Mode)
- [ ] `focusDonnaInput()` fires after the fallback path (input refocused)

---

## Loading state checklist

- [ ] `isGodModeLoading` starts as `false`
- [ ] `isGodModeLoading` becomes `true` immediately when `handleGodModeQuery` is called
- [ ] DONNA avatar + three pulsing dots + "Thinking…" appear in panel while loading
- [ ] `isThinking` prop on `DonnaInputPanel` is `true` during `isGodModeLoading`
- [ ] Loading indicator disappears when response arrives
- [ ] Loading indicator disappears when error occurs

---

## Response card checklist

- [ ] `DonnaResponseCard` renders when `godModeOutput !== null && !isGodModeLoading`
- [ ] Card shows correct output type badge (answer / recommend / highlight / explain / draft / review / clarify)
- [ ] Card shows DONNA avatar "D" in lime circle
- [ ] Card shows response text from `output.text`
- [ ] Card shows confidence badge (high / medium / low)
- [ ] Card shows safety badge when `safetyLevel === 'review_only'` or `'approval_gated'`
- [ ] Card shows approval gate warning block when `safetyLevel === 'approval_gated'`
- [ ] Card shows "AI" label when `source === 'llm_inferred'`
- [ ] Card does NOT render when panel is closed (godModeOutput cleared)

---

## Guided highlight checklist

- [ ] When `output.highlightTarget` is present, "Focus: [label]" button appears in card
- [ ] Clicking "Focus" calls `onHighlight(targetId, route, label)`
- [ ] `executeDonnaHighlight` is called with `{ targetId, route, label }`, `pathname`, and `router.push`
- [ ] Same-page highlight: `setDonnaFocusTarget` fires + `donna:highlight` event dispatched
- [ ] Cross-page highlight: `setDonnaFocusTarget` fires + `router.push(route)` called
- [ ] Panel closes after highlight action (`closePanel()` called)
- [ ] External routes (http://, // prefix) are rejected silently

---

## Navigation checklist

- [ ] When `output.suggestedRoute` is present, "Go to [page]" button appears in card
- [ ] Clicking "Go to X" calls `onNavigate(route)`
- [ ] `router.push(route)` fires
- [ ] Panel closes after navigation (`closePanel()` called)
- [ ] `route_to_review` type shows "Go to Review Queue" button

---

## Fallback checklist

- [ ] If `result.ok === false`, `setCommandResponse` is called with safe message
- [ ] If `orchestrate()` throws, catch block fires `setCommandResponse` with safe message
- [ ] Fallback message: "DONNA is temporarily unavailable. Please try again."
- [ ] `commandResponse` card renders in `DonnaWorkflowCards` for error fallback
- [ ] No raw error message, stack trace, or DB error exposed to user
- [ ] `isGodModeLoading` clears in both success and error paths (finally block)
- [ ] `isProcessingCommand` clears in both success and error paths (finally block)

---

## No duplicate button/panel checklist

- [ ] Only one DONNA button exists in the director layout
- [ ] Only one DONNA panel renders at a time
- [ ] No new `DonnaAssistantButton` component created
- [ ] No new panel wrapper component created
- [ ] `godModeOutput` state lives inside existing `DonnaAssistantButton`

---

## Voice regression checklist

- [ ] Voice transcript path (`handleVoiceTranscript`) is NOT changed
- [ ] Voice chips still appear on voice-supporting pages
- [ ] Voice-to-action routing still works (voice → `handleCommandSubmit`)
- [ ] Voice onboarding flow is NOT changed
- [ ] `useDonnaRealtimeVoice` hook is NOT changed
- [ ] Voice permission error state is NOT changed

---

## Existing chip/mode regression checklist

- [ ] Page-aware chips still render
- [ ] Guide / Explain / Find modes still work
- [ ] Template creation mode still works
- [ ] Generic draft panel still works
- [ ] COO thread bubbles still render for COO router responses
- [ ] Daily brief still loads and renders
- [ ] Attention report still loads and renders
- [ ] Review queue still opens from DONNA panel
- [ ] Action preview card (Sprint 704) still renders

---

## Safety checklist

- [ ] No DB mutation occurs from God Mode path
- [ ] No `proposed_actions` record created by God Mode
- [ ] No parent/player communication sent
- [ ] No player level changed
- [ ] No session roster changed
- [ ] No curriculum record changed
- [ ] Approval-gated responses show warning, never auto-apply
- [ ] `academyId` never accepted from client (resolved server-side in Sprint 1010 action)
- [ ] `role` never accepted from client
- [ ] `godModeHistory` stores only sanitized `output.text` — not raw notes or prompts

---

## Parent/player exposure checklist

- [ ] `DonnaResponseCard` does not render raw coach notes
- [ ] `DonnaResponseCard` does not render raw player notes
- [ ] `DonnaResponseCard` does not render session notes
- [ ] `DonnaResponseCard` does not render player IDs or session IDs
- [ ] `output.text` from orchestrator is the only text rendered — safety contract enforced in Sprint 999

---

## Sprint 1008–1010 regression checklist

- [ ] `DonnaResponseCard` component compiles cleanly (Sprint 1008)
- [ ] `donnaGuidedAction.ts` compiles cleanly (Sprint 1009)
- [ ] `donnaOrchestratorAction.ts` compiles cleanly (Sprint 1010)
- [ ] `donnaOrchestratorAction.ts` server action signature unchanged
- [ ] `DonnaOrchestratorInput` type unchanged
- [ ] `DonnaOrchestratorResult` type unchanged
- [ ] `orchestrate()` call in server action unchanged
- [ ] Usage event write in server action unchanged

---

## god mode history checklist

- [ ] `godModeHistory` is initialized as `[]`
- [ ] After a successful God Mode response, history appends user turn + donna turn
- [ ] History is capped at last 8 turns before append (no unbounded growth)
- [ ] History is cleared when panel closes
- [ ] History is passed to `runDonnaOrchestratorAction` on subsequent queries
- [ ] History `content` field contains only `output.text` for donna turns (not raw context)
