'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateCurriculumStarterAction } from './updateCurriculumStarterAction'

const OPTIONS = [
  {
    value: 'customize_starter',
    label: 'Start with Academy OS curriculum and customize it',
    description: 'Use the starter structure, then adjust levels, gates, language, and priorities to match your academy.',
  },
  {
    value: 'academy_os_starter',
    label: 'Use Academy OS Starter Curriculum',
    description: 'Start with a complete development spine and customize it over time.',
  },
  {
    value: 'upload_existing_later',
    label: 'I have my own curriculum',
    description: 'Continue onboarding now and upload or recreate your curriculum later.',
  },
  {
    value: 'blank_structure',
    label: 'Start with a blank structure',
    description: 'Build programs, groups, and curriculum manually over time.',
  },
] as const

type OptionValue = typeof OPTIONS[number]['value']

interface Props {
  initialOption: string
  initialNotes: string
}

export function CurriculumStarterForm({ initialOption, initialNotes }: Props) {
  const defaultOption: OptionValue =
    OPTIONS.some(o => o.value === initialOption)
      ? (initialOption as OptionValue)
      : 'customize_starter'

  const [selected, setSelected] = useState<OptionValue>(defaultOption)
  const [notes, setNotes] = useState(initialNotes)

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const result = await updateCurriculumStarterAction(selected, notes)
      if (result.ok) setSaved(true)
      else setError(result.error)
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Option cards ── */}
      <div className="space-y-3">
        <p className="label-xs">Choose a starting point</p>
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setSelected(opt.value); setSaved(false) }}
            className={cn(
              'w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150',
              selected === opt.value
                ? 'border-lime/40 bg-lime/5'
                : 'border-border bg-surface-raised hover:border-lime/20',
            )}
          >
            <div className="flex items-start gap-3">
              {/* Radio dot */}
              <div className={cn(
                'mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                selected === opt.value ? 'border-lime' : 'border-border',
              )}>
                {selected === opt.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-lime" />
                )}
              </div>
              <div className="min-w-0">
                <p className={cn(
                  'text-sm font-medium leading-tight',
                  selected === opt.value ? 'text-text-primary' : 'text-text-secondary',
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
        <label className="label-xs">Curriculum Notes</label>
        <p className="text-xs text-text-secondary leading-relaxed">
          What should Academy OS know about how you teach or structure your curriculum?
        </p>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setSaved(false) }}
          rows={4}
          maxLength={800}
          placeholder="e.g. We follow a ball-colour progression from red through yellow. Our advanced players compete at regional level…"
          className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none"
        />
        <p className="text-[10px] text-text-muted text-right">{notes.length} / 800</p>
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
          {isPending ? 'Saving…' : 'Save Curriculum Setup'}
        </button>

        {saved && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/25">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm text-status-green font-medium">Curriculum setup saved.</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-status-red px-1">{error}</p>
        )}
      </div>

    </div>
  )
}
