// Sprint 1006 — DONNA Usage Aggregation V1
// Safe in-process usage summary for DONNA LLM calls, tool calls, and fallback events.
// Pure TypeScript — no DB reads, no schema changes, no external calls.
//
// Data source:
//   Reads from the in-process accumulator in usageTracker.ts (getInProcessDailyCount).
//   This store is per-serverless-instance and resets on cold start.
//   It is NOT shared across instances and is NOT queryable from the database.
//   Counts represent today (UTC date) on the current instance only.
//
// V2 path:
//   Replace getInProcessDailyCount() calls with a DB-backed usage_events query
//   once a `usage_events` table is available (Sprint 1007+).
//   The interface is stable — callers will not change when the backend is upgraded.
//
// Privacy invariants (same as Sprint 1005):
//   NEVER EXPOSE: raw prompts, raw LLM responses, raw tool payloads,
//                 raw notes, player names, full UUIDs.
//   SAFE TO EXPOSE: event type counts, latency aggregates, success/failure totals,
//                   data source label, window metadata.
//
// Failure handling:
//   getDonnaUsageSummary() is wrapped in try/catch — never throws.
//   Returns a clearly-labelled unavailable summary on any error.

import { getInProcessDailyCount } from '@/lib/usage/usageTracker'

// ── Window metadata ───────────────────────────────────────────────────────────

/** Describes the time window and data source for a usage summary. */
export interface DonnaUsageWindow {
  /** Number of calendar days requested. */
  windowDays: number
  /** ISO date string for window start (UTC). */
  windowStart: string
  /** ISO date string for window end = today (UTC). */
  windowEnd: string
  /**
   * True when data comes from the in-process accumulator only.
   * In-process data: today's current instance only, resets on cold start.
   * False when backed by a persistent DB store (V2+).
   */
  isInProcessOnly: boolean
  /** Human-readable note about data source limitations. */
  note: string
}

// ── Tool usage ────────────────────────────────────────────────────────────────

/**
 * Aggregated DONNA live tool call counts.
 * In V1 the in-process store only tracks total donna_tool_call events —
 * per-tool breakdown requires a DB-backed store (V2+).
 */
export interface DonnaToolUsageSummary {
  /** Total live tool call events (donna_tool_call) in window. */
  totalToolCalls: number
  /**
   * Per-tool-ID breakdown.
   * undefined in V1 (in-process store does not bucket by toolId).
   * Available in V2+ with DB-backed event store.
   */
  byToolId: undefined
}

// ── Fallback usage ────────────────────────────────────────────────────────────

/**
 * Aggregated DONNA fallback event counts.
 * In V1 the in-process store only tracks total donna_orchestration_fallback events —
 * per-reason breakdown requires a DB-backed store (V2+).
 */
export interface DonnaFallbackSummary {
  /** Total fallback events (donna_orchestration_fallback) in window. */
  totalFallbacks: number
  /**
   * Per-reason breakdown (e.g. api_key_missing, validation_failed).
   * undefined in V1 (in-process store does not bucket by reason).
   * Available in V2+ with DB-backed event store.
   */
  byReason: undefined
}

// ── Top-level summary ─────────────────────────────────────────────────────────

/**
 * Safe DONNA usage summary for a given academy and time window.
 * All fields are counts or labels — no raw event payloads, no PII.
 */
export interface DonnaUsageSummary {
  /** Academy ID for attribution context (internal only — not exposed to output). */
  academyId: string
  /** Window and data source metadata. */
  window: DonnaUsageWindow
  /**
   * Total DONNA LLM intelligence calls (donna_intelligence_call) in window.
   * Each represents one full Anthropic API round-trip (single or multi-turn).
   */
  llmCallCount: number
  /**
   * Total DONNA live context tool calls (donna_tool_call) in window.
   * Includes both successful and failed tool executions.
   */
  toolCallCount: number
  /**
   * Total DONNA orchestration fallback events (donna_orchestration_fallback) in window.
   * A non-zero value means DONNA fell back to deterministic responses for some requests.
   */
  fallbackCount: number
  /** Detailed tool usage aggregation. */
  tools: DonnaToolUsageSummary
  /** Detailed fallback aggregation. */
  fallbacks: DonnaFallbackSummary
  /**
   * Data source label:
   * - 'in_process': in-process accumulator only (today, current instance, resets on cold start)
   * - 'db_backed': persistent DB-backed event store (V2+)
   * - 'unavailable': summary could not be computed (error path)
   */
  dataSource: 'in_process' | 'db_backed' | 'unavailable'
}

// ── Unavailable sentinel ──────────────────────────────────────────────────────

function buildUnavailableSummary(academyId: string, windowDays: number, reason: string): DonnaUsageSummary {
  const today = new Date().toISOString().slice(0, 10)
  return {
    academyId,
    window: {
      windowDays,
      windowStart: today,
      windowEnd: today,
      isInProcessOnly: true,
      note: reason,
    },
    llmCallCount: 0,
    toolCallCount: 0,
    fallbackCount: 0,
    tools: { totalToolCalls: 0, byToolId: undefined },
    fallbacks: { totalFallbacks: 0, byReason: undefined },
    dataSource: 'unavailable',
  }
}

// ── Main aggregation function ─────────────────────────────────────────────────

/**
 * Return a safe in-process DONNA usage summary for the given academy and window.
 *
 * V1 behavior:
 *   - windowDays === 1: returns today's in-process counts for current serverless instance.
 *   - windowDays > 1: returns today's in-process counts (historical data unavailable in V1).
 *     The window metadata documents this honestly — no fake multi-day totals.
 *
 * Never throws. Returns an unavailable summary on any error.
 *
 * @param academyId - Academy ID for usage attribution (internal — never exposed in output).
 * @param windowDays - Requested window in calendar days (1–90). Only day 0 (today) is available in V1.
 */
export async function getDonnaUsageSummary(
  academyId: string,
  windowDays: number,
): Promise<DonnaUsageSummary> {
  try {
    if (!academyId || typeof academyId !== 'string') {
      return buildUnavailableSummary(
        academyId ?? 'unknown',
        windowDays,
        'academyId is required for usage aggregation.',
      )
    }

    const clampedDays = Math.max(1, Math.min(windowDays, 90))
    const today = new Date().toISOString().slice(0, 10)

    // ── Read in-process counts for today ─────────────────────────────────────
    // getInProcessDailyCount() is synchronous — reads from the module-level Map.
    // It only has today's counts for the current serverless instance.
    const llmCallCount   = getInProcessDailyCount(academyId, 'donna_intelligence_call')
    const toolCallCount  = getInProcessDailyCount(academyId, 'donna_tool_call')
    const fallbackCount  = getInProcessDailyCount(academyId, 'donna_orchestration_fallback')

    // ── Build window metadata ─────────────────────────────────────────────────
    const isMultiDay = clampedDays > 1
    const windowNote = isMultiDay
      ? `In-process store: today's counts only (current instance). Historical data (${clampedDays}-day window) requires DB-backed event store (V2+). Counts reflect this instance since last cold start.`
      : 'In-process store: today\'s counts only (current instance). Resets on cold start. Not shared across serverless instances.'

    // Approximate window start — subtract windowDays, but data is today-only in V1.
    const windowStartDate = new Date()
    windowStartDate.setUTCDate(windowStartDate.getUTCDate() - (clampedDays - 1))
    const windowStart = windowStartDate.toISOString().slice(0, 10)

    return {
      academyId,
      window: {
        windowDays: clampedDays,
        windowStart,
        windowEnd: today,
        isInProcessOnly: true,
        note: windowNote,
      },
      llmCallCount,
      toolCallCount,
      fallbackCount,
      tools: {
        totalToolCalls: toolCallCount,
        byToolId: undefined, // V2+: per-tool breakdown via DB-backed store
      },
      fallbacks: {
        totalFallbacks: fallbackCount,
        byReason: undefined, // V2+: per-reason breakdown via DB-backed store
      },
      dataSource: 'in_process',
    }
  } catch {
    // Aggregation failure must never surface — return unavailable sentinel
    return buildUnavailableSummary(
      academyId ?? 'unknown',
      windowDays ?? 1,
      'Usage aggregation encountered an unexpected error. DONNA is unaffected.',
    )
  }
}
