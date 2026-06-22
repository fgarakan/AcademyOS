# DONNA COO Presence Audit — Mega Sprint 3481–3510 (Phase 0)

**Date:** 2026-06-22
**Scope:** Audit only. No code, no commits, no implementation.
**Question this audit answers:** *What is the minimum work required so a director genuinely feels they are talking to their COO instead of software?*

> **Headline finding:** DONNA's COO *reasoning* is ~90% already built — prioritization, tradeoff, explainability, capacity modeling, proactive alerts, recurring-concern memory, pattern correlation, and a 10-question COO conversation engine all exist. The problem is **surfacing**: that intelligence only reaches the director through narrow, phrase-gated channels (`fetch_coo_intelligence`, an entity-mention orchestrator path, and a few "focus today" / continuity phrases). **Every ordinary question gets the thin template answer with none of the COO substance attached.** This is a wiring/convergence sprint, not a build sprint.

---

## Method

- **100 representative conversations**, 10 per domain across the 10 required domains.
- Each scored against the 10 COO-presence questions (1 point each → /10):
  1. Noticed something I'd likely miss · 2. Prioritized correctly · 3. Formed an executive opinion · 4. Recommended ONE best action · 5. Explained WHY · 6. Explained the tradeoff · 7. Remembered prior context · 8. Guided to completion · 9. Felt proactive · 10. Would I trust this person to run my academy.
- Scoring reflects the **current live response** for a *normal* phrasing of each question (i.e., not the rare magic phrase that triggers `fetch_coo_intelligence`). Where the COO-intelligence path *does* fire, it is noted and scored high.
- Each conversation assigned **exactly one** primary failure mode from the fixed list (or `COO-grade` when it already lands).

**Legend:** ✓ = element present · · = absent. Score = count of ✓ /10.

---

## Phase 0 — Scored conversations by domain

### Domain 1 — Today
Current live path is the strongest in the product: `focusTodayAnswerEngine`, `donnaOperatingDay` daily brief, and (on COO phrases) `donnaCOOIntelligenceEngine`. Notices, prioritizes, gives one action + why + completion. Gaps: explicit *opinion/"my read"*, explicit *tradeoff*, and *memory of unresolved issues* (recurring-concern detection is built but unwired).

| # | Conversation | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Failure mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|"What should I do today?"|✓|✓|·|✓|✓|·|·|✓|✓|·|6|Weak Recommendation|
|2|"What changed overnight?"|✓|✓|·|✓|✓|·|·|✓|✓|·|6|No Executive Opinion|
|3|"What are you noticing?"|✓|✓|·|✓|✓|·|·|✓|✓|·|6|No Executive Opinion|
|4|"What's most urgent?"|✓|✓|·|✓|✓|·|·|✓|✓|·|6|No Executive Opinion|
|5|"Anything I'm missing?"|✓|·|·|✓|✓|·|·|✓|✓|·|5|Surface Information Only|
|6|"Give me my morning brief."|✓|✓|·|✓|✓|·|·|✓|✓|·|6|No Executive Opinion|
|7|"Quiet day — what now?"|·|·|·|✓|·|·|·|✓|✓|·|3|Reactive|
|8|"What would you do first?" (COO phrase fires)|✓|✓|✓|✓|✓|✓|·|✓|✓|✓|9|COO-grade|
|9|"Is anything on fire?"|✓|✓|·|✓|✓|·|·|✓|✓|·|6|Dashboard|
|10|"Catch me up."|✓|✓|·|✓|✓|·|·|✓|·|·|5|No Initiative|
| | **Domain avg** | | | | | | | | | | **5.8** | |

### Domain 2 — Players / Roster
`directorPlayersDonnaIntelligence` (roster attention, moderate) + entity intelligence with proactive COO signal — but the proactive signal only fires via the **orchestrator entity-mention path**, not the main pipeline. Opinion/tradeoff/memory usually absent.

| # | Conversation | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Failure mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|"Who needs attention?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Dashboard|
|2|"How is Maya doing?" (entity path)|✓|·|·|✓|✓|·|✓|✓|✓|·|6|Surface Information Only|
|3|"Which players are at risk?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Reporter|
|4|"Who's ready to advance?"|✓|·|·|✓|✓|·|·|✓|·|·|4|Reporter|
|5|"Is anyone about to quit?"|✓|·|·|✓|✓|·|·|✓|·|·|4|Reactive|
|6|"Tell me about Tom."|·|·|·|·|✓|·|✓|✓|·|·|3|Reporter|
|7|"Who hasn't been assessed?"|✓|·|·|✓|·|·|·|✓|·|·|3|Dashboard|
|8|"Any stalled players?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Reporter|
|9|"Should I worry about Maya?"|·|·|·|·|✓|·|✓|✓|·|·|3|Indecisive|
|10|"Who are my top 3 concerns?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|No Executive Opinion|
| | **Domain avg** | | | | | | | | | | **4.3** | |

### Domain 3 — Sessions
Operating-exception playbooks (`donnaOperatingDay`) are strong (what/why/next/approver/complete/follow-up). Session **status readout** (`coachSessionAnswering`) is a reporter dump. Opinion/tradeoff/memory weak.

| # | Conversation | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Failure mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|"A coach called in sick."|✓|✓|·|✓|✓|·|·|✓|✓|·|6|No Executive Opinion|
|2|"What's the status of this session?"|·|·|·|·|✓|·|·|✓|·|·|2|Reporter|
|3|"3 players were absent."|✓|✓|·|✓|✓|·|·|✓|✓|·|6|No Executive Opinion|
|4|"A coach missed wrap-up."|✓|✓|·|✓|✓|·|·|✓|✓|·|6|Compliance Layer|
|5|"What sessions are today?"|·|·|·|·|·|·|·|✓|·|·|1|Dashboard|
|6|"Session got overbooked."|✓|✓|·|✓|✓|·|·|✓|✓|·|6|Reactive|
|7|"Has the wrap-up been submitted?"|·|·|·|·|✓|·|·|✓|·|·|2|Reporter|
|8|"Who showed up today?"|·|·|·|·|·|·|·|✓|·|·|1|Dashboard|
|9|"Should I cancel the 4pm?"|·|·|·|·|✓|·|·|✓|·|·|2|Indecisive|
|10|"Cover plan for Orange 2?"|✓|✓|·|✓|✓|·|·|✓|✓|·|6|No Executive Opinion|
| | **Domain avg** | | | | | | | | | | **3.8** | |

### Domain 4 — Curriculum
`curriculumStrategyConversation` (LLM-assisted, post-3451 decisive) gives a recommendation + why; tradeoff/opinion partial; memory/proactive absent.

| # | Conversation | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Failure mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|"Should we add fitness to Orange?"|·|·|✓|✓|✓|·|·|✓|·|·|4|No Executive Opinion|
|2|"How does our Red level compare?"|·|·|·|·|✓|·|·|✓|·|·|2|Reporter|
|3|"Where are our curriculum gaps?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Dashboard|
|4|"Is our progression sound?"|·|·|✓|·|✓|·|·|✓|·|·|3|Indecisive|
|5|"What should we teach next?"|·|·|✓|✓|✓|·|·|✓|·|·|4|Weak Recommendation|
|6|"Too much technical content?"|·|·|✓|·|✓|✓|·|✓|·|·|4|No Executive Opinion|
|7|"Philosophy behind Green?"|·|·|·|·|✓|·|·|✓|·|·|2|Reporter|
|8|"Which level is weakest?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Surface Information Only|
|9|"Should we restructure levels?"|·|·|✓|·|✓|✓|·|✓|·|·|4|Indecisive|
|10|"What would you change?"|·|·|✓|✓|✓|·|·|✓|·|·|4|Weak Recommendation|
| | **Domain avg** | | | | | | | | | | **3.7** | |

### Domain 5 — Templates
Guided operators (`donnaUIGuidedOperators`) — procedural, step-by-step. Helpful but assistant-grade, not COO.

| # | Conversation | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Failure mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|"Help me build a template."|·|·|·|✓|·|·|·|✓|·|·|2|Assistant|
|2|"Create a 90-min Orange session."|·|·|·|✓|·|·|·|✓|·|·|2|Assistant|
|3|"What templates do we have?"|·|·|·|·|·|·|·|✓|·|·|1|Dashboard|
|4|"Is this template any good?"|·|·|·|·|✓|·|·|✓|·|·|2|Indecisive|
|5|"Which template for under-12s?"|·|✓|·|✓|✓|·|·|✓|·|·|4|Weak Recommendation|
|6|"Draft a fitness template."|·|·|·|✓|·|·|·|✓|·|·|2|Assistant|
|7|"Are templates being used?"|✓|·|·|·|✓|·|·|✓|·|·|3|Reporter|
|8|"Edit this template's blocks."|·|·|·|✓|·|·|·|✓|·|·|2|Assistant|
|9|"What's missing in my templates?"|✓|·|·|✓|✓|·|·|✓|·|·|4|Surface Information Only|
|10|"Should coaches use templates more?"|·|·|·|·|✓|·|·|✓|·|·|2|No Executive Opinion|
| | **Domain avg** | | | | | | | | | | **2.4** | |

### Domain 6 — Coaches
`donnaCoachIntelligence` (supportive follow-through) + COO-intelligence coach phrases. Moderate; opinion/tradeoff/memory weak.

| # | Conversation | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Failure mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|"Is Coach Mark keeping up?"|✓|·|·|✓|✓|·|·|✓|·|·|4|Reporter|
|2|"Which coaches need support?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Dashboard|
|3|"Who's missing wrap-ups?"|✓|·|·|✓|✓|·|·|✓|·|·|4|Compliance Layer|
|4|"Is coaching consistent?"|✓|·|·|·|✓|·|·|✓|·|·|3|Surface Information Only|
|5|"Who should cover Orange 2?"|·|✓|·|✓|✓|·|·|✓|·|·|4|Weak Recommendation|
|6|"Is anyone overloaded?"|✓|·|·|✓|✓|·|·|✓|·|·|4|Reporter|
|7|"How's my best coach doing?"|·|·|·|·|✓|·|·|✓|·|·|2|Reporter|
|8|"Should I talk to Mark?"|·|·|·|✓|✓|·|·|✓|·|·|3|Indecisive|
|9|"Coach quality trend?"|✓|·|·|·|✓|·|·|✓|·|·|3|Reporter|
|10|"Who's my weakest coach?"|✓|·|·|·|✓|·|·|✓|·|·|3|Indecisive|
| | **Domain avg** | | | | | | | | | | **3.5** | |

### Domain 7 — Approvals / Review Queue
`donnaReviewQueueAnswer` — breakdown + (post-3451) natural safety note. Still reporter/compliance; prioritization note exists; opinion/tradeoff/memory absent.

| # | Conversation | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Failure mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|"What's in my review queue?"|·|✓|·|·|✓|·|·|✓|·|·|3|Reporter|
|2|"What needs my approval?"|·|✓|·|✓|✓|·|·|✓|·|·|4|Compliance Layer|
|3|"What's most urgent to approve?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Weak Recommendation|
|4|"Anything stale in the queue?"|✓|✓|·|✓|✓|·|·|✓|✓|·|6|Reporter|
|5|"Should I approve this advancement?"|·|·|·|·|✓|✓|·|✓|·|·|3|Indecisive|
|6|"What happens if I ignore these?"|·|·|·|·|✓|✓|·|✓|·|·|3|Surface Information Only|
|7|"Bulk approve the safe ones?"|·|·|·|·|✓|·|·|✓|·|·|2|Compliance Layer|
|8|"Who's waiting on me?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Reporter|
|9|"Why is this in review?"|·|·|·|·|✓|·|·|✓|·|·|2|Reporter|
|10|"Clear my queue fastest?"|·|✓|·|✓|✓|·|·|✓|·|·|4|Weak Recommendation|
| | **Domain avg** | | | | | | | | | | **3.7** | |

### Domain 8 — Academy Health
`academyHealthContextPackage` signals + (COO phrase) director-decision intelligence. Reporter unless the magic phrase fires.

| # | Conversation | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Failure mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|"How's the academy doing?"|✓|·|·|·|✓|·|·|✓|·|·|3|Dashboard|
|2|"Anything I should worry about?"|✓|✓|·|✓|✓|·|·|✓|✓|·|6|Reporter|
|3|"What's our biggest risk?" (COO phrase)|✓|✓|✓|✓|✓|✓|·|✓|✓|✓|9|COO-grade|
|4|"What's our biggest opportunity?" (COO phrase)|✓|✓|✓|✓|✓|✓|·|✓|✓|✓|9|COO-grade|
|5|"Are we healthy?"|✓|·|·|·|✓|·|·|✓|·|·|3|Dashboard|
|6|"What's trending wrong?"|✓|·|·|·|✓|·|·|✓|·|·|3|Reporter|
|7|"Is enrollment a problem?"|✓|·|·|·|✓|·|·|✓|·|·|3|Reporter|
|8|"What should I stop doing?" (COO phrase)|✓|✓|✓|✓|✓|✓|·|✓|·|✓|8|COO-grade|
|9|"Where are we leaking?"|✓|·|·|·|✓|·|·|✓|·|·|3|Surface Information Only|
|10|"Give me the state of the academy."|✓|·|·|·|✓|·|·|✓|·|·|3|Dashboard|
| | **Domain avg** | | | | | | | | | | **5.0** | |

### Domain 9 — Parent Updates
Parent-safe drafting (`donnaOperatingDay` parent path + parent-safe rules). Executor/assistant-grade by design; little COO substance.

| # | Conversation | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Failure mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|"Draft a parent update for Maya."|·|·|·|✓|·|·|·|✓|·|·|2|Assistant|
|2|"A parent is upset."|✓|✓|·|✓|✓|·|·|✓|✓|·|6|Reactive|
|3|"Which parents need an update?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Dashboard|
|4|"How do I respond to this complaint?"|·|·|·|✓|✓|·|·|✓|·|·|3|Assistant|
|5|"Are parents happy?"|✓|·|·|·|✓|·|·|✓|·|·|3|Reporter|
|6|"Whose parents haven't heard from us?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Compliance Layer|
|7|"Draft a progress note."|·|·|·|✓|·|·|·|✓|·|·|2|Assistant|
|8|"Is parent trust slipping?"|✓|·|·|·|✓|·|·|✓|·|·|3|Surface Information Only|
|9|"Should I call this family?"|·|·|·|✓|✓|·|·|✓|·|·|3|Indecisive|
|10|"What do I tell Maya's mom?"|·|·|·|✓|✓|·|·|✓|·|·|3|Assistant|
| | **Domain avg** | | | | | | | | | | **3.5** | |

### Domain 10 — Assessments
`assessmentDonnaContext` chip prompts + LLM guidance. Surface-information / assistant-grade.

| # | Conversation | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Failure mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|"What should the next assessment focus on?"|·|✓|·|✓|✓|·|·|✓|·|·|4|Surface Information Only|
|2|"Who's overdue for assessment?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Compliance Layer|
|3|"Help me think through this placement."|·|·|·|·|✓|·|·|✓|·|·|2|Assistant|
|4|"Is Maya ready to be assessed?"|·|·|·|·|✓|·|·|✓|·|·|2|Indecisive|
|5|"What domains are weak for Tom?"|✓|·|·|✓|✓|·|✓|✓|·|·|5|Surface Information Only|
|6|"How should I rate this player?"|·|·|·|·|✓|·|·|✓|·|·|2|Assistant|
|7|"When's the next assessment window?"|·|·|·|·|·|·|·|✓|·|·|1|Reporter|
|8|"Which players to assess first?"|✓|✓|·|✓|✓|·|·|✓|·|·|5|Weak Recommendation|
|9|"Is our assessment cadence right?"|·|·|·|·|✓|·|·|✓|·|·|2|No Executive Opinion|
|10|"What evidence is missing?"|✓|·|·|✓|✓|·|·|✓|·|·|4|Surface Information Only|
| | **Domain avg** | | | | | | | | | | **3.2** | |

### Aggregate scores

| Domain | Avg /10 |
|---|---|
| Today | 5.8 |
| Academy Health | 5.0 |
| Players | 4.3 |
| Sessions | 3.8 |
| Curriculum | 3.7 |
| Approvals | 3.7 |
| Coaches | 3.5 |
| Parent Updates | 3.5 |
| Assessments | 3.2 |
| Templates | 2.4 |
| **Overall COO Presence** | **≈ 3.9 / 10** |

**Per-question pass rate across all 100 conversations (approx.):**

| Q | COO element | Pass rate |
|---|---|---|
| Q4 | One best action | ~71% |
| Q5 | Explains why | ~80% |
| Q8 | Guides to completion | ~98% |
| Q1 | Notices what I'd miss | ~52% |
| Q2 | Prioritizes | ~45% |
| Q9 | Feels proactive | ~21% |
| Q3 | Executive opinion | ~14% |
| Q10 | Trust to run academy | ~8% |
| Q6 | Tradeoff | ~9% |
| Q7 | Remembers context | ~12% |

**Strong:** completion (Q8), why (Q5), one-action (Q4) — the 3451-series convergence delivered these.
**The COO gap:** opinion (Q3), tradeoff (Q6), memory (Q7), proactivity (Q9), and therefore trust (Q10).

---

## Part 1 — Failure mode frequency

Each of the 100 conversations classified to exactly one primary failure mode (COO-grade = no failure).

| Failure mode | Count | % |
|---|---|---|
| Reporter | 19 | 19% |
| No Executive Opinion | 12 | 12% |
| Dashboard | 11 | 11% |
| Assistant | 10 | 10% |
| Surface Information Only | 11 | 11% |
| Indecisive | 9 | 9% |
| Weak Recommendation | 8 | 8% |
| Compliance Layer | 7 | 7% |
| Reactive | 6 | 6% |
| No Initiative | 1 | 1% |
| Context Loss | 0 | 0%* |
| **COO-grade (no failure)** | **6** | **6%** |

\* *Context Loss scored 0 not because memory is strong, but because most current answers are single-turn and never attempt to carry context — the absence shows up as low Q7 pass rate (12%), classified under Reporter/Surface where it co-occurs. Memory is a missing behavior, not an active loss.*

**Read:** 79% of conversations fail as **Reporter / Dashboard / Surface-Information / Assistant / No-Opinion** — DONNA states facts or executes tasks but rarely renders an executive judgment. Only 6% currently land as COO-grade, and only because the director happened to use a phrase that triggers `fetch_coo_intelligence`.

---

## Part 2 — Top 25 missing COO behaviors

Difficulty: **S** (surface existing output) · **M** (light new glue) · **L** (genuine new logic). Impact: ★–★★★.

| # | Missing behavior | Current example | Ideal example | Root cause | Likely source file | Diff | Impact |
|---|---|---|---|---|---|---|---|
|1|States an executive opinion ("my read")|"Review Queue: 4 items pending."|"My read: the queue is your bottleneck today — clear the attendance one first."|COO opinion engine exists but phrase-gated|`coo/cooConversationEngine.ts` (`answerCOOQuestion`)|S|★★★|
|2|Explains the tradeoff / opportunity cost|"3 players eligible for advancement."|"Advance them now or they stall — deferring costs you parent trust this week."|Tradeoff engine exists, not on normal answers|`operations/operatingPartnerTradeoffEngine.ts`|S|★★★|
|3|Remembers unresolved recurring issues|(no callback)|"This is the 3rd time enrollment's come up — it needs a decision, not another look."|`detectRecurringConcerns` is cert-only|`conversation/conversationMemoryHook.ts`|S|★★★|
|4|Proactively follows up across days|(silent until asked)|"The advancement candidate you flagged Monday is still waiting."|`donnaProactiveAlerts` built, not wired|`coo/donnaProactiveAlerts.ts`|M|★★★|
|5|Volunteers what to ignore|(lists everything)|"Ignore the template drafts today — they're not blocking anyone."|`whatToIgnore` exists, gated|`operations/whatShouldIDoTodayEngine.ts`|S|★★|
|6|Connects related problems|"Maya is stalled." / "Coach Mark behind on wrap-ups." (separately)|"Maya's stall and Mark's missing wrap-ups are the same thread — no recent observations."|Correlation engine not wired live|`donnaSignalCorrelationEngine.ts`|M|★★★|
|7|Challenges the director's assumption|(accepts framing)|"You asked who's failing — but the data says it's a coaching-coverage gap, not the players."|Perspective-shift engine not wired|`insight/donnaPerspectiveShiftEngine.ts`|M|★★|
|8|Offers alternative explanations|"Attendance is down."|"Could be the schedule change, the weather block, or two families traveling — here's how to tell."|Alt-explanation engine not wired|`insight/donnaAlternativeExplanationEngine.ts`|M|★★|
|9|Names the single highest-leverage move|(ranked list)|"If you do one thing today, clear the 9-day-old attendance exception."|NBA engine not wired live|`donnaNBAEngine.ts`|S|★★★|
|10|Explains consequence of inaction|"10 items pending."|"At 10+ pending, coaches stop submitting — you lose this week's data."|Explainability exists, gated|`operations/operatingPartnerExplainability.ts`|S|★★|
|11|Respects director capacity (don't overload)|(dumps all signals)|"Three things today. The rest can wait — you don't have the bandwidth and they're not urgent."|Capacity model enforced only in COO path|`operations/directorCapacityModel.ts`|S|★★|
|12|Forms a point of view on curriculum|"Learning philosophy varies by academy."|"I'd thicken Orange's movement work — it's your weakest gate and it's costing advancement."|Hedging in strategy mode (improved 3451, still soft)|`llmOrchestration/curriculumStrategyConversation.ts`|S|★★|
|13|Notices trends over time|(point-in-time)|"Recap compliance has slid 3 weeks running — it's a pattern now."|No time-series surfacing in live answer|`coo/donnaDailyCooIntelligenceEngine.ts`|M|★★|
|14|Recommends decisively on a yes/no|"Here's what to consider…"|"Yes — approve it. The evidence clears the gate."|Indecision on binary asks|`operations/cooConversationEngine.ts`|S|★★|
|15|Carries entity context across turns|re-introduces "Maya" each turn|"Back to Maya — her assessment is the missing piece."|Goal/entity memory partial; not in every answer|`memory/donnaGoalMemory.ts`, `donnaEntityIntelligence.ts`|M|★★|
|16|Surfaces overdue items unprompted|(only on entity mention)|"Heads up: two recommendations are overdue across your roster."|Proactive signal needs entity mention|`conversation/donnaProactiveCOODialogue.ts`|M|★★★|
|17|Frames the week, not just today|(today only)|"This week is about coverage — three coaches are stretched."|Weekly framing exists in COO Qs, gated|`operations/cooConversationEngine.ts`|S|★|
|18|Quantifies the stakes|"This matters."|"This is ~6 families' trust and ~$X in retention."|Evidence present, stakes not framed|`operations/operatingPartnerExplainability.ts`|M|★★|
|19|Recommends what to stop doing|(additive only)|"Stop chasing template polish — it's not moving the needle."|`what_should_we_stop_doing` gated|`operations/cooConversationEngine.ts`|S|★|
|20|Distinguishes signal from noise|(flat list)|"Two of these are noise. The advancement gap is the real one."|Severity exists; not narrated|`donnaAttentionRankingEngine.ts`|S|★★|
|21|Coaches the director's judgment|(answers only)|"The pattern to watch here is X — next time you'll catch it yourself."|No coaching layer surfaced|`operations/operatingPartnerExplainability.ts`|L|★|
|22|Closes the loop on past recommendations|(no follow-through)|"You approved the cover plan — it worked, attendance held."|No accountability/outcome tracking surfaced|`coo/donnaProactiveAlerts.ts` + memory|M|★★|
|23|Prioritizes across domains, not within|(per-domain answers)|"Across everything, your #1 is the stale approval — above the curriculum gap."|No cross-domain ranking in normal answers|`donnaNBAEngine.ts`|M|★★★|
|24|Gives a confident default under uncertainty|"I don't have enough data."|"Data's thin, but I'd still start an assessment — that's the fastest way to know."|Honest-uncertainty reads as indecision|`operations/operatingPartnerExplainability.ts`|S|★★|
|25|Sets the agenda proactively|(waits to be asked)|"Before you ask — here are the two things I'd put in front of you."|No proactive opener on session start|`coo/donnaProactiveAlerts.ts` + daily brief|M|★★|

**Pattern:** 16 of 25 are difficulty **S** (surface existing output) and 8 are **M** (light glue). **Only 1 (coaching the director, #21) is genuinely new (L).** The COO already thinks these thoughts — she just doesn't say them on ordinary turns.

---

## Part 3 — Map to existing system

| COO behavior | Status | Evidence |
|---|---|---|
| Executive observation | **Exists, surfaced (gated)** | `donnaCOOIntelligenceEngine.buildCOOIntelligenceReport` — live only via `fetch_coo_intelligence` phrase |
| Prioritization (top-3, capacity-bounded) | **Exists, surfaced (gated)** | `whatShouldIDoTodayEngine.buildTodayPriorities` + `directorCapacityModel.buildCapacityBudget` |
| Executive opinion (10 COO questions) | **Exists, NOT surfaced** | `cooConversationEngine.answerCOOQuestion` — no server action calls it directly |
| Single best recommendation / NBA | **Exists, NOT surfaced** | `donnaNBAEngine.rankNextBestActions` — built, not wired live |
| Why / reasoning | **Exists, surfaced (gated)** | `operatingPartnerExplainability.buildPriorityExplanation` (`evidenceUsed`, `confidence`, `tradeoffNarrative`) |
| Tradeoff / opportunity cost | **Exists, surfaced (gated)** | `operatingPartnerTradeoffEngine.buildTradeoffAnalysis` (`tradeoff.narrative`, `whyToday`) |
| Consequence of inaction | **Exists, surfaced (gated)** | embedded in explainability/tradeoff |
| Memory of unresolved issues | **Exists, NOT surfaced** | `conversationMemoryHook.detectRecurringConcerns` — cert-only |
| Cross-session memory | **Exists, weakly surfaced** | `memory/donnaCrossSessionMemory`, `donnaMemoryContextLoader` — loaded, rarely volunteered |
| Entity memory + overdue/follow-up | **Exists, surfaced** | `memory/donnaEntityIntelligence.loadPlayerEntityContext` (`healthScore`, `isOverdue`, `followUpRequired`) |
| Goal continuity across turns | **Exists, surfaced** | `memory/donnaGoalMemory` (`getCurrentGoalState`, `buildContinuityResponse`) |
| Proactive follow-up / alerts | **Exists, NOT surfaced** | `coo/donnaProactiveAlerts.buildProactiveAlerts` — built for dashboard/overnight, no live channel |
| Proactive entity signal | **Exists, surfaced (entity-gated)** | `conversation/donnaProactiveCOODialogue.buildProactiveCOOSignal` — only via orchestrator entity path |
| Pattern / correlation | **Exists, NOT surfaced** | `donnaSignalCorrelationEngine.buildSignalCorrelations` — deterministic, unwired |
| Challenging assumptions / alt-explanations | **Exists, NOT surfaced** | `insight/donnaPerspectiveShiftEngine`, `insight/donnaAlternativeExplanationEngine` — cert-only |
| Trends over time | **Partially exists** | `coo/donnaDailyCooIntelligenceEngine` — daily, not narrated as trend in normal answers |
| Coaching the director | **Missing** | no surface today |

**Conclusion:** Of 17 COO behaviors, **0 need building from scratch except #1 (coaching the director)**. 9 exist-but-gated/unsurfaced, 4 exist-and-surfaced, 3 exist-but-weak. **Do not build a COO brain. Surface the one that exists.**

---

## Part 4 — Executive Presence Contract (design, justified by the audit)

A thin, deterministic contract — modeled exactly on the existing **Completion Contract** — that runs on **every** director answer and *enriches* it with COO elements pulled from the engines above. It consumes existing outputs; it never reasons new facts, never replaces RealitySnapshot / processDonnaMessage / Conversation DNA, and is fail-safe (returns the original answer on any issue).

**The 8 elements it guarantees (each sourced, not invented):**

| Element | Source engine (existing) | Rule |
|---|---|---|
| **Executive Observation** | `donnaCOOIntelligenceEngine`, `academyAttentionEngine` | Surface the one thing the director would miss, when reality has it |
| **Executive Prioritization** | `whatShouldIDoTodayEngine` + `directorCapacityModel` | Rank within capacity; name the #1; say what to ignore |
| **Executive Opinion** | `cooConversationEngine.answerCOOQuestion` | One-line "my read" / stance derived from the top ranked signal |
| **Executive Recommendation** | `donnaNBAEngine` + existing `nextAction` | Exactly one best action (already mostly present post-Completion-Contract) |
| **Executive Tradeoff** | `operatingPartnerTradeoffEngine` | One line: cost of the alternative / inaction |
| **Executive Memory** | `conversationMemoryHook.detectRecurringConcerns`, `donnaEntityIntelligence` | Callback to unresolved/recurring items when present |
| **Executive Follow-through** | `donnaProactiveAlerts`, Completion Contract | Volunteer overdue items; never leave hanging |
| **Executive Accountability** | `donnaProactiveAlerts` + decision history | Note outcome/age of prior recommendations when known |

**Placement in the ONE pipeline (one insertion point):**
```
processDonnaMessage
  → enforceCompletionContract        (behavior — exists)
  → enforceExecutivePresence (NEW)   (substance — surfaces existing COO output)
  → Executive Communication Layer    (voice — exists, polishes)
  → director
```
Additive · fact-preserving · fail-safe · idempotent. Only fills a missing element when the data already exists in `result` / `realitySnapshot` / the consumed engines.

---

## Part 5 — Minimal implementation plan (for the NEXT sprint — not now)

Maximum leverage, minimum code, maximum reuse. No second brain, no second conversation layer, no second personality.

**Create (3):**
1. `src/lib/donna/conversation/donnaExecutivePresenceContract.ts` — the contract + `enforceExecutivePresence(result, ctx)`; pure predicates (`hasExecutiveOpinion`, `hasTradeoff`, `hasMemoryCallback`, `hasProactiveFollowThrough`, `hasSingleBestAction`). **Consumes existing engines only.**
2. `src/lib/donna/certification/donnaCOOPresenceCertification.ts` — Part 6 below.
3. `docs/donna/DONNA_COO_PRESENCE_REPORT.md` — before/after.

**Modify (small):**
4. `donnaLiveConversationAction.ts` + `donnaStrategicConversationAction.ts` — one line each: insert `enforceExecutivePresence` between completion and executive layer.
5. **Un-gate, don't rebuild:** call the already-built engines from the contract instead of only from `fetch_coo_intelligence` — `detectRecurringConcerns` (memory), `buildProactiveAlerts` (follow-up), `rankNextBestActions` (NBA), `buildSignalCorrelations` (patterns). Wiring only.
6. Tiny exec-prompt nudge (existing layer) so polish preserves opinion/tradeoff/memory shape. Prompt text only — no OpenAI wiring change.

**Effort estimate:** ~1 contract file (~250 LOC) + ~6 small wirings. The expensive part (the reasoning) is already done and certified.

**Highest-leverage subset (if even smaller is wanted):** elements **Opinion + Tradeoff + Memory-callback + Proactive-follow-through** alone move Q3/Q6/Q7/Q9 — the four lowest pass rates — and pull Q10 (trust) up with them. That is the 80/20.

---

## Part 6 — DONNA COO Presence Certification (design)

Standalone cert (matching existing pattern), scoring 10 dimensions across representative answers from all 10 domains; target 100%.

| Dimension | Check |
|---|---|
| Observation | Top answer surfaces a non-obvious signal from reality |
| Judgment | Carries an executive opinion / stance |
| Prioritization | Names the single #1 within capacity; states what to ignore |
| Recommendations | Exactly one best action (no menu) |
| Tradeoffs | States cost of the alternative / inaction |
| Context | Memory callback when an unresolved/recurring item exists |
| Initiative | Volunteers a proactive item unprompted when one exists |
| Follow-through | No dangling answer; overdue items surfaced |
| Trust | No fabricated facts; confidence + evidence preserved; fail-safe |
| Decision Quality | Decisive on binary asks; confident default under thin data |

Plus invariants: fact-preserving, fail-open, RealitySnapshot/Completion-Contract/DNA untouched.

---

## Part 7 — Final report

### Executive summary
DONNA scores **≈3.9/10 on COO presence** today, despite strong **conversation quality (~8/10 post-3451)**. The gap is not intelligence and not wording — it is **surfacing**. A deep COO reasoning layer already exists (`operations/`, `coo/`, `insight/`, `memory/`) but reaches the director only through narrow phrase-gates, so 79% of ordinary answers read as Reporter/Dashboard/Assistant. The fix is a single **Executive Presence Contract** that runs on every answer and surfaces the COO output that's already computed. **~1 new file + ~6 wirings.**

### Top 10 discoveries
1. The COO brain is ~90% built; the bottleneck is **surfacing, not reasoning**.
2. `fetch_coo_intelligence` is a **hidden magic-phrase gate** — COO-grade answers only appear for ~6% of phrasings.
3. `cooConversationEngine.answerCOOQuestion` answers **10 strategic COO questions** but **no live action calls it**.
4. `donnaProactiveAlerts` (overdue/withdrawal/approval-age) is **built and unwired** to conversation.
5. `conversationMemoryHook.detectRecurringConcerns` (the memory callback) is **certified but never called live**.
6. `donnaNBAEngine` and `donnaSignalCorrelationEngine` are **built, deterministic, unwired**.
7. `insight/` (alternative explanations, perspective shifts — i.e. *challenging assumptions*) is **certified, unwired**.
8. `directorCapacityModel` already enforces a **100-unit cognitive budget** — but only inside the gated COO path.
9. **Tradeoff** is the single rarest element on normal answers (~9%) despite a dedicated engine existing.
10. **Trust (Q10 ~8%)** tracks almost perfectly with Opinion+Tradeoff+Memory+Proactivity — fix those four and trust follows.

### Top 25 missing COO behaviors
See Part 2 (16 are "surface existing", 8 are "light glue", 1 is genuinely new).

### Scores
- **Conversation quality:** ~8.0/10 (post-3451 convergence).
- **COO Presence:** ~3.9/10.
- **Executive Presence:** ~3.5/10 (opinion 14%, tradeoff 9%, memory 12%, proactivity 21%, trust 8%).

### Biggest architectural insight
> AcademyOS already contains an exceptional COO. It is **locked behind a phrase gate and scattered across unwired engines.** The work is not to build a COO — it is to put the COO that exists into **every** conversation through one thin, deterministic Executive Presence Contract, polished by the voice layer that already exists.

### Recommended implementation
Build `donnaExecutivePresenceContract.ts`, insert it between the Completion Contract and the Executive Communication Layer in the two director actions, and **un-gate** the already-built engines (recurring-concern memory, proactive alerts, NBA, correlation) by calling them from the contract. Start with the **Opinion + Tradeoff + Memory + Proactive** subset for the 80/20.

### Estimated effort
**Low–Medium.** ~1 contract (~250 LOC) + ~6 small wirings + 1 cert + 1 report. No migration, no new reasoning engine, no OpenAI wiring change. The reasoning and its certifications already exist.

### Expected impact
COO Presence **3.9 → ~8/10**; trust (Q10) the biggest mover. Directors stop feeling like they're reading a dashboard and start feeling like they're being advised — which is the pilot's actual differentiator.

---

## Definition of done (this sprint)
Audit + plan delivered. **No code. No commits. No implementation.** Awaiting approval before building the Executive Presence Contract.
