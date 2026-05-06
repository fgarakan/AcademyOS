# Voice Transcription Security Architecture

**Sprint:** 78
**Date:** 2026-05-06
**Scope:** Production voice transcription — Coach Wrap-Up only (narrow V1 scope)

---

## 1. Product Goal

Add production-grade voice transcription to the Coach Assistant Wrap-Up flow. V1 is intentionally narrow:

- Scope: Coach Wrap-Up question answers only
- Not a generic voice assistant
- Not a real-time streaming system
- Not a persistent audio store

The goal is to let a coach speak a short answer, receive a text transcript, edit it, and save — using the exact same save flow already in place. Nothing else changes.

---

## 2. Clean Architecture

```
Coach taps Record
  → browser MediaRecorder captures short audio clip
  → audio blob sent to secure POST /api/coach/sessions/[sessionId]/transcribe
  → server authenticates user
  → server verifies session belongs to coach's academy
  → server sends audio to STT provider (OpenAI Whisper or compatible)
  → server receives transcript string
  → server discards audio immediately (never written to disk or storage)
  → server returns { ok: true, transcript: string }
  → transcript inserted into current answer textarea
  → coach edits transcript before saving
  → coach clicks Save Wrap-Up (existing flow unchanged)
  → transcript becomes internal draft (proposed_actions pipeline)
  → director reviews if needed
```

### What is NOT in this path

- No audio is written to Supabase Storage
- No audio is replayed
- No audio is logged
- No transcript is written to the database automatically
- No parent or player sees any part of this flow
- No official session record is created until director approves

---

## 3. Hard Rules

| Rule | Enforcement |
|---|---|
| No permanent raw audio storage | Audio blob lives in browser memory only; endpoint never writes to storage |
| No audio replay | Audio is not returned, not cached, not stored |
| No client-side API key | STT API key is a server-only environment variable |
| No parent/player exposure | Coach notes are `is_private = true` by default; parent/player portals do not see coach observations |
| No auto-save | Transcript only populates the textarea; coach must click Save |
| No official updates until human confirmation | Wrap-up is a draft until director approves |

---

## 4. Security Controls

### Authentication
- `getSupabaseServer()` verifies cookie-based session
- Unauthenticated requests receive `401`

### Academy Membership Check
- Resolve `profiles.academy_id` from authenticated user
- Verify `academy_memberships` row: `is_active = true`, role is `coach`, `head_coach`, or `academy_director`
- Session must belong to same `academy_id`

### Session Access Check
- Session is fetched by `id` and `academy_id` together
- Coach must have a valid staff membership in the academy that owns the session
- No direct session ID trust from client

### Role Check
- Only `coach`, `head_coach`, and `academy_director` may call the transcription endpoint
- Parent and player roles are blocked at the membership check

### File Constraints
- Maximum audio payload: **4 MB** (enforced server-side before STT call)
- Accepted MIME types: `audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/wav`, `audio/ogg`
- Requests without a recognized MIME type return `415 Unsupported Media Type`
- Recording duration: **60–90 seconds maximum** enforced client-side (MediaRecorder auto-stop)

### Rate Limiting Plan (V1: documented, not yet enforced in code)
- Limit: 10 transcription requests per user per 5-minute window
- Enforcement point: middleware or edge function (future sprint)
- Graceful response on limit: `429 Too Many Requests`

### Provider Error Handling
- If STT provider returns an error, return `{ ok: false, error: "Transcription failed. Please try again or type your answer." }`
- Do not expose provider error details to the client
- Do not retry automatically (risk of duplicate charges)

### Safe Logging
- Server logs: request received, session ID, user ID, file size, provider success/failure
- Server logs: **never include transcript text**
- Server logs: **never include audio bytes**
- Audit log (when table supports it): academy_id, profile_id, session_id, timestamp, provider, success/failure, `audio_retained: false`

---

## 5. Privacy and Junior Safety

### Background Child Voice Risk
Tennis academy sessions involve minors. A coach recording near the court may capture child voices in the background. This is addressed by:

- **Explicit consent copy** in the recorder UI: "Audio is used only to create a transcript and is not saved."
- **Intentional recording only**: coach must tap Record explicitly; no auto-capture
- **Immediate discard**: audio is discarded the moment the transcript is returned
- No audio is stored, shared, or replayed under any circumstances

### Academy Policy Language (for admin docs)
"Voice transcription is provided for coaching staff to record session notes hands-free. Audio is processed by a third-party speech-to-text provider and is not retained. Transcripts are stored only after a coach explicitly saves them. Academy administrators may disable voice transcription per their data protection policies."

### Retention Policy
- **Audio:** Discarded immediately after transcription. Never written to any storage layer.
- **Transcript:** Only stored if the coach taps Save Wrap-Up. Stored as `voice_notes.content` (internal, `is_private = true`). Not shown to parents or players.
- **Proposed action draft:** Created on save; visible to director for review. Contains structured coach observations — not raw audio or transcript.

---

## 6. STT Provider Decision

### Primary: OpenAI Whisper API
- Endpoint: `https://api.openai.com/v1/audio/transcriptions`
- Model: `whisper-1`
- Auth: `Authorization: Bearer ${OPENAI_API_KEY}` (server-side only)
- No OpenAI SDK required — plain `fetch` with `FormData`

### Environment Variable Requirements
```
OPENAI_API_KEY=sk-...
```
- Must be set in server environment (`.env.local` for local dev, Vercel/Supabase env for production)
- **Never exposed to the browser** — not prefixed with `NEXT_PUBLIC_`
- If missing, endpoint returns `503` with message: `"Production transcription is not configured. You can still type or use browser dictation."`

### Fallback Chain
1. Production endpoint (Whisper) — if `OPENAI_API_KEY` is set
2. Graceful 503 with clear message — if key is missing
3. Browser SpeechRecognition (Sprint 77, Chrome/Edge only) — always available as secondary option in the UI
4. Keyboard/device dictation — always available

---

## 7. Cost Controls

| Control | Value |
|---|---|
| Maximum recording duration | 60 seconds (UI enforced) |
| Maximum file size | 4 MB (server enforced) |
| Short-clip model | Whisper processes only what the coach records — no idle padding |
| Rate limit plan | 10 requests / user / 5 min (future enforcement) |
| No automatic retry | Failed transcription shows error; coach retries manually |
| No streaming | One request per save; no continuous audio stream |

Estimated cost at Whisper pricing (`$0.006/minute`):
- 60-second clip: ~$0.006
- 100 sessions/day × 6 questions × 1 attempt: ~$3.60/day at maximum usage

---

## 8. Future Hardening Roadmap

| Item | Priority | Sprint |
|---|---|---|
| Voice transcription event audit log rows | High | Sprint 82 |
| Academy voice settings (enable/disable per academy) | High | Sprint 82+ |
| Rate limiting enforcement | Medium | Sprint 90+ |
| DPA / subprocessor documentation for OpenAI | High | Pre-production |
| Admin UI to disable voice transcription | Medium | Sprint 90+ |
| Production TTS (ElevenLabs or OpenAI TTS) | Low | Sprint 86+ |
| Multi-language transcription | Low | Future |
| Streaming STT for longer recordings | Low | Future |

---

## 9. Implementation Files

| File | Purpose |
|---|---|
| `src/app/api/coach/sessions/[sessionId]/transcribe/route.ts` | Secure POST endpoint — auth, access, STT call, response |
| `src/components/assistant/AudioRecorderButton.tsx` | MediaRecorder UI — record, stop, timer, send, receive, insert |
| `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` | Integration point — AudioRecorderButton alongside existing VoiceInputButton |
| `.env.local` | `OPENAI_API_KEY` — never committed |
| `docs/voice-transcription-security-architecture.md` | This document |
