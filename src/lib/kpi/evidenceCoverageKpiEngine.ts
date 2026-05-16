// Evidence Coverage and Readiness Confidence KPI Engine — Sprint 424
//
// Pure TypeScript. No DB calls. No Supabase imports. No async.
// Accepts pre-fetched plain-object arrays from the calling server action.
// Returns KpiResult[] for display in DONNA's player progress summary.
//
// KPIs implemented:
//   KPI 14 — Evidence Coverage Score    (demo — schema exists, data may be absent)
//   KPI 22 — Readiness Confidence       (partial — approximation using advancement_eligible
//                                         + evidence coverage as combined proxy)
//
// Status rationale:
//   KPI 14 is demo: curriculum_gates and player_gate_status exist in the schema.
//     If the live DB has no gate data for this level (migrations 041–044 may not
//     be applied), the engine returns insufficient_data with a clear explanation.
//   KPI 22 is partial: no eligible_since_at column exists — last_evaluated_at
//     is used as a proxy for when eligibility was last assessed, not when it
//     was first set.

import { type KpiResult, type KpiStatus } from './kpiTypes'
import { formatRateDisplay } from './kpiTypes'

// ---------------------------------------------------------------------------
// Input shapes — plain objects only, no DB types imported
// ---------------------------------------------------------------------------

export interface GateRow {
  gate_id: string
  criterion: string
  domain: string
  is_active: boolean
}

export interface GateStatusRow {
  gate_id: string
  evidence_count: number
  status: string        // 'confirmed' | 'pending' | 'waived' | other
  last_evidence_at: string | null
}

export interface EvidenceCoverageInput {
  playerId: string
  currentLevelId: string | null
  // Gates defined for this level (from curriculum_gates where from_level_id = currentLevelId)
  levelGates: GateRow[]
  // Player's gate status rows (from player_gate_status where player_id = playerId)
  playerGateStatuses: GateStatusRow[]
  // From player_curriculum_states
  advancementEligible: boolean | null
  lastEvaluatedAt: string | null
}

// ---------------------------------------------------------------------------
// Status values treated as "has evidence"
// ---------------------------------------------------------------------------

const EVIDENCED_STATUSES = new Set(['confirmed', 'met', 'complete', 'waived'])

function hasEvidence(row: GateStatusRow): boolean {
  return row.evidence_count > 0 || EVIDENCED_STATUSES.has(row.status?.toLowerCase() ?? '')
}

// ---------------------------------------------------------------------------
// KPI 14 — Evidence Coverage Score
//
// Status: demo (or insufficient_data if no gates exist for this level)
// Measures: (gates with evidence / total active gates) × 100
// ---------------------------------------------------------------------------

export function computeEvidenceCoverage(input: EvidenceCoverageInput): KpiResult {
  const { currentLevelId, levelGates, playerGateStatuses } = input

  // No curriculum state at all → insufficient_data
  if (!currentLevelId) {
    return {
      kpiId: 14,
      name: 'Evidence Coverage Score',
      status: 'insufficient_data',
      value: null,
      displayText: 'No curriculum level assigned — evidence coverage cannot be computed.',
      caveat: 'Assign a curriculum level to enable gate evidence tracking.',
    }
  }

  const activeGates = levelGates.filter(g => g.is_active)

  // No gates defined for this level → schema gap (migrations likely not applied)
  if (activeGates.length === 0) {
    return {
      kpiId: 14,
      name: 'Evidence Coverage Score',
      status: 'insufficient_data',
      value: null,
      displayText: `No curriculum gates are defined for this level (${currentLevelId}). Gate data may not be seeded yet — migrations 041–044 may need to be applied to the live database.`,
      caveat: 'Evidence coverage requires curriculum gates to be seeded for this level.',
    }
  }

  // Gates exist — count coverage
  const gateStatusByGateId = new Map(playerGateStatuses.map(s => [s.gate_id, s]))
  let evidencedCount = 0
  const missingGates: string[] = []

  for (const gate of activeGates) {
    const gateStatus = gateStatusByGateId.get(gate.gate_id)
    if (gateStatus && hasEvidence(gateStatus)) {
      evidencedCount++
    } else {
      missingGates.push(gate.criterion.slice(0, 80))
    }
  }

  const total = activeGates.length
  const pct = Math.round((evidencedCount / total) * 100)
  const status: KpiStatus = 'demo'

  let displayText = formatRateDisplay(evidencedCount, total, 'gates with evidence', 'current level')

  if (missingGates.length > 0 && missingGates.length <= 3) {
    displayText += ` Missing: ${missingGates.join('; ')}.`
  } else if (missingGates.length > 3) {
    displayText += ` ${missingGates.length} gates have no evidence recorded.`
  }

  return {
    kpiId: 14,
    name: 'Evidence Coverage Score',
    status,
    value: pct,
    denominator: total,
    displayText,
    caveat:
      'Demo — based on player_gate_status rows. Gates with no status row are treated as missing evidence. Coverage reflects what has been explicitly recorded.',
  }
}

// ---------------------------------------------------------------------------
// KPI 22 — Readiness Confidence
//
// Status: partial
// Composite proxy: advancement_eligible flag + evidence coverage.
// No eligible_since_at exists — last_evaluated_at is used as proxy for
// recency of the eligibility assessment.
// ---------------------------------------------------------------------------

export function computeReadinessConfidence(input: EvidenceCoverageInput): KpiResult {
  const { advancementEligible, lastEvaluatedAt, levelGates, playerGateStatuses, currentLevelId } =
    input

  const status: KpiStatus = 'partial'

  if (!currentLevelId || advancementEligible === null) {
    return {
      kpiId: 22,
      name: 'Readiness Confidence',
      status: 'insufficient_data',
      value: null,
      displayText: 'Readiness confidence cannot be assessed — curriculum state is not set.',
      caveat: 'Requires a curriculum level assignment and eligibility evaluation.',
    }
  }

  const activeGates = levelGates.filter(g => g.is_active)
  const gateStatusByGateId = new Map(playerGateStatuses.map(s => [s.gate_id, s]))
  let evidencedCount = 0
  for (const gate of activeGates) {
    const gateStatus = gateStatusByGateId.get(gate.gate_id)
    if (gateStatus && hasEvidence(gateStatus)) evidencedCount++
  }
  const total = activeGates.length
  const coveragePct = total > 0 ? Math.round((evidencedCount / total) * 100) : null

  let evaluatedNote = ''
  if (lastEvaluatedAt) {
    const msPerDay = 1000 * 60 * 60 * 24
    const days = Math.round((Date.now() - new Date(lastEvaluatedAt).getTime()) / msPerDay)
    evaluatedNote = ` Last evaluated ${days} day${days !== 1 ? 's' : ''} ago.`
  }

  let displayText: string
  if (advancementEligible === true) {
    displayText =
      coveragePct !== null
        ? `Marked advancement-eligible with ${coveragePct}% gate evidence coverage.${evaluatedNote}`
        : `Marked advancement-eligible.${evaluatedNote} Gate evidence data unavailable for this level.`
  } else {
    displayText =
      coveragePct !== null
        ? `Not yet eligible for advancement. ${coveragePct}% gate evidence coverage.${evaluatedNote}`
        : `Not yet eligible for advancement.${evaluatedNote} Gate evidence data unavailable for this level.`
  }

  return {
    kpiId: 22,
    name: 'Readiness Confidence',
    status,
    value: advancementEligible === true ? (coveragePct ?? 0) : 0,
    displayText,
    caveat:
      'Partial — advancement_eligible is a system flag, not a director decision. last_evaluated_at used as proxy for assessment recency (no eligible_since_at column exists). Evidence coverage may undercount if gates are not seeded.',
  }
}

// ---------------------------------------------------------------------------
// computeEvidenceCoverageKpis — convenience wrapper
// Returns KPI 14 and KPI 22 for a single player.
// ---------------------------------------------------------------------------

export function computeEvidenceCoverageKpis(input: EvidenceCoverageInput): KpiResult[] {
  return [computeEvidenceCoverage(input), computeReadinessConfidence(input)]
}

// ---------------------------------------------------------------------------
// formatEvidenceCoverageForDonna
//
// Converts KpiResult[] to DONNA output lines.
// Always shows status tag and caveat for non-live KPIs.
// ---------------------------------------------------------------------------

export function formatEvidenceCoverageForDonna(results: KpiResult[]): string[] {
  if (results.length === 0) return []

  const lines: string[] = ['', 'EVIDENCE & READINESS:']

  for (const r of results) {
    const statusTag =
      r.status === 'live'
        ? '[live]'
        : r.status === 'partial'
        ? '[partial]'
        : r.status === 'demo'
        ? '[demo]'
        : '[insufficient data]'

    lines.push(`• ${r.name} ${statusTag}: ${r.displayText}`)
    if (r.caveat && r.status !== 'live') {
      lines.push(`  ↳ ${r.caveat}`)
    }
  }

  return lines
}
