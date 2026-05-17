# Director First-Run Pilot Guide V1

**Sprint:** 639
**Date:** 2026-05-17
**Audience:** Academy director using DONNA for the first time during the pilot
**Time to read:** 5 minutes

---

## Your First Day with DONNA

DONNA is your executive assistant. She watches what happens in your academy, surfaces what matters, and drafts proposals for your review. She never acts without your approval.

---

## Step 1 — Your First Login (2 minutes)

1. Go to your Academy OS URL.
2. Click "Sign in" — use the email and password Farshad set up.
3. You'll land on your **Director Dashboard** at `/director`.
4. You should see:
   - Your academy name in the sidebar
   - Today's session summary (or a placeholder if no sessions are scheduled yet)
   - Your Review Queue count

If anything looks wrong on this screen, stop and message Farshad before continuing.

---

## Step 2 — Check Your Review Queue (5 minutes)

Your review queue is at `/director/review`.

The queue is where DONNA routes everything coaches flag during their wrap-ups. Your job is to decide:
- **Approve** — the item is valid, move it to the next step
- **Needs clarification** — send it back to the coach for more info
- **Reject** — decline without action

**Important:** Approving does not immediately change anything. It marks the item as ready for an application step — but nothing auto-applies.

**First run tip:** If you see items from demo data or test data, you can reject or approve them freely — it won't affect real players.

---

## Step 3 — Try Your First DONNA Command (5 minutes)

Go to `/director/command-center`.

Type or speak any of these:

> "Who needs attention today?"

> "What's in my review queue?"

> "How is the academy doing this week?"

DONNA will:
1. Show you what she understood (intent + category)
2. Ask for clarification if she's not sure
3. Show you a preview of what she wants to do
4. Wait for your confirmation

You can cancel at any step. Nothing happens until you confirm.

**Voice tip:** Click the microphone icon. Speak naturally. Click again to stop. DONNA transcribes and shows you what she heard — you can edit before confirming.

---

## Step 4 — Explore Player Profiles (5 minutes)

Go to `/director/players`.

Click any player to see their full profile. You'll find:
- Development summary and curriculum level
- Coach observations (approved by you)
- Risk signals (attendance, confidence, technique flags)
- Assessment history

The player profile is your long-term record. Items don't appear here until you've approved them from the review queue.

---

## Step 5 — Understand Your Academy Health Score

The Health Score on your dashboard is a live composite metric. It considers:
- Wrap-up completion by coaches today
- Attendance exceptions pending your decision
- Review queue backlog
- At-risk player signals
- Parent communication backlog

**What to expect during the pilot:** The score will be lower at first because not all data pipelines are fully live. As coaches complete wrap-ups and you clear your queue, it rises.

---

## What DONNA Does Automatically (Without You Asking)

- Flags missing wrap-ups and alerts you
- Surfaces attendance exceptions from coach wrap-ups
- Builds the review queue from all coach inputs
- Calculates the Academy Health Score continuously
- Generates daily and weekly briefs (available in the command center)

---

## What DONNA Never Does Without Your Explicit Approval

- Move a player to a different level
- Send anything to a parent (email, portal message, SMS)
- Apply curriculum changes to active templates
- Record attendance changes to official records
- Execute any action flagged as "proposed"

---

## Your First Week Checklist

- [ ] Log in at least once every day
- [ ] Clear your review queue (target: daily)
- [ ] Check Academy Health Score each morning
- [ ] Ask DONNA one question per day — get comfortable with the voice/text interface
- [ ] After each session day, verify coaches submitted their wrap-ups

---

## Quick Reference — Key Routes

| What | Where |
|---|---|
| Dashboard | `/director` |
| Review queue | `/director/review` |
| DONNA command center | `/director/command-center` |
| Player list | `/director/players` |
| Session history | `/director/sessions` |
| Curriculum | `/director/curriculum` |
| Academy settings | `/director/settings` |

---

## Getting Help

- Message Farshad directly for anything that feels broken or confusing.
- Check the `BRIAN_PILOT_HANDOFF_NOTES_638.md` doc for what's live vs. draft.
- If you see a "demo data" banner — that data is safe to interact with for practice.
