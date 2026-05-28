# NO DRIFT RULES
**These rules prevent architectural drift. Enforce in every Claude session.**

---

## What drift looks like

Drift happens when:
- A shortcut is taken "just this once"
- A voice command directly updates a record without approval
- A template change affects running sessions
- An AI recommendation executes without human review
- A table is added without RLS
- A screen is built without checking the Manus UI reference

Drift accumulates. By V2, the system is unmaintainable.

---

## RED LINES (never cross)

| Rule | Why |
|---|---|
| Voice never directly mutates core data | Safety, auditability, human trust |
| All proposed_actions require approval before execution | Human remains in control |
| template_blocks and session_blocks are separate | One-off session changes must not corrupt templates |
| All tables have RLS | Multi-role security is non-negotiable |
| All major actions write audit_logs | Directors must be able to explain every change |
| `finalize_player_placement()` is the only way to activate a player | Prevents partial placement states |
| `execute_approved_action()` is the only function that executes approved actions | Single execution path, fully auditable |

---

## Yellow lines (require justification to cross)

| Rule | Allowed to cross if... |
|---|---|
| Match Manus UI reference | Clear UX improvement documented with reason |
| Desktop split-pane layouts | Screen is mobile — use separate mobile flow |
| Ask for clarification in voice commands | Intent is unambiguous AND confidence ≥ 0.90 |
| Defer V2/V3 features | Confirmed by academy director / product owner |

---

## Drift detection questions (ask Claude before any session)

1. Does this feature require voice input to skip the proposed_actions pipeline?
2. Does this change to a session block affect the parent template?
3. Is there a table being created without RLS and academy_id?
4. Is AI being allowed to execute without human review?
5. Is this a V2/V3 feature being pulled into V1?

If yes to any of these → stop and discuss before building.
