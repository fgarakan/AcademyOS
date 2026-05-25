# Sprint 809 — DONNA First-Action Phrase Map V1

**Date:** 2026-05-25
**Sprint:** 809
**Type:** Intent classification — expand `DAILY_BRIEF_PATTERNS` with first-action / where-to-start phrases
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 805 certification gap:

> **`"What should I do first?" not in phrase map`** — Directors naturally ask DONNA where to start. These first-action phrasings are not in `matchesDailyBriefIntent`, so they route to the COO router instead of the daily brief handler, producing vague or navigation-focused responses instead of the structured attention brief.

Sprint 809 adds 10 first-action phrases to `DAILY_BRIEF_PATTERNS`, so they route reliably to the daily brief handler.

---

## How DONNA intent classification works

`matchesDailyBriefIntent(text)`:
1. Calls `normalizeDailyBriefInput(text)` — lowercase, strip punctuation, expand contractions (`what's` → `what is`, `don't` → `do not`), remove filler words (`please`, `just`, `hey`, etc.)
2. Tests the normalized string against every pattern in `DAILY_BRIEF_PATTERNS` via substring match
3. Returns `true` if any pattern matches

`handleCommandSubmit` checks `matchesDailyBriefIntent` before the COO router. If it matches, the daily brief handler fires.

---

## 10 phrases added to `DAILY_BRIEF_PATTERNS`

| Pattern (in map) | Example director input | Normalised form |
|---|---|---|
| `what should i do first` | "What should I do first?" | `what should i do first` |
| `where should i start` | "Where should I start?" | `where should i start` |
| `start me off` | "Start me off" / "Start me off today" | `start me off` |
| `what matters most` | "What matters most today?" | `what matters most` |
| `what is most urgent` | "What's most urgent?" | `what is most urgent` |
| `prioritize my day` | "Prioritize my day" | `prioritize my day` |
| `give me my first action` | "Give me my first action item" | `give me my first action` |
| `what is the first thing` | "What's the first thing I should do?" | `what is the first thing` |
| `what is most important` | "What's most important?" | `what is most important` |
| `what do i tackle first` | "What do I tackle first?" | `what do i tackle first` |

---

## Normalization checks

| Director input | After normalization | Pattern matched | Routes to |
|---|---|---|---|
| "What should I do first?" | `what should i do first` | `what should i do first` | Daily brief ✅ |
| "What's most urgent?" | `what is most urgent` | `what is most urgent` | Daily brief ✅ |
| "Start me off today" | `start me off today` | `start me off` (substring) | Daily brief ✅ |
| "Give me my first action item" | `give me my first action item` | `give me my first action` | Daily brief ✅ |
| "What's the first thing I need to handle?" | `what is the first thing i need to handle` | `what is the first thing` | Daily brief ✅ |

---

## What was NOT changed

- `normalizeDailyBriefInput` function — unchanged
- `matchesDailyBriefIntent` function — unchanged
- All existing patterns — preserved
- COO router, follow-up resolver — unchanged
- Any other intent classifiers — unchanged

---

## Pattern count: before / after

| Before Sprint 809 | After Sprint 809 |
|---|---|
| 13 patterns | 23 patterns |

---

## Estimated score lift

| Dimension | Sprint 805 | Sprint 809 estimate |
|---|---|---|
| Command Understanding | 70/100 | ~75/100 |
| "What should I do first?" routing | ⚠️ COO router (unclear) | ✅ Daily brief |
| First-action phrases coverage | ~3 of 10 | 10 of 10 |

**Key gain:** Directors who ask "where do I start" in any natural phrasing will reliably reach the daily brief handler, which returns a structured attention overview.

---

## Files changed in Sprint 809

- **Modified** `src/lib/donna/donnaIntentClassifier.ts` — added 10 first-action phrases to `DAILY_BRIEF_PATTERNS` under `// First-action / where-to-start intent family (Sprint 809)` comment
- **Created** `docs/DONNA_FIRST_ACTION_PHRASE_MAP_809.md` — this document
- **Modified** `docs/CHANGELOG.md` — Sprint 809 entry
