# Pilot Demo Script V2 — Sprint 609

**Date:** 2026-05-17
**Sprint:** 609 — Pilot Demo Script V2
**Audience:** Brian (academy director), internal team
**Purpose:** Updated demo script incorporating DONNA conversation, command, and COO intelligence features (Sprints 540–608)

---

## Demo Overview

Academy OS is a director-led operating system for tennis academies.

> Voice creates → UI confirms → Database structures → System executes

**Core demo flow (30 minutes):**
1. Director morning brief — DONNA COO intelligence
2. DONNA command flow — from voice to proposed action
3. Director review queue — approve and apply
4. Coach wrap-up — voice-guided session debrief
5. Player profile — observation and level readiness

---

## Section 1: Director Morning Brief (5 min)

**What to show:** `DirectorExecutionReadinessPanel` + `AcademyTopPrioritiesPanel`

**Script:**
> "Every morning, DONNA gives Brian a brief on what matters today. Here's the execution readiness panel — it shows what's pending review, what's been approved but not yet applied, and what's already done today."

**Key points:**
- DONNA proposes, director approves, system executes — always this order
- Nothing is applied automatically
- The review queue is the director's primary action surface

**Demo data:** Show 3 pending, 1 approved-not-applied, 2 applied today.

---

## Section 2: DONNA Command Flow (8 min)

**What to show:** `DONNACommandPreviewCard` → `DONNACommandConfirmation` → Review queue

**Script:**
> "Brian sees that attendance data is incomplete for this morning's session. He speaks to DONNA: 'Marcus was absent today — family emergency.' DONNA classifies this as an attendance update and shows a preview. Brian confirms, and DONNA creates a proposal in the review queue — it is NOT applied yet."

**Flow:**
1. Input: "Marcus was absent today — family emergency"
2. `donnaIntentClassifier` → category: `attendance`, confidence: high
3. `DONNACommandPreviewCard` shows: Attendance preview route, director approval required
4. `DONNACommandConfirmation` shown — Brian clicks "Submit attendance proposal"
5. Proposed action created in review queue (status: pending_review)
6. Director opens review queue → approves → applies

**Key safety point:**
> "Notice that DONNA never applies anything. The proposal goes to the review queue. Brian has to approve it. Only then does the system apply it."

---

## Section 3: Coach Wrap-Up via Voice (7 min)

**What to show:** `DonnaConversationalPanel` → `DonnaVoiceWrapUpShell` → `DonnaConversationSummary`

**Script:**
> "After the U14 session, Coach Alejandro opens the wrap-up flow. DONNA asks 5 questions — attendance, session intensity, observations, parent flags, and level readiness. Alejandro can answer by voice or type."

**Flow:**
1. Coach opens session → starts wrap-up
2. `DonnaVoiceWrapUpShell` — DONNA speaks question (muted by default, toggle available)
3. Coach speaks → `useVoiceDictation` captures transcript → `VoiceTranscriptReview` shown
4. Coach clicks "Use this" → answer recorded
5. All 5 questions answered → `DonnaConversationSummary` shown
6. Coach clicks "Wrap up session" → `saveWrapUpDraftAction` → proposed_actions created
7. Goes to director review queue

**Key safety point:**
> "Voice never writes directly. The transcript is shown to the coach first. The coach confirms. The answer is recorded in the draft. The draft is submitted as a proposal. Director reviews before anything is applied."

---

## Section 4: Director Review Queue (5 min)

**What to show:** Director review queue, approve, apply

**Script:**
> "Brian opens the review queue. He sees the attendance exception from Section 2 and the wrap-up from Section 3. He reviews both. He approves the attendance exception and clicks Apply. The system executes — `execute_approved_action()` is called. An audit log entry is written."

**Key safety point:**
> "There is exactly one function that executes approved actions: `execute_approved_action()`. It cannot be called from DONNA or voice directly. Only the director's Apply button triggers it."

---

## Section 5: Player Profile and Readiness (5 min)

**What to show:** Player profile → `PlayerCOOContextPanel` → `LevelReadinessApplyPreview`

**Script:**
> "Brian opens Marcus's profile. DONNA surfaces context: 3 sessions missed this month, parent not contacted in 12 days, one coach observation flagged. A readiness signal is showing — coach thinks Marcus might be ready to move up to U16. DONNA shows a preview of what this would mean — but notice: the preview says 'Level changes are protected. Only a director can apply this via the Placement workflow.' No level movement has happened. Brian can decide to start the formal placement process when ready."

---

## Section 6: Academy Health (3 min)

**What to show:** `DONNAAnswerCard` for 'what needs attention'

**Script:**
> "At any point, Brian can ask DONNA: 'What needs my attention right now?' DONNA answers from live context: 3 players at attendance risk, 2 coach wrap-ups missing, 1 urgent review item. Each answer shows a confidence score and source note. DONNA never makes things up — if data is missing, it says so."

---

## Demo Close

> "Academy OS gives Brian a single view of his academy's health, a voice-powered way to capture what's happening on the court, and a safe, director-led approval process for every action. DONNA proposes. Brian approves. The system executes. Nothing happens automatically."

---

## Safety Messages for Q&A

**Q: Can DONNA send a message to a parent?**
A: No. Parent messages are always drafts. The system explicitly blocks sending until a director approves.

**Q: Can a coach move a player up a level?**
A: No. Level changes require `finalize_player_placement()` — a protected database function that only the director's Placement workflow can call.

**Q: What if DONNA gets something wrong?**
A: Every proposal is previewed before submission. The director reviews before approval. Rollback is available for applied overrides. The audit trail shows everything.
