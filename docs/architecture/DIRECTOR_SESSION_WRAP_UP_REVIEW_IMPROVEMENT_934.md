# Director Session Wrap-Up Review Improvement — Architecture

**Sprint:** 934 | **Date:** 2026-05-29

---

## Summary

Sprint 934 adds heuristic player name chips to the director session wrap-up review card (`WrapUpDraftCard`). When `raw_standouts_answer` or `raw_attention_answer` contain capitalized words that look like player names, compact chips appear below the relevant text field so the director can scan player mentions without reading full paragraphs.

---

## Files changed

| File | Change |
|---|---|
| `src/app/director/review/WrapUpDraftCard.tsx` | Added `COMMON_NON_NAMES`, `extractCapitalizedNames()`, `PlayerMentionChips` sub-component; chips rendered below standouts and attention text fields |

---

## Extraction logic

```ts
// Pattern: same as CoachWrapUpDrawer name guardrail (Sprint 81)
function extractCapitalizedNames(text: string): string[] {
  const capitalized = text.match(/\b[A-Z][a-z]{1,}/g) ?? []
  const unique = Array.from(new Set(capitalized))
  return unique.filter(word =>
    !COMMON_NON_NAMES.has(word.toLowerCase()) && word.length >= 2
  )
}
```

**What it does:** Finds words that start with a capital letter, filters out a curated exclusion list (weekdays, months, common words), deduplicates.

**What it doesn't do:** No LLM, no DB queries, no mutations, no roster matching.

**Why not use `wrapUpPlayerNameMatcher.ts`:** That helper requires a `RosterEntry[]` for exact matching. `EnrichedWrapUpDraftItem` does not include roster data — adding it would require new DB queries per wrap-up draft in the review queue page. The heuristic approach is the correct fallback per sprint rules.

---

## `PlayerMentionChips` component

- Renders up to 6 name chips
- Shows "+N more" if overflow
- Returns `null` when no names extracted — card degrades gracefully
- Chips are neutral (surface/border colors) — not labeled as "confirmed players"

---

## Chip placement

Chips appear **inline below the text** in each relevant section:

```
┌─ Player Standouts ──────────────────────────────┐
│ Lucas was exceptional on serve. Emma showed...  │
└─────────────────────────────────────────────────┘
  [Lucas]  [Emma]

┌─ Needs Attention ───────────────────────────────┐
│ Emma needs one-on-one work on footwork.          │
└─────────────────────────────────────────────────┘
  [Emma]
```

Context is clear: chips appear under the relevant label, so the director knows whether a name is a standout or an attention item.

---

## Safety limits

| Limit | Value |
|---|---|
| Max chips shown | 6 |
| Overflow label | "+N more" |
| Min word length | 2 characters |
| Exclusion set | 35+ common non-name words |
| LLM calls | None |
| DB calls | None |
| Mutations | None |

---

## Protected systems

| System | Status |
|---|---|
| Sprint 904 approve/reject controls | ✅ Untouched |
| `updateWrapUpDraftDecisionAction` | ✅ Untouched |
| `WrapUpDraftDecisionControls` | ✅ Untouched |
| `ApplyWrapUpDraftControls` | ✅ Untouched |
| `EnrichedWrapUpDraftItem` interface | ✅ Untouched |
| `SessionActualDraftPayload` | ✅ Untouched |
| Existing text field display | ✅ Unchanged — chips are additive only |
| Safety notice | ✅ Unchanged |
| Director note | ✅ Unchanged |

---

## Known limitations

- Heuristic extraction may include proper nouns that are not player names (e.g., place names, brand names, session drills named after people). Chips should be read as "mentioned in this text" not "confirmed player."
- Names shorter than 2 characters and single-letter initials are excluded.
- Multi-word names (e.g., "Van der Berg") are only partially matched — each capitalized word is a separate chip.
- No roster validation is possible without adding new DB queries. V2 could add group player list to `EnrichedWrapUpDraftItem` to enable exact matching via `matchPlayerNames()`.
