# AcademyOS V1 Final Pilot Walkthrough Script

**Sprint:** 745
**Date:** 2026-05-17
**Audience:** Farshad running Brian through the full pilot onboarding

---

## Session goal

By the end of this session, Brian should:
1. Understand what AcademyOS does and why it is different from a spreadsheet or generic app
2. Have completed the voice demo (speak → structure → review → approve)
3. Have seen his real players on screen (after roster import)
4. Feel confident he can use the system with his coaches

---

## Part 1 — Orientation (5 min)

### Opening frame

> "AcademyOS is built around one operating model: voice creates, the OS structures, and you approve before anything changes. Your coaches speak. The system listens. You decide what happens next."

### Show the director dashboard

- Navigate to `/director`
- Show the Academy Vital Signs (demo data or post-import data)
- Point to the DONNA brief card: "This is DONNA. She tells you what needs attention."

---

## Part 2 — Demo Walkthrough (15 min)

Follow the 10-step Brian Voice Demo Script (`docs/BRIAN_VOICE_DEMO_SCRIPT.md` or the DemoScriptPanel on `/director/demo`).

**Key moments to linger on:**
- After speaking the curriculum prompt: "The system heard every word. Nothing changed yet."
- After creating the override draft: "It's in the review queue. I have to go approve it."
- After speaking the session recap: "Sarah, Mia, Leo — it named them. But it's still a draft."
- After saving the recap: "The coach just said it. I see it. I approve it. Then it lives in the system."

---

## Part 3 — Player Import (10 min)

- Navigate to `/director/players/import`
- Upload Brian's real roster CSV (`data/player-import/academy_os_player_import_roster.csv` as template)
- Run dry-run first — show the validation step
- Confirm all rows clean, then run live import
- Navigate to `/director/players` — show real players on screen

> "These are your actual players. The system knows who's in Orange 2, who's in Green 1, what they're working on. This is your academy."

---

## Part 4 — Player Profile Deep Dive (10 min)

- Click on one of Brian's real players (or a demo player if real data not yet available)
- Show Overview tab: development summary, curriculum level
- Show Skill Path tab: what the player is working on, gates, advancement
- Show Notes tab: coaching observations, parent guidance preview

> "Every session observation the coach makes connects to this profile. No more searching through notebooks."

---

## Part 5 — Curriculum Explorer (5 min)

- Navigate to `/director/curriculum`
- Show the active spine: Red Ball through High Performance
- Click "Open Curriculum Builder" → show the setup state
- Expand "Advanced curriculum tools" → show the explorer
- Click one level (e.g., Orange 2) → show gates, drills, coach language

> "This is the development standard your academy runs on. Every player's profile connects back here."

---

## Part 6 — Review Queue (5 min)

- Navigate to `/director/review`
- Show any pending items (demo curriculum draft from Part 2 if present)
- Show the approve → apply flow on one wrap-up if available

> "This is your inbox. Everything the system wants you to approve comes here. Nothing happens without you."

---

## Part 7 — Coach View (5 min, optional)

- Open a new incognito tab, sign in as a coach account (if set up)
- Show the coach session list: `/coach/sessions`
- Open a session — show the "Before Session" class briefing
- Show the Coach Wrap-Up drawer: "This is how your coaches log sessions."

---

## Part 8 — Close

> "What you've seen is a complete loop. Coach speaks. System structures. You approve. Player profile updates. Next session is smarter. That's AcademyOS."

**Questions to expect:**
- "What happens to the parent update?" → "It goes in the review queue as a draft. You approve, then we'll add the send button in V2."
- "Can coaches see each other's notes?" → "No. Each coach sees only their sessions."
- "Does it work on mobile?" → "Yes — coach portal is mobile-first."
- "What if the voice gets it wrong?" → "You always see the transcript before anything is saved. Every step is editable."

---

## Handoff

After the session, give Brian:
- Login credentials for his director account
- Login credentials for one test coach account
- The demo sandbox link (`/director/demo`) for self-guided exploration
- This doc for reference

Tell Brian:
> "The system is yours. Log in, explore. When you're ready to import your full roster, we do it together."
