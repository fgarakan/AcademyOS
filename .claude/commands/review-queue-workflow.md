# Review Queue Workflow

Standard pattern for proposed_actions / director review queue features.

Use this when building any new draft → review → approve → apply workflow.

---

## Overview

Every feature that proposes a change to official academy data must follow this four-stage flow:

```
Draft (pending_review) → Director Review → Approved → Applied (executed)
```

No stage may be skipped. No mutation may happen at the Draft stage.

---

## Stage 1 — Draft creation

**Server action** triggered by director or AI-initiated event.

```typescript
// 1. Check for existing pending draft to prevent duplicates
const { data: existing } = await supabase
  .from('proposed_actions')
  .select('id')
  .eq('academy_id', academyId)
  .eq('target_module', TARGET_MODULE)
  .eq('target_object_id', targetObjectId)
  .eq('status', 'pending_review')
  .maybeSingle()

if (existing) {
  return { alreadyExists: true, id: existing.id }
}

// 2. Insert draft
const { data, error } = await supabase
  .from('proposed_actions')
  .insert({
    academy_id: academyId,
    target_module: TARGET_MODULE,
    target_object_type: TARGET_OBJECT_TYPE,
    target_object_id: targetObjectId,
    proposed_payload: {
      draft_type: DRAFT_TYPE,
      raw_input: rawInput,             // preserve original voice/AI input
      parsed_intent: parsedIntent,     // structured interpretation
      // ...module-specific fields
    },
    status: 'pending_review',
    created_by: userId,
  })
```

**Rules:**
- `status` must be `'pending_review'` at creation — never `'approved'`
- `proposed_payload.draft_type` must be a namespaced string (e.g. `'attendance_exception_v1'`)
- Preserve raw input in `proposed_payload.raw_input`
- Structured intent goes in `proposed_payload.parsed_intent` or module-specific fields
- Return `{ success: true, id }` or `{ alreadyExists: true, id }` or `{ error }`

---

## Stage 2 — Review queue card

**Server Component** in `src/app/director/review/` that fetches and renders pending drafts.

```typescript
// Fetch drafts for this module
const { data: drafts } = await supabase
  .from('proposed_actions')
  .select('*')
  .eq('academy_id', academyId)
  .eq('target_module', TARGET_MODULE)
  .eq('status', 'pending_review')
  .order('created_at', { ascending: false })
```

**Card component must show:**
- Raw input (what was originally said/submitted)
- Parsed intent (what the system understood)
- Any ambiguous or exception items (e.g. unrostered attendees)
- Current status pill
- Decision controls (Approve / Needs Clarification / Reject)
- Created at timestamp

---

## Stage 3 — Decision controls

**Server Action** for director decisions.

```typescript
export async function updateDraftDecisionAction(
  proposedActionId: string,
  decision: 'approved' | 'needs_clarification' | 'rejected',
  clarificationNote?: string
) {
  // Always verify academy ownership before update
  const { data: draft } = await supabase
    .from('proposed_actions')
    .select('id, academy_id, status')
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)   // scope check
    .single()

  if (!draft || draft.status !== 'pending_review') {
    return { error: 'Draft not found or not in pending_review state' }
  }

  await supabase
    .from('proposed_actions')
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      ...(clarificationNote && {
        proposed_payload: { ...draft.proposed_payload, clarification_note: clarificationNote }
      }),
    })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)
}
```

**Rules:**
- Only update rows where `status = 'pending_review'`
- Always scope update with `academy_id`
- Set `reviewed_at` and `reviewed_by`

---

## Stage 4 — Apply action

**Server Action** that executes the approved change — built in a later sprint or after Stage 3 is confirmed.

```typescript
export async function applyApprovedDraftAction(proposedActionId: string) {
  // 1. Fetch and verify
  const { data: draft } = await supabase
    .from('proposed_actions')
    .select('*')
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)
    .eq('status', 'approved')        // only apply approved rows
    .single()

  if (!draft) return { error: 'Draft not found or not approved' }

  // 2. Execute the mutation (module-specific)
  // ...upsert, insert, or update the target data

  // 3. Write audit log
  await supabase.from('audit_logs').insert({
    academy_id: academyId,
    action_type: 'apply_' + draft.target_module,
    target_type: draft.target_object_type,
    target_id: draft.target_object_id,
    actor_id: userId,
    payload: { proposed_action_id: proposedActionId, applied_data: appliedData },
  })

  // 4. Mark executed
  await supabase
    .from('proposed_actions')
    .update({ status: 'executed', executed_at: new Date().toISOString() })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  return { success: true }
}
```

**Rules:**
- Only apply rows where `status = 'approved'` — hard check, not soft
- Always write `audit_logs` before marking `executed`
- If audit log insert fails, do not mark `executed`
- Return `{ success: true }` or `{ error }`

---

## UI conventions

- Status pills: `pending_review` → orange, `approved` → lime, `rejected` → red, `needs_clarification` → blue, `executed` → muted
- Decision buttons: Approve (`btn-lime`), Needs Clarification (`btn-ghost`), Reject (`btn-danger`)
- Apply button only visible when `status === 'approved'`
- Cards use `<Card>` from `src/components/ui`
- Exception items (ambiguous, unrostered, unknown) shown with `status-orange` styling

---

## What never happens

- Auto-approval of any draft
- Apply on non-`approved` status
- Creating players, roster entries, billing records, or communications from a draft
- Mutation at the draft creation stage
- Exposing draft details to parent or player roles
