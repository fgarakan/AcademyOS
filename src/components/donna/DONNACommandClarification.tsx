'use client'

// Sprint 594 — DONNA Command Clarification V1
// Shown when DONNA intent is ambiguous or unknown.
// Coach selects from options or types a refinement.
// No DB. No execution.

import { HelpCircle } from 'lucide-react'
import type { DonnaCommandCategory } from '@/lib/donna/donnaCommandRouter'
import { formatCategoryLabel } from '@/lib/donna/donnaIntentClassifier'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClarificationOption {
  category: DonnaCommandCategory
  label: string
  description: string
}

export interface DONNACommandClarificationProps {
  prompt: string
  options: ClarificationOption[]
  onSelect: (category: DonnaCommandCategory) => void
  onTypeRefinement?: (refinedInput: string) => void
  onCancel?: () => void
  isLoading?: boolean
}

// ── Default category descriptions ────────────────────────────────────────────

const CATEGORY_DESCRIPTIONS: Partial<Record<DonnaCommandCategory, string>> = {
  attendance: 'Mark who attended, was absent, or late',
  session_actual: 'Update session notes, intensity, or outcome',
  coach_observation: 'Add an observation about a player',
  parent_draft: 'Draft a message for a parent (not sent)',
  level_readiness: 'Surface a player readiness signal',
  curriculum_override: 'Propose a change to this session\'s curriculum',
  review_queue: 'See what needs director review',
  academy_health: 'Check academy health and priorities',
  wrap_up: 'Start the coach wrap-up flow',
}

// ── Quick option set builders ─────────────────────────────────────────────────

export function buildDefaultClarificationOptions(): ClarificationOption[] {
  const categories: DonnaCommandCategory[] = [
    'attendance',
    'session_actual',
    'coach_observation',
    'parent_draft',
    'level_readiness',
    'curriculum_override',
    'review_queue',
    'academy_health',
    'wrap_up',
  ]
  return categories.map(cat => ({
    category: cat,
    label: formatCategoryLabel(cat),
    description: CATEGORY_DESCRIPTIONS[cat] ?? '',
  }))
}

export function buildAmbiguousClarificationOptions(
  candidates: DonnaCommandCategory[],
): ClarificationOption[] {
  return candidates.map(cat => ({
    category: cat,
    label: formatCategoryLabel(cat),
    description: CATEGORY_DESCRIPTIONS[cat] ?? '',
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNACommandClarification({
  prompt,
  options,
  onSelect,
  onTypeRefinement,
  onCancel,
  isLoading = false,
}: DONNACommandClarificationProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        <HelpCircle className="w-3.5 h-3.5 text-status-orange shrink-0" />
        <p className="text-xs font-semibold text-text-secondary">DONNA — clarification needed</p>
      </div>

      {/* ── Prompt ── */}
      <div className="px-3.5 py-3 border-b border-border/50">
        <p className="text-sm text-text-primary leading-snug">{prompt}</p>
      </div>

      {/* ── Options ── */}
      <div className="px-3.5 py-2.5 space-y-1.5">
        {options.map(opt => (
          <button
            key={opt.category}
            onClick={() => onSelect(opt.category)}
            disabled={isLoading}
            className="w-full text-left rounded-lg border border-border bg-surface px-3 py-2.5 hover:border-lime/40 hover:bg-lime/5 transition-colors group"
          >
            <p className="text-xs font-medium text-text-primary group-hover:text-lime transition-colors capitalize">
              {opt.label}
            </p>
            {opt.description && (
              <p className="text-[10px] text-text-muted mt-0.5 leading-snug">{opt.description}</p>
            )}
          </button>
        ))}
      </div>

      {/* ── Type refinement ── */}
      {onTypeRefinement && (
        <div className="px-3.5 pb-3 pt-1 border-t border-border/50">
          <p className="text-[10px] text-text-muted mb-1.5">Or rephrase your request</p>
          <form
            onSubmit={e => {
              e.preventDefault()
              const input = (e.currentTarget.elements.namedItem('refinement') as HTMLInputElement).value.trim()
              if (input) onTypeRefinement(input)
            }}
            className="flex gap-2"
          >
            <input
              name="refinement"
              type="text"
              placeholder="Type what you need..."
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40"
            />
            <button type="submit" className="btn-lime text-xs py-1.5 px-3">
              Go
            </button>
          </form>
        </div>
      )}

      {/* ── Cancel ── */}
      {onCancel && (
        <div className="px-3.5 pb-3">
          <button
            onClick={onCancel}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
