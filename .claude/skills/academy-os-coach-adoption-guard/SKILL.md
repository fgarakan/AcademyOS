---
name: academy-os-coach-adoption-guard
description: Guards coach-facing UX in AcademyOS against friction, cognitive load, and admin-style patterns. Use before any sprint that adds or modifies coach session flows, wrap-up flows, voice input, or player observation entry. Prevents coaches from abandoning the tool because it takes too long or feels like filing paperwork.
---

# AcademyOS Coach Adoption Guard

## Purpose

The coach is AcademyOS's most critical adopter. If coaches don't use the session capture flow, there is no data for DONNA to structure, no signals for the director, and no player development record.

Coach adoption lives or dies on one question:

> Can a tired coach use this after class, on a phone, with one thumb, in under 90 seconds?

This skill ensures coach-facing features answer "yes."

---

## When to Use

Use this skill before any sprint that:

- Adds or modifies the session page (`/coach/sessions/[sessionId]`)
- Adds or modifies the wrap-up flow (`CoachWrapUpDrawer`)
- Adds voice input to a coach flow
- Adds or changes the player observation entry UI
- Adds a new step to the coach wrap-up sequence
- Changes the coach bottom tab bar navigation
- Adds coach-facing DONNA interactions
- Changes how session context or player cards are displayed to a coach

---

## The 90-Second Test

Every coach flow must pass this test before shipping:

1. Coach opens the session page — sees session plan and player list in under 3 seconds
2. Coach taps "Wrap Up" — opens immediately, no loading screen
3. Coach records or types session notes — one text field, no required structure
4. Coach answers DONNA's follow-up questions — 7 questions maximum, chip-selection preferred
5. Coach submits — "Done. DONNA structured your notes." confirmation visible in 2 seconds
6. Total time from "Wrap Up" tap to confirmation: under 90 seconds on a phone with one thumb

If any step takes longer, requires form fields, or requires the coach to think like an admin, fix it before adding features.

---

## Coach UX Principles

### Session page

- Shows session plan first (what we planned)
- Shows player list with recent context (not a generic roster)
- One primary action: "Start Session" or "Wrap Up"
- No admin navigation visible
- Loads in under 2 seconds on mobile

### Wrap-up flow

- Opens as a bottom sheet / drawer (does not navigate away from session)
- First field: free-form text or voice — no required structure
- DONNA's follow-up chips use plain language, not system language
- Maximum 7 follow-up questions — stop before the coach feels interrogated
- Chips are mobile-safe (tap targets ≥ 44px)
- Never requires typing a player's name — always uses tap-to-select

### Voice input

- `VoiceInputButton` renders a text fallback for unsupported browsers
- "You can type instead" is visible and immediately actionable
- Voice recording starts immediately on tap — no confirmation dialog
- Recording stops when the coach taps again or after silence timeout
- Transcription result appears in the text field for review before submission

### Player observations

- Show player name and level — never ID or UUID
- Strength / area-to-improve chips pre-populated from previous sessions
- Coach can add free text or skip — never required
- Observation saves without navigating away from the session

---

## Adoption Killer Anti-Patterns

| Anti-Pattern | Why It Kills Adoption | Fix |
|---|---|---|
| Required form fields | Coach skips if they can't fill it in | Make all fields optional; structure comes from DONNA |
| Multiple navigation steps to wrap up | Too many taps at end of class | Keep wrap-up in a drawer on the session page |
| Long loading screen on session open | Coach gives up | Pre-fetch session data; show skeleton immediately |
| Typing player names | Slow, error-prone, bad on mobile | Always tap-to-select from roster |
| > 7 wrap-up questions | Feels like paperwork | Cap at 7; use chips not text fields |
| No voice fallback | Coach loses trust if mic fails | Always render text input alongside voice |
| Admin-style sidebar visible | Wrong mental model | Coach portal uses bottom tab bar only |
| "Save draft" without confirmation | Coach doesn't know if it worked | Always show "Done. DONNA structured your notes." |
| Wrap-up navigates to new page | Coach can't get back to session | Wrap-up is always a drawer/sheet |

---

## `CoachWrapUpDrawer` Rules

The wrap-up drawer is the highest-usage coach component. Protect it:

- Maximum 7 DONNA follow-up questions per session type
- All question answers use chips (tap) not text input unless unavoidable
- The drawer closes cleanly and returns to the session page
- Submit creates a `proposed_action` — never writes directly to session data
- Confirmation message is shown before the drawer closes
- No loading indicator that blocks the close action

---

## Pre-Sprint Checklist

1. Can a coach complete the new flow in under 90 seconds on a phone with one thumb?
2. Are all form fields optional (structured by DONNA, not required from coach)?
3. Does the new flow require more than 7 steps or 7 questions?
4. Does any new step require the coach to type a player name?
5. Is voice input accompanied by a text fallback?
6. Does the wrap-up drawer stay as a drawer (not navigate away)?
7. Does the session page show plan and player list first, before any action?
8. Is the confirmation message visible within 2 seconds of submission?

---

## Hard Stop Conditions

Stop and ask before proceeding if a sprint would:

- Add a required form field to the coach wrap-up flow
- Add more than 7 steps or questions to any coach interaction
- Remove the voice text fallback from any voice input component
- Change the wrap-up drawer into a separate page navigation
- Add an admin-style sidebar or panel to the coach portal
- Show a UUID or database ID to the coach in any UI element
- Add a coach flow that requires more than one navigation step to reach from the session page
- Remove chip-select in favor of mandatory text input for player observations

---

## AcademyOS-Specific Rules

- Coach portal uses `BottomTabBar` + `max-w-2xl mx-auto p-4` layout — never add a sidebar.
- `CoachWrapUpDrawer` is the canonical wrap-up component — do not add a second wrap-up entry point.
- All coach mutations go through `proposed_actions` — coaches do not have direct write access to session records.
- `SpeechRecognition` availability is detected at mount via `useEffect` — never render voice-only UI on SSR.
- `VoiceInputButton` component handles the voice/text fallback pattern — use it, do not recreate it.
- Coach DONNA is scoped to session + player context only — never expose academy-wide KPIs to the coach.

---

## Commit Rule

```bash
git commit -m "Sprint XXX — Sprint Name"
```

Single line only. No `Co-Authored-By`. No AI attribution.

---

## Required Output Format

```
## Coach Adoption Guard Report — Sprint XXX

**90-second test:** [pass / flag: which step takes too long]
**Required fields:** [none / flag: which fields are required]
**Question count:** [≤7 / flag: how many]
**Player name typing:** [none required / flag: where coach must type names]
**Voice fallback:** [present / flag: where text fallback is missing]
**Wrap-up drawer:** [stays as drawer / flag: what navigates away]
**Session page first load:** [plan + player list first / flag: what blocks load]
**Confirmation feedback:** [visible within 2s / flag: what is missing]

**Hard stops triggered:** [none / list]

**Verdict:** CLEAR / HOLD — [reason if hold]
```
