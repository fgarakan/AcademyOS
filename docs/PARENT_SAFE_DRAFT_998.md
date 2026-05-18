# Parent-Safe Draft Summary
Sprint 998 — 2026-05-18

## Overview

Created `src/components/coach/CoachParentSafeDraftCard.tsx` — a display component for parent-safe session summaries generated from wrap-up answers. Nothing is sent automatically; director approves and sends manually. Raw coach notes are never included in the parent-facing content.

## Files Created

| File | Purpose |
|---|---|
| `src/components/coach/CoachParentSafeDraftCard.tsx` | Parent-safe draft card + list; status tracking; safety notices throughout |

## ParentSafeDraft Interface

```typescript
interface ParentSafeDraft {
  id: string
  playerName: string
  sessionName: string
  sessionDate: string | null
  status: ParentSafeDraftStatus   // 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent'
  sections: ParentSafeDraftSection[]
  coachNote: string | null        // internal only, never shown to parent
  directorNote: string | null     // shown on rejection or approval
  generatedAt: string
}
```

## Status Values

| Status | Color | Meaning |
|---|---|---|
| `draft` | Muted | Generated, not yet submitted for review |
| `pending_approval` | Orange | Submitted; director has not yet reviewed |
| `approved` | Green | Director approved — can be sent |
| `rejected` | Red | Director rejected with feedback |
| `sent` | Blue | Sent to parent |

## Component Features

- Header: player name, session name + date, status pill
- Internal-only lock notice when draft or pending_approval
- Sections list (label + content) — parent-facing text only
- Coach note section (internal, italic, muted) — never included in parent send
- Director feedback box on rejection (red) or approval (green)
- Safety notice: "Nothing is sent to parents automatically. Director approves and sends manually. Raw coach notes are never included."
- Generated timestamp footer
- List: pending count banner, no truncation (all shown)

## Safety Guardrails

- Display-only — no server actions, no writes
- Internal-only lock notice prevents coach from assuming parent can see draft/pending content
- Raw coach notes are visually separated and labeled "Internal" — not part of parent sections
- Safety notice visible on every card
- No send button on component — sending is a director action only
- `sent` status is the only state that confirms parent visibility
