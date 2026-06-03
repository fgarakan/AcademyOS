# DONNA Workflow Memory Certification V1

**Sprint:** Mega Sprint 1661–1680
**Date:** 2026-06-03
**File:** `src/lib/donna/workflow/workflowMemory.ts`

---

## 1. Storage Layer

| Check | Status |
|---|---|
| Uses sessionStorage (client-side only) | PASS |
| Never throws — try/catch on all storage ops | PASS |
| Handles `window === 'undefined'` (SSR safe) | PASS |
| Storage key: `donna_active_workflow` | PASS |
| TTL: 4 hours (14,400,000ms) | PASS |
| Expired entries discarded on read | PASS |
| One workflow at a time — overwrites on set | PASS |

---

## 2. Workflow Types

| Type | Resume Message | Status |
|---|---|---|
| `onboarding` | "Your academy onboarding is still in progress…" | PASS |
| `placement` | "The placement review for [label] is still open…" | PASS |
| `assessment` | "Your assessment of [label] is in progress…" | PASS |
| `parent_update` | "A parent update for [label] is waiting…" | PASS |
| `curriculum_review` | "Your curriculum review for [label] is in progress…" | PASS |
| `draft` | "[label] is waiting in your Review Center…" | PASS |

---

## 3. API Functions

| Function | Behavior | Status |
|---|---|---|
| `setActiveWorkflow(entry)` | Writes to sessionStorage with `storedAt: Date.now()` | PASS |
| `getActiveWorkflow()` | Returns entry or null; validates shape; checks TTL | PASS |
| `clearActiveWorkflow()` | Removes key from sessionStorage | PASS |
| `continueWorkflow()` | Returns `WorkflowResume`; `found: false` when empty | PASS |
| `getWorkflowStatusLabel()` | Returns short label string or null | PASS |

---

## 4. `continueWorkflow()` — No Active Workflow

**Input:** sessionStorage empty or expired

**Result:**
```ts
{
  found: false,
  workflow: null,
  message: "I don't have an active workflow to resume. Start by asking me what needs attention…",
  route: null,
  focusId: null,
}
```

DONNA gives an honest, actionable message — never a silent failure.

**Status: PASS**

---

## 5. `continueWorkflow()` — Active Workflow

**Input:** `{ type: 'assessment', label: 'Jamie Chen', route: '/director/players/abc/assessments', storedAt: recent }`

**Result:**
```ts
{
  found: true,
  workflow: { type: 'assessment', label: 'Jamie Chen', ... },
  message: "Your assessment of Jamie Chen is in progress. I'll take you back to continue.",
  route: '/director/players/abc/assessments',
  focusId: null,
}
```

**Status: PASS**

---

## 6. Safety

- No player PII stored beyond safe label strings
- No raw coach notes stored
- sessionStorage only — clears on browser tab close
- TTL prevents stale state from persisting across work sessions
- `setActiveWorkflow` accepts only `WorkflowType` values — no arbitrary strings

**Certification: PASS**
