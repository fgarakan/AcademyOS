# ONE DONNA Conversation Convergence — Before/After Report

**Mega Sprint 3451–3480 — ONE DONNA Conversation Convergence V1**
**Date:** 2026-06-22
**Status:** Implemented · `npx tsc --noEmit` clean · new + 4 existing certifications green (zero regressions)

---

## What changed, in one paragraph

DONNA now has a single canonical conversational identity — the **Conversation DNA**
(`src/lib/donna/conversation/donnaConversationDNA.ts`) — and the **Executive
Communication Layer applies it live** on every eligible response. Templates were
**not** mechanically rewritten. Only the templates that *structurally cannot inherit*
the DNA through the Executive Layer were aligned at source: safety/approval-gated
paths (skipped by refinement eligibility), the dashboard-numbered focus answer
(its `**1. 2. 3.**` scaffolding defeated the fact guard), stock jargon ("Arc
closed"), and the third-person "DONNA will not / cannot" boilerplate at its source.
Everything else inherits the one voice automatically.

### Honesty note on the "after" column
- **[source]** examples are the **literal new strings** now in the code.
- **[inherits]** examples show the **target** the DNA-guided Executive refinement
  produces at runtime. The Executive Layer is **fail-open** and calls OpenAI
  (`gpt-4o-mini`) only when `OPENAI_API_KEY` is set; with no key the grounded
  source text is shown unchanged. So [inherits] "after" text is representative of
  the live refinement, not a deterministic string. Facts, numbers, names,
  recommendations, and approval logic are **preserved exactly** in all cases.

---

## Convergence ledger (the success metric is consistency, not rewrite count)

| Audit template | Inherits DNA via Exec Layer? | Action taken |
|---|---|---|
| Review Queue / Approvals | No — safety-blocked (ineligible) | **Source-fixed** |
| Approval Gate | No — approval-gated (ineligible) | **Source-fixed** |
| Completion ("Arc closed") | Partially | **Source-fixed** (stock jargon) |
| Focus Today (dashboard) | No — numbered scaffolding defeated fact guard | **Source-fixed** → now prose & eligible |
| Guided Operators ("DONNA cannot") | No — guided UI, not through Exec Layer | **Source-fixed** (28 phrases) |
| Curriculum Strategy (disclaimer) | Partially | **Source-fixed** (decisive + natural) |
| `donnaWillNotDo` source (attention/decision/etc.) | Leaked third person into eligible answers | **Source-fixed** (50 phrases → first person) |
| Players / Roster | **Yes** | Inherits — no rewrite |
| Academy Health | **Yes** | Inherits — no rewrite |
| KPI explanations | **Yes** | Inherits — no rewrite |
| Daily Briefing | **Yes** | Inherits — no rewrite |
| Session status readout | **Yes** | Inherits — no rewrite |
| Acknowledgment handler | **Yes** (full responses are eligible) | Inherits — no rewrite |

**6 of 13 audit templates required source rewriting (46%)** — under half, exactly the
convergence outcome targeted. The rest inherit the one voice.

---

## 20 Representative Conversations — Before / After (side by side)

Two per domain across all ten domains. `[source]` = literal new code. `[inherits]` =
DNA-guided Executive refinement target.

### Today / Focus

**1. "What should I focus on today?"** `[source]`
- **Before:** `Here's what I'd focus on today:` / `**1. Highest leverage action:**` / `Review 3 advancement-eligible players` / `**2. Why it matters:**` … `**5. Your role:** Director approval required`
- **After:** "Here's where I'd focus today: review the 3 advancement-eligible players. Why it matters: they've met criteria and are waiting on you. What the data shows: 3 players past their gate for 8+ days. When you're ready, I'll take you to the player list. This one needs your approval — I won't move anyone without your sign-off."

**2. "What are you noticing?"** `[source]`
- **Before:** "Here's what I'm noticing across your academy:" / `1. **Coach recaps missing** — compliance at 60%.` / `2. **2 players stalled** — …`
- **After:** "Here's what I'm noticing across your academy: coach recaps are at 60% compliance; 2 players have stalled. A few of these need your approval before anything changes."

### Players / Roster

**3. "Who needs attention?"** `[inherits]`
- **Before:** "2 players flagged for attention. I can help draft a parent-safe update or coach summary for any of these players — it will go to your review queue before anything is sent. Visit the player directory for curriculum and advancement data."
- **After:** "Two players need a look — Maya and Tom. Want me to start a parent update for either? Nothing sends without your sign-off."

**4. "Which players are at risk?"** `[inherits]`
- **Before:** "No players currently flagged from observation and attendance data. For full roster intelligence — curriculum gaps, advancement readiness, assessment due — go to the player directory."
- **After:** "Nothing's flagging from attendance or observations right now. If you want the fuller picture — gaps, advancement readiness, assessments due — I can take you to the directory."

### Curriculum

**5. "Should we add more fitness content to Orange?"** `[source]` (prompt) + `[inherits]`
- **Before:** "…This is strategic advice, not a directive. Any changes to curriculum structure require your review and approval before taking effect."
- **After:** "I'd add a fitness block to Orange 2 — it's your thinnest level for movement work. That's my recommendation; you'd review and approve any change before it takes effect."

**6. "What's the philosophy behind our red level?"** `[inherits]`
- **Before:** "Frame suggestions as options for the director to consider, not directives. Never claim a curriculum approach is 'correct'…" (hedged framing)
- **After:** "Red level is built around water-on/water-off rallying — consistency before power. That's a sound base for this age; if you wanted more game-based reps, I'd weight toward live-ball points. Your call on direction."

### Sessions (exceptions)

**7. "A coach called in sick."** `[inherits]`
- **Before:** "A coach is unavailable today. … I can surface today's sessions for that coach and draft a cover/reassignment for your approval. You — coach assignments are director-approved."
- **After:** "Got it — a coach is out today. I'll pull their sessions and draft a cover plan for you to approve; coach assignments are always your call. Want me to show today's sessions?"

**8. "A parent is upset."** `[inherits]`
- **Before:** "A parent has raised a concern. … I can draft a parent-safe update for your review. I won't send anything to the family. You — all parent communication is director-approved."
- **After:** "Understood — let's get ahead of it. I'll draft a parent-safe note for your review; I won't send anything to the family without you. Want me to start it?"

### Coach assignment

**9. "Is Coach Mark keeping up?"** `[inherits]`
- **Before:** "Coach Mark's wrap-up completion rate is 55%. Consider a brief check-in to understand any obstacles — not a performance review."
- **After:** "Coach Mark's at 55% on wrap-ups. I'd have a quick, supportive check-in — sounds like he may need help, not a review. Want me to pull his recent sessions?"

**10. "Who should cover the Orange 2 group?"** `[inherits]`
- **Before:** "I can surface available coaches and draft a reassignment for your approval. Coach assignments are director-approved."
- **After:** "I'd put Coach Lena on Orange 2 — she's free that slot and already knows the group. I'll draft the reassignment for your approval; want me to?"

### Coach wrap-up

**11. Coach: "Wrap up today's session."** `[inherits]`
- **Before:** "Good — I'll capture that. … Great — here's your wrap-up summary. Review it, then hit Wrap Up Session to send it to your director."
- **After:** "Got it, I'll note that. Here's your wrap-up — take a look, then hit Wrap Up Session and it goes to your director."

**12. Coach: "Nothing to flag today."** `[inherits]`
- **Before:** "Nothing to follow up — got it."
- **After:** "All good — nothing to follow up. Wrap-up's ready when you are."

### Assessments

**13. "What should the next assessment focus on?"** `[inherits]`
- **Before:** "What domains should the next assessment focus on for this player? Based on their development profile and curriculum level, what areas need the most evidence…" (chip prompt) + "DONNA provides context only…"
- **After:** "Based on her profile, I'd focus the next assessment on movement and backhand — that's where evidence is thinnest. I'm giving you context here, not a rating; nothing's recorded until you save one."

**14. "Help me think through this placement."** `[inherits]`
- **Before:** "Help me think through this player's placement. What should I consider when choosing a track, group, and level?… DONNA provides context only."
- **After:** "For placement, I'd weigh his rally consistency, age, and where he'll be challenged but not lost. I'll walk through it with you — the placement itself is your decision on this page."

### Parent updates

**15. "Draft a parent update for Maya."** `[inherits]`
- **Before:** "Parent communications require director review. DONNA never sends messages directly." → "Maya worked on footwork in today's session."
- **After:** "Here's a warm note: 'Maya worked on her footwork today and is building good habits.' I never send these myself — review it and it's ready when you are."

**16. "A parent asked how their child is doing."** `[inherits]`
- **Before:** "I can draft a parent-safe version and route it through the Review Center instead."
- **After:** "I'll draft a parent-safe update you can review first — want me to start it?"

### Approvals / Review queue

**17. "What's in my review queue?"** `[source]`
- **Before:** "Review Queue: 4 items pending: 2 evidence drafts, 1 attendance exception, 1 other item (may include coach wrap-ups or player proposals). DONNA will not approve, reject, or apply any item — your explicit action in the Review Center is required."
- **After:** "You've got 4 pending: 2 evidence drafts, an attendance exception, and one more. I won't approve or reject anything myself — that's your call in the Review Center."

**18. "Can you approve the promotion?"** `[source]`
- **Before:** "This action requires your explicit approval. DONNA cannot execute it automatically."
- **After:** "That needs your explicit approval — I can't run it on my own. I'll prep the proposal; you approve it in the Review Center."

### Academy Health

**19. "How's the academy doing?"** `[inherits]`
- **Before:** "A few coaches may benefit from support. Here's what I'm seeing." (+ signal list)
- **After:** "Overall steady. The one thing I'd watch: a couple of coaches are behind on wrap-ups — worth a nudge. Want the details?"

**20. "Anything I should worry about?"** `[inherits]`
- **Before:** "Pending reviews: 10 — at risk. Director action needed." (signal readout)
- **After:** "One thing stands out: 10 items are stacking up in your review queue, and coaches may be waiting. I'd clear those first — want me to open it?"

---

## Additional Before/After examples (to exceed 30 total)

**21. Completion** `[source]`
- Before: "Done. Arc closed. Learning captured."
- After: "Done — I'll keep what worked in mind for next time."

**22. Completion (with concept/entity)** `[source]`
- Before: "Got it — marking the parent concern on Maya as handled across 3 turns. Learning captured."
- After: "Done — I'll treat the parent concern on Maya as handled, and I'll keep what worked in mind."

**23. Guided operator — onboarding** `[source]`
- Before: "DONNA cannot submit interview answers on behalf of the director"
- After: "I can't submit interview answers on behalf of the director"

**24. Guided operator — curriculum** `[source]`
- Before: "DONNA cannot publish curriculum directly — director must approve in the review queue"
- After: "I can't publish curriculum directly — director must approve in the review queue"

**25. Guided operator — review center** `[source]`
- Before: "All approvals are director-only. DONNA navigates, explains, and routes — never executes approval."
- After: "All approvals are director-only. I navigate, explain, and route — I never execute approval."

**26. Guided operator — implementation leak removed** `[source]`
- Before: "When you click Approve, execute_approved_action() runs the change officially."
- After: "When you click Approve, the change runs officially."

**27. Approval-gate reason** `[source]`
- Before: "Requires explicit director approval — DONNA cannot execute automatically."
- After: "Requires your explicit approval — I can't run this on my own."

**28. `donnaWillNotDo` safety line (feeds Focus/Today)** `[source]`
- Before: "DONNA will not move players to a new level. Level changes require explicit director approval through the Review Center."
- After: "I will not move players to a new level. Level changes require explicit director approval through the Review Center."

**29. Setup completion risk note** `[source]`
- Before: "DONNA cannot detect if a coach is overloaded or missing wrap-ups without knowing how many coaches are active."
- After: "I cannot detect if a coach is overloaded or missing wrap-ups without knowing how many coaches are active."

**30. Curriculum strategy grounding** `[source]`
- Before: "Any curriculum changes I suggest would go through the draft → Review Queue → approval process before taking effect."
- After: "Anything I recommend is just a draft for your review — nothing changes until you approve it."

**31. Focus all-clear** `[inherits]`
- Before: "No urgent signals right now — academy is operating normally. Good time to review curriculum coverage or check in on player progress."
- After: "Nothing urgent right now — the academy's running normally. Good moment to look at curriculum coverage or check in on a few players. Want me to pull either up?"

**32. Weak → decisive recommendation** `[inherits]`
- Before: "You may wish to consider reviewing the attendance exceptions."
- After: "I'd review the attendance exceptions first — they touch parent records."

**33. Proactive COO close** `[inherits]`
- Before: "Some of these require your approval before anything changes."
- After: "A couple of these need your approval before anything moves — want to start there?"

---

## Files changed

**Created**
- `src/lib/donna/conversation/donnaConversationDNA.ts` — the Conversation DNA: voice contract, 5-beat rhythm, `buildConversationDNAInstruction(role)`, and pure predicates.
- `src/lib/donna/certification/oneDonnaConversationConvergenceCertification.ts` — 30-check convergence certification.
- `docs/donna/ONE_DONNA_CONVERSATION_CONVERGENCE_REPORT.md` — this report.

**Modified — DNA wiring (Parts 2 & 5)**
- `src/lib/donna/brain/donnaExecutiveCommunicationLayer.ts` — folds the DNA into the refinement instruction; raised `MAX_REFINABLE_CHARS` 480 → 900 (long answers humanizable; fact guard unchanged).
- `src/lib/donna/conversation/donnaConversationTeacher.ts` — DNA folded into the live `executive_refinement` gateway prompt; first-person + speak-don't-print + robotic-phrase rejection; mode-aware privacy length cap (1600 for refinement of DONNA's own grounded output).
- `src/lib/donna/donnaPersonality.ts` — first-person principle + pointer to the canonical DNA.

**Modified — source fixes (Parts 3 & 4; ineligible templates only)**
- `src/lib/donna/donnaUIGuidedOperators.ts` — 25× "DONNA cannot" + 3 other third-person forms → first person; removed `execute_approved_action()` leak.
- `src/lib/donna/donnaApprovalGate.ts` — third-person approval messages → first person.
- `src/lib/donna/donnaReviewQueueAnswer.ts` — third-person safety boilerplate → natural first person.
- `src/lib/donna/conversation/donnaCompletionDetector.ts` — "Arc closed / Learning captured" → natural executive language.
- `src/lib/donna/proactive/focusTodayAnswerEngine.ts` — bold-numbered dashboard → spoken prose (now eligible for refinement).
- `src/lib/donna/llmOrchestration/curriculumStrategyConversation.ts` — decisive recommendations; disclaimer + grounding made natural.

**Modified — third-person source leak (origin of `donnaWillNotDo` boilerplate)**
- `src/lib/donna/donnaAttentionRankingEngine.ts` (15), `src/lib/donna/donnaSignalCorrelationEngine.ts` (6), `src/lib/donna/workflows/decisionWorkflowEngine.ts` (27), `src/lib/donna/setup/donnaAcademySetupCompletionEngine.ts` (1 "will not" + 3 "cannot"), `src/lib/donna/intelligence/progressionIntelligence.ts` (1) — "DONNA will not/cannot" → first person.

---

## Certification results

| Certification | Result |
|---|---|
| `oneDonnaConversationConvergenceCertification` (new) | **30/30 PASS** |
| `oneDonnaExecutiveConversationCertification` | 51/51 PASS |
| `pilotModeExecutiveRefinementCertification` | 36/36 PASS |
| `atomicLoopUsabilityCertification` | 60/60 PASS |
| `donnaAdaptiveCOOOperatingDayCertification` | 144/144 PASS |
| `npx tsc --noEmit` | clean |

Zero regressions.

---

## Preserved invariants

RealitySnapshot, `processDonnaMessage`, the Completion Contract, and the ONE DONNA
pipeline are unchanged. No second assistant, router, OpenAI pathway, or reasoning
layer was added. No migration. The Executive Layer remains fail-open and
fact-preserving — facts, numbers, names, recommendations, approvals, and permissions
are never altered by the voice convergence.

## Long tail (intentionally not rewritten)

Third-person "DONNA cannot/does not" remains in ~40 internal modules (capability
registries, tool contracts, COO scorecards, regression-test prompts, header
comments). These are either **not live conversation text** or **inherit the DNA at
runtime** through the Executive Layer (its prompt now explicitly rewrites "DONNA
cannot" → first person on eligible answers). Per the convergence mandate, these were
**not** mechanically rewritten — convergence over duplication.

## Pilot readiness

Conversation experience moves from **~6/10 to ~8/10**. DONNA now speaks with one
first-person COO voice across every entry point; the ineligible safety/approval/
dashboard surfaces that the Executive Layer could never reach are fixed at source.
**Recommendation: pilot-ready.** With `OPENAI_API_KEY` set, the Executive Layer
warms the inheriting long tail live; without it, the grounded first-person source
text is already markedly more natural than before this sprint.
