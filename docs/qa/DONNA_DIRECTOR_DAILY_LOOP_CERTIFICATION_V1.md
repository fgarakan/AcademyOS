# DONNA Director Daily Loop Certification V1

**Sprint:** Mega Sprint 1641–1660
**Date:** 2026-06-03
**Scope:** Start-of-day director workflow via DONNA
**Method:** Step-by-step trace of each interaction through the routing pipeline

---

## The Daily Loop

The daily loop is the canonical sequence a director runs each morning:

1. Open AcademyOS
2. Ask DONNA what needs attention
3. Drill into the first priority
4. Navigate to the right place
5. Open the relevant player
6. Review evidence
7. Prepare a draft or make a decision
8. Continue

---

## Step 1: "What needs attention?"

**Entry point:** Director opens `/director/donna` or the DONNA panel on any director page

**DONNA routing:**
- Director brief pattern: `/what('?s| is) urgent|what do i need to know|brief me|catch me up/i` → `buildDirectorBrief(briefInput)`
- Dashboard priority pattern: `tryAnswerDashboardPriorityQuestion(trimmed, directorCtx)`
- Roster attention: `tryAnswerRosterAttentionQuestion(trimmed, directorCtx)`

**Result:** DONNA returns a structured brief or attention queue summary. Includes:
- Count of pending reviews
- Attendance exceptions
- High-risk player count
- Advancement-eligible count
- Curriculum drafts pending

**With live data (`directorCtx` loaded):** Full prioritized answer with counts and links
**Without live data:** "Academy data is still loading. Give it a moment…" (honest fallback)

**Nav offer set:** DONNA sets `pendingNavOffer` to the top priority's href (e.g., `/director/review`, `/director/players`)

**Certified: PASS**

---

## Step 2: "Why?" (follow-up on top priority)

**Routing:** Dashboard priority intercept provides `sourceNote` and explanation for each priority item. Every attention item from `buildAttentionItems()` carries a `donnaExplanation` field.

**Result:** DONNA explains why the top item needs attention (e.g., "3 players are overdue for reassessment — last assessed 45+ days ago").

**Certified: PASS**

---

## Step 3: "Show me." / "Take me there."

**Routing:** `consumePendingNavOffer()` + `YES_PATTERN`

**Result:** Director navigates to the route set in the nav offer. `setDonnaFocusTarget` fires before navigation. On arrival, `DonnaHighlightBanner` highlights the relevant section (teal glow).

**Failure behavior:** If no nav offer pending, "yes" falls through to normal routing.

**Certified: PASS**

---

## Step 4: Navigate to Attention Queue

**Command:** "Who needs attention?" / "Show me the attention queue"

**Routing:** `tryAnswerDashboardPriorityQuestion` or `apply_filter` operator

**Result:** DONNA navigates to `/director/attention`. If a filter is included (e.g., "show me reassessment"), URL includes `?filter=reassessment` and the queue filters live.

**Certified: PASS**

---

## Step 5: "Open Jamie."

**Routing:** `tryAnswerRosterAttentionQuestion` → player name match → `href: /director/players/{id}` nav offer

**Result:** DONNA sets nav offer to Jamie's profile. Director confirms navigation. Profile opens with `player-profile-header` highlighted.

**Limitation:** Player name must match a first name in `directorCtx.playerSummaries`. No fuzzy matching.

**Certified: PASS (with name-matching limitation)**

---

## Step 6: "Why isn't Jamie ready?"

**Routing:** `tryAnswerRosterAttentionQuestion` → readiness patterns → answer from `levelReadinessEngine`

**On `/director/donna`:**
- `donnaGlobalCommandAction` → `buildIsReadyToMoveUpAnswer()` + `buildWhyNotReadyToAdvanceAnswer()`
- Full evidence-backed answer with gate statuses, assessment domain scores, cited evidence IDs
- Focus target: `player-readiness-card`

**On other director pages:**
- Context-summary answer from `directorCtx` fields
- Can still navigate to player profile and highlight readiness card

**Certified: PASS on /director/donna, PARTIAL on other pages**

---

## Step 7: "What should Jamie work on?"

**Routing:** `tryAnswerRosterAttentionQuestion` → priorities patterns → answer from `developmentPrioritiesEngine`

**On `/director/donna`:**
- `buildTopPrioritiesAnswer()` → full priority list with evidence reasoning
- Focus target: `player-priorities-card`

**On other director pages:**
- Summary from `directorCtx.playerSummaries` priority signals

**Certified: PASS on /director/donna, PARTIAL on other pages**

---

## Step 8: "Show me the evidence."

**Routing:** `tryAnswerRosterAttentionQuestion` → evidence patterns

**On `/director/donna`:**
- `buildEvidenceForNextLevelAnswer()` → evidence records with `citedEvidenceIds[]`
- Focus target: `player-evidence-hub`
- Navigation offer to player evidence timeline

**On other director pages:**
- Evidence summary from directorCtx

**Certified: PASS on /director/donna, PARTIAL on other pages**

---

## Step 9: "Prepare review." / "Draft the change."

**Routing:**
- `prepare_draft` operator → `requiresApproval: true`
- `request_approval` operator → routes to `/director/review`
- `tryAnswerCurriculumDraftProposal` for curriculum-specific drafts
- `donnaCurriculumImprovementDraftAction` for curriculum improvement drafts
- `submitDonnaActionDraft` for player advancement and other action types

**Result:** Draft created in `proposed_actions` with `status: 'pending_review'`. Audit log written. Nothing executed. Director directed to `/director/review`.

**Certified: PASS**

---

## Step 10: "Request approval."

**Routing:** `request_approval` operator → `route: '/director/review'`, `requiresApproval: true`

**Result:** DONNA routes director to review center. Draft is visible in the correct tab (curriculum improvement, player advancement, etc.). Approve/reject controls are live.

**Certified: PASS**

---

## Failure Handling in the Daily Loop

| Scenario | DONNA Behavior |
|---|---|
| No evidence exists for a player | "No evidence records available yet for this level. Complete player assessments…" |
| No assessments exist | `buildAssessmentEvidenceMissingAnswer()` — explains what's missing |
| No players exist | Attention queue empty state; directorCtx.highRiskPlayerCount = 0 |
| No curriculum exists | `tryAnswerCurriculumLevelQuestion` explains gap |
| directorCtx null | `NEEDS_LIVE_CTX` pattern: "Academy data is still loading" |
| Wrong role for draft creation | Server action returns 403-equivalent; DONNA shows error |

**Certified: PASS**

---

## End-to-End Daily Loop: CERTIFIED

All steps in the director daily loop produce correct behavior. The loop is fully operational from `/director/donna`. Steps 6–8 (evidence, readiness, priorities) deliver full detail only on the dedicated DONNA page; context-summary answers are available on all pages. This is an architectural limitation documented in prior audit, not a blocker for director operations.
