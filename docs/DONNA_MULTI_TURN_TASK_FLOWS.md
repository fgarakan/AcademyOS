# DONNA Multi-Turn Task Flows

> Sprint 467 — Multi-Turn Task Flow V1
> See also: `src/lib/donna/taskFlows/index.ts`, `src/lib/donna/donnaMultiStepFlow.ts`

---

## Task flows

| ID | Label | Roles | Turns | Requires Approval |
|---|---|---|---|---|
| create_group | Create a training group | Director | 4 | Yes |
| build_session_template | Build a session template | Director, Head Coach | 5 | Yes |
| find_players_needing_reset | Find players needing reset | All staff | 2 | No |
| draft_parent_updates | Draft parent updates | Director, Head Coach | 3 | Yes |
| add_curriculum_idea | Add a curriculum idea | All staff | 3 | Yes |
| create_badge | Create a badge from a requirement | Director | 4 | Yes |
| create_mission | Create a mission | Director, Head Coach | 4 | Yes |
| schedule_session | Schedule a session | Director, Head Coach | 4 | Yes |
| review_player_progress | Review player progress | All staff | 2 | No |
| generate_priorities | Generate player priorities | Director, Head Coach | 3 | Yes |

---

## Flow rules

- DONNA asks one follow-up per turn, not a list.
- Optional steps can be skipped with "skip" or "not sure."
- All flows that require approval create a `proposed_action` with status=pending_review.
- DONNA must show a preview card before submitting any approval-required flow.
- Safe-read flows (no approval) return a formatted data summary only.

---

## Flow state machine (existing)

See `src/lib/donna/donnaMultiStepFlow.ts`:

```
idle → input → classifying → clarifying → previewing → confirming → submitting → complete
```

Each step transition is logged to `donnaSessionMemory.ts`.

---

## Voice behavior

Voice inputs use the same flow as text inputs. DONNA:
1. Transcribes the voice
2. Classifies the intent
3. Runs the task flow from `classifying` state

All voice flows go through the same proposed_actions pipeline.
