// Mega Sprint 3691–3720 — DONNA Executive Reasoning Live Wiring V1
// Part 1 — Shadow mode + developer diagnostics.
//
// Three live modes for the Executive Operating Layer, resolved from the existing
// feature flag (no new flag introduced):
//   • off     — legacy path only (production default; executive layer dormant)
//   • shadow  — legacy returned to the user; executive run in parallel and
//               compared, developer-visible only. No user-facing change.
//   • primary — executive path returned to the user when it validates; legacy is
//               the certified fail-open fallback.
//
// This module holds the diagnostics contract, the in-memory recorder (so any
// conversation's OpenAI usage is provable), and the legacy-vs-executive
// comparison. No I/O, no OpenAI calls of its own.

export type ExecutiveMode = 'off' | 'shadow' | 'primary'

/** Resolve the live mode from the single existing flag. */
export function resolveExecutiveMode(): ExecutiveMode {
  const v = (process.env.DONNA_EXECUTIVE_REASONING ?? '').toLowerCase().trim()
  if (v === 'shadow') return 'shadow'
  if (v === '1' || v === 'true' || v === 'primary') return 'primary'
  return 'off'
}

// ── Developer diagnostics (per conversation) ────────────────────────────────────

export interface ExecutiveLiveDiagnostics {
  mode: ExecutiveMode
  /** Gateway was reached at all (real call or fail-open fallback). */
  openaiInvoked: boolean
  /** A real OpenAI call occurred (source === 'openai'). */
  openaiRealCall: boolean
  model: string
  reasoningGoal: string
  /** Estimated Executive Context Packet size (prompt tokens). */
  contextPacketTokens: number
  contextSources: number
  latencyMs: number
  confidenceTarget: number
  /** accepted | modified | rejected | fallback */
  responseDisposition: string
  /** The legacy response was returned to the user. */
  fallbackUsed: boolean
  /** The executive response was returned to the user. */
  executivePathUsed: boolean
  // ── Mega Sprint 3991–4020 — Unified Executive Context Engine developer trace ───
  /** Context sources skipped (excluded / not relevant / budget / redacted). */
  contextSourcesSkipped?: number
  /** Character size of the serialized packet sent toward OpenAI. */
  packetSizeChars?: number
  /** Current page was grounded into the packet (page awareness). */
  pageGrounded?: boolean
  /** Prior conversation was grounded into the packet (continuity). */
  conversationGrounded?: boolean
}

/** Human-readable one-liner proving what happened on a turn. */
export function formatDiagnostics(d: ExecutiveLiveDiagnostics): string {
  return (
    `mode=${d.mode} openaiInvoked=${d.openaiInvoked ? 'YES' : 'NO'} ` +
    `realCall=${d.openaiRealCall ? 'YES' : 'NO'} model=${d.model} ` +
    `goal=${d.reasoningGoal} packetTokens=${d.contextPacketTokens} ` +
    `sources=${d.contextSources} latencyMs=${d.latencyMs} ` +
    `confTarget=${d.confidenceTarget} disposition=${d.responseDisposition} ` +
    `fallbackUsed=${d.fallbackUsed ? 'YES' : 'NO'} executivePathUsed=${d.executivePathUsed ? 'YES' : 'NO'}`
  )
}

// ── Shadow comparison ───────────────────────────────────────────────────────────

export interface ShadowComparison {
  legacyIntent: string | null
  executiveGoal: string
  legacyNextAction: string | null
  executiveNextAction: string
  navigationPlan: string | null
  workflowPlan: string | null
  /** True when the executive path did not weaken approval/permission posture. */
  permissionsPreserved: boolean
  validationDisposition: string
  differences: string[]
}

// ── In-memory recorder (server-process scoped) ──────────────────────────────────

export interface ShadowRecord {
  diagnostics: ExecutiveLiveDiagnostics
  comparison: ShadowComparison | null
  message: string
  at: number
}

const MAX = 100
const _records: ShadowRecord[] = []

export function recordShadow(rec: Omit<ShadowRecord, 'at'>): ShadowRecord {
  const full: ShadowRecord = { ...rec, at: Date.now() }
  _records.push(full)
  if (_records.length > MAX) _records.shift()
  // eslint-disable-next-line no-console
  console.info(`[donna.executive] "${(full.message ?? '').slice(0, 60)}" — ${formatDiagnostics(full.diagnostics)}`)
  if (full.comparison?.differences.length) {
    // eslint-disable-next-line no-console
    console.info(`[donna.executive.shadow] differences: ${full.comparison.differences.join(' | ')}`)
  }
  return full
}

export function getShadowRecords(): readonly ShadowRecord[] {
  return _records
}

export function getLastShadowRecord(): ShadowRecord | null {
  return _records.length ? _records[_records.length - 1] : null
}

export function clearShadowRecords(): void {
  _records.length = 0
}
