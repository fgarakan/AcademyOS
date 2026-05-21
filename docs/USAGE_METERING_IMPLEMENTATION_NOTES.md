# Usage Metering Implementation Notes

> Sprint 407 — AI/Voice Usage Metering V1
> See also: `docs/RATE_LIMITING_IMPLEMENTATION_NOTES.md`, `docs/OBSERVABILITY_IMPLEMENTATION_NOTES.md`

---

## What Was Created in Sprint 407

Two new utility files under `src/lib/usage/`:

### `src/lib/usage/usageTypes.ts`

Defines typed usage event contracts:
- `UsageEventType` — the full set of metered event types
- `UsageEvent` — full event payload: who, what, which model, latency, token counts, blocked state
- `UsageSummary` — aggregate shape for reporting

### `src/lib/usage/usageTracker.ts`

Usage tracking functions:
- `logUsageEvent(event)` — record a usage event to structured stdout
- `getInProcessDailyCount(academyId, eventType)` — per-instance daily counter (resets on cold start)
- `logDonnaCall(params)` — convenience wrapper for Anthropic intelligence calls
- `logTranscriptionCall(params)` — convenience wrapper for Whisper transcription
- `logVoiceStructuringCall(params)` — convenience wrapper for voice structuring

---

## Current Limitation: Log-Only

Usage events are written to structured stdout only. They are not persisted to the database.

**This means:**
- Usage data is available in Vercel log streams and any connected log drain
- Per-academy usage cannot be queried programmatically
- Quota enforcement must rely on rate limiting (Sprint 403), not usage history

---

## How to Instrument a New AI Call

```ts
import { logDonnaCall } from '@/lib/usage/usageTracker'

const start = Date.now()
const result = await callAnthropicApi(...)
logDonnaCall({
  academyId,
  userId: user.id,
  requestId,
  model: 'claude-3-7-sonnet-20250219',
  latencyMs: Date.now() - start,
  blocked: false,
})
```

When a call is blocked (by rate limit or kill switch):
```ts
logDonnaCall({
  academyId,
  userId: user.id,
  requestId,
  blocked: true,
  blockedReason: 'rate_limit',
})
```

---

## Planned: DB-Backed Usage Events (Sprint 419+)

Proposed table:

```sql
CREATE TABLE usage_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id  uuid NOT NULL REFERENCES academies(id),
  user_id     uuid REFERENCES profiles(id),
  event_type  text NOT NULL,
  provider    text,
  model       text,
  input_tokens  integer,
  output_tokens integer,
  latency_ms  integer,
  blocked     boolean NOT NULL DEFAULT false,
  blocked_reason text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usage_events_academy_fk CHECK (academy_id IS NOT NULL)
);
CREATE INDEX ON usage_events (academy_id, event_type, occurred_at);
```

When this table exists, replace `logUsageEvent()` with a DB insert. The interface in `usageTypes.ts` is stable — callers will not change.

---

## Metered Event Types

| Event Type | Provider | Triggered By |
|---|---|---|
| `donna_intelligence_call` | Anthropic | DONNA context building and note structuring |
| `voice_transcription` | OpenAI | Audio upload → Whisper |
| `voice_structuring` | Anthropic | Transcribed text → structured proposed_action |
| `tts_response` | OpenAI | Text-to-speech playback |
| `template_generation` | Anthropic | AI-assisted template creation |
| `portal_ai_question` | Anthropic | Player/parent portal AI questions |
| `coaching_message_generation` | Anthropic | AI coaching message drafts |
| `recommendation_generation` | Anthropic | Player recommendation engine |
