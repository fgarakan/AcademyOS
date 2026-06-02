# DONNA Adoption Layer — QA Checklist

**Sprint:** Mega Sprint 1156-1165
**Date:** 2026-06-02

---

## DonnaSuggestedQuestions

| Check | Expected | Status |
|---|---|---|
| Route config covers 7 major director routes | Yes | ✅ |
| Player profile route resolved from prefix match | `/director/players/[id]` prefix | ✅ |
| Chip click calls `onSelect(question)` | Yes | ✅ |
| Chips wrap horizontally on mobile | `flex-wrap` applied | ✅ |
| Default fallback questions when route not found | 3 generic questions | ✅ |
| Pure client component | Yes — 'use client' | ✅ |

---

## DonnaCommandSection

| Check | Expected | Status |
|---|---|---|
| Renders DonnaSuggestedQuestions above bar | Yes | ✅ |
| Chip click sets `triggerQuestion` state | Yes | ✅ |
| `triggerQuestion` passed to DonnaCommandBar | Yes | ✅ |
| `onTriggered` clears triggerQuestion | Yes | ✅ |
| `showSuggestions={false}` hides chips | Yes | ✅ |

---

## DonnaCommandBar (updated)

| Check | Expected | Status |
|---|---|---|
| `triggerQuestion` prop accepted | Yes | ✅ |
| `onTriggered` prop accepted | Yes | ✅ |
| `useEffect` fires on triggerQuestion change | Yes | ✅ |
| Auto-submits when triggerQuestion changes | Yes | ✅ |
| `onTriggered()` called after submission | Yes | ✅ |

---

## DonnaFirstGreeting

| Check | Expected | Status |
|---|---|---|
| Shows greeting + director first name | Yes | ✅ |
| Lists real attention items (not invented) | Uses passed counts | ✅ |
| Max 4 items shown | Yes — `.slice(0, 4)` | ✅ |
| Fallback "Academy looks calm" when no items | Yes | ✅ |
| "Ask me anything" prompt always shown | Yes | ✅ |
| DONNA identity (sparkle icon + label) | Yes | ✅ |
| Never shows 0-count items | Conditional — only if count > 0 | ✅ |

---

## Page Wiring

| Page | DONNA Brief | Command Section | Player Context | Status |
|---|---|---|---|---|
| Director Dashboard | ✅ Sprint 1123 | ✅ Sprint 1156 | N/A | ✅ |
| Players List | ✅ Sprint 1123 | ✅ Sprint 1156 | N/A | ✅ |
| Player Profile | ✅ in hero | ✅ Sprint 1156 | playerId passed | ✅ |
| Review Queue | ✅ DonnaReviewBriefPanel | ✅ Sprint 1156 | N/A | ✅ |

---

## DONNA Analytics Page

| Check | Expected | Status |
|---|---|---|
| Director/head_coach only | Role check at top | ✅ |
| Graceful when donna_events missing | try/catch + empty state | ✅ |
| Shows intent frequency chart | Yes | ✅ |
| Shows top pages | Yes | ✅ |
| Shows unrecognised questions | Yes | ✅ |
| No sensitive parent/player data shown | question_hash (first 200 chars only) | ✅ |

---

## TypeScript

```
npx tsc --noEmit → clean
```
