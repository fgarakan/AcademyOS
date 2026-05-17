# V1 Pilot Feedback Intake Guide — Sprint 755

**Sprint:** 755
**Date:** 2026-05-17

---

## Purpose

A structured guide for capturing feedback during and after the Dabul Tennis Academy pilot. Used by Farshad during check-in calls with Brian.

---

## Feedback Categories

### Category 1 — Adoption friction

Questions to ask Brian after first week:
- "What did you skip or avoid?"
- "What took longer than you expected?"
- "Did any of your coaches struggle with the wrap-up flow?"
- "Was there anything that felt like filling out a form?"

**Record:** Feature name, specific friction point, severity (blocking / friction / minor).

---

### Category 2 — Trust signals

Questions to ask Brian after first review queue interaction:
- "When DONNA flagged something, did you know why?"
- "Did any recommendation feel like it came from nowhere?"
- "Did you ever approve something you weren't sure about?"
- "Was it clear what would change when you clicked Approve?"

**Record:** Trust signal name, what was unclear, what would help.

---

### Category 3 — Missing features

Questions to ask Brian after first month:
- "What did you want to do that you couldn't?"
- "What do you wish the system had told you?"
- "What did you have to do outside the system that should be inside?"
- "What did your coaches ask for that wasn't there?"

**Record:** Feature description, frequency ("every session" vs. "once"), who asked.

---

### Category 4 — DONNA value

Questions to ask Brian after 2 weeks:
- "Did DONNA's daily brief change what you focused on?"
- "Did any DONNA recommendation make you act differently?"
- "Did DONNA ever get something wrong or misleading?"
- "What would you want DONNA to tell you that she doesn't?"

**Record:** DONNA recommendation, whether Brian acted on it, confidence level.

---

## Feedback Log Template

| Date | Source (Brian / Coach) | Category | Feature | Feedback | Severity | Action |
|---|---|---|---|---|---|---|
| | | | | | | |

---

## Severity Definitions

| Severity | Definition | Sprint priority |
|---|---|---|
| Blocking | Cannot use the feature at all | Next sprint |
| Friction | Uses it but it's painful | Next sprint cycle |
| Minor | Annoying but workable | Future polish |
| Enhancement | Nice to have | Backlog |

---

## Check-In Schedule

| Week | Meeting | Focus |
|---|---|---|
| Week 1 | 30 min call | Login success, demo walkthrough, any blockers |
| Week 2 | 30 min call | First real session data, review queue experience |
| Week 4 | 45 min call | Adoption, missing features, DONNA value |
| Week 8 | 60 min call | Full feedback review, V2 planning |

---

## Processing Feedback

After each call:
1. Categorize all feedback into the 4 categories above
2. Assign severity
3. File as a sprint if severity is Blocking or Friction
4. Add to backlog if Minor or Enhancement
5. Update `docs/KNOWN_LIMITATIONS.md` if a gap becomes confirmed

Feedback from pilot is the primary input for the V2 sprint plan.
