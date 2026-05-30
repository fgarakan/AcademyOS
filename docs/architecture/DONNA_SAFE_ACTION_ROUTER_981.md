# DONNA Safe Action Router V1 — Sprint 981

**Date:** 2026-05-30
**Sprint:** 981
**Status:** Implemented — TypeScript clean

---

## Purpose

Sprint 981 creates the routing layer between orchestrator output and execution. Every action must pass through this router before anything happens in the UI. The router enforces safety boundaries by choosing the correct execution path.

---

## Routing Paths

| Path | When Used | Director Action Required |
|---|---|---|
| `immediate` | Safe outputs — text answers, highlights, navigation suggestions | No |
| `draft` | Outputs that create a draft — director must explicitly save | Yes |
| `review_queue` | Approval-gated actions — director must approve in review queue | Yes |
| `blocked` | Any blocked action or failed tool call | No (just shows message) |

---

## Routing Table (Key Entries)

| Output Type | Safety Level | Path |
|---|---|---|
| `answer` | any | `immediate` |
| `recommend_next_action` | safe / review_only | `immediate` |
| `recommend_next_action` | approval_gated | `draft` |
| `highlight_target` | safe | `immediate` |
| `explain_action` | safe | `immediate` |
| `draft_proposed_action` | safe / review_only | `draft` |
| `draft_proposed_action` | approval_gated | `review_queue` |
| `route_to_review` | safe | `immediate` |
| `ask_clarifying_question` | safe | `immediate` |

---

## Instructions Produced

Each routing decision produces a list of `ActionInstruction` objects:

- `show_text` — display text in DONNA panel
- `set_highlight` — dispatch donna:highlight event
- `suggest_navigation` — show "Go to [route]" link
- `show_draft_card` — show draft for director review/save
- `route_to_review` — direct to /director/review
- `show_blocked_message` — explain why action was blocked

---

## Tool Call Routing

`routeToolResult(result: ToolCallResult)` routes tool results:
- `ok: false` → blocked path
- `ok: true, requiresConfirmation: true` → draft path
- `ok: true, requiresConfirmation: false` → immediate path

---

## No-Mutation / No-Migration Guarantee

- No DB calls in router
- No direct mutations executed by router
- All mutations require director action to proceed
- Blocked actions always return explanatory message — no execution
