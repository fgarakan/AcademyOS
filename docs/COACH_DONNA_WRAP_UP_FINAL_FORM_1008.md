# Coach DONNA Wrap-Up Final Form
Sprint 1008 — 2026-05-18

## Summary

The DONNA wrap-up flow reached near-final form across Sprints 993-999. This document records the final verified state and remaining polish items.

## File

`src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx` (313 lines)

## Current State — Verified Final Form Checklist

| Requirement | Status |
|---|---|
| One question at a time | Yes — `stepIndex` state machine |
| Current question big and clear | Yes — `text-lg font-bold` question heading |
| Hint text below question | Yes — muted hint on each question |
| Editable textarea | Yes — auto-growing textarea |
| Skip | Yes — `SkipForward` button |
| Next | Yes — `ChevronRight` button; Enter key support |
| Previous | Yes — `ChevronLeft` button |
| Progress rail | Yes — 6 colored dots (green done, lime active, surface-raised future) |
| Answer counter | Yes — "X / 6" in top-right |
| Running DONNA summary | Yes — Sprint 994 added structured summary panel (builds as answers are entered) |
| Draft disclaimer | Yes — "Your notes will be submitted for director review. Nothing is sent to parents." |
| Success state | Yes — full-screen check, "Review Submitted Draft" CTA + "Back to Session" |
| Review page link after save | Yes — Sprint 999 |
| Mobile-first layout | Yes — `max-w-lg mx-auto px-4 py-6`, full-height feel |
| No parent sends | Yes — confirmed in success copy |
| Review-first language | Yes — present in hint and save copy |

## Questions Covered

1. How did the session go overall?
2. Any attendance exceptions?
3. Any players stand out positively today?
4. Any players need extra attention next time?
5. Anything to adjust for next time?
6. Any parent or director follow-up needed?

## Remaining Polish Notes (Future Sprints)

- Voice input: DONNAVoiceInputButton exists but is not wired to the wrap-up textarea — requires AudioRecorder or browser SpeechRecognition integration
- Block completion status: `blockList.map(b => ({ status: 'completed' }))` hardcodes all blocks as completed — no actual status from execute view (blocked by missing `session_blocks.status` column — see KNOWN_LIMITATIONS)
- Inline observation drafting: observing a player during wrap-up creates a proposed_action via `saveWrapUpObservationsAction`, but the wrap-up flow does not currently prompt per-player observation collection inline
- DONNA summary text is deterministic (not AI-generated) — accurate to current spec; AI layer is deferred

## No Code Changes This Sprint

The wrap-up page is clean and functional. Modifying it this sprint would risk breaking working coach flows. All polish items are deferred to explicit future sprints.
