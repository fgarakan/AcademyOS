'use client'

// Sprint 1006 — Director DONNA Review Queue Integration V1
// Surfaces all 6 draft categories with counts, priority, and CTA links.
// No automatic approval — all actions route to /director/review for director decision.
// Display only — no DB writes.

import Link from 'next/link'
import { ClipboardList, Users, FileText, BookOpen, MessageSquare, LayoutTemplate, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReviewCategory {
  id: string
  label: string
  count: number
  urgentCount: number
  icon: React.ReactNode
  reviewHref: string
  riskLevel: 'high' | 'medium' | 'low'
  safetyNote?: string
}

export interface DirectorDonnaReviewPanelProps {
  categories: ReviewCategory[]
  isLive: boolean
  totalPending: number
}

// ── Category colors ────────────────────────────────────────────────────────────

const RISK_BADGE: Record<string, string> = {
  high:   'bg-status-red/15 text-status-red border-status-red/20',
  medium: 'bg-status-orange/15 text-status-orange border-status-orange/20',
  low:    'bg-text-muted/10 text-text-muted border-text-muted/20',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DirectorDonnaReviewPanel({
  categories,
  isLive,
  totalPending,
}: DirectorDonnaReviewPanelProps) {
  const activeCategories = categories.filter(c => c.count > 0)
  const clearCategories = categories.filter(c => c.count === 0)

  return (
    <div className="space-y-3">

      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-lime" />
          <span className="text-sm font-bold text-text-primary">Review Queue</span>
          {totalPending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-red/15 text-status-red border border-status-red/20">
              {totalPending} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isLive && (
            <span className="text-[10px] text-status-orange border border-status-orange/20 bg-status-orange/5 px-2 py-0.5 rounded-md">Demo</span>
          )}
          <Link href="/director/review" className="flex items-center gap-1 text-[11px] text-lime hover:text-lime/80 transition-colors">
            Open queue <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Active categories */}
      {activeCategories.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-status-green/20 bg-status-green/5">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <span className="text-sm text-status-green font-medium">All clear — nothing pending review.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {activeCategories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-surface hover:border-lime/15 transition-colors duration-100">
              <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0 text-text-muted">
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{cat.label}</span>
                  {cat.urgentCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${RISK_BADGE[cat.riskLevel]}`}>
                      {cat.urgentCount} urgent
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  {cat.count} item{cat.count !== 1 ? 's' : ''} pending
                  {cat.safetyNote && <span className="ml-1 text-text-muted/60">· {cat.safetyNote}</span>}
                </p>
              </div>
              <Link
                href={cat.reviewHref}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-lime/20 bg-lime/5 text-xs text-lime hover:bg-lime/10 transition-all duration-100 shrink-0"
              >
                Review
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Clear categories summary */}
      {clearCategories.length > 0 && activeCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {clearCategories.map((cat) => (
            <span key={cat.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[10px] text-text-muted">
              <CheckCircle2 className="w-3 h-3 text-status-green/60" />
              {cat.label}
            </span>
          ))}
        </div>
      )}

      {/* Safety notice */}
      <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-lime/15 bg-lime/4">
        <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-relaxed">
          DONNA never approves automatically. Every item in the review queue requires your explicit decision before anything changes.
        </p>
      </div>

    </div>
  )
}

// ── Default demo categories for use when live data is unavailable ─────────────

export function buildDemoReviewCategories(): ReviewCategory[] {
  return [
    {
      id: 'wrap_up',
      label: 'Session Wrap-Ups',
      count: 2,
      urgentCount: 1,
      icon: <ClipboardList className="w-4 h-4" />,
      reviewHref: '/director/review',
      riskLevel: 'high',
      safetyNote: 'coach-submitted, pending approval',
    },
    {
      id: 'attendance_exception',
      label: 'Attendance Exceptions',
      count: 1,
      urgentCount: 1,
      icon: <Users className="w-4 h-4" />,
      reviewHref: '/director/review',
      riskLevel: 'medium',
      safetyNote: 'no roster change until approved',
    },
    {
      id: 'observation_draft',
      label: 'Player Observation Drafts',
      count: 3,
      urgentCount: 0,
      icon: <FileText className="w-4 h-4" />,
      reviewHref: '/director/review',
      riskLevel: 'medium',
      safetyNote: 'coach-observed, not yet linked to player profile',
    },
    {
      id: 'evidence_draft',
      label: 'Curriculum Evidence Drafts',
      count: 1,
      urgentCount: 0,
      icon: <BookOpen className="w-4 h-4" />,
      reviewHref: '/director/review',
      riskLevel: 'low',
      safetyNote: 'no level movement without director confirmation',
    },
    {
      id: 'parent_draft',
      label: 'Parent-Safe Summaries',
      count: 0,
      urgentCount: 0,
      icon: <MessageSquare className="w-4 h-4" />,
      reviewHref: '/director/review',
      riskLevel: 'high',
      safetyNote: 'nothing sent to parents automatically',
    },
    {
      id: 'template_draft',
      label: 'Template Drafts',
      count: 0,
      urgentCount: 0,
      icon: <LayoutTemplate className="w-4 h-4" />,
      reviewHref: '/director/templates',
      riskLevel: 'low',
    },
  ]
}
