# Pilot Feedback and Friction Log

**Academy:** Dabul Tennis Academy
**Director:** Brian Dabul
**Pilot period:** TBD (first live session)
**Document owner:** Brian Dabul + dev team

---

## How to report friction

### Option A — In-app (when Report Friction button is live)

Tap "Report Friction" → select type → set severity → add comment → submit.

### Option B — WhatsApp / direct message to dev team

Include: what you tried to do, what happened, which page, how bad (Blocker / High / Medium / Low), screenshot if possible.

### Option C — DONNA command

Say or type: "Report friction — [describe the issue]". DONNA will route it.

---

## Friction type definitions

| Type | When to use |
|---|---|
| `unclear_next_step` | Interface is confusing — not sure what to do |
| `too_many_clicks` | Too many steps to complete a simple action |
| `confusing_label` | Text or label doesn't make sense |
| `wrong_data` | Data shown doesn't match what was entered |
| `missing_action` | Something you need to do isn't available |
| `donna_misunderstood` | DONNA gave a wrong or irrelevant response |
| `permission_blocked_unexpectedly` | Blocked from something you should be able to do |
| `parent_player_language_unclear` | Content in parent/player portal is confusing |
| `mobile_issue` | Layout broken or tap targets too small on mobile |
| `other` | Anything else |

---

## Severity guide

| Severity | Example |
|---|---|
| Blocker | Can't log in; can't save session; app crashes |
| High | Core task completed but seriously annoying; had to reload |
| Medium | Task done but felt wrong; confusing label |
| Low | Minor polish issue; typo |

---

## Active friction log

| # | Date | Reporter | Role | Page | Type | Severity | Description | Status |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

---

## Expected V1 friction categories

Based on the current build, the following issues are most likely during the first pilot:

1. **Empty states** — New academy has no data. Some sections may feel abrupt.
2. **Mobile layout on wrap-up** — Coach session wrap-up not tested on all screen sizes.
3. **Voice transcription quality** — Tennis court ambient noise affects accuracy.
4. **DONNA latency** — Live DB queries can feel slow on first load.
5. **Review queue volume** — Multiple simultaneous coach submissions may feel overwhelming without prioritisation UI.
6. **First-login role routing** — New user must have `academy_memberships` before first login.

---

## Post-pilot retro template

**Date:** ___
**Facilitator:** ___
**Participants:** ___

### What worked well

1.
2.
3.

### What caused friction

**Blockers resolved during pilot:**

**High severity for backlog:**

**Medium/Low for later:**

### Unexpected gaps (things users wanted that the system doesn't support)

1.
2.
3.

### Confidence score (1–10)

Would Brian continue using AcademyOS without a developer present? Score: ___

If < 8, top 3 things to fix before leaving Brian alone:
1.
2.
3.

### Brian's quote

> "..."

---

## Pilot logistics

| Item | Detail |
|---|---|
| Date | TBD |
| Participants | Brian (director), 1 coach, 2 parents, 2 players |
| Session length | 2–3 hours |
| Devices | Mac/iPad (Brian), iPhone (coach/parents/players) |
| Network | Academy WiFi — test before session |
| Dev team present | Yes for first session |
| Debrief | 30-min retro immediately after |
| Support contact | farshadgarakani@proton.me |
