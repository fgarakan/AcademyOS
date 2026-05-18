# Curriculum Evidence Draft Links
Sprint 997 — 2026-05-18

## Overview

Created `src/components/coach/CoachCurriculumEvidenceDraftCard.tsx` — a display component for curriculum gate evidence links suggested from wrap-up answers. Draft only; requires director review before linking to any gate or triggering level movement.

## Files Created

| File | Purpose |
|---|---|
| `src/components/coach/CoachCurriculumEvidenceDraftCard.tsx` | Evidence draft card + list component; collapsible gate criteria; confidence indicator; safety notice |

## CurriculumGateEvidence Interface

```typescript
interface CurriculumGateEvidence {
  id: string
  playerName: string
  curriculumLevel: string
  gateLabel: string
  gateCriteria: string
  evidenceExcerpt: string
  sourceQuestion: string
  confidence: EvidenceConfidence   // 'high' | 'medium' | 'low'
  status: EvidenceStatus           // 'suggested' | 'pending_review' | 'accepted' | 'rejected'
  coachNote: string | null
}
```

## Component Features

- Header: curriculum level, player name, status pill (suggested/pending/accepted/rejected)
- Gate criterion box with collapsible full criteria text
- Evidence excerpt with source question label (from wrap-up question key)
- Confidence dot + label; low confidence surfaces "additional observation recommended"
- Safety notice: "Suggested only — director review required before linking to any curriculum gate or triggering level movement."
- List: pending count banner, max 3 shown, "Show N more" button

## Safety Guardrails

- Display-only — no server actions, no writes
- No automatic level movement — safety notice is non-removable
- Low-confidence evidence explicitly flags as needing more observation
- All status transitions happen outside this component (director review queue)
- Director review required before evidence reaches player profile
