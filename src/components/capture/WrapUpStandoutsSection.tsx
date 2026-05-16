'use client'

import { Star, Heart } from 'lucide-react'
import { WrapUpPlayerObservationInput, type PlayerObservationDraft } from './WrapUpPlayerObservationInput'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StandoutsAndAttentionDraft {
  standouts: PlayerObservationDraft[]
  needsAttention: PlayerObservationDraft[]
  directorReviewRequired: true
  parentExposureApplied: false
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
  accentClass,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  accentClass: string
}) {
  return (
    <div className={`flex items-start gap-2 pb-2 border-b border-border`}>
      <span className={accentClass}>{icon}</span>
      <div>
        <p className={`text-sm font-medium ${accentClass}`}>{title}</p>
        <p className="text-[11px] text-text-muted leading-tight">{subtitle}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface WrapUpStandoutsSectionProps {
  initialStandouts?: PlayerObservationDraft[]
  initialNeedsAttention?: PlayerObservationDraft[]
  onChange: (draft: StandoutsAndAttentionDraft) => void
  className?: string
}

export function WrapUpStandoutsSection({
  initialStandouts = [],
  initialNeedsAttention = [],
  onChange,
  className,
}: WrapUpStandoutsSectionProps) {
  function buildDraft(
    standouts: PlayerObservationDraft[],
    needsAttention: PlayerObservationDraft[],
  ): StandoutsAndAttentionDraft {
    return {
      standouts,
      needsAttention,
      directorReviewRequired: true,
      parentExposureApplied: false,
    }
  }

  function handleStandoutsChange(standouts: PlayerObservationDraft[]) {
    onChange(buildDraft(standouts, initialNeedsAttention))
  }

  function handleNeedsAttentionChange(needsAttention: PlayerObservationDraft[]) {
    onChange(buildDraft(initialStandouts, needsAttention))
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Standouts */}
        <div className="space-y-3">
          <SectionHeader
            icon={<Star size={15} />}
            title="Stood out positively"
            subtitle="Skill breakthroughs, great effort, focus — anything worth recognizing."
            accentClass="text-lime"
          />
          <WrapUpPlayerObservationInput
            observationType="positive"
            initialEntries={initialStandouts}
            onChange={handleStandoutsChange}
          />
        </div>

        {/* Needs attention */}
        <div className="space-y-3">
          <SectionHeader
            icon={<Heart size={15} />}
            title="Could use extra support"
            subtitle="Players who would benefit from more focus, one-on-one time, or a check-in. This is support, not a judgment."
            accentClass="text-status-blue"
          />
          <WrapUpPlayerObservationInput
            observationType="concern"
            initialEntries={initialNeedsAttention}
            onChange={handleNeedsAttentionChange}
          />
        </div>

        {/* Privacy note */}
        <div className="bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-[11px] text-text-muted space-y-0.5">
          <p>All observations are private to staff by default.</p>
          <p>No observation reaches a parent or player unless a director explicitly reviews and approves it as a parent-safe communication.</p>
        </div>
      </div>
    </div>
  )
}
