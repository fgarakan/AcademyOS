# Background Job Queue Notes

> Sprint 409–410 — Background Job Queue Design + Foundation V1
> See also: `docs/IDEMPOTENCY_IMPLEMENTATION_NOTES.md`, `docs/OBSERVABILITY_IMPLEMENTATION_NOTES.md`

---

## What Was Created in Sprint 409–410

Two new files under `src/lib/jobs/`:

### `src/lib/jobs/jobTypes.ts`

Type definitions for the job system:
- `JobType` — registered job types (7 total)
- `JobPayload` — typed payload per job type
- `Job<T>` — full job record with status, attempt count, timestamps
- `JobHandler<T>` — async handler function signature
- `JobResult` — success/failure result shape

### `src/lib/jobs/jobQueue.ts`

In-process job runner:
- `registerJobHandler(type, handler)` — register a handler at app startup
- `enqueueJob(type, payload, academyId)` — enqueue and immediately dispatch (async)
- Jobs that fail log to stderr; they do not retry in the in-process implementation

---

## Current Limitation: In-Process Only

Jobs dispatched via `enqueueJob()` run in the same Next.js server instance.
- Not durable: if the serverless function times out or crashes, the job is lost
- Not shared: a job enqueued on instance A cannot be picked up by instance B
- No retry: in-process jobs get one attempt

This is acceptable for non-critical background tasks at pilot scale.
**Do not use for financial, billing, or compliance-critical operations.**

---

## Registered Job Types

| Job Type | Description | Payload |
|---|---|---|
| `send_parent_update` | Send a development update to a parent | academyId, playerId, summaryId, recipientUserId |
| `generate_coaching_message` | AI-generate a coaching message draft | academyId, playerId, sessionId, proposedById |
| `compute_kpi_snapshot` | Recompute KPI snapshot for an academy | academyId |
| `export_player_report` | Export a player development report | academyId, playerId, requestedByUserId |
| `sync_utr_data` | Sync UTR data for a player | academyId, playerId, utrId |
| `archive_completed_sessions` | Archive old completed sessions | academyId, olderThanDays |
| `recompute_recommendations` | Rerun recommendation engine for a player | academyId, playerId |

---

## Usage Pattern

```ts
import { enqueueJob } from '@/lib/jobs/jobQueue'
import { registerJobHandler } from '@/lib/jobs/jobQueue'
import type { JobHandler } from '@/lib/jobs/jobTypes'

// In app startup (e.g., a server component or route initializer):
const sendParentUpdateHandler: JobHandler<'send_parent_update'> = async (job) => {
  // implement the job
  return { success: true }
}
registerJobHandler('send_parent_update', sendParentUpdateHandler)

// In a server action:
const jobId = await enqueueJob('send_parent_update', {
  academyId,
  playerId,
  summaryId,
  recipientUserId,
}, academyId)
```

---

## Planned: DB-Backed Job Queue (Sprint 420+)

To make jobs durable, replace `enqueueJob()` with a DB insert into a `background_jobs` table:

```sql
CREATE TABLE background_jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id  uuid NOT NULL REFERENCES academies(id),
  job_type    text NOT NULL,
  payload     jsonb NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz DEFAULT now(),
  started_at  timestamptz,
  completed_at timestamptz,
  failed_at   timestamptz,
  error_message text,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts  integer NOT NULL DEFAULT 3
);
CREATE INDEX ON background_jobs (status, created_at) WHERE status = 'pending';
```

A separate cron process (Supabase cron extension or Vercel cron) polls for pending jobs
and dispatches them to registered handlers. The `Job<T>` type is already designed
to match this table shape.

---

## Trust Stack Alignment

- Jobs that produce proposed_actions must go through the normal approval flow
- Jobs must never directly mutate core player or session data without human approval
- All job executions should write to `audit_logs` on completion
- `send_parent_update` is NOT sent — it creates a draft that goes through the approval queue
