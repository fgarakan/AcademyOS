# Sprint 1100 — DONNA Demo Flow V1

## Purpose

This document describes the recommended demo narrative for showing DONNA across all four role portals. Use this as a script for investor demos, onboarding walkthroughs, and product reviews.

---

## DONNA in 60 seconds

DONNA is the Academy OS assistant. It has four distinct forms — one for each role — each with appropriate guardrails, scope, and tone.

> "Different roles, different DONNA."

---

## Demo sequence

### 1. Director DONNA — `/director/donna`

**Who:** Academy director
**What to show:**
1. Open `/director/donna` — point to the Live/Demo mode badge
2. "Today at a Glance" stats card — sessions, pending reviews, missing wrap-ups, attention flags
3. Academy Pulse Card — health score + trend indicator
4. Attention Needed items (if live data) or explain the pattern
5. Next Best Actions — show the chevron links
6. DONNA chat shell on the right — type "What needs my attention today?"
7. Daily Brief at the bottom — structured sections with priority dots
8. Review Queue Surface — pending counts

**Key message:** DONNA is the director's COO layer. It aggregates everything, proposes actions, and surfaces what needs review — nothing executes without director approval.

---

### 2. Coach DONNA — `/coach/donna`

**Who:** Coach
**What to show:**
1. Open `/coach/donna` — now accessible from the DONNA tab in the bottom nav
2. Session Brief stats — sessions today, wrap-ups due, in review, players
3. Wrap-Up Coverage Tracker — shows which sessions have been wrapped up vs pending
4. Session prep guidance (if no sessions) or Today's Sessions list
5. DONNA chat shell — type "What should I do after my session?"

**Key message:** Coach DONNA is the session assistant. Brief, wrap-up, player watch-fors — all in one place. Every submission goes into the director review queue.

---

### 3. Player Ask DONNA — `/player/ask-donna`

**Who:** Player
**What to show:**
1. Open `/player/ask-donna` — point to the Shield guardrail notice
2. Tap "What should I work on?" — shows mission-personalized response
3. Tap "How do I level up?" — shows level name + advancement reminder
4. Tap "I had a tough loss — what now?" — shows reframe response
5. Scroll to Helpful Pages — missions, level-up, practice links

**Key message:** Player DONNA is a guided companion, not a chat bot. It answers from coach-approved context only. No rankings, no pressure, no private notes.

---

### 4. Parent Ask DONNA — `/parent/ask-donna`

**Who:** Parent
**What to show:**
1. Open `/parent/ask-donna` — point to the Shield guardrail notice
2. Tap "How can I support at home?" — shows at-home tip for child's focus category
3. Tap "What should I say after practice?" — shows after-practice conversation starter
4. Tap "When should I talk to the coach?" — shows three appropriate scenarios
5. Scroll to More Support — links to Progress, Coach Updates, Home

**Key message:** Parent DONNA is a parenting guide. Calm, supportive, not about scores or rankings. It helps parents support without overcoaching.

---

## DONNA safety summary (for Q&A)

| Question | Answer |
|---|---|
| "Does DONNA use AI?" | Director and coach DONNA use a deterministic intelligence layer (no external API). Player and parent DONNA use static template responses. No live AI inference. |
| "Can DONNA send messages to parents?" | No. Any parent-facing content goes through the director review queue before it becomes visible. |
| "Can DONNA change player levels?" | No. Level advancement requires explicit director confirmation. DONNA can surface readiness indicators only. |
| "Who controls what DONNA can say?" | The academy director. DONNA's guardrails are defined in code and enforced at the platform level. |
| "Is this HIPAA/privacy compliant?" | DONNA reads approved data only. No audio is stored. No coach notes are exposed to parents or players without director approval. |

---

## Navigation map

| Role | DONNA entry | Type |
|---|---|---|
| Director | Sidebar → DONNA | Voice-capable shell + context panels |
| Coach | Bottom nav → DONNA tab | Voice-capable shell + session panels |
| Player | Bottom nav → Ask DONNA tab | Chip-based guided interface |
| Parent | Bottom nav → DONNA tab | Chip-based guided interface |

---

## Phase 8 completion status

All 12 Phase 8 sprints (1090–1101) complete as of Sprint 1100.

| Sprint | Deliverable | Status |
|---|---|---|
| 1090 | DONNA Phase 8 Audit | DONE |
| 1091 | Coach DONNA Tab Entry | DONE |
| 1092 | Coach DONNA Session Brief Polish | DONE |
| 1093 | Director DONNA Daily Brief Integration | DONE |
| 1094 | Director DONNA Actions Polish | DONE |
| 1095 | Player DONNA Chip Expansion | DONE |
| 1096 | Parent DONNA Chip Expansion | DONE |
| 1097 | DONNA Guardrail Consistency Pass | DONE |
| 1098 | Director DONNA Academy Pulse Card | DONE |
| 1099 | Coach DONNA Wrap-Up Coverage Tracker | DONE |
| 1100 | DONNA Demo Flow Document | DONE |
| 1101 | DONNA Final QA | Pending |
