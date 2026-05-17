# DONNA Conversation Architecture

**Sprint:** 539 — Natural Conversation Architecture Audit V1
**Date:** 2026-05-17
**Status:** Design document — not yet implemented (implementation begins Sprint 540)

---

## Overview

DONNA is the Academy OS internal AI assistant (public name: "Academy Assistant"). The conversation system lets coaches complete structured wrap-ups through a guided, natural-language dialogue — not a form.

The conversation system is **coach-facing only**. It never writes directly to any database. All outputs flow through `proposed_actions` where the director reviews before anything changes officially.

---

## Operating Model

```
Coach speaks/types
  → DONNA captures input
    → DONNA structures the input
      → Draft goes to proposed_actions
        → Director reviews
          → System executes only after director approval
```

This constraint is non-negotiable. DONNA never mutates core data autonomously.

---

## Existing Foundation (Pre-Sprint 540)

These files exist and must be respected by Sprint 540+ implementations:

| File | What it does |
|---|---|
| `src/components/capture/DonnaWrapUpPrompt.tsx` | TTS-capable prompt bubble. Renders DONNA's question, handles speak/stop, exposes `voiceEnabled` toggle. |
| `src/components/capture/WrapUpGuidedFlow.tsx` | 5-step guided wizard: attendance, session_actual, standouts, needs_attention, follow_up. Holds `WrapUpAnswer[]` and `WrapUpAnswerSet` types. |
| `src/components/capture/WrapUpMobileShell.tsx` | Mobile wrapper for the guided flow. |
| `src/lib/coach/wrapUpRosterLoader.ts` | Read-only: roster + attendance status per session. |
| `src/lib/coach/wrapUpAttendanceDraftLoader.ts` | Read-only: attendance counts and fill state. |
| `src/lib/coach/wrapUpSessionActualLoader.ts` | Read-only: block + exercise completion. |
| `src/lib/coach/wrapUpPlayerNameMatcher.ts` | Pure utility: matches player names in free text. |
| `src/lib/coach/wrapUpReviewQueueLoader.ts` | Read-only: coach's pending/approved proposed_actions. |

**Sprint 540+ must not duplicate or replace any of these files.**

---

## Conversation State Machine

### States

```
idle
  ↓ coach opens wrap-up panel or types first message
typing
  ↓ DONNA receives input, starts structuring
listening          (when voice mode is active)
  ↓ voice transcript ready or coach submits text
clarifying
  ↓ DONNA asks follow-up for ambiguous input
  ↓ coach answers or skips
summarizing
  ↓ DONNA presents structured summary for coach review
awaiting_review
  ↓ coach confirms → draft saved to proposed_actions
complete
  ↓ coach closes wrap-up or navigates away
error              (any unrecoverable failure)
  ↓ show recovery options, never auto-retry
```

### Transition Rules

| From | Event | To |
|---|---|---|
| `idle` | Coach opens panel | `typing` |
| `idle` | Coach activates voice | `listening` |
| `typing` | Coach submits message | `clarifying` or `summarizing` |
| `listening` | Transcript ready | `typing` |
| `listening` | Voice error / no input | `typing` (fallback, never `error`) |
| `clarifying` | Coach answers or skips | `clarifying` (next question) or `summarizing` |
| `summarizing` | Coach confirms draft | `awaiting_review` |
| `summarizing` | Coach edits | `typing` |
| `awaiting_review` | Draft saved | `complete` |
| `awaiting_review` | Save fails | `error` |
| `error` | Coach retries | `typing` |
| `complete` | — | terminal (no further transitions) |

### Invariants

- `awaiting_review` is never entered until the coach has explicitly confirmed the structured summary.
- `complete` is only set after a successful write to `proposed_actions` — not before.
- Voice fallback (`listening` → `typing`) must always succeed — voice failure never blocks the flow.
- Skipping any question is always allowed — no required fields in the conversation layer.
- DONNA never auto-advances past `summarizing` — coach must act.

---

## Message Model

Each conversation turn is a `ConversationMessage`:

```typescript
type MessageRole = 'donna' | 'coach'

type MessageKind =
  | 'question'       // DONNA asks
  | 'answer'         // Coach answers
  | 'clarification'  // DONNA asks follow-up
  | 'summary'        // DONNA presents structured summary
  | 'confirmation'   // Coach confirms/rejects summary
  | 'system'         // System-generated (e.g. "Draft saved")

interface ConversationMessage {
  id: string                   // uuid, client-generated
  role: MessageRole
  kind: MessageKind
  text: string
  timestamp: string            // ISO 8601
  questionId?: WrapUpQuestionId  // links back to WrapUpGuidedFlow.tsx question ids
  isSkipped?: boolean
  voiceTranscript?: string | null
}
```

`WrapUpQuestionId` values come from `WrapUpGuidedFlow.tsx`:
- `q1_attendance`
- `q2_session_actual`
- `q3_standouts`
- `q4_needs_attention`
- `q5_follow_up`

---

## Conversation Session

A `ConversationSession` wraps the full dialogue:

```typescript
interface ConversationSession {
  sessionId: string                   // the athletic session being wrapped up
  state: ConversationState            // current state machine state
  messages: ConversationMessage[]
  draftAnswers: Partial<WrapUpAnswerSet>
  startedAt: string
  completedAt: string | null
}
```

`ConversationState` is one of: `'idle' | 'typing' | 'listening' | 'clarifying' | 'summarizing' | 'awaiting_review' | 'complete' | 'error'`

---

## Integration Points

### With `WrapUpGuidedFlow.tsx`

The conversation system is a natural-language layer on top of the 5-step question structure already defined in `WrapUpGuidedFlow.tsx`. It does not replace it — it fills in the same `WrapUpAnswer[]` using natural language instead of direct form inputs.

DONNA maps coach answers to question IDs:
- Mention of absences/presence → `q1_attendance`
- Mention of blocks, session plan, exercises → `q2_session_actual`
- Positive player observations → `q3_standouts`
- Support needs, concerns → `q4_needs_attention`
- Parent/director notes → `q5_follow_up`

### With `wrapUpPlayerNameMatcher.ts`

After each coach turn, `matchPlayerNamesPerSentence` is called on the coach's text to identify mentioned players. Results are advisory — not automatically linked to player profiles. The coach sees "I heard: Lucas, Emma" and can correct.

### With `proposed_actions`

When state reaches `awaiting_review`, the structured `WrapUpAnswerSet` is passed to `saveWrapUpDraftAction` which writes to `proposed_actions` with:
- `target_module: 'session_wrap_up_v1'`
- `target_object_id: sessionId`
- `proposed_by_id: coachUserId`

No other writes occur anywhere in the conversation flow.

### With `DonnaWrapUpPrompt.tsx`

The prompt component handles TTS rendering of DONNA's current question/message. It is stateless — receives `question` and `voiceEnabled` as props. The conversation state machine drives what `question` is shown at each turn.

---

## Voice Constraints

1. Voice input (STT) requires browser API availability — always offer text fallback.
2. Voice output (TTS) via `DonnaWrapUpPrompt` uses `speechSynthesis` — always check `hasSpeechSynthesis()`.
3. Voice errors (network, permission, timeout) must fall back silently to text — never show an error modal for voice failure.
4. `voiceEnabled` state is coach preference, stored in component state (not database).
5. Voice transcript is captured in `voiceTranscript` on `WrapUpAnswer` — raw text preserved for audit.

---

## Safety Rules for Sprint 540+

These rules apply to all sprints that implement the conversation system:

| Rule | Detail |
|---|---|
| No direct DB writes from conversation components | All writes via `saveWrapUpDraftAction` only |
| No auto-send to director | Coach must explicitly confirm the summary |
| No player level changes | Conversation output is advisory only |
| No parent communications | Coach-only tool, no sends triggered |
| No curriculum mutations | Conversation never writes to curriculum tables |
| Voice fallback always required | Text input must always work even when voice is unavailable |
| Clarification is optional | DONNA can ask follow-up questions but coach can always skip |
| No external AI API calls from the conversation shell | DONNA logic is local/server-side — no live LLM calls in the conversation UI shell |
| State machine state is client-only | `ConversationState` lives in `useState` — never written to DB |

---

## Sprint Build Order (540–547)

| Sprint | Deliverable | Depends On |
|---|---|---|
| 540 | DONNA Conversation State Machine V1 — `useConversationState` hook, state transitions, TypeScript types | This doc |
| 541 | DONNA Conversation Message Model V1 — `ConversationMessage` type, message builder utilities | 540 |
| 542 | DONNA Conversational Panel Shell V1 — message history UI, renders `DonnaWrapUpPrompt` per question | 540, 541 |
| 543 | DONNA Coach Wrap-Up Conversation Script V1 — question sequence, DONNA response text per step | 540 |
| 544 | DONNA Adaptive Clarifying Questions V1 — follow-up logic when answer is vague/missing | 540, 543 |
| 545 | DONNA Correction Handling V1 — coach says "actually..." and revises a previous answer | 540, 541 |
| 546 | DONNA Conversation Summary Before Review V1 — structured summary panel before `awaiting_review` | 540, 543 |
| 547 | DONNA Conversation to Draft Adapter V1 — maps `ConversationSession` to `WrapUpAnswerSet` for `saveWrapUpDraftAction` | 540, 541, 543 |

---

## Non-Goals

The following are explicitly out of scope for Sprints 540–547:

- Live LLM API calls from the conversation UI (no real-time AI inference in the shell)
- Persistent conversation history (no `conversations` table — state is ephemeral per session load)
- Multi-session conversation continuity
- DONNA initiating contact (DONNA responds only when coach opens the panel)
- Director-facing conversation replay (directors see the structured output, not the raw dialogue)
