# Sprint 966 — DONNA Director Daily Brief V1

**Sprint:** 966  
**Date:** 2026-05-30  
**Status:** Complete

---

## What this sprint does

Exposes the existing DONNA daily brief through page-aware chips in the DONNA side panel. No new API, no new voice path, no new DONNA surface was created.

---

## Architecture principle

> Existing /api/donna/brief already generates the daily brief.  
> Existing handleFetchDailyBrief already fetches, renders, and speaks the brief through speakDonna.  
> Sprint 966 only exposes the brief through page-aware DONNA panel chips.

---

## What was NOT created

- No new API endpoint
- No new voice path
- No new DONNA surface
- No new component
- No schema change
- No migration
- No permission change

---

## What was changed

### 1. `src/lib/donna/donnaPageChipRegistry.ts`

Added `'brief'` to `DonnaChipActionType` union.

Added brief chips to four safe director routes:

| Route | Chip ID | Label |
|---|---|---|
| `/director` | `dir-brief-walk` | Walk me through academy priorities |
| `/director` | `dir-brief-attention` | What needs my attention? |
| `/director/review` | `rev-brief` | Show daily brief |
| `/director/sessions` | `ses-brief` | Show daily brief |
| `/director/players` | `plist-brief` | Show daily brief |

Brief chips do not appear on:
- Player profile detail pages (`/director/players/[id]`) — prefix route, no brief chip
- Class template routes — not a daily brief surface
- Curriculum routes — not a daily brief surface
- Any coach, player, or parent route

### 2. `src/components/donna/DonnaPanelPageChips.tsx`

Added `onBrief?: () => void` prop.

When a chip with `actionType === 'brief'` is clicked, calls `onBrief?.()`.

Brief chips use a slightly brighter lime style (`rgba(200,255,0,0.75)`) compared to prompt chips (`rgba(200,255,0,0.55)`) so they are visually distinguishable as action-oriented chips.

### 3. `src/components/assistant/DonnaAssistantButton.tsx`

Passes `onBrief={() => void handleFetchDailyBrief()}` into `<DonnaPanelPageChips>`.

`handleFetchDailyBrief` (existing, Sprint 369) fetches `/api/donna/brief`, sets `dailyBrief` state, calls `speakDonna(voiceSummary)` for spoken output, and sets `sessionIntentContext` for follow-up resolution. `DonnaWorkflowCards` renders the resulting `DailyBrief` object — no changes to either component.

---

## Data sources

Brief chips use the same data sources as the existing `/api/donna/brief` endpoint:
- Director's own academy, scoped by RLS
- Proposed actions pending review
- Session state
- Player signals

No new data access was added. No player names, raw IDs, or sensitive notes are exposed by the chips themselves.

---

## Chip behavior

- Click on a brief chip → calls `handleFetchDailyBrief()` → fetches `/api/donna/brief`
- Loading: `isDailyBriefLoading` state shows loading indicator (existing behavior)
- Success: `dailyBrief` renders in `DonnaWorkflowCards` (existing `DonnaDailyBriefCard`)
- Voice: `speakDonna(voiceSummary)` narrates brief summary (existing Sprint 789 behavior)
- Error: `commandResponse` shows "Brief unavailable — check back later." (existing fallback)
- Empty state: brief renders with empty sections (existing behavior)

---

## Highlight escalation

Brief chips have no `targetId` — they do not trigger highlight escalation. The escalation system (Sprint 964) only applies to `actionType === 'highlight'` chips. Brief chips do not interact with it.

---

## Voice behavior

When a brief chip is clicked:
1. `handleFetchDailyBrief()` fetches the brief
2. On success, `speakDonna(voiceSummary)` narrates the brief summary via server TTS → browser TTS cascade
3. Full brief renders in `DonnaWorkflowCards`
4. Director can click "Walk me through it" in the brief card for full narration (existing Sprint 789 button)

No new voice path was created.

---

## Safety

- No mutations — brief chips are read-only
- No parent/player data exposed — brief is director-scoped by RLS
- No level changes, placements, attendance, billing, curriculum, or session mutations
- No communications sent
- No approval gates bypassed
- Sprint 904 approve/reject behavior untouched
- Sprint 964 highlight chips and escalation untouched
- Sprint 965 voice persona untouched

---

## Future V2 note

Future V2 could unify `buildDirectorDailyBriefing` (library layer) with the `/api/donna/brief` API if a richer personalized brief is desired. Sprint 966 does not attempt this — it uses the existing API as-is.
