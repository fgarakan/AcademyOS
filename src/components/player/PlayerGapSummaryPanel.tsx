// Player Gap Summary V1 — Sprint 23
// Director-only. Read-only. No mutations. Never shown to player or parent.
// Consolidates training gaps, knowledge gaps, exposure gaps, and fitness placeholders.

import { AlertTriangle, Eye, Info, Activity, BookOpen, Target, HelpCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { IdpTrainingGap, IdpKnowledgeGap } from '@/lib/player/individualDevelopmentPlan'

export type GapConfidence = 'possible' | 'needs_review' | 'confirmed'

export interface GapSummaryItem {
  gapType: 'exposure' | 'skill' | 'knowledge' | 'fitness'
  label: string
  description: string
  confidence: GapConfidence
  domain: string | null
  source: string
}

interface ExposureTimelineItem {
  attendanceStatus: string
  blockCount: number
  sessionName: string | null
  sessionDate: string
}

interface Props {
  trainingGaps: IdpTrainingGap[]
  knowledgeGaps: IdpKnowledgeGap[]
  exposureTimeline: ExposureTimelineItem[]
  playerLoad: {
    absences_7d?: number | null
    overload_flag?: boolean | null
    fatigue_risk_label?: string | null
    sessions_28d?: number | null
    fitness_sessions_28d?: number | null
  } | null
  currentLevelName: string | null
}

function confidenceLabel(confidence: GapConfidence) {
  if (confidence === 'confirmed') return 'Confirmed'
  if (confidence === 'needs_review') return 'Needs Review'
  return 'Possible'
}

function confidenceColor(confidence: GapConfidence) {
  if (confidence === 'confirmed') return 'text-status-red'
  if (confidence === 'needs_review') return 'text-status-orange'
  return 'text-text-muted'
}

function gapTypeIcon(gapType: GapSummaryItem['gapType']) {
  if (gapType === 'exposure') return <Eye className="w-3.5 h-3.5 text-status-orange shrink-0" />
  if (gapType === 'skill') return <Target className="w-3.5 h-3.5 text-status-red shrink-0" />
  if (gapType === 'knowledge') return <BookOpen className="w-3.5 h-3.5 text-status-blue shrink-0" />
  return <Activity className="w-3.5 h-3.5 text-status-orange shrink-0" />
}

function gapTypeLabel(gapType: GapSummaryItem['gapType']) {
  if (gapType === 'exposure') return 'Exposure Gap'
  if (gapType === 'skill') return 'Skill Gap'
  if (gapType === 'knowledge') return 'Knowledge Gap'
  return 'Fitness Gap'
}

function deriveGapItems(
  trainingGaps: IdpTrainingGap[],
  knowledgeGaps: IdpKnowledgeGap[],
  exposureTimeline: ExposureTimelineItem[],
  playerLoad: Props['playerLoad'],
): GapSummaryItem[] {
  const items: GapSummaryItem[] = []

  // Exposure gaps from timeline (absent sessions with completed blocks)
  const missedSessions = exposureTimeline.filter(
    s => (s.attendanceStatus === 'absent' || s.attendanceStatus === 'excused') && s.blockCount > 0
  )
  if (missedSessions.length > 0) {
    items.push({
      gapType: 'exposure',
      label: `Missed ${missedSessions.length} session${missedSessions.length > 1 ? 's' : ''} in last 60 days`,
      description: `Absent from ${missedSessions.length} session${missedSessions.length > 1 ? 's' : ''} with planned blocks — possible exposure gap.`,
      confidence: missedSessions.length >= 3 ? 'needs_review' : 'possible',
      domain: null,
      source: 'attendance',
    })
  }

  // Training gaps from load aggregation
  for (const gap of trainingGaps) {
    const severity = gap.severity
    if (severity === 'insufficient_data') continue

    const isExposure = gap.gap_type.includes('absence') || gap.gap_type.includes('session_frequency')
    const isFitness = gap.gap_type.includes('fitness') || gap.gap_type.includes('overload') || gap.gap_type.includes('fatigue')

    items.push({
      gapType: isExposure ? 'exposure' : isFitness ? 'fitness' : 'skill',
      label: gap.gap_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: gap.description,
      confidence: severity === 'high' ? 'needs_review' : 'possible',
      domain: gap.domain,
      source: 'load_data',
    })
  }

  // Knowledge gaps
  for (const gap of knowledgeGaps) {
    if (gap.severity === 'insufficient_data') continue
    items.push({
      gapType: 'knowledge',
      label: gap.gap_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: gap.description,
      confidence: gap.severity === 'high' ? 'needs_review' : 'possible',
      domain: gap.domain,
      source: 'knowledge_detection',
    })
  }

  // Fitness gap placeholder if no fitness sessions tracked
  if (playerLoad && (playerLoad.fitness_sessions_28d ?? 0) === 0 && (playerLoad.sessions_28d ?? 0) > 0) {
    items.push({
      gapType: 'fitness',
      label: 'No fitness sessions in last 28 days',
      description: 'Player has attended sessions but none are categorised as fitness blocks. Fitness exposure tracking is a V1 placeholder.',
      confidence: 'possible',
      domain: 'fitness',
      source: 'load_data',
    })
  }

  // If no gaps detected
  return items
}

export function PlayerGapSummaryPanel({
  trainingGaps,
  knowledgeGaps,
  exposureTimeline,
  playerLoad,
  currentLevelName,
}: Props) {
  const gapItems = deriveGapItems(trainingGaps, knowledgeGaps, exposureTimeline, playerLoad)

  const needsReview = gapItems.filter(g => g.confidence === 'needs_review')
  const possible = gapItems.filter(g => g.confidence === 'possible')
  const confirmed = gapItems.filter(g => g.confidence === 'confirmed')

  // Derive recommended next focus from highest-priority gap
  const topGap = needsReview[0] ?? confirmed[0] ?? possible[0] ?? null
  const recommendedNextFocus = topGap
    ? topGap.gapType === 'exposure'
      ? 'Prioritise attendance — catch up on missed curriculum blocks.'
      : topGap.gapType === 'fitness'
      ? 'Add fitness-focused session blocks to upcoming sessions.'
      : topGap.gapType === 'knowledge'
      ? `Reinforce ${topGap.domain ?? 'curriculum'} knowledge through targeted drills or Gap Class.`
      : `Address ${topGap.domain ?? 'skill'} gap through targeted practice.`
    : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="label-xs">Player Gap Summary — Internal V1</p>
          <div className="flex flex-wrap gap-2">
            {needsReview.length > 0 && (
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/20">
                {needsReview.length} needs review
              </span>
            )}
            {possible.length > 0 && (
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-raised text-text-muted border border-border">
                {possible.length} possible
              </span>
            )}
          </div>
        </div>
        {currentLevelName && (
          <p className="text-[10px] text-text-muted mt-0.5">Level: {currentLevelName}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {gapItems.length === 0 ? (
          <div className="py-4 text-center space-y-1">
            <HelpCircle className="w-4 h-4 text-text-muted mx-auto" />
            <p className="text-sm text-text-muted">No gaps detected from available data.</p>
            <p className="text-xs text-text-muted">
              Gaps appear as attendance, load, and curriculum data accumulates.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {gapItems.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-surface-raised border border-border"
              >
                {gapTypeIcon(item.gapType)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-text-muted">
                      {gapTypeLabel(item.gapType)}
                    </span>
                    <span className={`text-[9px] font-semibold uppercase tracking-wider ${confidenceColor(item.confidence)}`}>
                      {confidenceLabel(item.confidence)}
                    </span>
                    {item.domain && (
                      <span className="text-[9px] text-text-muted">{item.domain}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-text-primary">{item.label}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommended next focus */}
        {recommendedNextFocus && (
          <div className="px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/20 space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-lime flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              Recommended Next Focus
            </p>
            <p className="text-xs text-text-secondary">{recommendedNextFocus}</p>
          </div>
        )}

        {/* Safety guardrail */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[10px] text-text-muted">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            Internal director view only. Not visible to player or parent. No automatic level
            changes. All gap labels are inferred suggestions requiring director review.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
