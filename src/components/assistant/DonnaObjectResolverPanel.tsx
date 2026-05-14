'use client'

import { X, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import type {
  DonnaObjectResolutionResult,
  DonnaResolvedObjectCandidate,
  DonnaResolvableObjectType,
} from './donnaObjectResolutionTypes'

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

const OBJECT_TYPE_LABELS: Record<DonnaResolvableObjectType, string> = {
  player: 'player',
  group: 'group',
  coach: 'coach',
  session: 'session',
  class_template: 'class template',
  fitness_template: 'fitness template',
  parent_guardian: 'parent or guardian',
}

const CONFIDENCE_STYLES: Record<string, { color: string; label: string }> = {
  high:   { color: '#30D158', label: 'Strong match' },
  medium: { color: '#FF9500', label: 'Possible match' },
  low:    { color: '#555555', label: 'Weak match' },
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DonnaObjectResolverPanelProps {
  result: DonnaObjectResolutionResult
  isLoading: boolean
  onSelect: (candidate: DonnaResolvedObjectCandidate) => void
  onCancel: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DonnaObjectResolverPanel({
  result,
  isLoading,
  onSelect,
  onCancel,
}: DonnaObjectResolverPanelProps) {
  const typeLabel = OBJECT_TYPE_LABELS[result.objectType]

  // ── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className="rounded-xl px-3.5 py-3 space-y-2"
        style={{ background: 'var(--bg-surface)', border: '1px solid rgba(139,92,246,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: '#8b5cf6' }} />
          <p className="text-[11px] text-text-secondary">
            Searching for {typeLabel} matching &ldquo;{result.query}&rdquo;…
          </p>
        </div>
      </div>
    )
  }

  // ── No match ─────────────────────────────────────────────────────────────

  if (result.status === 'no_match') {
    return (
      <div
        className="rounded-xl px-3.5 py-3 space-y-2"
        style={{
          background: 'rgba(255,149,0,0.05)',
          border: '1px solid rgba(255,149,0,0.2)',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" style={{ color: '#FF9500' }} />
            <div>
              <p className="text-[11px] font-semibold text-text-primary">No match found</p>
              <p className="text-[11px] text-text-muted leading-snug mt-0.5">
                {result.message}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Dismiss"
            className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[10px] text-text-muted leading-snug">
          Nothing will be saved until you identify the correct {typeLabel}.
        </p>
      </div>
    )
  }

  // ── Not supported ─────────────────────────────────────────────────────────

  if (result.status === 'not_supported') {
    return (
      <div
        className="rounded-xl px-3.5 py-3 space-y-2"
        style={{
          background: 'rgba(255,149,0,0.05)',
          border: '1px solid rgba(255,149,0,0.2)',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] uppercase tracking-widest font-semibold mb-0.5"
              style={{ color: '#FF9500' }}
            >
              Not yet supported
            </p>
            <p className="text-[11px] text-text-muted leading-snug">{result.message}</p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Dismiss"
            className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (result.status === 'error') {
    return (
      <div
        className="rounded-xl px-3.5 py-3 space-y-2"
        style={{
          background: 'rgba(255,59,48,0.05)',
          border: '1px solid rgba(255,59,48,0.2)',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" style={{ color: '#FF3B30' }} />
            <p className="text-[11px] text-text-muted leading-snug">{result.message}</p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Dismiss"
            className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    )
  }

  // ── Single or multiple matches ────────────────────────────────────────────

  const isMultiple = result.status === 'multiple_matches'

  return (
    <div
      className="rounded-xl px-3.5 py-3 space-y-2.5"
      style={{ background: 'var(--bg-surface)', border: '1px solid rgba(139,92,246,0.2)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 shrink-0 mt-px" style={{ color: '#8b5cf6' }} />
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: '#8b5cf6' }}
            >
              {isMultiple ? `${result.candidates.length} matches found` : 'Match found'}
            </p>
            <p className="text-[11px] text-text-muted leading-snug mt-0.5">
              {isMultiple
                ? `Choose the correct ${typeLabel} before I attach anything.`
                : `Confirm this is the correct ${typeLabel}.`}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          aria-label="Dismiss resolver"
          className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Candidates */}
      <div className="space-y-1.5">
        {result.candidates.map((candidate) => {
          const conf = CONFIDENCE_STYLES[candidate.confidence] ?? CONFIDENCE_STYLES.low
          return (
            <div
              key={candidate.id}
              className="rounded-lg px-2.5 py-2 flex items-start justify-between gap-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[12px] font-semibold text-text-primary leading-tight">
                    {candidate.label}
                  </p>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-widest font-semibold"
                    style={{
                      color: conf.color,
                      background: `${conf.color}18`,
                    }}
                  >
                    {conf.label}
                  </span>
                </div>
                {candidate.subtitle && (
                  <p className="text-[10px] text-text-muted leading-snug mt-0.5">
                    {candidate.subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={() => onSelect(candidate)}
                className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                style={{
                  background: 'rgba(200,255,0,0.08)',
                  color: '#C8FF00',
                  border: '1px solid rgba(200,255,0,0.2)',
                }}
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                Select
              </button>
            </div>
          )
        })}
      </div>

      {/* Safety note */}
      <p className="text-[10px] text-text-muted leading-snug">
        I will not save to a {typeLabel} record until you confirm the correct one.
      </p>
    </div>
  )
}
