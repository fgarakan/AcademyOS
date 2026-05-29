# DONNA Tool Calling Contract V1
**Date:** 2026-05-29
**Sprint:** 942
**Status:** Complete

---

## What Was Built

`src/lib/donna/donnaToolContract.ts` — defines the five tool categories, 18 tools, structured output schema, and validation helpers.

---

## Tool Categories

| Category | Safety Level | Description |
|---|---|---|
| `read` | immediate | Safe read-only data access — no state change |
| `ui_guidance` | immediate | Navigate, highlight, explain — no state change |
| `draft` | draft_to_review | Creates proposed_actions row — director reviews |
| `approval_required` | director_approval | Routes to review queue — director must click |
| `always_blocked` | blocked | Never callable regardless of context |

---

## Tool Registry (18 tools)

### Read (5)
- `read_page_context` — page capability map
- `read_pending_review_count` — director only
- `read_academy_kpis` — director only
- `read_player_context` — director + coach, never to parents/players
- `read_coach_sessions` — coach only

### UI Guidance (3)
- `navigate_to_page` — all roles
- `highlight_element` — director + coach
- `explain_page_element` — all roles

### Draft (5) — all require approval
- `draft_attendance_exception` — director + coach
- `draft_coach_note` — director + coach
- `draft_parent_summary` — director only; `affectsParentOrPlayerVisibility: true`
- `draft_curriculum_item` — director only
- `draft_player_advancement` — director only; `affectsParentOrPlayerVisibility: true`

### Approval Required (2)
- `approve_review_item` — director only (routes to queue; DONNA never executes)
- `move_player_level` — director only (draft only; `finalize_player_placement()` is execution path)

### Always Blocked (3)
- `send_parent_message_direct` — never; DONNA never auto-sends
- `delete_record` — never; manual UI only
- `bypass_review_queue` — architecture invariant

---

## Structured Output Schema

```typescript
interface DonnaStructuredOutput {
  spokenAnswer: string
  reasoningSummary: string
  recommendedAction: {
    toolId: string | null
    description: string
    href: string | null
    requiresConfirmation: boolean
  } | null
  uiHighlight: {
    targetId: string
    label: string
    route: string
  } | null
  safety: {
    category: DonnaToolCategory
    safetyLevel: DonnaToolSafetyLevel
    blockedReason: string | null
  }
  toolRequest: {
    toolId: string
    params: Record<string, unknown>
  } | null
  confidence: 'high' | 'partial' | 'blocked'
  sourceNote: string | null
}
```

---

## Validation

`validateDonnaOutput(raw)` — validates a raw output object:
- `spokenAnswer` must be a non-empty string
- `confidence` must be `'high' | 'partial' | 'blocked'`
- `safety.category` and `safety.safetyLevel` must be valid enum values
- Returns `{ valid, output, errors }`

---

## Lookup Helpers

```typescript
getDonnaTool(id): DonnaTool | undefined
getToolsByCategory(category): DonnaTool[]
isToolAllowedForRole(toolId, role): boolean
isToolBlocked(toolId): boolean
buildBlockedToolResponse(toolId): DonnaStructuredOutput
```

---

## Next Sprint — Sprint 943

Build `donnaSafeActionRouter.ts` — routes DONNA tool requests through safety levels, validates role permissions, integrates with approval gate for `draft` and `approval_required` tools, and returns safe responses for `always_blocked` tools.
