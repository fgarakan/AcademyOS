---
name: academy-os-pilot-readiness-guard
description: Guards AcademyOS V1 pilot readiness for the Dabul Tennis Academy (Brian Dabul) deployment. Use before any sprint that touches the demo flow, pilot handoff materials, or core director/coach/parent paths that Brian will use. Prevents demo script misalignment, broken first-run experiences, and premature feature exposure during the pilot.
---

# AcademyOS Pilot Readiness Guard

## Purpose

AcademyOS V1 is being piloted with Brian Dabul at Dabul Tennis Academy. Brian is the first real director user. Every sprint that touches director-facing, coach-facing, or parent-facing flows must be evaluated against one question:

> Would Brian (or his coaches) encounter a broken, confusing, or misleading experience during the pilot?

This skill ensures pilot-bound sprints do not ship with broken demo script steps, disconnected feature paths, or missing "coming soon" transitions for features not yet live.

---

## When to Use

Use this skill before any sprint that:

- Modifies any flow Brian will use during the pilot demo
- Changes the `/director/demo` page or demo sandbox behavior
- Modifies the `/director` dashboard, review queue, or session views
- Adds or changes a coach-facing flow that Brian's coaches will use
- Changes the `/parent` portal or parent update preview
- Modifies the onboarding flow (`/director/onboarding`)
- Adds a new feature that will be shown during the pilot
- Removes or changes a demo script example (voice prompt, session, player name)

---

## Pilot Context

**Academy:** Dabul Tennis Academy
**Director:** Brian Dabul
**Phase:** V1 pilot — single academy, live data after roster import

Brian's expectations for the pilot:

- He can log in as a director and see a real dashboard
- He can run DONNA voice intake for a session and see it structured
- He can review DONNA's proposed actions in the review queue
- He can see his players' development profiles
- He can see Academy Health signals with honest data quality disclosure
- His coaches can log in and complete a session wrap-up
- He can preview what a parent update would look like (draft only, no send)

---

## Live vs. Draft Status for Pilot

| Feature | Pilot Status | What Brian Sees |
|---|---|---|
| Director dashboard | Live | Real layout, demo data until roster imported |
| DONNA voice intake | Live (demo mode) | Demo session, structured by DONNA |
| Review queue | Live | Demo proposed actions, real approval UI |
| Player profiles | Live | Demo players until real roster imported |
| Academy Health | Live (partial data) | Real UI, honest "partial data" disclosure |
| Session wrap-up (coach) | Live (demo mode) | Demo session, real wrap-up flow |
| Parent update preview | Draft — no send | "Draft only" label, no send button active |
| Curriculum builder | Live (guided mode) | DONNA-led welcome, no blank workspace |
| Parent portal | Live (read-only) | Demo data, correct layout |
| Player portal | Live (read-only) | Demo data, correct layout |
| Platform owner portal | Not in pilot | Brian does not have platform_roles access |
| Billing / court CRM | Not built | No mention in pilot UI |
| Automated level movement | Not built | "Coming soon" or not shown |
| Parent email send | Not built | "Draft only" — no send infrastructure |

---

## Demo Script Alignment Check

Before any sprint that touches the demo flow, verify alignment with:

- `docs/BRIAN_VOICE_DEMO_SCRIPT.md` — the voice intake demo Brian will run
- `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` — the interactive walkthrough script (if it exists)
- `docs/BRIAN_PILOT_HANDOFF_NOTES_638.md` — pilot handoff notes and expectations (if it exists)

Verify:

1. The voice prompt in `VoiceCoachRecapInput.tsx` matches the demo script example
2. The curriculum voice override prompt in `VoiceOverrideInputPanel.tsx` matches the demo script
3. The demo player names in `demoSandboxActions.ts` or the demo page match the script
4. The "Open Demo Session" flow in `/director/demo` still works end-to-end
5. The demo sandbox reset still works without affecting real data

---

## First-Run Experience Rules

When Brian logs in for the first time with real data:

- The dashboard must show meaningful content, not a blank state with "No data yet"
- If real data is absent, show the onboarding checklist or a DONNA welcome, not empty components
- The director sidebar must show all sections — no broken links to non-existent routes
- DONNA's first prompt should orient Brian: "Here's what we know so far. What would you like to focus on?"
- All loading states must resolve within 3 seconds on a standard connection

---

## Pre-Sprint Checklist

1. Does the sprint change any UI element Brian will interact with during the pilot?
2. If yes, does the change align with the demo script steps in `BRIAN_VOICE_DEMO_SCRIPT.md`?
3. Does the sprint add a "coming soon" feature that might confuse Brian during the demo?
4. Does the first-run director experience still load meaningful content (not blank)?
5. Does the demo sandbox still reset cleanly without affecting real academy data?
6. Is every "not yet built" feature either hidden or clearly labeled "Coming soon"?
7. Does the coach wrap-up flow work end-to-end without real Supabase data (demo mode)?
8. Does the parent portal show the correct "Draft only — no send" messaging?

---

## Hard Stop Conditions

Stop and ask before proceeding if a sprint would:

- Break any step in the Brian demo script (voice intake → structure → review)
- Remove a "coming soon" label from a feature that is not yet built
- Show Brian a broken route or 404 during a normal demo walkthrough
- Allow the demo sandbox to write to real academy data
- Show an active send button for parent communications (no send infrastructure exists)
- Show an "Apply" button for level movement that triggers without `finalize_player_placement()`
- Remove the "Demo Mode" banner from the demo sandbox view
- Add a new feature during the pilot without clearly marking it as beta or coming soon

---

## AcademyOS-Specific Rules

- `src/app/director/demo/page.tsx` is the pilot demo entry point — changes here affect Brian's first impression.
- `demoSandboxActions.ts` controls all demo data operations — never let it touch real `academy_id` records.
- `BRIAN_VOICE_DEMO_SCRIPT.md` is the source of truth for demo voice prompts — match exactly.
- The `VoiceCoachRecapInput.tsx` example prompt must match the script (currently: "Everyone was here except Sarah. Mia improved recovery after wide balls. Leo still needs better contact spacing.").
- The `VoiceOverrideInputPanel.tsx` curriculum prompt must match the script.
- During the pilot, `assertNotPreviewMode()` still applies — demo actions are sandbox-scoped, not preview-mode-scoped.

---

## Commit Rule

```bash
git commit -m "Sprint XXX — Sprint Name"
```

Single line only. No `Co-Authored-By`. No AI attribution.

---

## Required Output Format

```
## Pilot Readiness Guard Report — Sprint XXX

**Demo script alignment:** [all steps intact / flag: which step breaks]
**First-run experience:** [meaningful content on load / flag: what shows blank]
**Coming soon labeling:** [all unbuilt features labeled / flag: what is exposed]
**Demo sandbox isolation:** [no real data writes / flag: what crosses]
**Parent send block:** [draft-only confirmed / flag: what shows send button]
**Level movement block:** [finalize_player_placement() required / flag: what bypasses]
**Pilot-visible routes:** [all working / flag: what 404s]

**Hard stops triggered:** [none / list]

**Verdict:** CLEAR / HOLD — [reason if hold]
```
