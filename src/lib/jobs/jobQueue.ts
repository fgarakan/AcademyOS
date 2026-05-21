// Sprint 409-410 — Background Job Queue Foundation V1
// In-process job runner stub. Jobs are enqueued in memory and dispatched immediately.
// NOT durable — jobs are lost on cold starts or crashes.
//
// ⚠️ RELIABILITY WARNING:
// This is a foundation for the DB-backed job queue (Sprint 420+).
// For durable jobs, replace enqueueJob() with a DB insert into a `background_jobs` table.
// See docs/BACKGROUND_JOB_QUEUE_NOTES.md for the full roadmap.
//
// Safe defaults:
// - Jobs that fail do not retry automatically (maxAttempts = 1 for in-process).
// - Failed jobs log to stderr; they do not silently disappear.
// - A job that throws does not crash the process.

import type { Job, JobType, JobPayload, JobHandler, JobResult } from './jobTypes'
import { createRequestId } from '@/lib/observability/requestTrace'
import { logInfo, logError } from '@/lib/observability/logger'

const handlers = new Map<JobType, JobHandler<JobType>>()

// Register a handler for a job type. Called at app startup.
export function registerJobHandler<T extends JobType>(
  type: T,
  handler: JobHandler<T>,
): void {
  handlers.set(type, handler as JobHandler<JobType>)
}

// Enqueue a job. In the in-process implementation, runs the handler immediately (async).
// Returns the job ID for correlation in logs.
export async function enqueueJob<T extends JobType>(
  type: T,
  payload: JobPayload[T],
  academyId: string,
): Promise<string> {
  const jobId = createRequestId('job')
  const job: Job<T> = {
    id: jobId,
    type,
    payload,
    status: 'pending',
    academyId,
    createdAt: new Date().toISOString(),
    attemptCount: 0,
    maxAttempts: 1,
  }

  logInfo('job_enqueued', { jobId, type, academyId })

  // Dispatch asynchronously — do not block the caller.
  void dispatchJob(job)
  return jobId
}

async function dispatchJob<T extends JobType>(job: Job<T>): Promise<void> {
  const handler = handlers.get(job.type)
  if (!handler) {
    logError('job_no_handler', { jobId: job.id, type: job.type })
    return
  }

  const startedAt = new Date().toISOString()
  logInfo('job_started', { jobId: job.id, type: job.type, academyId: job.academyId, startedAt })

  let result: JobResult
  try {
    result = await (handler as JobHandler<T>)(job)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logError('job_exception', { jobId: job.id, type: job.type, errorMessage })
    return
  }

  if (result.success) {
    logInfo('job_completed', {
      jobId: job.id,
      type: job.type,
      latencyMs: Date.now() - Date.parse(startedAt),
    })
  } else {
    logError('job_failed', {
      jobId: job.id,
      type: job.type,
      errorMessage: result.errorMessage,
    })
  }
}
