# Sprint 1059 — Player Current Priorities Evidence Connection V1

## What was built

A director-facing card that connects each active player priority to supporting coach observations. Each priority shows context, latest linked evidence, confidence signal, next watch-for, and suggested session focus.

## Files created

- `src/components/player/PlayerPriorityEvidenceConnection.tsx` — priority-to-evidence connection panel
- `docs/PLAYER_CURRENT_PRIORITIES_EVIDENCE_CONNECTION_1059.md` — sprint doc

## Files modified

- `src/app/director/players/[playerId]/page.tsx` — imports component; renders it between Evidence Hub Header and Pathway Cards; passes `activePriorities` and combined pathway observations

## Component behavior

Per active priority card shows:
- Rank badge, title, category label, urgency badge
- Why this priority exists (description)
- Latest supporting observation (content, type, date, coach name)
- Missing evidence alert if no matching observations
- Confidence label: partial (N observations) or insufficient
- Next coach watch-for: contextual copy by category
- Next suggested session focus: derived from priority description
- Source label: "player_priorities + coach_observations — Director view"

Evidence linking: category mapped to observation types (technical -> technical/positive_highlight/general, fitness -> fitness/load/movement/recovery, etc.)

Accepts local `PriorityRow` interface (compatible with `PlayerPriorityRow` used in page.tsx).

## Safety

- Director-only
- No automatic priority update
- No parent/player exposure
- No level movement
- Explicit footer: "No parent/player exposure. Director review required."

## TypeScript

Clean.
