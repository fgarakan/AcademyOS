'use client'

// DONNA UI Constitution — DonnaScreenBrief Component
//
// Every constitution-compliant page uses this component to show:
//   1. The DONNA brief — 1–2 sentences answering "what matters here right now"
//   2. The primary action — what to do first
//
// Usage:
//   <DonnaScreenBrief
//     brief="You have 3 approvals waiting, 2 players need attention."
//     primaryActionLabel="Open Review Queue"
//     primaryActionHref="/director/review"
//   />
//
// Brief copy rules (from DONNA_UI_CONSTITUTION.md):
//   - 1–2 sentences max
//   - Name the number ("3 approvals" not "several")
//   - Name the urgency
//   - Never jargon
//   - End with an implied action

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

interface DonnaScreenBriefProps {
  /** 1–2 sentence DONNA brief. What matters right now. */
  brief: string
  /** Primary action label — what to do first */
  primaryActionLabel?: string
  /** Primary action href */
  primaryActionHref?: string
  /** Optional: call client action instead of href */
  onPrimaryAction?: () => void
  /** Optional: visual emphasis level */
  emphasis?: 'normal' | 'urgent'
  /** Optional: add a class for custom positioning */
  className?: string
}

export function DonnaScreenBrief({
  brief,
  primaryActionLabel,
  primaryActionHref,
  onPrimaryAction,
  emphasis = 'normal',
  className = '',
}: DonnaScreenBriefProps) {
  const urgentStyles = emphasis === 'urgent'
    ? 'border-status-orange/25 bg-status-orange/5'
    : 'border-lime/15 bg-lime/3'

  return (
    <div className={`rounded-2xl border ${urgentStyles} px-4 py-3.5 flex items-start gap-3 ${className}`}>
      {/* DONNA avatar */}
      <div className="w-6 h-6 rounded-full bg-lime/12 border border-lime/25 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-3 h-3 text-lime" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-text-secondary leading-relaxed">{brief}</p>
      </div>

      {/* Primary action */}
      {(primaryActionLabel && primaryActionHref) && (
        <Link
          href={primaryActionHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime text-base text-[11px] font-semibold hover:brightness-110 transition-all shrink-0 self-center"
        >
          {primaryActionLabel}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
      {(primaryActionLabel && onPrimaryAction && !primaryActionHref) && (
        <button
          onClick={onPrimaryAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime text-base text-[11px] font-semibold hover:brightness-110 transition-all shrink-0 self-center"
        >
          {primaryActionLabel}
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// ── Server-safe variant (no 'use client' requirement) ──────────────────────────

interface DonnaScreenBriefStaticProps {
  brief: string
  primaryActionLabel?: string
  primaryActionHref?: string
  emphasis?: 'normal' | 'urgent'
  className?: string
}

/**
 * Server Component variant — no client interaction needed.
 * Use this in Server Components. Use DonnaScreenBrief for client-interactive versions.
 */
export function DonnaScreenBriefStatic({
  brief,
  primaryActionLabel,
  primaryActionHref,
  emphasis = 'normal',
  className = '',
}: DonnaScreenBriefStaticProps) {
  const urgentStyles = emphasis === 'urgent'
    ? 'border-status-orange/25 bg-status-orange/5'
    : 'border-lime/15 bg-lime/3'

  return (
    <div className={`rounded-2xl border ${urgentStyles} px-4 py-3.5 flex items-start gap-3 ${className}`}>
      <div className="w-6 h-6 rounded-full bg-lime/12 border border-lime/25 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-3 h-3 text-lime" />
      </div>
      <p className="text-[13px] text-text-secondary leading-relaxed flex-1 min-w-0">{brief}</p>
      {primaryActionLabel && primaryActionHref && (
        <Link
          href={primaryActionHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime text-base text-[11px] font-semibold hover:brightness-110 transition-all shrink-0 self-center"
        >
          {primaryActionLabel}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}
