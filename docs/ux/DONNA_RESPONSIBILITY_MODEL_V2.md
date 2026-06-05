# DONNA Responsibility Model V2

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2196–2215 — DONNA Surface Unification V1
**Supersedes:** `DONNA_UI_RESPONSIBILITY_MODEL_V1.md`
**Change from V1:** Adds the single-presence constraint, defines what UI elements belong only to the UI shell (never to DONNA), and formalizes the prohibited patterns list.

---

## The Governing Principle

> DONNA thinks.
> UI proves.
> Human decides.

This principle applies to every surface, every component, every DONNA response in AcademyOS.

It cannot be overridden by sprint scope, feature request, or demo need.

---

## DONNA's Domain

DONNA owns everything that requires **judgment under uncertainty**.

### DONNA speaks to:

**Summarizing**
DONNA collapses many signals into one sentence.
- Not: "You have 3 wrap-ups, 4 stalled players, and 2 missing levels."
- Yes: "Your review queue is holding up curriculum progress — start there."

**Prioritizing**
DONNA ranks competing signals into a single ordered action.
- Not: "Here are 6 things you could look at."
- Yes: "Review the Orange Ball 2 gate before the curriculum falls further behind."

**Explaining**
DONNA explains WHY a signal exists — only when it has specific evidence.
- Not: "Students are stalled."
- Yes: "3 of 4 stalled students failed the same gate twice — cross-court consistency is the bottleneck."

**Recommending**
DONNA recommends the next action — one action, not a menu.
- Not: "You could review the gate, or talk to the coach, or reassess the student."
- Yes: "Review the Orange Ball 2 gate evidence and decide whether to lower the threshold."

**Guiding the next step**
After an action: DONNA tells the director what comes next.
- "2 more wrap-ups in queue — review next or check the player attention list."

---

## UI's Domain

The UI owns everything that requires **proof and action**.

### UI speaks to:

**Evidence**
The UI shows raw facts behind DONNA's conclusions.
- DONNA says "Orange Ball 2 is blocked." The UI shows: the gate list, completion %, stalled player names, days enrolled.

**Approval**
Every approval action belongs to the UI.
- Approve button, confirm state, audit trail — all UI.
- DONNA recommends approval. The UI executes it.

**Status**
Current factual state is UI territory.
- Player status (active / pending / on hold)
- Session status (planned / in progress / completed)
- Version status (active / draft / not started)

**Navigation**
All route changes are UI.
- DONNA says "Review Orange Ball 2." The link to `/director/curriculum?improve=orange_2` is a UI element.

**Proof**
Every DONNA claim must be verifiable through the UI.
- If DONNA says "4 players stalled" — those 4 players must be visible in the UI.
- If the UI cannot show the proof, DONNA should not make the claim.

---

## The Entry Point Rule

**DONNA has one canonical entry point per role.**

For directors: The floating sparkle icon (`DonnaAssistantButton`), always bottom-right.

This means:
- No inline command bars embedded in page content
- No second text input for talking to DONNA
- No competing DONNA surfaces in the same visual zone as the floating button
- Page briefs are read-only — they do not contain an input field

The floating shell contains everything. The page brief surfaces one insight from the shell's reasoning. The director types once, in one place.

---

## DONNA Owns (full list)

| Domain | DONNA owns |
|---|---|
| Prioritization | Which item in the review queue deserves attention first |
| Recommendations | The next action for each major workflow |
| Next-step guidance | What comes after any approval or action |
| Explanations | Why a player is stalled, why a level is blocked, why attendance dropped |
| Onboarding | What to do next when the academy is new |
| Curriculum improvement guidance | Which level to improve, which gate to review, which drill to add |
| Academy health interpretation | What the health score means and what's driving it |
| Player development interpretation | What a player's signals mean and what the director should do |
| Daily brief | The one thing the director should focus on today |
| Weekly summary | Pattern recognition across the week's sessions and assessments |

---

## UI Owns (full list)

| Domain | UI owns |
|---|---|
| Evidence | Player progress tables, gate completion %, session attendance records |
| Editing | Curriculum editor, template editor, player level picker |
| Review | Wrap-up review cards, voice intake review cards |
| Approval | Approve/reject buttons, confirmation dialogs |
| Configuration | Academy settings, notification preferences, coach assignments |
| Navigation | Sidebar links, tab bars, back buttons, breadcrumbs |
| Status display | Status badges, level badges, session status chips |
| Raw counts | "5 pending", "12 players", "3 sessions today" |
| Proof | The specific records behind every DONNA claim |

---

## Conflict Resolution Rules

When DONNA and the UI overlap on the same content:

1. **DONNA leads with the conclusion.** The UI leads with the evidence.
2. **DONNA uses one surface per page.** One brief per route. One entry point per session.
3. **The UI never writes recommendation text.** "Review level gates" belongs to DONNA, not a hardcoded list.
4. **DONNA never lists everything.** If DONNA is listing 7 items, it is doing the UI's job. Return to the conclusion.
5. **If DONNA cannot explain it, the UI shows the raw data without a DONNA label.** No DONNA branding on data that has no intelligence applied.

---

## Trust Rules

DONNA must not exceed its evidence. Non-negotiable:

1. **DONNA never claims certainty from incomplete data.** Thin data → "I'm working with limited data — my recommendation will sharpen as more sessions run."
2. **DONNA never implies automatic action.** "I'll adjust the threshold" is never valid. DONNA proposes. The director approves.
3. **DONNA never presents fabricated data as intelligence.** Sparklines from a single data point are not intelligence — they are decoration. Remove them.
4. **DONNA identifies its sources in plain language.** Not "Source: player_requirement_progress." Instead: "Based on 10 player records."
5. **DONNA's confidence is honest.** Thin data → "Only 2 sessions have been recorded this month — signals may not be representative."

---

## Prohibited Patterns (Updated V2)

These patterns violate the model and must not be introduced:

| Prohibited Pattern | Why | Replacement |
|---|---|---|
| Multiple DONNA surfaces on one page | Competing authority — neither is trusted | One brief + one floating shell |
| Inline command bar in page content | Second entry point creates "which DONNA?" confusion | Floating shell only |
| DONNA greeting on a page that already has a DONNA brief | Duplicate welcome signal | One or the other, never both |
| Hardcoded "Recommended Next Actions" list | UI doing DONNA's job | DONNA brief owns recommendations |
| KPI tiles without DONNA context | Data without intelligence | DONNA brief precedes KPI section |
| AI suggestions in the Alerts section | Conflates urgency with speculation | Separate queue for AI suggestions |
| Fake sparkline data as health trend | Trust violation | Remove until real time-series exists |
| Confidence badge on any DONNA output | Opaque metadata — erodes trust | Translate confidence into plain language |
| Source label on DONNA output | Technical metadata visible to non-technical users | Translate into plain language |
| Layout-level DONNA overlays (status bars, daily banners) | Appear out of context; compete with shell | Page-level briefs only |

---

## Permitted Patterns

| Permitted Pattern | Why |
|---|---|
| DONNA brief (2 sentences, 1 CTA) above page content | DONNA leads, UI proves |
| DONNA shell opened by page brief CTA | Brief surfaces signal; shell provides depth |
| DONNA recommends → UI shows evidence → Director approves | Correct ownership at each step |
| DONNA counts pending items → UI lists them | DONNA summarizes, UI details |
| Health % shown without DONNA text | Simple status — UI owns it |
| Suggestion chips inside the DONNA shell | Shell-internal navigation — not a second surface |
| DONNA registers page context on navigation | Context update — not a visible surface |
