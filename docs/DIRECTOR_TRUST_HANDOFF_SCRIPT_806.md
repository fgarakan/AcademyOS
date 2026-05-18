# Sprint 806 — Director Trust Handoff Script V1

**Date:** 2026-05-18
**Sprint:** 806

---

## Purpose

This script is for onboarding a new director to AcademyOS V1. It covers what the system knows, what it doesn't know, where DONNA can be trusted, and where human judgement must override.

Estimated time: 15–20 minutes with a live walkthrough.

---

## Part 1 — What AcademyOS knows about your players (5 min)

> "AcademyOS knows what you've put into it — no more. It reads your curriculum levels, your session records, your coach notes, and your assessment results. If a coach hasn't logged a session, AcademyOS doesn't know it happened."

Walk through:
- Player profile → Sessions tab (shows what's been recorded)
- Player profile → Assessments tab (shows gate results, not predictions)
- DONNA status disclosure rows (orange = limited data, red = blocked)

Key trust rule:
> "When DONNA says something about a player, she's drawing from your recorded data. She'll tell you when the data is thin. Believe her when she says 'I don't have enough to say.'"

---

## Part 2 — What DONNA can propose (5 min)

> "DONNA can draft things for you. She can help you structure a coach's voice note into a session record. She can draft a curriculum change. She can flag a player who might be ready to advance. She cannot do any of those things on her own."

Walk through:
- Review Queue: show a pending item
- Approve an item → watch it execute
- Reject an item → watch it disappear

Key trust rule:
> "Nothing DONNA proposes changes anything until you approve it. That is not a feature you can turn off — it is how the system works."

---

## Part 3 — What requires your judgement (5 min)

List of decisions that always require the director:
1. Activating a new player (placement)
2. Promoting a player to the next level
3. Approving curriculum changes
4. Overriding a coach note
5. Deciding whether a coach recommendation is appropriate for a specific player

> "DONNA can surface patterns and suggest directions. She does not know your players the way you do. Use her as a first pass — not a final answer."

---

## Part 4 — How to handle a mistake (5 min)

If a wrong item was approved:
- It cannot be un-applied automatically
- Go to `audit_logs` (via admin tools) to find what changed
- Use the curriculum builder or coach tools to create a corrective action via Review Queue
- Contact support@academyos.com for data corrections that require DB access

> "The system is designed so that mistakes are recoverable. Nothing is catastrophic. But it's always better to review carefully before approving."

---

## Handoff confirmation

Director should be able to confirm:
- [ ] They can navigate to the player profile and understand what each tab shows
- [ ] They know how to access the Review Queue and approve/reject an item
- [ ] They understand that DONNA proposes, they approve
- [ ] They know which decisions are always theirs (placement, promotion)
- [ ] They know what to do if something looks wrong
