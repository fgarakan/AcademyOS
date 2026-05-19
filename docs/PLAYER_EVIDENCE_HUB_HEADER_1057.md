# Sprint 1057 — Player Evidence Hub Header Card V1

## What was built

Created a compact director-facing Evidence Hub Header card that sits above `PlayerEvidenceTimeline` in the Notes tab of the player profile.

## Files created

- `src/components/player/PlayerEvidenceHubHeader.tsx` — aggregate summary card

## Files modified

- `src/app/director/players/[playerId]/page.tsx` — imports `PlayerEvidenceHubHeader` and `getPlayerEvidenceSummary`; fetches summary in Tab 5 data section; renders header above timeline

## Component behavior

Props: `summary: PlayerEvidenceSummary | null`, `isSchemaMissing: boolean`

States:
- Schema missing: orange warning banner, no counts shown
- No summary: minimal fallback
- Live: full card with stats

Stats shown:
- Total evidence (observations + requirement evidence links)
- Last 30 days count
- Active priorities count
- Coach observations count
- Requirement evidence count
- Parent-safe evidence count (blue, eye icon)
- Internal-only count (lock icon)
- Gates with evidence / total gates (if gates exist)

Footer: "Parent visibility requires approval. No automatic level movement."

## Safety

- Director view only
- No mutations
- No parent/player exposure
- No automatic level movement
- No misleading language ("ready to move up", "published", etc.)
- Schema gracefully degrades

## TypeScript

Clean.
