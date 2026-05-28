# DONNA Operating Intelligence — 10/10 Answer Standard
**Date:** 2026-05-28
**Sprint:** 913.1

---

## The Standard

A **10/10 operating intelligence answer** from DONNA includes all of:

1. **What matters** — the specific signal, count, or condition
2. **Why it matters** — the downstream consequence if not addressed
3. **Evidence/source** — where the data came from (live vs. demo)
4. **Best next action** — a single concrete step the director can take
5. **What requires approval** — nothing changes without director action
6. **What DONNA will not do automatically** — explicit safety declaration
7. **Honest limitation** — if data is missing, say so clearly

---

## Example: 10/10 Priority Answer

> "Here's what needs attention first: 2 attendance exceptions (3 days old) and 1 high-risk player note. Start with the attendance exceptions — they affect parent-facing records and the oldest is already 3 days old. Then review the player note because it may affect coaching priorities and level readiness. You also have 2 curriculum drafts waiting in the Curriculum Builder — those are lower risk unless they affect current sessions. Nothing changes until you approve it in the Review Center."

**Checklist:**
- ✅ What matters: 2 attendance exceptions, 1 high-risk note, 2 curriculum drafts
- ✅ Why it matters: parent records, coaching priorities, session impact
- ✅ Evidence: "3 days old" (staleness signal)
- ✅ Best next action: attendance exceptions first
- ✅ Requires approval: "until you approve it in the Review Center"
- ✅ DONNA won't act: implied by "until you approve"
- ✅ No fake data: all figures from live directorCtx

---

## Current Rating by Category (Post 913.1)

| Category | Score | Notes |
|---|---|---|
| What matters | 8/10 | All major signals present; curriculum drafts now included |
| Why it matters | 7/10 | Risk context given; per-item reasoning deferred |
| Evidence/source | 9/10 | `ctx.isLive` labeling, `[Demo]` prefix, source notes |
| Best next action | 8/10 | Priority ordering and nav offers in place |
| Requires approval | 10/10 | Every mutation answer states approval required |
| DONNA won't act | 10/10 | Explicit safety declarations in all answer engines |
| Honest limitation | 9/10 | Null/fallback handling throughout; approximate flags documented |

**Overall operating intelligence: 8.5/10** (up from 7.5/10 pre-913.1)

---

## Gap to 10/10

| Gap | Needed for 10/10 | Sprint |
|---|---|---|
| Per-item reasoning ("this attendance exception is about player X") | Requires item-level query | 913.x |
| Formal onboarding step completion flags | `academy.settings` read | 913.x |
| Real-time context refresh (directorCtx becomes stale after page load) | Client-side refresh or SSE | Post-pilot |
| Coach-level attribution ("Coach Maria has 2 missing wrap-ups") | Join query | 913.x |
| Cross-domain cause-and-effect ("this absence may explain the concern flag") | Logic chain across signals | 913.x |
