'use client'

import { useState } from 'react'
import { TrendingUp, Trophy, Dumbbell, Brain, AlertTriangle, Star, Lightbulb, Edit2, Trash2 } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

export type ObservationType = 'strength' | 'growth_area' | 'concern' | 'context'
export type PathwayTag = 'Skill' | 'Competition' | 'Fitness' | 'Mindset'
export type UrgencyLevel = 'low' | 'medium' | 'high'

export interface ObservationDraft {
  id: string
  playerName: string
  pathway: PathwayTag | null
  observationType: ObservationType
  evidenceNote: string
  urgency: UrgencyLevel
  parentSafe: boolean
  directorReview: boolean
  suggestedNextFocus: string | null
  confidenceLabel: 'high' | 'medium' | 'low' | null
}

// ── Display config ────────────────────────────────────────────

const TYPE_CONFIG: Record<ObservationType, { label: string; color: string; icon: React.ReactNode }> = {
  strength:    { label: 'Strength',    color: 'text-status-green border-status-green/30 bg-status-green/5', icon: <Star className="w-3 h-3" /> },
  growth_area: { label: 'Growth Area', color: 'text-status-blue border-status-blue/30 bg-status-blue/5',   icon: <TrendingUp className="w-3 h-3" /> },
  concern:     { label: 'Concern',     color: 'text-status-red border-status-red/30 bg-status-red/5',       icon: <AlertTriangle className="w-3 h-3" /> },
  context:     { label: 'Context',     color: 'text-text-muted border-border bg-surface-raised',             icon: <Lightbulb className="w-3 h-3" /> },
}

const PATHWAY_ICON: Record<PathwayTag, React.ReactNode> = {
  Skill:       <TrendingUp className="w-3 h-3" />,
  Competition: <Trophy className="w-3 h-3" />,
  Fitness:     <Dumbbell className="w-3 h-3" />,
  Mindset:     <Brain className="w-3 h-3" />,
}

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string }> = {
  low:    { label: 'Low',    color: 'text-text-muted' },
  medium: { label: 'Medium', color: 'text-status-orange' },
  high:   { label: 'High',   color: 'text-status-red' },
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   'text-status-green',
  medium: 'text-status-orange',
  low:    'text-text-muted',
}

// ── Single draft card ─────────────────────────────────────────

interface DraftCardProps {
  draft: ObservationDraft
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function CoachObservationDraftCard({ draft, onEdit, onDelete }: DraftCardProps) {
  const typeConfig = TYPE_CONFIG[draft.observationType]
  const urgencyConfig = URGENCY_CONFIG[draft.urgency]

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{draft.playerName}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border rounded-full px-1.5 py-0.5 ${typeConfig.color}`}>
              {typeConfig.icon}
              {typeConfig.label}
            </span>
            {draft.pathway && (
              <span className="inline-flex items-center gap-1 text-[10px] text-text-muted border border-border rounded-full px-1.5 py-0.5">
                {PATHWAY_ICON[draft.pathway]}
                {draft.pathway}
              </span>
            )}
            {draft.urgency !== 'low' && (
              <span className={`text-[10px] font-medium ${urgencyConfig.color}`}>
                {urgencyConfig.label} urgency
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(draft.id)} className="p-1.5 rounded-lg hover:bg-surface-raised text-text-muted hover:text-text-secondary transition-all">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(draft.id)} className="p-1.5 rounded-lg hover:bg-status-red/10 text-text-muted hover:text-status-red transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Evidence note */}
      <p className="text-xs text-text-secondary leading-relaxed">{draft.evidenceNote}</p>

      {/* Suggested next focus */}
      {draft.suggestedNextFocus && (
        <div className="rounded-xl bg-surface-raised border border-border px-3 py-2">
          <p className="text-[9px] uppercase tracking-widest text-lime mb-0.5">Suggested Next Focus</p>
          <p className="text-xs text-text-secondary">{draft.suggestedNextFocus}</p>
        </div>
      )}

      {/* Flags */}
      <div className="flex items-center gap-2 flex-wrap">
        {draft.confidenceLabel && (
          <span className={`text-[10px] ${CONFIDENCE_COLOR[draft.confidenceLabel]}`}>
            {draft.confidenceLabel} confidence
          </span>
        )}
        <span className={`text-[10px] ${draft.parentSafe ? 'text-status-green' : 'text-text-muted'}`}>
          {draft.parentSafe ? 'Parent-safe' : 'Internal only'}
        </span>
        {draft.directorReview && (
          <span className="text-[10px] text-status-orange">Director review</span>
        )}
      </div>

      {/* Draft notice */}
      <p className="text-[9px] text-text-muted border-t border-border pt-2">
        Draft only — requires director approval before any profile update.
      </p>
    </div>
  )
}

// ── Draft list ────────────────────────────────────────────────

interface ListProps {
  drafts: ObservationDraft[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function CoachObservationDraftList({ drafts, onEdit, onDelete }: ListProps) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? drafts : drafts.slice(0, 3)

  if (drafts.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <Star className="w-5 h-5 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-secondary">No observation drafts yet.</p>
        <p className="text-xs text-text-muted mt-1">
          Player observations from your wrap-up appear here for review before director approval.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visible.map(d => (
        <CoachObservationDraftCard key={d.id} draft={d} onEdit={onEdit} onDelete={onDelete} />
      ))}
      {drafts.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2.5 rounded-xl border border-border text-xs text-text-muted hover:bg-surface-raised transition-all"
        >
          Show {drafts.length - 3} more
        </button>
      )}
    </div>
  )
}
