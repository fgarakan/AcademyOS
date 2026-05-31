# Coach Wrap-Up Low-Friction UX — Sprint 1046

**Sprint:** 1046 — Coach Wrap-Up Low-Friction UX V1
**Date:** 2026-05-31
**File changed:** `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx`

---

## Changes (saved state only)

### Removed: Duplicate safety notice (ShieldCheck box)

After submitting wrap-up, the saved state showed:

Main text: "Your wrap-up draft is in the director review queue. Nothing has been sent to parents or applied to player profiles."

And also, immediately below, a ShieldCheck bordered box: "The director will review and approve before any information reaches parents or becomes part of the official player record."

These say the same thing. The ShieldCheck box was removed — the main text is sufficient.

### Removed: "Ask DONNA" link

The saved state had a third DONNA entry: "Ask DONNA" → `/coach/donna`. Coaches already have the floating DONNA button (always visible) and the bottom tab bar "DONNA" entry. The extra link in the success state added cognitive load to what should be a clean "done" moment. Removed.

### Removed: unused `ShieldCheck` import

`ShieldCheck` was only used by the removed box.

---

## What was preserved

- 6-question step flow (overall, attendance, standouts, attention, adjust, followup)
- Voice input (AudioRecorderButton + VoiceInputButton)
- Player name quick-chips
- Save wrap-up action (`saveWrapUpDraftAction`)
- "Wrap-up submitted for review" heading and main text
- "Review Submitted Draft" primary CTA → `/coach/sessions/[id]/wrap-up/review`
- "Back to Session" secondary CTA
- Optional player observation drafts (post-save)
- All DONNA question prompts and Sparkles icons in the question flow
