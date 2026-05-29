# DONNA Page Element Registry V1
**Date:** 2026-05-29
**Sprint:** 940
**Status:** Complete

---

## What Was Built

`src/lib/donna/donnaPageElementRegistry.ts` — a structured registry of every highlightable, explainable UI element DONNA knows about across director and coach pages.

`donnaContextResolver.ts` updated to include `topPageElement: DonnaPageElement | null` in the resolved context.

---

## Registry Design

Each `DonnaPageElement` entry contains:
- `id` — matches `data-donna-focus-id` attribute on the DOM element
- `label` — short human-readable label for the highlight badge
- `route` — route pattern (supports `[param]` parameterised segments)
- `roles` — which roles can receive DONNA guidance for this element
- `priority` — `urgent | high | medium | low`
- `actionType` — `review | submit | navigate | create | inspect | cta`
- `safetyLevel` — `always_safe | draft_to_review | approval_required`
- `explanation` — what DONNA says when pointing to this element
- `href` — optional follow-up link DONNA can offer
- `dataDependent` — whether this element only surfaces when live context confirms relevance

---

## Pages Covered (38 total elements)

| Route | Role | Elements |
|---|---|---|
| `/director` | director | review-queue-card (urgent), player-attention-card (high), sessions-this-week-card (medium), today-command-center (high), academy-metrics-section (low), alerts-placement-section (high) |
| `/director/review` | director | pending-review-list (urgent), attendance-exceptions-section (high) |
| `/director/players` | director | player-directory-summary (medium), players-missing-level (high), player-filter-bar (low) |
| `/director/sessions` | director | session-list (medium) |
| `/director/sessions/[sessionId]` | director | session-blocks (medium), session-roster-attendance (high), session-roster-intelligence (medium) |
| `/director/class-templates` | director | create-template-button (medium) |
| `/director/class-templates/[templateId]` | director | template-stepper (high), template-blocks-section (high), template-generate-session (medium) |
| `/director/class-templates/new` | director | create-template-form (high) |
| `/director/curriculum/builder` | director | curriculum-builder-hero (high) |
| `/coach` | coach | coach-today-sessions (urgent), coach-players-section (medium) |
| `/coach/sessions/[sessionId]` | coach | coach-lesson-plan (high), coach-run-session (urgent), coach-wrap-up-link (urgent), coach-player-watch-list (medium) |
| `/coach/sessions/[sessionId]/wrap-up` | coach | wrapup-question-card (urgent), wrapup-nav-actions (urgent) |
| `/coach/players` | coach | coach-player-list (medium) |

All `data-donna-focus-id` attributes already existed in the DOM from Sprint 868+. **No new DOM attributes were added in Sprint 940.**

---

## Context Resolver Integration

`donnaContextResolver.ts` now returns `topPageElement` — the single highest-priority registered element for the current route + role. This is the foundation for Sprint 941's "What should I do next?" live engine:

```typescript
const ctx = resolveDonnaContext('director', '/director/review')
// ctx.topPageElement.id === 'pending-review-list'
// ctx.topPageElement.explanation === "These items are waiting for your decision..."
// ctx.topPageElement.safetyLevel === 'approval_required'
```

---

## Lookup Functions

```typescript
// All elements for a route + role
getPageElements(pathname, role): DonnaPageElement[]

// Elements sorted urgent → low
getPageElementsSorted(pathname, role): DonnaPageElement[]

// Single highest-priority element
getTopPageElement(pathname, role): DonnaPageElement | null

// Count by priority level
getPageElementSummary(pathname, role): { total, urgent, high, medium, low }

// All elements with a given safety level
getElementsBySafetyLevel(level): DonnaPageElement[]
```

---

## Next Sprint — Sprint 941

Build the **"What should I do next?" engine** that uses:
1. `resolveDonnaContext` (route + role + page purpose)
2. `getPageElementsSorted` (priority-ranked elements)
3. Optional live context (pending counts from `directorCtx`)
4. Priority ranking: urgent safety → pending approvals → coach wrap-ups → setup gaps → page CTA

Wire to Shell A's `PAGE_NEXT_STEP` pattern handler to return both text answer + `targetId` for highlight.
