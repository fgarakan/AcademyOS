# QA — Sprint 1071: DONNA Page-Aware Answer + Navigation Intent Fix

**Date:** 2026-05-31
**Sprint:** 1071

---

## Test 1 — Academy Health page-aware answer

| # | Action | Expected | Pass? |
|---|---|---|---|
| 1.1 | Navigate to `/director/kpi`. Open DONNA panel. | Context indicator shows "Academy Health" (not "Today"). | |
| 1.2 | Type: "Tell me about the health of my academy." Send. | DONNA replies with a 3-section answer covering Active Players, Advancement Ready, and Attention Signals. No clarification request. | |
| 1.3 | Type: "How is my academy doing?" Send. | DONNA replies with the same Academy Health answer. | |
| 1.4 | Type: "Explain these KPIs." Send. | DONNA replies with the Academy Health answer. | |
| 1.5 | Type: "Which KPI needs attention?" Send. | DONNA replies with the Academy Health answer. | |
| 1.6 | Say (voice): "Tell me about the health of my academy." | Same answer as 1.2 — voice and typed follow identical intent path. | |
| 1.7 | Navigate to `/director` (not KPI page). Type: "Tell me about the health of my academy." | DONNA does NOT fire the KPI intercept — falls through to normal routing. No regression. | |

---

## Test 2 — Navigation commands

| # | Action | Expected | Pass? |
|---|---|---|---|
| 2.1 | Type: "Open approvals." | DONNA navigates to `/director/review`. Confirmation message shown. | |
| 2.2 | Type: "Go to approvals." | Same as 2.1. | |
| 2.3 | Type: "Take me to approvals." | Same as 2.1. | |
| 2.4 | Say (voice): "Open approvals." | Same as 2.1 — does not silently no-op. | |
| 2.5 | Type: "Academy health." | DONNA navigates to `/director/kpi`. | |
| 2.6 | Type: "Open KPI." | DONNA navigates to `/director/kpi`. | |
| 2.7 | Type: "Parent updates." | DONNA navigates to `/director/parents`. | |
| 2.8 | Existing: "Open players." | Still routes to `/director/players`. No regression. | |
| 2.9 | Existing: "Go to sessions." | Still routes to `/director/sessions`. No regression. | |
| 2.10 | Existing: "Review queue." | Still routes to `/director/review`. No regression. | |

---

## Test 3 — Voice status display

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3.1 | Open DONNA panel. Click mic button. | Header shows "Listening". No error text in body. | |
| 3.2 | With a prior permission error shown (voicePermissionError set), click mic to restart. | Error text clears immediately when recognition starts. | |
| 3.3 | If browser blocks mic (not-allowed), after denial: | Header shows "Mic blocked" OR "Ready". Not "Listening". No simultaneous Listening + error. | |
| 3.4 | Panel shows "Listening". Recognition fails mid-session (service-not-allowed). | Header transitions to "Mic blocked" or "Ready" immediately — no window where "Listening" and error text both show. | |

---

## Test 4 — Regression checks

| # | Check | Expected | Pass? |
|---|---|---|---|
| 4.1 | DONNA panel opens and closes normally. | Unchanged behavior. | |
| 4.2 | "Capture a note" mode. | Unchanged. | |
| 4.3 | Typing a template draft command. | Unchanged routing through TemplateDraftPanel. | |
| 4.4 | Voice transcript for guided task question. | Pending review card shown, no change. | |
| 4.5 | "What needs my attention?" from any page. | Still routes to attention fetch. No regression. | |
| 4.6 | Review queue badge count displays. | Unchanged. | |
| 4.7 | Curriculum builder DONNA chips. | Unchanged. | |
| 4.8 | TypeScript: `npx tsc --noEmit`. | Zero new errors from sprint files. | |

---

## Acceptance Criteria Summary

- [ ] On `/director/kpi`, "tell me about the health of my academy" gives a grounded Academy Health answer.
- [ ] On `/director/kpi`, "open approvals" routes to `/director/review`.
- [ ] Voice and typed "open approvals" follow the same deterministic path.
- [ ] DONNA does not ask for more context on the KPI page.
- [ ] DONNA does not show "Listening" and "Voice unavailable" simultaneously.
- [ ] Text fallback still works.
- [ ] TypeScript passes.
