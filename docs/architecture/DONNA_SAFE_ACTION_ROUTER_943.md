# DONNA Safe Action Router V1
**Date:** 2026-05-29
**Sprint:** 943
**Status:** Complete

---

## What Was Built

`src/lib/donna/donnaSafeActionRouter.ts` — routes DONNA tool requests through safety levels and returns structured routing decisions.

---

## Routing Logic

```typescript
routeDonnaAction(toolId, role, currentPath, params?) → DonnaActionRoutingDecision
```

| Tool Category | Outcome | canExecute |
|---|---|---|
| `read` | `execute_immediately` | true |
| `ui_guidance` | `execute_immediately` | true |
| `draft` | `submit_to_draft` | true (caller creates proposed_actions row) |
| `approval_required` | `route_to_queue` | false (director must click) |
| `always_blocked` | `always_blocked` | false |
| Role not permitted | `role_blocked` | false |

---

## Decision Type

```typescript
interface DonnaActionRoutingDecision {
  outcome: RoutingOutcome
  canExecute: boolean
  toolId: string
  tool: DonnaTool | null
  explanation: string        // DONNA's response text
  approvalRoute: string | null
  donnaResponse: DonnaStructuredOutput  // Full structured response
}
```

---

## Safety Invariants

- `approval_required` tools always return `canExecute: false`
- `always_blocked` tools always return `canExecute: false`
- `draft` tools return `canExecute: true` but require caller to go through `proposed_actions`
- No tool bypasses `execute_approved_action()` — the router never calls it
- `affectsParentOrPlayerVisibility: true` tools always require approval path

---

## Additional Functions

```typescript
routeBestAction(toolIds, role, currentPath) → DonnaActionRoutingDecision | null
getImmediateToolsForRole(role) → DonnaTool[]
getParentPlayerVisibilityTools() → DonnaTool[]
```
