// Mega Sprint 1746–1775 — DONNA Philosophy Memory & Academy Evolution Engine V1
// Academy Evolution Timeline: auto-generated history of how the academy has changed.
// Philosophy Drift Detection: compares stated philosophy vs. observed behavior.
//
// Evolution timeline sources:
//   - CurriculumMemoryEntry[] — curriculum adds, changes, removals
//   - AcademyMemory[] — promotions, placements, assessments, communications
//
// Drift detection inputs:
//   - AcademyDnaSummary — stated philosophy at onboarding
//   - PreferenceSignal[] — observed behavior patterns
//   - IdentityDimension[] — dimension-level drift warnings from identity profile
//
// Pure TypeScript. No DB calls. No mutations. Deterministic.

import type { AcademyMemory, MemorySourceType } from '../memory/donnaAcademyMemoryTypes'
import type { CurriculumMemoryEntry } from '../curriculum/curriculumMemory'
import type { AcademyDnaSummary } from '../curriculum/curriculumIntelligenceContext'
import type { IdentityDimension } from './academyIdentityProfile'
import type { PreferenceSignal } from './academyPreferenceExtractor'

// ── Timeline types ────────────────────────────────────────────────────────────

export type EvolutionTheme =
  | 'curriculum_expansion'     // Significant curriculum growth
  | 'player_advancement'       // Strong advancement activity
  | 'assessment_investment'    // Heavy assessment/evaluation activity
  | 'parent_communication'     // Parent communication focus
  | 'structural_changes'       // Moves, replacements, overrides
  | 'competition_push'         // Competition/tactical curriculum additions
  | 'technical_investment'     // Technical curriculum additions
  | 'game_based_shift'         // Game-based curriculum shift
  | 'general_operations'       // Mixed activity
  | 'quiet_period'             // Low activity

export interface EvolutionChange {
  type:        'curriculum_add' | 'curriculum_remove' | 'curriculum_modify' | 'player_advance' | 'assessment' | 'parent_update' | 'other'
  description: string
  date:        string
}

export interface EvolutionPhase {
  /** ISO month string e.g. "2026-03" */
  periodKey:       string
  periodLabel:     string      // e.g. "March 2026"
  keyChanges:      EvolutionChange[]
  dominantTheme:   EvolutionTheme
  activityLevel:   'high' | 'moderate' | 'low'
  curriculumAdded: number
  curriculumRemoved: number
  playersAdvanced: number
  assessmentsRun:  number
}

export interface AcademyEvolutionTimeline {
  phases:          EvolutionPhase[]
  totalPhases:     number
  activeMonths:    number
  earliestActivity: string | null
  latestActivity:   string | null
  overallTheme:    EvolutionTheme
  /** High-level summary sentence */
  summaryLine:     string
  dataLimitations: string[]
}

// ── Timeline builder ──────────────────────────────────────────────────────────

function periodKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7)  // "YYYY-MM"
}

function periodLabel(key: string): string {
  const [year, month] = key.split('-')
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthName = MONTHS[parseInt(month, 10) - 1] ?? month
  return `${monthName} ${year}`
}

function sourceTypeToChangeType(st: MemorySourceType): EvolutionChange['type'] {
  if (st === 'promotion_decision' || st === 'placement_decision') return 'player_advance'
  if (st === 'assessment_result')  return 'assessment'
  if (st === 'parent_update')      return 'parent_update'
  if (st === 'curriculum_change')  return 'curriculum_add'
  return 'other'
}

function inferCurriculumChangeType(entry: CurriculumMemoryEntry): EvolutionChange['type'] {
  return entry.intent === 'remove' ? 'curriculum_remove'
    : entry.intent === 'modify' || entry.intent === 'move' ? 'curriculum_modify'
    : 'curriculum_add'
}

function dominantThemeForPhase(phase: Pick<EvolutionPhase, 'curriculumAdded' | 'curriculumRemoved' | 'playersAdvanced' | 'assessmentsRun' | 'keyChanges'>): EvolutionTheme {
  const total = phase.keyChanges.length
  if (total === 0) return 'quiet_period'

  const addedContentTypes = phase.keyChanges
    .filter(c => c.type === 'curriculum_add')
    .map(c => c.description.toLowerCase())

  const hasGame     = addedContentTypes.some(d => d.includes('game'))
  const hasTactical = addedContentTypes.some(d => d.includes('tactical'))
  const hasDrill    = addedContentTypes.some(d => d.includes('drill') || d.includes('skill'))
  const hasCompete  = addedContentTypes.some(d => d.includes('competition'))

  if (phase.curriculumAdded >= 3 && hasGame) return 'game_based_shift'
  if (phase.curriculumAdded >= 3 && (hasTactical || hasCompete)) return 'competition_push'
  if (phase.curriculumAdded >= 3 && hasDrill) return 'technical_investment'
  if (phase.curriculumAdded >= 3) return 'curriculum_expansion'
  if (phase.playersAdvanced >= 3) return 'player_advancement'
  if (phase.assessmentsRun >= 3)  return 'assessment_investment'
  if (phase.curriculumRemoved >= 2) return 'structural_changes'

  const parentCount = phase.keyChanges.filter(c => c.type === 'parent_update').length
  if (parentCount >= 2) return 'parent_communication'

  return 'general_operations'
}

export function buildAcademyEvolutionTimeline(
  academyMemories:  AcademyMemory[],
  curriculumMemory: CurriculumMemoryEntry[],
): AcademyEvolutionTimeline {
  const byPeriod: Record<string, {
    curriculumAdded: number
    curriculumRemoved: number
    playersAdvanced: number
    assessmentsRun: number
    keyChanges: EvolutionChange[]
  }> = {}

  function ensurePeriod(key: string) {
    if (!byPeriod[key]) {
      byPeriod[key] = { curriculumAdded: 0, curriculumRemoved: 0, playersAdvanced: 0, assessmentsRun: 0, keyChanges: [] }
    }
  }

  // ── Curriculum memory ─────────────────────────────────────────────────────
  for (const entry of curriculumMemory) {
    const key = periodKeyFromDate(entry.createdAt)
    ensurePeriod(key)
    const period = byPeriod[key]
    const changeType = inferCurriculumChangeType(entry)

    if (changeType === 'curriculum_add')    period.curriculumAdded++
    if (changeType === 'curriculum_remove') period.curriculumRemoved++

    period.keyChanges.push({
      type:        changeType,
      description: entry.changeDescription,
      date:        entry.createdAt,
    })
  }

  // ── Academy memory ────────────────────────────────────────────────────────
  for (const mem of academyMemories) {
    const key = periodKeyFromDate(mem.occurredAt)
    ensurePeriod(key)
    const period = byPeriod[key]
    const changeType = sourceTypeToChangeType(mem.sourceType)

    if (changeType === 'player_advance') period.playersAdvanced++
    if (changeType === 'assessment')     period.assessmentsRun++

    period.keyChanges.push({
      type:        changeType,
      description: mem.headline,
      date:        mem.occurredAt,
    })
  }

  const periodKeys = Object.keys(byPeriod).sort()

  const phases: EvolutionPhase[] = periodKeys.map(key => {
    const data = byPeriod[key]
    const totalActivity = data.keyChanges.length

    return {
      periodKey:       key,
      periodLabel:     periodLabel(key),
      keyChanges:      data.keyChanges.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8),
      dominantTheme:   dominantThemeForPhase(data),
      activityLevel:   totalActivity >= 5 ? 'high' : totalActivity >= 2 ? 'moderate' : 'low',
      curriculumAdded:   data.curriculumAdded,
      curriculumRemoved: data.curriculumRemoved,
      playersAdvanced:   data.playersAdvanced,
      assessmentsRun:    data.assessmentsRun,
    }
  })

  const allDates: string[] = [
    ...academyMemories.map(m => m.occurredAt),
    ...curriculumMemory.map(m => m.createdAt),
  ]
  const earliest = allDates.length > 0 ? allDates.reduce((a, b) => a < b ? a : b) : null
  const latest   = allDates.length > 0 ? allDates.reduce((a, b) => a > b ? a : b) : null

  const themeCounts: Record<string, number> = {}
  for (const phase of phases) {
    themeCounts[phase.dominantTheme] = (themeCounts[phase.dominantTheme] ?? 0) + 1
  }
  const overallTheme = (Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'general_operations') as EvolutionTheme

  const totalCurriculumAdded = phases.reduce((s, p) => s + p.curriculumAdded, 0)
  const totalAdvanced        = phases.reduce((s, p) => s + p.playersAdvanced, 0)
  const summaryLine = phases.length === 0
    ? 'No activity recorded yet.'
    : `${phases.length} active month${phases.length !== 1 ? 's' : ''} — ${totalCurriculumAdded} curriculum item${totalCurriculumAdded !== 1 ? 's' : ''} added, ${totalAdvanced} player advancement${totalAdvanced !== 1 ? 's' : ''} recorded.`

  const dataLimitations: string[] = []
  if (curriculumMemory.length === 0) dataLimitations.push('No curriculum history — curriculum timeline not available.')
  if (academyMemories.length === 0)  dataLimitations.push('No approval history — operational timeline not available.')

  return {
    phases,
    totalPhases:     phases.length,
    activeMonths:    phases.length,
    earliestActivity: earliest,
    latestActivity:   latest,
    overallTheme,
    summaryLine,
    dataLimitations,
  }
}

// ── Philosophy Drift Detection ─────────────────────────────────────────────────

export type DriftSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

export interface PhilosophyDriftReport {
  driftDetected:        boolean
  driftSeverity:        DriftSeverity
  driftedDimensions:    Array<{
    dimension:          string
    statedScore:        number
    observedScore:      number
    gap:                number
    description:        string
  }>
  donnaMessage:         string
  confidence:           'high' | 'medium' | 'low' | 'insufficient'
  suggestedAction:      string
}

/**
 * Compares stated DNA philosophy against observed behavioral preferences.
 * Uses dimension drift warnings computed in buildAcademyIdentityProfile().
 */
export function detectPhilosophyDrift(
  dimensions:       IdentityDimension[],
  dna:              AcademyDnaSummary,
  preferences:      PreferenceSignal[],
): PhilosophyDriftReport {
  if (!dna.hasDna || preferences.length === 0) {
    return {
      driftDetected:     false,
      driftSeverity:     'LOW',
      driftedDimensions: [],
      donnaMessage:      'Insufficient data to assess philosophy drift.',
      confidence:        'insufficient',
      suggestedAction:   'Complete academy onboarding and build curriculum history to enable drift detection.',
    }
  }

  const drifted = dimensions
    .filter(d => d.driftWarning !== null && d.statedScore !== null && d.observedScore !== null)
    .map(d => ({
      dimension:     d.label,
      statedScore:   d.statedScore!,
      observedScore: d.observedScore!,
      gap:           Math.abs(d.statedScore! - d.observedScore!),
      description:   d.driftWarning!,
    }))
    .sort((a, b) => b.gap - a.gap)

  if (drifted.length === 0) {
    return {
      driftDetected:     false,
      driftSeverity:     'LOW',
      driftedDimensions: [],
      donnaMessage:      'Observed behavior aligns with stated philosophy.',
      confidence:        preferences.filter(p => p.confidence !== 'insufficient').length >= 3 ? 'medium' : 'low',
      suggestedAction:   'Continue monitoring as more history accumulates.',
    }
  }

  const maxGap = drifted[0].gap
  const severity: DriftSeverity = maxGap >= 35 ? 'HIGH' : maxGap >= 20 ? 'MEDIUM' : 'LOW'
  const confidence: PhilosophyDriftReport['confidence'] =
    preferences.filter(p => p.confidence !== 'insufficient').length >= 5 ? 'medium' : 'low'

  const driftedNames = drifted.slice(0, 3).map(d => d.dimension.toLowerCase()).join(', ')
  const donnaMessage = severity === 'HIGH'
    ? `I've noticed a significant gap between your academy's stated philosophy and observed decisions, particularly in: ${driftedNames}. This may reflect a genuine evolution in your approach — or it may be worth discussing intentionally.`
    : severity === 'MEDIUM'
    ? `Your recent decisions suggest a moderate shift away from your stated philosophy in: ${driftedNames}. This is an early signal — not a problem — but worth monitoring.`
    : `Minor variation between stated philosophy and recent decisions in: ${driftedNames}. Within normal range.`

  const suggestedAction = severity === 'HIGH'
    ? 'Consider whether your stated onboarding philosophy still reflects your actual approach, and update it if needed.'
    : 'Monitor whether this pattern continues over the next 60–90 days before drawing conclusions.'

  return {
    driftDetected:     true,
    driftSeverity:     severity,
    driftedDimensions: drifted.slice(0, 5),
    donnaMessage,
    confidence,
    suggestedAction,
  }
}

// ── Recent activity window ────────────────────────────────────────────────────

/** Returns the most recent N months of evolution phases. */
export function getRecentEvolutionPhases(
  timeline:    AcademyEvolutionTimeline,
  windowDays:  number = 90,
): EvolutionPhase[] {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
  const cutoffKey = cutoff.toISOString().slice(0, 7)
  return timeline.phases.filter(p => p.periodKey >= cutoffKey)
}
