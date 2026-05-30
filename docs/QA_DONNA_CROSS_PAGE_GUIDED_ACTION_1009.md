# QA — DONNA Cross-Page Guided Action V1 — Sprint 1009

**Date:** 2026-05-30
**Sprint:** 1009

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `donnaGuidedAction.ts` compiles cleanly
- [ ] `isAllowedRoute` export resolves
- [ ] `executeDonnaHighlight` export resolves
- [ ] `executeDonnaNavigation` export resolves
- [ ] `executeDonnaPrimaryAction` export resolves
- [ ] `OrchestratorOutput` import resolves
- [ ] `setDonnaFocusTarget` import resolves

---

## isAllowedRoute Checklist

- [ ] `isAllowedRoute('/director')` → true
- [ ] `isAllowedRoute('/director/review')` → true
- [ ] `isAllowedRoute('/coach')` → true
- [ ] `isAllowedRoute('/player')` → true
- [ ] `isAllowedRoute('/parent')` → true
- [ ] `isAllowedRoute('https://example.com')` → false
- [ ] `isAllowedRoute('//evil.com')` → false
- [ ] `isAllowedRoute(null)` → false
- [ ] `isAllowedRoute(undefined)` → false
- [ ] `isAllowedRoute('')` → false
- [ ] `isAllowedRoute('/admin')` → false

---

## executeDonnaHighlight Checklist

- [ ] Same-page case: route === pathname → calls setDonnaFocusTarget + dispatches donna:highlight
- [ ] Same-page case: does NOT call onNavigate
- [ ] Cross-page case: route !== pathname → calls setDonnaFocusTarget + calls onNavigate(route)
- [ ] Cross-page case: does NOT dispatch donna:highlight (pickup happens on arrival)
- [ ] No-op when highlightTarget is undefined
- [ ] No-op when route is not in ALLOWED_ROUTE_PREFIXES
- [ ] No-op when window is undefined (server context)
- [ ] setDonnaFocusTarget called with { targetId, route, label } only — no raw notes/IDs

---

## executeDonnaNavigation Checklist

- [ ] Calls onNavigate(route) for valid internal routes
- [ ] No-op for null/undefined route
- [ ] No-op for external routes (https://, //)
- [ ] No-op for /admin or other non-AcademyOS prefixes
- [ ] Never calls router.push directly (no Next.js import in this module)

---

## executeDonnaPrimaryAction Checklist

- [ ] When output.highlightTarget present → executeDonnaHighlight called (priority)
- [ ] When output.highlightTarget absent + output.suggestedRoute present → executeDonnaNavigation called
- [ ] When neither highlightTarget nor suggestedRoute present → no-op
- [ ] Does not affect output.text or other response fields

---

## Safety Checklist

- [ ] Module never calls router.push directly
- [ ] Module never mutates any database record
- [ ] Module never makes API calls
- [ ] setDonnaFocusTarget params contain only targetId (element ID), route, label
- [ ] No player names in setDonnaFocusTarget calls
- [ ] No coach notes in setDonnaFocusTarget calls
- [ ] No session notes in setDonnaFocusTarget calls
- [ ] External route guard blocks navigation to non-AcademyOS URLs

---

## Not-Wired-Yet Checklist (expected)

- [ ] donnaGuidedAction.ts not yet called from DonnaAssistantButton — Sprint 1011 wires it
- [ ] donnaGuidedAction.ts not yet called from any route page — Sprint 1011 wires it

---

## Sprint 1008 Regression Checklist

- [ ] DonnaResponseCard unchanged
- [ ] DonnaResponseCard.onNavigate and onHighlight props unchanged

---

## Sprint 817/871 Regression Checklist

- [ ] donnaFocusTarget.ts unchanged
- [ ] DonnaHighlightBanner unchanged
- [ ] donna:highlight event dispatch pattern unchanged

---

## Sprint 1007–1005 Regression Checklist

- [ ] Usage tracking functions unchanged
- [ ] orchestrate() unchanged
- [ ] callDonnaLlm() unchanged
