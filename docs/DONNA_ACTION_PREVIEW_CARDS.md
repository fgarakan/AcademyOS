# DONNA Action Preview Cards

> Sprint 469 — Action Preview Cards V1
> See also: `src/lib/donna/actionPreview/actionPreviewCards.ts`, `docs/DONNA_ACTION_RELIABILITY_NOTES.md`

---

## Purpose

Every proposed action must be previewed before it enters the approval pipeline. Action preview cards give the director or head coach a clear picture of what will change, who is affected, and what risk level applies.

---

## Preview card fields

| Field | Description |
|---|---|
| actionType | The registered action_type enum value |
| actionLabel | Human-readable label |
| summary | One sentence: what DONNA is proposing |
| donnaReasoning | Why DONNA is making this proposal |
| affectedEntities | Who/what is affected (player, group, coach, etc.) |
| riskLevel | low / medium / high / critical |
| requiresDirectorApproval | true if high or critical risk |
| whatWillChange | Bullet list of what changes |
| whatWillNotChange | Safety reassurances |
| dataSource | Where DONNA's reasoning came from |
| confidence | high / partial / low |
| expiresInHours | Hours before the action auto-expires |

---

## Risk inference

| Action type | Risk level |
|---|---|
| move_player_group, create_placement_assessment | High |
| generate_parent_update, flag_player | High |
| modify_session, modify_template, create_session | Medium |
| schedule_reassessment, assign_group | Medium |
| create_template, create_player, other | Low |

---

## Required invariants

- Every preview card must show `whatWillNotChange` with at least:
  - "No data is deleted."
  - "No communications are sent automatically."
  - "Changes can be reviewed in the audit log."
- Cards must never truncate `affectedEntities` — always show full names.
- High-risk cards must show the `requiresDirectorApproval` indicator prominently.
