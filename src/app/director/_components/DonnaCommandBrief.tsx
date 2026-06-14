// Sprint 2381–2410 — updated: Academy Pulse bar + 3-priority greeting
import Link from 'next/link'
import { ArrowRight, ChevronRight, TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui'
import type {
  DirectorOperatingBrief,
  AcademySituationAssessment,
} from '@/lib/donna/operations/operatingPartnerOutputContract'
import type { TodayPriority } from '@/lib/donna/operations/whatShouldIDoTodayEngine'
import type { DonnaActionTarget } from '@/lib/donna/operations/academyChangeEngine'
import type { ReturningDirectorSummary } from '@/lib/donna/operations/directorDecisionEngine'
import type { AcademyPulse } from '@/lib/donna/pulse/academyPulseEngine'
import { AcademyPulseBar } from './AcademyPulseBar'

// ── Priority item type ─────────────────────────────────────────────────────────

export interface BriefPriorityItem {
  title:   string
  route:   string
  urgency: string
}

// ── Props ─────────────────────────────────────────────────────────────────────

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
  // Sprint 2381–2410 — Academy Pulse + 3-priority list
  pulse:                    AcademyPulse
  allPriorityItems:         BriefPriorityItem[]
}

// ── Urgency labels + colours ───────────────────────────────────────────────────

const URGENCY_LABEL: Record<string, string> = {
  immediate:  'Act now',
  this_week:  'This week',
  this_month: 'This month',
}

const URGENCY_COLOR: Record<string, string> = {
  immediate:  'text-status-red',
  this_week:  'text-status-orange',
  this_month: 'text-status-blue',
}

// ── Brief confidence display ───────────────────────────────────────────────────

const CONFIDENCE_CLS: Record<string, string> = {
  reliable:    'bg-status-green/10 text-status-green',
  provisional: 'bg-status-orange/10 text-status-orange',
}

// ── Greeting ──────────────────────────────────────────────────────────────────

function buildGreeting(directorName: string, hasPriorities: boolean): string {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = directorName ? `, ${directorName.split(' ')[0]}` : ''
  if (hasPriorities) return `${time}${name}. Here are the 3 things that matter today.`
  return `${time}${name}. Here is your academy overview.`
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
  if (type === 'positive') return <TrendingUp   className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
  if (type === 'negative') return <TrendingDown className="w-4 h-4 text-status-red   shrink-0 mt-0.5" />
  return                          <AlertCircle  className="w-4 h-4 text-status-orange shrink-0 mt-0.5" />
}

function changeTextColor(type: 'positive' | 'negative' | 'attention'): string {
  if (type === 'positive') return 'text-status-green'
  if (type === 'negative') return 'text-status-red'
  return 'text-status-orange'
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
  pulse,
  allPriorityItems,
}: Props) {
  const confidenceCls   = CONFIDENCE_CLS[brief.confidence] ?? CONFIDENCE_CLS.provisional
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

      {/* ── Header: pulse status | confidence badge + time ─────────────────── */}
      <div className="flex items-start justify-between gap-3">
        {returningDirectorMode ? (
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-lime shrink-0" />
            <span className="text-sm font-semibold text-lime">
              {daysSinceLastVisit} day{daysSinceLastVisit !== 1 ? 's' : ''} away
            </span>
          </div>
        ) : (
          <AcademyPulseBar pulse={pulse} />
        )}

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceCls}`}>
            {confidenceLabel}
          </span>
          <span className="label-xs text-text-secondary hidden md:block">
            {relativeTime(generatedAt)}
          </span>
        </div>
      </div>

      {/* ── DONNA voice ───────────────────────────────────────────────────── */}
      {returningDirectorMode && returningDirectorSummary ? (
        <div className="space-y-4">
          {/* Returning greeting */}
          <p className="text-text-primary text-2xl leading-snug font-medium">
            Welcome back{directorName ? `, ${directorName.split(' ')[0]}` : ''}.
            {' '}Here is what happened while you were away.
          </p>

          {/* Compact change list */}
          {returnItems.length > 0 && (
            <div className="space-y-3">
              {returnItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <ChangeIcon type={item.changeType} />
                  <div className="min-w-0">
                    {item.route ? (
                      <Link
                        href={item.route}
                        className={`text-base font-medium leading-snug hover:underline ${changeTextColor(item.changeType)}`}
                      >
                        {item.headline}
                      </Link>
                    ) : (
                      <p className={`text-base font-medium leading-snug ${changeTextColor(item.changeType)}`}>
                        {item.headline}
                      </p>
                    )}
                    {item.detail && (
                      <p className="text-sm text-text-secondary leading-snug mt-0.5">{item.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* What matters now */}
          <div className="border-l-2 border-lime/40 pl-3">
            <p className="text-xs text-lime uppercase tracking-widest font-medium mb-1">What matters now</p>
            <p className="text-xl font-semibold text-text-primary leading-snug">
              {returningDirectorSummary.whatMattersNow}
            </p>
          </div>
        </div>
      ) : (
        /* ── Normal mode: greeting + 3-priority list ── */
        <div className="space-y-4">
          <p className="text-text-primary text-2xl leading-snug font-medium">
            {buildGreeting(directorName, allPriorityItems.length > 0)}
          </p>

          {/* Pulse summary line (brief, director-language) */}
          <p className="text-sm text-text-secondary leading-relaxed">
            {pulse.pulseSummary}
          </p>

          {/* Academy Pulse — top drivers (Part 5: Status + Summary + Drivers) */}
          {pulse.topDrivers.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {pulse.topDrivers.map((driver, i) => (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-xs font-bold shrink-0 ${
                    driver.severity === 'critical' || driver.severity === 'high'
                      ? 'text-status-orange'
                      : 'text-status-green'
                  }`}>
                    {driver.severity === 'critical' || driver.severity === 'high' ? '⚠' : '✓'}
                  </span>
                  <span className="text-xs text-text-secondary">{driver.headline}</span>
                </div>
              ))}
            </div>
          )}

          {/* Top 3 priorities — scannable, one line each */}
          {allPriorityItems.length > 0 && (
            <div className="space-y-2.5 pt-1">
              {allPriorityItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-text-primary leading-snug min-w-0 truncate">
                    {item.title}
                  </span>
                  <span className={`text-xs font-medium shrink-0 ${URGENCY_COLOR[item.urgency] ?? 'text-text-muted'}`}>
                    {URGENCY_LABEL[item.urgency] ?? ''}
                  </span>
                  <Link
                    href={item.route}
                    aria-label={`Go to: ${item.title}`}
                    className="text-text-muted hover:text-lime transition-colors shrink-0"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Primary CTA ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap pt-1">
        <Link href={href} className="btn-lime inline-flex items-center gap-2 text-base">
          {label}
          <ArrowRight size={16} />
        </Link>

        {workQueuePendingCount > 0 && (
          <Link
            href="/director/review"
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors min-h-[44px] py-2"
          >
            {workQueuePendingCount} other action{workQueuePendingCount !== 1 ? 's' : ''} pending
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

    </Card>
  )
}
