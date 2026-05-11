'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProgramsGroupsAction } from './updateProgramsGroupsAction'

// ── Program structure ──────────────────────────────────────────

const PROGRAM_OPTIONS = [
  {
    value: 'single_program',
    label: 'Single program',
    description: 'All players train in one unified program regardless of level or age.',
  },
  {
    value: 'multiple_programs',
    label: 'Multiple programs',
    description: 'Separate programs for different tracks (e.g. recreational, development, elite).',
  },
  {
    value: 'age_banded',
    label: 'Age-banded programs',
    description: 'Programs organized primarily by age group (e.g. U10, U12, U14, U18).',
  },
  {
    value: 'level_banded',
    label: 'Level-banded programs',
    description: 'Programs organized by skill level independent of age.',
  },
] as const

type ProgramValue = typeof PROGRAM_OPTIONS[number]['value']

// ── Group structure ────────────────────────────────────────────

const GROUP_OPTIONS = [
  {
    value: 'level_based',
    label: 'Level-based groups',
    description: 'Players grouped by their current skill level.',
  },
  {
    value: 'age_and_level_based',
    label: 'Age + level groups',
    description: 'Groups defined by both age and skill level (e.g. U12 Red Ball).',
  },
  {
    value: 'mixed_level',
    label: 'Mixed-level groups',
    description: 'Groups intentionally mix levels for peer learning.',
  },
  {
    value: 'flexible',
    label: 'Flexible grouping',
    description: 'Coaches group players dynamically session by session.',
  },
] as const

type GroupValue = typeof GROUP_OPTIONS[number]['value']

// ── Naming convention ──────────────────────────────────────────

const NAMING_OPTIONS = [
  {
    value: 'ball_color_level',
    label: 'Ball color / level name',
    description: 'Groups named by ball type or level (e.g. Red Ball, Orange, Green, Yellow).',
  },
  {
    value: 'age_level',
    label: 'Age + level',
    description: 'Groups named by age bracket and skill tier (e.g. U10 Beginner, U14 Advanced).',
  },
  {
    value: 'performance_track',
    label: 'Performance track',
    description: 'Groups named by track or pathway (e.g. Foundation, Performance, Elite).',
  },
  {
    value: 'custom',
    label: 'Custom naming',
    description: 'Define your own naming system when you create each group.',
  },
] as const

type NamingValue = typeof NAMING_OPTIONS[number]['value']

// ── Props ──────────────────────────────────────────────────────

interface Props {
  initialProgramStructure: string
  initialGroupStructure: string
  initialNamingConvention: string
  initialNotes: string
}

// ── Component ──────────────────────────────────────────────────

export function ProgramsGroupsForm({
  initialProgramStructure,
  initialGroupStructure,
  initialNamingConvention,
  initialNotes,
}: Props) {
  const defaultProgram: ProgramValue =
    PROGRAM_OPTIONS.some(o => o.value === initialProgramStructure)
      ? (initialProgramStructure as ProgramValue)
      : 'multiple_programs'

  const defaultGroup: GroupValue =
    GROUP_OPTIONS.some(o => o.value === initialGroupStructure)
      ? (initialGroupStructure as GroupValue)
      : 'age_and_level_based'

  const defaultNaming: NamingValue =
    NAMING_OPTIONS.some(o => o.value === initialNamingConvention)
      ? (initialNamingConvention as NamingValue)
      : 'ball_color_level'

  const [programStructure, setProgramStructure] = useState<ProgramValue>(defaultProgram)
  const [groupStructure, setGroupStructure] = useState<GroupValue>(defaultGroup)
  const [namingConvention, setNamingConvention] = useState<NamingValue>(defaultNaming)
  const [notes, setNotes] = useState(initialNotes)

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const result = await updateProgramsGroupsAction(
        programStructure,
        groupStructure,
        namingConvention,
        notes,
      )
      if (result.ok) setSaved(true)
      else setError(result.error)
    })
  }

  const sectionLabel = 'text-xs font-semibold text-text-secondary uppercase tracking-widest'

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
        <p className={sectionLabel}>{label}</p>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { onChange(opt.value); setSaved(false) }}
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

  return (
    <div className="space-y-8">

      <RadioSection
        label="How are your programs structured?"
        options={PROGRAM_OPTIONS}
        value={programStructure}
        onChange={setProgramStructure}
      />

      <RadioSection
        label="How are groups organized within programs?"
        options={GROUP_OPTIONS}
        value={groupStructure}
        onChange={setGroupStructure}
      />

      <RadioSection
        label="How do you name your groups?"
        options={NAMING_OPTIONS}
        value={namingConvention}
        onChange={setNamingConvention}
      />

      {/* ── Notes ── */}
      <div className="space-y-1.5">
        <label className="label-xs">Additional Notes</label>
        <p className="text-xs text-text-secondary leading-relaxed">
          Anything else Academy OS should know about how your programs and groups are structured?
        </p>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setSaved(false) }}
          rows={3}
          maxLength={600}
          placeholder="e.g. We run a junior development track separate from our recreational program. Elite players can train across multiple groups…"
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
          {isPending ? 'Saving…' : 'Save Programs + Groups Setup'}
        </button>

        {saved && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/25">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm text-status-green font-medium">Programs and groups setup saved.</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-status-red px-1">{error}</p>
        )}
      </div>

    </div>
  )
}
