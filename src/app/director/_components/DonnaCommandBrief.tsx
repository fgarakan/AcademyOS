import Link from 'next/link'
import { ArrowRight, ChevronRight, TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui'
import type {
  DirectorOperatingBrief,
  AcademySituationAssessment,
  SituationType,
  SituationSeverity,
} from '@/lib/donna/operations/operatingPartnerOutputContract'
import type { TodayPriority } from '@/lib/donna/operations/whatShouldIDoTodayEngine'
import type { DonnaActionTarget } from '@/lib/donna/operations/academyChangeEngine'
import type { ReturningDirectorSummary } from '@/lib/donna/operations/directorDecisionEngine'

interface Props {
  brief:                    DirectorOperatingBrief
  directorName:             string
  situation:                AcademySituationAssessment
  generatedAt:              string
  primaryPriority:          TodayPriority | null
  primaryTarget:            DonnaActionTarget | null
  workQueuePendingCount:    number
  returningDirectorMode:    boolean
  returningDirectorSummary: ReturningDirectorSummary | null
  daysSinceLastVisit:       number | null
}

// ── Situation metadata ────────────────────────────────────────────────────────

const SITUATION_LABELS: Record<SituationType, string> = {
  player_progression_bottleneck: 'Player Progression Bottleneck',
  coach_execution_gap:           'Coach Execution Gap',
  curriculum_gap:                'Curriculum Gap',
  parent_retention_risk:         'Parent Retention Risk',
  business_capacity_issue:       'Business Capacity Issue',
  philosophy_drift:              'Philosophy Drift',
  opportunity_to_double_down:    'Opportunity To Double Down',
  assessment_debt:               'Assessment Debt',
  communication_gap:             'Communication Gap',
  unclear_cause_requires_review: 'Under Review',
}

const SEVERITY_DOT: Record<SituationSeverity, string> = {
  critical: 'bg-status-red',
  high:     'bg-status-orange',
  medium:   'bg-status-blue',
  low:      'bg-status-green',
}

const SEVERITY_TEXT: Record<SituationSeverity, string> = {
  critical: 'text-status-red',
  high:     'text-status-orange',
  medium:   'text-status-blue',
  low:      'text-status-green',
}

function relativeTime(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 2)   return 'just now'
  if (diffMin < 60)  return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)   return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

// ── DONNA presence greeting ───────────────────────────────────────────────────

function buildGreeting(
  directorName: string,
  situation:    AcademySituationAssessment,
  brief:        DirectorOperatingBrief,
): string {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = directorName ? `, ${directorName.split(' ')[0]}` : ''

  const situationLine = buildSituationLine(situation)
  const goodNews      = brief.wins.length > 0 ? `The good news: ${brief.wins[0].headline}.` : ''

  return [`${time}${name}.`, situationLine, goodNews].filter(Boolean).join(' ')
}

function buildSituationLine(situation: AcademySituationAssessment): string {
  const t: SituationType = situation.situationType
  if (t === 'opportunity_to_double_down')    return "There's momentum to capitalise on today."
  if (t === 'player_progression_bottleneck') return 'Player progression needs your attention.'
  if (t === 'coach_execution_gap')           return 'The coaching execution gap requires action.'
  if (t === 'curriculum_gap')                return 'Curriculum gaps are limiting player development.'
  if (t === 'parent_retention_risk')         return 'Parent retention risk is elevated right now.'
  if (t === 'business_capacity_issue')       return 'Business capacity needs attention today.'
  if (t === 'philosophy_drift')              return 'The academy is drifting from its stated identity.'
  if (t === 'assessment_debt')               return 'Assessment debt is accumulating.'
  if (t === 'communication_gap')             return 'The approval queue needs your attention.'
  return 'DONNA is monitoring the academy situation.'
}

// ── CTA helpers ───────────────────────────────────────────────────────────────

function ctaHref(primaryTarget: DonnaActionTarget | null, summary: ReturningDirectorSummary | null): string {
  return primaryTarget?.route ?? summary?.recommendedFirstAction.href ?? '/director/review'
}

function ctaLabel(primaryTarget: DonnaActionTarget | null, summary: ReturningDirectorSummary | null): string {
  return primaryTarget?.label ?? summary?.recommendedFirstAction.label ?? 'Open Review Queue'
}

// ── Change icon (returning director) ─────────────────────────────────────────

function ChangeIcon({ type }: { type: 'positive' | 'negative' | 'attention' }) {
  if (type === 'positive') return <TrendingUp   className="w-3 h-3 text-status-green shrink-0 mt-0.5" />
  if (type === 'negative') return <TrendingDown className="w-3 h-3 text-status-red   shrink-0 mt-0.5" />
  return                          <AlertCircle  className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
}

function changeTextColor(type: 'positive' | 'negative' | 'attention'): string {
  if (type === 'positive') return 'text-status-green'
  if (type === 'negative') return 'text-status-red'
  return 'text-status-orange'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaCommandBrief({
  brief,
  directorName,
  situation,
  generatedAt,
  primaryPriority,
  primaryTarget,
  workQueuePendingCount,
  returningDirectorMode,
  returningDirectorSummary,
  daysSinceLastVisit,
}: Props) {
  const isOpportunity = situation.situationType === 'opportunity_to_double_down'
  const dotClass      = isOpportunity ? 'bg-lime' : SEVERITY_DOT[situation.severity]
  const textClass     = isOpportunity ? 'text-lime' : SEVERITY_TEXT[situation.severity]

  const confidenceCls = brief.confidence === 'reliable'
    ? 'bg-status-green/10 text-status-green'
    : 'bg-status-orange/10 text-status-orange'
  const confidenceLabel = brief.confidence === 'reliable' ? 'Reliable' : 'Provisional'

  const href  = ctaHref(primaryTarget, returningDirectorSummary)
  const label = ctaLabel(primaryTarget, returningDirectorSummary)

  // Returning director — show up to 3 items from whatChanged + whatImproved
  const returnItems = returningDirectorSummary
    ? [
        ...returningDirectorSummary.whatChanged.slice(0, 2),
        ...returningDirectorSummary.whatImproved.slice(0, 1).map(w => ({
          changeType: 'positive' as const,
          headline:   w.headline,
          detail:     w.evidence,
          route:      undefined,
        })),
      ].slice(0, 3)
    : []

  return (
    <Card className="p-6 space-y-5">

      {/* ── Header: situation or return state ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {returningDirectorMode ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
              <span className="text-[12px] font-semibold text-lime">
                {daysSinceLastVisit} day{daysSinceLastVisit !== 1 ? 's' : ''} away
              </span>
              <span className="text-border mx-1 hidden sm:block">·</span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 hidden sm:block ${dotClass}`} />
              <span className={`text-[11px] font-medium hidden sm:block ${textClass}`}>
                {SITUATION_LABELS[situation.situationType]}
              </span>
            </>
          ) : (
            <>
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
              <span className={`text-[12px] font-semibold ${textClass}`}>
                {SITUATION_LABELS[situation.situationType]}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${confidenceCls}`}>
            {confidenceLabel}
          </span>
          <span className="label-xs text-text-muted hidden md:block">
            {relativeTime(generatedAt)}
          </span>
        </div>
      </div>

      {/* ── DONNA voice ───────────────────────────────────────────────────── */}
      {returningDirectorMode && returningDirectorSummary ? (
        <div className="space-y-4">
          {/* Returning greeting */}
          <p className="text-text-primary text-[15px] leading-relaxed font-medium">
            Welcome back{directorName ? `, ${directorName.split(' ')[0]}` : ''}.
            {' '}Here is what happened while you were away.
          </p>

          {/* Compact change list */}
          {returnItems.length > 0 && (
            <div className="space-y-2">
              {returnItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChangeIcon type={item.changeType} />
                  <div className="min-w-0">
                    {item.route ? (
                      <Link
                        href={item.route}
                        className={`text-[12px] font-medium leading-snug hover:underline ${changeTextColor(item.changeType)}`}
                      >
                        {item.headline}
                      </Link>
                    ) : (
                      <p className={`text-[12px] font-medium leading-snug ${changeTextColor(item.changeType)}`}>
                        {item.headline}
                      </p>
                    )}
                    {item.detail && (
                      <p className="text-[11px] text-text-muted leading-snug mt-0.5">{item.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* What matters now */}
          <div className="border-l-2 border-lime/40 pl-3">
            <p className="label-xs text-lime/70 mb-1">What matters now</p>
            <p className="text-[13px] font-semibold text-text-primary leading-snug">
              {returningDirectorSummary.whatMattersNow}
            </p>
          </div>
        </div>
      ) : (
        /* Normal greeting */
        <p className="text-text-primary text-[15px] leading-relaxed font-medium">
          {buildGreeting(directorName, situation, brief)}
        </p>
      )}

      {/* ── Primary CTA ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap pt-1">
        <Link href={href} className="btn-lime inline-flex items-center gap-2 text-sm">
          {label}
          <ArrowRight size={14} />
        </Link>

        {workQueuePendingCount > 0 && (
          <Link
            href="/director/review"
            className="inline-flex items-center gap-1 text-[12px] text-text-muted hover:text-text-secondary transition-colors"
          >
            {workQueuePendingCount} other action{workQueuePendingCount !== 1 ? 's' : ''} pending
            <ChevronRight size={12} />
          </Link>
        )}
      </div>

    </Card>
  )
}
