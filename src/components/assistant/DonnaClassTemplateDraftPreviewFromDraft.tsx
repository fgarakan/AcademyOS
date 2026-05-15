'use client'

// Sprint 336–345 — Class Template Draft Preview (DonnaDraftState-aware) V1
// Works with DonnaDraftState from donnaDraftRuntime (not the legacy TemplateDraft type).
// Shows level, duration, focus areas, style/intensity, and a suggested block structure.
// Nothing saves here. Approval required disclaimer always visible.

import { Layers, Clock, Target, AlertCircle, Lock, Zap } from 'lucide-react'
import type { DonnaDraftState } from './donnaDraftRuntime'

// ── Block structure generation ─────────────────────────────────────────────

interface BlockRow {
  label: string
  durationMinutes: number
  isPlaceholder?: boolean
}

function focusAreaLabel(focusAreas: string): string {
  const lower = focusAreas.toLowerCase()
  if (lower.includes('forehand')) return 'Forehand Preparation Block'
  if (lower.includes('backhand')) return 'Backhand Preparation Block'
  if (lower.includes('serve')) return 'Serve Technical Focus Block'
  if (lower.includes('footwork') || lower.includes('movement')) return 'Footwork & Movement Block'
  if (lower.includes('volley') || lower.includes('net')) return 'Net Transition Block'
  if (lower.includes('consistency') || lower.includes('rally')) return 'Rally Consistency Block'
  if (lower.includes('point play') || lower.includes('live ball')) return 'Live-Ball Games Block'
  return 'Technical Focus Block'
}

function buildBlockStructure(
  durationMinutes: number,
  focusAreas: string,
  style: string,
): BlockRow[] {
  const isCompetitive = style.toLowerCase().includes('competitive')
  const hasNetFocus = focusAreas.toLowerCase().includes('net') || focusAreas.toLowerCase().includes('volley')

  const focusLabel = focusAreaLabel(focusAreas)

  if (isCompetitive || hasNetFocus) {
    return [
      { label: 'Arrival / Activation',     durationMinutes: Math.round(durationMinutes * 0.10) },
      { label: focusLabel,                  durationMinutes: Math.round(durationMinutes * 0.25) },
      { label: 'Pattern / Transition Work', durationMinutes: Math.round(durationMinutes * 0.20) },
      { label: 'Competitive / Net Games',   durationMinutes: Math.round(durationMinutes * 0.15) },
      { label: 'Live-Ball Games',           durationMinutes: Math.round(durationMinutes * 0.20) },
      { label: 'Recap / Cool-Down',         durationMinutes: Math.round(durationMinutes * 0.10) },
    ]
  }

  return [
    { label: 'Arrival / Activation',     durationMinutes: Math.round(durationMinutes * 0.10) },
    { label: focusLabel,                  durationMinutes: Math.round(durationMinutes * 0.30) },
    { label: 'Pattern / Transition Work', durationMinutes: Math.round(durationMinutes * 0.25) },
    { label: 'Live-Ball Games',           durationMinutes: Math.round(durationMinutes * 0.25) },
    { label: 'Recap / Cool-Down',         durationMinutes: Math.round(durationMinutes * 0.10) },
  ]
}

function buildPlaceholderStructure(): BlockRow[] {
  return [
    { label: 'Arrival / Activation',     durationMinutes: 0, isPlaceholder: true },
    { label: 'Technical Focus Block',     durationMinutes: 0, isPlaceholder: true },
    { label: 'Pattern / Transition Work', durationMinutes: 0, isPlaceholder: true },
    { label: 'Live-Ball Games',           durationMinutes: 0, isPlaceholder: true },
    { label: 'Recap / Cool-Down',         durationMinutes: 0, isPlaceholder: true },
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  draft: DonnaDraftState
}

export function DonnaClassTemplateDraftPreviewFromDraft({ draft }: Props) {
  const level           = draft.fields['level']?.value ?? null
  const durationStr     = draft.fields['durationMinutes']?.value ?? null
  const focusAreas      = draft.fields['focusAreas']?.value ?? null
  const style           = draft.fields['style']?.value ?? ''
  const intensity       = draft.fields['intensity']?.value ?? null

  const durationMinutes = durationStr ? parseInt(durationStr, 10) : null
  const hasDuration     = durationMinutes != null && !isNaN(durationMinutes) && durationMinutes > 0
  const hasFocus        = !!focusAreas

  const blocks: BlockRow[] = hasDuration && hasFocus
    ? buildBlockStructure(durationMinutes!, focusAreas!, style)
    : hasDuration
    ? buildBlockStructure(durationMinutes!, 'technical', style)
    : buildPlaceholderStructure()

  const isEstimated = !hasDuration || !hasFocus

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
        {level ? (
          <span
            className="text-[11px] px-2.5 py-1 rounded-full font-medium text-text-primary"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {level}
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
            {durationMinutes}m
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

        {hasFocus && (
          <span
            className="text-[11px] px-2.5 py-1 rounded-full font-medium text-text-primary flex items-center gap-1"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Target className="w-3 h-3" />
            {focusAreas}
          </span>
        )}

        {intensity && (
          <span
            className="text-[11px] px-2.5 py-1 rounded-full font-medium text-text-primary flex items-center gap-1"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Zap className="w-3 h-3" />
            {intensity}
          </span>
        )}
      </div>

      {/* Block structure */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
          {isEstimated ? 'Suggested Structure' : 'Proposed Structure'}
        </p>

        {blocks.map((block, i) => (
          <div key={i} className={`flex items-center gap-2 ${block.isPlaceholder ? 'opacity-45' : ''}`}>
            <span className="text-[10px] text-text-muted w-4 text-right shrink-0">{i + 1}.</span>
            <div
              className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded"
              style={{
                background: block.isPlaceholder ? 'transparent' : 'var(--surface)',
                border: block.isPlaceholder ? '1px dashed var(--border)' : '1px solid var(--border)',
              }}
            >
              <span className={`text-[12px] ${block.isPlaceholder ? 'text-text-muted italic' : 'text-text-primary'}`}>
                {block.label}
              </span>
              {!block.isPlaceholder && (
                <span className="text-[11px] text-text-muted">{block.durationMinutes}m</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Missing info callout */}
      {isEstimated && (
        <div
          className="flex items-start gap-2 px-3 py-2 rounded"
          style={{ background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.2)' }}
        >
          <AlertCircle className="w-3.5 h-3.5 text-status-orange mt-0.5 shrink-0" />
          <p className="text-[11px] text-text-secondary">
            {!hasDuration && !hasFocus
              ? 'Tell Donna the duration and focus area to see a full structure.'
              : !hasDuration
              ? 'Tell Donna the duration and she\'ll size each block.'
              : 'Tell Donna the focus area to refine this structure.'}
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
