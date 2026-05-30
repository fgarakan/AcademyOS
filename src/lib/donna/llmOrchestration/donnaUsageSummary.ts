// Sprint 1006 — DONNA Usage Aggregation V1
// Sprint 1007 — DB query path added via optional SupabaseClient parameter.
// Safe usage summary for DONNA LLM calls, tool calls, and fallback events.
//
// Data source (Sprint 1007+):
//   If a SupabaseClient is provided, queries the persistent `usage_events` table.
//   dataSource === 'db_backed' — persistent, shared across instances, multi-day capable.
//
// Data source (in-process fallback):
//   If no SupabaseClient provided, reads from the in-process accumulator.
//   dataSource === 'in_process' — today only, current instance only, resets on cold start.
//
// Privacy invariants:
//   NEVER EXPOSE: raw prompts, raw LLM responses, raw tool payloads,
//                 raw notes, player names, full UUIDs.
//   SAFE TO EXPOSE: event type counts, latency aggregates, success/failure totals,
//                   data source label, window metadata.
//
// Failure handling:
//   getDonnaUsageSummary() is wrapped in try/catch — never throws.
//   Returns a clearly-labelled unavailable summary on any error.

import type { SupabaseClient } from '@supabase/supabase-js'
import { getInProcessDailyCount } from '@/lib/usage/usageTracker'

// ── Row type for usage_events DB query ────────────────────────────────────────
// Manual interface — database.types.ts is generated-only and not modified here.

interface UsageEventRow {
  event_type: string
  blocked: boolean
}

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
 * Return a safe DONNA usage summary for the given academy and window.
 *
 * Sprint 1007: if a SupabaseClient is provided, queries the persistent `usage_events` table
 * for accurate multi-day counts (dataSource: 'db_backed').
 *
 * Fallback (no supabase param): reads from the in-process accumulator.
 * In-process data: today only, current instance, resets on cold start.
 *
 * Never throws. Returns an unavailable summary on any error.
 *
 * @param academyId  - Academy ID for usage attribution (internal — never exposed in output).
 * @param windowDays - Requested window in calendar days (1–90).
 * @param supabase   - Optional Supabase client. When provided, queries DB. When absent, uses in-process.
 */
export async function getDonnaUsageSummary(
  academyId: string,
  windowDays: number,
  supabase?: SupabaseClient,
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

    // Compute window start
    const windowStartDate = new Date()
    windowStartDate.setUTCDate(windowStartDate.getUTCDate() - (clampedDays - 1))
    windowStartDate.setUTCHours(0, 0, 0, 0)
    const windowStart = windowStartDate.toISOString().slice(0, 10)

    // ── DB-backed path (Sprint 1007+) ─────────────────────────────────────────
    if (supabase) {
      return await buildDbSummary(supabase, academyId, clampedDays, windowStart, today)
    }

    // ── In-process fallback (no Supabase client available) ───────────────────
    const llmCallCount  = getInProcessDailyCount(academyId, 'donna_intelligence_call')
    const toolCallCount = getInProcessDailyCount(academyId, 'donna_tool_call')
    const fallbackCount = getInProcessDailyCount(academyId, 'donna_orchestration_fallback')

    const windowNote = clampedDays > 1
      ? `In-process store: today's counts only (current instance). Historical data (${clampedDays}-day window) requires DB-backed event store. Counts reflect this instance since last cold start.`
      : "In-process store: today's counts only (current instance). Resets on cold start. Not shared across serverless instances."

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
      tools: { totalToolCalls: toolCallCount, byToolId: undefined },
      fallbacks: { totalFallbacks: fallbackCount, byReason: undefined },
      dataSource: 'in_process',
    }
  } catch {
    return buildUnavailableSummary(
      academyId ?? 'unknown',
      windowDays ?? 1,
      'Usage aggregation encountered an unexpected error. DONNA is unaffected.',
    )
  }
}

// ── DB-backed aggregation ─────────────────────────────────────────────────────

const DONNA_EVENT_TYPES = [
  'donna_intelligence_call',
  'donna_tool_call',
  'donna_orchestration_fallback',
] as const

async function buildDbSummary(
  supabase: SupabaseClient,
  academyId: string,
  clampedDays: number,
  windowStart: string,
  windowEnd: string,
): Promise<DonnaUsageSummary> {
  try {
    // Fetch matching rows — counts and blocked flag only.
    // windowEnd covers all of today (occurred_at < start of tomorrow).
    const windowEndExclusive = new Date(windowEnd)
    windowEndExclusive.setUTCDate(windowEndExclusive.getUTCDate() + 1)
    const windowEndIso = windowEndExclusive.toISOString()

    const { data, error } = await supabase
      .from('usage_events')
      .select('event_type, blocked')
      .eq('academy_id', academyId)
      .in('event_type', DONNA_EVENT_TYPES)
      .gte('occurred_at', `${windowStart}T00:00:00.000Z`)
      .lt('occurred_at', windowEndIso)

    if (error || !data) {
      // DB query failed — fall through to in-process counts
      return buildUnavailableSummary(
        academyId,
        clampedDays,
        `DB query error: ${error?.message ?? 'no data'}. DONNA is unaffected.`,
      )
    }

    const rows = data as UsageEventRow[]

    // Count by event type — pure JS aggregation, no raw payloads
    let llmCallCount  = 0
    let toolCallCount = 0
    let fallbackCount = 0

    for (const row of rows) {
      if (row.event_type === 'donna_intelligence_call') llmCallCount++
      else if (row.event_type === 'donna_tool_call')          toolCallCount++
      else if (row.event_type === 'donna_orchestration_fallback') fallbackCount++
    }

    return {
      academyId,
      window: {
        windowDays: clampedDays,
        windowStart,
        windowEnd,
        isInProcessOnly: false,
        note: `DB-backed: persistent counts from usage_events table. Covers ${clampedDays} day(s) ending today.`,
      },
      llmCallCount,
      toolCallCount,
      fallbackCount,
      tools: { totalToolCalls: toolCallCount, byToolId: undefined },
      fallbacks: { totalFallbacks: fallbackCount, byReason: undefined },
      dataSource: 'db_backed',
    }
  } catch {
    return buildUnavailableSummary(
      academyId,
      clampedDays,
      'DB usage query failed unexpectedly. DONNA is unaffected.',
    )
  }
}
