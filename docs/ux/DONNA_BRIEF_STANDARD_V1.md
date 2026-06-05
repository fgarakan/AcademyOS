# DONNA Brief Standard V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2196–2215 — DONNA Surface Unification V1
**Purpose:** Define the standard for all page-level DONNA briefs across AcademyOS.

---

## What Is a DONNA Brief?

A DONNA Brief is a single, embedded read-only intelligence surface on a page. It surfaces the most important signal DONNA has for the current page context.

It is not:
- An interactive chat interface
- A command bar
- A list of recommendations
- A status bar
- A greeting
- A second DONNA

It is:
- One (1) conclusive statement about the current page context
- One (1) supporting detail or call to action
- Zero repeated information from other DONNA surfaces

---

## The Standard

Every DONNA Brief must conform to:

| Rule | Requirement |
|---|---|
| Maximum sentences | 2 |
| Maximum CTAs | 1 |
| Duplication | Zero — brief content must not repeat other visible surfaces |
| Data source | Real data only — no placeholders, no fake signals |
| Lead | Conclusion first, not context first |
| Tone | Direct, confident, honest |
| Confidence | If data is thin, say so: "Only 2 sessions recorded — signals may not be representative." |

---

## Brief Per Route

### `/director` — DONNA Daily Brief

**Component:** `DirectorTodayDonnaBrief`
**Content:** Academy status + most important action today.

> "3 wrap-ups need review before tomorrow. Your review queue is the priority."
> → [Open Review Queue]

Rules:
- Line 1: Overall academy status in one sentence
- Line 2: The highest-priority action and why
- CTA: Opens the review queue or the relevant action
- Never includes: session counts, attendance breakdowns, KPI lists

---

### `/director/today` — DONNA Priority Brief

**Component:** `DonnaTodayBriefPanel`
**Content:** Top priority + what makes it urgent.

> "Lucas has missed 3 sessions in a row. A check-in before Friday's session would prevent a dropout risk."
> → [View Player]

Rules:
- One player, group, or operational signal — not a list
- Urgency must be explicit (timing, consequence, or threshold)
- CTA: Links to the relevant record or action

---

### `/director/curriculum` — DONNA Curriculum Brief

**Component:** `DonnaCurriculumBrief`
**Content:** Most blocked curriculum level + the blocker.

> "Orange Ball 2 has 4 students stalled on the cross-court gate (avg 187 days). Gate review recommended."
> → [Review Level →]

Rules:
- Names the specific level and the specific gate
- States the stall count and duration
- CTA: Opens the curriculum level with `?improve=` parameter
- Never includes: overall curriculum health score, a list of all levels, generic "curriculum looks good"

---

### `/director/review` — DONNA Review Brief

**Component:** `DonnaReviewBriefPanel`
**Content:** Queue status + which item needs the most attention.

> "5 items in queue. Coach Martinez's wrap-up has the earliest expiry — review first."
> → [Go to Wrap-Up]

Rules:
- States total count + the one highest-priority item
- Priority basis must be explicit (expiry, risk, impact)
- CTA: Jumps to the specific item
- Never includes: a list of all items, tab counts, general "review queue has items"

---

### `/director/players` — DONNA Players Brief

**Component:** `DonnaScreenBriefStatic`
**Content:** Most actionable player population signal.

> "4 players have no curriculum level assigned. Placement Engine is the fastest path."
> → [Open Placement Engine]

Rules:
- States a specific actionable condition and count
- CTA: Opens the tool to address it
- Never includes: total player count, attendance summaries, general coaching notes

---

### `/director/templates` — DONNA Templates Brief

**Component:** `TemplatesDonnaPanel`
**Content:** Template compliance status + the specific gap.

> "3 class templates have no curriculum level assigned. Sessions run from these templates won't contribute to level progress tracking."
> → [Assign Levels →]

Rules:
- Specific gap count + consequence of leaving it unresolved
- CTA: Opens the assignment flow

---

### `/director/sessions` — DONNA Sessions Brief

**Content:** Session coverage status + the gap.

> "2 of today's 4 sessions have no wrap-up submitted. Coach recap window closes in 3 hours."
> → [Review Sessions]

Rules:
- Time-sensitive content only
- CTA: Goes to the sessions needing action

---

## What a Brief Must NOT Do

| Prohibited | Reason |
|---|---|
| Show more than 2 sentences | Exceeds reading budget; directors scan, they don't read |
| Show more than 1 CTA | Two CTAs creates a decision — briefs should not create decisions |
| Repeat a signal already shown on the page | Duplication erodes trust (if DONNA says it twice, which is right?) |
| Use hedging language | "You may want to consider..." belongs in conversation, not a brief |
| Show a confidence badge | Translate confidence into plain language in the sentence itself |
| Show a source label | Translate data source into plain language in the sentence itself |
| Say "DONNA recommends" | The brief IS DONNA's voice — labeling it redundant |
| Show when data is unavailable | Show an honest empty state: "Academy is new — I'll surface patterns after your first week of sessions." |

---

## Empty State Standard

When DONNA has no signal for a page brief:

> "Your academy is active. I'll surface patterns here as sessions and assessments accumulate."

Or for a specific context:

> "No players need attention right now. Check back after today's sessions."

Never:
- "No DONNA recommendation available"
- "DONNA data unavailable"
- A blank card with a spinner

---

## Validation Checklist

Before shipping a DONNA Brief component, confirm:

- [ ] Maximum 2 sentences
- [ ] Maximum 1 CTA
- [ ] Conclusion-first (not "Your players have..." but "Lucas needs attention...")
- [ ] No confidence badges in the brief
- [ ] No source labels in the brief
- [ ] No data listed — DONNA concludes, the UI lists
- [ ] Empty state is honest and human-language
- [ ] Brief content does not repeat what's already on the page
