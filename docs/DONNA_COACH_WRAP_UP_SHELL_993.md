# DONNA Coach Wrap-Up Shell — Dedicated Route
Sprint 993 — 2026-05-18

## Overview

Created a dedicated mobile-first wrap-up route at `/coach/sessions/[sessionId]/wrap-up`. This is a full-page experience separate from the `CoachWrapUpDrawer` (which remains as a drawer within the session detail page). The dedicated route is more mobile-friendly and provides a focused, distraction-free wrap-up flow.

## Files Created

| File | Purpose |
|---|---|
| `src/app/coach/sessions/[sessionId]/wrap-up/page.tsx` | Server Component — fetches session + blocks; renders WrapUpPageClient |
| `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx` | Client Component — 6-question DONNA-led wrap-up flow |

## Files Modified

| File | Change |
|---|---|
| `src/app/coach/sessions/[sessionId]/page.tsx` | Added "Start Wrap-Up →" lime CTA link to the dedicated wrap-up route |

## Wrap-Up Flow

6 questions, one at a time:
1. How did the session go overall?
2. Any attendance exceptions?
3. Any players stand out positively today?
4. Any players need extra attention next time?
5. Anything to adjust for next time?
6. Any parent or director follow-up needed?

## UX Features

- Question number / total shown top-right
- Progress rail at top (tap to jump to question)
- DONNA chip intro: "Let's wrap this up quickly..."
- Large textarea (4 rows) for each answer
- Skip button available on all but last question
- Answer summary chips show which questions are answered
- Final step: "Save Wrap-Up" — calls existing `saveWrapUpDraftAction`
- Success state: green check, confirmation copy, "Back to Session" CTA

## Backend

Uses existing `saveWrapUpDraftAction` which writes to `voice_commands` + `proposed_actions` with `status='pending_review'`. No new server actions created.

## Safety

- No auto-approval. All drafts land as pending_review.
- No parent sends. No official updates.
- `academyId` resolved from session server-side.
- Schema error or auth failure → page renders gracefully (notFound for auth, action returns error for save).

## DONNA Copy Principles

- "Let's wrap this up quickly" — establishes low cognitive load framing
- "I'll turn your answers into drafts for review" — sets clear expectation
- "Nothing has been sent to parents or applied to player profiles yet" — on success screen

## Known Limitations

- Block completion defaults to 'completed' for all blocks — coach cannot mark individual blocks as skipped/modified in this route (the full `CoachWrapUpDrawer` on the session page handles block-level completion).
- Observation drafts (per-player positive/needs-attention) are not created from this route — those come from the drawer's player note flow. This route focuses on the overall session recap.
