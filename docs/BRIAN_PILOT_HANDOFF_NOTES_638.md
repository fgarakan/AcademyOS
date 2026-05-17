# Brian Pilot Handoff Notes V1

**Sprint:** 638
**Date:** 2026-05-17
**Audience:** Brian Dabul (director, Dabul Tennis Academy)
**Purpose:** Brian-facing notes explaining what to test, what is real, what is draft-only, and what feedback to give.

---

## Welcome to the Academy OS Pilot

Brian — you're the first director to run Academy OS with DONNA in a live environment. This document is your guide for the pilot period.

---

## What Is Real (Use These As-Is)

| Feature | Status | How to Use |
|---|---|---|
| Coach wrap-up conversation | ✅ Live | Coaches start a wrap-up after each session. DONNA guides them through 7 questions via voice or text. |
| Review queue | ✅ Live | You see all pending items at `/director/review`. Approve, clarify, or reject. |
| DONNA command center | ✅ Live | Type or speak commands at `/director/command-center`. Voice requires Chrome. |
| Player profiles | ✅ Live | View at `/director/players`. Development data, risk signals, and coach observations are live. |
| Attendance exceptions | ✅ Live | Flagged by coaches during wrap-up. You approve/reject in the review queue. |
| Academy Health Score | ✅ Live | Updates as coaches complete wrap-ups and you clear the queue. |
| Curriculum levels and templates | ✅ Live | View at `/director/curriculum` and `/director/class-templates`. |

---

## What Is Draft / Preview Only

| Feature | Status | What It Means |
|---|---|---|
| Parent updates | 📝 Draft only | DONNA can draft parent-safe updates. They appear in the parent portal queue — but **nothing is sent to parents** until external send integration is configured. |
| Level-up decisions | 📝 Proposal only | Coaches can flag level readiness. You review. No player moves up without your explicit approval in the formal placement flow. |
| Curriculum overrides | 📝 Proposal only | Coaches can suggest curriculum changes via DONNA. These write to `curriculum_overrides`, not the master template. |
| Voice intake commands | 📝 Pending review | Any voice command that creates a proposed action goes to your review queue — it doesn't execute until you approve it. |

---

## What Is Not Wired Yet

| Feature | Status | When |
|---|---|---|
| Email/SMS to parents | ❌ Not wired | External send integration — future phase |
| AI transcription (OpenAI/Whisper) | ❌ Not wired | Using browser speech-to-text only. Best in Chrome. |
| Billing / court scheduling / CRM | ❌ Out of scope | Not in Academy OS V1 |
| Automated reporting | ❌ Not wired | Future phase — DONNA can draft, but no scheduled sends |

---

## Browser Requirements

- **Chrome on desktop or Android** — best experience. Voice input works.
- **Safari / iOS** — the app works, but voice input is unreliable. Use text mode.
- **Microphone permission** — Chrome will ask once. Allow it.

---

## Things to Test

Please test these during the pilot and note any issues:

### Coach Wrap-Up
- [ ] Does it feel natural to speak or type the answers?
- [ ] Do the questions feel relevant after each session?
- [ ] Is the flow too long, too short, or about right?
- [ ] Does the clarifying question trigger feel appropriate?

### Review Queue
- [ ] Can you understand what each item is and why it's there?
- [ ] Is the approve/clarify/reject flow clear?
- [ ] Does the "What happens after each decision" explainer help?
- [ ] Is anything confusing or missing?

### DONNA Commands
- [ ] Try asking: "Who needs attention today?"
- [ ] Try asking: "What's in my review queue?"
- [ ] Try asking: "How is my academy doing this week?"
- [ ] Does DONNA's response feel accurate and useful?

### Academy Health
- [ ] Does the Health Score reflect what you'd expect?
- [ ] Are the priority items the right ones?

---

## What Feedback to Give

After using the pilot, please answer these questions:

1. **Time:** How long does a typical coach wrap-up take in practice?
2. **Clarity:** Is DONNA's language clear to coaches, or does it need simplification?
3. **Coverage:** What types of observations or events did coaches want to capture that DONNA didn't have a category for?
4. **Trust:** Did you feel confident approving items, or did you need more information?
5. **Priority:** What was the most valuable thing DONNA told you?
6. **Friction:** What felt slowest or most confusing in the director flow?
7. **Missing:** What feature would make the biggest difference in week 2?

---

## How to Report Issues

- Screenshot or describe what happened.
- Note the URL and what you were doing.
- Send to Farshad directly — we triage and fix within 24 hours for demo-blocking issues.

---

## Data During the Pilot

- All data entered is real and persisted.
- Demo data (marked clearly) is separate from your real player data.
- If you want to reset any data or start fresh, ask Farshad.
- Nothing is sent externally (email, SMS) without explicit integration setup.

---

## Thank You

Your feedback from this pilot directly shapes what gets built next. You're not just testing a product — you're defining what Academy OS becomes for every tennis academy after Dabul.
