# DONNA Entity Resolution V1

**Sprint:** Mega Sprint 1721–1730
**Date:** 2026-06-03
**File:** `src/lib/donna/workflows/entityResolution.ts`

---

## Resolution Functions

| Function | Input | Output | Status |
|---|---|---|---|
| `resolvePlayerFromText(text, attentionItems)` | Natural language + attention items | `ResolutionResult` | PASS |
| `resolveCurriculumLevel(text)` | Natural language | `ResolvedEntity \| null` | PASS |
| `resolveReviewQueue(text)` | Natural language | `ResolvedEntity \| null` | PASS |
| `resolveEntityFromText(text, ctx)` | Natural language + DirectorDonnaContext | `ResolutionResult` | PASS |
| `isDeepLinkCommand(text)` | Natural language | `boolean` | PASS |

---

## Player Resolution

### Lookup source
Uses `DirectorDonnaContext.attentionItems[]` — players with active attention flags.
Only players with `playerId` and `playerName` non-null are matched.

### Match algorithm
Case-insensitive first-name match. "Jamie" matches "Jamie Chen", "Jamie Smith", etc.

### Resolution outcomes

| Scenario | Result | Message |
|---|---|---|
| One match | `resolved: true`, route = `/director/players/{uuid}` | "Opening Jamie Chen's profile." |
| Multiple matches | `ambiguous: true`, candidates listed | "I found 2 players matching Jamie: Jamie Chen or Jamie Smith. Which one?" |
| No match in list | `resolved: false` | "I don't have a player named Jamie in the current attention list..." |
| No attentionItems loaded | `resolved: false` | "I don't have any attention-flagged players loaded right now. Ask 'Who needs attention?' first." |
| No name extracted | `resolved: false` | "I couldn't identify a player name. Try: 'Review [player name]'." |

### V1 limitation
Only resolves players with active attention flags. Full roster search requires a dedicated query. Directors can use "Who needs attention?" first to load the player list.

---

## Curriculum Level Resolution

| Command | Key | Route | Status |
|---|---|---|---|
| "Open Orange Ball 2" | `orange_ball_2` | `/director/curriculum?improve=orange_ball_2` | PASS |
| "Review Red Ball 1" | `red_ball_1` | `/director/curriculum?improve=red_ball_1` | PASS |
| "Show Green Dot" | `green_dot` | `/director/curriculum?improve=green_dot` | PASS |
| "Open High Performance" | `high_performance` | `/director/curriculum?improve=high_performance` | PASS |

---

## Review Queue Resolution

| Command | Route | Status |
|---|---|---|
| "Review parent updates" | `/director/review` | PASS |
| "Review parent communication" | `/director/review` | PASS |
| "Review placement" | `/director/review` | PASS |
| "Open review queue" | `/director/review` | PASS |
| "Open approvals" | `/director/review` | PASS |

---

## Universal Deep Link Commands

`isDeepLinkCommand(text)` returns true for:

```
open | show | take me to | find | review | help | guide me through | what about | check on | why is
```

These commands trigger `resolveEntityFromText` before falling through to other handlers.
If resolution fails, the message falls through naturally to the next routing handler (not blocked).

---

## Natural Language Support

All of these resolve correctly:

| Command | Resolves to |
|---|---|
| "Review Jamie" | Player profile (if in attention list) |
| "Open Jamie" | Player profile |
| "Show Jamie" | Player profile |
| "Take me to Jamie" | Player profile |
| "Why is Jamie stuck?" | Player profile |
| "Help Jamie" | Player profile |
| "Review Orange Ball 2" | Curriculum page |
| "Open Orange Ball 2" | Curriculum page |
| "Show Orange Ball 2" | Curriculum page |
| "Review parent updates" | Review Center |
| "Review placement" | Review Center |
| "Open review queue" | Review Center |
