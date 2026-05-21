# AI Development Rules

> Part of the Trust Stack — see `trust-stack.md` for the root doctrine.
> The engineering companion to `ai-action-safety.md` and `donna-trust-modes.md`.

This document is the engineering ruleset for every pull request, server action, route, or component that touches AI features. These rules apply to DONNA, voice, transcription, and any future AI subsystem.

---

## Rule 1: AI Never Mutates Core Data

Every code path that produces a DONNA output must write to `proposed_actions`, not to the target table directly. There are no exceptions.

```ts
// WRONG — DONNA writes directly to players
await db.from('players').update({ current_level_id: newLevelId }).eq('id', playerId)

// CORRECT — DONNA proposes; the system executes after human approval
await db.from('proposed_actions').insert({
  action_type: 'adjust_player_level',
  payload: { player_id: playerId, new_level_id: newLevelId },
  status: 'pending_review',
  source: 'donna',
  proposed_by: session.profileId,
  academy_id: session.academyId,
})
```

---

## Rule 2: AI Actions Use the Authenticated User's Session

DONNA runs with the permissions of the user who invoked it. Never elevate permissions for an AI call. Never pass service role credentials to a DONNA-facing server action.

```ts
// WRONG — service role bypasses RLS for DONNA
const db = createClient(url, SERVICE_ROLE_KEY)

// CORRECT — authenticated user session; DONNA sees only what the user sees
const db = await getSupabaseServer() // uses the request session
```

---

## Rule 3: Validate AI Output Before Creating a Proposed Action

DONNA output is external data. Treat it like any other external API response — validate before use.

```ts
// Required validation before proposed_action insert
const parsed = actionOutputSchema.safeParse(donnaOutput)
if (!parsed.success) {
  console.error('[donna/structure] output validation failed', {
    errors: parsed.error.issues,
    raw: donnaOutput,
  })
  return { data: null, error: 'DONNA produced an unexpected response. Please try again.' }
}
```

---

## Rule 4: Every AI Call Is Logged

Log before and after every call to Anthropic, OpenAI, or any external AI service. The log must include: actor, academy, model, latency, success/fail, and token counts where available. See `debuggability-standard.md` for the exact log format.

```ts
const start = Date.now()
let success = false
let error: string | null = null
try {
  const result = await anthropic.messages.create({ ... })
  success = true
  return result
} catch (err) {
  error = (err as Error).message
  throw err
} finally {
  console.log('[anthropic/call]', {
    actor_id: session.profileId,
    academy_id: session.academyId,
    model: MODEL_ID,
    latency_ms: Date.now() - start,
    success,
    error,
  })
}
```

---

## Rule 5: Never Send L3 Data to External AI Services

L3 data includes: guardian email, phone, player DOB, player legal name (display name only, with caution). Review `data-classification.md` before constructing any AI prompt.

```ts
// WRONG — sends guardian email to Anthropic
const prompt = `Coach context: player ${player.full_name}, parent email: ${guardian.email}`

// CORRECT — minimum necessary context
const prompt = `Coach context: player ${player.display_name || 'the player'}, level: ${level.label}`
```

---

## Rule 6: Timeouts on Every AI Call

AI API calls must never hang indefinitely. Set explicit timeouts.

```ts
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 30_000) // 30s

try {
  const result = await anthropic.messages.create({ ... }, { signal: controller.signal })
  return result
} catch (err) {
  if (err.name === 'AbortError') {
    console.error('[anthropic/call] timeout after 30s', { actor_id: session.profileId })
    return { data: null, error: 'AI request timed out. Please try again.' }
  }
  throw err
} finally {
  clearTimeout(timeout)
}
```

---

## Rule 7: Input Validation Before the AI Call

Validate that the input to an AI call is non-empty and within expected bounds before making the call. This prevents wasting API budget on empty or malformed inputs.

```ts
if (!transcript || transcript.trim().length < 10) {
  return { data: null, error: 'Transcript is too short to structure.' }
}
if (transcript.length > MAX_TRANSCRIPT_CHARS) {
  return { data: null, error: 'Transcript exceeds the maximum supported length.' }
}
```

---

## Rule 8: Never Auto-Approve Proposed Actions

No code path may set `proposed_actions.status = 'approved'` programmatically. Approval is a human action routed through a Server Action that checks the actor's role server-side.

```ts
// WRONG — auto-approve
await db.from('proposed_actions').update({ status: 'approved' }).eq('id', proposalId)

// CORRECT — approval server action with role check
async function approveProposedAction(proposalId: string) {
  'use server'
  const session = await requireRole(request, ['academy_director', 'head_coach'])
  // ... then update status with session.profileId as approved_by
}
```

---

## Rule 9: Register New Action Types Before Shipping

A new `action_type` value must be:
1. Added to the `execute_approved_action()` PostgreSQL function (via migration)
2. Added to the registered action type list in `ai-action-safety.md`
3. Added to the permissions matrix in `permissions-matrix.md` (who can approve it)
4. Added to the action output schema validator

A proposed_action with an unregistered action_type will be rejected at execution time. Shipping an unregistered type means the proposal will sit unexecutable in the queue.

---

## Rule 10: Idempotency on AI Pipeline Steps

Structuring a transcript must be idempotent: if the same transcript is submitted twice (e.g., due to a retry), it must not produce two proposed_actions.

Guard pattern:

```ts
// Check before structuring
const existing = await db
  .from('proposed_actions')
  .select('id')
  .eq('session_context_id', voiceSessionId)
  .eq('action_type', 'create_session_recap')
  .limit(1)

if (existing.data && existing.data.length > 0) {
  return { data: existing.data[0], error: null } // already structured
}
```

---

## Rule 11: No AI Calls in Server Components

AI API calls happen in Server Actions only, not in Server Components. Server Components run on render — an AI call there runs every page load, with no user intent trigger.

```ts
// WRONG — AI call in Server Component
export default async function PlayerPage({ params }) {
  const donna = await callDonnaIntelligence(params.playerId) // runs on every render
  ...
}

// CORRECT — DONNA is triggered by an explicit user action in a Server Action
```

---

## Rule 12: Voice Audio Is Never Stored Permanently

Raw audio files are processed (transcribed) and then deleted. The transcript is stored. The audio is not.

```ts
// After transcription completes:
await deleteAudioFile(tempAudioPath) // remove from temp storage
// Only the transcript row persists
```

If audio storage is needed for a future feature (e.g., coach review of their own sessions), it requires:
1. Explicit consent mechanism
2. Encrypted storage
3. A defined retention and deletion policy
4. Director review before enabling

---

## Code Review Checklist for AI Features

Before approving any PR that touches AI code:

- [ ] DONNA writes only to `proposed_actions`, `voice_sessions`, `voice_transcripts`, or `voice_notes`
- [ ] No AI call uses the service role key
- [ ] All AI output is validated before creating a proposed_action
- [ ] Timeouts are set on all external AI API calls
- [ ] AI calls are logged (before + after)
- [ ] No L3 data is included in AI prompts
- [ ] No auto-approval path exists
- [ ] Idempotency guard is present if the action can be retried
- [ ] Input validation exists before the AI call
- [ ] Voice audio is discarded after transcription
- [ ] New action types are registered in `execute_approved_action()`
