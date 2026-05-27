# Sprint 875 — DONNA Section Navigation Pattern Quality V1

**Date:** 2026-05-27
**Sprint:** 875
**Type:** Implementation — regex pattern quality fixes for 3 Category 1A section-navigation actions
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Sprint Goal

Fix 3 minor natural-language pattern gaps discovered during the Sprint 874 certification audit.

Each gap represents a documented `naturalLanguageExamples` entry in `donnaUIActionRegistry.ts` that
failed to match the corresponding `SECTION_NAV_ENTRIES` pattern in `donnaUIActionDispatcher.ts`.
Coaches who used the documented phrasing received a generic COO response instead of section navigation.

All 3 fixes are pure regex changes — no new registry actions, no routing changes, no DB/server/schema work.

---

## Affected Actions (all coach-scoped, Category 1A)

| Action ID | Entry | Fix |
|---|---|---|
| `navigate_to_coach_wrap_up_link` | SECTION_NAV_ENTRIES[12] | 4 changes (details below) |
| `navigate_to_wrapup_question` | SECTION_NAV_ENTRIES[13] | 1 addition |
| `navigate_to_wrapup_actions` | SECTION_NAV_ENTRIES[14] | 2 changes (details below) |

---

## Fix 1 — `navigate_to_coach_wrap_up_link`

**Registry examples (all were failing):**
- `"Show me where to wrap up."` — not in pattern
- `"Take me to after session."` — `after\s+session` was `after\s+session\s+section` (required "section")
- `"Where do I submit my notes?"` — not in pattern; `start|find` was required after "where do I"

**Pattern before (Sprint 870 original):**
```regex
/wrap.?up\s+(link|cta|button)|after\s+session\s+section|where\s+(do\s+i|to)\s+(start|find)\s+(the\s+)?wrap.?up|how\s+(do\s+i|to)\s+start\s+(the\s+)?wrap.?up/i
```

**Pattern after (Sprint 875):**
```regex
/wrap.?up\s+(link|cta|button)|after\s+session(\s+section)?|where\s+(do\s+i|to)\s+(start\s+|find\s+)?(the\s+)?wrap.?up|show\s+me\s+where\s+to\s+wrap.?up|how\s+(do\s+i|to)\s+start\s+(the\s+)?wrap.?up|where\s+(do\s+i|to)\s+submit\s+(my\s+)?notes?/i
```

**Changes:**
1. `after\s+session\s+section` → `after\s+session(\s+section)?` — makes "section" optional so "after session" and "after session section" both match
2. `(start|find)` → `(start\s+|find\s+)?` — makes the verb optional so "where do I wrap up" matches without requiring "start" or "find"
3. Added `show\s+me\s+where\s+to\s+wrap.?up` — covers "show me where to wrap up"
4. Added `where\s+(do\s+i|to)\s+submit\s+(my\s+)?notes?` — covers "where do I submit my notes" (routes to wrap-up CTA entry point, not the submit button on the wrap-up page — see Pattern Order note below)

**Pattern order note:** `navigate_to_coach_wrap_up_link` is evaluated BEFORE `navigate_to_wrapup_actions` in `SECTION_NAV_ENTRIES`. "Where do I submit my notes?" correctly routes here — the user is asking where to start the wrap-up flow. The submit button itself (`wrapup-nav-actions`) is on the wrap-up page, which the user reaches after clicking the CTA.

---

## Fix 2 — `navigate_to_wrapup_question`

**Registry example (failing):**
- `"Show me the current question."` — not in pattern

**Pattern before (Sprint 870 original):**
```regex
/wrap.?up\s+question|current\s+question\s+(in\s+)?wrap.?up|where\s+(do\s+i|to)\s+answer\s+(the\s+)?wrap.?up/i
```

**Pattern after (Sprint 875):**
```regex
/wrap.?up\s+question|current\s+question\s+(in\s+)?wrap.?up|where\s+(do\s+i|to)\s+answer\s+(the\s+)?wrap.?up|show\s+me\s+(the\s+)?current\s+question/i
```

**Change:** Added `show\s+me\s+(the\s+)?current\s+question` — matches "show me the current question" and "show me current question". No conflict with any other SECTION_NAV_ENTRIES entry.

---

## Fix 3 — `navigate_to_wrapup_actions`

**Registry examples (failing):**
- `"Take me to submit wrap-up."` — `submit\s+(for\s+)?review` required "for review" after submit; "submit wrap-up" (reversed order) was not matched
- `"Show me where to submit."` — not in pattern

**Pattern before (Sprint 870 original):**
```regex
/wrap.?up\s+(actions?|buttons?|submit|navigation)|submit\s+(for\s+)?review|finish\s+(the\s+)?wrap.?up|how\s+(do\s+i|to)\s+(submit|finish)\s+(the\s+|my\s+)?(session\s+notes?|wrap.?up)/i
```

**Pattern after (Sprint 875):**
```regex
/wrap.?up\s+(actions?|buttons?|submit|navigation)|submit\s+(wrap.?up|(for\s+)?review)|finish\s+(the\s+)?wrap.?up|how\s+(do\s+i|to)\s+(submit|finish)\s+(the\s+|my\s+)?(session\s+notes?|wrap.?up)|show\s+me\s+where\s+to\s+submit/i
```

**Changes:**
1. `submit\s+(for\s+)?review` → `submit\s+(wrap.?up|(for\s+)?review)` — adds "submit wrap-up" and "submit wrapup" as alternatives alongside the existing "submit for review" and "submit review"
2. Added `show\s+me\s+where\s+to\s+submit` — covers "show me where to submit"

**Pattern order note:** `navigate_to_wrapup_actions` is evaluated AFTER `navigate_to_coach_wrap_up_link`. "Show me where to submit" correctly routes here (the submit button is on the wrap-up page); "Where do I submit my notes?" correctly routes to the earlier entry (the wrap-up CTA entry point on the session page).

---

## Failing → Passing Phrase Map

| Phrase | Before Sprint 875 | After Sprint 875 |
|---|---|---|
| "Show me where to wrap up." | COO (no match) | `navigate_to_coach_wrap_up_link` ✅ |
| "Take me to after session." | COO (no match) | `navigate_to_coach_wrap_up_link` ✅ |
| "After session." | COO (no match) | `navigate_to_coach_wrap_up_link` ✅ |
| "Where do I wrap up?" | COO (no match) | `navigate_to_coach_wrap_up_link` ✅ |
| "Where do I submit my notes?" | COO (no match) | `navigate_to_coach_wrap_up_link` ✅ |
| "Show me the current question." | COO (no match) | `navigate_to_wrapup_question` ✅ |
| "Show me current question." | COO (no match) | `navigate_to_wrapup_question` ✅ |
| "Take me to submit wrap-up." | COO (no match) | `navigate_to_wrapup_actions` ✅ |
| "Submit wrap-up." | COO (no match) | `navigate_to_wrapup_actions` ✅ |
| "Show me where to submit." | COO (no match) | `navigate_to_wrapup_actions` ✅ |

---

## Preserved Behaviour (unchanged)

All existing passing phrases continue to match the same entries as before Sprint 875:

| Phrase | Entry | Status |
|---|---|---|
| "Wrap-up link." | `navigate_to_coach_wrap_up_link` | ✅ unchanged |
| "After session section." | `navigate_to_coach_wrap_up_link` | ✅ unchanged |
| "Where do I find the wrap-up?" | `navigate_to_coach_wrap_up_link` | ✅ unchanged |
| "How do I start wrap-up?" | `navigate_to_coach_wrap_up_link` | ✅ unchanged |
| "Wrap-up question." | `navigate_to_wrapup_question` | ✅ unchanged |
| "Where do I answer wrap-up?" | `navigate_to_wrapup_question` | ✅ unchanged |
| "Wrap-up actions." | `navigate_to_wrapup_actions` | ✅ unchanged |
| "Submit for review." | `navigate_to_wrapup_actions` | ✅ unchanged |
| "Finish the wrap-up." | `navigate_to_wrapup_actions` | ✅ unchanged |
| "How do I submit my session notes?" | `navigate_to_wrapup_actions` | ✅ unchanged |

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/donnaUIActionDispatcher.ts` | Updated `pattern:` field for 3 entries in `SECTION_NAV_ENTRIES` (`navigate_to_coach_wrap_up_link`, `navigate_to_wrapup_question`, `navigate_to_wrapup_actions`) to match all documented `naturalLanguageExamples` from the registry |

## Files NOT Modified

| File | Reason |
|---|---|
| `src/lib/donna/donnaUIActionRegistry.ts` | No change — `naturalLanguageExamples` already correct; dispatcher patterns are now aligned |
| `src/components/assistant/DonnaAssistantButton.tsx` | No change — routing architecture unchanged |
| `src/lib/donna/donnaConversationalRouter.ts` | No change — COO path unchanged |
| `src/lib/donna/donnaFollowUpResolver.ts` | No change — follow-up resolver unchanged |
| `src/lib/donna/donnaFocusTarget.ts` | No change |
| `src/components/donna/DonnaHighlightBanner.tsx` | No change |
| All SQL / migrations / seed / env files | Not in scope |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — pure regex in client-side dispatcher |
| No DB reads | ✅ — dispatcher is a pure TypeScript function |
| No server actions | ✅ — no server-side changes |
| No mutations | ✅ — navigation + visual guidance only |
| No new packages | ✅ — none |
| No new registry actions | ✅ — 14 Category 1A actions unchanged |
| No routing architecture changes | ✅ — SECTION_NAV_ENTRIES order unchanged |
| No role boundary changes | ✅ — `allowedRoles` fields unchanged |
| Backward compatible | ✅ — all existing matching phrases still match same entries |
| Sprint 872 ctxParams intact | ✅ — `resolve` functions and ctxParams signatures unchanged |
| Sprint 873 sessionIntentContext intact | ✅ — navigate + clarification handlers unchanged |
| Sprint 874 certification preserved | ✅ — 11 previously-passing actions unmodified |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-875)

| Limitation | Impact | Resolution |
|---|---|---|
| `after\s+session(\s+section)?` matches bare "after session" | Theoretical false positive if "after session" appears in a longer phrase without intent to navigate. Risk is negligible: pattern is coach-role-scoped; "after session" in coach context unambiguously refers to the After Session section | Low impact; can add negative lookahead in a future sprint if false positives emerge |
| 4 Sprint 868 focus IDs still not registered | `session-group-assignment`, `template-level-picker`, `coach-players-section`, `coach-player-watch-list` have no Category 1A actions | Low priority — no user-reported failures |

---

## Sprint 876 Recommendation

**Sprint 876 — DONNA Conversational Follow-Up Depth V1**

`sessionIntentContext.lastIntentFamily` is set to `'coo_answer'` for all section-navigation results
(Sprint 873 known limitation). A dedicated `'section_nav'` intent family would allow `resolveFollowUp`
to distinguish between COO answers and section-nav results when building follow-up context.

No DB changes or migrations required.
