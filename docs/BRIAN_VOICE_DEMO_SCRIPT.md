# Brian Voice Demo Script

**Sprint:** 125
**Date:** 2026-05-01

---

## The one-liner

> "Voice creates text. The OS structures it. Humans approve before anything changes."

---

## Before the demo

1. Log in as the academy director
2. Navigate to `/director/demo`
3. If demo sandbox exists, click "Reset Demo Sandbox" for a clean state
4. If not yet created, click "Create Demo Sandbox"
5. Have Chrome open (SpeechRecognition works best in Chrome)
6. Confirm microphone permission is allowed in browser settings

---

## The demo flow

### Step 1 — Open the Demo Sandbox

**Navigate to:** `/director/demo`

**Say:**
> "Everything you're about to see runs on real code — real database, real workflows. The sample players are there just to make the demo feel real. When we onboard your academy, we replace them with your actual roster."

**Point out:**
- The "Preview Mode" banner
- The sandbox status cards (players, group, session)

---

### Step 2 — Navigate to Curriculum Customization

**Navigate to:** `/director/curriculum`

**Say:**
> "The Academy OS connects your coaching philosophy to every session and every player. If you want to emphasize something — like more return-of-serve work before players move up — you can just say it."

**Point out:**
- The Curriculum Customization panel
- The "Speak or type" label and voice button

---

### Step 3 — Speak a curriculum prompt

**Click:** "Start speaking"

**Say into microphone:**
> "For our Orange 2 players, I want more return-of-serve readiness before Orange 3."

**Point out after speaking:**
- The transcript appears in the text box
- You can see exactly what the system heard
- The text is fully editable before you do anything with it

**Say:**
> "The system heard every word. If it got something wrong, I can just edit it here before I do anything. Nothing has changed yet — I haven't submitted anything."

---

### Step 4 — Edit if needed

**Action:** Make a small edit to the transcript if needed (optional, for demo purposes).

**Say:**
> "This is the key difference from an autonomous system. I see what it heard. I approve it. Then it creates a draft — not a live change."

---

### Step 5 — Create the draft

**Click:** "Create Override Draft"

**Point out after submit:**
- Success message: "Draft created — check Review Queue"
- Nothing in the global curriculum changed
- The draft is sitting in the review queue waiting for director approval

**Say:**
> "A draft was created. It's in the Review Queue. Until I go there and explicitly approve it, the curriculum stays exactly as it was."

---

### Step 6 — Show the Review Queue (optional)

**Navigate to:** Review Queue (if accessible in the demo)

**Say:**
> "Here's the draft. I can read it, modify it, approve it, or reject it. The system never applies it automatically."

---

### Step 7 — Open a demo session

**Navigate to:** `/director/sessions/[demo-session-id]`

(Find the demo session ID from the demo sandbox cards on `/director/demo`)

**Say:**
> "Now let's say the coach just finished a session and wants to log what happened. Coaches often forget things between the court and the computer. With voice, they can just say it while it's fresh."

---

### Step 8 — Speak a session recap

**Scroll to:** COACH RECAP section

**Click:** "Start speaking"

**Say into microphone:**
> "Everyone was here except Sarah. Mia improved recovery after wide balls. Leo still needs better contact spacing."

**Point out after speaking:**
- Transcript appears in text box
- Demo prompt suggestion visible above the text box
- Text is editable before saving

**Say:**
> "The system captured exactly what the coach said. Names, observations, attendance — it's all there. But again, nothing has been recorded yet. The coach reviews, edits if needed, then saves."

---

### Step 9 — Save the recap

**Click:** "Save Recap"

**Point out:**
- Success message appears
- Recap saved to history
- "Structure Recap" button now appears (if the StructureRecapButton shows)

**Say:**
> "The recap is saved as raw text. Now the coach can optionally ask the system to structure it — pull out attendance notes, player observations, a parent-safe draft. But that's also just a draft. The director sees it before anything goes to parents or updates a player profile."

---

### Step 10 — Explain the system

**Say:**
> "Here's the operating model. Voice captures your intent as text. The system structures it into a draft. You review and approve the draft. Only then does anything change. No surprises, no invisible mutations, no AI acting on its own."

**Say:**
> "This means a new coach can use voice freely without worrying about accidentally moving a player's level or sending the wrong thing to a parent. The director is always in the loop."

---

## Key talking points

| Moment | What to say |
|---|---|
| Transcript appears | "See exactly what it heard — fully editable before you do anything." |
| After submit | "A draft, not a live change. Sitting in the queue for review." |
| Recap saved | "Raw text saved. Structuring is optional. Director approves before anything reaches a player or parent." |
| No AI | "No external AI was called. All structuring is deterministic rule-based logic. Fast, auditable, no hallucinations." |
| Fallback | "If a coach prefers typing, it works exactly the same. Voice is just faster." |

---

## What NOT to say

- Do not say "the AI understands your intent" — the V1 structuring is rule-based, not AI
- Do not say voice is "automatic" — always emphasize the human review step
- Do not say "real-time updates" — changes require explicit approval
