'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updatePlayersPlacementAction } from './updatePlayersPlacementAction'

// ── Player add method ──────────────────────────────────────────

const ADD_METHOD_OPTIONS = [
  {
    value: 'manual_entry',
    label: 'Manual entry first',
    description: 'Add players one at a time directly in Academy OS to start.',
  },
  {
    value: 'csv_import_later',
    label: 'CSV import later',
    description: 'Prepare a roster spreadsheet and import it when you are ready.',
  },
  {
    value: 'parent_registration_later',
    label: 'Parent registration later',
    description: 'Parents complete a registration form and players are added from submissions.',
  },
  {
    value: 'mixed_import',
    label: 'Use multiple methods',
    description: 'Combine manual entry, CSV import, and registration as needed.',
  },
] as const

type AddMethodValue = typeof ADD_METHOD_OPTIONS[number]['value']

// ── Placement approach ─────────────────────────────────────────

const PLACEMENT_APPROACH_OPTIONS = [
  {
    value: 'assessment_first',
    label: 'Placement assessment first',
    description: 'Run a structured skill assessment before placing each player in a level.',
  },
  {
    value: 'director_review_first',
    label: 'Director review first',
    description: 'Director reviews player history and background before assigning a starting level.',
  },
  {
    value: 'coach_judgment_first',
    label: 'Coach judgment first',
    description: 'Coaches observe players in early sessions and recommend placement based on what they see.',
  },
  {
    value: 'age_level_default',
    label: 'Start from age / level default, then adjust',
    description: 'Assign players to age-appropriate levels to start, then move them up or down after review.',
  },
] as const

type PlacementApproachValue = typeof PLACEMENT_APPROACH_OPTIONS[number]['value']

// ── Placement approval model ───────────────────────────────────

const APPROVAL_MODEL_OPTIONS = [
  {
    value: 'director_approves_all',
    label: 'Director approves every placement',
    description: 'No player is activated in a level until the director confirms.',
  },
  {
    value: 'director_approves_exceptions',
    label: 'Director approves exceptions only',
    description: 'Standard placements are applied automatically; edge cases go to director review.',
  },
  {
    value: 'coach_recommends_director_approves',
    label: 'Coach recommends, director approves',
    description: 'Coaches submit placement recommendations and the director makes the final call.',
  },
] as const

type ApprovalModelValue = typeof APPROVAL_MODEL_OPTIONS[number]['value']

// ── Intake information ─────────────────────────────────────────

const INTAKE_OPTIONS = [
  { value: 'player_name_age',           label: 'Player name + age' },
  { value: 'ball_level',                label: 'Current ball level' },
  { value: 'current_training_history',  label: 'Training history' },
  { value: 'competition_experience',    label: 'Competition experience' },
  { value: 'technical_priorities',      label: 'Technical priorities' },
  { value: 'fitness_readiness',         label: 'Fitness readiness' },
  { value: 'parent_goals',              label: 'Parent goals' },
  { value: 'scheduling_availability',   label: 'Scheduling availability' },
] as const

type IntakeValue = typeof INTAKE_OPTIONS[number]['value']

const DEFAULT_INTAKE: IntakeValue[] = [
  'player_name_age',
  'ball_level',
  'current_training_history',
  'competition_experience',
  'parent_goals',
]

// ── Props ──────────────────────────────────────────────────────

interface Props {
  initialAddMethod: string
  initialPlacementApproach: string
  initialApprovalModel: string
  initialIntakeInformation: string[]
  initialNotes: string
}

// ── Radio section ──────────────────────────────────────────────

function RadioSection<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string; description: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">{label}</p>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150',
            value === opt.value
              ? 'border-lime/40 bg-lime/5'
              : 'border-border bg-surface-raised hover:border-lime/20',
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              'mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
              value === opt.value ? 'border-lime' : 'border-border',
            )}>
              {value === opt.value && (
                <div className="w-1.5 h-1.5 rounded-full bg-lime" />
              )}
            </div>
            <div className="min-w-0">
              <p className={cn(
                'text-sm font-medium leading-tight',
                value === opt.value ? 'text-text-primary' : 'text-text-secondary',
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
  )
}

// ── Component ──────────────────────────────────────────────────

export function PlayersPlacementForm({
  initialAddMethod,
  initialPlacementApproach,
  initialApprovalModel,
  initialIntakeInformation,
  initialNotes,
}: Props) {
  const defaultAddMethod: AddMethodValue =
    ADD_METHOD_OPTIONS.some(o => o.value === initialAddMethod)
      ? (initialAddMethod as AddMethodValue)
      : 'manual_entry'

  const defaultApproach: PlacementApproachValue =
    PLACEMENT_APPROACH_OPTIONS.some(o => o.value === initialPlacementApproach)
      ? (initialPlacementApproach as PlacementApproachValue)
      : 'assessment_first'

  const defaultApproval: ApprovalModelValue =
    APPROVAL_MODEL_OPTIONS.some(o => o.value === initialApprovalModel)
      ? (initialApprovalModel as ApprovalModelValue)
      : 'director_approves_all'

  const defaultIntake: IntakeValue[] =
    initialIntakeInformation.length > 0
      ? (initialIntakeInformation.filter(i =>
          INTAKE_OPTIONS.some(o => o.value === i)
        ) as IntakeValue[])
      : DEFAULT_INTAKE

  const [addMethod, setAddMethod] = useState<AddMethodValue>(defaultAddMethod)
  const [placementApproach, setPlacementApproach] = useState<PlacementApproachValue>(defaultApproach)
  const [approvalModel, setApprovalModel] = useState<ApprovalModelValue>(defaultApproval)
  const [intakeInformation, setIntakeInformation] = useState<IntakeValue[]>(defaultIntake)
  const [notes, setNotes] = useState(initialNotes)

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleIntake(value: IntakeValue) {
    setSaved(false)
    setIntakeInformation(prev =>
      prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]
    )
  }

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const result = await updatePlayersPlacementAction(
        addMethod,
        placementApproach,
        approvalModel,
        intakeInformation,
        notes,
      )
      if (result.ok) setSaved(true)
      else setError(result.error)
    })
  }

  return (
    <div className="space-y-8">

      <RadioSection
        label="How will players be added to the academy?"
        options={ADD_METHOD_OPTIONS}
        value={addMethod}
        onChange={v => { setAddMethod(v); setSaved(false) }}
      />

      <RadioSection
        label="How should initial placement work?"
        options={PLACEMENT_APPROACH_OPTIONS}
        value={placementApproach}
        onChange={v => { setPlacementApproach(v); setSaved(false) }}
      />

      <RadioSection
        label="Who approves player placement?"
        options={APPROVAL_MODEL_OPTIONS}
        value={approvalModel}
        onChange={v => { setApprovalModel(v); setSaved(false) }}
      />

      {/* ── Intake information ── */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
            What information should be captured during player intake?
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">Select all that apply.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {INTAKE_OPTIONS.map(opt => {
            const checked = intakeInformation.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleIntake(opt.value)}
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

      {/* ── Notes ── */}
      <div className="space-y-1.5">
        <label className="label-xs">Player onboarding / placement notes</label>
        <p className="text-xs text-text-secondary leading-relaxed">
          Anything else Academy OS should know about how players are added, assessed, or placed?
        </p>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setSaved(false) }}
          rows={3}
          maxLength={600}
          placeholder="e.g. We run a three-session trial before formal placement. All new players start with an assessment regardless of prior experience…"
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
          {isPending ? 'Saving…' : 'Save Players + Placement Setup'}
        </button>

        {saved && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/25">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm text-status-green font-medium">Players and placement setup saved.</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-status-red px-1">{error}</p>
        )}
      </div>

    </div>
  )
}
