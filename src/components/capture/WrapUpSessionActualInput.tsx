'use client'

import { useState } from 'react'
import { Check, Edit3, SkipForward, PlusCircle, Cloud, AlertTriangle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SessionModificationType =
  | 'skipped_block'
  | 'added_block'
  | 'shortened_block'
  | 'reordered'
  | 'weather'
  | 'space_issue'
  | 'group_energy'
  | 'late_start'
  | 'other'

export interface SessionActualAnswer {
  completedAsPlanned: boolean
  modified: boolean
  modifications: SessionModificationType[]
  notes: string
  directorReviewRequired: true
  officialWriteApplied: false
}

// ── Completion modes ──────────────────────────────────────────────────────────

interface CompletionMode {
  id: 'as_planned' | 'modified'
  label: string
  description: string
  icon: React.ReactNode
  activeClass: string
}

const COMPLETION_MODES: CompletionMode[] = [
  {
    id: 'as_planned',
    label: 'Completed as planned',
    description: 'Session followed the template.',
    icon: <Check size={16} />,
    activeClass: 'border-lime/50 bg-lime/10 text-lime',
  },
  {
    id: 'modified',
    label: 'Modified or adjusted',
    description: 'Changes were made during the session.',
    icon: <Edit3 size={16} />,
    activeClass: 'border-status-orange/50 bg-status-orange/10 text-status-orange',
  },
]

// ── Modification type options ─────────────────────────────────────────────────

interface ModOption {
  id: SessionModificationType
  label: string
  icon: React.ReactNode
}

const MOD_OPTIONS: ModOption[] = [
  { id: 'skipped_block', label: 'Skipped a block', icon: <SkipForward size={13} /> },
  { id: 'added_block', label: 'Added a block', icon: <PlusCircle size={13} /> },
  { id: 'shortened_block', label: 'Shortened a block', icon: <Edit3 size={13} /> },
  { id: 'reordered', label: 'Reordered blocks', icon: <Edit3 size={13} /> },
  { id: 'weather', label: 'Weather issue', icon: <Cloud size={13} /> },
  { id: 'space_issue', label: 'Court / space issue', icon: <AlertTriangle size={13} /> },
  { id: 'group_energy', label: 'Group energy / focus', icon: <AlertTriangle size={13} /> },
  { id: 'late_start', label: 'Late start', icon: <AlertTriangle size={13} /> },
  { id: 'other', label: 'Other reason', icon: <Edit3 size={13} /> },
]

// ── Main component ────────────────────────────────────────────────────────────

interface WrapUpSessionActualInputProps {
  initialValue?: Partial<SessionActualAnswer>
  onChange: (answer: SessionActualAnswer) => void
  className?: string
}

export function WrapUpSessionActualInput({ initialValue, onChange, className }: WrapUpSessionActualInputProps) {
  const [completionMode, setCompletionMode] = useState<'as_planned' | 'modified' | null>(
    initialValue?.completedAsPlanned ? 'as_planned' : initialValue?.modified ? 'modified' : null
  )
  const [selectedMods, setSelectedMods] = useState<SessionModificationType[]>(initialValue?.modifications ?? [])
  const [notes, setNotes] = useState(initialValue?.notes ?? '')

  function buildAnswer(
    mode: 'as_planned' | 'modified' | null,
    mods: SessionModificationType[],
    text: string,
  ): SessionActualAnswer {
    return {
      completedAsPlanned: mode === 'as_planned',
      modified: mode === 'modified',
      modifications: mode === 'modified' ? mods : [],
      notes: text,
      directorReviewRequired: true,
      officialWriteApplied: false,
    }
  }

  function handleModeSelect(mode: 'as_planned' | 'modified') {
    setCompletionMode(mode)
    if (mode === 'as_planned') {
      setSelectedMods([])
    }
    onChange(buildAnswer(mode, mode === 'modified' ? selectedMods : [], notes))
  }

  function toggleMod(mod: SessionModificationType) {
    const next = selectedMods.includes(mod)
      ? selectedMods.filter(m => m !== mod)
      : [...selectedMods, mod]
    setSelectedMods(next)
    onChange(buildAnswer(completionMode, next, notes))
  }

  function handleNotes(text: string) {
    setNotes(text)
    onChange(buildAnswer(completionMode, selectedMods, text))
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Completion mode */}
        <div className="grid grid-cols-2 gap-2">
          {COMPLETION_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                completionMode === mode.id ? mode.activeClass : 'border-border text-text-muted hover:border-text-muted hover:text-text-secondary'
              }`}
            >
              <span className="flex items-center gap-1.5 font-medium text-sm">
                {mode.icon}
                {mode.label}
              </span>
              <span className="text-[11px] leading-tight opacity-70">{mode.description}</span>
            </button>
          ))}
        </div>

        {/* Modification types */}
        {completionMode === 'modified' && (
          <div className="border-t border-border pt-3 space-y-2">
            <p className="label-xs">What changed? (select all that apply)</p>
            <div className="flex flex-wrap gap-2">
              {MOD_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleMod(opt.id)}
                  className={`flex items-center gap-1.5 text-xs rounded-lg border px-2.5 py-1.5 transition-colors ${
                    selectedMods.includes(opt.id)
                      ? 'border-lime/50 bg-lime/10 text-lime font-medium'
                      : 'border-border text-text-muted hover:border-text-muted hover:text-text-secondary'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {completionMode && (
          <div>
            <p className="label-xs mb-1">
              {completionMode === 'as_planned' ? 'Any additional context?' : 'What happened and why?'}
            </p>
            <textarea
              value={notes}
              onChange={e => handleNotes(e.target.value)}
              placeholder={
                completionMode === 'as_planned'
                  ? 'Session notes (optional)…'
                  : 'Describe the changes — what was skipped, added, or adjusted and why…'
              }
              rows={3}
              className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors leading-relaxed"
            />
          </div>
        )}

        {/* Safety note */}
        <p className="text-[10px] text-text-muted">
          Session actual draft only — not an official session record. Director must review before any record is updated.
        </p>
      </div>
    </div>
  )
}
