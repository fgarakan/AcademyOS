// Curriculum Improvement Engine V1
// Converts player evidence (assessments, readiness blockers, development priorities)
// into ranked, evidence-backed curriculum improvement suggestions.
//
// Core principle: DONNA never presents recommendations as opinions.
// Every recommendation includes: confidence, evidence count, affected players,
// supporting signals, and reasoning.
//
// No DB calls. No mutations. Pure analysis.

import type { EvidenceRecord } from '@/lib/evidence/playerEvidenceTypes'
import type { LevelReadinessResult } from '@/lib/evidence/levelReadinessEngine'
import type { DevelopmentPrioritiesResult, DevelopmentPriority } from '@/lib/evidence/developmentPrioritiesEngine'
import { isEvidenceStale } from '@/lib/evidence/assessmentEvidenceMapper'

// ─── Output types ──────────────────────────────────────────────────────────────

export type ImprovementConfidence = 'LOW' | 'MEDIUM' | 'HIGH'

export interface CurriculumImprovementSuggestion {
  id:                string
  recommendation:    string           // What DONNA recommends
  confidence:        ImprovementConfidence
  confidenceScore:   number           // 0–100
  evidenceCount:     number           // Total evidence records that support this
  affectedPlayers:   number           // Estimated number of players affected
  supportingSignals: string[]         // Named signals (e.g. "12 development priorities: Serve")
  reasoning:         string           // Why DONNA is recommending this
  supportingEvidence: string[]        // Evidence summaries (up to 3)
  changeType:        'add_focus' | 'add_gate' | 'add_drill' | 'add_mission' | 'strengthen_existing' | 'fill_gap'
  targetDomain:      string           // e.g. 'technical', 'competition', 'movement'
  draftStarter:      string           // Pre-filled text for the curriculum draft
  impactLines:       string[]         // What will change if approved
  wontHappenLines:   string[]         // What won't change
}

export interface CurriculumImprovementAnalysis {
  levelKey:       string
  levelLabel:     string
  suggestions:    CurriculumImprovementSuggestion[]
  totalEvidence:  number
  analysisNote:   string
  computedAt:     string
}

// ─── Signal aggregation ───────────────────────────────────────────────────────

interface DomainSignal {
  domain:          string
  weakCount:       number
  blockingCount:   number
  priorityCount:   number
  assessmentCount: number
  totalSignals:    number
  sampleSummaries: string[]
}

function aggregateSignals(
  evidenceRecords: EvidenceRecord[],
  readiness:       LevelReadinessResult | null,
  priorities:      DevelopmentPrioritiesResult | null,
): Map<string, DomainSignal> {
  const signals = new Map<string, DomainSignal>()

  function get(domain: string): DomainSignal {
    if (!signals.has(domain)) {
      signals.set(domain, { domain, weakCount: 0, blockingCount: 0, priorityCount: 0, assessmentCount: 0, totalSignals: 0, sampleSummaries: [] })
    }
    return signals.get(domain)!
  }

  // From evidence records
  for (const r of evidenceRecords) {
    if (isEvidenceStale(r.expires_at)) continue
    const domain = r.evidence_category ?? r.pathway ?? 'general'
    const s = get(domain)
    if (r.source_type === 'assessment_score') s.assessmentCount++
    if (r.evidence_strength === 'weak') {
      s.weakCount++
      if (s.sampleSummaries.length < 3) s.sampleSummaries.push(r.evidence_summary.slice(0, 80))
    }
    s.totalSignals++
  }

  // From readiness blocking evidence
  if (readiness) {
    for (const r of readiness.blockingEvidence) {
      const domain = r.evidence_category ?? r.pathway ?? 'general'
      const s = get(domain)
      s.blockingCount++
      s.totalSignals++
    }
  }

  // From development priorities
  if (priorities) {
    for (const p of priorities.topPriorities) {
      const domain = p.category
      const s = get(domain)
      s.priorityCount++
      s.totalSignals++
    }
  }

  return signals
}

// ─── Confidence calculation ───────────────────────────────────────────────────

function computeConfidence(signal: DomainSignal): { confidence: ImprovementConfidence; score: number } {
  const total = signal.weakCount + signal.blockingCount + signal.priorityCount + signal.assessmentCount
  if (total >= 20 || (signal.weakCount >= 5 && signal.blockingCount >= 3 && signal.priorityCount >= 3)) {
    return { confidence: 'HIGH', score: Math.min(95, 70 + total) }
  }
  if (total >= 8 || (signal.weakCount >= 2 && signal.priorityCount >= 2)) {
    return { confidence: 'MEDIUM', score: Math.min(75, 50 + total * 2) }
  }
  return { confidence: 'LOW', score: Math.max(20, total * 8) }
}

// ─── Domain to readable label ─────────────────────────────────────────────────

function domainLabel(domain: string): string {
  const map: Record<string, string> = {
    technical:          'Technical',
    tactical:           'Tactical',
    competition:        'Competition',
    movement:           'Movement',
    mental:             'Mental Performance',
    mental_performance: 'Mental Performance',
    behavior:           'Behavior',
    skill:              'Skill',
    fitness:            'Fitness',
    general:            'General Development',
  }
  return map[domain] ?? domain.replace(/_/g, ' ')
}

// ─── Recommendation text builders ────────────────────────────────────────────

function buildRecommendationText(domain: string, levelLabel: string): string {
  const dl = domainLabel(domain)
  const templates: Record<string, string> = {
    technical:          `Add ${dl} focus content to ${levelLabel} curriculum`,
    tactical:           `Strengthen tactical progression requirements in ${levelLabel}`,
    competition:        `Add competition readiness gates to ${levelLabel}`,
    movement:           `Add movement and recovery focus to ${levelLabel} curriculum`,
    mental:             `Introduce mental performance content in ${levelLabel}`,
    mental_performance: `Introduce mental performance content in ${levelLabel}`,
    behavior:           `Add coachability and behavior expectations to ${levelLabel}`,
    skill:              `Add skill development content to ${levelLabel} curriculum`,
    fitness:            `Add fitness benchmarks to ${levelLabel}`,
    general:            `Expand ${levelLabel} curriculum coverage`,
  }
  return templates[domain] ?? `Improve ${dl} coverage in ${levelLabel}`
}

function buildDraftStarter(domain: string, levelLabel: string): string {
  const dl = domainLabel(domain)
  return `Add a ${dl} focus area to ${levelLabel}: [describe the specific skill or gate here]. This addresses repeated ${dl.toLowerCase()} weaknesses observed across multiple players at this level.`
}

function buildSupportingSignals(signal: DomainSignal, priorities: DevelopmentPrioritiesResult | null): string[] {
  const lines: string[] = []
  if (signal.weakCount > 0) lines.push(`${signal.weakCount} weak evidence record${signal.weakCount !== 1 ? 's' : ''} in ${domainLabel(signal.domain)}`)
  if (signal.blockingCount > 0) lines.push(`${signal.blockingCount} readiness blocker${signal.blockingCount !== 1 ? 's' : ''} in ${domainLabel(signal.domain)}`)
  if (signal.assessmentCount > 0) lines.push(`${signal.assessmentCount} assessment record${signal.assessmentCount !== 1 ? 's' : ''} identifying ${domainLabel(signal.domain).toLowerCase()} weaknesses`)
  if (signal.priorityCount > 0) lines.push(`${signal.priorityCount} development priorit${signal.priorityCount !== 1 ? 'ies' : 'y'} in ${domainLabel(signal.domain)}`)
  if (signal.sampleSummaries.length > 0) lines.push(`Evidence: "${signal.sampleSummaries[0]}"`)
  return lines.slice(0, 5)
}

function buildReasoning(domain: string, signal: DomainSignal, levelLabel: string): string {
  const dl = domainLabel(domain)
  const parts: string[] = []

  if (signal.weakCount >= 3 || signal.blockingCount >= 2) {
    parts.push(`${dl} weaknesses appear repeatedly across independent evidence sources`)
  }
  if (signal.priorityCount >= 2) {
    parts.push(`${dl} is consistently ranked as a top development priority`)
  }
  if (signal.assessmentCount >= 3) {
    parts.push(`${signal.assessmentCount} assessments have recorded ${dl.toLowerCase()} gaps`)
  }
  if (signal.blockingCount >= 1) {
    parts.push(`${dl} issues are actively blocking level advancement`)
  }

  if (parts.length === 0) {
    parts.push(`${dl} shows signal across ${signal.totalSignals} evidence records at the ${levelLabel} level`)
  }

  parts.push('The current curriculum does not have sufficient coverage to address this pattern.')
  return parts.join('. ') + '.'
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export interface CurriculumImprovementInput {
  levelKey:        string
  levelLabel:      string
  evidenceRecords: EvidenceRecord[]
  readiness:       LevelReadinessResult | null
  priorities:      DevelopmentPrioritiesResult | null
  // Estimated count of players at this level (for "affected players" field)
  playerCount:     number
}

export function analyzeCurriculumImprovements(
  input: CurriculumImprovementInput,
): CurriculumImprovementAnalysis {
  const { levelKey, levelLabel, evidenceRecords, readiness, priorities, playerCount } = input
  const now = new Date().toISOString()

  const signals = aggregateSignals(evidenceRecords, readiness, priorities)
  const totalEvidence = evidenceRecords.filter(r => !isEvidenceStale(r.expires_at)).length

  // Build suggestions from signals with enough support
  const suggestions: CurriculumImprovementSuggestion[] = []
  let idx = 0

  for (const [domain, signal] of Array.from(signals.entries())) {
    if (signal.totalSignals < 2) continue // Minimum signal threshold

    const { confidence, score } = computeConfidence(signal)
    const evidenceCount = signal.weakCount + signal.blockingCount + signal.assessmentCount + signal.priorityCount

    suggestions.push({
      id:              `improve_${levelKey}_${domain}_${idx++}`,
      recommendation:  buildRecommendationText(domain, levelLabel),
      confidence,
      confidenceScore: score,
      evidenceCount,
      affectedPlayers: Math.min(playerCount, Math.ceil(playerCount * (evidenceCount / Math.max(totalEvidence, 1)))),
      supportingSignals: buildSupportingSignals(signal, priorities),
      reasoning:       buildReasoning(domain, signal, levelLabel),
      supportingEvidence: signal.sampleSummaries,
      changeType:      signal.blockingCount > 0 ? 'add_gate' : signal.priorityCount > 0 ? 'add_focus' : 'fill_gap',
      targetDomain:    domain,
      draftStarter:    buildDraftStarter(domain, levelLabel),
      impactLines: [
        `A new ${domainLabel(domain).toLowerCase()} focus area will be added to ${levelLabel}.`,
        'Coaches will see this area in session planning guidance.',
        'Future assessments will be able to score against this curriculum requirement.',
        'Players at this level may have updated development priorities.',
      ],
      wontHappenLines: [
        'No players will be automatically moved or re-assessed.',
        'Existing assessments and evidence records will not be changed.',
        'Coach session plans will not be automatically updated.',
        'No parent or player communications will be sent.',
        'This change requires your explicit approval before anything is applied.',
      ],
    })
  }

  // Sort by confidence score descending
  suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore)

  let analysisNote: string
  if (suggestions.length === 0) {
    analysisNote = `Insufficient evidence to generate curriculum improvement suggestions for ${levelLabel}. Run assessments for players at this level to generate evidence-backed recommendations.`
  } else if (suggestions[0].confidence === 'HIGH') {
    analysisNote = `${suggestions.length} curriculum improvement suggestion${suggestions.length !== 1 ? 's' : ''} identified for ${levelLabel}. The top suggestion has HIGH confidence — strongly supported by evidence.`
  } else {
    analysisNote = `${suggestions.length} curriculum improvement suggestion${suggestions.length !== 1 ? 's' : ''} identified for ${levelLabel}. More evidence from assessments will increase recommendation confidence.`
  }

  return { levelKey, levelLabel, suggestions, totalEvidence, analysisNote, computedAt: now }
}

// ─── DONNA explanation for a single suggestion ─────────────────────────────

export function formatSuggestionForDonna(s: CurriculumImprovementSuggestion): string {
  const lines = [
    `**Recommendation:** ${s.recommendation}`,
    `**Confidence:** ${s.confidence} (${s.confidenceScore}%)`,
    `**Evidence Count:** ${s.evidenceCount}`,
    `**Affected Players:** ~${s.affectedPlayers}`,
    '',
    '**Supporting Signals:**',
    ...s.supportingSignals.map(sig => `· ${sig}`),
    '',
    `**Reasoning:** ${s.reasoning}`,
  ]
  if (s.supportingEvidence.length > 0) {
    lines.push('', '**Supporting Evidence:**')
    s.supportingEvidence.forEach(e => lines.push(`· ${e}`))
  }
  return lines.join('\n')
}
