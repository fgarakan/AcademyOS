# DONNA Strategic AI Augmentation V1 Report

**Sprint:** Mega Sprint 3001–3030  
**Date:** 2026-06-17  
**Mission:** Turn OpenAI from a failure fallback into a strategic reasoning layer — ensuring DONNA can reason about academy strategy, curriculum design, retention, staffing, and other strategic domains rather than returning generic clarification or navigation responses.

**Principle:** DONNA talks to OpenAI. OpenAI never talks directly to the user. AcademyOS remains the source of truth. Academy DNA always wins.

---

## Audit Finding (Sprint 2971–3000)

Sprint 2971–3000 added Live AI infrastructure but the post-sprint audit revealed a critical limitation:

**OpenAI was only reachable through Step 15.6 — after ALL deterministic systems had failed.**

This meant strategic questions were intercepted by earlier steps:

| Input | Intercepted at | Outcome |
|---|---|---|
| "Why are families leaving?" | Step 7.6 (COO intelligence: `families` keyword) | `fetch_coo_intelligence` |
| "Academy strategy direction?" | Step 15 (clarification) | Generic clarification question |
| "What should our curriculum look like?" | Step 14 (navigate to curriculum) | Generic navigation response |
| "Summer camp planning?" | Step 15 (unknown intent) | Generic clarification |
| "Should we change staffing?" | Step 15 (unknown intent) | Generic clarification |

**OpenAI was functioning as a failure fallback, not a reasoning layer.**

---

## New Architecture

### Updated Routing Flow

```
processDonnaMessage() — steps in order:

Step 0a:   Active goal session?            → route_goal_session
Step 0.25: Academy setup routing?          → navigate
Step 0b:   Goal workflow intent?           → start_goal_session
Step 0.5:  Pending disambiguation?         → respond (disambiguate)
Step 1:    Active guided workflow?         → route_guided_answer
Step 2:    COO control command?            → route_coo_control
Step 3:    Continuity phrase?              → respond (memory)
Step 4:    Today guidance question?        → respond (priorities)
Step 5:    Daily brief intent?             → fetch_brief
Step 6:    Review queue intent?            → open_review
Step 7:    Attention phrase?               → fetch_attention
Step 7.5:  Academy overview phrase?        → fetch_coo_intelligence
Step 7.6:  COO intelligence phrase?        → fetch_coo_intelligence
Steps 8–12.5: Entity Q&A, coach intel, execution, memory, insight, reasoning, knowledge

Step 13:   confidence ≥ 0.72 + workflow   → start_workflow
── NEW ──
Step 13.5: Strategic AI gate              → strategic_ai_assist  ← NEW
  (confidence 0.35–0.72 AND strategic domain detected)
────────
Step 14:   confidence ≥ 0.55 + route     → respond (navigate)
Step 15:   clarificationNeeded + Q        → respond (clarify)
Step 15.5: Certified NLU concept match    → respond (arc navigation)
Step 15.6: Live AI eligibility            → live_ai_assist
Step 16:   Fallthrough                    → route_coo_prompt
```

### Step 13.5: The Strategic AI Gate

Fires when:
1. `goalResult.confidence` is in the strategic zone: **0.35–0.72**
2. The message contains a strategic domain signal (e.g., "families leaving", "redesign summer camp", "curriculum look like")
3. The message also contains a strategic modifier (e.g., "why", "how", "should", "approach", "analysis")
4. The message is NOT: a navigation request, data query, or action request

Returns `strategic_ai_assist` with:
```typescript
strategicContext: {
  strategicDomain: StrategicAIDomain,
  detectedGoal: string | null,
  detectedIntent: string | null,
  confidence: number,
  reason: string,
}
```

### strategic_ai_assist vs. live_ai_assist

| | `live_ai_assist` | `strategic_ai_assist` |
|---|---|---|
| **Trigger** | Zero signal — no concept, no entity, no goal | Partial signal — strategic domain detected, moderate confidence |
| **Brain step** | Step 15.6 (after certified NLU falls through) | Step 13.5 (before navigation/clarification) |
| **AI mode** | `language_understanding` / `intent_interpretation` | `strategic_reasoning` |
| **Max tokens** | 100 | 250 |
| **Context** | Academy DNA label (100 chars) | Domain signals + framing (250 chars) |
| **Response structure** | Qualitative interpretation | Direct answer + signals + next action + follow-up |
| **Learning tag** | `ai_assisted` | `strategic_ai` |

---

## Strategic Domains

11 domains with signal + modifier requirement (both must match):

| Domain | Example Input | Signals | Modifiers |
|---|---|---|---|
| `retention_analysis` | "Why are families leaving?" | families, leaving, dropout | why, reason, cause, trend |
| `curriculum_design` | "What should our Orange curriculum look like?" | curriculum, redesign | design, should, how, approach |
| `summer_camp_planning` | "How should we redesign summer camp?" | summer camp, camp design | plan, design, should, how |
| `staffing_decisions` | "Should we change staffing for 12U?" | staffing, coach ratio | should, how, change, decision |
| `player_development_reasoning` | "How should we approach player development?" | player development | should, approach, philosophy |
| `parent_communication_strategy` | "How should we communicate with parents?" | parent communication | strategy, approach, should |
| `coach_performance_analysis` | "How are our coaches performing?" | coach performance | performance, analysis, how |
| `program_growth` | "How can we grow the academy?" | growth, expand, new players | how, strategy, plan, attract |
| `academy_operations` | "How should the academy handle scheduling?" | operations, structure | how, should, manage, improve |
| `academy_strategy` | "What should our strategic direction be?" | academy strategy, big picture | strategy, direction, priority |
| `academy_health_analysis` | "How is the academy doing overall?" | how is the academy doing | health, doing, overall, assess |

---

## Pipeline (Part 5)

When Step 13.5 fires `strategic_ai_assist`, `DonnaAssistantButton` routes to `donnaStrategicConversationAction` (server action). The server action calls `processStrategicAIConversation`:

```
processStrategicAIConversation()
  │
  ├─ 1. processDonnaMessage() [sync brain re-runs server-side]
  ├─ 2. Extract strategicCtx.strategicDomain
  ├─ 3. buildStrategicContextPacket() [domain signals + framing, no PII]
  ├─ 4. askConversationTeacher({ mode: 'strategic_reasoning', ... }) [OpenAI]
  ├─ 5. applyDonnaPersonality() [DONNA voice enforcement]
  ├─ 6. checkAcademyDNAGuard() [DNA + operating model safety]
  ├─ 7. scoreLearningQuality()
  ├─ 8. createLearningEntry() + donnaLearningLedger.addEntry()
  │    └── metadata: { strategy_assist: true, strategic_domain, outcome_status: 'unknown', usefulness_score: null }
  ├─ 9. donnaConversationReplayDataset.capture()
  ├─ 10. recordAIUsage()
  └─ 11. return DonnaMessageResult { action: 'respond' }
```

---

## Strategic Response Contract (Part 6)

The `strategic_reasoning` teacher mode produces a structured response:

```
[1–2 sentence direct answer]
Top signals: [2–3 bullet points, each under 15 words]
Next action: [1 concrete sentence]
Follow-up: [1 focused question]
Under 90 words total.
```

Example:

**User:** "Why are families leaving?"  
**DONNA:** "Retention loss typically follows three compounding signals.  
Top signals: Progression delays (players stuck at same level); Attendance drop-off (below 70%); Parent communication gaps (no updates in 30+ days).  
Next action: Review players who haven't changed levels in 6 months.  
Follow-up: Which group has the longest average tenure at current level?"

---

## Strategic Learning Capture (Part 7)

Every `strategic_ai_assist` turn captures a `LearningEntry` with:
- `status: 'captured'` — never auto-promoted (approval-gated)
- `reviewRequired: true` — always surfaced for director review
- `metadata.strategy_assist: true`
- `metadata.strategic_domain`: detected domain
- `metadata.outcome_status: 'unknown'` — not scored until director acts
- `metadata.usefulness_score: null` — set only after director confirms or dismisses

---

## Privacy and Safety

### Context Firewall
The `buildStrategicContextPacket()` function provides domain-specific signal framing and recommended data points. It **never includes**:
- Player names or player IDs
- Parent emails or phone numbers
- Assessment scores or coach notes
- Raw session observations

### Privacy Guard (existing — unchanged)
`privacyGuard()` in `donnaConversationTeacher.ts` blocks teacher calls where text matches PII patterns (DOB, guardian email, assessment scores, etc.).

### Academy DNA Guard (existing — unchanged)
Blocks AI drafts that:
- Issue mutation instructions ("you should remove this coach")
- Suggest bypassing approval workflows
- Self-identify as AI ("As an AI, I recommend...")
- Make guarantees ("I guarantee...")

---

## Files Created

| File | Purpose |
|---|---|
| `src/lib/donna/brain/donnaStrategicAIEligibility.ts` | Part 2: 11 strategic domains; requires signal + modifier; confidence zone 0.35–0.72 |
| `src/lib/donna/brain/donnaStrategicAIContextBuilder.ts` | Part 4: Domain-specific context packets (no PII); formatted for teacher call |
| `src/app/director/_actions/donnaStrategicConversationAction.ts` | Server action: auth, role gate, DNA context fetch, calls `processStrategicAIConversation()` |
| `src/lib/donna/brain/donnaStrategicAIAugmentationCertification.ts` | Part 8: 35-assertion certification |
| `docs/donna/DONNA_STRATEGIC_AI_AUGMENTATION_V1_REPORT.md` | Part 10: This report |

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/brain/donnaBrainDebugLog.ts` | Added `'strategic_ai_check'` to `BrainRoutingStep` union |
| `src/lib/donna/brain/processDonnaMessage.ts` | Added `'strategic_ai_assist'` to `DonnaMessageAction`; added `strategicContext: StrategicContext | null` to `DonnaMessageResult`; added Step 13.5 gate; imports from `donnaStrategicAIEligibility` |
| `src/lib/donna/brain/donnaLiveAIConversationBrain.ts` | Added `processStrategicAIConversation()` export; added imports from context builder |
| `src/lib/donna/conversation/donnaConversationTeacher.ts` | Added `'strategic_reasoning'` to `TeacherMode`; 250-token limit; 250-char context window; fallback for new mode |
| `src/components/assistant/DonnaAssistantButton.tsx` | Added `handleStrategicAIAssist()`; `case 'strategic_ai_assist'`; import from new server action |
| `src/lib/donna/brain/donnaLiveAIConversationCertification.ts` | Part 9: Added 3 regression assertions (assertions 40–42) |
| `docs/CHANGELOG.md` | Sprint entry |

---

## Certification Results

### Strategic AI Augmentation V1 (new)
**35/35 assertions — 100% PASS**

| Section | Assertions | Result |
|---|---|---|
| Part 2 — Strategic Domain Detector | 10 | ✓ |
| Part 3 — Non-strategic inputs blocked | 5 | ✓ |
| Part 3 — Brain routing (setup, live_ai) | 2 | ✓ |
| Part 4 — Context Builder | 5 | ✓ |
| Part 6 — DNA Guard safety | 4 | ✓ |
| Part 7 — Learning metadata | 5 | ✓ |
| Replay dataset | 3 | ✓ |
| AI usage metrics | 2 | ✓ |

### Live AI Conversation V1 (regression)
**42/42 assertions — 100% PASS** (39 original + 3 regression)

**TypeScript:** Clean — `npx tsc --noEmit` passes with 0 errors.

---

## Routing Examples

### strategic_ai_assist fires

| Input | Confidence | Domain |
|---|---|---|
| "Why are families leaving?" | 0.45 | `retention_analysis` |
| "How should we redesign summer camp?" | 0.50 | `summer_camp_planning` |
| "What should our Orange curriculum look like?" | 0.50 | `curriculum_design` |
| "Should we change staffing for 12U?" | 0.55 | `staffing_decisions` |
| "How is the academy doing overall?" | 0.40 | `academy_health_analysis` |

### strategic_ai_assist does NOT fire

| Input | Reason |
|---|---|
| "What do I need to do next?" | No strategic domain signals |
| "Show me who is ready to advance" | Data query pattern |
| "Help me finish academy setup" | Setup routing (Step 0.25) intercepts |
| "Something feels off" | Zero signal — goes to live_ai_assist |
| "Why are families leaving?" at conf 0.25 | Below 0.35 confidence floor |
| "Why are families leaving?" at conf 0.75 | Above 0.72 ceiling — workflow threshold |

---

## Remaining Limitations

1. **COO intelligence interception** — inputs containing `families` or `family` are caught by `isCOOIntelligencePhrase()` at Step 7.6 and route to `fetch_coo_intelligence` before reaching Step 13.5. DONNA still responds, but through the COO intelligence path rather than strategic AI. This is correct behavior for operational questions; for deeper reasoning the user should ask with more strategic framing.

2. **Confidence floor** — The strategic gate requires `goalConfidence ≥ 0.35`. Very low-confidence inputs containing strategic domain signals fall through to Step 15.5 (certified NLU) or Step 15.6 (live AI) instead. This is conservative by design.

3. **No live DB context** — The `buildStrategicContextPacket()` provides signal framing and recommended data points, but does NOT fetch actual live academy data (enrollment numbers, attendance rates, etc.). The AI reasons about what signals to check, not what the signals currently show. Live data enrichment is a future sprint.

4. **In-memory learning** — Strategic learning entries are captured in the in-memory ledger only. DB persistence follows the existing Learning Ledger roadmap.

---

## Recommended Next Sprint

**Sprint 3031–3060 — DONNA Strategic Context Enrichment V1**

- Fetch live academy signals in `donnaStrategicConversationAction` (enrollment trend, attendance rate, progression velocity, pending review count) — scoped to the academy, no player PII
- Pass enriched context to the teacher so OpenAI can reason about actual current state, not just signal schema
- Add a "Strategic AI" tab to the Learning Ledger review UI so directors can review, score, and promote strategic reasoning turns
- Add `usefulnessScore` update path (director can mark a strategic response as useful/not useful)
- DB persistence for strategic turns via new `donna_strategic_turns` table
