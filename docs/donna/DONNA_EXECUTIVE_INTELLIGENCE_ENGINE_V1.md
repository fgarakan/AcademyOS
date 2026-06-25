# DONNA Executive Intelligence Engine V1

**Mega Sprint 4261–4290 — 2026-06-25**

DONNA's first proactive-COO layer. She reviews the academy's real state, detects risks
and opportunities (each with evidence), prioritizes what matters, and recommends the
next best action — before the Director asks. Pure + deterministic over signals that are
**already computed** (`DonnaAcademySignals` / `LivePageState`) plus Durable Learning.
No data fetching here, no invented signals (null = unknown → ignored), no new OpenAI
pathway, no new memory system, no duplicate intelligence engine.

**Single new engine:** `src/lib/donna/executive/donnaExecutiveIntelligence.ts`.

---

## 1. Academy Signal Map (Obj 1)

`buildSignalMap(snapshot, learning)` normalizes 13 real signals across **onboarding ·
players · curriculum · coaches · sessions · approvals · assessments · parent/player risk
· durable learning**. A null/unknown signal is dropped — never turned into a finding.

## 2. Risk engine (Obj 2)

`detectRisks(map)` — incomplete onboarding · pending approvals · curriculum gaps · player
stagnation · missed assessments · workflow blockers. **Every risk carries non-empty
evidence** (the concrete signal values); a risk without evidence is never emitted.
Attendance / coach-follow-up risks are intentionally *not* fabricated (no signal source) —
honest gaps, listed below.

## 3. Opportunity engine (Obj 3)

`detectOpportunities(map, learning)` — promotion candidates · enrollment/placement leverage
· coach assignment · parent-communication moments · curriculum improvement (informed by a
**durable-learning** entry). Each carries evidence.

## 4. Prioritization (Obj 4)

`priorityScore` = weighted blend of **urgency · impact · confidence · (1−effort) ·
(1−dependency) · director relevance**, with a small risk bump. `prioritize()` ranks and
returns **only the top 3–5** — no noisy dashboard.

## 5. Executive recommendation (Obj 5)

`toRecommendation` produces, per priority: **situation · evidence · confidence · impact ·
recommended action · why now · next step** — direct, calm, executive tone (a per-category
playbook). `buildExecutiveBriefing` assembles the headline + recommendations;
`formatBriefingSpoken` renders the spoken COO briefing.

## 6. DONNA integration (Obj 6)

`isProactiveExecutiveQuestion` recognizes *Good morning · What should I do today? · How is
the academy doing? · What needs attention? · What am I missing? · What's highest priority?*
On those turns, `donnaLiveConversationAction` builds the briefing from the live signals +
durable learning and injects the top priorities into the packet's **existing**
`outstandingDecisions` slot (`recommendationsToDecisions`) — so the live executive answer
is grounded in real ranked priorities, not generic chat. Reuse, not a new packet source.

**Live proof (real OpenAI):** "What should I do today?" → *"Clear the review queue first
to address the pending approvals for parents and coaches… the trade-off is… Next step:
Approve the two parent-facing reviews…"* — led by the #1 ranked priority with evidence.

## 7. Developer diagnostics (Obj 7)

`[donna.intelligence] inspected=13 known=13 risks=5 opps=5 topScore=0.83 evidence=6
confidence=0.97 source=executive_intelligence learningUsed=1` — signals inspected/known,
risks/opportunities found, top priority score, evidence used, confidence, source, learning used.

---

## Certification

`donnaExecutiveIntelligenceEngineCertification.ts` — **40/40**: real-data signal map,
no invented data, evidence-bearing risks + opportunities, ranked top 3–5, complete
recommendations with next step, proactive integration, diagnostics, and "quiet when there
is nothing to say." Full gate **24/24 suites passed**; `tsc --noEmit` clean.

---

## Remaining intelligence gaps (honest)

- **Attendance decline & coach follow-up gaps** have no signal source yet, so they are not
  detected (no invented data). Adding those signals to `DonnaAcademySignals` would extend
  the risk engine with zero engine changes.
- **No trend/history** — findings are point-in-time from current signals; "declining vs
  last week" needs a time series.
- **Live grounding via `outstandingDecisions`** shapes the executive answer but is one slot;
  a dedicated `executive_intelligence` packet source could carry the full structured
  briefing if richer grounding is wanted.
- Briefing copy is deterministic; the executive voice/OpenAI refines wording downstream.

**God Mode score: 9 / 10.**
