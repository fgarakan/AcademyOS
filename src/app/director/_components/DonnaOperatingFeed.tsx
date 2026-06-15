'use client'

// Mega Sprint 2621–2650 — DONNA Operating Layer V1
// DONNA Operating Feed — Part 6.
//
// Academy mission control feed. Not a notification center. Not a message center.
// Displays active operating signals ranked by severity.
//
// Shows: escalations → risks → attention → recommendations → opportunities

import Link from 'next/link'
import { AlertTriangle, TrendingUp, Eye, FileCheck, ArrowRight, Clock } from 'lucide-react'
import { Card } from '@/components/ui'
import type { OperatingFeedItem } from '@/lib/donna/operating/operatingSignal'
import type { PendingFollowUp } from '@/lib/donna/operating/academyEscalationEngine'
import type { AcademyHealthModelV2 } from '@/lib/donna/operating/academyHealthModelV2'

// ── Health ring ───────────────────────────────────────────────────────────────

function HealthRing({ score, label }: { score: number; label: string }) {
  const color =
    score >= 90 ? '#30D158' :
    score >= 75 ? '#0A84FF' :
    score >= 60 ? '#FF9500' :
    score >= 40 ? '#FF3B30' : '#FF3B30'

  const cls =
    score >= 90 ? 'text-status-green' :
    score >= 75 ? 'text-status-blue'  :
    score >= 60 ? 'text-status-orange':
    'text-status-red'

  // Simple circle indicator instead of SVG path for reliability
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
        style={{ borderColor: color }}
      >
        <span className={`text-[11px] font-mono font-bold ${cls}`}>{score}</span>
      </div>
      <div>
        <p className={`text-xs font-semibold ${cls}`}>{label}</p>
        <p className="text-[10px] text-text-muted">/ 100</p>
      </div>
    </div>
  )
}

// ── Signal icon ───────────────────────────────────────────────────────────────

function SignalIcon({ type, isEscalated }: { type: string; isEscalated: boolean }) {
  if (isEscalated || type === 'escalation') {
    return <AlertTriangle className="w-3.5 h-3.5 text-status-red flex-shrink-0" />
  }
  if (type === 'risk') return <AlertTriangle className="w-3.5 h-3.5 text-status-orange flex-shrink-0" />
  if (type === 'opportunity') return <TrendingUp className="w-3.5 h-3.5 text-status-green flex-shrink-0" />
  if (type === 'recommendation') return <FileCheck className="w-3.5 h-3.5 text-status-blue flex-shrink-0" />
  return <Eye className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
}

// ── Feed row ──────────────────────────────────────────────────────────────────

function FeedRow({ item }: { item: OperatingFeedItem }) {
  const { signal } = item

  const content = (
    <div className="flex items-start gap-3 py-2.5 px-4 hover:bg-surface-raised/60 transition-colors">
      <span className="mt-0.5 flex-shrink-0">
        <SignalIcon type={signal.type} isEscalated={signal.isEscalated} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${item.badgeCls}`}>
            {item.badgeLabel}
          </span>
          {signal.ageDays > 0 && (
            <span className="text-[10px] text-text-muted flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {signal.ageDays}d
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-text-primary leading-snug">{signal.title}</p>
        <p className="text-[11px] text-text-muted mt-0.5 leading-snug line-clamp-2">{signal.suggestedAction}</p>
      </div>
      {signal.targetEntityRoute && (
        <ArrowRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-1 ml-auto" />
      )}
    </div>
  )

  if (signal.targetEntityRoute) {
    return <Link href={signal.targetEntityRoute} className="block">{content}</Link>
  }
  return content
}

// ── Follow-up row ─────────────────────────────────────────────────────────────

function FollowUpRow({ fu }: { fu: PendingFollowUp }) {
  const content = (
    <div className="flex items-start gap-3 py-2.5 px-4 bg-surface-raised/40 border-l-2 border-status-orange/40">
      <Clock className="w-3.5 h-3.5 text-status-orange flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-secondary leading-snug">{fu.followUpText}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{fu.promptText}</p>
      </div>
    </div>
  )

  if (fu.signal.targetEntityRoute) {
    return <Link href={fu.signal.targetEntityRoute} className="block">{content}</Link>
  }
  return content
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DonnaOperatingFeedProps {
  feedItems:        OperatingFeedItem[]
  pendingFollowUps: PendingFollowUp[]
  health:           AcademyHealthModelV2
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaOperatingFeed({ feedItems, pendingFollowUps, health }: DonnaOperatingFeedProps) {
  const hasItems      = feedItems.length > 0
  const hasFollowUps  = pendingFollowUps.length > 0
  const escalated     = feedItems.filter(i => i.signal.isEscalated).length

  return (
    <details className="rounded-xl border border-border overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-raised/50 transition-colors list-none">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-secondary">DONNA Operating Feed</span>
          {escalated > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-status-red/10 text-status-red border border-status-red/30">
              {escalated} escalated
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <HealthRing score={health.overall} label={health.healthLabel} />
          <span className="label-xs text-text-muted">expand</span>
        </div>
      </summary>

      <div className="border-t border-border">
        {/* Health sub-scores */}
        <div className="px-5 py-3 border-b border-border/60 flex flex-wrap gap-x-5 gap-y-1">
          {[
            { label: 'Players',    score: health.playerHealth.score },
            { label: 'Coaches',    score: health.coachHealth.score },
            { label: 'Parents',    score: health.parentHealth.score },
            { label: 'Curriculum', score: health.curriculumHealth.score },
            { label: 'Assessments', score: health.assessmentCompliance.score },
          ].map(({ label, score }) => {
            const cls = score >= 75 ? 'text-status-green' : score >= 60 ? 'text-status-blue' : score >= 40 ? 'text-status-orange' : 'text-status-red'
            return (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`text-[11px] font-mono font-bold ${cls}`}>{score}</span>
                <span className="label-xs text-text-muted">{label}</span>
              </div>
            )
          })}
        </div>

        {/* Pending follow-ups */}
        {hasFollowUps && (
          <div className="border-b border-border/60">
            {pendingFollowUps.map((fu, i) => (
              <FollowUpRow key={i} fu={fu} />
            ))}
          </div>
        )}

        {/* Signal feed */}
        {hasItems ? (
          <div>
            {feedItems.map((item, i) => (
              <div key={i} className={i < feedItems.length - 1 ? 'border-b border-border/40' : ''}>
                <FeedRow item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-status-green font-medium">All clear</p>
            <p className="text-xs text-text-muted mt-1">No active signals in the operating layer.</p>
          </div>
        )}
      </div>
    </details>
  )
}
