# Sprint 804 — Post-V1 Backlog Priority V1

**Date:** 2026-05-18
**Sprint:** 804

---

## Post-V1 priority backlog

Ordered by safety risk × director value. Items in Tier 1 are the minimum to take the platform from a strong pilot to a fully operational product.

---

### Tier 1 — Must have for full operation

| Item | Why it matters | Safety notes |
|------|---------------|-------------|
| Wire DONNA curriculum drafts to `proposed_actions` | Directors need to actually queue curriculum changes — UI shell is not enough for real use | Must use `assertNotPreviewMode()`; must not auto-approve |
| Live `CurriculumChangeQueue` DB query | The queue UI exists but has no data | Read-only query is safe; no write risk |
| Curriculum-specific Review Queue filter | Directors need to triage curriculum vs voice vs coach proposals | Filter only — no new mutation path |
| Coach session attendance write-back | Coaches currently mark attendance via wrap-up; DB write confirmation needed | Must go through existing approval flow |
| Assessment gate evaluation against player scores | Gates exist but are not evaluated automatically | Must present as proposed_actions for director review — never auto-advance |

---

### Tier 2 — High value, low risk

| Item | Why |
|------|-----|
| In-house match entry | Coaches need to record match results; UTR display is live but entry is missing |
| Cohort comparison | Directors want to see how their academy compares across levels |
| Push notifications (director) | Alerts for pending review items; daily digest |
| Parent progress email | Monthly PDF summary; opt-in only |
| Drill domain filter on level map | Directors want to filter by forehand/backhand/serve/etc |
| DONNA curriculum conversation mode | Multi-turn dialogue to refine curriculum proposals |

---

### Tier 3 — Future

| Item | Notes |
|------|-------|
| Angles integration | External tool; requires API contract |
| UTR live sync | UTR API access required |
| Video upload for gate evidence | Storage + review pipeline |
| AI-generated practice plans | High value; requires more player data first |
| Multi-academy tenant management | Scope expansion — not in current product |

---

## Decision framework for Tier 1 prioritisation

When scheduling the next sprint block, ask:
1. Does it create a new mutation path? → Requires full proposed_actions + audit_log treatment
2. Does it touch player data? → Requires RLS review before shipping
3. Does it affect DONNA's output posture? → Requires DONNA integration guard review
4. Does it affect coach UX? → Requires 90-second test

Never ship a Tier 1 item without passing all four checks.
