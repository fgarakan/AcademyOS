# Sprint 1060 — Player Curriculum Gate Evidence Panel V1

## What was built

Director-facing panel showing curriculum advancement gates for the player's current level, with per-gate evidence status derived from existing `playerGateStatuses` data.

## Files created

- `src/components/player/PlayerCurriculumGateEvidencePanel.tsx` — gate evidence status panel
- `docs/PLAYER_CURRICULUM_GATE_EVIDENCE_PANEL_1060.md` — sprint doc

## Files modified

- `src/app/director/players/[playerId]/page.tsx` — imports component; renders it between Evidence Hub Header and Priority Evidence Connection

## Component behavior

Header: current level -> next level, gates passed count.

Overview strip: Passed / With Evidence / No Evidence counts.

Per-gate rows: criterion text, domain, gate_type, threshold, evidence count, last evidence date. Evidence status derived:
- no_evidence (0 obs, no status)
- partial (1-2 obs)
- strong (3+ obs)
- needs_review
- director_passed (status=passed)
- director_blocked (status=blocked)

Uses `levelGates` (already fetched) and `playerGateStatuses` (already fetched) — zero additional DB calls.

Empty state if no level assigned or no gates defined.

## Safety

- Director-only
- No writes
- No parent/player exposure
- No automatic level movement
- Explicit footer: "Director review required. No automatic level movement."

## TypeScript

Clean.
