// Sprint 409-410 — Background Job Queue Design + Foundation V1
// Defines job type contracts for all deferrable background work in AcademyOS.
// No external queue dependency — the initial implementation runs jobs inline/async.
// See docs/BACKGROUND_JOB_QUEUE_NOTES.md for the DB-backed roadmap.

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying'

export type JobType =
  | 'send_parent_update'         // Generate and send a parent development update
  | 'generate_coaching_message'  // AI-generate a coaching message
  | 'compute_kpi_snapshot'       // Recompute KPI snapshot for an academy
  | 'export_player_report'       // Export player development report
  | 'sync_utr_data'              // Sync UTR data for a player
  | 'archive_completed_sessions' // Archive sessions older than 90 days
  | 'recompute_recommendations'  // Rerun recommendation engine for a player

export interface JobPayload {
  send_parent_update: {
    academyId: string
    playerId: string
    summaryId: string
    recipientUserId: string
  }
  generate_coaching_message: {
    academyId: string
    playerId: string
    sessionId: string
    proposedById: string
  }
  compute_kpi_snapshot: {
    academyId: string
  }
  export_player_report: {
    academyId: string
    playerId: string
    requestedByUserId: string
  }
  sync_utr_data: {
    academyId: string
    playerId: string
    utrId: string
  }
  archive_completed_sessions: {
    academyId: string
    olderThanDays: number
  }
  recompute_recommendations: {
    academyId: string
    playerId: string
  }
}

export interface Job<T extends JobType = JobType> {
  id: string
  type: T
  payload: JobPayload[T]
  status: JobStatus
  academyId: string
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
  failedAt?: string | null
  errorMessage?: string | null
  attemptCount: number
  maxAttempts: number
}

export interface JobResult {
  success: boolean
  errorMessage?: string
}

export type JobHandler<T extends JobType> = (
  job: Job<T>
) => Promise<JobResult>
