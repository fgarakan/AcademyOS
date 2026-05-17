# DONNA Pilot Script Integration V1

**Sprint:** 637
**Date:** 2026-05-17
**Purpose:** Exact walkthrough path for the Brian/Dabul pilot, integrated with the DONNA conversation system and pilot dataset.

---

## Pre-Demo Setup

1. Open Chrome (Web Speech API required for voice).
2. Allow microphone permission when prompted.
3. Log in as `director` (Brian Dabul account).
4. Navigate to `/director`.
5. Confirm microphone icon is present — DONNA is ready.
6. Have the Brian demo dataset active (demo mode or live Dabul data).

---

## Walkthrough Path

### Step 1 — Director Dashboard `/director` (2 min)

**What Brian sees:**
- Academy Health Score (target: 74 — moderate)
- Today's session summary (4 sessions, 29 players)
- Pending review count (4 items, 1 urgent)
- DONNA pulse card

**Talking points:**
- "This is your command center. Everything your team did today flows into this screen."
- "The Health Score is your live pulse — it drops when wrap-ups are missing, attendance is off, or your queue is backed up."
- "DONNA is always watching. She tells you what needs your attention without you having to dig."

---

### Step 2 — Review Queue `/director/review` (5 min)

**What Brian sees:**
- Maya Chen attendance exception (urgent — unexcused absence)
- Alex Thornton coach observation (positive — backhand breakthrough)
- Carlos Medina coach observation (attention flag)
- Priya Patel level readiness flag

**Demo action — approve Maya Chen exception:**
1. Click the Maya Chen attendance exception card.
2. Expand the "What happens after each decision" explainer (Sprint 625 component).
3. Click "Approve" — exception is marked approved (no auto-apply).
4. Queue count drops from 4 → 3.

**Talking points:**
- "Nothing changes without your decision. DONNA surfaces it — you decide."
- "You can approve, ask for clarification, or reject. Every decision is logged."
- "The 'What happens' section is there so you never have to guess what you're committing to."

---

### Step 3 — Player Profile `/director/players/[alex-id]` (3 min)

**What Brian sees:**
- Alex Thornton's overview (UTR 8.2, Advanced group)
- Positive coach observation from today (after approval in Step 2)
- Risk signals section (DONNAPlayerRiskSurface)

**Talking points:**
- "The player profile is where the coaching work becomes permanent record."
- "What Coach Martinez told DONNA this morning — after you approved it — is now part of Alex's story."
- "You can see who's at risk, who's breaking through, and who needs follow-up all in one place."

---

### Step 4 — DONNA Voice Command `/director/command-center` (5 min)

**Demo actions:**
1. Type or speak: "Who needs attention today?"
2. DONNA classifies → routes → shows preview → confirm → proposed action created.
3. Show clarification flow: speak something ambiguous like "What about the Chen situation?"
4. DONNA asks: "Do you mean Maya Chen's attendance exception, or something related to the Chen family communication?"

**Talking points:**
- "DONNA understands natural language — you don't need to learn a command syntax."
- "She never acts on her own. She proposes, you confirm, the system records."
- "Voice is optional — type works exactly the same way."

---

### Step 5 — COO Intelligence `/director/donna-coo-demo` (3 min)

**What Brian sees:**
- DONNACOOIntelligencePanel (6 dimensions with live/partial/blocked badges)
- AcademyTopPrioritiesPanel (top 5 priorities)
- AcademyHealthActionLinks

**Talking points:**
- "This is DONNA's full intelligence view — what she knows, where data is live, where it's partial."
- "The priorities panel shows you the three or four things that actually matter right now, ranked by urgency."
- "As you approve more items and coaches complete more wrap-ups, the live data fills in."

---

### Step 6 — Wrap-Up Demo (coach perspective) `/coach` (3 min)

**Demo actions:**
1. Switch to coach view (or log in as Coach Martinez).
2. Navigate to a completed session.
3. Click "Start wrap-up".
4. Speak or type the first answer: "Everyone was here today, Maya Chen was absent, no word from the family."
5. Show DONNA's acknowledgement and move to next question.
6. Skip remaining questions to show the flow.
7. Submit wrap-up → confirmation screen.

**Talking points:**
- "The wrap-up takes 3–4 minutes. DONNA guides the coach through it conversationally."
- "The coach doesn't write a report — they just talk. DONNA structures it."
- "What they said goes to your review queue. You approve what matters, ignore what doesn't."

---

## Common Questions from Brian

| Question | Answer |
|---|---|
| "Can coaches use this on their phones?" | Yes — the wrap-up is mobile-first. Voice works on Android Chrome. iOS has partial support. |
| "What if a coach forgets to do their wrap-up?" | DONNA flags it in your Health Score. You see who's missing. |
| "Does DONNA send emails to parents?" | Not yet — all parent content goes to the portal queue. External send is a future phase. |
| "Can DONNA move a player up a level automatically?" | Never. Level moves require you to explicitly approve after a formal review. |
| "What happens to data we enter during the pilot?" | It's real data in a real database. If you want to reset it, let us know. |

---

## Demo Route Summary

```
/director               → Dashboard + Health Score
/director/review        → Queue decisions (approve Maya Chen)
/director/players/[id]  → Alex Thornton profile
/director/command-center → Voice/text command demo
/director/donna-coo-demo → COO intelligence view
/coach                  → Wrap-up flow (coach perspective)
```

**Total time: ~20 minutes**

---

## What to Say at the End

> "Everything you saw today is real code running on real infrastructure. The players are demo data — your roster would replace them. The workflows are the same ones your coaches would use on day one. This is what Academy OS looks like when it's live in your academy."
