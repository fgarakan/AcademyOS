# DONNA What Should I Do Next Engine V1
**Date:** 2026-05-29
**Sprint:** 941
**Status:** Complete

---

## What Was Built

`src/lib/donna/donnaWhatNextEngine.ts` — priority-ranked next-action decision engine.
`DonnaVoiceReadyShell.tsx` — Shell A wired to use the engine for "What should I do next?" questions, with live-data ranking and visual highlight.

---

## Engine Architecture

### Input
```typescript
buildWhatNextAnswer(
  role: DonnaContextRole,
  pathname: string,
  liveCtx?: WhatNextLiveContext,
): WhatNextAnswer
```

`WhatNextLiveContext`:
- `pendingReviews` — pending proposed_actions count
- `attendanceExceptions` — pending attendance exceptions
- `advancementEligibleCount` — players ready for level advancement
- `playerProgressStallCount` — players with stalled development
- `highRiskPlayerCount` — high-risk player flags
- `curriculumDraftCount` — pending curriculum drafts

### Priority Ranking
| Priority | Trigger | Source |
|---|---|---|
| 1 (highest) | `pendingReviews > 0` | `live_pending_reviews` |
| 2 | `attendanceExceptions > 0` | `live_attendance` |
| 3 | `advancementEligibleCount > 0` | `live_advancement` |
| 4 | `playerProgressStallCount > 0` | `live_stall` |
| 5 | Urgent page element (not data-dependent) | `page_element_urgent` |
| 6 | High page element (not data-dependent) | `page_element_high` |
| 7 (fallback) | `whatIsTheBestNextStep(pathname)` | `page_fallback` |

### Output
```typescript
interface WhatNextAnswer {
  text: string           // Full DONNA response text (markdown)
  targetId?: string      // data-donna-focus-id to highlight
  label?: string         // Highlight badge label
  explanation?: string   // Why DONNA is pointing here
  safetyNote?: string    // Shown for approval_required actions
  href?: string          // Follow-up navigation route
  confidence: 'high' | 'partial'
  source: WhatNextSource // What drove this answer
}
```

---

## Shell A Wiring

`DonnaVoiceReadyShell.tsx` — `PAGE_NEXT_STEP` pattern handler updated:

### Pattern extended
Before Sprint 941: only matched `"what should I do here"` and `"what is the best next step here"`.
After Sprint 941: also matches `"What should I do next?"`, `"What's next?"`, `"What's my next step?"`, `"What to do next"`.

```typescript
const PAGE_NEXT_STEP = /\b(what should i do (here|on this page|next)|...|what to do next|what('?s| is) next)\b/i
```

### Engine call
When `PAGE_NEXT_STEP` fires, Shell A now calls `buildWhatNextAnswer` with live `directorCtx` fields:
```typescript
const whatNext = buildWhatNextAnswer('director', currentPath, {
  pendingReviews: directorCtx.pendingReviews,
  attendanceExceptions: directorCtx.attendanceExceptions,
  advancementEligibleCount: directorCtx.advancementEligibleCount,
  playerProgressStallCount: directorCtx.playerProgressStallCount,
  highRiskPlayerCount: directorCtx.highRiskPlayerCount,
  curriculumDraftCount: directorCtx.curriculumDraftCount,
})
```

### Highlight trigger
When `whatNext.targetId` is present:
```typescript
setDonnaFocusTarget({ route: currentPath, targetId, label, ... })
window.dispatchEvent(new CustomEvent('donna:highlight'))
```

### Nav offer
When `whatNext.href` differs from current path, a `pendingNavOffer` is set so the director can say "yes" to navigate.

---

## Example Flows

### Director on `/director` with 3 pending reviews
1. Director: "What should I do next?"
2. Engine → `live_pending_reviews` → text: "You have 3 items waiting…"
3. Shell A → `setDonnaFocusTarget({ targetId: undefined, href: '/director/review' })`
4. Shell A → nav offer: director says "yes" → navigates to review page with `pending-review-list` highlight

### Director on `/director/review` with 3 pending reviews  
1. Director: "What should I do next?"
2. Engine → `live_pending_reviews` → text: "You have 3 items waiting here… I'm highlighting the review list now"
3. Shell A → `setDonnaFocusTarget({ targetId: 'pending-review-list' })` → `donna:highlight` event
4. Banner appears, `pending-review-list` glows teal

### Coach on `/coach` (no live ctx)
1. Coach: "What should I do next?" (via coach DONNA page)
2. Engine → no live ctx → `page_element_urgent` → `coach-today-sessions`
3. Shell A (coach role) → text: "Your session schedule for today is here…"
4. Highlight: `coach-today-sessions` glows

---

## What Was NOT Changed
- Existing KPI intercept (tryAnswerKpiQuestion) — unchanged
- Dashboard priority intercept — unchanged  
- Review queue intercept (detectReviewQueueQuestion) — unchanged
- All approval gates — unchanged
- Coach wrap-up loop — unchanged
- No migrations
