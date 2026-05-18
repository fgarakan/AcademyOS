# Sprint 831 — Curriculum Builder V2 Wiring Plan V1

**Date:** 2026-05-18
**Sprint:** 831

---

## Goal

Connect the curriculum builder UI shells to real `proposed_actions` writes. This is the single most valuable V2 upgrade for the curriculum builder.

---

## What needs wiring

### 1. DONNA drill draft → proposed_actions

**Component:** `DonnaAddDrillDraft.tsx`
**Current state:** Textarea → local state → success message (no DB write)

**V2 server action:**

```typescript
// src/lib/actions/curriculumDraftActions.ts
'use server'
import { assertNotPreviewMode } from '@/lib/guards/previewMode'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function createCurriculumDrillDraft(input: {
  levelId: string
  description: string
  academyId: string
}) {
  assertNotPreviewMode()
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  await supabase.from('proposed_actions').insert({
    action_type: 'curriculum_add_drill',
    description: input.description,
    payload: { level_id: input.levelId, description: input.description },
    status: 'pending_review',
    source: 'donna',
    academy_id: input.academyId,
    proposed_by: user.id,
  })

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'proposed_curriculum_drill_draft',
    target_type: 'curriculum_level',
    target_id: input.levelId,
    metadata: { description: input.description },
  })
}
```

**Component update:** Replace `setSubmitted(true)` with `await createCurriculumDrillDraft(...)` then `setSubmitted(true)` on success.

---

### 2. Same pattern for gate and fitness drafts

- `createCurriculumGateDraft()` — `action_type: 'curriculum_add_gate'`
- `createCurriculumFitnessDraft()` — `action_type: 'curriculum_add_fitness'`

---

### 3. CurriculumChangeQueue live data

**Current state:** Component renders with static `items` prop

**V2 query (server component):**

```typescript
const { data: curriculumChanges } = await supabase
  .from('proposed_actions')
  .select('id, action_type, description, status, created_at, confidence')
  .like('action_type', 'curriculum_%')
  .order('created_at', { ascending: false })
  .limit(20)
```

Pass result as `items` to `<CurriculumChangeQueue />`.

---

### 4. Review queue filter

Add `?type=curriculum` support to `/director/review/page.tsx`. Filter `proposed_actions WHERE action_type LIKE 'curriculum_%'` when param is present.

---

## Guardrails for V2 wiring (must verify before each server action)

1. `assertNotPreviewMode()` called first — no curriculum mutations in demo mode
2. Auth checked — `getUser()` before any DB write
3. No auto-approval — status must be `'pending_review'`
4. `audit_logs` entry written on every insert
5. `execute_approved_action()` is the only code that applies an approved change — no shortcut applies curriculum changes directly
6. RLS checked — insert uses authenticated user's session, not service role

---

## Estimated V2 sprint cost: 3 sprints

- Sprint V2-A: Server actions file + `createCurriculumDrillDraft` wired
- Sprint V2-B: Gate and fitness draft wiring + error handling
- Sprint V2-C: Live change queue query + review queue filter + E2E test
