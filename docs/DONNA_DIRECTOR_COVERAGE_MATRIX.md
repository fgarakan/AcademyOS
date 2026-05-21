# DONNA Director Coverage Matrix

**Sprint:** 604A
**Date:** 2026-05-21
**Source:** DONNA_DIRECTOR_CONNECTIVITY_AUDIT.md

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Present / Yes / Safe |
| ⚠️ | Partial / Incomplete |
| ❌ | Absent / No / At risk |
| — | Not applicable to this route |

---

## Coverage grid

Dimensions across columns:

| # | Dimension |
|---|---|
| 1 | DONNA presence |
| 2 | Page-aware |
| 3 | Object-aware |
| 4 | Can explain |
| 5 | Can summarize |
| 6 | Can recommend |
| 7 | Can draft |
| 8 | Can route |
| 9 | Can apply |
| A | Approval required |
| B | Parent/player safe |

---

| Route | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/director/review` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **9/10** |
| `/director/onboarding/interview` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | **9/10** |
| `/director/donna` | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | — | ✅ | **8/10** |
| `/director/review/[actionId]` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | — | — | ✅ | ✅ | ✅ | **8/10** |
| `/director/command-center` | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ✅ | **7/10** |
| `/director/today` | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | — | ✅ | **7/10** |
| `/director/players/[playerId]` | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | **7/10** |
| `/director/curriculum` | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ✅ | **6/10** |
| `/director/sessions/[sessionId]` | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | **6/10** |
| `/director/templates/class/[templateId]` | ⚠️ | ✅ | ✅ | ❌ | ❌ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | **6/10** |
| `/director/fitness/templates/[templateId]` | ⚠️ | ✅ | ✅ | ❌ | ❌ | ⚠️ | ✅ | ⚠️ | ✅ | ❌ | ✅ | **5/10** |
| `/director` (dashboard) | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | — | ✅ | **4/10** |
| `/director/templates` | ⚠️ | ✅ | ❌ | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ | — | ✅ | **4/10** |
| `/director/level-up` | ⚠️ | ✅ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | — | ✅ | **3/10** |
| `/director/placement` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ | **2/10** |
| `/director/curriculum/builder` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |
| `/director/curriculum/learning` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |
| `/director/players` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |
| `/director/sessions` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |
| `/director/kpi` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |
| `/director/signals` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |
| `/director/coaches` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |
| `/director/coaches/[coachId]` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |
| `/director/parents` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |
| `/director/settings` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |
| `/director/pilot-readiness` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ✅ | **1/10** |

---

## Tier breakdown

### Fully connected (score ≥ 8)
- `/director/review` — 9/10
- `/director/onboarding/interview` — 9/10
- `/director/donna` — 8/10
- `/director/review/[actionId]` — 8/10

### Well connected (score 6–7)
- `/director/command-center` — 7/10
- `/director/today` — 7/10
- `/director/players/[playerId]` — 7/10
- `/director/curriculum` — 6/10
- `/director/sessions/[sessionId]` — 6/10
- `/director/templates/class/[templateId]` — 6/10

### Partially connected (score 3–5)
- `/director/fitness/templates/[templateId]` — 5/10 ⚠️ **approval risk**
- `/director` (dashboard) — 4/10
- `/director/templates` — 4/10
- `/director/level-up` — 3/10 ⚠️ **library exists but not wired**

### Weak (score 2)
- `/director/placement` — 2/10 ⚠️ **high-stakes decisions, no DONNA**

### Not connected (score 1)
- 12 routes — `/director/curriculum/builder`, `/director/curriculum/learning`, `/director/players`, `/director/sessions`, `/director/kpi`, `/director/signals`, `/director/coaches`, `/director/coaches/[coachId]`, `/director/parents`, `/director/settings`, `/director/pilot-readiness`

---

## Dimension coverage summary

| Dimension | Routes with ✅ | Routes with ⚠️ | Routes with ❌ |
|---|---|---|---|
| 1 Presence | 8 | 6 | 12 |
| 2 Page-aware | 14 | 2 | 10 |
| 3 Object-aware | 7 | 5 | 14 |
| 4 Can explain | 6 | 5 | 15 |
| 5 Can summarize | 8 | 7 | 11 |
| 6 Can recommend | 7 | 8 | 11 |
| 7 Can draft | 8 | 0 | 18 |
| 8 Can route | 8 | 4 | 14 |
| 9 Can apply | 5 | 2 | 19 |
| A Approval | 10 of applicable routes | — | **1 risk** (fitness template) |
| B Safety | 26 | 0 | 0 |

**Safety note:** All 26 routes pass the parent/player safety check. The approval gap in fitness template is a process risk, not a data exposure risk.

---

## Overall DONNA connection score

**4.4 / 10** across 26 audited director routes.

Routes with zero DONNA presence: **12 of 26 (46%)**.
Routes with full DONNA coverage (score ≥ 8): **4 of 26 (15%)**.
