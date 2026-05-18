# Coach DONNA Session Assistant
Sprint 1007 — 2026-05-18

## Summary

Created `src/components/donna/CoachDonnaSessionPanel.tsx` — compact DONNA sidebar panel for coach session detail pages.

## What It Shows

- DONNA greeting with session name
- Curriculum level chip
- Template name chip
- Player count + block count
- Today's curriculum focus (lime callout)
- Watch-fors list (max 2 visible, expandable)
- 4 quick actions: Start Session, Capture Note, Flag Concern, Start Wrap-Up

## Quick Action Kinds

| Action | Kind | Behavior |
|---|---|---|
| Start session | safe_read | href to /execute route |
| Capture note | draft_only | onClick callback; note shown "draft only" |
| Flag a player concern | draft_only | draft — requires director review |
| Start wrap-up | safe_read | href to /wrap-up route — lime highlight |

## Relation to Existing Infrastructure

- `CoachSessionVoiceShell` (Sprint 613) — full voice + intent + command flow; `CoachDonnaSessionPanel` is a simpler display panel with quick-action buttons. The two can coexist on the same page.
- `CoachPlayerWatchList` (Sprint 990) — player-level attention flags; this panel shows curriculum-level watch-fors (what to observe this block type).

## Usage

Intended for placement in the sidebar or bottom panel of `/coach/sessions/[sessionId]`.

Props: `SessionContext` (session name, template, level, blockCount, playerCount, curriculumFocus, watchFors), `wrapUpHref`, `executeHref`, optional `onCaptureNote` callback.
