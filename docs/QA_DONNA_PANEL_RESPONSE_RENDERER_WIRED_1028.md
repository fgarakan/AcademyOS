# QA Checklist — Wire DONNA Panel Response Renderer (Sprint 1028)

**Date:** 2026-05-31
**Sprint:** 1028

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `DonnaPanelResponseRenderer` import resolves from `@/components/donna/DonnaPanelResponseRenderer`
- [ ] `DonnaResponseCard` import removed from `DonnaAssistantButton.tsx`
- [ ] No TypeScript errors in sprint files

---

## Replacement verification

- [ ] cooThread JSX section (Sprints 747-825) is REMOVED from DonnaAssistantButton
- [ ] Sprint 1011 God Mode section (loading dots + DonnaResponseCard) is REMOVED from DonnaAssistantButton
- [ ] `DonnaPanelResponseRenderer` is present exactly ONCE in the panel render
- [ ] DonnaWorkflowCards is unchanged (still present, same props)
- [ ] No duplicate response areas visible in the panel

---

## Functional regression checklist (requires browser)

- [ ] COO thread: submit a deterministic command (e.g. "daily brief") → bubbles appear in DonnaPanelResponseRenderer
- [ ] God Mode loading: submit unrecognized phrase → loading spinner visible while awaiting response
- [ ] God Mode response: God Mode response renders as DonnaResponseCard below input
- [ ] Navigate callback: click "Go to Review Queue" → navigates and panel closes
- [ ] Highlight callback: click "Focus: X" → highlight fires and panel closes
- [ ] commandResponse (fallback): DonnaWorkflowCards still renders error/fallback messages
- [ ] suppressCommandResponseCard: when cooThread last turn matches commandResponse → card suppressed (no duplicate)

---

## Safety regression checklist

- [ ] No new DONNA button added
- [ ] No new DONNA panel added
- [ ] Sprint 1011 God Mode fallback behavior unchanged (handleGodModeQuery still calls setCommandResponse on error)
- [ ] Sprint 904 proposed_actions unchanged
- [ ] Voice path unchanged

---

## Visual QA checklist (requires browser)

- [ ] COO thread bubbles match previous styling (lime user bubbles, violet DONNA bubbles)
- [ ] Loading indicator appears at correct position (between input and workflow cards)
- [ ] DonnaResponseCard full width within panel (no px-0 overflow issues)
- [ ] Panel scroll behavior unchanged

---

## Unused refs checklist

- [ ] `cooThreadScrollRef` — still declared, now null at runtime (effect has null guard)
- [ ] `cooThreadBottomRef` — still declared, now null at runtime (no crash)
- [ ] `cooThreadWrapperRef` — still declared, now null at runtime (`.scrollIntoView()` no-op via optional chain)
- [ ] No runtime errors from null refs
