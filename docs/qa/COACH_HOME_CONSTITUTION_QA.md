# Coach Home — DONNA UI Constitution QA

**Sprint:** Mega Sprint 1124-1130
**Standard:** `docs/architecture/DONNA_UI_CONSTITUTION.md`

---

## Constitution Requirements Check

| Requirement | Status | Notes |
|---|---|---|
| 1 primary job (know today's session + what to do after) | ✅ |  |
| 1 primary action | ✅ | "Submit Wrap-Up" or "Open Session" in DONNA brief |
| DONNA brief at top | ✅ | Sprint 1124 — `DonnaScreenBriefStatic` added |
| ≤5 visible data points | ✅ | Wrap-up alert + 3 stat tiles + Daily Brief = 5 max |
| Mobile-friendly | ✅ | Existing layout uses `max-w-2xl mx-auto` |

---

## DONNA brief check

| Check | Expected | Status |
|---|---|---|
| Brief uses coach first name | Yes | ✅ |
| Brief names today's session count + next session name | Yes | ✅ |
| Brief mentions pending wrap-ups | Yes | ✅ |
| Urgency = 'urgent' when wrap-ups pending | Yes | ✅ |
| Primary action "Submit Wrap-Up" links to sessions | Yes | ✅ |
| Primary action "Open Session" when no pending wrap-ups | Yes | ✅ |
| Brief has sensible empty state | Yes — "No sessions today" | ✅ |

---

## Coach portal safety checks

| Check | Expected |
|---|---|
| Coach cannot see director KPIs | ✅ — coach portal has no KPI section |
| Coach cannot see parent communication drafts | ✅ — not on coach home |
| Coach cannot see raw academy health | ✅ — coach sees only own players |
| Coach cannot approve director review items | ✅ — review queue is director-only route |
| Quick Capture button visible | ✅ — `CoachOnCourtActionsBar` |
| Wrap-Up CTA visible | ✅ — wrap-up alert + sessions list |

---

## Remaining gaps

| Gap | Notes |
|---|---|
| No "watch-fors" visible on home | Watch-fors live in session detail, not home — acceptable |
| Recent observations section visible by default | Could be hidden behind `CollapsedDetailSection` — next sprint |
| No explicit "End Session" CTA | Coach navigates to session detail — acceptable V1 |
