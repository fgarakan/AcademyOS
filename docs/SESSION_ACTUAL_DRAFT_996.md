# Session Actual Draft Card
Sprint 996 — 2026-05-18

## Overview

Created `src/components/coach/CoachSessionActualDraftCard.tsx` — a structured display card for session actual drafts, showing planned-vs-actual block outcomes (completed / skipped / modified) with counts, block list, overall note, next focus, attendance summary, and a draft disclaimer.

## Files Created

| File | Purpose |
|---|---|
| `src/components/coach/CoachSessionActualDraftCard.tsx` | Draft card + status pill; shows block completion breakdown and issue flags |

## SessionActualDraft Interface

```typescript
interface SessionActualDraft {
  draftId: string | null
  sessionId: string
  sessionName: string
  scheduledDate: string | null
  curriculumLevel: string | null
  templateName: string | null
  blocks: SessionActualBlockDraft[]
  overallNote: string | null
  nextFocus: string | null
  attendanceSummary: string | null
  submittedAt: string | null
  status: 'draft' | 'pending_review' | 'approved' | 'applied'
}
```

## Block Status Values

| Status | Icon | Color |
|---|---|---|
| `completed` | CheckCircle | Green |
| `skipped` | SkipForward | Muted |
| `modified` | Edit | Orange |

## Component Features

- Header: session name, date chip, curriculum level (lime), template name
- Draft status pill: draft / pending review / approved / applied
- Planned vs Actual stats: Done / Modified / Skipped count chips
- Block list: shows only issues (skipped/modified) by default; `showFullBlocks` prop reveals all
- Overall note section
- Next focus box (lime Target icon)
- Attendance summary line
- Orange warning banner when issues exist + status is pending_review
- Draft notice footer: "Draft only — not applied to session records until director approves."

## Safety Guardrails

- Display-only — no server actions, no writes
- Draft disclaimer on every card
- Warning banner makes clear that skipped/modified blocks require director review before applying
- No auto-approval path in component
