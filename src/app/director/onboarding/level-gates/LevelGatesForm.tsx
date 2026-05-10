'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateLevelGatesAction } from './updateLevelGatesAction'

// ── Approval model ─────────────────────────────────────────────

const APPROVAL_OPTIONS = [
  {
    value: 'coach_recommend_director_approve',
    label: 'Coach recommends, director approves',
    description: 'Coaches can suggest level movement, but the director makes the final decision.',
  },
  {
    value: 'director_only',
    label: 'Director approval only',
    description: 'Only directors can approve level changes.',
  },
  {
    value: 'coach_and_director',
    label: 'Coach and director both approve',
    description: 'Level movement requires agreement from coach and director.',
  },
] as const

type ApprovalValue = typeof APPROVAL_OPTIONS[number]['value']

// ── Evidence options ───────────────────────────────────────────

const EVIDENCE_OPTIONS = [
  { value: 'skill_assessment',             label: 'Skill Assessment' },
  { value: 'coach_observations',           label: 'Coach Observations' },
  { value: 'session_performance',          label: 'Session Performance' },
  { value: 'match_competition_behavior',   label: 'Match / Competition Behavior' },
  { value: 'attendance_consistency',       label: 'Attendance Consistency' },
  { value: 'fitness_readiness',            label: 'Fitness Readiness' },
  { value: 'home_practice_or_app_work',    label: 'Home Practice / App Work' },
] as const

type EvidenceValue = typeof EVIDENCE_OPTIONS[number]['value']

const DEFAULT_EVIDENCE: EvidenceValue[] = [
  'skill_assessment',
  'coach_observations',
  'session_performance',
  'match_competition_behavior',
]

// ── Portal visibility ──────────────────────────────────────────

const VISIBILITY_OPTIONS = [
  {
    value: 'show_simple_requirements',
    label: 'Show simple next-level requirements',
    description: 'Parents and players see clear, parent-safe next steps.',
  },
  {
    value: 'show_progress_only',
    label: 'Show progress only',
    description: 'Parents and players see current progress, but not full promotion criteria.',
  },
  {
    value: 'internal_only',
    label: 'Keep level gates internal for now',
    description: 'Only directors and coaches see promotion criteria.',
  },
] as const

type VisibilityValue = typeof VISIBILITY_OPTIONS[number]['value']

// ── Props ──────────────────────────────────────────────────────

interface Props {
  initialApprovalModel: string
  initialEvidenceRequired: string[]
  initialPortalVisibility: string
  initialNotes: string
}

// ── Component ──────────────────────────────────────────────────

export function LevelGatesForm({
  initialApprovalModel,
  initialEvidenceRequired,
  initialPortalVisibility,
  initialNotes,
}: Props) {
  const defaultApproval: ApprovalValue =
    APPROVAL_OPTIONS.some(o => o.value === initialApprovalModel)
      ? (initialApprovalModel as ApprovalValue)
      : 'coach_recommend_director_approve'

  const defaultVisibility: VisibilityValue =
    VISIBILITY_OPTIONS.some(o => o.value === initialPortalVisibility)
      ? (initialPortalVisibility as VisibilityValue)
      : 'show_simple_requirements'

  const defaultEvidence: EvidenceValue[] =
    initialEvidenceRequired.length > 0
      ? (initialEvidenceRequired.filter(e =>
          EVIDENCE_OPTIONS.some(o => o.value === e)
        ) as EvidenceValue[])
      : DEFAULT_EVIDENCE

  const [approvalModel, setApprovalModel] = useState<ApprovalValue>(defaultApproval)
  const [evidenceRequired, setEvidenceRequired] = useState<EvidenceValue[]>(defaultEvidence)
  const [portalVisibility, setPortalVisibility] = useState<VisibilityValue>(defaultVisibility)
  const [notes, setNotes] = useState(initialNotes)

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleEvidence(value: EvidenceValue) {
    setSaved(false)
    setEvidenceRequired(prev =>
      prev.includes(value) ? prev.filter(e => e !== value) : [...prev, value]
    )
  }

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const result = await updateLevelGatesAction(
        approvalModel,
        evidenceRequired,
        portalVisibility,
        notes,
      )
      if (result.ok) setSaved(true)
      else setError(result.error)
    })
  }

  const sectionLabel = 'text-xs font-semibold text-text-secondary uppercase tracking-widest'

  return (
    <div className="space-y-8">

      {/* ── Approval model ── */}
      <div className="space-y-3">
        <p className={sectionLabel}>Who approves level movement?</p>
        {APPROVAL_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setApprovalModel(opt.value); setSaved(false) }}
            className={cn(
              'w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150',
              approvalModel === opt.value
                ? 'border-lime/40 bg-lime/5'
                : 'border-border bg-surface-raised hover:border-lime/20',
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                approvalModel === opt.value ? 'border-lime' : 'border-border',
              )}>
                {approvalModel === opt.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-lime" />
                )}
              </div>
              <div className="min-w-0">
                <p className={cn(
                  'text-sm font-medium leading-tight',
                  approvalModel === opt.value ? 'text-text-primary' : 'text-text-secondary',
                )}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Evidence required ── */}
      <div className="space-y-3">
        <div>
          <p className={sectionLabel}>What evidence matters for promotion?</p>
          <p className="text-[11px] text-text-muted mt-0.5">Select all that apply.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EVIDENCE_OPTIONS.map(opt => {
            const checked = evidenceRequired.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleEvidence(opt.value)}
                className={cn(
                  'w-full text-left px-3.5 py-2.5 rounded-xl border transition-all duration-150',
                  checked
                    ? 'border-lime/40 bg-lime/5'
                    : 'border-border bg-surface-raised hover:border-lime/20',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'w-3.5 h-3.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
                    checked ? 'border-lime bg-lime' : 'border-border bg-transparent',
                  )}>
                    {checked && (
                      <svg className="w-2 h-2 text-base" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <p className={cn(
                    'text-xs font-medium leading-tight',
                    checked ? 'text-text-primary' : 'text-text-secondary',
                  )}>
                    {opt.label}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Portal visibility ── */}
      <div className="space-y-3">
        <p className={sectionLabel}>What do parents and players see?</p>
        {VISIBILITY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setPortalVisibility(opt.value); setSaved(false) }}
            className={cn(
              'w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150',
              portalVisibility === opt.value
                ? 'border-lime/40 bg-lime/5'
                : 'border-border bg-surface-raised hover:border-lime/20',
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                portalVisibility === opt.value ? 'border-lime' : 'border-border',
              )}>
                {portalVisibility === opt.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-lime" />
                )}
              </div>
              <div className="min-w-0">
                <p className={cn(
                  'text-sm font-medium leading-tight',
                  portalVisibility === opt.value ? 'text-text-primary' : 'text-text-secondary',
                )}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Notes ── */}
      <div className="space-y-1.5">
        <label className="label-xs">Promotion Notes</label>
        <p className="text-xs text-text-secondary leading-relaxed">
          What should Academy OS know about how your academy promotes players to the next level?
        </p>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setSaved(false) }}
          rows={3}
          maxLength={600}
          placeholder="e.g. We require a formal skill assessment before any level change. Parents are informed after the decision is made…"
          className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none"
        />
        <p className="text-[10px] text-text-muted text-right">{notes.length} / 600</p>
      </div>

      {/* ── Save ── */}
      <div className="pt-2 border-t border-border space-y-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-lime text-base font-semibold text-sm hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPending ? 'Saving…' : 'Save Level Gate Rules'}
        </button>

        {saved && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/25">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm text-status-green font-medium">Level gate rules saved.</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-status-red px-1">{error}</p>
        )}
      </div>

    </div>
  )
}
