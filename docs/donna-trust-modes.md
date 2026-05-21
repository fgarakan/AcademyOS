# DONNA Trust Modes

> Part of the Trust Stack — see `trust-stack.md` for the root doctrine.
> Cross-reference: `ai-action-safety.md` for the full AI safety contract.

DONNA is the AI assistant layer in AcademyOS. This document defines DONNA's trust surface, operating modes, and the constraints that govern what DONNA can propose, say, and do at each tier of access.

---

## What DONNA Is

DONNA is a structured proposal engine. DONNA reads coaching context, interprets voice input, and generates structured drafts that humans then review and approve. DONNA does not execute. DONNA does not decide. DONNA proposes.

The name is DONNA — always capitalized, never abbreviated as DANA or any other variant.

---

## DONNA's Scope

DONNA operates within the boundaries of the authenticated user who invoked it. If a coach opens a voice session, DONNA has exactly the read access that coach has — no more. DONNA cannot see data outside the coach's authorized scope.

DONNA writes to:
- `proposed_actions` — structured action proposals
- `voice_sessions` — session metadata
- `voice_transcripts` — raw transcript text
- `voice_notes` — structured coaching notes

DONNA never writes to:
- `players`, `academy_levels`, `player_priorities`, `player_development_summary`
- `sessions`, `session_blocks`, `session_attendance`
- `guardians`, `player_guardians`
- `audit_logs` (the system writes to audit_logs on DONNA's behalf when proposals are approved)
- Any other core data table

---

## DONNA Trust Modes

DONNA has three operating modes corresponding to the depth of data context and the type of output DONNA is allowed to produce.

### Mode 1 — Listening (Transcription Only)

DONNA receives voice audio and converts it to text. No AI interpretation, no structuring, no proposals.

**Input:** Raw audio stream from OpenAI Realtime or uploaded audio file  
**Output:** Text transcript in `voice_transcripts`  
**Writes:** `voice_sessions` (status), `voice_transcripts` (text)  
**Reads:** None beyond session context  
**Requires:** `OPENAI_API_KEY` or `OPENAI_REALTIME_API_KEY`  
**Human approval needed:** No (transcription is not a mutation of core data)

This mode is always available when voice is enabled. It is the safe fallback when DONNA structuring is unavailable.

### Mode 2 — Structuring (Note Drafting)

DONNA receives a transcript, reads player context, and produces a structured coaching note as a `proposed_action`.

**Input:** Transcript text + player coaching context (level, priorities)  
**Output:** Structured proposed_action of type `create_session_recap` or `update_player_note`  
**Writes:** `proposed_actions` (status = pending_review), `voice_notes`  
**Reads:** `players`, `player_priorities`, `academy_levels` (read-only)  
**Requires:** `ANTHROPIC_API_KEY` + DONNA structuring server action  
**Human approval needed:** Yes — Director or Head Coach must approve the proposed_action

DONNA's structured output must be validated against the action type schema before a proposed_action row is created. Malformed output is logged and discarded — it does not produce a proposed_action.

### Mode 3 — Intelligence (Priority and Planning)

DONNA reads deeper player context — development history, assessment data, recent session patterns — and generates multi-step proposals: priority adjustments, level progression flags, curriculum recommendations.

**Input:** Transcript + enriched player context (development summary, recent sessions, KPI data)  
**Output:** One or more proposed_actions of various types  
**Writes:** `proposed_actions` (multiple rows, all pending_review)  
**Reads:** `players`, `player_priorities`, `player_development_summary`, `sessions`, `session_blocks`, `academy_levels`  
**Requires:** `ANTHROPIC_API_KEY` + full DONNA intelligence context builder  
**Human approval needed:** Yes — each proposed_action is individually approved or rejected

Mode 3 is the most resource-intensive DONNA mode. It should never be triggered automatically or on page load. It is always triggered by a deliberate Director or Head Coach action.

---

## Context Building Rules

Before calling any AI service in Mode 2 or Mode 3, the context builder must:

1. Verify the requesting user has a valid session.
2. Fetch only the minimum context needed for the action type.
3. Strip L3 fields (guardian email, phone, DOB) before sending to the AI service.
4. Never include data from other players in the context (one player's DONNA session must not see another player's data).
5. Never include data from other academies.

Context sent to Anthropic must be validated against the data classification rules in `data-classification.md` before the API call is made.

---

## DONNA Output Validation

Every DONNA structured output (Mode 2 and Mode 3) is validated before a proposed_action is created:

1. Output must parse as valid JSON.
2. Output must include all required fields for the `action_type`.
3. `action_type` must be in the registered action type list.
4. Entity references (player_id, priority_id) must exist in the database.
5. Text fields must not exceed the column length limits.
6. No L3 data (PII) may appear in the proposed_action payload.

If any validation step fails, the proposed_action is not created, the failure is logged, and the user receives a recoverable error. DONNA does not retry automatically.

---

## DONNA Confidence and Transparency

DONNA output is always presented to the approver as a draft — never as a confirmed fact. The UI must:

1. Label DONNA-generated content with a "DONNA draft" indicator.
2. Never present a DONNA draft as already approved or already executed.
3. Show the raw transcript alongside the structured draft so the approver can compare.
4. Allow the approver to edit the draft before approving (the edit is tracked as `source = 'human_edit'` on the proposed_action).

DONNA must never generate text that implies it has authority it does not have (e.g., "I have updated Alex Chen's priorities" — DONNA may only say "I have proposed updating Alex Chen's priorities").

---

## DONNA Error States

| Error condition | DONNA behavior |
|---|---|
| Transcript is empty or too short | Reject; return user-visible error; no proposed_action created |
| Anthropic API unavailable | Return error; no proposed_action created; audio retained if still needed |
| Structured output fails validation | Log raw output; return error; no proposed_action created |
| Player not found in context | Return error; confirm player ID before retry |
| Academy context mismatch | Return error; log the mismatch; no proposed_action created |
| Action type not registered | Return error; do not create proposed_action with unknown type |

---

## DONNA and the Approval Queue

DONNA proposed_actions appear in the Director's review queue exactly like manually-authored proposals, but they are tagged `source = 'donna'`. The Director can:
- View the full DONNA draft and its transcript source
- Approve as-is
- Edit and approve (tracked)
- Reject with a reason (reason is stored on the proposed_action row)
- Bulk-approve multiple DONNA proposals (each still individually stamped with the approver's profile_id)

DONNA proposed_actions must never auto-approve on a timer, on inactivity, or under any programmatic condition.

---

## DONNA Rate Limiting (Planned)

Currently, no per-academy or per-coach rate limiting exists on DONNA invocations. This is a critical gap. The planned limits (Sprint 402/403 targets):

| Limit | Scope | Planned value |
|---|---|---|
| Voice sessions per academy per day | Academy-wide | 50 |
| DONNA intelligence calls per director per day | Per user | 20 |
| Concurrent voice sessions per academy | Academy-wide | 3 |
| Anthropic tokens per academy per month | Academy-wide | Budget-controlled |

Until rate limiting is implemented, DONNA usage is monitored manually via AI call logs.
