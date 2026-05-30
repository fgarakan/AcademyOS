# DONNA Session Creation From Template — Sprint 974

**Date:** 2026-05-30
**Sprint:** 974
**Status:** Implemented — TypeScript clean

---

## Summary

Sprint 974 confirms that session creation from a class template is already fully built and wires DONNA highlighting to make the "Generate Session" button easily discoverable.

---

## Existing Architecture (Pre-974)

The session creation workflow was built in an earlier sprint:

**`src/app/director/class-templates/[templateId]/GenerateSessionFromTemplateButton.tsx`**
- Director expands the panel via "Generate Session" trigger button
- Director fills in: session name, date, time (optional), coach assignment (dropdown), notes, optional gate focus
- Clicking "Generate" calls `generateSessionFromTemplateAction` → creates session in DB
- After creation: shows success with link to the new session
- Safety: master template is never modified; session is created as a new independent record
- Coach sees the session appear in their assigned sessions

**`ClassTemplateBuilderStepper.tsx` (line 861)**
- The Generate Session button is wrapped in `data-donna-focus-id="template-generate-session"`
- Allows DONNA to highlight the button directly

**Sprint 972 guidance text (in `classTemplateGuidance.ts`)**
- `create_session_from_template` intent already explains the safe workflow

---

## What Sprint 974 Added

### `donnaPageChipRegistry.ts`

Added `tpl-generate-session` chip to the template detail chip set:
```
id: 'tpl-generate-session'
label: "Highlight 'Generate Session'"
actionType: 'highlight'
targetId: 'template-generate-session'
```

DONNA can now point the director directly to the Generate Session button via the chip or via the "create session from template" prompt handler.

---

## Session Creation Fields

| Field | Required | Notes |
|---|---|---|
| Session name | Yes | Pre-filled from template name |
| Scheduled date | Yes | Calendar picker, defaults to today |
| Scheduled time | No | Optional HH:MM |
| Coach assignment | Yes | Dropdown — directors assign at creation time |
| Session notes | No | Optional director notes |
| Gate focus | No | Optional gate selection from curriculum |

---

## Safety Guarantees

- Master template is never modified when a session is generated
- Session is created as a planned session — coach must act to start it
- Coach sees the session in their assigned sessions list
- No player records changed by session creation
- No parent communications triggered by session creation

---

## Template Detail Chip Set (Post-974)

| ID | Label | Action |
|---|---|---|
| `tpl-primary` | Highlight primary action | highlight |
| `tpl-blocks` | Highlight block list | highlight |
| `tpl-draft` | Highlight review draft | highlight |
| `tpl-next` | What should I do next? | prompt |
| `tpl-explain` | Explain this template | prompt |
| `tpl-session` | Create session from template | prompt |
| `tpl-blocks-explain` | Explain block structure | prompt |
| `tpl-generate-session` | Highlight 'Generate Session' | highlight (new) |

---

## V2 Improvements

- Allow director to assign session to a specific group/player group (currently uses template default group)
- Add DONNA pre-flight check: confirm template has blocks and curriculum level before generating
- Wire session generation to proposed_actions pipeline for multi-session batch generation
