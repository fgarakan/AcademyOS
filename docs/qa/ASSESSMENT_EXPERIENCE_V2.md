# Assessment Experience V2 — QA Checklist

**Sprint:** Mega Sprint 1406–1435
**Date:** 2026-06-03
**Scope:** Assessment save bug fix · Quick Placement Snapshot rename · Ball-level template system · Placement signal upgrade

---

## Part 1 — Assessment Save Bug Fix

| # | Check | Pass/Fail |
|---|---|---|
| 1 | Navigate to a pending player's onboarding flow (Step 3) | |
| 2 | Rate all five domains (Technical, Tactical, Movement, Competition, Behavioral) | |
| 3 | Click "Save Snapshot" — no constraint error appears | |
| 4 | Assessment record appears in Supabase `assessments` table with scores in 0–10 range | |
| 5 | `behavioral_score`, `technical_score`, `movement_score`, `competition_score`, `tactical_score` are all ≤ 10.0 | |
| 6 | Rating 1 → 2.5 stored, Rating 2 → 5.0, Rating 3 → 7.5, Rating 4 → 10.0 | |
| 7 | `overall_score` computed column returns a valid weighted average | |

---

## Part 2 — Quick Placement Snapshot

| # | Check | Pass/Fail |
|---|---|---|
| 8 | Step 3 label in onboarding stepper reads "Quick Placement Snapshot" | |
| 9 | Step 3 short label reads "Snapshot" | |
| 10 | DONNA commentary for Step 3: "This quick snapshot helps me recommend the best starting group and level. Rate each domain — it takes under 60 seconds." | |
| 11 | Save button reads "Save Snapshot" | |
| 12 | Step 3 panel header reads "Quick Placement Snapshot" (from step label) | |
| 13 | Step 4 "no assessment" fallback text says "Complete the Quick Placement Snapshot first" | |

---

## Part 3 — Assessment Template Registry

| # | Check | Pass/Fail |
|---|---|---|
| 14 | `/director/assessment-template` loads without error | |
| 15 | Page shows "Global Assessment Registry" section listing all global templates | |
| 16 | "Seed Ball-Level Templates" button is visible when ball-level templates are not yet seeded | |
| 17 | Clicking "Seed Ball-Level Templates" inserts 4 templates: Red Ball, Orange Ball, Green Dot, Yellow Ball | |
| 18 | After seeding, button is replaced by "Ball-level templates seeded" green indicator | |
| 19 | Each template row shows name, section count, skill count, and version badge | |
| 20 | Action is idempotent — clicking "Seed" a second time seeds 0 new templates and shows "All templates already exist" | |

---

## Part 4 — Red Ball Assessment Template

| # | Check | Pass/Fail |
|---|---|---|
| 21 | "Red Ball Assessment" global template exists in registry after seeding | |
| 22 | 5 sections: Movement Foundations, Ball Tracking, Stroke Foundations, Serve Foundations, Learning Behaviors | |
| 23 | Section "Movement Foundations" contains: Balance, Running, Stopping, Direction Changes | |
| 24 | Section "Ball Tracking" contains: Tracking, Catching, Judging Bounce | |
| 25 | Section "Stroke Foundations" contains: Forehand, Backhand, Contact, Finish | |
| 26 | Section "Serve Foundations" contains: Toss, Contact, Rhythm | |
| 27 | Section "Learning Behaviors" contains: Listening, Effort, Sportsmanship, Coachability | |

---

## Part 5 — Orange Ball Assessment Template

| # | Check | Pass/Fail |
|---|---|---|
| 28 | "Orange Ball Assessment" global template exists in registry after seeding | |
| 29 | 5 sections: Technical, Movement, Tactical, Competition, Behavior | |
| 30 | Technical section contains: Forehand, Backhand, Serve, Volley | |
| 31 | Tactical section contains: Direction, Consistency, Target Awareness | |

---

## Part 6 — Green Dot Assessment Template

| # | Check | Pass/Fail |
|---|---|---|
| 32 | "Green Dot Assessment" global template exists in registry after seeding | |
| 33 | 5 sections: Technical, Movement, Tactical, Competition, Behavior | |
| 34 | Technical section contains: Forehand, Backhand, Serve, Return, Volley | |
| 35 | Tactical section contains: Direction, Depth, Rally Patterns | |

---

## Part 7 — Yellow Ball Assessment Template

| # | Check | Pass/Fail |
|---|---|---|
| 36 | "Yellow Ball Assessment" global template exists in registry after seeding | |
| 37 | 6 sections: Technical, Movement, Tactical, Competition, Mental Performance, Behavior | |
| 38 | Technical section contains: Forehand, Backhand, Serve, Return, Volley, Transition Game | |
| 39 | Mental Performance section contains: Confidence, Resilience, Emotional Control | |
| 40 | Behavior section contains: Effort, Responsibility, Coachability | |

---

## Part 8 — DONNA Assessment Guidance

| # | Check | Pass/Fail |
|---|---|---|
| 41 | DONNA commentary on step 3 provides clear context about the snapshot purpose | |
| 42 | DONNA recommendation step (step 4) shows "DONNA's Recommendation" heading | |
| 43 | DONNA does not override coach judgment — director makes final placement decision in step 5 | |

---

## Part 9 — Academy Customization Architecture

| # | Check | Pass/Fail |
|---|---|---|
| 44 | Academy clone pattern remains intact (existing `loadAssessmentFormConfig` behavior unchanged) | |
| 45 | Global templates are read-only from the UI (no edit controls on registry rows) | |
| 46 | Academy Core Template editor still functions normally below the registry section | |

---

## Part 10 — Placement Signal Quality Upgrade

| # | Check | Pass/Fail |
|---|---|---|
| 47 | DONNA recommendation step shows numerical confidence score (e.g., "82% confidence") | |
| 48 | "Reasons" section with ✓ checkmarks shows topReasons from the engine | |
| 49 | "Needs Improvement" section with • bullets shows limitingFactors from the engine | |
| 50 | Overall avg display shows "X.X/10" (decimal, 0–10 scale, not 0–100) | |
| 51 | Stage label (e.g., "orange development") is shown beside the confidence badge | |
| 52 | Risk notes display when present (orange info strip) | |

---

## TypeScript

| # | Check | Pass/Fail |
|---|---|---|
| 53 | `npx tsc --noEmit` passes with zero errors | |

---

## Follow-up work (not in this sprint)

- Full integration of ball-level templates into `AssessmentStudioForm` / `loadAssessmentFormConfig` — currently the form still loads the Core Assessment Template. The ball-level templates are seeded and visible in the registry but not yet auto-selected based on player stage.
- DONNA assessment Q&A layer ("What should I look for?" / "Why is this player not ready?") — separate DONNA intelligence sprint.
- Academy customization UI for ball-level templates — directors can clone and edit in a future sprint.
