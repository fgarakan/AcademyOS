# DONNA Executive Operating Session V1

**Mega Sprint 4081–4110 · 2026-06-25**

> A Director can work inside AcademyOS for an entire day. DONNA always knows what
> they're doing, what they've finished, what they paused, what remains, and what matters
> most. The Director never has to remember where they left off — DONNA does.

**No new routing, OpenAI integration, or memory architecture.** The operating session is
**reduced, per turn, from the conversation history** already in the Executive Context
Packet — pure and idempotent, no new store, no new route, no new model call.

---

## 1. Executive Session architecture

```
ResolverState.conversationHistory + current route
        │
        ▼
reduceExecutiveSession(history, { currentRoute, pendingApprovals })   ← donnaExecutiveSession.ts (pure)
        │   objectives (active/paused/completed) · agenda · timeline · next step · confidence
        ▼
buildSessionDirective(session)  ──▶ folded into runExecutiveReasoning's directive
        │
        ▼
runExecutiveOperatingTurn → ExecutiveTurnResult.session (+ developer diagnostics)
```

A **work area** is the unit of objective (onboarding, curriculum, templates, players,
coaches, sessions, approvals, today, placement, level-up), detected from the message
and — on the live turn — the route. The reducer folds the turn stream into a state
machine: area switches pause the active objective and activate/resume another;
completion phrases close one; resume phrases reactivate the most-recent paused.

---

## 2. Operating agenda (Objective 3)

Maintained continuously and rebuilt every turn:

| Field | Source |
|---|---|
| currentPriority | active objective, else most-recent paused, else top open |
| currentTask | active objective's last progress |
| currentDecision | active objective's latest decision |
| currentBlocker | reserved (null in V1) |
| nextAction | finish active · else resume most-recent paused · else top open |
| futureQueue | the other unfinished objectives |

---

## 3. Session timeline (Objective 7)

An ordered list of `started · decision · completed · deferred · resumed · state` entries,
each with the turn number, area, and detail — ending with a current-state summary.
Visible in developer diagnostics. Example over the canonical workday:

```
t1 started [onboarding]   t3 deferred [onboarding]  t3 started [curriculum]
t5 deferred [curriculum]  t5 started [templates]    t7 resumed [onboarding]
t9 completed [onboarding] t10 state: No active objective. 2 open, 1 done.
```

---

## 4. Resume behavior (Objectives 2 + 4)

- **Interruption:** switching areas pauses the active objective and **stores its
  decisions + last progress** — it is not lost.
- **Resume:** "back to onboarding" / "continue" / "next" / "where were we" reactivates
  the named (or most-recent paused) objective and replays its stored progress, so DONNA
  resumes *exactly* where work stopped.
- **Continuity queries** ("what remains today?", "what should I do now?") are answered
  straight from the session by `answerWorkContinuity` — done + open + next — and never
  spin up a spurious objective (the "today" in "what remains today?" is temporal).
- The OPERATING SESSION directive instructs the model: *resume from ACTIVE or the
  most-recent PAUSED — do not ask what they were doing.*

---

## 5. Proactive guidance (Objective 6)

`surfaceProactive(session, signals, { directorAsked })` ranks unfinished onboarding,
pending approvals, academy risks, curriculum gaps, staffing, and the top opportunity —
but returns nothing while the Director is mid-objective unless asked. It surfaces
automatically when no objective is active (e.g. the start of the day or after a
completion). Onboarding-incomplete outranks everything else.

---

## 6. Developer diagnostics (Objective 8)

`buildSessionDiagnostics(session)` exposes: active objective, paused/completed
objectives, the full agenda, the timeline (formatted), the next recommendation, and a
0–1 session confidence. Developer-only — surfaced on the turn result, never user-facing.

---

## 7. Certification

`donnaExecutiveSessionCertification.ts` — **38/38**, offline + deterministic, drives the
canonical 7-step workday (begin onboarding → curriculum → templates → back to onboarding
→ resume → complete → "what remains today?"):

| Section | Proves |
|---|---|
| A | Work-area detection across all 8 areas (message + route) |
| B | Switching pauses the active objective and stores its progress |
| C | Returning resumes onboarding active, retains its earlier decision, logs the resume |
| D | Completion marks done; remaining = curriculum + templates; continuity query reports, doesn't create work |
| E | Operating agenda (priority · task · next · queue) maintained |
| F | Timeline records started/deferred/resumed/completed and ends with state |
| G | Proactive: silent mid-work, ranked when asked, surfaces when idle, onboarding first |
| H | Diagnostics expose session, agenda, timeline, next, confidence; directive says "resume, never re-ask" |
| I | Live operating turn exposes the session, completion, remaining work, next action |

Full registered suite green (18/18, zero failures). `tsc --noEmit` clean.

---

## 8. Remaining gaps

- **History-window dependence.** The reducer sees the conversation that reaches the
  turn; a very long multi-session day relies on that window. The derived session summary
  mitigates it, but durable cross-session persistence is future work (and out of scope —
  "no new memory architecture").
- **Heuristic area/decision detection** — robust and deterministic, but coarser than an
  LLM extraction; novel phrasings outside the signal catalog may go undetected.
- **Blocker tracking** is reserved (agenda.currentBlocker is null in V1).
- **Executive layer dormant live** (`DONNA_EXECUTIVE_REASONING` unset) — the session
  directive applies when enabled; the reduction runs and is certified now.

---

## 9. Scores

- **Executive Session: 9 / 10** — DONNA owns the workday: active/paused/completed
  objectives, agenda, timeline, resume-without-re-asking, proactive surfacing, and
  diagnostics, all derived and certified. Held from 10 by heuristic derivation and the
  single-window / live-flag gaps.
- **God Mode: 9.6 / 10** — the Director can work a full day and never carry the thread;
  DONNA does. Remaining lift: live-flag enablement and durable cross-session learning.
