# QA — DONNA Safe Action Router V1 — Sprint 981

**Date:** 2026-05-30
**Sprint:** 981

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `safeActionRouter.ts` compiles cleanly — all types from types.ts referenced correctly

---

## Routing Path Checklist

- [ ] `routeAction({ type: 'answer', safetyLevel: 'safe', text: '...', requiresConfirmation: false, confidence: 'high', source: 'deterministic' })` → path: `'immediate'`
- [ ] `routeAction({ type: 'draft_proposed_action', safetyLevel: 'approval_gated', ... })` → path: `'review_queue'`
- [ ] `routeAction({ type: 'highlight_target', safetyLevel: 'safe', ... })` → path: `'immediate'` with `set_highlight` instruction
- [ ] `routeAction({ type: 'recommend_next_action', safetyLevel: 'safe', highlightTarget: {...}, suggestedRoute: '/director/review', ... })` → instructions include show_text, set_highlight, suggest_navigation

---

## Tool Result Routing Checklist

- [ ] `routeToolResult({ ok: false, error: 'missing param', ... })` → path: `'blocked'`
- [ ] `routeToolResult({ ok: true, requiresConfirmation: true, ... })` → path: `'draft'`
- [ ] `routeToolResult({ ok: true, requiresConfirmation: false, ... })` → path: `'immediate'`

---

## Safety Checklist

- [ ] `requiresDirectorAction` is `true` for all draft and review_queue paths
- [ ] `requiresDirectorAction` is `false` for immediate and blocked paths
- [ ] No DB calls in any routing function
- [ ] All audit entries present in `ActionRoutingResult.auditEntry`
