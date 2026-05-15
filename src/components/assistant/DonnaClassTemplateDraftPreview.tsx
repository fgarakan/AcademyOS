'use client'

// Sprint 322 — Class Template Draft Preview V1
// Read-only preview of a TemplateDraft shown alongside TemplateDraftPanel.
// Shows level, duration, focus goal, proposed block structure, and what's still missing.
// Nothing saves here. Approval required disclaimer is always visible.

import { Layers, Clock, Target, AlertCircle, Lock } from 'lucide-react'
import type { TemplateDraft } from './templateDraftTypes'

const BLOCK_CATEGORY_LABELS: Record<string, string> = {
  warm_up: 'Warm-Up',
  dynamic_warm_up: 'Dynamic Warm-Up',
  technical: 'Technical Work',
  rally: 'Rally Skills',
  point_play: 'Point Play',
  match_play: 'Match Play',
  fitness: 'Fitness / Conditioning',
  other: 'Other',
}

// Suggested default structure when blocks aren't specified yet but duration is known.
function buildDefaultStructure(durationMinutes: number): Array<{ label: string; durationMinutes: number }> {
  return [
    { label: 'Arrival / Activation',       durationMinutes: Math.round(durationMinutes * 0.10) },
    { label: 'Technical Focus Block',       durationMinutes: Math.round(durationMinutes * 0.25) },
    { label: 'Pattern / Transition Work',   durationMinutes: Math.round(durationMinutes * 0.20) },
    { label: 'Live-Ball Game',              durationMinutes: Math.round(durationMinutes * 0.25) },
    { label: 'Competitive Closer',          durationMinutes: Math.round(durationMinutes * 0.15) },
    { label: 'Recap / Cool-Down',           durationMinutes: Math.round(durationMinutes * 0.05) },
  ]
}

interface Props {
  draft: TemplateDraft
}

export function DonnaClassTemplateDraftPreview({ draft }: Props) {
  const hasLevel = !!draft.level
  const hasDuration = !!draft.durationMinutes
  const hasBlocks = draft.blocks.length > 0
  const missingCount = draft.missingQuestions.length
  const defaultStructure = hasDuration ? buildDefaultStructure(draft.durationMinutes!) : []

  return (
    <div
      className="rounded-xl p-4 space-y-3.5"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-lime shrink-0" />
        <span className="text-xs font-semibold text-lime uppercase tracking-widest">
          Template Preview
        </span>
      </div>

      {/* Key info chips */}
      <div className="flex flex-wrap gap-2">
        {hasLevel ? (
          <span
            className="text-[11px] px-2.5 py-1 rounded-full font-medium text-text-primary"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {draft.level}
          </span>
        ) : (
          <span
            className="text-[11px] px-2.5 py-1 rounded-full text-text-muted italic"
            style={{ border: '1px dashed var(--border)' }}
          >
            Level not set
          </span>
        )}

        {hasDuration ? (
          <span
            className="text-[11px] px-2.5 py-1 rounded-full font-medium text-text-primary flex items-center gap-1"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Clock className="w-3 h-3" />
            {draft.durationMinutes}m
          </span>
        ) : (
          <span
            className="text-[11px] px-2.5 py-1 rounded-full text-text-muted italic flex items-center gap-1"
            style={{ border: '1px dashed var(--border)' }}
          >
            <Clock className="w-3 h-3" />
            Duration not set
          </span>
        )}

        {draft.goal && (
          <span
            className="text-[11px] px-2.5 py-1 rounded-full font-medium text-text-primary flex items-center gap-1"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Target className="w-3 h-3" />
            {draft.goal}
          </span>
        )}
      </div>

      {/* Block structure */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
          {hasBlocks
            ? 'Proposed Structure'
            : hasDuration
            ? 'Suggested Structure'
            : 'Structure'}
        </p>

        {hasBlocks ? (
          draft.blocks.map((block, i) => (
            <div key={block.id} className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted w-4 text-right shrink-0">{i + 1}.</span>
              <div
                className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <span className="text-[12px] text-text-primary">
                  {BLOCK_CATEGORY_LABELS[block.category] ?? block.name}
                </span>
                {block.durationMinutes != null && (
                  <span className="text-[11px] text-text-muted">{block.durationMinutes}m</span>
                )}
              </div>
            </div>
          ))
        ) : hasDuration ? (
          defaultStructure.map((item, i) => (
            <div key={i} className="flex items-center gap-2 opacity-55">
              <span className="text-[10px] text-text-muted w-4 text-right shrink-0">{i + 1}.</span>
              <div
                className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded"
                style={{ border: '1px dashed var(--border)' }}
              >
                <span className="text-[12px] text-text-muted italic">{item.label}</span>
                <span className="text-[11px] text-text-muted">~{item.durationMinutes}m</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[12px] text-text-muted italic px-1">
            Tell Donna the duration and she'll suggest a structure.
          </p>
        )}
      </div>

      {/* Missing info callout */}
      {missingCount > 0 && (
        <div
          className="flex items-start gap-2 px-3 py-2 rounded"
          style={{ background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.2)' }}
        >
          <AlertCircle className="w-3.5 h-3.5 text-status-orange mt-0.5 shrink-0" />
          <p className="text-[11px] text-text-secondary">
            {missingCount === 1
              ? '1 detail still needed — answer Donna\'s question to complete the draft.'
              : `${missingCount} details still needed — answer Donna's questions to complete the draft.`}
          </p>
        </div>
      )}

      {/* Approval disclaimer */}
      <p className="text-[10px] text-text-muted flex items-center gap-1.5">
        <Lock className="w-3 h-3 shrink-0" />
        This is a preview only. Nothing saves until you click the approval button.
      </p>
    </div>
  )
}
