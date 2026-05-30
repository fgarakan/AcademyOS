# Architecture — DONNA Cross-Page Guided Action V1 — Sprint 1009

**Date:** 2026-05-30
**Sprint:** 1009
**Depends on:** Sprint 817 (DonnaFocusTarget), Sprint 871 (donna:highlight), Sprint 1008 (DonnaResponseCard)

---

## Purpose

Sprint 1009 creates `donnaGuidedAction.ts` — a reusable client-side helper that executes the highlight/navigation side effects for an `OrchestratorOutput`.

Without this module, every consumer of `DonnaResponseCard.onNavigate` and `onHighlight` would need to re-implement the two-step `setDonnaFocusTarget` + `donna:highlight` / `router.push` pattern. Sprint 1009 centralizes that logic.

---

## The cross-page guided action pattern

When DONNA wants to point at a UI element and the element is on a different page:
1. `setDonnaFocusTarget({ targetId, route, label })` — writes target to sessionStorage
2. `router.push(route)` — navigates to the destination page
3. On mount, `DonnaHighlightBanner` reads sessionStorage, finds the element, applies teal glow

When the element is on the same page:
1. `setDonnaFocusTarget({ targetId, route, label })` — writes to sessionStorage
2. `window.dispatchEvent(new CustomEvent('donna:highlight'))` — immediate pickup
3. `DonnaHighlightBanner` activates without a page transition

---

## Exported functions

### `isAllowedRoute(route)`
Returns true if the route starts with `/director`, `/coach`, `/player`, or `/parent`.
Rejects external URLs, protocol-relative URLs, and null/undefined.
Same allowlist the LLM API client uses when sanitizing `suggestedRoute`.

### `executeDonnaHighlight(highlightTarget, currentPathname, onNavigate)`
Executes a highlight action from `OrchestratorOutput.highlightTarget`.
- Same-page: `setDonnaFocusTarget` + dispatch `donna:highlight`
- Cross-page: `setDonnaFocusTarget` + call `onNavigate(route)`
- No-op for disallowed routes, missing target, or server-side context

### `executeDonnaNavigation(route, onNavigate)`
Executes a navigation suggestion from `OrchestratorOutput.suggestedRoute`.
- Calls `onNavigate(route)` for safe internal routes only
- No-op for external routes or null

### `executeDonnaPrimaryAction(output, currentPathname, onNavigate)`
Convenience wrapper for the full action from an `OrchestratorOutput`:
1. If `output.highlightTarget` → `executeDonnaHighlight`
2. Else if `output.suggestedRoute` → `executeDonnaNavigation`
3. Else → no-op

---

## Safety invariants

- Routes validated against `ALLOWED_ROUTE_PREFIXES` — no external navigation possible
- `setDonnaFocusTarget` parameters contain only `targetId` (element identifier), `route`, `label` — no raw notes, player names, or private data
- Client-only — guards with `typeof window === 'undefined'`
- No mutations, no DB calls, no server-side operations
- Callers provide `onNavigate` — this module never calls `router.push` directly (no Next.js import)

---

## Responsibility split

| Layer | Responsibility |
|---|---|
| `donnaGuidedAction.ts` (Sprint 1009) | Decides same-page vs cross-page. Manages sessionStorage write. Dispatches donna:highlight. Calls onNavigate callback. |
| Sprint 1011 DonnaAssistantButton wiring | Provides `onNavigate = (route) => { router.push(route); closePanel() }` |
| DonnaHighlightBanner (Sprint 817/871) | Reads sessionStorage. Finds DOM element. Applies teal glow. Shows floating badge. |

---

## Files created

| File | Change |
|---|---|
| `src/lib/donna/llmOrchestration/donnaGuidedAction.ts` | New — guided action helpers |
| `docs/architecture/DONNA_CROSS_PAGE_GUIDED_ACTION_1009.md` | New — this doc |
| `docs/QA_DONNA_CROSS_PAGE_GUIDED_ACTION_1009.md` | New — QA checklist |
| `docs/CHANGELOG.md` | Updated |
