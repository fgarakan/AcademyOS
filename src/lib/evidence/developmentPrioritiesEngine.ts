// Development Priorities Engine V1
// Pure TypeScript — no DB calls, no side effects.
// Converts evidence records + level readiness signals into concrete development priorities.
//
// Core rule: The most valuable output is the next coaching focus.
// All outputs are director/coach-facing recommendations — not parent/player-visible.

import type { EvidenceRecord, EvidenceAnswer, ProgressRollup } from './playerEvidenceTypes'
import type { LevelReadinessResult } from './levelReadinessEngine'
import { isEvidenceStale } from './assessmentEvidenceMapper'

// ─── Output types ─────────────────────────────────────────────────────────────

export type PriorityCategory =
  | 'technical'
  | 'tactical'
  | 'competition'
  | 'movement'
  | 'mental'
  | 'behavior'

export const PRIORITY_CATEGORY_LABELS: Record<PriorityCategory, string> = {
  technical:   'Technical',
  tactical:    'Tactical',
  competition: 'Competition',
  movement:    'Movement',
  mental:      'Mental Performance',
  behavior:    'Behavior',
}

export interface DevelopmentPriority {
  rank:             number         // 1, 2, or 3
  category:         PriorityCategory
  label:            string         // e.g. "Serve Reliability"
  description:      string         // short coaching note
  evidenceSource:   string         // brief citation from evidence summary
  urgency:          'high' | 'medium' | 'low'
  isBlockingAdvancement: boolean
}

export interface DevelopmentStrength {
  category:   PriorityCategory
  label:      string
  evidenceSource: string
}

export interface DevelopmentRisk {
  category:   PriorityCategory
  label:      string
  reason:     string
  severity:   'high' | 'medium'
}

export interface DevelopmentPrioritiesResult {
  topPriorities:            DevelopmentPriority[]   // 1–3 ranked
  strengths:                DevelopmentStrength[]   // 1–4 strong signals
  risks:                    DevelopmentRisk[]        // 1–3 risk signals
  coachFocusAreas:          string[]                 // 1–3 coaching focus lines
  recommendedNextAssessment: string                  // what assessment to run next
  confidence:               number                   // 0–100
  donnaExplanation:         string
  computedAt:               string
  totalEvidenceUsed:        number
}

// ─── Evidence → priority category mapping ────────────────────────────────────

function evidenceToPriorityCategory(record: EvidenceRecord): PriorityCategory {
  const cat = (record.evidence_category ?? record.pathway ?? '').toLowerCase()
  const summary = record.evidence_summary.toLowerCase()

  if (cat === 'skill' || cat === 'technical' || summary.includes('technical') ||
      summary.includes('forehand') || summary.includes('backhand') || summary.includes('stroke')) {
    return 'technical'
  }
  if (cat === 'tactical' || summary.includes('tactical') || summary.includes('direction') ||
      summary.includes('pattern') || summary.includes('rally') || summary.includes('consistency')) {
    return 'tactical'
  }
  if (cat === 'competition' || record.pathway === 'competition' ||
      summary.includes('competition') || summary.includes('match') || summary.includes('scoring')) {
    return 'competition'
  }
  if (cat === 'movement' || record.pathway === 'fitness' ||
      summary.includes('movement') || summary.includes('recovery') || summary.includes('footwork')) {
    return 'movement'
  }
  if (cat === 'mental_performance' || cat === 'mental' || record.pathway === 'mental_performance' ||
      summary.includes('mental') || summary.includes('confidence') || summary.includes('resilience')) {
    return 'mental'
  }
  if (cat === 'behavior' || summary.includes('behavior') || summary.includes('effort') ||
      summary.includes('coachability') || summary.includes('focus')) {
    return 'behavior'
  }
  return 'technical' // default to technical for unknown categories
}

function extractShortLabel(summary: string): string {
  // Extract the first meaningful phrase from the evidence summary (up to 40 chars)
  const cleaned = summary.replace(/^(Assessment|Reassessment):?\s*/i, '').trim()
  const firstPeriod = cleaned.indexOf('.')
  const first = firstPeriod > 0 && firstPeriod < 60 ? cleaned.slice(0, firstPeriod) : cleaned.slice(0, 50)
  return first.trim() || 'Development area'
}

function buildCoachingNote(category: PriorityCategory, urgency: 'high' | 'medium' | 'low'): string {
  const urgencyPrefix = urgency === 'high' ? 'Critical focus: ' : urgency === 'medium' ? 'Key focus: ' : 'Developing: '
  const notes: Record<PriorityCategory, string> = {
    technical:   'Reinforce stroke mechanics and contact quality in practice drills.',
    tactical:    'Build decision-making under pressure with pattern-based drill sequences.',
    competition: 'Increase competitive exposure — match play, scoring practice, and pressure points.',
    movement:    'Prioritise recovery footwork and court positioning in warm-up and cool-down.',
    mental:      'Work on between-point routines, reset habits, and resilience under pressure.',
    behavior:    'Encourage listening, effort habits, and coachability during group sessions.',
  }
  return urgencyPrefix + notes[category]
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export interface DevelopmentPrioritiesInput {
  evidenceRecords:  EvidenceRecord[]
  readinessResult:  LevelReadinessResult | null
  playerFirstName:  string | null
  currentLevelName: string | null
}

export function calculateDevelopmentPriorities(
  input: DevelopmentPrioritiesInput,
): DevelopmentPrioritiesResult {
  const { evidenceRecords, readinessResult, playerFirstName, currentLevelName } = input
  const name = playerFirstName ?? 'This player'
  const now = new Date().toISOString()

  const freshRecords = evidenceRecords.filter(r => !isEvidenceStale(r.expires_at))

  // ── Separate weak (priority candidates) from strong (strengths) ──────────
  const weakRecords   = freshRecords.filter(r =>
    r.evidence_strength === 'weak' || r.confidence < 45
  )
  const strongRecords = freshRecords.filter(r =>
    r.evidence_strength === 'strong' && r.confidence >= 70
  )

  // Also pull blocking evidence from readiness result
  const blockingFromReadiness = readinessResult?.blockingEvidence ?? []
  const allWeakRecords = [
    ...weakRecords,
    ...blockingFromReadiness.filter(r => !weakRecords.some(wr => wr.id === r.id)),
  ]

  // ── Build priorities from weak/blocking records ───────────────────────────
  // Group by category, take the most severe per category
  const weakByCategory = new Map<PriorityCategory, EvidenceRecord>()
  for (const r of allWeakRecords) {
    const cat = evidenceToPriorityCategory(r)
    const existing = weakByCategory.get(cat)
    if (!existing || r.confidence < existing.confidence) {
      weakByCategory.set(cat, r)
    }
  }

  // Sort: blocking advancement first, then lowest confidence
  const sortedWeak = Array.from(weakByCategory.entries()).sort(([, a], [, b]) => {
    const aBlocking = blockingFromReadiness.some(r => r.id === a.id) ? 0 : 1
    const bBlocking = blockingFromReadiness.some(r => r.id === b.id) ? 0 : 1
    if (aBlocking !== bBlocking) return aBlocking - bBlocking
    return a.confidence - b.confidence
  })

  const topPriorities: DevelopmentPriority[] = sortedWeak.slice(0, 3).map(([cat, record], idx) => {
    const isBlocking = blockingFromReadiness.some(r => r.id === record.id) ||
      (readinessResult?.readinessStatus === 'not_ready' && idx === 0)
    const urgency: 'high' | 'medium' | 'low' = isBlocking ? 'high' : idx === 0 ? 'medium' : 'low'
    return {
      rank:               idx + 1,
      category:           cat,
      label:              PRIORITY_CATEGORY_LABELS[cat],
      description:        buildCoachingNote(cat, urgency),
      evidenceSource:     record.evidence_summary.slice(0, 100),
      urgency,
      isBlockingAdvancement: isBlocking,
    }
  })

  // ── Strengths from strong records ─────────────────────────────────────────
  const strengthByCategory = new Map<PriorityCategory, EvidenceRecord>()
  for (const r of strongRecords) {
    const cat = evidenceToPriorityCategory(r)
    const existing = strengthByCategory.get(cat)
    if (!existing || r.confidence > existing.confidence) {
      strengthByCategory.set(cat, r)
    }
  }

  const strengths: DevelopmentStrength[] = Array.from(strengthByCategory.entries())
    .sort(([, a], [, b]) => b.confidence - a.confidence)
    .slice(0, 4)
    .map(([cat, record]) => ({
      category:      cat,
      label:         PRIORITY_CATEGORY_LABELS[cat],
      evidenceSource: record.evidence_summary.slice(0, 80),
    }))

  // ── Risks from readiness result + stale evidence ──────────────────────────
  const risks: DevelopmentRisk[] = []

  if (readinessResult?.staleEvidence && readinessResult.staleEvidence.length > 0) {
    risks.push({
      category:  evidenceToPriorityCategory(readinessResult.staleEvidence[0]),
      label:     'Stale Evidence',
      reason:    `${readinessResult.staleEvidence.length} evidence record${readinessResult.staleEvidence.length !== 1 ? 's' : ''} expired — reassessment needed to restore confidence.`,
      severity:  'medium',
    })
  }

  if (readinessResult?.missingCategories && readinessResult.missingCategories.length >= 2) {
    risks.push({
      category:  'technical',
      label:     'Evidence Gaps',
      reason:    `Missing evidence in: ${readinessResult.missingCategories.slice(0, 3).join(', ')}. Assessment incomplete.`,
      severity:  readinessResult.missingCategories.length >= 3 ? 'high' : 'medium',
    })
  }

  for (const wp of topPriorities.filter(p => p.isBlockingAdvancement).slice(0, 1)) {
    risks.push({
      category:  wp.category,
      label:     `${wp.label} Gap`,
      reason:    `Weak ${wp.label.toLowerCase()} signal is the primary barrier to level advancement.`,
      severity:  'high',
    })
  }

  // ── Coach focus areas ─────────────────────────────────────────────────────
  const coachFocusAreas: string[] = topPriorities.slice(0, 3).map(p => p.description)

  // ── Recommended next assessment ───────────────────────────────────────────
  let recommendedNextAssessment: string
  if (readinessResult?.readinessStatus === 'ready') {
    recommendedNextAssessment = 'Level Readiness Assessment — confirm advancement readiness.'
  } else if (readinessResult?.readinessStatus === 'close') {
    recommendedNextAssessment = 'Level Readiness Assessment in 2–4 weeks after addressing top priorities.'
  } else if (freshRecords.length < 3) {
    recommendedNextAssessment = 'Development Assessment — baseline evidence needed.'
  } else {
    recommendedNextAssessment = 'Development Assessment in 4–6 weeks to measure priority progress.'
  }

  // ── Confidence ────────────────────────────────────────────────────────────
  const confidence = Math.min(100, Math.round(
    (freshRecords.length >= 5 ? 40 : freshRecords.length * 8) +
    (topPriorities.length > 0 ? 30 : 10) +
    (readinessResult ? 20 : 0) +
    (strengths.length > 0 ? 10 : 0)
  ))

  // ── DONNA explanation ─────────────────────────────────────────────────────
  const donnaExplanation = buildDonnaExplanation(
    name, topPriorities, strengths, readinessResult, currentLevelName,
  )

  return {
    topPriorities,
    strengths,
    risks: risks.slice(0, 3),
    coachFocusAreas,
    recommendedNextAssessment,
    confidence,
    donnaExplanation,
    computedAt:        now,
    totalEvidenceUsed: freshRecords.length,
  }
}

// ─── DONNA explanation ────────────────────────────────────────────────────────

function buildDonnaExplanation(
  name: string,
  priorities: DevelopmentPriority[],
  strengths: DevelopmentStrength[],
  readiness: LevelReadinessResult | null,
  levelName: string | null,
): string {
  if (priorities.length === 0 && strengths.length === 0) {
    return `Not enough evidence to generate development priorities for ${name}. Run a Development Assessment first.`
  }

  const levelClause = levelName ? ` at ${levelName}` : ''
  const priorityClause = priorities.length > 0
    ? ` Top priorities: ${priorities.map(p => p.label).join(', ')}.`
    : ' No clear weak areas in current evidence.'
  const strengthClause = strengths.length > 0
    ? ` Strengths: ${strengths.map(s => s.label).join(', ')}.`
    : ''
  const readinessClause = readiness
    ? ` Level readiness: ${readiness.readinessStatus.replace(/_/g, ' ')}.`
    : ''

  return `${name}${levelClause}.${priorityClause}${strengthClause}${readinessClause}`
}

// ─── DONNA answer builders ────────────────────────────────────────────────────

export function buildTopPrioritiesAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  readinessResult: LevelReadinessResult | null,
): EvidenceAnswer {
  const result = calculateDevelopmentPriorities({
    evidenceRecords:  records,
    readinessResult,
    playerFirstName,
    currentLevelName: null,
  })

  const name = playerFirstName ?? 'This player'

  if (result.topPriorities.length === 0) {
    return {
      intent:              'top_priorities',
      answer:              `Not enough evidence to generate priorities for ${name}. Run a Development Assessment first.`,
      citedEvidenceIds:    [],
      missingEvidenceNote: 'Development assessment evidence',
      confidence:          0,
      isSafe:              true,
      safeForParent:       false,
      safeForPlayer:       false,
    }
  }

  const priorityList = result.topPriorities
    .map((p, i) => `${i + 1}. ${p.label}${p.isBlockingAdvancement ? ' (blocking advancement)' : ''}`)
    .join(', ')

  return {
    intent:              'top_priorities',
    answer:              `${name}'s top development priorities: ${priorityList}. ${result.recommendedNextAssessment}`,
    citedEvidenceIds:    result.topPriorities.map(p => p.evidenceSource.slice(0, 10)),
    missingEvidenceNote: null,
    confidence:          result.confidence,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}

export function buildPlayerStrengthsAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  readinessResult: LevelReadinessResult | null,
): EvidenceAnswer {
  const result = calculateDevelopmentPriorities({
    evidenceRecords:  records,
    readinessResult,
    playerFirstName,
    currentLevelName: null,
  })

  const name = playerFirstName ?? 'This player'
  const intent = 'player_strengths'

  if (result.strengths.length === 0) {
    return {
      intent,
      answer:              `No strong evidence signals recorded yet for ${name}. More assessment evidence needed.`,
      citedEvidenceIds:    [],
      missingEvidenceNote: 'Assessment records with strong evidence strength',
      confidence:          20,
      isSafe:              true,
      safeForParent:       false,
      safeForPlayer:       false,
    }
  }

  const strengthList = result.strengths.map(s => s.label).join(', ')
  const supportingRecords = records.filter(r => r.evidence_strength === 'strong').slice(0, 3)

  return {
    intent,
    answer:              `${name}'s evidence-based strengths: ${strengthList}. These are areas with consistently strong assessment signals.`,
    citedEvidenceIds:    supportingRecords.map(r => r.id),
    missingEvidenceNote: null,
    confidence:          result.confidence,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}
