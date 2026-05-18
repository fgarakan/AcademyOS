'use client'

import { Shield, Sparkles, AlertCircle, Clock } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

export type DraftChangeType = 'add_drill' | 'add_gate' | 'add_fitness' | 'add_mission' | 'rewrite_level'

interface Props {
  level: CurriculumLevel
  changeType: DraftChangeType
  description: string
  source?: string
  confidence?: 'high' | 'medium' | 'low' | null
  onApprove?: () => void
  onCancel?: () => void
  approveLabel?: string
}

const CHANGE_LABELS: Record<DraftChangeType, string> = {
  add_drill:     'Add drill',
  add_gate:      'Add assessment gate',
  add_fitness:   'Add fitness support',
  add_mission:   'Add player mission',
  rewrite_level: 'Rewrite level intent',
}

const CONFIDENCE_CONFIG = {
  high:   { label: 'High confidence', color: '#30D158', bg: 'rgba(48,209,88,0.08)' },
  medium: { label: 'Medium confidence', color: '#FF9500', bg: 'rgba(255,149,0,0.08)' },
  low:    { label: 'Low confidence', color: '#FF3B30', bg: 'rgba(255,59,48,0.08)' },
}

export function CurriculumDraftSummaryPanel({
  level,
  changeType,
  description,
  source = 'DONNA (AI)',
  confidence = 'medium',
  onApprove,
  onCancel,
  approveLabel = 'Save draft to Review Queue',
}: Props) {
  const conf = confidence ? CONFIDENCE_CONFIG[confidence] : null

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[12px] font-semibold text-text-primary">Draft Summary</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/20">
          Pending review
        </span>
      </div>

      {/* Fields */}
      <div className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Change type</p>
            <p className="text-[12px] text-text-primary">{CHANGE_LABELS[changeType]}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Affected level</p>
            <p className="text-[12px] text-text-primary">{level.display_name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Source</p>
            <p className="text-[12px] text-text-muted">{source}</p>
          </div>
          {conf && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Confidence</p>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: conf.bg, color: conf.color }}
              >
                {conf.label}
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Description</p>
          <p className="text-[12px] text-text-secondary leading-relaxed">{description}</p>
        </div>

        {/* Status */}
        <div className="flex items-start gap-2 rounded-xl border border-status-orange/20 bg-status-orange/[0.04] px-3 py-2">
          <Clock className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted">
            <span className="text-status-orange font-semibold">Draft only — </span>
            This change is not applied until a director approves it in the Review Queue. No players or coaches are affected until then.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-lime/10 bg-lime/[0.02] px-3 py-2">
          <Shield className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted">
            Impact estimate: this level only · session templates unaffected until approved
          </p>
        </div>
      </div>

      {/* Actions */}
      {(onApprove || onCancel) && (
        <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3">
          {onCancel && (
            <button onClick={onCancel} className="text-[12px] text-text-muted hover:text-text-secondary transition-colors">
              Cancel
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-80"
              style={{ background: '#C8FF00', color: '#0A0A0A' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {approveLabel}
            </button>
          )}
        </div>
      )}

      <AlertCircle className="hidden" />
    </div>
  )
}
