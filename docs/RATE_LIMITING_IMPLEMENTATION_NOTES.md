# Rate Limiting Implementation Notes

> Sprint 403 — Server Action Rate Limiting V1
> See also: `docs/SCALABILITY_COST_CONTROL_AUDIT.md`, `docs/feature-flags-and-kill-switches.md`

---

## Current State (Sprint 403)

Two files created:

### `src/lib/rateLimit/rateLimitPolicy.ts`
Defines all rate limit policies as typed constants. No runtime side effects.
Can be imported anywhere — server-side only.

### `src/lib/rateLimit/inProcessRateLimit.ts`
Exports `checkRateLimit(policy, actorKey, requestId?)` and `rateLimitErrorMessage(policy)`.
Uses an in-process Map for the counter store.

**⚠️ Critical limitation:** In-process rate limiting is NOT reliable in serverless environments.
Each Vercel function invocation may have isolated memory. The counter can reset between requests from the same user.

**What it does provide:**
- Same-instance protection (rapid double-clicks in the same function instance)
- Foundation code for DB-backed replacement
- Structured rate limit logging (for future policy tuning)

---

## Rate Limit Policy Table

| Policy | Scope | Window | Limit | Target action |
|---|---|---|---|---|
| `DONNA_INTELLIGENCE` | per user | 5 min | 5 | DONNA intelligence context requests |
| `DONNA_TEXT_ACTION` | per user | 1 min | 10 | DONNA proposed_action creation |
| `VOICE_TRANSCRIPTION` | per user | 5 min | 20 | Whisper transcription calls |
| `VOICE_SESSION_ACADEMY` | per academy | 1 hr | 50 | Voice session starts |
| `COACH_RECAP_STRUCTURING` | per user | 5 min | 10 | structureCoachRecapAction |
| `TEMPLATE_GENERATION` | per academy | 15 min | 20 | Template generation |
| `PORTAL_AI_QUESTION` | per user | 5 min | 5 | Parent/player AI questions |
| `TTS_RESPONSE` | per user | 1 min | 30 | TTS generation calls |
| `WRAP_UP_DRAFT` | per user | 1 min | 5 | saveWrapUpDraftAction |

---

## How to Apply a Rate Limit

```ts
import { RATE_LIMIT_POLICIES } from '@/lib/rateLimit/rateLimitPolicy'
import { checkRateLimit, rateLimitErrorMessage } from '@/lib/rateLimit/inProcessRateLimit'

// In a server action:
const rl = checkRateLimit(RATE_LIMIT_POLICIES.DONNA_INTELLIGENCE, user.id, requestId)
if (!rl.allowed) {
  log.warn('rate_limit_exceeded', { policy: 'donna_intelligence', userId: user.id })
  return { ok: false, error: rateLimitErrorMessage(RATE_LIMIT_POLICIES.DONNA_INTELLIGENCE) }
}
```

For academy-scoped limits:
```ts
const rl = checkRateLimit(RATE_LIMIT_POLICIES.VOICE_SESSION_ACADEMY, academyId, requestId)
```

---

## Future: Reliable Rate Limiting (DB-Backed)

For reliable rate limiting in a serverless environment, the recommended approach is a Supabase `rate_limit_events` table:

### Proposed Schema

```sql
CREATE TABLE rate_limit_events (
  id bigserial PRIMARY KEY,
  academy_id uuid NOT NULL,
  actor_key text NOT NULL,        -- user_id or academy_id or IP
  policy_name text NOT NULL,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 1,
  last_request_at timestamptz DEFAULT now(),
  UNIQUE (actor_key, policy_name, window_start)
);

CREATE INDEX ON rate_limit_events (actor_key, policy_name, window_start);
```

### Implementation Pattern

```sql
-- Atomic upsert + count check in one round trip
INSERT INTO rate_limit_events (academy_id, actor_key, policy_name, window_start, count)
VALUES ($1, $2, $3, date_trunc('minute', now()), 1)
ON CONFLICT (actor_key, policy_name, window_start)
DO UPDATE SET count = rate_limit_events.count + 1, last_request_at = now()
RETURNING count;
-- If count > limit → reject
```

This approach is:
- Atomic (no race condition)
- Persistent across serverless instances
- Queryable for usage analytics
- Compatible with existing Supabase infrastructure

**Blocked on:** A migration adding `rate_limit_events`. This is a planned Sprint 402 continuation item.

---

## Routes/Actions to Apply Rate Limits (Priority Order)

| Route / Action | Policy to apply | Risk if unprotected |
|---|---|---|
| DONNA intelligence server action | `DONNA_INTELLIGENCE` | High cost per call |
| `transcribe/route.ts` | `VOICE_TRANSCRIPTION` | Whisper cost per audio minute |
| `structureCoachRecapAction` | `COACH_RECAP_STRUCTURING` | Anthropic cost per call |
| TTS route | `TTS_RESPONSE` | OpenAI TTS cost per character |
| DONNA text action | `DONNA_TEXT_ACTION` | Proposed_action spam |
| `saveWrapUpDraftAction` | `WRAP_UP_DRAFT` | Supplement to Sprint 401 30s guard |
| Parent/player AI question routes | `PORTAL_AI_QUESTION` | Cost + spam risk |

---

## What Was Not Implemented in Sprint 403

- DB-backed rate limit events (requires migration — stop condition)
- IP-based fallback rate limiting (Next.js headers extraction — deferred)
- Rate limit headers in responses (`X-RateLimit-Remaining`, etc.)
- Admin dashboard for rate limit monitoring
- Per-academy configurable limits (requires feature flags + DB)
