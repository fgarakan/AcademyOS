# Supabase Sprint

Supabase-specific protocol for Academy OS sprints. Run this in addition to `/academy-sprint`.

---

## Before touching any DB logic

1. Read `src/lib/supabase/database.types.ts` for the relevant table sections (do not read the full 9k-line file — read only the type blocks for tables you will query)
2. Check `supabase/migrations/` to understand what columns and constraints exist
3. Confirm the sprint does not require a new migration. If it does — stop and state what migration is needed before writing any code.

---

## Query rules

### academy_id scoping — always required
Every query against a tenant-scoped table must include an `academy_id` filter.

```typescript
// Correct
.eq('academy_id', academyId)

// Wrong — missing scope, RLS is not a substitute for explicit scoping
.eq('id', targetId)
```

Never trust client-provided `academy_id`. Always read it from the authenticated user's session/profile on the server.

### Use authenticated server client
```typescript
import { createServerClient } from '@/lib/supabase/server'
const supabase = createServerClient()
```

Never use the anonymous or service role client in server actions or API routes unless a comment explains why and a senior reviewer has approved it.

### No service role
Do not create or use service role clients in sprint code. If you see an existing usage, note it but do not expand it.

### No RLS bypass
Do not pass `{ auth: false }` or use the service key in new queries.

---

## If types are stale

If the sprint requires a column or table that does not exist in `database.types.ts`:

1. Do **not** manually edit `database.types.ts`.
2. Create a local interface in the file that needs it, e.g.:

```typescript
// Types regeneration needed — column added in migration NN
interface LocalSessionWithNewColumn {
  id: string
  academy_id: string
  new_column: string | null
}
```

3. Note in the CHANGELOG entry: "Type regeneration needed after migration NN is applied."

---

## Migrations

**Do not create a migration unless the sprint prompt explicitly says "migration allowed" or "create migration".**

If a migration is needed:
- Name it `NNN_descriptive_name.sql`
- Include RLS policies for every new table
- Include `academy_id` column and index on every tenant-scoped table
- Include `audit_logs` insert trigger if the table stores important state
- Document it in `docs/CHANGELOG.md`

---

## proposed_actions pattern

Use this structure for all director-review draft workflows:

```typescript
await supabase.from('proposed_actions').insert({
  academy_id: academyId,
  target_module: 'module_name',          // e.g. 'attendance_exception'
  target_object_type: 'object_type',     // e.g. 'session'
  target_object_id: targetId,
  proposed_payload: {
    draft_type: 'specific_draft_type',   // e.g. 'attendance_exception_v1'
    // ... structured intent
  },
  status: 'pending_review',
  created_by: userId,
})
```

Always check for an existing `pending_review` draft before inserting to prevent duplicates:

```typescript
const { data: existing } = await supabase
  .from('proposed_actions')
  .select('id')
  .eq('academy_id', academyId)
  .eq('target_module', 'module_name')
  .eq('target_object_id', targetId)
  .eq('status', 'pending_review')
  .maybeSingle()

if (existing) {
  return { error: 'Draft already exists', existingId: existing.id }
}
```

---

## audit_logs pattern

Write to `audit_logs` on every official apply action:

```typescript
await supabase.from('audit_logs').insert({
  academy_id: academyId,
  action_type: 'descriptive_action_type',
  target_type: 'object_type',
  target_id: targetId,
  actor_id: userId,
  payload: { /* relevant state */ },
})
```

---

## Draft → Review → Approved → Applied flow

Every feature that mutates important data must follow this sequence:

1. **Draft** — server action creates `proposed_actions` row at `pending_review`
2. **Review** — director review queue renders draft card with full context
3. **Approved** — director clicks Approve; row moves to `approved`
4. **Applied** — separate apply action reads `approved` row, executes mutation, writes `audit_logs`, marks `executed`

Never skip from Draft directly to Applied. Never allow apply on non-`approved` rows.
