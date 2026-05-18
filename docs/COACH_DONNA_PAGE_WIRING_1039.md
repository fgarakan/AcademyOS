# Coach DONNA Page Wiring — Sprint 1039

**Date:** 2026-05-18
**Sprint:** 1039 — Coach DONNA Page Wiring V1

---

## What changed

Created a dedicated Coach DONNA page at `/coach/donna`, wiring the existing Coach DONNA infrastructure into a full-page experience.

### Files created
- `src/app/coach/donna/CoachDonnaShellClient.tsx` — thin client wrapper receiving server-loaded `CoachDonnaContext` and rendering `DonnaVoiceReadyShell` with coach role.
- `src/app/coach/donna/page.tsx` — full coach DONNA page: loads `loadCoachDonnaContext`, 2-column layout (context left, DONNA chat shell right), session brief, today's sessions, recommended actions, quick actions, safety notice.

---

## Coach DONNA page sections

| Section | Source | Behavior |
|---|---|---|
| Session Brief | `CoachDonnaContext` | 4 KPI tiles: today's sessions, wrap-ups due, in review, players |
| Today's Sessions | `ctx.sessionSummaries` | Per-session rows with wrap-up status, links to session pages |
| What To Do Next | `ctx.recommendedActions` | Coach-specific recommended actions (submit wrap-up, run session, capture observation) |
| Quick Actions | Static | 4 quick-access links: Sessions, Players, Capture Note, Review Queue |
| DONNA Chat Shell | `DonnaVoiceReadyShell` | Full interactive chat with coach-scoped suggested questions, voice, boundaries |

---

## Coach DONNA quick actions

- **My Sessions** → `/coach/sessions`
- **My Players** → `/coach/players`
- **Capture Note** → `/coach/recap`
- **Review Queue** → `/director/review` (read-only access for reference)

## Role safety

- Receives `role="coach"`, `donnaRole="coach"` — coach-scoped questions only
- `donnaBoundaryResponses` blocks director-only queries
- No parent data shown
- No DB writes anywhere on this page
- Wrap-up alert links to wrap-up flow, not an auto-submit

## Data behavior

- Live if user authenticated and has `academy_id` + `coach_id`
- Demo fallback if no live session data found
- "Demo mode" label shown clearly in header

## TypeScript

Clean (`npx tsc --noEmit` — no errors).
