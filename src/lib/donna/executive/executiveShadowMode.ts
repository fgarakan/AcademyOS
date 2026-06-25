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

/**
 * Resolve the live mode from the single existing flag.
 *
 * Live Executive Activation (Mega Sprint 4141–4170): the brain router
 * (processDonnaMessage / donnaCanonicalRouter) decides executive-first routing
 * CLIENT-SIDE. A non-`NEXT_PUBLIC_` env var is inlined as `undefined` in the
 * browser bundle, so the server-only `DONNA_EXECUTIVE_REASONING` was invisible to
 * client routing — the executive path stayed dormant in the live UI even when the
 * server action honored `primary`. We read the public mirror as a fallback so the
 * SAME logical flag activates both sides. The server still prefers the server-only
 * value (never weaker); the public mirror only fills the client gap. No new flag —
 * one value, set in both forms in `.env.local`.
 */
export function resolveExecutiveMode(): ExecutiveMode {
  const raw = process.env.DONNA_EXECUTIVE_REASONING ?? process.env.NEXT_PUBLIC_DONNA_EXECUTIVE_REASONING ?? ''
  const v = raw.toLowerCase().trim()
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
  // ── Mega Sprint 4141–4170 — Live Executive Activation: no silent fallback ──────
  /** The executive layer was attempted on this turn (mode ≠ off). */
  executiveAttempted: boolean
  /** Why legacy answered instead of the executive path (null when executive won). */
  fallbackReason: string | null
  /** Dialogue Engine — furthest progressive-planning stage reached this turn. */
  dialogueStage?: string
  /** Dialogue Engine — the objective the discussion is working toward. */
  dialogueObjective?: string | null
  /** Operating Session — the currently active objective for the workday. */
  sessionActiveObjective?: string | null
  /** Operating Session — count of still-open (active + paused) objectives. */
  sessionUnfinished?: number
  /** Action Loop — workflow reduced from live UI events (null when no events). */
  workflowName?: string | null
  /** Action Loop — current step label. */
  workflowStep?: string | null
  /** Action Loop — current blocker (failed validation), if any. */
  workflowBlocker?: string | null
  /** Action Loop — the next action derived from live execution state. */
  workflowNextAction?: string | null
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
    `attempted=${d.executiveAttempted ? 'YES' : 'NO'} ` +
    `fallbackUsed=${d.fallbackUsed ? 'YES' : 'NO'} executivePathUsed=${d.executivePathUsed ? 'YES' : 'NO'}` +
    (d.fallbackReason ? ` fallbackReason="${d.fallbackReason}"` : '') +
    (d.dialogueStage ? ` dialogue=${d.dialogueStage}` : '') +
    (d.sessionActiveObjective ? ` session="${d.sessionActiveObjective}"` : '') +
    (d.workflowName ? ` workflow=${d.workflowName}/${d.workflowStep ?? 'n/a'}${d.workflowBlocker ? `(blocked:${d.workflowBlocker})` : ''}` : '')
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
