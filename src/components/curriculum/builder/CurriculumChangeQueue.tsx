'use client'

/**
 * CurriculumChangeQueue — Sprint 905 / Sprint 910
 *
 * Renders the pending curriculum draft queue with per-item approve/reject
 * controls (Sprint 905) and an expandable "Review draft" detail panel
 * (Sprint 910).
 *
 * Sprint 910 additions:
 *   - CurriculumChangeItem extended with 11 new detail fields
 *     (rawInput, pathway, difficulty, intensity, durationMin, durationMax,
 *     courtSetup, coachCues, successCriteria, progressions, regressions)
 *   - expandedId state — one item open at a time; null = all collapsed
 *   - "Review draft" / "Hide details" toggle per item
 *   - Inline expandable panel: "What DONNA proposed" — shows full
 *     description, director's notes, meta fields, and array fields
 *   - Fallback: "No additional details were included with this draft."
 *   - Description preview remains visible in compact state (line-clamped)
 *     and is shown full/unclamped inside the expanded panel
 *
 * Architecture invariants:
 *   - Approve → approveCurriculumOverrideDraft() only (Sprint 904)
 *   - Reject  → rejectCurriculumOverrideDraft() only (Sprint 904)
 *   - No direct execute_curriculum_override() call
 *   - No proposed_actions usage
 *   - No new server actions
 *   - No edit functionality
 *   - No bulk approval
 *
 * Related:
 *   src/app/director/curriculum/builder/CurriculumBuilderChangeQueue.tsx — passes items
 *   src/lib/actions/curriculumOverrideApprovalActions.ts — approve/reject actions
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  GitBranch,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
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

  // ── Detail fields (Sprint 910) ───────────────────────────────────────────────
  /** raw_input column — director's original voice/text before structuring */
  rawInput: string | null
  /** proposed_change->>'pathway' — skill/competition/fitness/mixed */
  pathway: string | null
  /** proposed_change->>'difficulty' — 1–5 */
  difficulty: number | null
  /** proposed_change->>'intensity' — 1–10 */
  intensity: number | null
  /** proposed_change->>'duration_min' */
  durationMin: number | null
  /** proposed_change->>'duration_max' */
  durationMax: number | null
  /** proposed_change->>'court_setup' */
  courtSetup: string | null
  /** proposed_change->>'coach_cues' */
  coachCues: string[] | null
  /** proposed_change->>'success_criteria' */
  successCriteria: string[] | null
  /** proposed_change->>'progressions' */
  progressions: string[] | null
  /** proposed_change->>'regressions' */
  regressions: string[] | null
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
  draft:          { label: 'Draft',          color: 'text-text-muted',    Icon: GitBranch   },
  pending_review: { label: 'Pending review', color: 'text-status-orange', Icon: Clock       },
  approved:       { label: 'Approved',       color: 'text-status-green',  Icon: CheckCircle2},
  applied:        { label: 'Applied',        color: 'text-lime',          Icon: CheckCircle2},
  rejected:       { label: 'Rejected',       color: 'text-status-red',    Icon: XCircle     },
  rolled_back:    { label: 'Rolled back',    color: 'text-text-muted',    Icon: RotateCcw   },
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
    add:            'New',
    update:         'Update',
    remove:         'Remove',
    replace:        'Replace',
    emphasis_shift: 'Emphasis',
  }
  return map[ot] ?? ot
}

function formatPathway(pathway: string): string {
  const map: Record<string, string> = {
    skill:       'Skill',
    competition: 'Competition',
    fitness:     'Fitness',
    mixed:       'Mixed',
  }
  return map[pathway] ?? pathway
}

function formatDuration(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}–${max} min`
  if (min != null) return `${min}+ min`
  if (max != null) return `Up to ${max} min`
  return ''
}

// ─── Detail sub-components ────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-[9px] font-semibold text-text-muted uppercase tracking-wider shrink-0"
        style={{ minWidth: '76px' }}
      >
        {label}
      </span>
      <span className="text-[10px] text-text-secondary leading-relaxed">{value}</span>
    </div>
  )
}

function DetailList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">
        {label}
      </p>
      <ul className="space-y-0.5 pl-1">
        {items.map((text, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-[10px] text-text-muted shrink-0 mt-px">·</span>
            <span className="text-[10px] text-text-secondary leading-relaxed">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CurriculumChangeQueue({ items, errorMessage }: Props) {
  const router = useRouter()

  // Per-item loading/result/error state keyed by override id
  const [itemStates, setItemStates] = useState<Record<string, ItemActionState>>({})
  // Which item's detail panel is open — one at a time; null = all collapsed
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
        const displaySource      = formatSource(item.source)
        const displayOverrideType = formatOverrideType(item.overrideType)
        const state      = getState(item.id)
        const isExpanded = expandedId === item.id

        // Show approve/reject buttons only for actionable statuses
        const isActionable = item.status === 'pending_review' || item.status === 'draft'
        const isBusy = state.loading !== null

        // ── Detail panel visibility helpers ──────────────────────────────
        // rawInput is only worth showing when it differs from description
        const showRawInput = !!(
          item.rawInput?.trim() &&
          item.rawInput.trim() !== item.description?.trim()
        )
        const hasMeta = !!(
          item.pathway ||
          item.difficulty != null ||
          item.intensity != null ||
          item.durationMin != null ||
          item.durationMax != null ||
          item.courtSetup
        )
        const hasLists = !!(
          item.coachCues?.length ||
          item.successCriteria?.length ||
          item.progressions?.length ||
          item.regressions?.length
        )
        const hasAnyDetail = !!(item.description || showRawInput || hasMeta || hasLists)

        return (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-surface-raised px-3 py-2.5 space-y-1.5"
          >
            {/* ── Title row ───────────────────────────────────────────── */}
            <div className="flex items-start gap-2">
              <cfg.Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
              <p className="text-[11px] font-medium text-text-primary leading-snug line-clamp-2 flex-1 min-w-0">
                {item.title}
              </p>
            </div>

            {/* ── Badge row ───────────────────────────────────────────── */}
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

            {/* ── Description preview — compact; hidden while expanded ── */}
            {item.description && !isExpanded && (
              <p className="text-[10px] text-text-muted leading-relaxed pl-[22px] line-clamp-2">
                {item.description}
              </p>
            )}

            {/* ── Meta row ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pl-[22px]">
              <span className={`text-[9px] font-semibold ${cfg.color}`}>{cfg.label}</span>
              <span className="text-[9px] text-text-muted">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* ── Review draft toggle ──────────────────────────────────── */}
            <div className="pl-[22px]">
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="flex items-center gap-1 text-[10px] text-text-muted hover:text-lime transition-colors"
              >
                {isExpanded
                  ? <ChevronUp className="w-3 h-3" />
                  : <ChevronDown className="w-3 h-3" />
                }
                {isExpanded ? 'Hide details' : 'Review draft'}
              </button>
            </div>

            {/* ── Expandable detail panel ──────────────────────────────── */}
            {isExpanded && (
              <div
                className="ml-[22px] rounded-xl px-3 py-3 space-y-2.5"
                style={{
                  border:     '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(0,0,0,0.15)',
                }}
              >
                {/* Section header */}
                <p className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
                  What DONNA proposed
                </p>

                {hasAnyDetail ? (
                  <div className="space-y-2.5">

                    {/* Full description (unclamped when expanded) */}
                    {item.description && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">
                          Description
                        </p>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    )}

                    {/* Director's raw notes — only when different from description */}
                    {showRawInput && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">
                          Director&apos;s notes
                        </p>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          {item.rawInput}
                        </p>
                      </div>
                    )}

                    {/* Scalar meta fields */}
                    {hasMeta && (
                      <div className="space-y-1.5">
                        {item.pathway && (
                          <DetailRow label="Pathway" value={formatPathway(item.pathway)} />
                        )}
                        {item.difficulty != null && (
                          <DetailRow label="Difficulty" value={`${item.difficulty} / 5`} />
                        )}
                        {item.intensity != null && (
                          <DetailRow label="Intensity" value={`${item.intensity} / 10`} />
                        )}
                        {(item.durationMin != null || item.durationMax != null) && (
                          <DetailRow
                            label="Duration"
                            value={formatDuration(item.durationMin, item.durationMax)}
                          />
                        )}
                        {item.courtSetup && (
                          <DetailRow label="Court setup" value={item.courtSetup} />
                        )}
                      </div>
                    )}

                    {/* Array fields */}
                    {item.coachCues && item.coachCues.length > 0 && (
                      <DetailList label="Coaching cues" items={item.coachCues} />
                    )}
                    {item.successCriteria && item.successCriteria.length > 0 && (
                      <DetailList label="Success criteria" items={item.successCriteria} />
                    )}
                    {item.progressions && item.progressions.length > 0 && (
                      <DetailList label="Progressions" items={item.progressions} />
                    )}
                    {item.regressions && item.regressions.length > 0 && (
                      <DetailList label="Regressions" items={item.regressions} />
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    No additional details were included with this draft.
                  </p>
                )}

                {/* Footer */}
                <p
                  className="text-[9px] text-text-muted pt-0.5"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  Waiting for director review.
                </p>
              </div>
            )}

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
                      background: 'rgba(200,255,0,0.10)',
                      border:     '1px solid rgba(200,255,0,0.22)',
                      color:      '#C8FF00',
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

            {/* ── Success feedback (before router.refresh() clears the item) ── */}
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
