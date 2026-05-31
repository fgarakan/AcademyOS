# DONNA Page-Aware Greeting + Chips — Sprint 1030

**Date:** 2026-05-31
**Sprint:** 1030

---

## UX problem

When the DONNA panel opens, the greeting shows "Good morning, Brian" but doesn't tell the director that DONNA knows which page they're on. The `ctx.screenName` is shown in the panel header but not the greeting card. A director opening DONNA on the Review Queue page has no immediate signal that DONNA has page context.

---

## What changed

Added a page-context line to the greeting card:

```
DONNA
Good morning, Brian.
You're on: Review Queue   ← new (Sprint 1030)
3 items are waiting in your review queue.
[Walk me through academy priorities]
```

Shown when:
- Not in onboarding
- `ctx.screenName` is set
- Current page is not "Director Dashboard" (generic default — no value in showing it)

---

## What was already there

- `getDonnaPromptSuggestions(pathname)` already returns page-aware chips for all director routes
- `ctx.screenName` already appears in the panel header
- Review queue count already appears in the greeting (Sprint 649)
- Session wrap-up CTA appears for coaches on session pages (Sprint 654)

---

## What gets simpler

- Director immediately knows DONNA is page-aware ("You're on: Players")
- No need to look at panel header to confirm context
- Chips already match the page — greeting now confirms the same

---

## What still needs visual QA

- Confirm page name line appears correctly on Review Queue, Players, Curriculum pages
- Confirm it does NOT appear on Director Dashboard (ctx.screenName === 'Director Dashboard')
- Confirm it does NOT appear during onboarding
- Confirm lime styling matches design system
