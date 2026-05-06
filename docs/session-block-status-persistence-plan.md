# Session Block Status Persistence — Plan

**Sprint:** 57
**Status:** AWAITING MIGRATION APPROVAL
**Last updated:** 2026-05-06

---

## Problem

Coach block status (planned / in_progress / completed / skipped / modified) is tracked in:
1. React local state in `CoachSessionExecutionClient`
2. `localStorage` key `session_block_status_${sessionId}`

It is NOT persisted to the database. If the coach navigates away or closes the browser, execution state is lost.

The `CoachWrapUpDrawer` reads from localStorage on open to pre-populate its block status selectors, but this is fragile and session-scoped to a single browser tab.

---

## Root cause

`session_blocks` table has no status column. See `database.types.ts` — the Row type contains:

```
duration_min, id, intensity, is_override, name, notes,
order_index, session_id, template_block_id, type, updated_at
```

No `actual_status`, `status`, `progress`, or similar field.

---

## Proposed fix

Add `actual_status` column to `session_blocks` via migration 057.

### Column definition

```sql
actual_status TEXT NOT NULL DEFAULT 'planned'
  CHECK (actual_status IN ('planned', 'in_progress', 'completed', 'skipped', 'modified'))
```

Using `TEXT` with a `CHECK` constraint rather than a custom `ENUM` to avoid Supabase enum type management complexity and make future value additions easier.

Using `actual_status` (not `status`) to avoid collision with the sessions table's `status` field which surfaces in join queries.

### RLS analysis

`session_blocks` already has RLS enabled. Existing policies (from migration 007):

- **Staff SELECT**: `EXISTS (session_blocks.session_id → sessions.academy_id = auth_academy_id() AND auth_is_staff())`
- **Staff ALL**: same scope

This means coaches (who are staff) can already UPDATE session_blocks rows scoped to their academy. No new RLS policy is needed for the column addition.

### `updated_at` trigger

`session_blocks` already has `tr_session_blocks_updated_at` trigger that fires on UPDATE. The `updated_at` column will auto-update when `actual_status` changes.

---

## Migration file

See: `supabase/migrations/057_session_block_status.sql`

This file is a **PROPOSAL ONLY**. It has NOT been applied to the live database.

---

## Post-approval implementation plan

After the migration is applied and `database.types.ts` is regenerated via `supabase gen types`, the following code changes can be implemented:

### 1. Server action: `updateBlockStatusAction`

File: `src/app/coach/sessions/[sessionId]/updateBlockStatusAction.ts`

```typescript
'use server'
// Input: sessionId, blockId, status
// Auth: requires coach/staff membership in academy that owns the session
// Update: session_blocks SET actual_status = status WHERE id = blockId AND session.academy_id = profile.academy_id
// Revalidate: /coach/sessions/[sessionId]
```

### 2. CoachSessionExecutionClient changes

- On block status button tap: call `updateBlockStatusAction` with debounce (200ms)
- Continue writing localStorage as fallback for offline/optimistic
- Show save error indicator if action fails (non-blocking)

### 3. CoachWrapUpDrawer changes

- Read `session_blocks.actual_status` from server on open (pass as prop from parent)
- Fall back to localStorage if server data unavailable
- localStorage remains the optimistic layer

### 4. database.types.ts

Must be regenerated via:
```bash
supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
```

Do NOT manually edit `database.types.ts`.

---

## Rollback

If the migration causes issues:
```sql
ALTER TABLE session_blocks DROP COLUMN actual_status;
```

No data loss risk — this column is additive.

---

## Decision required

**Before implementing Sprint 57 frontend/action code:**
1. Review and approve `supabase/migrations/057_session_block_status.sql`
2. Apply migration to live Supabase: `supabase db push` or SQL editor
3. Regenerate types: `supabase gen types typescript ...`
4. Confirm types file has been updated with `actual_status` column
5. Approve continuation of Sprint 57 implementation

**Sprint 57 implementation is gated on steps 1–5 above.**
