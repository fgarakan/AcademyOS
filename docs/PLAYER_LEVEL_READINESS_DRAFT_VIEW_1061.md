# Sprint 1061 — Player Level Readiness Draft View V1

## What was built

Director-facing level readiness draft view showing current/next level, readiness confidence, supporting evidence, missing evidence, and a DONNA draft summary panel. All CTAs are local/visual only — no actual level movement.

## Files created

- `src/components/player/PlayerLevelReadinessDraftView.tsx` — dismissible readiness draft card
- `docs/PLAYER_LEVEL_READINESS_DRAFT_VIEW_1061.md` — sprint doc

## Files modified

- `src/app/director/players/[playerId]/page.tsx` — imports and renders above Gate Evidence Panel

## Component behavior

Props: currentLevelName, nextLevelName, evidenceSummary, gates, gateStatuses, playerFirstName.

Sections:
- Level summary strip (current -> next)
- Readiness confidence: derived from gate pass ratio (60% weight) + evidence count (40% weight). Labels: Strong/Moderate/Early stage.
- Evidence supporting: passed gates (green) + gates with partial evidence (orange)
- Evidence missing: unpassed gates with zero evidence (neutral)
- DONNA draft: shown on "Ask DONNA" click. Deterministic copy from gate/evidence counts. Labeled "DONNA Draft — Requires director review before any action". Not sent anywhere.
- CTAs: Ask DONNA (toggles draft), Create Review Draft (visual only), Not now (dismisses card)
- Footer: "No automatic level movement. All decisions require director review."

Client component (`'use client'`) for dismiss/DONNA toggle. No server mutations.

## Safety

- Director-only
- No actual level movement
- No automatic approval
- DONNA draft is local-only, clearly labeled as draft requiring review
- Dismissible — not persistent
- No parent/player exposure

## TypeScript

Clean.
