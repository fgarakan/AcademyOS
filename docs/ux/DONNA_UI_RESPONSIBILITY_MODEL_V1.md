# DONNA vs UI Responsibility Model V1

**Date:** 2026-06-05
**Purpose:** Define the exact boundary between DONNA (intelligence layer) and UI (evidence layer).
**Core Principle:** DONNA thinks. The UI proves. The director decides.

---

## The Problem This Solves

The current AcademyOS UI has DONNA and the UI doing the same jobs simultaneously.

- DONNA shows priorities → the UI also shows priorities (different cards, same data)
- DONNA makes recommendations → the UI also lists next actions (hardcoded text)
- DONNA summarizes the academy → the UI also shows KPI tiles + alert counts
- DONNA greets the director → the UI header also greets the director

When DONNA and the UI both speak at the same time, neither is trusted.
When neither is trusted, the director scrolls instead of acts.

This model defines who speaks, about what, and when.

---

## DONNA's Domain

DONNA owns everything that requires **judgment under uncertainty**.

### DONNA speaks to:

**1. Summarizing**
DONNA collapses many signals into one sentence.
- "3 wrap-ups pending, 4 stalled players, 2 lesson requests" → "Your review queue needs attention before the curriculum problems worsen."
- DONNA does not list — it concludes.
- The UI lists. DONNA concludes.

**2. Prioritizing**
DONNA ranks competing signals into an ordered set.
- "Which of my 6 pending items is most important?" → DONNA answers with one ranked action.
- The UI shows all 6. DONNA picks the first.
- DONNA's ranking is visible to the director as Zone 3 on the homepage.

**3. Explaining**
DONNA explains WHY a signal exists.
- "Orange Ball 2 has 4 stalled players" is a UI fact.
- "The blocker is cross-court consistency — 3 of 4 players failed the same gate twice" is DONNA explaining.
- DONNA only explains when it has enough evidence to be specific. If it cannot be specific, it says so.

**4. Recommending**
DONNA recommends the next action.
- "Review the Orange Ball 2 gate evidence and decide whether to adjust the threshold."
- DONNA recommends one action per brief. Not a list. Not "here are three things you could do."
- DONNA recommends based on data. If data is insufficient, DONNA defers: "More session data needed before a recommendation can be made."

**5. Guiding the next step**
DONNA tells the director what comes after the current action.
- After approving a wrap-up: "2 more wrap-ups in queue — review next or check the stalled player list."
- This is conversational guidance, not a notification.

---

## UI's Domain

The UI owns everything that requires **proof and action**.

### UI speaks to:

**1. Evidence**
The UI shows the raw facts behind DONNA's conclusions.
- DONNA: "Orange Ball 2 is blocked."
- UI: Shows the gate list, completion %, stalled player names, days enrolled.
- The director trusts DONNA's conclusion because the UI's evidence confirms it.
- Evidence is always labeled with its source: "from player_requirement_progress" or "from voice_notes."

**2. Approval**
The UI owns every approval action.
- DONNA can recommend "approve this wrap-up."
- But the approve button, the confirmation state, and the audit trail are UI responsibilities.
- DONNA never auto-approves. The UI enforces the review gate.

**3. Status**
The UI shows current state.
- Version status (active / draft / not started)
- Player status (active / pending / on hold)
- Session status (planned / in progress / completed)
- These are facts, not conclusions. UI owns facts.

**4. Navigation**
The UI owns all navigation.
- DONNA can say "Review the Orange Ball 2 gate evidence."
- But the link to `/director/curriculum?improve=orange_2` is a UI element.
- DONNA does not own route changes — it recommends them.

**5. Proof**
The UI proves DONNA's reasoning.
- DONNA says "4 players are stalled."
- UI shows the 4 player names, their enrollment dates, and their gate completion progress.
- The director must be able to verify every DONNA claim by looking at the UI.
- If the UI cannot prove a DONNA claim, DONNA should not make it.

---

## The Division in Practice

### Example 1 — Review Queue

| DONNA says | UI shows |
|------------|----------|
| "3 wrap-ups need review before they expire." | List of 3 wrap-up cards with coach name, date, and status |
| "Review Coach Martinez's wrap-up first — it has the highest risk flag." | Approve / Reject / Clarify buttons on each card |
| (After approval) "2 more in queue." | Updated count badge |

**DONNA never shows the wrap-up content.** It only tells the director the priority and next step.

---

### Example 2 — Curriculum Blockers

| DONNA says | UI shows |
|------------|----------|
| "Orange Ball 2 has the most blocked players — 4 stalled for avg 187 days." | Level card with stall count, avg days, gate completion % |
| "The main blocker is cross-court consistency — 3 players failed the same gate." | Gate list with pass/fail counts per player |
| "Consider lowering the threshold or adding a drill before the gate." | [Improve Level →] button → opens curriculum edit flow |

**DONNA does not make the curriculum change.** It recommends. The UI provides the action.

---

### Example 3 — Academy Health

| DONNA says | UI shows |
|------------|----------|
| "Academy health is good but 2 players are on hold — reassessment is overdue." | Health % (87), player count, session count |
| "Completing the reassessments would resolve the hold status for both players." | Player names with "on hold" status badge, link to their profiles |

**DONNA does not show the reassessment form.** It surfaces the signal and points to the UI proof.

---

## Conflict Resolution Rules

When DONNA and the UI disagree about what to show:

1. **DONNA leads with the conclusion.** The UI leads with the evidence.
2. **DONNA uses one surface per page.** If a page needs DONNA, it gets one DONNA card — not multiple.
3. **The UI never writes recommendation text.** Recommendation text like "Review level gates" belongs to DONNA, not to a numbered list of hardcoded next actions.
4. **DONNA never lists everything.** If DONNA is listing 7 things, it is doing the UI's job. Return to the conclusion.
5. **If DONNA cannot explain it, the UI shows the raw data without a DONNA label.** Do not put DONNA's name on data that has no intelligence applied to it.

---

## Prohibited Patterns

These patterns exist in the current codebase and must be eliminated:

| Prohibited Pattern | Why | Replacement |
|-------------------|-----|-------------|
| Multiple DONNA cards on one page | Competing authority surfaces | One DONNA card per page |
| DONNA greeting + DONNA brief on the same page | Duplicate welcome signals | One or the other, not both |
| Hardcoded "Next Recommended Actions" list | DONNA should own recommendations | DONNA brief replaces this |
| KPI tiles listed without DONNA context | Data without intelligence | DONNA brief precedes KPIs |
| AI Suggestions in Alerts section | Conflates urgency with speculation | Separate queue for AI suggestions |
| Fake sparkline data presented as health trend | Trust violation | Remove until real time-series exists |
| Stacked accordion of all collapsed sections | Hides all signal | Intelligence above fold, structure below |

---

## Permitted Patterns

These patterns are consistent with the model:

| Permitted Pattern | Why |
|------------------|-----|
| DONNA brief (2 sentences) → Zone 3 priorities list | DONNA leads, UI proves |
| DONNA recommends level → UI shows level evidence | DONNA concludes, UI evidences |
| DONNA counts pending items → UI lists them on click | DONNA summarizes, UI details |
| UI approval button → audit log → DONNA confirms next step | UI owns approval, DONNA guides flow |
| Health % shown without DONNA text | Simple status — UI owns it |

---

## Trust Rules

DONNA must not exceed its evidence. These boundaries are non-negotiable:

1. **DONNA never claims certainty from incomplete data.** If a signal is ambiguous, DONNA qualifies it: "This may indicate..." or "More data is needed to confirm."

2. **DONNA never implies automatic action.** "I'll adjust the threshold" is never a DONNA statement. DONNA proposes. The director approves.

3. **DONNA never presents fabricated data as intelligence.** Sparklines derived from a single data point are not intelligence — they are decoration. Remove them before they erode trust.

4. **DONNA identifies its sources.** When DONNA says "4 players are stalled," the UI must show those 4 players. If the UI cannot show them, DONNA should not say it.

5. **DONNA's confidence level is honest.** When data is thin, DONNA says so. "Only 2 sessions have been recorded this month — signals may not be representative."
