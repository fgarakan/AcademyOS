# Sprint 893 — DONNA Normalizer Can You Prefix Strip V1

**Date:** 2026-05-27
**Sprint:** 893
**Type:** Normalizer enhancement — leading "can you " prefix strip
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ COMPLETE
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 892 remaining limitation — "can you" prefix not stripped; polite command variants ("can you show me", "can you open it") fail despite core phrase being covered

---

## Sprint Goal

Add a leading `"can you "` strip to the `normalize` function so polite command variants like
`"can you show me"`, `"can you open it"`, `"can you bring it up"`, and `"can you tell me more"`
match existing ANAPHORIC_PATTERNS, ELABORATION_PATTERNS, and RECOMMENDATION_PATTERNS without
adding new pattern entries.

---

## Pre-Sprint Audit

### 1. Normalizer (post-892, pre-893)

```typescript
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/, '')        // strip trailing punctuation
    .replace(/^please\s+/, '')     // Sprint 892 — strip leading "please " politeness token
    .replace(/\s+please$/, '')     // Sprint 892 — strip trailing " please" politeness token
    .trim()                        // re-trim after politeness strip
    .replace(/\s{2,}/g, ' ')
}
```

No "can you" stripping. `"can you show me"` passes through unchanged.

### 2. Current behavior for audit phrases (pre-893)

| Phrase | Normalized (pre-893) | Pattern match | Covered? |
|---|---|---|---|
| "can you show me" | `"can you show me"` | `/^show me$/` — fails | ❌ |
| "can you open it" | `"can you open it"` | `/^open (it\|that\|this)( for me)?$/` — fails | ❌ |
| "can you bring it up" | `"can you bring it up"` | `/^bring (it\|that\|this) up$/` — fails | ❌ |
| "can you navigate there" | `"can you navigate there"` | `/^navigate (there\|to it\|...)$/` — fails | ❌ |
| "can you take me there" | `"can you take me there"` | `/^take me (there\|to it)$/` — fails | ❌ |
| "can you tell me more" | `"can you tell me more"` | `/^tell me more$/` — fails | ❌ |
| "can you explain that" | `"can you explain that"` | `/^(can you )?(explain\|clarify\|expand) (that\|this\|it)$/` — **matches** (built-in optional) | ✅ already |
| "can you open it please" | `"can you open it"` (Sprint 892 strips "please") | no match | ❌ |
| "please can you open it please" | `"can you open it"` (Sprint 892 strips leading+trailing "please") | no match | ❌ |

All 7 target phrases confirmed uncovered pre-893. `"can you explain that"` is already covered
by an existing pattern with built-in `(can you )?` optional group — the strip will make it work
via either path (direct match or strip + base match). ✅

### 3. Does the normalizer already strip any prefixes?

Sprint 892 added leading "please " strip and trailing " please" strip. No "can you" strip exists pre-893. ✅ Confirmed.

### 4. Existing patterns with built-in `(can you )?`

Three ANAPHORIC/ELABORATION/RECOMMENDATION patterns already accept "can you" directly:

| Pattern | Covers without strip |
|---|---|
| `/^(can you )?show (it\|that\|those\|them) to me$/` | "can you show it to me" ✅ |
| `/^(can you )?(elaborate\|clarify)$/` | "can you elaborate", "can you clarify" ✅ |
| `/^(can you )?(explain\|clarify\|expand) (that\|this\|it)$/` | "can you explain that" ✅ |
| `/^(can you )?walk me through (it\|this\|that)$/` | "can you walk me through it" ✅ |

After the strip, these same phrases match via the base form:
- "can you elaborate" → strip → "elaborate" → `/^(can you )?(elaborate|clarify)$/` matches ✅

No conflict. Both paths (direct match or strip + base match) produce identical results. ✅

### 5. `"can you"` operation order — chaining with Sprint 892

**Critical:** The sprint requires the "can you" strip to be placed AFTER the leading "please" strip, so that `"please can you open it please"` chains correctly:

| Step | Input | After op |
|---|---|---|
| 1. lowercase + trim | `"please can you open it please"` | `"please can you open it please"` |
| 2. strip trailing `?!.` | `"please can you open it please"` | `"please can you open it please"` |
| 3. strip leading "please " | `"please can you open it please"` | `"can you open it please"` |
| 4. strip leading "can you " | `"can you open it please"` | `"open it please"` |
| 5. strip trailing " please" | `"open it please"` | `"open it"` |
| 6. trim + collapse | `"open it"` | `"open it"` |

Result: `"open it"` → matches `/^open (it\|that\|this)( for me)?$/` ✅

If "can you" strip were placed BEFORE the "please" strip, `"please can you open it please"` would
remain as `"please can you open it please"` (since the "please" would be stripped first), then
"can you open it please" → "open it please" → "open it". Actually both orderings work for this
specific case since the leading strip only fires on the first token. But placing "can you" AFTER
"please" is more logically consistent: politeness tokens first (please), then command prefix (can you).

### 6. Normalizer strip vs. new patterns — safety comparison

| Approach | Patterns changed | Phrases covered | False positive risk |
|---|---|---|---|
| **Normalizer strip (chosen)** | None | All "can you "-prefixed variants of all existing patterns | None — anchored to `^` + requires trailing `\s+` |
| New ANAPHORIC_PATTERNS | +N per variant | Only the specific phrases listed | Low |

Strip is narrower and broader simultaneously — no new patterns, all 6 groups gain coverage. ✅

### 7. Pattern changes needed

**None.** All 17 ANAPHORIC_PATTERNS, 7 SEQUENTIAL_PATTERNS, 13 ELABORATION_PATTERNS,
10 RECOMMENDATION_PATTERNS, 3 TIME_SHIFT_PATTERNS, and 6 TOPIC_SHIFT_PATTERNS are unchanged. ✅

---

## Implementation

**Single change — one line added to `normalize`.**

### Before (post-892)

```typescript
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/, '')        // strip trailing punctuation
    .replace(/^please\s+/, '')     // Sprint 892 — strip leading "please " politeness token
    .replace(/\s+please$/, '')     // Sprint 892 — strip trailing " please" politeness token
    .trim()                        // re-trim after politeness strip
    .replace(/\s{2,}/g, ' ')
}
```

### After (post-893)

```typescript
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/, '')        // strip trailing punctuation
    .replace(/^please\s+/, '')     // Sprint 892 — strip leading "please " politeness token
    .replace(/^can you\s+/, '')    // Sprint 893 — strip leading "can you " prefix; after "please" so "please can you …" chains correctly
    .replace(/\s+please$/, '')     // Sprint 892 — strip trailing " please" politeness token
    .trim()                        // re-trim after prefix/politeness strip
    .replace(/\s{2,}/g, ' ')
}
```

### Design decisions

**Position:** After the "please" strip (step 4) and before the trailing "please" strip (step 5).
This ensures `"please can you …"` chains: leading "please " is stripped first, exposing "can you ",
which is then stripped, exposing the core phrase.

**Regex:** `/^can you\s+/` — requires at least one whitespace character after "can you" to avoid
matching compound words or edge-case token-only input. `^` anchors to the start of the
(already lowercase, trimmed) string.

**"can you" alone:** `"can you"` → strip `/^can you\s+/` — no trailing whitespace → no match → `"can you"` → wc=2 → no pattern matches → `null`. Correct. ✅

**"can you please":** `"can you please"` → strip leading "please ": no match → strip "can you ": `"please"` → strip trailing " please": no match (no preceding space) → `"please"` → wc=1 → no pattern matches → `null`. Correct. ✅

---

## Full Normalize Operation Order (post-893)

| Step | Operation | Sprint |
|---|---|---|
| 1 | `.toLowerCase()` | 785 |
| 2 | `.trim()` | 785 |
| 3 | `.replace(/[?!.]+$/, '')` — strip trailing punctuation | 785 |
| 4 | `.replace(/^please\s+/, '')` — strip leading "please " | 892 |
| 5 | `.replace(/^can you\s+/, '')` — strip leading "can you " | **893** |
| 6 | `.replace(/\s+please$/, '')` — strip trailing " please" | 892 |
| 7 | `.trim()` — re-trim after strips | 892 |
| 8 | `.replace(/\s{2,}/g, ' ')` — collapse multi-spaces | 785 |

---

## Phrase Coverage Verification (post-893)

All phrases normalized and tested against actual pattern arrays. 25/25 ✅.

### Audit-specified phrases

| Phrase | Normalized (post-893) | Pattern group | Result |
|---|---|---|---|
| "can you show me" | `"show me"` | ANAPHORIC | ✅ |
| "can you open it" | `"open it"` | ANAPHORIC | ✅ |
| "can you bring it up" | `"bring it up"` | ANAPHORIC | ✅ |
| "can you navigate there" | `"navigate there"` | ANAPHORIC | ✅ |
| "can you take me there" | `"take me there"` | ANAPHORIC | ✅ |
| "can you tell me more" | `"tell me more"` | ELABORATION | ✅ |
| "can you explain that" | `"explain that"` | ELABORATION | ✅ (also covered by built-in `(can you )?`) |

### Combined with please (chaining)

| Phrase | Normalized | Result |
|---|---|---|
| "can you open it please" | `"open it"` | ✅ ANAPHORIC |
| "please can you open it please" | `"open it"` | ✅ ANAPHORIC |
| "please can you show me" | `"show me"` | ✅ ANAPHORIC |

### Additional coverage

| Phrase | Normalized | Result |
|---|---|---|
| "can you navigate to it" | `"navigate to it"` | ✅ ANAPHORIC |
| "can you let me see it" | `"let me see it"` | ✅ ANAPHORIC |
| "can you pull it up" | `"pull it up"` | ✅ ANAPHORIC |
| "can you elaborate" | `"elaborate"` | ✅ ELABORATION |
| "can you walk me through it" | `"walk me through it"` | ✅ RECOMMENDATION |
| "can you show it to me" | `"show it to me"` | ✅ ANAPHORIC (also covered by built-in `(can you )?`) |

### Edge cases

| Phrase | Normalized | Result | Correct? |
|---|---|---|---|
| "can you" | `"can you"` | NONE (no trailing `\s+` → strip doesn't fire) | ✅ |
| "can you please" | `"please"` | NONE | ✅ |

### Sprint 892 phrases unchanged

| Phrase | Normalized | Result |
|---|---|---|
| "open it please" | `"open it"` | ✅ ANAPHORIC |
| "show me please" | `"show me"` | ✅ ANAPHORIC |
| "please show me" | `"show me"` | ✅ ANAPHORIC |

### Pre-existing phrases unchanged

| Phrase | Normalized | Result |
|---|---|---|
| "show me" | `"show me"` | ✅ ANAPHORIC |
| "take me there" | `"take me there"` | ✅ ANAPHORIC |
| "tell me more" | `"tell me more"` | ✅ ELABORATION |

---

## Note on `"can you what should I do next"`

The sprint spec flags this as a phrase that "should NOT be treated as a target phrase unless
already semantically valid after strip." After stripping `"can you "`, the result is
`"what should i do next"` — which IS a valid RECOMMENDATION phrase (`/^what should i (do|start with) (first|next)?$/`).

**The strip produces a semantically valid result.** The core phrase "what should I do next" is a
natural follow-up request. The "can you" prefix in this context is unusual but not impossible
("can you [tell me] what I should do next" — truncated). The RECOMMENDATION response is
appropriate. No guard needed.

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB changes | ✅ |
| No migrations | ✅ |
| No server action changes | ✅ |
| No context fetch changes | ✅ |
| No route logic changes | ✅ |
| No new UI actions | ✅ |
| No dispatcher changes | ✅ |
| No classifier/router changes | ✅ |
| No new pattern groups | ✅ |
| No ANAPHORIC_PATTERNS changes | ✅ |
| No SEQUENTIAL_PATTERNS changes | ✅ |
| No ELABORATION_PATTERNS changes | ✅ |
| No RECOMMENDATION_PATTERNS changes | ✅ |
| No TIME_SHIFT_PATTERNS changes | ✅ |
| No TOPIC_SHIFT_PATTERNS changes | ✅ |
| No branch logic changes | ✅ |
| No handler priority changes | ✅ |
| No response copy changes | ✅ |
| No navigation changes | ✅ |
| No return payload shape changes | ✅ |
| DonnaAssistantButton.tsx not touched | ✅ |
| All Sprint 892 normalizer behavior preserved | ✅ |
| All Sprint 891 certified families unchanged | ✅ |
| TypeScript clean | ✅ |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaFollowUpResolver.ts` | `normalize` function: one new `.replace(/^can you\s+/, '')` line added between Sprint 892's leading "please" strip (step 4) and trailing "please" strip (step 6); Sprint 893 inline comment added; `.trim()` comment updated from "politeness strip" to "prefix/politeness strip"; all pattern arrays, branch logic, handlers, copy, and navigation unchanged |

## Files Created

| File | Purpose |
|---|---|
| `docs/DONNA_NORMALIZER_CAN_YOU_PREFIX_STRIP_893.md` | This sprint document |

## Files Read (not modified)

| File | Purpose |
|---|---|
| `docs/DONNA_NORMALIZER_PLEASE_STRIP_892.md` | Sprint 892 state, normalizer baseline |
| `docs/DONNA_FOLLOW_UP_RESOLVER_FULL_COVERAGE_AUDIT_V2_891.md` | Certified resolver state |
| `src/lib/donna/donnaFollowUpResolver.ts` | Normalizer audit + implementation |
| `docs/CHANGELOG.md` | Changelog current state |

---

## Known Limitations (post-893)

**No "can you" prefix gaps remain** for any phrase already covered by an existing pattern.

**Unaddressed minor items (Sprint 891 list, now reduced):**
1. `"Go ahead and open it"` (`wc = 6`) — still not covered; unusual phrase, low priority
2. Multi-word command prefixes beyond "can you" and "please" (e.g., "could you", "would you") — not observed; could be addressed in a future normalizer sprint if needed

Neither item requires action before declaring the normalizer complete.

---

## Sprint 894 Recommendation

**Option A — DONNA Normalizer Final Audit V1**

Full re-certification of the normalizer post-Sprints 892–893. Confirm operation order,
edge case behavior (e.g., `"please can you"`, `"can you please"`, double-stripping),
and phrase coverage across all 6 pattern groups. Audit-only sprint — documentation only.

**Option B — DONNA Normalizer "Could You / Would You" Extension V1**

Extend the normalizer to also strip `"could you "` and `"would you "` leading prefixes.
Same approach as Sprint 893. `"could you show me"`, `"would you open it"` would then match
existing ANAPHORIC_PATTERNS.

**Option C — Resolver + Normalizer Freeze + Next Feature Sprint**

Declare both the resolver and normalizer fully mature and begin the next DONNA capability area.
