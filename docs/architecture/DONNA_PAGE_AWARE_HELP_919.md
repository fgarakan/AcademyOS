# DONNA Page-Aware Help 10/10 — Architecture
**Sprint:** 919 | **Date:** 2026-05-29

---

## 1. What Changed

### Pages Added (4)
- `/director/today` — Today's Academy operating view
- `/parent` — Parent Portal
- `/player` — Player Portal
- `/director/settings` — Academy Settings

### Answer Functions Added (3)
- `walkMeThrough(pathname, firstName?)` — comprehensive page tour: purpose + context + approval + next step
- `whyDoesThisMatter(pathname)` — strategic page purpose explanation
- `whatShouldIClickNext(pathname)` — single concrete next action

### Intent Router Patterns Added (2)
- `PAGE_WALK` → `page_guide_walk_through`
- `PAGE_WHY` → `page_guide_why`

### Route Labels Added (3)
- `routeToModuleLabel` now covers `/parent`, `/player`, `/director/today`

---

## 2. Full Page Guide Architecture

```
User: "Walk me through this page"
  → routeDonnaIntentV1(text, pathname)
  → intent: 'page_guide_walk_through'
  → God Mode 34-interceptor routes to page guide handler
  → walkMeThrough(pathname) → structured answer
  → No DB calls, no mutations, pure TypeScript
```

---

## 3. Role Safety Per Page

| Page | Blocked Content |
|---|---|
| `/parent` | Coach internal notes, other players' profiles, raw assessment scores, session planning |
| `/player` | Coach concern notes, other players' data, raw assessment scores |
| All | Mutating data from chat, exposing private data across role boundaries |
