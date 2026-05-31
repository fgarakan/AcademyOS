# QA Checklist — DONNA Panel Simplification (Sprint 1025)

**Date:** 2026-05-31
**Sprint:** 1025

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `OrchestratorOutput` import from `@/lib/donna/llmOrchestration/types` resolves
- [ ] `DonnaResponseCard` import from `@/components/donna/DonnaResponseCard` resolves
- [ ] `CooThreadTurn` type exports correctly
- [ ] `CommandResponseData` type exports correctly
- [ ] `DonnaPanelResponseRendererProps` type exports correctly

---

## Render behavior checklist

- [ ] No props → component returns null (no empty placeholder)
- [ ] `cooThread: [{...}]` → renders COO thread section
- [ ] `commandResponse: {...}` → renders command response bubble
- [ ] `isGodModeLoading: true` → renders loading indicator
- [ ] `godModeOutput: {...}, isGodModeLoading: false` → renders DonnaResponseCard
- [ ] `suppressCommandResponseCard: true` → commandResponse NOT rendered
- [ ] Auto-scroll fires when content changes

---

## Visual design checklist (requires browser)

- [ ] COO bubbles match existing premium bubble design
- [ ] Loading indicator is inline (not floating)
- [ ] DonnaResponseCard renders correctly inside the thread
- [ ] Max height + scroll works for long threads

---

## Sprint 1011 regression checklist

- [ ] `DonnaAssistantButton.tsx` NOT changed (wiring deferred to Sprint 1026)
- [ ] `DonnaResponseCard.tsx` NOT changed
- [ ] God Mode state (`godModeOutput`, `isGodModeLoading`) behavior unchanged
- [ ] `handleGodModeQuery` behavior unchanged

---

## V1 limitation checklist

- [ ] Component not yet rendered in DonnaAssistantButton
- [ ] Sprint 1026 wiring plan documented in architecture doc
