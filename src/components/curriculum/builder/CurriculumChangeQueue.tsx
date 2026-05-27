'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitBranch, Clock, CheckCircle2, XCircle, RotateCcw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import {
  approveCurriculumOverrideDraft,
  rejectCurriculumOverrideDraft,
} from '@/lib/actions/curriculumOverrideApprovalActions'

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

// ─── Per-item action state ─────────────────────────────────────────────────────

interface ItemActionState {
  loading: 'approving' | 'rejecting' | null
  result:  'approved' | 'rejected' | null
  error:   string | null
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
  const router = useRouter()

  // Per-item loading/result/error state keyed by override id
  const [itemStates, setItemStates] = useState<Record<string, ItemActionState>>({})

  function getState(id: string): ItemActionState {
    return itemStates[id] ?? { loading: null, result: null, error: null }
  }

  function setState(id: string, patch: Partial<ItemActionState>) {
    setItemStates(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? { loading: null, result: null, error: null }), ...patch },
    }))
  }

  async function handleApprove(id: string) {
    setState(id, { loading: 'approving', error: null, result: null })
    const res = await approveCurriculumOverrideDraft(id)
    if (res.ok) {
      setState(id, { loading: null, result: 'approved', error: null })
      router.refresh()
    } else {
      setState(id, { loading: null, result: null, error: res.error })
    }
  }

  async function handleReject(id: string) {
    setState(id, { loading: 'rejecting', error: null, result: null })
    const res = await rejectCurriculumOverrideDraft(id)
    if (res.ok) {
      setState(id, { loading: null, result: 'rejected', error: null })
      router.refresh()
    } else {
      setState(id, { loading: null, result: null, error: res.error })
    }
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (errorMessage) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <p className="text-[11px] text-status-red">{errorMessage}</p>
      </div>
    )
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
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
        const state = getState(item.id)

        // Show approve/reject buttons only for actionable statuses
        const isActionable = item.status === 'pending_review' || item.status === 'draft'
        const isBusy = state.loading !== null

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

            {/* ── Approve / Reject controls ──────────────────────────────── */}
            {isActionable && state.result === null && (
              <div className="pl-[22px] pt-0.5 space-y-1.5">
                <p className="text-[9px] text-text-muted">
                  Approval applies this draft to the academy curriculum.
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={isBusy}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background:  'rgba(200,255,0,0.10)',
                      border:      '1px solid rgba(200,255,0,0.22)',
                      color:       '#C8FF00',
                    }}
                  >
                    {state.loading === 'approving' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    disabled={isBusy}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-border text-text-muted hover:text-text-secondary hover:border-border/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.loading === 'rejecting' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    Reject
                  </button>
                </div>
                {/* Per-item error */}
                {state.error && (
                  <p className="text-[10px] text-status-red leading-snug">{state.error}</p>
                )}
              </div>
            )}

            {/* ── Success feedback (before router.refresh() clears the item) */}
            {isActionable && state.result === 'approved' && (
              <div className="pl-[22px] pt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-lime shrink-0" />
                <p className="text-[10px] font-semibold text-lime">Draft approved and applied.</p>
              </div>
            )}
            {isActionable && state.result === 'rejected' && (
              <div className="pl-[22px] pt-0.5 flex items-center gap-1.5">
                <XCircle className="w-3 h-3 text-text-muted shrink-0" />
                <p className="text-[10px] font-semibold text-text-secondary">Draft rejected.</p>
              </div>
            )}
          </div>
        )
      })}

      <p className="text-[9px] text-text-muted text-center pt-1">
        Draft only — nothing is applied until approved in the Review Queue.
      </p>
    </div>
  )
}
