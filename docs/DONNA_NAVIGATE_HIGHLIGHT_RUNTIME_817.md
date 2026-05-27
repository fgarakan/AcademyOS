# Sprint 817 — DONNA Navigate + Highlight Runtime V1

**Date:** 2026-05-25
**Sprint:** 817
**Type:** Feature implementation
**Files changed:** 7 source files + 2 docs

---

## What this sprint delivers

Implements the client-side runtime that allows DONNA to:
1. Navigate the director to the correct route
2. Set a teal focus target in sessionStorage *before* navigation
3. Highlight the exact UI area on arrival with a glowing teal ring
4. Show a floating "DONNA is pointing here" badge
5. Auto-dismiss after 8 seconds or on manual dismiss

This is the foundational layer for all DONNA guided navigation (Sprints 818–820 add page-specific targets).

---

## Architecture

### Flow

```
Director says "Show me the review queue"
          ↓
dispatchUIIntent() → DispatchResult { kind: 'navigate', route: '/director/review',
                                       focusTarget: { targetId: 'pending-review-list', ... } }
          ↓
handleUIDispatch() calls setDonnaFocusTarget(result.focusTarget)
          ↓
router.push('/director/review')
          ↓
DonnaHighlightBanner useEffect fires on pathname change
          ↓
Reads sessionStorage → finds target → querySelector → scrollIntoView → donna-focus-ring class
          ↓
Floating teal badge appears: "DONNA is pointing here — Review Center"
          ↓
Auto-dismiss after 8 seconds (or × button)
```

### Storage

- Key: `donna_focus_target` in `sessionStorage`
- Cleared on: dismiss, expiry, or next navigation to a different route
- Contains: `route`, `targetId`, `label`, `reason`, `sourceCommand`, `highlightStyle`, `expiresAt`
- Never contains: player names, coach notes, private data, role-restricted content

### CSS

Two highlight classes added to `globals.css`:
- `.donna-focus-ring` — teal outline + pulsing glow (default DONNA style)
- `.donna-focus-ring-warning` — amber outline + pulsing glow (for warning states)

Both use CSS custom properties (`--accent-cyan`, `--accent-amber`) — never inline hex.

---

## Files Changed

### Created

| File | Description |
|---|---|
| `src/components/donna/DonnaHighlightBanner.tsx` | Client component mounted in director layout; reads sessionStorage on pathname change, finds target element, applies teal glow, shows badge, auto-dismisses |

### Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFocusTarget.ts` | Added `isDonnaFocusTargetExpired()` utility — checks expiry without reading/clearing |
| `src/lib/donna/donnaUIActionDispatcher.ts` | Added `import type { DonnaFocusTarget }`; added `focusTarget?: DonnaFocusTarget` to `DispatchResult`; added `FOCUS_TARGET_MAP` with 7 director routes; added `buildFocusTargetForRoute()` helper; updated `resolveNavigation` to populate `focusTarget` |
| `src/app/globals.css` | Added `.donna-focus-ring`, `.donna-focus-ring-warning`, `@keyframes donna-pulse`, `@keyframes donna-pulse-warning` |
| `src/app/director/layout.tsx` | Imported and mounted `<DonnaHighlightBanner />` in director layout |
| `src/components/assistant/DonnaAssistantButton.tsx` | Imported `setDonnaFocusTarget`; added one-line call before `router.push()` in `handleUIDispatch` |

---

## FOCUS_TARGET_MAP — 7 routes registered

| Route | targetId | Label |
|---|---|---|
| `/director` | `today-command-center` | Daily Command |
| `/director/review` | `pending-review-list` | Review Center |
| `/director/players` | `player-directory-summary` | Player Directory |
| `/director/sessions` | `sessions-list` | Sessions |
| `/director/class-templates` | `create-template-button` | Template Library |
| `/director/class-templates/new` | `create-template-form` | Class Template Builder |
| `/director/curriculum/builder` | `curriculum-builder-hero` | Curriculum Builder |

**Note:** Sprints 818–820 add the actual `data-donna-focus-id` attributes to these pages.
Until those sprints run, the focus target is set but no element is found — the banner is silently not shown (no error, no crash).

---

## Safety Guardrails

| Guardrail | Status |
|---|---|
| No database mutations | ✅ sessionStorage only |
| No RLS bypass | ✅ No DB queries |
| No private data in focus target | ✅ Only route + element ID + display label |
| No mic auto-start | ✅ Unchanged |
| No voice mutations | ✅ Highlight is visual-only |
| Role boundaries intact | ✅ Focus targets are direction-only |
| Parent-safe rules intact | ✅ Unchanged |

---

## What's next

- **Sprint 818:** Add `data-donna-focus-id` attributes to Director Daily Command page (`/director`)
- **Sprint 819:** Add targets to Class Template Builder
- **Sprint 820:** Add targets to Player Directory
- **Sprint 821:** DONNA Voice Singleton — one voice, one experience

---

## TypeScript

Clean — `npx tsc --noEmit` passes with no errors.
