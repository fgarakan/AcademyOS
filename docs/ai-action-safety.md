# AI Action Safety

> Part of the Trust Stack — see `trust-stack.md` for the root doctrine.
> Layers 1–3: AI Proposes → Human Approves → System Applies.

This document defines the complete safety contract governing every action DONNA or any AI subsystem can take in AcademyOS. It is the engineering reference for building, reviewing, and auditing AI-initiated operations.

---

## The Core Contract

```
AI proposes → Human approves → System applies
```

This is not a workflow preference. It is a hard architectural constraint. Any code path that allows an AI output to directly mutate production data without a human approval step is a critical bug.

---

## What AI Can Do (Permitted)

| Action | Table written | Status |
|---|---|---|
| Draft a player note | `proposed_actions` | `pending_review` |
| Structure a voice transcript into session recap | `voice_notes`, `proposed_actions` | transcript → structured note |
| Propose a priority update | `proposed_actions` | `pending_review` |
| Propose a curriculum adjustment | `proposed_actions` | `pending_review` |
| Generate a player development summary draft | `proposed_actions` | `pending_review` |
| Propose a session plan from a template | `proposed_actions` | `pending_review` |
| Read any data the authenticated user can read | (no write) | n/a |

DONNA may write to `proposed_actions`. DONNA may write to `voice_sessions`, `voice_transcripts`, and `voice_notes` during the transcription/structuring pipeline. These are the only write surfaces.

---

## What AI Cannot Do (Prohibited)

| Prohibited action | Why |
|---|---|
| Write to `players` directly | Core identity table — Director only via approved actions |
| Write to `sessions` directly | Session state must be human-confirmed |
| Write to `session_blocks` directly | Curriculum delivery — must be coach-confirmed |
| Approve its own proposed actions | AI cannot be both proposer and approver |
| Escalate `proposed_actions.status` from `pending_review` to `approved` | Approval is a human-only action |
| Call `execute_approved_action()` on its own behalf | Execution requires approved status + human actor |
| Use service role credentials | DONNA inherits the authenticated user's RLS scope only |
| Make outbound API calls not in the approved AI service list | External surface must be declared and audited |
| Store raw user voice audio permanently | Audio is transcribed and discarded; only transcripts persist |

---

## The `proposed_actions` Table Contract

Every AI-generated proposal must produce exactly one `proposed_actions` row per logical action. Multi-step operations produce multiple rows, each independently approvable.

Required fields on every DONNA-authored row:

| Field | Value |
|---|---|
| `academy_id` | Academy the action belongs to |
| `proposed_by` | The profile_id of the authenticated user who triggered DONNA |
| `action_type` | One of the registered action types (see below) |
| `payload` | Structured JSON matching the action type schema |
| `status` | `pending_review` (always at creation) |
| `source` | `donna` |
| `session_context_id` | Voice session ID if action originated from voice |
| `created_at` | Server timestamp |

The `proposed_by` field is set from the server-side session — DONNA cannot self-assign a different actor.

---

## Registered Action Types

Only these action types may appear in `proposed_actions.action_type`. Adding a new type requires a migration that also adds the validation rule to `execute_approved_action()`.

| Action type | Effect when executed | Approver required |
|---|---|---|
| `update_player_note` | Writes to `player_notes` | Director or Head Coach |
| `update_player_priority` | Updates `player_priorities` row | Director or Head Coach |
| `create_session_recap` | Creates `session_notes` record | Director or Head Coach |
| `propose_session_plan` | Stages a `sessions` draft | Director or Head Coach |
| `update_development_summary` | Writes to `player_development_summary` | Director only |
| `adjust_player_level` | Updates `players.current_level_id` | Director only |
| `flag_player_for_review` | Sets a flag on the player profile | Director or Head Coach |

The execution function must reject any `action_type` not in this list. Unknown action types are treated as malformed — they are logged and rejected, not silently no-oped.

---

## Execution: `execute_approved_action()`

This is the only function that may transition a proposed action from `approved` to `executed`. It enforces:

1. `status` must be `approved` at call time (idempotency guard)
2. Actor must have the role required for the action type
3. `academy_id` on the row must match the calling session's academy
4. A corresponding `audit_logs` row is written in the same transaction
5. `status` is set to `executed` and `executed_at` is stamped

Execution is transactional. If the audit log write fails, the mutation is rolled back. There is no partial execution.

---

## Approval: What Counts as Human Approval

An approval is valid if and only if:
- A real Supabase Auth session exists for the approving user
- The session belongs to a `academy_director` or `head_coach` role
- The approval is submitted through a Server Action (never client-side fetch to a DB update)
- The `approved_by` field is stamped with the approving user's `profile_id` from the server session

An approval is invalid if:
- The actor is `null` or anonymous
- The `approved_by` field is supplied from the client request body
- The status is set directly via a client-side Supabase query
- The action is auto-approved by any code path (no auto-approve rule may exist)

---

## AI Services in Use

| Service | Provider | Purpose | Data sent |
|---|---|---|---|
| Note structuring | Anthropic Claude | Structure raw voice transcripts into session recaps | Transcript text, player context |
| Voice transcription | OpenAI Whisper | Convert audio to text | Audio file (discarded after transcription) |
| Voice output (TTS) | OpenAI TTS | Read DONNA responses aloud | DONNA-generated text only |
| Realtime voice | OpenAI Realtime API | Live voice interaction during coaching sessions | Live audio stream |

No player PII (full name, contact details, guardian info) is sent to external AI services unless it is in the transcript itself. The transcript content policy is documented in `data-classification.md`.

---

## Failure Modes and Safe Handling

| Failure | Safe behavior |
|---|---|
| DONNA API call times out | Return error to user; no proposed_action created |
| DONNA returns malformed structured output | Reject the draft; log the raw output; do not create a proposed_action |
| Approval store fails (DB error) | Return error to user; status remains `pending_review` |
| Execution function raises an exception | Roll back the mutation; log the error; status remains `approved` |
| Unknown action_type at execution time | Reject with explicit error; do not silently succeed |
| Duplicate execution attempt | Idempotency guard: return success if already `executed`, do not re-execute |

---

## AI Call Logging Requirements

Every call to an external AI service must produce a log entry containing:

- `actor_id` — the user who triggered the call
- `academy_id` — the scoped academy
- `service` — `anthropic`, `openai_whisper`, `openai_tts`, `openai_realtime`
- `model` — the specific model ID used
- `input_tokens` (where available)
- `output_tokens` (where available)
- `latency_ms`
- `success` — boolean
- `error` — error message if success=false

This log is required for cost auditing, anomaly detection, and the rate limiting infrastructure described in `docs/SCALABILITY_COST_CONTROL_AUDIT.md`.

---

## Red Lines for AI Feature Development

These rules apply to every pull request that adds or modifies AI-touching code:

1. Never add a direct write from DONNA to any table other than `proposed_actions`, `voice_sessions`, `voice_transcripts`, or `voice_notes`.
2. Never add a condition that sets `proposed_actions.status = 'approved'` programmatically.
3. Never pass service role credentials to any AI-facing server action.
4. Never stream AI output directly to a database write without a human review step.
5. Never add a new action type without also updating `execute_approved_action()` to handle it.
6. Always log AI calls — a call with no log entry is a compliance gap.
7. Never store raw audio permanently.
8. Always validate structured AI output before creating a proposed_action — malformed output is rejected, not coerced.

See also: `ai-development-rules.md` for the full engineering ruleset.
