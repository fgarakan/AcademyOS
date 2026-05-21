# Data Classification

> Part of the Trust Stack — see `trust-stack.md` for the root doctrine.

This document classifies every major data type in AcademyOS by sensitivity level, defines who can access it at which layer, and governs what data may be sent to external services (AI APIs, analytics, logging).

---

## Classification Levels

| Level | Name | Description |
|---|---|---|
| L0 | Public | Academy-level info safe to show to any authenticated user of that academy |
| L1 | Internal | Coaching and operational data; visible to staff only |
| L2 | Sensitive | Player development data; access controlled by role and explicit visibility flags |
| L3 | Restricted | PII, contact details, guardian info; access limited to Directors and system functions |
| L4 | System | Credentials, keys, service tokens; never in application code or logs |

---

## Data Type Classification

### Academy / Organizational Data

| Data | Level | Notes |
|---|---|---|
| Academy name, branding | L0 | Shown to all authenticated users |
| Academy levels (labels, thresholds) | L0 | Used in player-facing UI |
| Coach roster (names, roles) | L1 | Visible to staff; not directly shown to players or parents |
| Academy billing / subscription state | L3 | Director only |
| Academy configuration / feature flags | L1 | Director only |

### Player Data

| Data | Level | Notes |
|---|---|---|
| Player display name | L1 | Shown to coaches; shown to player in own portal |
| Player full legal name | L3 | Used in export/admin only; not displayed in coaching UI |
| Player current level | L1 | Shown to coaches; shown to player in portal |
| Player is_active status | L1 | Coaching operations |
| Player date of birth | L3 | Admin and placement only |
| Player photo | L2 | Shown within academy; not exported to AI services |
| Player placement score | L1 | Director and Head Coach only |
| Player notes | L2 | Staff-facing; not shown to player or parent by default |
| Player priorities | L2 | Staff-facing; shown to player only with explicit flag |
| Player development summary (student version) | L2 | Shown to player when `show_to_student = true` |
| Player development summary (parent version) | L2 | Shown to parent when `show_to_parent = true` |
| Player development summary (staff version) | L1 | Director and Head Coach only |

### Guardian / Parent Data

| Data | Level | Notes |
|---|---|---|
| Guardian display name | L2 | Shown to Director and Head Coach when managing guardian links |
| Guardian email | L3 | Director only; never logged or sent to external services |
| Guardian phone | L3 | Director only |
| Guardian relationship label | L2 | Staff-facing for context |
| Guardian auth credentials | L4 | Managed by Supabase Auth; never in application code |

### Session / Coaching Data

| Data | Level | Notes |
|---|---|---|
| Session date, time, location | L0 | Shown to all coaching staff |
| Session attendance record | L1 | Coaching staff; parent portal shows own player's attendance |
| Session notes (raw) | L1 | Coach-authored; not shown to player/parent by default |
| Session recap (structured) | L2 | Shown to player/parent if approved and flagged |
| Voice transcript (raw) | L2 | Coaching staff only; discarded from AI provider after structuring |
| Voice audio (raw) | L3 | Never stored permanently; discarded after transcription |

### Template / Curriculum Data

| Data | Level | Notes |
|---|---|---|
| Template names and structure | L1 | Coaching staff only |
| Block exercises | L1 | Coaching staff only |
| Academy curriculum overrides | L1 | Director and Head Coach only |

### Audit / System Data

| Data | Level | Notes |
|---|---|---|
| `audit_logs` rows | L1 | Director and Head Coach (filtered); system only for writes |
| `proposed_actions` payload | L1-L2 | Inherits the sensitivity of the entity it proposes to change |
| AI call logs (no content) | L1 | Director for cost/usage review |
| Error logs | L1 | System; Director for ops review |
| Supabase service role key | L4 | Never in application code; dev scripts only |

---

## What May Be Sent to External AI Services

External AI services receive only what is necessary. The rule is minimum necessary data.

### Permitted to send to Anthropic (note structuring)

- Raw voice transcript text
- Session context: session date, template name, exercise names
- Player coaching context: current level label, 2–3 coaching priority titles (no PII)

### Prohibited from sending to Anthropic

- Guardian email, phone, or name
- Player full legal name (display name only, and only if necessary for context)
- Player date of birth
- Session attendance status of other players
- Billing or subscription data
- Audit log content
- Any L3 or L4 data

### Permitted to send to OpenAI Whisper (transcription)

- Audio file of the coach's voice during active session
- No player PII is added to the transcription request metadata

### Prohibited from sending to OpenAI Whisper

- Any player PII in the request body or headers
- Academy-identifying metadata beyond what Whisper requires functionally

### Permitted to send to OpenAI Realtime

- Live audio stream during an active voice session
- DONNA-generated text responses

### Prohibited from sending to OpenAI Realtime

- Same prohibitions as Whisper and Anthropic above

### Logging of AI calls

AI call log records must never include the content of the AI input or output. Logs contain only: model, token counts, latency, success/fail, and a structured output hash. The actual text stays in the proposed_action or voice_note, protected by RLS.

---

## Data Retention Rules

| Data type | Retention | Notes |
|---|---|---|
| Voice audio | Session only | Discarded after transcription completes |
| Raw voice transcripts | 90 days | Protected by RLS; not shown to player/parent |
| Structured session notes | Indefinite | Part of player history |
| Player development summaries | Indefinite | Part of player history |
| Proposed actions | Indefinite (append-only) | Audit trail |
| Audit logs | Indefinite (append-only) | Compliance trail |
| AI call logs | 1 year | Cost and security audit |
| Guardian PII | Lifetime of guardian–player link | Director-managed; deletion requires explicit request |

---

## Cross-Tenancy Rules

No data crosses the `academy_id` boundary at any layer. This applies to:

- Database queries — every query on a multi-tenant table includes `.eq('academy_id', ...)`
- AI prompts — prompts must not include data from Academy A when serving Academy B
- Logs — logs include `academy_id` for scoped querying; logs are never cross-academy viewable
- Export — data exports are always single-academy scoped

---

## PII Handling Protocol

When a coach or Director exports player data:
1. The export is scoped to one academy at a time.
2. L3 fields (email, phone, DOB) are included only in Director-initiated exports.
3. Export events are logged to `audit_logs` with `action = 'data_export'`.
4. No export mechanism currently sends data to external systems automatically.

When a guardian requests data deletion:
1. Request is logged as a Director-level action.
2. L3 fields are cleared from the `guardians` row.
3. Auth account is deleted via Supabase Admin API.
4. The deletion event is recorded in `audit_logs` (the log entry persists; the data does not).

---

## Classification Drift Risk

Classification decisions can drift over time as features expand. The three highest-risk drift vectors are:

1. **AI prompt expansion** — adding more player context to AI prompts without reviewing what's being sent
2. **Parent portal expansion** — surfacing L1/L2 data to parents without adding explicit visibility flags
3. **Logging expansion** — adding richer error logs that accidentally include PII

Each of these must be reviewed against this document before shipping. If a feature causes a classification level to change, update this document first, then implement.
