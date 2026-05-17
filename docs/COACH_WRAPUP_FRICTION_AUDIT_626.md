# Coach Wrap-Up Friction Audit V1

**Sprint:** 626
**Date:** 2026-05-17
**Scope:** Sprints 540–545 wrap-up conversation system + supporting components

---

## 1. Current wrap-up flow

The coach wrap-up is a guided 7-question conversational session run by DONNA after each session. The questions are:

| # | ID | Question | Skip allowed |
|---|---|---|---|
| 1 | q1_attendance | Who was here today? | Yes |
| 2 | q2_session_actual | Did the session go as planned? | Yes |
| 3 | q3_standouts | Any players who stood out? | Yes |
| 4 | q4_needs_attention | Anyone who needs attention? | Yes |
| 5 | q5_follow_up | Any follow-up for next session? | Yes |
| 6 | q6_parent_flag | Anything a parent should know? | Yes |
| 7 | q7_coach_note | Any notes just for you? | Yes |

Source: `src/lib/donna/wrapUpConversationScript.ts`

---

## 2. Friction points

### 2.1 Entry friction

| Friction | Severity | Notes |
|---|---|---|
| No "start wrap-up" shortcut on coach home | Medium | Coach must navigate to the session, then find the wrap-up trigger |
| No time-of-day reminder or nudge | Low | Coaches may forget to run wrap-up immediately post-session |
| Voice unavailable on some browsers | Medium | Safari/iOS Web Speech API is inconsistent; fallback to text input exists but isn't prominent |

### 2.2 Per-question friction

| Question | Friction | Severity |
|---|---|---|
| q1_attendance | Requires coach to recall all players by name | Medium — roster not surfaced as aid |
| q2_session_actual | Open-ended; coaches don't know what level of detail is needed | Medium |
| q3_standouts | "Any" framing allows easy skip without meaningful data | Low |
| q4_needs_attention | Emotionally sensitive — coaches may soften or omit | Medium |
| q5_follow_up | Duplicates what coaches already wrote in session plan | Low |
| q6_parent_flag | Unclear what "parent should know" threshold is | Medium |
| q7_coach_note | Internal note feels low-priority — often skipped | Low |

### 2.3 Cognitive load contributors

1. **7 questions is long** — post-session energy is low; coaches are often heading to the next session.
2. **Clarifying questions add turns** — when DONNA asks a follow-up, total turn count can reach 10–14.
3. **No progress indicator on mobile** — coaches don't know how much is left.
4. **Skip confirmation** — there is no "skip the rest" shortcut; coaches must skip one question at a time.
5. **No memory of typical coach answers** — DONNA asks the same clarifiers every time, even if a coach always gives full answers.

### 2.4 Post-wrap-up friction

| Friction | Severity |
|---|---|
| No confirmation that wrap-up was submitted | Medium |
| Coach cannot review or edit their answers after submission | Medium |
| Wrap-up draft goes straight to review queue with no coach-visible status | Low |
| Coach has no visibility into whether their wrap-up triggered any director review | Low |

---

## 3. Estimated completion time

| Path | Estimated time |
|---|---|
| Full 7-question voice wrap-up, no clarifiers | 3–5 minutes |
| Full 7-question with 2–3 clarifiers | 5–8 minutes |
| Text-only wrap-up, all questions answered | 6–10 minutes |
| Skip-heavy wrap-up (3+ skips) | 1–2 minutes |

Target: wrap-up should complete in under 4 minutes for a typical session.

---

## 4. Recommendations

### Priority 1 — Fast path
- Add a "Quick wrap-up" mode: attendance + standouts + one flag = 3 questions max.
- Surface the roster list at q1_attendance so coaches can tap names rather than recall.

### Priority 2 — Progress visibility
- Add a question progress indicator to the mobile wrap-up shell (e.g., "3 of 7").
- Add a "Skip remaining" button after question 3.

### Priority 3 — Post-wrap-up confirmation
- Show a submitted confirmation screen with a summary of what DONNA captured.
- Add a "Review my answers" step before final submission.

### Priority 4 — Smart skip
- Track coach completion patterns. If a coach consistently answers all 7 questions, remove clarifiers on familiar patterns.
- If a coach consistently skips q7_coach_note, stop asking it.

### Priority 5 — Timing
- Surface wrap-up CTA on coach home immediately after a session end time.
- Add a reminder badge after 30 minutes if wrap-up is not completed.

---

## 5. What is working well

- DONNA's conversational tone is low-pressure and feels like a debrief.
- Skip-all-questions is technically possible (every question is skippable).
- Text fallback is available when voice fails.
- DONNA's acknowledgement responses (`answered` / `skipped`) feel natural and non-judgmental.
- Clarifying questions are contextual and not generic.

---

## 6. Protected invariants — do not change

These invariants must be maintained regardless of polish changes:

- All wrap-up answers go through `proposed_actions` as `pending_review` — never auto-applied.
- Wrap-up data never mutates `template_blocks` (uses `curriculum_overrides` for overrides).
- Parent-flagged content requires separate director approval before any parent visibility.
- Attendance exceptions from wrap-up require attendance exception approval flow — not auto-applied.
- `execute_approved_action()` is the only function that applies wrap-up outputs.

---

## 7. Verdict

**Overall friction rating: MEDIUM**

The wrap-up system is functional and safe but has noticeable friction at entry, mid-session, and post-wrap-up stages. The highest ROI improvements are: (1) a quick-path shortcut, (2) progress visibility, and (3) a post-submission confirmation screen. None of these require schema changes.
