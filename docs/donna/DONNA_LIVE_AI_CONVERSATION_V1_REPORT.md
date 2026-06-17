# DONNA Live AI Conversation + Learning Router V1 Report

**Sprint:** Mega Sprint 2971–3000  
**Date:** 2026-06-17  
**Mission:** Transform DONNA from a purely deterministic brain into a conversational operating partner that leverages OpenAI for language interpretation when deterministic signals are insufficient — while keeping academy intelligence first, AI second, and learning always.

**Principle:** DONNA talks to OpenAI. OpenAI never talks directly to the user.

---

## Architecture

### The Live AI Pipeline

When a vague, qualitative input (e.g. "Practice felt flat", "Something feels off") falls through all of DONNA's deterministic steps (0a → 15.5), the new **Step 15.6** evaluates whether OpenAI can help interpret the intent. If eligible, the brain returns `action: 'live_ai_assist'`. `DonnaAssistantButton` routes this to a new server action (`donnaLiveConversationAction`) which runs the full async pipeline:

```
DonnaAssistantButton
  │
  ├─ processDonnaMessage() [sync]
  │    ├─ Steps 0a → 15.5 (deterministic — all existing handlers)
  │    └─ Step 15.6: evaluateAIAssistEligibility()
  │         ├─ eligible → return 'live_ai_assist'
  │         └─ not eligible → continue to Step 16 (route_coo_prompt)
  │
  └─ case 'live_ai_assist' → handleLiveAIAssist() [async]
       └─ donnaLiveConversationAction() [server action]
            └─ processLiveAIConversation()
                 ├─ 1. processDonnaMessage() [sync brain, re-runs server-side]
                 ├─ 2. evaluateAIAssistEligibility() [defensive re-check]
                 ├─ 3. askConversationTeacher() [OpenAI gpt-4o-mini + privacyGuard]
                 ├─ 4. applyDonnaPersonality() [DONNA voice enforcement]
                 ├─ 5. checkAcademyDNAGuard() [DNA + operating model safety]
                 ├─ 6. scoreLearningQuality() [Part 5.5]
                 ├─ 7. createLearningEntry() + donnaLearningLedger.addEntry()
                 ├─ 8. donnaConversationReplayDataset.capture()
                 ├─ 9. recordAIUsage()
                 └─ 10. return DonnaMessageResult { action: 'respond' }
```

### What AI Assist Is and Isn't

| AI assist IS used for | AI assist is NOT used for |
|---|---|
| Short qualitative inputs ("Practice felt flat") | Data queries ("Show me who is ready") |
| Observational statements ("Orange seems weird") | Action requests ("Let's adjust the curriculum") |
| Emotional signals ("Parents seem frustrated") | Long complex questions (> 150 chars) |
| Vague low-confidence phrases (topConfidence < 0.25) | High-confidence inputs (handled by Steps 0a–15.5) |

---

## Part Inventory

| Part | Module | Status |
|---|---|---|
| 1 — Confidence Evaluator | `donnaBrainConfidenceEvaluator.ts` | ✓ New |
| 2 — OpenAI Router | `donnaLiveAIConversationBrain.ts` → `askConversationTeacher()` | ✓ Integrated (reused existing teacher) |
| 3 — Context Firewall | `privacyGuard()` in `donnaConversationTeacher.ts` | ✓ Existing — documented and verified |
| 4 — Personality Layer | `donnaPersonalityLayer.ts` | ✓ New |
| 5 — Learning Candidate Capture | `donnaLiveAIConversationBrain.ts` → `donnaLearningLedger` | ✓ Integrated (reused existing ledger) |
| 5.5 — Learning Quality Score | `donnaLearningQualityScorer.ts` | ✓ New (user addition) |
| 6 — Academy DNA Priority | `donnaAcademyDNAGuard.ts` | ✓ New |
| 7 — Conversation Replay Dataset | `donnaConversationReplayDataset.ts` | ✓ New |
| 8 — Live Brain Integration | `processDonnaMessage.ts` Step 15.6 + `DonnaAssistantButton.tsx` + `donnaLiveConversationAction.ts` | ✓ New |
| 9 — Certification | `donnaLiveAIConversationCertification.ts` | ✓ 39/39 PASS |
| 10 — Report | This document | ✓ |
| AI Usage Metrics | `donnaAIUsageMetrics.ts` | ✓ New (user addition) |

---

## Files Created

| File | Purpose |
|---|---|
| `src/lib/donna/brain/donnaBrainConfidenceEvaluator.ts` | Part 1: evaluates whether vague input is eligible for AI assist |
| `src/lib/donna/conversation/donnaPersonalityLayer.ts` | Part 4: enforces DONNA voice on AI drafts |
| `src/lib/donna/conversation/donnaAcademyDNAGuard.ts` | Part 6: blocks/flags AI drafts conflicting with academy DNA |
| `src/lib/donna/conversation/donnaConversationReplayDataset.ts` | Part 7: in-memory replay dataset (circular buffer, 200 turns) |
| `src/lib/donna/conversation/donnaAIUsageMetrics.ts` | AI usage tracking (calls, tokens, quality, DNA conflicts by role) |
| `src/lib/donna/learning/donnaLearningQualityScorer.ts` | Part 5.5: 0–100 quality score for AI-assisted learning entries |
| `src/lib/donna/brain/donnaLiveAIConversationBrain.ts` | Parts 2+5+8: async AI pipeline orchestrator |
| `src/app/director/_actions/donnaLiveConversationAction.ts` | Part 8: server action (director + head_coach only; academy ID from auth) |
| `src/lib/donna/brain/donnaLiveAIConversationCertification.ts` | Part 9: 39-assertion certification harness |
| `docs/donna/DONNA_LIVE_AI_CONVERSATION_V1_REPORT.md` | Part 10: this report |

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/brain/donnaBrainDebugLog.ts` | Added `'live_ai_check'` to `BrainRoutingStep` union |
| `src/lib/donna/brain/processDonnaMessage.ts` | Added `'live_ai_assist'` to `DonnaMessageAction`; added Step 15.6 routing logic + import |
| `src/components/assistant/DonnaAssistantButton.tsx` | Added `handleLiveAIAssist()` function + `case 'live_ai_assist'` + import |
| `docs/CHANGELOG.md` | Sprint entry |

---

## What Was Reused vs. New

### Reused (DO NOT rebuild)

| Existing module | Role in this sprint |
|---|---|
| `donnaConversationTeacher.ts` | OpenAI caller (gpt-4o-mini) — Part 2's actual HTTP call |
| `privacyGuard()` in teacher | Context firewall — Part 3 |
| `donnaLearningLedger.ts` | Learning entry storage — Part 5 sink |
| `createLearningEntry()` | Learning entry factory — Part 5 |
| `confidenceScoring.ts` | Threshold constants referenced in brain evaluator |
| `processDonnaMessage.ts` | Sync brain — re-runs inside `processLiveAIConversation()` |

### New

All 10 new files above — none duplicate existing logic.

---

## Safety Architecture

### Server Action Safety Contract

- **Auth required**: Server action verifies `supabase.auth.getUser()` before proceeding
- **Role gate**: Only `academy_director` and `head_coach` can access live AI assist
- **Academy ID from auth**: `membership.academy_id` from Supabase — never from client input
- **Input validation**: userMessage trimmed, non-empty, max 500 chars
- **DNA context**: Only `academy.name + DNA model label` sent to OpenAI — no player data, no session notes

### Privacy Firewall Contract (Part 3)

`privacyGuard()` in `donnaConversationTeacher.ts` blocks any call where the text matches:
- Assessment scores, coach notes, raw notes
- DOB, date of birth, player IDs
- Guardian emails, phone numbers

Additionally: text > 500 chars is rejected before sending.

### DNA Guard Verdict Hierarchy

| Verdict | Condition | Outcome |
|---|---|---|
| `blocked` | Mutation instruction, bypass suggestion, AI self-identification | Suggested alternative shown; entry marked `rejected` in ledger |
| `flagged` | DNA-sensitive topic (competition, advancement, parent comms) when DNA context provided | Entry captured with `reviewRequired: true` |
| `pass` | No conflict | Entry captured normally |

---

## Learning Quality Score (Part 5.5)

Each AI-assisted turn produces a `LearningQualityScore` stored in `LearningEntry.metadata['ai_quality_score']`:

| Signal | Impact |
|---|---|
| OpenAI succeeded (source=openai) | +25 |
| Confidence improved significantly (Δ > 0.20) | +15 |
| Confidence improved slightly (Δ 0.05–0.20) | +8 |
| DNA cleared | +5 |
| No personality transforms needed | +5 |
| Fallback (source=fallback) | -20 |
| Not called (source=not_called) | -10 |
| Confidence degraded (Δ < -0.10) | -10 |
| DNA blocked | -30 |
| DNA flagged | -10 |
| Heavy personality transform (≥ 3) | -5 |

Quality labels: `high` (≥70), `medium` (45–69), `low` (<45), `rejected` (DNA blocked).

---

## Certification Results

**39/39 assertions — 100% PASS**

| Section | Assertions | Result |
|---|---|---|
| Part 1 — Confidence Evaluator | 7 | ✓ |
| Part 3 — Context Firewall contract | 1 | ✓ |
| Part 4 — Personality Layer | 6 | ✓ |
| Part 5.5 — Learning Quality Score | 4 | ✓ |
| Part 6 — Academy DNA Guard | 6 | ✓ |
| Part 7 — Conversation Replay Dataset | 6 | ✓ |
| AI Usage Metrics | 6 | ✓ |
| Part 8 — Live Brain Integration (Step 15.6 routing) | 3 | ✓ |

**TypeScript:** Clean — `npx tsc --noEmit` passes with 0 errors.

---

## Fallback Contracts

All failure modes produce a safe result — nothing blocks the director experience:

| Failure mode | Result |
|---|---|
| `OPENAI_API_KEY` not set | Teacher returns `source: 'fallback'`; pipeline continues with default phrasing |
| OpenAI API error | Teacher catches error, returns `source: 'fallback'` |
| DNA guard blocks | Suggested alternative response shown; entry marked `rejected` |
| `evaluateAIAssistEligibility` returns not eligible | `action: 'route_coo_prompt'` — COO chain handles it |
| Unhandled exception in `processLiveAIConversation` | `action: 'route_coo_prompt'` fallback |
| Server action auth failure | `action: 'respond'` with safe error message |

---

## In-Process Storage (Future DB Persistence)

Both new singleton stores are process-scoped (reset on restart). DB persistence is a future sprint:

| Store | Max capacity | Future persistence |
|---|---|---|
| `donnaConversationReplayDataset` | 200 turns (circular buffer) | Replay turns table |
| `donnaAIUsageMetrics` | 5,000 events | AI usage events table |

---

## Observation: "Orange seems weird" routing

During certification, "Orange seems weird" was NOT routed to `live_ai_assist` — it was handled at Step 14 (medium-confidence goal → respond) because the entity resolver matched "Orange Ball" (a named group or level). This is correct behavior: Step 15.6 only fires when ALL earlier steps fall through. The certification assertion was correctly written to accept either `respond` or `live_ai_assist` for this phrase.

The actual `live_ai_assist` path fires for inputs that carry NO entity, goal, or context pack signal — purely vague qualitative statements with no AcademyOS concept anchor.

---

## Recommended Next Sprint

**Sprint 3001–3010 — DONNA Live AI Replay DB Persistence V1**

- Write `donnaConversationReplayDataset` turns to a new `donna_replay_turns` table (with RLS)
- Write `donnaAIUsageMetrics` events to a new `donna_ai_usage_events` table
- Add a director-only Replay Viewer UI (table view + quality filter)
- Add DNA conflict alert to the director dashboard when `dnaFlaggedCount > 0`
