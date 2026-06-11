// Sprint 1776–1805 — DONNA Academy Operating Partner V1
// Academy Attention Scoring: converts OperatingAttentionReport into AcademyAttentionScore.
//
// Each domain score = sum of signal severity weights, capped at 100.
// Overall score = weighted composite across 6 operational domains.
// whatRaisedScore / whatLoweredScore surface the top contributors to both sides.

import type { AcademyAttentionScore } from './operatingPartnerOutputContract'
import type { OperatingAttentionReport, OperatingAttentionSignal } from './academyAttentionEngine'

// ── Severity weights ───────────────────────────────────────────────────────────

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 40,
  high:     25,
  medium:   15,
  low:       5,
}

// Operational domain weights must sum to 1.0
const DOMAIN_WEIGHT: Record<string, number> = {
  players:    0.25,
  coaches:    0.20,
  curriculum: 0.20,
  parents:    0.15,
  business:   0.10,
  system:     0.10,
}

// ── Domain score ───────────────────────────────────────────────────────────────

function scoreForDomain(signals: OperatingAttentionSignal[], domain: string): number {
  const relevant = signals.filter(s => s.domain === domain && s.dataAvailable !== false)
  const raw = relevant.reduce((sum, s) => sum + (SEVERITY_WEIGHT[s.severity] ?? 0), 0)
  return Math.min(100, raw)
}

// ── Main scoring function ──────────────────────────────────────────────────────

export function buildAttentionScore(report: OperatingAttentionReport): AcademyAttentionScore {
  const { signals } = report

  const players    = scoreForDomain(signals, 'players')
  const coaches    = scoreForDomain(signals, 'coaches')
  const curriculum = scoreForDomain(signals, 'curriculum')
  const parents    = scoreForDomain(signals, 'parents')
  const business   = scoreForDomain(signals, 'business')
  const system     = scoreForDomain(signals, 'system')

  const overall = Math.min(100, Math.round(
    players    * DOMAIN_WEIGHT.players    +
    coaches    * DOMAIN_WEIGHT.coaches    +
    curriculum * DOMAIN_WEIGHT.curriculum +
    parents    * DOMAIN_WEIGHT.parents    +
    business   * DOMAIN_WEIGHT.business   +
    system     * DOMAIN_WEIGHT.system,
  ))

  const whatRaisedScore = signals
    .filter(s => s.severity === 'critical' || s.severity === 'high')
    .sort((a, b) => (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0))
    .slice(0, 4)
    .map(s => `${s.headline} (${s.domain})`)

  const withDataSet = new Set<string>(report.domainsWithData)
  const whatLoweredScore: string[] = []
  for (const domain of ['players', 'coaches', 'curriculum', 'parents', 'business', 'system']) {
    if (withDataSet.has(domain)) {
      const hasCriticalOrHigh = signals.some(
        s => s.domain === domain && (s.severity === 'critical' || s.severity === 'high'),
      )
      if (!hasCriticalOrHigh) {
        whatLoweredScore.push(`${domain} — no critical or high signals`)
      }
    }
  }

  const missingData = report.domainsMissing.map(
    d => `${d} data not loaded — score is a floor estimate`,
  )

  return { overall, players, coaches, curriculum, parents, business, system, whatRaisedScore, whatLoweredScore, missingData }
}
