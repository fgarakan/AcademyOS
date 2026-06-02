// DONNA UI Constitution — DonnaSimplifiedPageHeader
//
// The standard constitution-compliant page header pattern.
//
// Structure:
//   [Eyebrow label]   [Primary action button]
//   [Page title]
//   [DONNA brief — 1–2 sentences]
//
// This component replaces the pattern of "page title + 20 cards immediately below."
// After this header, the page shows 3–5 key signals only.

import Link from 'next/link'
import { Sparkles, ArrowRight, Plus } from 'lucide-react'
import type { ReactNode } from 'react'

interface DonnaSimplifiedPageHeaderProps {
  /** Small label above the title */
  eyebrow?: string
  /** Main page title */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** DONNA brief — 1–2 sentences */
  donnaBrief?: string
  /** Primary action */
  primaryActionLabel?: string
  primaryActionHref?: string
  /** Optional: use + icon for create actions */
  primaryActionIsCreate?: boolean
  /** Optional extra slot (e.g. filter controls) */
  rightSlot?: ReactNode
  /** Constitution emphasis */
  urgency?: 'normal' | 'urgent'
}

export function DonnaSimplifiedPageHeader({
  eyebrow,
  title,
  subtitle,
  donnaBrief,
  primaryActionLabel,
  primaryActionHref,
  primaryActionIsCreate = false,
  rightSlot,
  urgency = 'normal',
}: DonnaSimplifiedPageHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="label-xs text-text-muted mb-0.5">{eyebrow}</p>
          )}
          <h1 className="text-xl font-bold text-text-primary leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {rightSlot}
          {primaryActionLabel && primaryActionHref && (
            <Link
              href={primaryActionHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-lime text-base text-[12px] font-semibold hover:brightness-110 transition-all"
            >
              {primaryActionIsCreate && <Plus className="w-3.5 h-3.5" />}
              {primaryActionLabel}
            </Link>
          )}
        </div>
      </div>

      {/* DONNA brief */}
      {donnaBrief && (
        <div className={`rounded-xl border px-3.5 py-3 flex items-start gap-2.5 ${
          urgency === 'urgent'
            ? 'border-status-orange/20 bg-status-orange/4'
            : 'border-lime/12 bg-lime/3'
        }`}>
          <div className="w-5 h-5 rounded-full bg-lime/12 border border-lime/22 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-2.5 h-2.5 text-lime" />
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed">{donnaBrief}</p>
        </div>
      )}
    </div>
  )
}
