# Debounce and Duplicate Submit Protection Notes

> Sprint 404 — Debounce + Duplicate Submit Protection V1
> See also: `docs/IDEMPOTENCY_IMPLEMENTATION_NOTES.md`, `docs/RATE_LIMITING_IMPLEMENTATION_NOTES.md`

---

## What Was Implemented in Sprint 401

Sprint 401 added server-side duplicate submission guards to the highest-risk write paths:

| Path | Guard type | Window |
|---|---|---|
| `saveWrapUpDraftAction` | proposed_actions DB query | 30 seconds |
| `saveWrapUpAttendanceExceptionAction` | proposed_actions DB query | 15 seconds |
| `structureCoachRecapAction` | `processing_status='structured'` DB state | Permanent (idempotent) |

These are server-side guards. They do not require UI changes.

---

## UI-Side Duplicate Prevention (Recommendations)

The following UI patterns prevent duplicate submissions before they reach the server.

### Pattern 1: Disable Button on Submit

The safest and simplest pattern. Disable the submit button immediately on click and re-enable on server response.

```tsx
// Recommended for: wrap-up save, attendance exception, DONNA submit
const [submitting, setSubmitting] = useState(false)

async function handleSubmit() {
  setSubmitting(true)
  try {
    const result = await saveWrapUpDraftAction(...)
    if (!result.ok) toast.error(result.error)
  } finally {
    setSubmitting(false)
  }
}

<button onClick={handleSubmit} disabled={submitting}>
  {submitting ? 'Saving...' : 'Save Draft'}
</button>
```

**Risk:** Safe — already the pattern in most AcademyOS components that use `useTransition` or loading state.

### Pattern 2: Debounce for Autosave

For fields that save automatically on change (e.g., template block editing, player note editing), debounce the save call.

```ts
// 500ms debounce is appropriate for autosave fields
// 1000ms for longer-form text areas
// Do NOT debounce submit buttons — use disable pattern instead
```

Recommended targets:
- Template block name editing
- Session notes autosave
- Player priority editing

### Pattern 3: Drag-and-Drop Block Editing

Block reordering via drag-and-drop should:
1. Update UI state immediately (optimistic)
2. Debounce the server save (500ms after drag release)
3. Roll back UI state if the server save fails

This requires the `updated_at` optimistic locking pattern from Sprint 411 to prevent conflict.

---

## Target Areas for Duplicate Prevention

| Area | Current protection | Recommended addition |
|---|---|---|
| Wrap-up save button | Sprint 401 30s server guard | UI disable-on-submit |
| Attendance exception submit | Sprint 401 15s server guard | UI disable-on-submit |
| DONNA submit button | None | UI disable + rate limit |
| Voice capture submit | None | UI disable on recording stop |
| Search / filter interactions | None | Input debounce (300ms) |
| Template autosave | None | Autosave debounce (500ms) |
| Drag/drop block editing | None | Debounce + optimistic lock |

---

## Debounce Utility (Safe to Add)

The following utility can be added to `src/lib/utils/debounce.ts` without any new dependencies:

```ts
// Safe to add in a future sprint — no new dependencies
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  waitMs: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (...args: Parameters<T>) {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => { fn(...args) }, waitMs)
  }
}
```

**Not added in Sprint 404** — defer to the specific sprint that wires it to a component.

---

## Recommended Debounce Durations

| Interaction | Debounce |
|---|---|
| Search / filter input | 300ms |
| Template block name autosave | 500ms |
| Coach notes autosave | 500ms |
| Player priority autosave | 500ms |
| Drag/drop final position save | 500ms |
| Long-form text autosave | 1000ms |
| Voice capture submit (button) | Disable immediately — no debounce |
| DONNA submit (button) | Disable immediately — no debounce |

---

## Race Condition Notes

### Autosave + Manual Save Race

If a field autosaves every 1 second and the user also clicks "Save", both paths fire. Without server-side protection:
- Both writes succeed and the last write wins
- The order is non-deterministic

**Fix:** Use `updated_at` optimistic locking (Sprint 411). The server should reject a write if `updated_at` has advanced since the client last read the row.

### Concurrent Coaches on Same Session

Two coaches editing the same session simultaneously can overwrite each other's changes.

**Fix:** Last-write-wins is acceptable for the current pilot scale. `updated_at` locking will be added in Sprint 411 for template/block edits where conflicts are likely.

---

## What Was Not Implemented in Sprint 404

- UI disable-on-submit for specific buttons (deferred to Phase 5 coach OS sprint)
- Debounce utility file (deferred to the sprint that uses it)
- Drag-and-drop debounce (deferred to template builder sprint)
- Autosave infrastructure (deferred to Phase 4/5)
