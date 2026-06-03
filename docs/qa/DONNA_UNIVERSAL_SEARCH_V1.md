# DONNA Universal Academy Search V1 — QA Certification

Sprint 1731–1740

---

## What changed

`entityResolution.ts` previously resolved players only from `DirectorAttentionItem[]` (attention-flagged players). "Open Jamie" would fail if Jamie had no active attention flag.

Sprint 1731 adds `universalSearchResolver.ts` which uses data already loaded in `DirectorDonnaContext` to search the full roster and additional entity types.

---

## Resolution coverage

| Entity | Source data | Route |
|---|---|---|
| Player (any) | `playerCurriculumStateSummaries` (up to 30) + `attentionItems` | `/director/players/[id]` |
| Curriculum level | Level key map (static) | `/director/curriculum?improve=[key]` |
| Template | `templateSummaries` (name match) | `/director/fitness/templates/[id]` or `/director/class-templates/[id]` |
| Session | keyword detection | `/director/sessions` |
| Assessment | `assessmentSummaries` cross-referenced with player name | `/director/players/[id]` |
| Coach | Honest fallback (names not in ctx) | N/A — message only |
| Parent update | keyword detection | `/director/review` |
| Review queue | keyword detection | `/director/review` |

---

## Command scenarios

### 1. "Open Jamie" — player in roster, not in attention list
- Triggers `isDeepLinkCommand()` → `resolveEntityFromText()` → attention-items miss → `resolveUniversalFallback()` → `resolvePlayerFromFullRoster()`
- Result: resolves Jamie, DONNA says "Opening Jamie's profile." + nav offer
- Acceptance: ✓

### 2. "Review Jamie" — attention-listed player
- Triggers guided workflow path → `resolveEntityFromText(trimmed, directorCtx)` → attentionItems hit
- Result: resolves Jamie, workflow starts with player-specific route
- Acceptance: ✓ (existing behavior, unchanged)

### 3. "Why is Jamie stuck?"
- Triggers `WHY_STUCK_PATTERN` intercept in Shell (fires before deep-link handler)
- `buildWhyStuckAnswer()` resolves player from full roster, checks `playerProgressStalls`
- If stall found: "Jamie has been at Orange Ball 2 for 145 days without advancing. This is a high-severity stall."
- If no stall: "Jamie doesn't have a recorded progress stall at Orange Ball 2. They are advancement-eligible — review their evidence and confirm promotion."
- Acceptance: ✓

### 4. "Show Orange Ball 2"
- Triggers `isDeepLinkCommand()` → `resolveEntityFromText()` → `resolveCurriculumLevel()`
- Result: routes to `/director/curriculum?improve=orange_ball_2`
- Acceptance: ✓ (existing behavior, unchanged)

### 5. "Open Coach Alex"
- Triggers `isDeepLinkCommand()` → `resolveEntityFromText()` → all pass → `resolveUniversalFallback()` → `/\bcoach\b/i` detected → `resolveCoachByName()`
- Result: DONNA says "I don't have coach profile links loaded in my current context. Search for 'Alex' in the Players directory."
- Acceptance: ✓ — honest, no fake routing

### 6. "Show today's sessions"
- Triggers `isDeepLinkCommand()` → `resolveEntityFromText()` → `resolveUniversalFallback()` → `resolveSessionRoute()`
- Result: DONNA says "Opening today's sessions." + nav offer to `/director/sessions`
- Acceptance: ✓

### 7. "Open pending parent updates"
- Triggers `isDeepLinkCommand()` → `resolveEntityFromText()` → `resolveReviewQueue()` matches
- Result: routes to `/director/review`
- Acceptance: ✓

### 8. "Find latest assessment for Jamie"
- Triggers `FIND_ASSESSMENT_PATTERN` intercept in Shell (fires before deep-link handler)
- `resolveAssessmentForPlayer()` resolves player from roster, finds latest in `assessmentSummaries`
- Result: "Opening Jamie's profile. Latest assessment: intake on Jun 1, 2026."
- If no assessments: "No assessments found for Jamie yet. Opening their profile."
- Acceptance: ✓

### 9. Ambiguous match — "Open Jamie" when two Jamies exist
- `resolvePlayerFromFullRoster()` returns `ambiguous: true`, candidates list
- Shell returns: "I found 2 players matching 'Jamie': 'Jamie Chen', 'Jamie Torres'. Which one did you mean?"
- No navigation occurs until clarified
- Acceptance: ✓

### 10. No match — player not in loaded roster
- `resolvePlayerFromFullRoster()` returns not resolved
- DONNA says: "I don't see a player named 'X' in the loaded roster (30 players shown). They may not be in the first 30 loaded, or the name may differ. Try the Players directory."
- No fake route
- Acceptance: ✓

---

## Safety invariants

- No DB calls — all resolution uses data already in `DirectorDonnaContext`
- No mutations — read-only routing only
- No fake routing — every "not found" path returns an honest message
- Coach resolution always returns honest fallback (names not in ctx)
- Player cap is disclosed in fallback message (30 players)
- All new routes point to existing pages only

---

## Known limitations

| Limitation | Impact |
|---|---|
| `playerCurriculumStateSummaries` capped at 30 | Players 31+ not findable by name — honest message returned |
| Coach names not in `DirectorDonnaContext` | Coach-by-name routing not possible — honest redirect message |
| Assessment routing lands on player profile, not a dedicated assessment tab | Minor — profile contains assessment history |
| Template name matching is case-insensitive partial match (no fuzzy) | Typos in template names will not match |
| `resolveTemplateByName()` requires the name to appear in `templateSummaries` (max 30) | Templates 31+ not reachable by name |

---

## Manual test checklist

- [ ] Say "Open [player without attention flag]" → DONNA opens their profile
- [ ] Say "Why is [stalled player] stuck?" → DONNA gives stall reason + offers profile nav
- [ ] Say "Why is [non-stalled player] stuck?" → DONNA says no stall recorded
- [ ] Say "Find latest assessment for [player with assessment]" → DONNA shows date + type
- [ ] Say "Find latest assessment for [player with no assessment]" → DONNA says "no assessments yet"
- [ ] Say "Open Coach Alex" → DONNA gives honest "coach names not loaded" message
- [ ] Say "Show today's sessions" → DONNA offers nav to `/director/sessions`
- [ ] Say "Open pending parent updates" → DONNA routes to `/director/review`
- [ ] Say "Open [ambiguous name with 2 matches]" → DONNA asks which one
- [ ] Say "Open [name not in any list]" → DONNA gives honest not-found message with suggestions
- [ ] TypeScript: clean ✓
