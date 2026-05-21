# DONNA Director COO Briefing

> Sprint 464 — Director COO Briefing V1
> See also: `src/lib/donna/briefings/directorBriefing.ts`, `src/lib/donna/commandBriefPrompt.ts`

---

## What is the director briefing?

The director briefing is DONNA's daily opening summary — surfaced on the dashboard and available on demand. It answers: "What needs my attention right now?"

---

## Briefing sections

| Section | Status | Link |
|---|---|---|
| Today's sessions | Live | /director/today |
| Missing recaps | Live (count from sessions table) | /director/sessions |
| Pending approvals | Live (proposed_actions count) | /director/review |
| High-risk player signals | Live (v_player_signal_dashboard) | /director/signals |
| Parent drafts awaiting review | Live | /director/review |
| Curriculum gaps | Partial | /director/curriculum/builder |
| Players pending placement | Live | /director/players |

---

## Headline logic

1. If any section is urgent → "N urgent items need your attention."
2. Else if any section is attention → "N items worth reviewing today."
3. Else if queue is clear + sessions today → "N sessions today, everything on track."
4. Else → "Academy looks good today."

---

## Briefing builder

`buildDirectorDailyBriefing()` in `src/lib/donna/briefings/directorBriefing.ts`:
- Accepts pre-fetched counts
- Returns `DirectorDailyBriefing` with sections, headline, urgentCount, suggestedFirstAction
- Pure — no DB calls

Caller must fetch all counts in parallel before calling the builder.

---

## Existing related modules

- `src/lib/donna/commandBriefPrompt.ts` — short prompt string for the command center card
- `src/lib/donna/commandBriefLiveLoader.ts` — live data loader for the command brief
- `src/lib/donna/donnaDailyGreeting.ts` — DONNA greeting text
- `src/lib/donna/donnaDailyOperatingLoop.ts` — daily loop logic for recurring checks
