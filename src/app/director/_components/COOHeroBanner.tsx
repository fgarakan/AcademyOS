'use client'

// Mega Sprint 2591–2620 — DONNA Proactive COO + Overnight Intelligence V1
// COO Hero Banner — proactive morning brief at the top of the director page.
//
// Shows: Academy Health · If Only One Thing · Top 3 Priorities · Alerts
// DONNA speaks first — the director does not have to ask.

import Link from 'next/link'
import { AlertTriangle, TrendingUp, CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui'
import type { MorningBrief } from '@/lib/donna/coo/morningBriefEngine'
import type { ProactiveAlert } from '@/lib/donna/coo/donnaProactiveAlerts'
import type { AcademyHealthSignal } from '@/lib/donna/coo/academyDailySnapshot'

// ── Health signal display ─────────────────────────────────────────────────────

function HealthBadge({ signal }: { signal: AcademyHealthSignal }) {
  const cfg = {
    healthy:         { label: 'Healthy',         cls: 'text-status-green border-status-green bg-status-green/10' },
    stable:          { label: 'Stable',           cls: 'text-status-blue border-status-blue bg-status-blue/10' },
    needs_attention: { label: 'Needs Attention',  cls: 'text-status-orange border-status-orange bg-status-orange/10' },
    critical:        { label: 'Critical',         cls: 'text-status-red border-status-red bg-status-red/10' },
    no_data:         { label: 'No Data',          cls: 'text-text-muted border-border bg-surface' },
  }[signal] ?? { label: 'Unknown', cls: 'text-text-muted border-border bg-surface' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ── Urgency dot ───────────────────────────────────────────────────────────────

function UrgencyDot({ urgency }: { urgency: string }) {
  const colors = {
    critical: 'bg-status-red',
    high:     'bg-status-orange',
    medium:   'bg-status-blue',
    low:      'bg-text-muted',
  }
  const cls = colors[urgency as keyof typeof colors] ?? 'bg-text-muted'
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${cls} mt-1.5 flex-shrink-0`} />
}

// ── Alert row ─────────────────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: ProactiveAlert }) {
  const icon =
    alert.severity === 'critical' ? <AlertTriangle className="w-3.5 h-3.5 text-status-red flex-shrink-0" /> :
    alert.severity === 'high'     ? <AlertTriangle className="w-3.5 h-3.5 text-status-orange flex-shrink-0" /> :
    <Circle className="w-3.5 h-3.5 text-status-blue flex-shrink-0" />

  const content = (
    <div className="flex items-start gap-2 py-2 px-3 rounded-lg bg-surface-raised border border-border hover:border-lime/30 transition-colors">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-primary leading-snug">{alert.title}</p>
        <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{alert.body}</p>
      </div>
      {alert.route && <ArrowRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5 ml-auto" />}
    </div>
  )

  if (alert.route) {
    return <Link href={alert.route}>{content}</Link>
  }
  return content
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface COOHeroBannerProps {
  brief:        MorningBrief
  alerts:       ProactiveAlert[]
  healthSignal: AcademyHealthSignal
}

// ── Component ─────────────────────────────────────────────────────────────────

export function COOHeroBanner({ brief, alerts, healthSignal }: COOHeroBannerProps) {
  const hasAlerts     = alerts.length > 0
  const hasTop3       = brief.top3.length > 0
  const hasOpportunity = brief.top3.some(p => p.urgency === 'low')

  return (
    <Card className="overflow-hidden">
      {/* Header row */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <HealthBadge signal={healthSignal} />
              <span className="label-xs text-text-muted">DONNA COO Brief</span>
            </div>
            <p className="text-sm text-text-secondary leading-snug">{brief.greeting}</p>
            <p className="text-base font-semibold text-text-primary mt-1 leading-snug">{brief.headline}</p>
          </div>
          {hasOpportunity && (
            <TrendingUp className="w-5 h-5 text-lime flex-shrink-0 mt-1" />
          )}
        </div>

        {/* If Only One Thing */}
        <div className="mt-3 px-3 py-2 rounded-lg bg-lime/5 border border-lime/20">
          <p className="text-[12px] font-medium text-lime leading-snug">{brief.ifOnlyOneThing}</p>
        </div>
      </div>

      {/* Top 3 priorities */}
      {hasTop3 && (
        <div className="px-5 py-4 border-b border-border">
          <p className="label-xs text-text-muted mb-2">Top priorities</p>
          <div className="space-y-2">
            {brief.top3.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <UrgencyDot urgency={p.urgency} />
                <div className="min-w-0 flex-1">
                  {p.route ? (
                    <Link
                      href={p.route}
                      className="text-xs text-text-primary hover:text-lime transition-colors leading-snug"
                    >
                      {p.title}
                    </Link>
                  ) : (
                    <span className="text-xs text-text-primary leading-snug">{p.title}</span>
                  )}
                </div>
                <span className="text-[10px] text-text-muted flex-shrink-0 capitalize">{p.urgency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proactive alerts */}
      {hasAlerts && (
        <div className="px-5 py-4">
          <p className="label-xs text-text-muted mb-2">
            DONNA is watching {alerts.length} flag{alerts.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <AlertRow key={i} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* No alerts all-clear */}
      {!hasAlerts && !hasTop3 && (
        <div className="px-5 py-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-green flex-shrink-0" />
          <p className="text-xs text-text-secondary">No active flags — academy is clear.</p>
        </div>
      )}
    </Card>
  )
}
