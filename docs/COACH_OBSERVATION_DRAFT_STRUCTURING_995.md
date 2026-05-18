# Coach Observation Draft Structuring
Sprint 995 — 2026-05-18

## Overview

Created `src/components/coach/CoachObservationDraftCard.tsx` — a rich observation draft display component with pathway, evidence flag, urgency, parent-safe flag, director review flag, confidence label, and suggested next focus. Replaces the basic observation type label with a structured draft card.

## Files Created

| File | Purpose |
|---|---|
| `src/components/coach/CoachObservationDraftCard.tsx` | Single draft card + list component with edit/delete callbacks |

## ObservationDraft Interface

```typescript
interface ObservationDraft {
  id: string
  playerName: string
  pathway: 'Skill' | 'Competition' | 'Fitness' | 'Mindset' | null
  observationType: 'strength' | 'growth_area' | 'concern' | 'context'
  evidenceNote: string
  urgency: 'low' | 'medium' | 'high'
  parentSafe: boolean
  directorReview: boolean
  suggestedNextFocus: string | null
  confidenceLabel: 'high' | 'medium' | 'low' | null
}
```

## Observation Types

| Type | Color | Icon |
|---|---|---|
| `strength` | Green | Star |
| `growth_area` | Blue | TrendingUp |
| `concern` | Red | AlertTriangle |
| `context` | Muted | Lightbulb |

## Component Features

- Type chip (colored) + pathway chip (muted) + urgency badge
- Evidence note body text
- Suggested next focus box (lime label)
- Flags row: confidence label, parent-safe / internal-only, director review
- Edit + delete callback buttons
- Draft disclaimer: "Requires director approval before any profile update."
- List component: shows max 3, "Show N more" button

## Safety Guardrails

- `parentSafe: false` renders "Internal only" — clear signal to coach
- `directorReview: true` renders orange "Director review" flag
- Draft disclaimer on every card — coach sees "director approval required" before submitting
- No writes — component is display-only

## Integration

Available for use in:
- The wrap-up review page (Sprint 999)
- A future player profile coach view
- The session detail page "Observations" section (future sprint)
