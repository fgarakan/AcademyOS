# Director Attention Queue

> Sprint 472 — Attention Queue V1
> See also: `src/lib/director/attentionQueue/index.ts`, `docs/DIRECTOR_KPI_DASHBOARD_NOTES.md`

---

## Purpose

The attention queue gives the director a single, prioritised list of everything that needs action right now. It replaces scattered alerts with one ranked feed.

---

## Sources

| Source | Priority rule |
|---|---|
| pending_approval | Based on risk level; bumped if expiring within 24h |
| expiring_action | Elevated when < 24h remain |
| high_alert | Based on severity (critical/high) |
| over_capacity_group | Medium — needs reassignment |
| curriculum_gap | Low — review curriculum coverage |
| no_session_coverage | Medium — groups without sessions this week |

---

## Priority levels

| Level | Meaning |
|---|---|
| critical | Requires action today. Blocks operations or is overdue. |
| high | Action needed this week. High-risk or near-expiry. |
| medium | Review soon. Capacity, coverage, or moderate risk. |
| low | Not urgent but worth monitoring. |

---

## Main functions

- `buildAttentionQueue(input)` — returns `AttentionQueue` with sorted items
- `groupAttentionByPriority(queue)` — groups by priority level
- `getExpiringActions(queue, withinHours)` — expiring actions filter
- `summarizeAttentionQueue(queue)` — one-line DONNA briefing string

---

## Wiring targets

- Director dashboard hero section (top of `/director`)
- DONNA daily briefing `BriefingSection` for approvals and alerts
- Director sidebar pending count badge

---

## Safety notes

- This module is read-only — it surfaces items but never approves or executes them
- All approval mutations go through `approvalActions.ts` → `execute_approved_action()` only
- No parent/player data is returned — only label strings safe for director consumption
