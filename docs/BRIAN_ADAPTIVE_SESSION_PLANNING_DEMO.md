# Brian Demo: Adaptive Session Planning V1

**Sprint:** 100
**Date:** 2026-05-01

---

## The Idea in One Sentence

The OS reads your actual class roster — each player's strengths, focus areas, priorities, curriculum level — and suggests specific adjustments to today's session plan. The coach stays in control. Nothing changes without approval.

---

## Demo Script

### Step 1: Open a curriculum-aware template

Navigate to `/director/fitness/templates/[templateId]`.

Point out:
- The curriculum level it's linked to (e.g. "Orange Ball — Building Stage")
- The blocks: Warm-Up → Technical Drill → Return/Serve Game → Competition

---

### Step 2: Open a session generated from that template

Navigate to `/director/sessions/[sessionId]`.

Point out at the top:
- **Curriculum Focus section** — shows the level, stage, and any academy customizations
- **Coach Briefing** — deterministic synthesis of who needs what today

---

### Step 3: Show class roster intelligence

Scroll to **CLASS ROSTER INTELLIGENCE**.

Point out:
- Each player's curriculum level
- Each player's strengths and things to work on
- Their active priorities
- "Deterministic — reads real data" note

---

### Step 4: Generate suggestions

Scroll to **SUGGESTED ADJUSTMENTS**.

Click **"Generate Suggestions for This Class"**.

The system reads:
- Roster + attendance
- Player development summaries
- Player priorities
- Academy curriculum overrides
- Session blocks

And returns up to 8 concrete coaching suggestions in seconds.

---

### Step 5: Show the suggestion cards

Walk through 2–3 suggestion cards:

**Recovery Break** (if 2+ players have stamina needs):
> "Add a recovery break between rallies: require players to touch the back fence before the next point. Reduce rally length to 4–6 balls."
> Players supported: [names]. Risk: Low. Confidence: High.

**Simplified Return Drill** (if 2+ players have return readiness needs):
> "Start with slow, high-bouncing feeds before live serve. Allow catch-and-hold after each return."
> Target block: Return/Serve Game.

**Watch-For Cue** (spacing/footwork):
> "Watch for: court positioning and recovery steps after each shot. Consider adding a cone at the T."

For each, expand the card to show:
- Players supported
- Diff preview (before/after block notes)
- Risk level + confidence

---

### Step 6: Approve one suggestion

Click **Approve** on one card (e.g. the Watch-For Cue).

Status changes to **Approved** in green.

---

### Step 7: Apply it

Click **Apply to Session**.

The system appends `[Adaptive Adjustment]` text to that session block's notes only.

Status changes to **Applied**.

---

### Step 8: Confirm session-only change

Go back to the SESSION BLOCKS section.

Show the block's notes now include the adaptive adjustment text.

Key point: **This is the session copy, not the master template.**

---

### Step 9: Confirm master template unchanged

Navigate to `/director/fitness/templates/[templateId]`.

Show the template blocks — **no adaptive adjustment text in the template**.

---

### Step 10: Confirm player records unchanged

Navigate to any player profile.

Show:
- Development summary unchanged
- Priorities unchanged
- Curriculum level unchanged
- No "AI applied" evidence — no fake notes

---

## What to Say

> "The OS knows which kids are coming today, what they've been working on, and where they are in the curriculum. Instead of a generic plan, it suggests three or four things you might do differently — add a cone drill for the kids working on footwork, simplify the serve return for the players who aren't ready for live serve yet, maybe a small class scoring format if only three showed up.
>
> But the coach doesn't just get told what to do. They read it, approve what makes sense, skip what doesn't. And when they apply it, it goes on today's session only — the template stays clean for next week."

---

## Key System Properties

| Property | How It Works |
|---|---|
| No AI | Deterministic rule engine reads real DB fields |
| No fake data | All player needs/strengths come from actual records |
| No auto-apply | Every suggestion starts as `pending_review` |
| Session-only | Applying writes to `session_blocks.notes` only |
| Template protected | `template_blocks` never touched |
| Player-record-safe | No mutations to player profiles, levels, or evidence |
| Coach in control | Approve → Apply is always explicit |

