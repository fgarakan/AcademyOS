// Mega Sprint 2971–3000 — DONNA Live AI Conversation + Learning Router V1
// AI Usage Metrics
//
// In-memory tracker for DONNA's live AI (OpenAI) usage.
// Records every live AI conversation assist: call counts, token costs, quality scores,
// DNA conflicts, response times, and per-role breakdowns.
//
// Used for: cost monitoring, quality regression detection, AI audit trail.
// Process-scoped — resets on server restart. DB persistence is a future sprint.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - All exported functions are safe to call from any server module.

// ── Types ─────────────────────────────────────────────────────────────────────

export type AICallSource = 'openai' | 'fallback' | 'not_called'

export interface AIUsageEvent {
  role: string
  source: AICallSource
  tokensUsed: number
  qualityScore: number
  dnaConflict: boolean
  dnaVerdict: 'pass' | 'flagged' | 'blocked'
  responseTimeMs?: number
}

export interface AIUsageByRole {
  calls: number
  openaiCalls: number
  tokensUsed: number
  avgQualityScore: number
}

export interface AIUsageSnapshot {
  totalCalls: number
  openaiCalls: number
  fallbackCalls: number
  notCalledCount: number
  totalTokensUsed: number
  avgTokensPerOpenAICall: number
  dnaConflicts: number
  dnaBlockedCount: number
  dnaFlaggedCount: number
  avgQualityScore: number
  byRole: Record<string, AIUsageByRole>
  snapshotAt: string
  sessionStartedAt: string
}

// ── Store ─────────────────────────────────────────────────────────────────────

class AIUsageMetricsStore {
  private events: AIUsageEvent[] = []
  private sessionStartedAt = new Date().toISOString()
  private readonly maxEvents = 5000

  record(event: AIUsageEvent): void {
    this.events.push(event)
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }
  }

  snapshot(): AIUsageSnapshot {
    const total = this.events.length
    const openai = this.events.filter(e => e.source === 'openai')
    const fallback = this.events.filter(e => e.source === 'fallback')
    const notCalled = this.events.filter(e => e.source === 'not_called')
    const totalTokens = openai.reduce((s, e) => s + e.tokensUsed, 0)
    const qualityScores = this.events.filter(e => e.qualityScore > 0).map(e => e.qualityScore)
    const avgQuality = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((s, q) => s + q, 0) / qualityScores.length)
      : 0

    const byRole: Record<string, AIUsageByRole> = {}
    for (const e of this.events) {
      if (!byRole[e.role]) {
        byRole[e.role] = { calls: 0, openaiCalls: 0, tokensUsed: 0, avgQualityScore: 0 }
      }
      const r = byRole[e.role]
      r.calls++
      if (e.source === 'openai') { r.openaiCalls++; r.tokensUsed += e.tokensUsed }
    }
    for (const role of Object.keys(byRole)) {
      const roleEvents = this.events.filter(e => e.role === role && e.qualityScore > 0)
      byRole[role].avgQualityScore = roleEvents.length > 0
        ? Math.round(roleEvents.reduce((s, e) => s + e.qualityScore, 0) / roleEvents.length)
        : 0
    }

    return {
      totalCalls: total,
      openaiCalls: openai.length,
      fallbackCalls: fallback.length,
      notCalledCount: notCalled.length,
      totalTokensUsed: totalTokens,
      avgTokensPerOpenAICall: openai.length > 0 ? Math.round(totalTokens / openai.length) : 0,
      dnaConflicts: this.events.filter(e => e.dnaConflict).length,
      dnaBlockedCount: this.events.filter(e => e.dnaVerdict === 'blocked').length,
      dnaFlaggedCount: this.events.filter(e => e.dnaVerdict === 'flagged').length,
      avgQualityScore: avgQuality,
      byRole,
      snapshotAt: new Date().toISOString(),
      sessionStartedAt: this.sessionStartedAt,
    }
  }

  reset(): void {
    this.events = []
    this.sessionStartedAt = new Date().toISOString()
  }
}

export const donnaAIUsageMetrics = new AIUsageMetricsStore()

export function recordAIUsage(event: AIUsageEvent): void {
  donnaAIUsageMetrics.record(event)
}

export function getAIUsageSnapshot(): AIUsageSnapshot {
  return donnaAIUsageMetrics.snapshot()
}
