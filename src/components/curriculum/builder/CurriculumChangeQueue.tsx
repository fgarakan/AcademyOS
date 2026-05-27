'use client'

import { GitBranch, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CurriculumChangeItem {
  /** UUID of the academy_curriculum_overrides row */
  id: string
  /** Extracted from proposed_change->>'title' */
  title: string
  /** Extracted from proposed_change->>'content_type' — drill/fitness/assessment/etc. */
  contentType: string | null
  /** override_type column — add/update/remove/replace/emphasis_shift */
  overrideType: string
  /** source column — voice/typed/ui */
  source: string
  /** status column */
  status: 'draft' | 'pending_review' | 'approved' | 'applied' | 'rejected' | 'rolled_back'
  /** created_at ISO string */
  createdAt: string
  /** Extracted from proposed_change->>'description' */
  description: string | null
}

interface Props {
  items: CurriculumChangeItem[]
  errorMessage?: string | null
}

// ─── Status display config ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  CurriculumChangeItem['status'],
  { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  draft:         { label: 'Draft',          color: 'text-text-muted',       Icon: GitBranch },
  pending_review:{ label: 'Pending review', color: 'text-status-orange',    Icon: Clock },
  approved:      { label: 'Approved',       color: 'text-status-green',     Icon: CheckCircle2 },
  applied:       { label: 'Applied',        color: 'text-lime',             Icon: CheckCircle2 },
  rejected:      { label: 'Rejected',       color: 'text-status-red',       Icon: XCircle },
  rolled_back:   { label: 'Rolled back',    color: 'text-text-muted',       Icon: RotateCcw },
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatContentType(ct: string | null): string | null {
  if (!ct) return null
  const map: Record<string, string> = {
    drill:       'Drill',
    fitness:     'Fitness exercise',
    assessment:  'Assessment gate',
    game:        'Game',
    skill:       'Skill',
    warmup:      'Warmup',
    cooldown:    'Cooldown',
    tactical:    'Tactical',
    competition: 'Competition',
  }
  return map[ct] ?? ct
}

function formatSource(source: string): string {
  if (source === 'voice') return 'DONNA (voice)'
  if (source === 'typed') return 'DONNA (typed)'
  return 'Director edit'
}

function formatOverrideType(ot: string): string {
  const map: Record<string, string> = {
    add:             'New',
    update:          'Update',
    remove:          'Remove',
    replace:         'Replace',
    emphasis_shift:  'Emphasis',
  }
  return map[ot] ?? ot
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CurriculumChangeQueue({ items, errorMessage }: Props) {
  // Error state
  if (errorMessage) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <p className="text-[11px] text-status-red">{errorMessage}</p>
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border border-dashed bg-surface p-6 text-center space-y-2">
        <GitBranch className="w-5 h-5 text-text-muted mx-auto" />
        <p className="text-[12px] font-semibold text-text-primary">
          No curriculum drafts waiting for review.
        </p>
        <p className="text-[11px] text-text-muted leading-relaxed">
          Ask DONNA to draft a drill, gate, or fitness change to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
          {items.length} pending {items.length === 1 ? 'draft' : 'drafts'}
        </p>
        <Link
          href="/director/review"
          className="text-[10px] text-lime hover:text-lime/80 transition-colors"
        >
          Review Queue →
        </Link>
      </div>

      {items.map(item => {
        const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending_review
        const displayContentType = formatContentType(item.contentType)
        const displaySource = formatSource(item.source)
        const displayOverrideType = formatOverrideType(item.overrideType)

        return (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-surface-raised px-3 py-2.5 space-y-1.5"
          >
            {/* Title row */}
            <div className="flex items-start gap-2">
              <cfg.Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
              <p className="text-[11px] font-medium text-text-primary leading-snug line-clamp-2 flex-1 min-w-0">
                {item.title}
              </p>
            </div>

            {/* Badge row */}
            <div className="flex flex-wrap gap-1 pl-[22px]">
              {displayContentType && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary">
                  {displayContentType}
                </span>
              )}
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">
                {displayOverrideType}
              </span>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">
                {displaySource}
              </span>
            </div>

            {/* Description preview */}
            {item.description && (
              <p className="text-[10px] text-text-muted leading-relaxed pl-[22px] line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 pl-[22px]">
              <span className={`text-[9px] font-semibold ${cfg.color}`}>{cfg.label}</span>
              <span className="text-[9px] text-text-muted">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )
      })}

      <p className="text-[9px] text-text-muted text-center pt-1">
        Draft only — nothing is applied until approved in the Review Queue.
      </p>
    </div>
  )
}
