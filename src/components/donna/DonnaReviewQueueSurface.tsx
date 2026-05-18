'use client'

// Sprint 1041 — DONNA Director Review Queue Surface
// Shows categorized review items from the coach evidence loop.
// Director sees pending approvals grouped by category.
// CTAs: Review, Ask DONNA, Defer. No auto-approve mutations.
// Read-only surface — all actions navigate to the Review Queue page.

import Link from 'next/link'
import {
  ClipboardList, FileText, Calendar, Users, BookOpen,
  MessageSquare, ChevronRight, AlertCircle, Sparkles,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReviewCategory {
  id: string
  label: string
  count: number
  description: string
  href: string
  icon: React.ReactNode
  urgency: 'high' | 'medium' | 'low' | 'none'
}

export interface DonnaReviewQueueSurfaceProps {
  pendingReviews: number
  missingWrapUps: number
  templateDrafts: number
  attendanceExceptions: number
  evidenceDrafts: number
  isDemo?: boolean
  className?: string
}

// ── Urgency badge ─────────────────────────────────────────────────────────────

function UrgencyDot({ urgency }: { urgency: ReviewCategory['urgency'] }) {
  if (urgency === 'none') return null
  const color =
    urgency === 'high'   ? 'bg-status-red' :
    urgency === 'medium' ? 'bg-status-orange' :
    'bg-text-muted'
  return <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaReviewQueueSurface({
  pendingReviews,
  missingWrapUps,
  templateDrafts,
  attendanceExceptions,
  evidenceDrafts,
  isDemo = false,
  className = '',
}: DonnaReviewQueueSurfaceProps) {

  const categories: ReviewCategory[] = [
    {
      id: 'pending_reviews',
      label: 'All Pending Items',
      count: pendingReviews,
      description: 'Everything waiting for director decision',
      href: '/director/review',
      icon: <ClipboardList className="w-4 h-4" />,
      urgency: pendingReviews >= 5 ? 'high' : pendingReviews > 0 ? 'medium' : 'none',
    },
    {
      id: 'wrap_up_drafts',
      label: 'Coach Wrap-Up Drafts',
      count: missingWrapUps,
      description: 'Sessions without coach wrap-ups today',
      href: '/director/sessions',
      icon: <FileText className="w-4 h-4" />,
      urgency: missingWrapUps > 0 ? 'medium' : 'none',
    },
    {
      id: 'attendance_exceptions',
      label: 'Attendance Exceptions',
      count: attendanceExceptions,
      description: 'Absences and exceptions needing confirmation',
      href: '/director/review',
      icon: <Calendar className="w-4 h-4" />,
      urgency: attendanceExceptions > 0 ? 'medium' : 'none',
    },
    {
      id: 'template_drafts',
      label: 'Template Review Requests',
      count: templateDrafts,
      description: 'Session template drafts awaiting approval',
      href: '/director/templates',
      icon: <BookOpen className="w-4 h-4" />,
      urgency: templateDrafts > 0 ? 'low' : 'none',
    },
    {
      id: 'evidence_drafts',
      label: 'Curriculum Evidence Drafts',
      count: evidenceDrafts,
      description: 'Player observation evidence links for curriculum',
      href: '/director/review',
      icon: <Users className="w-4 h-4" />,
      urgency: evidenceDrafts > 0 ? 'low' : 'none',
    },
    {
      id: 'parent_safe_drafts',
      label: 'Parent-Safe Summary Drafts',
      count: 0,
      description: 'Coach notes approved for parent visibility — not yet sent',
      href: '/director/review',
      icon: <MessageSquare className="w-4 h-4" />,
      urgency: 'none',
    },
  ]

  const hasItems = categories.some(c => c.count > 0)

  return (
    <div className={`rounded-2xl border border-border bg-surface overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-raised">
        <div className="w-7 h-7 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center">
          <ClipboardList className="w-3.5 h-3.5 text-lime" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">Review Queue</span>
            {pendingReviews > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-red/10 text-status-red border border-status-red/20">
                {pendingReviews}
              </span>
            )}
            {isDemo && (
              <span className="px-1.5 py-0.5 rounded text-[9px] border border-status-orange/20 bg-status-orange/10 text-status-orange">
                Demo
              </span>
            )}
          </div>
          <p className="text-[10px] text-text-muted">Pending director review by category</p>
        </div>
        <Link
          href="/director/review"
          className="text-[11px] text-lime hover:text-lime/80 font-medium transition-colors shrink-0"
        >
          Open queue
        </Link>
      </div>

      {/* Empty state */}
      {!hasItems && (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="w-9 h-9 rounded-full bg-status-green/10 border border-status-green/20 flex items-center justify-center mb-3">
            <ClipboardList className="w-4.5 h-4.5 text-status-green" />
          </div>
          <p className="text-sm text-text-secondary font-medium">Queue is clear</p>
          <p className="text-[11px] text-text-muted mt-1">No items waiting for director review right now.</p>
        </div>
      )}

      {/* Category rows */}
      {hasItems && (
        <div className="divide-y divide-border">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised transition-colors group">
              <div className="flex items-center gap-2 w-5">
                <UrgencyDot urgency={cat.urgency} />
              </div>
              <div className="w-6 h-6 rounded-lg bg-surface-raised border border-border flex items-center justify-center shrink-0 text-text-muted group-hover:text-lime group-hover:border-lime/20 transition-colors">
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">{cat.label}</p>
                  {cat.count > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      cat.urgency === 'high'   ? 'text-status-red border-status-red/20 bg-status-red/10' :
                      cat.urgency === 'medium' ? 'text-status-orange border-status-orange/20 bg-status-orange/10' :
                      'text-text-muted border-border bg-surface-raised'
                    }`}>
                      {cat.count}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-text-muted leading-snug">{cat.description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {cat.count > 0 ? (
                  <>
                    <Link
                      href={cat.href}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-lime/20 text-[10px] text-lime hover:bg-lime/5 transition-colors"
                    >
                      Review <ChevronRight className="w-2.5 h-2.5" />
                    </Link>
                    <Link
                      href="/director/donna"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-[10px] text-text-muted hover:border-lime/15 hover:text-text-secondary transition-colors"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Ask
                    </Link>
                  </>
                ) : (
                  <span className="text-[10px] text-status-green font-medium px-1">Clear</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer: no auto-approve notice */}
      <div className="flex items-start gap-2 px-4 py-2.5 border-t border-border bg-surface-raised/60">
        <AlertCircle className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[9px] text-text-muted leading-relaxed">
          All items listed are pending director review. Nothing is approved, sent, or applied until you act on them in the Review Queue.
        </p>
      </div>

    </div>
  )
}
