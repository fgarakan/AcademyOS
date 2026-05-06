# Voice Audit Log Plan

**Sprint:** 82
**Date:** 2026-05-06
**Status:** Partial — audit log writes to existing `audit_logs` table (no new schema required). Future fields documented below.

---

## Current audit coverage

The transcription endpoint (`/api/coach/sessions/[sessionId]/transcribe`) writes a best-effort audit row on every successful transcription:

| Field | Value |
|---|---|
| `academy_id` | Resolved from authenticated profile — never from client |
| `actor_id` | Authenticated user ID |
| `action` | `'voice_transcription.completed'` |
| `target_type` | `'session'` |
| `target_id` | Session UUID |
| `target_label` | `session:<uuid>` |
| `source_type` | `'voice'` |
| `payload.provider` | `'openai_whisper'` |
| `payload.audio_retained` | `false` (always) |
| `payload.file_size_bytes` | Audio blob size in bytes |
| `payload.mime_type` | Audio MIME type |
| `payload.success` | `true` |

**Not logged (by design):**
- Transcript text
- Audio bytes
- Coach answers
- Player names
- Any child-identifiable data

**Failure cases:** Not written to audit log on failure (503 no key, 502 provider error, 401 auth). Failures are only server-console logged without transcript or audio.

---

## Planned future audit fields (requires admin/reporting sprint)

When a voice settings admin screen is built, the following additional fields would be useful:

| Field | Purpose |
|---|---|
| `payload.recording_duration_seconds` | Requires client to send duration |
| `payload.provider_model` | Already `whisper-1` — embed when stable |
| `payload.transcript_length_chars` | Length only (not content) for quality monitoring |
| `payload.question_step` | Which wrap-up question the coach was answering |

These fields do not require a schema change — they can be added to the `payload` JSONB column when ready.

---

## Academy voice privacy card

When a director configuration screen is built (`/director/configuration`), the following read-only voice privacy card should be shown:

**Voice Transcription Status**
- Configured: Yes / No (based on `OPENAI_API_KEY` presence — server check only)
- Provider: OpenAI Whisper
- Audio retained: Never
- Transcript stored: Only after coach saves wrap-up
- Audit log: Enabled — event metadata only, no transcript content

The "Configured" status check must be a server-rendered value — never expose the API key or its existence to the browser directly.

---

## Privacy UI copy (currently in AudioRecorderButton)

The following copy is already in `src/components/assistant/AudioRecorderButton.tsx`:

- During recording: "Recording… tap Stop when done. Max 60s."
- During transcription: "Transcribing… nothing is saved until you tap Save Wrap-Up."
- At rest: "Audio is used only to create a transcript and is not saved. Review and edit before saving."

No further UI changes required for V1.
