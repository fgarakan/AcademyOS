# Sprint 1058 — Player Pathway Evidence Cards V1

## What was built

Three director-facing pathway evidence summary cards (Skill / Competition / Fitness) added above the Evidence Timeline in the player profile Notes tab.

## Files created

- `src/components/player/PlayerPathwayEvidenceCards.tsx` — three-column card grid

## Files modified

- `src/app/director/players/[playerId]/page.tsx` — imports component and `getPlayerPathwayEvidence`; fetches pathway data in Tab 5 section; renders cards between Evidence Hub Header and Evidence Timeline

## Component behavior

Each `PathwayCard` shows:
- Pathway icon + label + current focus (if available)
- Observation count (mono, accent color)
- Latest evidence: content snippet, date, coach name
- Missing evidence alert if no observations recorded
- "Recommended: record a [pathway] observation" copy if empty
- "Coach observations / Director review required" footer labels

Pathway routing uses `SKILL_OBS_TYPES`, `COMPETITION_OBS_TYPES`, `FITNESS_OBS_TYPES` from the repository's internal classification.

Current focus sources:
- Skill: `qaCoachLanguage[0].current_focus`
- Competition: `competitionTrackLevelName`
- Fitness: `fitnessPathPhase`

## Safety

- Director-only
- No automatic recommendations become official
- No level movement
- No parent/player exposure
- Raw coach observation content shown (internal — director context)

## TypeScript

Clean.
