// DONNA Result Card Types V1
//
// Six structured result card formats returned by the DONNA command layer.
// Each card shows what matters without exposing raw database payloads.
//
// Cards:
//   1. PlayerResultCard
//   2. ReviewResultCard
//   3. AssessmentResultCard
//   4. PlacementResultCard
//   5. LevelReadinessResultCard
//   6. ParentUpdateResultCard

import Link from 'next/link'
import { Users, CheckCircle, Clock, AlertTriangle, BookOpen, MessageSquare, ArrowRight, Target } from 'lucide-react'

// ── 1. PlayerResultCard ───────────────────────────────────────────────────────

interface PlayerResultCardProps {
  playerName: string
  currentLevel: string | null
  status: string | null
  nextAction: string
  nextActionHref?: string
  ageDays?: number | null
}

export function PlayerResultCard({ playerName, currentLevel, status, nextAction, nextActionHref, ageDays }: PlayerResultCardProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface hover:bg-surface-raised transition-colors">
      <div className="w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
        <Users className="w-4 h-4 text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{playerName}</p>
        <p className="text-[11px] text-text-muted">{currentLevel ?? 'No level'} · {status?.replace(/_/g, ' ') ?? 'active'}</p>
        <p className="text-[11px] text-lime mt-1">{nextAction}</p>
      </div>
      {nextActionHref && (
        <Link href={nextActionHref} className="shrink-0 mt-0.5">
          <ArrowRight className="w-4 h-4 text-text-muted hover:text-lime transition-colors" />
        </Link>
      )}
    </div>
  )
}

// ── 2. ReviewResultCard ───────────────────────────────────────────────────────

interface ReviewResultCardProps {
  itemType: string
  title: string
  whyItMatters: string
  risk: 'high' | 'medium' | 'low'
  href?: string
}

export function ReviewResultCard({ itemType, title, whyItMatters, risk, href }: ReviewResultCardProps) {
  const riskBadge = {
    high:   'text-status-orange bg-status-orange/8 border-status-orange/20',
    medium: 'text-status-blue bg-status-blue/8 border-status-blue/20',
    low:    'text-text-muted bg-surface-raised border-border',
  }[risk]

  const inner = (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface hover:bg-surface-raised transition-colors">
      <CheckCircle className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{itemType}</p>
          <span className={`text-[8px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border ${riskBadge}`}>{risk}</span>
        </div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{whyItMatters}</p>
      </div>
      {href && <ArrowRight className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />}
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

// ── 3. AssessmentResultCard ───────────────────────────────────────────────────

interface AssessmentResultCardProps {
  playerName: string
  state: 'due' | 'overdue' | 'submitted' | 'completed'
  daysSinceOrUntil?: number | null
  actionHref?: string
  actionLabel?: string
}

const STATE_CONFIG = {
  due:       { icon: Clock, color: 'text-status-blue',    label: 'Due soon' },
  overdue:   { icon: AlertTriangle, color: 'text-status-orange', label: 'Overdue' },
  submitted: { icon: CheckCircle, color: 'text-status-green', label: 'Submitted' },
  completed: { icon: CheckCircle, color: 'text-status-green', label: 'Completed' },
}

export function AssessmentResultCard({ playerName, state, daysSinceOrUntil, actionHref, actionLabel }: AssessmentResultCardProps) {
  const config = STATE_CONFIG[state]
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface">
      <Icon className={`w-4 h-4 ${config.color} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{playerName}</p>
        <p className={`text-[11px] ${config.color}`}>
          {config.label}{daysSinceOrUntil !== null && daysSinceOrUntil !== undefined ? ` (${Math.abs(daysSinceOrUntil)} days ${state === 'overdue' ? 'ago' : 'away'})` : ''}
        </p>
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="inline-flex items-center gap-1 text-[10px] text-lime hover:brightness-110 font-semibold shrink-0">
          {actionLabel} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

// ── 4. PlacementResultCard ────────────────────────────────────────────────────

interface PlacementResultCardProps {
  playerName: string
  recommendedLevel: string
  confidence: number
  decision: 'accepted' | 'overridden' | 'pending' | null
  href?: string
}

export function PlacementResultCard({ playerName, recommendedLevel, confidence, decision, href }: PlacementResultCardProps) {
  const confidenceTier = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low'
  const decisionLabel = decision === 'accepted' ? '✓ Accepted' : decision === 'overridden' ? '↔ Overridden' : 'Pending decision'
  const decisionColor = decision === 'accepted' ? 'text-status-green' : decision === 'overridden' ? 'text-status-orange' : 'text-text-muted'

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface">
      <Target className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{playerName}</p>
        <p className="text-[11px] text-text-secondary">DONNA recommended: {recommendedLevel}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-bold text-text-muted">{confidence}% confidence ({confidenceTier})</span>
          <span className={`text-[9px] font-bold ${decisionColor}`}>{decisionLabel}</span>
        </div>
      </div>
      {href && (
        <Link href={href} className="shrink-0 mt-0.5">
          <ArrowRight className="w-4 h-4 text-text-muted hover:text-lime transition-colors" />
        </Link>
      )}
    </div>
  )
}

// ── 5. LevelReadinessResultCard ───────────────────────────────────────────────

interface LevelReadinessResultCardProps {
  playerName: string
  currentLevel: string | null
  nextLevel: string | null
  gatesMet: number
  gatesTotal: number
  readinessLabel: string
  href?: string
}

export function LevelReadinessResultCard({ playerName, currentLevel, nextLevel, gatesMet, gatesTotal, readinessLabel, href }: LevelReadinessResultCardProps) {
  const pct = gatesTotal > 0 ? Math.round((gatesMet / gatesTotal) * 100) : null
  const barColor = pct !== null && pct >= 80 ? 'bg-lime' : pct !== null && pct >= 50 ? 'bg-status-blue' : 'bg-text-muted/40'

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface">
      <BookOpen className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{playerName}</p>
        <p className="text-[11px] text-text-muted">{currentLevel ?? '—'} → {nextLevel ?? '—'}</p>
        {pct !== null && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] font-mono text-text-muted shrink-0">{gatesMet}/{gatesTotal}</p>
          </div>
        )}
        <p className="text-[11px] text-text-secondary mt-0.5">{readinessLabel}</p>
      </div>
      {href && (
        <Link href={href} className="shrink-0 mt-0.5">
          <ArrowRight className="w-4 h-4 text-text-muted hover:text-lime transition-colors" />
        </Link>
      )}
    </div>
  )
}

// ── 6. ParentUpdateResultCard ─────────────────────────────────────────────────

interface ParentUpdateResultCardProps {
  playerName: string
  status: 'pending' | 'approved' | 'sent' | 'draft'
  updatedAt?: string | null
  href?: string
}

export function ParentUpdateResultCard({ playerName, status, updatedAt, href }: ParentUpdateResultCardProps) {
  const statusConfig = {
    pending:  { label: 'Pending approval', color: 'text-status-orange' },
    approved: { label: 'Approved', color: 'text-status-green' },
    sent:     { label: 'Sent to parent', color: 'text-status-green' },
    draft:    { label: 'Draft', color: 'text-text-muted' },
  }[status]

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface">
      <MessageSquare className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{playerName}</p>
        <p className={`text-[11px] ${statusConfig.color}`}>{statusConfig.label}</p>
        {updatedAt && (
          <p className="text-[10px] text-text-muted mt-0.5">
            {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
      {href && (
        <Link href={href} className="shrink-0 mt-0.5">
          <ArrowRight className="w-4 h-4 text-text-muted hover:text-lime transition-colors" />
        </Link>
      )}
    </div>
  )
}
