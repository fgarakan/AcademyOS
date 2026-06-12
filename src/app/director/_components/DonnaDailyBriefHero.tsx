'use client'
// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// DONNA Daily Brief Hero: the primary command surface.
// Powered by directorDailyBriefEngine + DONNA Presence Layer.
// This is the COO briefing — not a dashboard widget.

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, HelpCircle, X } from 'lucide-react'
import { Card } from '@/components/ui'
import { ExplainWhyModal } from './ExplainWhyModal'
import type { DirectorOperatingBrief, AcademySituationAssessment, SituationType } from '@/lib/donna/operations/operatingPartnerOutputContract'
import type { TodayPriority } from '@/lib/donna/operations/whatShouldIDoTodayEngine'
import type { DonnaActionTarget } from '@/lib/donna/operations/academyChangeEngine'

interface Props {
  brief:           DirectorOperatingBrief
  directorName:    string
  situation:       AcademySituationAssessment
  primaryPriority: TodayPriority | null
  primaryTarget:   DonnaActionTarget | null
}

// ── DONNA presence layer ───────────────────────────────────────────────────────
// Generates an academy-specific greeting. Not generic. Not templated.

function buildPresenceGreeting(
  directorName:    string,
  situation:       AcademySituationAssessment,
  brief:           DirectorOperatingBrief,
): string {
  const hour   = new Date().getHours()
  const time   = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name   = directorName ? `, ${directorName.split(' ')[0]}` : ''
  const opening = `${time}${name}.`

  const situationLine = buildSituationLine(situation)
  const goodNews      = brief.wins.length > 0 ? `The good news: ${brief.wins[0].headline}.` : ''

  return [opening, situationLine, goodNews].filter(Boolean).join(' ')
}

function buildSituationLine(situation: AcademySituationAssessment): string {
  const t: SituationType = situation.situationType
  if (t === 'opportunity_to_double_down') return "There's momentum to capitalise on today."
  if (t === 'player_progression_bottleneck') return "Player progression needs your attention."
  if (t === 'coach_execution_gap') return "The coaching execution gap requires action."
  if (t === 'curriculum_gap') return "Curriculum gaps are limiting player development."
  if (t === 'parent_retention_risk') return "Parent retention risk is elevated right now."
  if (t === 'business_capacity_issue') return "Business capacity needs attention today."
  if (t === 'philosophy_drift') return "The academy is drifting from its stated identity."
  if (t === 'assessment_debt') return "Assessment debt is accumulating."
  if (t === 'communication_gap') return "The approval queue needs your attention."
  return "DONNA is monitoring the academy situation."
}

const URGENCY_LABEL: Record<string, string> = {
  immediate:  'Today',
  this_week:  'This week',
  this_month: 'This month',
}

const IMPACT_STYLES: Record<string, string> = {
  high:   'text-status-green bg-status-green/15',
  medium: 'text-status-blue bg-status-blue/15',
  low:    'text-text-muted bg-surface-raised',
}

export function DonnaDailyBriefHero({ brief, directorName, situation, primaryPriority, primaryTarget }: Props) {
  const [deferred, setDeferred]     = useState(false)
  const [explainOpen, setExplain]   = useState(false)

  const primary = brief.primaryAction

  const greeting = buildPresenceGreeting(directorName, situation, brief)

  if (deferred) {
    return (
      <Card className="p-6 flex items-center justify-between gap-4">
        <p className="text-sm text-text-muted">Brief deferred. DONNA will resurface at your next visit.</p>
        <button onClick={() => setDeferred(false)} className="btn-ghost text-xs px-3 py-1.5">
          Show Brief
        </button>
      </Card>
    )
  }

  return (
    <>
      <Card hover className="p-6 space-y-5">
        {/* DONNA Presence Layer */}
        <div>
          <p className="label-xs text-lime mb-2">DONNA</p>
          <p className="text-text-secondary text-sm leading-relaxed">{greeting}</p>
        </div>

        {/* Primary action */}
        <div className="border-t border-border pt-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="label-xs text-text-muted">RECOMMENDED FIRST ACTION</p>
              <h2 className="text-text-primary font-semibold text-lg leading-tight">{primary.title}</h2>
              {primaryPriority && (
                <p className="text-sm text-text-secondary leading-relaxed">{primaryPriority.whyToday}</p>
              )}
            </div>

            {/* Meta badges */}
            <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${IMPACT_STYLES[primary.expectedImpact] ?? IMPACT_STYLES.low}`}>
                {primary.expectedImpact.charAt(0).toUpperCase() + primary.expectedImpact.slice(1)} Impact
              </span>
              <span className="label-xs text-text-muted text-right">{primary.timeEstimate}</span>
              <span className="label-xs text-text-muted text-right">
                {URGENCY_LABEL[primary.urgency] ?? primary.urgency}
              </span>
            </div>
          </div>

          {/* First step */}
          <p className="mt-3 text-sm text-text-muted italic leading-relaxed">{primary.firstStep}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap pt-1">
          {primaryTarget ? (
            <Link href={primaryTarget.route} className="btn-lime flex items-center gap-2 text-sm">
              {primaryTarget.label}
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link href="/director/review" className="btn-lime flex items-center gap-2 text-sm">
              Start
              <ArrowRight size={14} />
            </Link>
          )}

          {primaryPriority && (
            <button
              onClick={() => setExplain(true)}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <HelpCircle size={14} />
              Explain Why
            </button>
          )}

          <button
            onClick={() => setDeferred(true)}
            className="btn-ghost flex items-center gap-2 text-sm text-text-muted"
          >
            <X size={14} />
            Not Now
          </button>
        </div>

        {/* Brief meta */}
        <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-border">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            brief.confidence === 'reliable'
              ? 'bg-status-green/15 text-status-green'
              : 'bg-status-orange/15 text-status-orange'
          }`}>
            {brief.confidence === 'reliable' ? 'Reliable brief' : 'Provisional — some data missing'}
          </span>
          {!brief.isComplete && (
            <span className="text-xs text-text-muted">
              {brief.priorities[0]?.missingData?.[0] ?? 'Load more data for a complete brief'}
            </span>
          )}
        </div>
      </Card>

      {primaryPriority && (
        <ExplainWhyModal
          explanation={primaryPriority.explanation}
          priorityTitle={primary.title}
          isOpen={explainOpen}
          onClose={() => setExplain(false)}
        />
      )}
    </>
  )
}
