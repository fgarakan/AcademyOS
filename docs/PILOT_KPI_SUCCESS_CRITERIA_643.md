# Pilot KPI Success Criteria V1

**Sprint:** 643
**Date:** 2026-05-17
**Purpose:** Define pilot success metrics for the Brian/Dabul Academy pilot

---

## Overview

The pilot runs for 2–4 weeks with the Dabul team. Success is measured across 5 dimensions: wrap-up completion, review queue usage, time saved, parent update readiness, and director clarity.

---

## KPI 1 — Wrap-Up Completion Rate

**Target:** ≥ 80% of sessions receive a coach wrap-up within 2 hours of session end

| Metric | Target | Why |
|---|---|---|
| Wrap-ups submitted same day | ≥ 80% | Data freshness is critical for DONNA's intelligence |
| Average wrap-up completion time | ≤ 5 minutes | Must be faster than paper/email alternatives |
| Voice vs. text split | Track — no target | Reveals coach preference for future development |
| Questions skipped per wrap-up | ≤ 2 average | Measures question relevance and friction |

**How to measure:** Review `proposed_actions` records with `type = 'wrap_up'` per session day.

---

## KPI 2 — Review Queue Usage

**Target:** Director clears queue to 0–3 items at least 4 of 5 weekdays

| Metric | Target | Why |
|---|---|---|
| Queue cleared to <3 items per day | ≥ 4 of 5 days | Prevents backlog accumulation |
| Decision time per item | ≤ 2 minutes (estimated) | UI clarity and confidence |
| Approval rate | Track — no target | High rejection rate may signal poor wrap-up quality |
| Clarification rate | < 20% of items | High clarification rate signals question ambiguity |

**How to measure:** Review `proposed_actions` status changes and timestamps.

---

## KPI 3 — Perceived Time Saved

**Target:** Brian reports feeling ≥ 2 hours saved per week compared to pre-OS workflow

| Metric | Target | How to Capture |
|---|---|---|
| Brian's perceived time saved | ≥ 2 hrs/week | Ask directly at week 1 and week 2 check-in |
| Coaches' perceived time spent | ≤ 5 min/session | Ask coaches at week 1 check-in |
| Director check-in time on reviews | ≤ 20 min/day | Observe or ask Brian |
| Reduction in direct coach-director messages about session outcomes | Track | Qualitative — are they using DONNA instead of texting? |

**How to measure:** Weekly check-in questions + qualitative observation.

---

## KPI 4 — Parent Update Readiness

**Target:** At least 3 parent-ready drafts created and reviewed in the pilot period

| Metric | Target | Why |
|---|---|---|
| Parent drafts created via DONNA | ≥ 3 in 2 weeks | Proves the workflow is usable |
| Parent drafts approved by director | ≥ 2 of those created | Proves the content is acceptable |
| Parent portal visibility (approved_internal state) | ≥ 2 | Proves end-to-end flow |
| External send attempts | 0 (expected — not wired) | Confirms no unintended sends |

**Note:** External email/SMS send is not configured. All parent updates reach `approved_internal` at most.

---

## KPI 5 — Director Clarity and Confidence

**Target:** Brian reports feeling more informed about his academy after 2 weeks than before

| Metric | Target | How to Capture |
|---|---|---|
| "Do you feel you know what's happening across all groups?" | 4/5 or above | Week 2 check-in |
| "Do you trust the review queue decisions you're making?" | 4/5 or above | Week 2 check-in |
| "Do you understand what DONNA is telling you?" | 4/5 or above | Week 1 and week 2 |
| "Would you recommend this to another academy director?" | Yes / neutral / no | Week 2 |

---

## Secondary Signals (Track But Not KPIs)

| Signal | Target | Notes |
|---|---|---|
| Academy Health Score trend | Stable or improving over 2 weeks | Score should rise as data density increases |
| DONNA command usage | ≥ 2 commands/day by week 2 | Director adoption signal |
| At-risk player identification accuracy | Track | Did DONNA surface the right players? |
| Bugs/errors reported | ≤ 2 demo blockers total | One or fewer per week |

---

## Pilot Success Gate

The pilot is **successful** if:
- KPI 1 ≥ 80% (wrap-up completion)
- KPI 2 ≥ 4/5 days queue cleared
- KPI 3 Brian reports time savings
- KPI 4 ≥ 2 parent drafts approved
- KPI 5 Director clarity score ≥ 4/5

The pilot is **promising** if 3 of 5 KPIs are met.

The pilot is **insufficient** if fewer than 3 KPIs are met — signals a design or friction issue to address before expanding to a second academy.

---

## Measurement Schedule

| Week | What to Measure |
|---|---|
| Day 1 | Setup: confirm coaches can complete a wrap-up. Log first review queue clear. |
| End of Week 1 | Check-in with Brian: KPI 3 and KPI 5 early signal. Wrap-up completion rate check. |
| End of Week 2 | Full KPI review. Brian satisfaction scores. Go/No-Go for expanding to a second academy. |

---

## What to Do With Results

- If KPI 1 misses → audit wrap-up friction (Sprint 626 friction audit has recommendations).
- If KPI 2 misses → investigate review queue UX — too many items, too little clarity, or too much context needed.
- If KPI 3 misses → identify where Brian's time is still going that DONNA should be capturing.
- If KPI 4 misses → parent draft workflow may need better DONNA prompting or coach education.
- If KPI 5 misses → DONNA's language, clarity of data, or explanation of Academy Health needs improvement.
