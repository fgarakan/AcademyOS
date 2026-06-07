import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { DonnaAskButton } from './DonnaAskButton'

interface Props {
  directorName: string
  academyName: string
  today: string
  timeGreeting: string
  healthPct: number
  line1: string
  line2?: string
  urgency: 'normal' | 'urgent'
  decisionsCount: number
  preparedCount: number
  ctaLabel?: string
  ctaHref?: string
}

function HealthBadge({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#30D158' : pct >= 60 ? '#FF9500' : '#FF3B30'
  const label = pct >= 80 ? 'Healthy' : pct >= 60 ? 'Watch' : 'At Risk'
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shrink-0"
      style={{ background: `${color}12`, borderColor: `${color}35` }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="font-mono font-bold text-[14px] leading-none" style={{ color }}>{pct}%</span>
      <span className="text-[10px] text-text-muted font-medium">{label}</span>
    </div>
  )
}

export function DonnaMorningBrief({
  directorName,
  academyName,
  today,
  timeGreeting,
  healthPct,
  line1,
  line2,
  urgency,
  decisionsCount,
  preparedCount,
  ctaLabel,
  ctaHref,
}: Props) {
  const briefBorder = urgency === 'urgent' ? 'border-status-orange/30' : 'border-lime/15'
  const briefBg     = urgency === 'urgent' ? 'bg-status-orange/[0.03]' : 'bg-lime/[0.02]'

  return (
    <div className="space-y-3" data-donna-focus-id="morning-brief-zone">

      {/* Zone 1 — Identity bar */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted leading-none">
            {today}
          </p>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight mt-1">
            {timeGreeting}{directorName ? `, ${directorName}` : ''}.
          </h1>
          <p className="text-xs text-text-muted mt-0.5">{academyName}</p>
        </div>
        <div className="shrink-0 mt-1">
          <HealthBadge pct={healthPct} />
        </div>
      </div>

      {/* Zone 2 — DONNA Morning Brief */}
      <div
        className={`rounded-2xl border ${briefBorder} ${briefBg} px-4 py-4 space-y-2.5`}
        data-donna-focus-id="director-morning-brief"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
          <span className="text-[10px] uppercase tracking-widest text-lime font-semibold">
            DONNA · Morning Brief
          </span>
        </div>

        <p className="text-[13px] font-semibold text-text-primary leading-snug">{line1}</p>

        {line2 && line2.length > 0 && (
          <p className="text-[12px] text-text-secondary leading-relaxed">{line2}</p>
        )}

        {/* Decision + prepared signals */}
        {(decisionsCount > 0 || preparedCount > 0) && (
          <div className="flex items-center gap-4 pt-0.5 flex-wrap">
            {decisionsCount > 0 && (
              <span className="text-[11px] text-text-secondary">
                <span className="font-mono font-bold text-status-orange">{decisionsCount}</span>
                {' '}{decisionsCount === 1 ? 'decision' : 'decisions'} waiting
              </span>
            )}
            {preparedCount > 0 && (
              <span className="text-[11px] text-text-secondary">
                <span className="font-mono font-bold text-lime">{preparedCount}</span>
                {' '}prepared for you
              </span>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="flex items-center gap-4 pt-0.5">
          {ctaLabel && ctaHref && (
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity"
            >
              {ctaLabel} →
            </Link>
          )}
          <DonnaAskButton prompt="what should I do today" label="Plan my day" />
        </div>
      </div>

    </div>
  )
}
