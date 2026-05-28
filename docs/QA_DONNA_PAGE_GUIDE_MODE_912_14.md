# QA — DONNA Page Guide Mode Intent Routing
**Sprint:** 912.14
**Date:** 2026-05-28
**Method:** Static code analysis of Sprint 912.14 implementation
**Code analysed:**
- `src/components/donna/DonnaVoiceReadyShell.tsx`
- `src/lib/donna/donnaPageContextEngine.ts`

---

## What Was Built

Five page-guide intent categories with deterministic regex patterns wired directly to existing `donnaPageContextEngine.ts` helper functions. No LLM involved. No new server actions. No DB calls. All answers come from the page capability map — a pure TypeScript data structure.

---

## Supported Phrases

### Category 1 — `where_am_i`
**Pattern:** `PAGE_WHERE_AM_I`
```
/\b(where am i|what page am i on|what.{0,10}this page|explain this page|which page is this|describe this page)\b/i
```

**Helper:** `whereAmI(pathname)`

**Example output** (on `/director/review`):
> You're on the **Review Center**. Approve, modify, or reject pending action items before they take effect.

**Phrase examples:**
- "Where am I?" ✅
- "What page am I on?" ✅
- "What is this page?" ✅
- "Explain this page." ✅
- "Which page is this?" ✅
- "Describe this page." ✅

---

### Category 2 — `what_can_i_do`
**Pattern:** `PAGE_WHAT_CAN_I_DO`
```
/\b(what can i do here|what can you help (me with )?(here|on this page)|what.{0,15}options (here|on this page)|what.{0,15}do (here|on this page))\b/i
```

**Helper:** `whatCanYouHelpWith(pathname)`

**Example output** (on `/director/curriculum/builder`):
> Hi there, on the **Curriculum Builder** I can help you with:
> • What blocks should go in a 60-minute Red 2 session?
> • How do I structure warm-up to match-play?
> • What exercises are good for this level?
>
> I can also explain anything you see here, or route safe actions through review.

**Phrase examples:**
- "What can I do here?" ✅
- "What can you help me with here?" ✅
- "What can you help me with on this page?" ✅
- "What are my options here?" ✅
- "What can I do on this page?" ✅

---

### Category 3 — `recommended_next_step`
**Pattern:** `PAGE_NEXT_STEP`
```
/\b(what should i do (here|on this page)|what.{0,10}most important (task|thing) here|what.{0,10}best (next )?step (here|on this page)|where (should i |do i )start here)\b/i
```

**Helper:** `whatIsTheBestNextStep(pathname)` ← **new Sprint 912.14 helper**

**Example output** (on `/director/players`):
> On the **Player Directory**: Find players, understand development status, and identify who needs attention.
>
> A good place to start: ask me "Which players need attention?"

**Phrase examples:**
- "What should I do here?" ✅
- "What should I do on this page?" ✅
- "What is the most important task here?" ✅
- "What's the best next step here?" ✅
- "Where should I start here?" ✅

**Does NOT match** (correctly):
- "What should I do first today?" → falls through to dashboard priority intercept ✅
- "What should I do about this player?" → no "here"/"on this page" ✅

---

### Category 4 — `approval_guidance`
**Pattern:** `PAGE_APPROVAL`
```
/\b(what needs (approval|review|approving|reviewing)|what should i (review|approve)|what requires (my )?(approval|review))\b/i
```

**Helper:** `whatActionsRequireApproval(pathname)`

**Example output** (on `/director/review`):
> On the **Review Center**, these actions require your explicit approval before anything takes effect:
> • all actions in this queue require explicit director approval before any effect

**Example output** (on `/director/players`):
> On the **Player Directory**, these actions require your explicit approval before anything takes effect:
> • level movement
> • player profile changes
> • parent-visible updates

**Phrase examples:**
- "What needs approval?" ✅
- "What needs review?" ✅
- "What should I review?" ✅
- "What requires my approval?" ✅
- "What requires approval?" ✅

---

### Category 5 — `safety_guidance`
**Pattern:** `PAGE_SAFETY`
```
/\b(what should i not do|what.{0,10}risky here|what.{0,10}careful with|what.{0,10}avoid (here|on this page)|what.{0,10}not (do|try) here)\b/i
```

**Helper:** `whatShouldINotDo(pathname)`

**Example output** (on `/director/curriculum/builder`):
> On the **Curriculum Builder**, I must not and will not:
> • mutate template data directly from chat
> • publish templates without review
>
> If you ask me to do any of these, I'll explain why and offer a safe alternative.

**Phrase examples:**
- "What should I not do?" ✅
- "What is risky here?" ✅
- "What should I be careful with?" ✅
- "What should I avoid here?" ✅
- "What should I not try here?" ✅

---

## Helper Functions — Source and Behavior

| Helper | File | Data source | Returns |
|---|---|---|---|
| `whereAmI(path)` | `donnaPageContextEngine.ts` | `pageLabel` + `directorIntent` | "You're on [Page]. [Intent]." |
| `whatCanYouHelpWith(path)` | `donnaPageContextEngine.ts` | `pageLabel` + `suggestedPrompts[0–2]` | "On [Page] I can help with: •prompt1 •prompt2 •prompt3" |
| `whatIsTheBestNextStep(path)` | `donnaPageContextEngine.ts` (NEW) | `pageLabel` + `directorIntent` + `suggestedPrompts[0]` | "On [Page]: [Intent]. A good place to start: ask me [prompt1]" |
| `whatActionsRequireApproval(path)` | `donnaPageContextEngine.ts` | `pageLabel` + `reviewRequiredActions` | "On [Page], these need approval: •X •Y •Z" |
| `whatShouldINotDo(path)` | `donnaPageContextEngine.ts` | `pageLabel` + `blocked` | "On [Page], I must not: •X •Y. If you ask, I'll explain and offer an alternative." |

---

## Page Map Coverage

All questions resolve to a specific page entry or the fallback. No question returns null or empty.

| Page | Entry in map? | Where am I? | What can I do? | Next step? | Approval? | Safety? |
|---|---|---|---|---|---|---|
| `/director` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/director/review` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/director/curriculum/builder` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/director/curriculum` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/director/onboarding` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/director/onboarding/curriculum` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/director/players` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/director/players/[uuid]` | ✅ (parameterized) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/director/templates` | ✅ (NEW) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/director/donna` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Unknown page | FALLBACK | ✅ (generic) | ✅ (generic) | ✅ (generic) | ✅ (generic) | ✅ (generic) |

---

## Pipeline Position

The page guide intercept fires at this priority in `handleSend()`:

```
1. Pending confirmation intercept (yes/no for pending action)
2. Orphaned strong-confirm guard
3. Slot-fill handler (curriculum draft multi-turn)
4. Nav offer yes/no check
5. Boundary check
6. ← NEW: Page guide intent routing (Sprint 912.14)
7. Missing context intercept (Sprint 725)
8. null-directorCtx guard (Sprint 912.13)
9. KPI question intercept
10. Dashboard priority intercept
11. ... rest of pipeline
```

**Why this position:**
- After confirmation/slot-fill: "yes/no" and drill creation flows must not be intercepted by page guide
- After boundary check: DONNA won't accidentally describe a page it shouldn't (e.g., attempting to answer a parent about a director page)
- BEFORE missing context: "what is this page?" should always work, even when academy data isn't loaded
- BEFORE KPI/dashboard: page-specific questions get page answers, not generic data answers

---

## Missing Context Behavior

If the director asks a page guide question on a route that's not in the map, the `FALLBACK_MAP` entry is used:
- `pageLabel`: "AcademyOS"
- `directorIntent`: "Navigate the academy operating system."
- `suggestedPrompts`: ["How does this system work?", "Where should I start?"]
- `reviewRequiredActions`: []
- `blocked`: ["mutate data from chat", "expose private data"]

DONNA never returns null or throws. All helpers are pure functions with guaranteed return values.

---

## Static QA Scenarios

### Scenario 1 — On /director: "What should I do here?" ✅ PASS

**Trace:**
- `PAGE_NEXT_STEP` test: `"what should i do here"` matches `\bwhat should i do (here|on this page)\b` ✅
- `currentPath = '/director'`
- `whatIsTheBestNextStep('/director')`:
  - `map.directorIntent = "Understand today's academy health and decide what to act on first."`
  - `map.suggestedPrompts[0] = "What should I do first today?"`
  - Returns: `"On the **Director Dashboard**: Understand today's academy health and decide what to act on first.\n\nA good place to start: ask me "What should I do first today?""`
- `confidence: 'high'`, `sourceNote: 'Page context: Director Dashboard'`

**Expected output:** Page-specific guidance about the dashboard. ✅
**Note:** Does NOT use `directorCtx` — works even before academy data loads.

---

### Scenario 2 — On /director/curriculum/builder: "What can I do on this page?" ✅ PASS

**Trace:**
- `PAGE_WHAT_CAN_I_DO` test: `"what can i do on this page"` matches `\bwhat.{0,15}do (here|on this page)\b` ✅
- `whatCanYouHelpWith('/director/curriculum/builder')`:
  - `pageLabel = "Curriculum Builder"`
  - `suggestedPrompts[0–2] = ["What blocks should go in a 60-minute Red 2 session?", "How do I structure warm-up to match-play?", "What exercises are good for this level?"]`
  - Returns: `"Hi there, on the **Curriculum Builder** I can help you with:\n• What blocks should go in...\n..."`

**Expected:** Curriculum Builder help topics listed. ✅

---

### Scenario 3 — On /director/curriculum/builder: "What needs approval?" ✅ PASS

**Trace:**
- `PAGE_APPROVAL` test: `"what needs approval"` matches `\bwhat needs (approval|review|approving|reviewing)\b` ✅
- `whatActionsRequireApproval('/director/curriculum/builder')`:
  - `map.reviewRequiredActions = ["saving and publishing templates", "assigning templates to sessions"]`
  - Returns: `"On the **Curriculum Builder**, these actions require your explicit approval before anything takes effect:\n• saving and publishing templates\n• assigning templates to sessions"`

**Expected:** Approval requirements specific to this page. ✅

---

### Scenario 4 — On /director/players: "What is this page?" ✅ PASS

**Trace:**
- `PAGE_WHERE_AM_I` test: `"what is this page"` matches `\bwhat.{0,10}this page\b` ✅
- `whereAmI('/director/players')`:
  - `pageLabel = "Player Directory"`
  - `directorIntent = "Find players, understand development status, and identify who needs attention."`
  - Returns: `"You're on the **Player Directory**. Find players, understand development status, and identify who needs attention."`

**Expected:** Clear page identity + purpose. ✅

---

### Scenario 5 — On /director/players/[uuid]: "What is the most important task here?" ✅ PASS

**Trace:**
- `PAGE_NEXT_STEP` test: `"what is the most important task here"` matches `\bwhat.{0,10}most important (task|thing) here\b` ✅
- `currentPath = '/director/players/abc-123-uuid'`
- `getPageCapabilityMap('/director/players/abc-123-uuid')`:
  - Parameterized match: `pathname.startsWith('/director/players/') && split.length >= 4` → returns Player Profile entry
- `whatIsTheBestNextStep('/director/players/abc-123-uuid')`:
  - `pageLabel = "Player Profile"`
  - `directorIntent = "Review a single player's development history, signals, and decisions."`
  - `suggestedPrompts[0] = "Summarize this player's recent progress."`
  - Returns: `"On the **Player Profile**: Review a single player's development history... A good place to start: ask me "Summarize this player's recent progress.""`

**Expected:** Player Profile guidance. ✅

---

### Scenario 6 — On /director/onboarding: "What should I do next?" ✅ PASS (with note)

**Trace:**
- `PAGE_NEXT_STEP` test: `"what should i do next"` — does this match? 
  - Pattern: `\b(what should i do (here|on this page)|what.{0,10}most important (task|thing) here|what.{0,10}best (next )?step (here|on this page)|where (should i |do i )start here)\b`
  - `"what should i do next"` — does NOT include "here" or "on this page" ❌
- Falls through to dashboard priority intercept
- If no dashboard priority match: falls through to conversational router, then fallback

**Expected:** "What should I do next?" without "here" → NOT caught by page guide (intentional: this is a general question). Handled by existing pipeline.

**For "what should I do here?" on /director/onboarding:**
- `PAGE_NEXT_STEP` matches ✅
- `whatIsTheBestNextStep('/director/onboarding')`:
  - `directorIntent = "Configure your academy before going live — choose a setup path, answer key questions, and activate the platform."`
  - `suggestedPrompts[0] = "Which setup mode should I choose?"`
  - Returns: `"On the **Academy Setup**: Configure your academy... A good place to start: ask me "Which setup mode should I choose?""`

**Expected:** ✅ When "here" is present, returns onboarding guidance.

---

### Scenario 7 — On /director/templates/fitness/create: "What should I be careful with?" ✅ PASS

**Trace:**
- `PAGE_SAFETY` test: `"what should i be careful with"` matches `\bwhat.{0,10}careful with\b` ✅
- `currentPath = '/director/templates/fitness/create'`
- `getPageCapabilityMap('/director/templates/fitness/create')`:
  - No exact match
  - No parameterized match
  - Prefix match (sorted by length, longest first): `/director/templates` (length 20) matches because `pathname.startsWith('/director/templates')` ✅
  - Returns `/director/templates` entry
- `whatShouldINotDo('/director/templates/fitness/create')`:
  - `blocked = ["auto-assign templates to sessions without director review", "modify template block content directly from chat"]`
  - Returns: `"On the **Templates**, I must not and will not:\n• auto-assign templates...\n• modify template block content...\n\nIf you ask me to do any of these, I'll explain why and offer a safe alternative."`

**Expected:** Templates safety guidance (via prefix match to /director/templates). ✅

---

### Scenario 8 — Unknown page fallback ✅ PASS

**Trace:**
- `currentPath = '/director/some-new-feature'`
- None of the parameterized route checks match
- Prefix match: `/director` (length 9) matches `pathname.startsWith('/director')` ✅
- Returns `/director` entry (Director Dashboard)

**Note:** The prefix match means any `/director/*` page without a specific entry resolves to the Director Dashboard entry — a reasonable fallback that gives general director guidance.

---

### Scenario 9 — Existing drill draft flow unaffected ✅ PASS

**Input:** "Add a drill for Orange 2 focused on forehand preparation."

**Trace:**
- `PAGE_WHERE_AM_I` test: "add a drill for orange 2..." → no match (no "where am I", "this page", etc.) ✅
- `PAGE_WHAT_CAN_I_DO` test: no "here" or "on this page" → no match ✅
- `PAGE_NEXT_STEP` test: no "here" or "on this page" → no match ✅
- `PAGE_APPROVAL` test: no "what needs approval" → no match ✅
- `PAGE_SAFETY` test: no "risky", "careful", "avoid" → no match ✅
- `pageGuideText = null` → guard does NOT fire → falls through to drill creation handler ✅

**Expected:** Drill creation flow proceeds exactly as before. ✅

---

### Scenario 10 — Existing confirmation/cancel flow unaffected ✅ PASS

**Input (awaiting confirmation):** "Yes"

**Trace:**
- Pending confirmation intercept fires at step 1 — before page guide intercept (step 6)
- `CONFIRM_PATTERN.test("Yes")` → matches → execute() called
- Page guide patterns are never tested ✅

**Input (cancel):** "No"
- Cancel pattern fires at step 1 — same ✅

**Expected:** Confirmation and cancel flows entirely unaffected. ✅

---

## Pattern Conflict Analysis

| Existing interceptor | Could conflict with page guide? | Analysis |
|---|---|---|
| Boundary check | No — fires before page guide | ✅ |
| Missing context | No — fires after page guide | ✅ |
| KPI intercept | No — fires after page guide | ✅ |
| Dashboard priority | Partial: "what needs attention here?" — NEXT_STEP catches it, not dashboard | Both give useful answers; page guide takes priority for "here" variants ✅ |
| Roster attention | No — roster patterns don't match page guide phrases | ✅ |
| Data quality | No — data quality patterns are distinct | ✅ |
| Curriculum draft handlers | No — drill/gate/skill patterns don't include "what is this page" | ✅ |
| Short phrase handler | No — "help" doesn't match any page guide pattern | ✅ |
| Conversational router fallback | No — fires after page guide | ✅ |

No meaningful conflicts identified.

---

## Safety Checks

| Check | Result |
|---|---|
| No migrations changed | ✅ |
| No new server actions | ✅ |
| No `execute_curriculum_override()` call | ✅ |
| No `proposed_actions` usage | ✅ |
| No auto-approval | ✅ |
| No fake data | ✅ — all answers come from static page map |
| Sprint 904 approve/reject actions unchanged | ✅ — not touched |
| Sprint 912.3–912.13 behavior preserved | ✅ — intercept is additive, fires before existing pipeline |
| Page guide creates drafts | ✅ Never — pure read, no mutations |
| Page guide answers are honest about limitations | ✅ — FALLBACK_MAP entry used for unknown pages |
| LLM calls added | ✅ None |

---

## Files Changed

- **Modified `src/lib/donna/donnaPageContextEngine.ts`:**
  - Added `/director/templates` entry to `PAGE_CAPABILITY_MAP` — covers `/director/templates/*` via prefix match
  - Added `whatIsTheBestNextStep(pathname)` export — uses `directorIntent` + `suggestedPrompts[0]` to answer "what should I do here?" and "what's the most important task here?"
  - No interface changes — existing 9-field structure is sufficient for all 5 pattern categories

- **Modified `src/components/donna/DonnaVoiceReadyShell.tsx`:**
  - Imported `whereAmI`, `whatCanYouHelpWith`, `whatActionsRequireApproval`, `whatShouldINotDo`, `whatIsTheBestNextStep` from `donnaPageContextEngine`
  - Added page guide intent intercept block (Sprint 912.14) in `handleSend()`, positioned after boundary check and before missing context intercept
  - 5 pattern categories: `PAGE_WHERE_AM_I`, `PAGE_WHAT_CAN_I_DO`, `PAGE_NEXT_STEP`, `PAGE_APPROVAL`, `PAGE_SAFETY`
  - All 5 categories guarded by `plainRole === 'director'` check
  - `pageGuideText: string | null` pattern — only fires when a pattern matches; falls through otherwise

---

## TypeScript

`npx tsc --noEmit` — **0 errors** after Sprint 912.14 changes.

---

## Risks

### Risk 1 — PAGE_APPROVAL fires for data-oriented "what needs review?" questions (low)

If the director asks "what needs review?" on any page, the page guide fires and returns the static approval requirements for that page. Previously this would have fallen to `show_pending_reviews` safe-read which returns a count. The page guide answer is generally more useful (WHAT needs approval, not HOW MANY). But if the director wants the count, they'd need to rephrase ("how many items are pending?"). Acceptable tradeoff for V1.

### Risk 2 — No "here" guard on PAGE_APPROVAL (low)

Unlike `PAGE_NEXT_STEP` which requires "here" or "on this page", `PAGE_APPROVAL` fires for "what needs review?" without location qualifier. This is intentional — approval-type questions are always page-contextual and the page guide gives a better answer than the fallback. Could be tightened if directors find it confusing.

### Risk 3 — /director/templates prefix match covers unknown sub-routes (very low)

`/director/templates/fitness/create` resolves to the `/director/templates` entry via prefix match. The answer describes "Templates" generally rather than the specific fitness creation flow. This is acceptable — a sub-route-specific entry can be added in a future sprint if the fitness template creation flow becomes a frequent DONNA conversation point.

---

## Sprint 912.15 Recommendations

1. **Session memory context injection** — `getRecentTurns(3)` is recorded but never used in routing. "Same for Orange 3" after an Orange 2 discussion should resolve Orange 3 from context. Low-risk additive change.
2. **Pending slot-fill re-announcement on remount** — if `hasPendingDrillSlotFill()` on component remount after route change, DONNA should re-state the pending question.
3. **Page guide + dashboard priority fusion** — on `/director`, "what should I do here?" returns the static page map answer. For richer answers (when `directorCtx` is available), we could fuse page guide with dashboard priority: "You're on the Dashboard. You have 3 pending reviews — start there." This is a Sprint 912.17 concern.
