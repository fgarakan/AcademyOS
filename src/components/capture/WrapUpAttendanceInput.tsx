'use client'

import { useState } from 'react'
import { Check, UserX, UserPlus, HelpCircle, X, Plus } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttendanceMode = 'everyone' | 'absences' | 'unrostered' | 'unsure' | null

export interface AbsenceEntry {
  name: string
  confirmed: boolean
}

export interface UnrosteredEntry {
  name: string
}

export interface AttendanceAnswer {
  mode: AttendanceMode
  everyonePresent: boolean
  absences: AbsenceEntry[]
  unrostered: UnrosteredEntry[]
  unsure: boolean
  freeText: string
}

// ── Quick-select option ───────────────────────────────────────────────────────

interface QuickOption {
  id: AttendanceMode
  label: string
  description: string
  icon: React.ReactNode
  activeClass: string
}

const OPTIONS: QuickOption[] = [
  {
    id: 'everyone',
    label: 'Everyone was here',
    description: 'Full roster, no issues.',
    icon: <Check size={16} />,
    activeClass: 'border-lime/50 bg-lime/10 text-lime',
  },
  {
    id: 'absences',
    label: 'Someone was absent',
    description: 'One or more players missed today.',
    icon: <UserX size={16} />,
    activeClass: 'border-status-orange/50 bg-status-orange/10 text-status-orange',
  },
  {
    id: 'unrostered',
    label: 'Unexpected player showed up',
    description: 'Someone not on the roster attended.',
    icon: <UserPlus size={16} />,
    activeClass: 'border-status-blue/50 bg-status-blue/10 text-status-blue',
  },
  {
    id: 'unsure',
    label: "I'm not sure",
    description: "I'll note what I remember.",
    icon: <HelpCircle size={16} />,
    activeClass: 'border-border bg-surface-raised text-text-secondary',
  },
]

// ── Name list input ───────────────────────────────────────────────────────────

function NameListInput({
  label,
  placeholder,
  items,
  onAdd,
  onRemove,
}: {
  label: string
  placeholder: string
  items: string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
}) {
  const [input, setInput] = useState('')

  function handleAdd() {
    const name = input.trim()
    if (name && !items.includes(name)) {
      onAdd(name)
      setInput('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-2">
      <p className="label-xs">{label}</p>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map(name => (
            <span
              key={name}
              className="inline-flex items-center gap-1 text-xs bg-surface border border-border rounded-lg px-2.5 py-1 text-text-primary"
            >
              {name}
              <button
                onClick={() => onRemove(name)}
                className="text-text-muted hover:text-status-red transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex items-center gap-1 text-xs px-3 py-2 border border-border rounded-lg text-text-muted hover:text-text-secondary hover:border-text-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface WrapUpAttendanceInputProps {
  initialValue?: Partial<AttendanceAnswer>
  onChange: (answer: AttendanceAnswer) => void
  className?: string
}

export function WrapUpAttendanceInput({ initialValue, onChange, className }: WrapUpAttendanceInputProps) {
  const [mode, setMode] = useState<AttendanceMode>(initialValue?.mode ?? null)
  const [absences, setAbsences] = useState<string[]>(initialValue?.absences?.map(a => a.name) ?? [])
  const [unrostered, setUnrostered] = useState<string[]>(initialValue?.unrostered?.map(u => u.name) ?? [])
  const [freeText, setFreeText] = useState(initialValue?.freeText ?? '')
  // For 'absences' + 'unrostered' together
  const [alsoBothModes, setAlsoBothModes] = useState(false)

  function buildAnswer(
    m: AttendanceMode,
    abs: string[],
    unr: string[],
    text: string,
    both: boolean,
  ): AttendanceAnswer {
    return {
      mode: m,
      everyonePresent: m === 'everyone',
      absences: abs.map(name => ({ name, confirmed: true })),
      unrostered: (both ? unr : m === 'unrostered' ? unr : []).map(name => ({ name })),
      unsure: m === 'unsure',
      freeText: text,
    }
  }

  function handleModeSelect(m: AttendanceMode) {
    setMode(m)
    setAlsoBothModes(false)
    onChange(buildAnswer(m, absences, unrostered, freeText, false))
  }

  function addAbsence(name: string) {
    const next = [...absences, name]
    setAbsences(next)
    onChange(buildAnswer(mode, next, unrostered, freeText, alsoBothModes))
  }

  function removeAbsence(name: string) {
    const next = absences.filter(n => n !== name)
    setAbsences(next)
    onChange(buildAnswer(mode, next, unrostered, freeText, alsoBothModes))
  }

  function addUnrostered(name: string) {
    const next = [...unrostered, name]
    setUnrostered(next)
    onChange(buildAnswer(mode, absences, next, freeText, alsoBothModes))
  }

  function removeUnrostered(name: string) {
    const next = unrostered.filter(n => n !== name)
    setUnrostered(next)
    onChange(buildAnswer(mode, absences, next, freeText, alsoBothModes))
  }

  function handleFreeText(text: string) {
    setFreeText(text)
    onChange(buildAnswer(mode, absences, unrostered, text, alsoBothModes))
  }

  function toggleBothModes() {
    const next = !alsoBothModes
    setAlsoBothModes(next)
    onChange(buildAnswer(mode, absences, unrostered, freeText, next))
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Quick select */}
        <div className="grid grid-cols-2 gap-2">
          {OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleModeSelect(opt.id)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                mode === opt.id ? opt.activeClass : 'border-border text-text-muted hover:border-text-muted hover:text-text-secondary'
              }`}
            >
              <span className="flex items-center gap-1.5 font-medium text-sm">
                {opt.icon}
                {opt.label}
              </span>
              <span className="text-[11px] leading-tight opacity-70">{opt.description}</span>
            </button>
          ))}
        </div>

        {/* Absence details */}
        {mode === 'absences' && (
          <div className="space-y-3 border-t border-border pt-3">
            <NameListInput
              label="Who was absent?"
              placeholder="Player name…"
              items={absences}
              onAdd={addAbsence}
              onRemove={removeAbsence}
            />

            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={alsoBothModes}
                onChange={toggleBothModes}
                className="rounded border-border"
              />
              Also an unexpected player showed up
            </label>

            {alsoBothModes && (
              <NameListInput
                label="Who showed up unexpectedly?"
                placeholder="Player name…"
                items={unrostered}
                onAdd={addUnrostered}
                onRemove={removeUnrostered}
              />
            )}
          </div>
        )}

        {/* Unrostered details */}
        {mode === 'unrostered' && (
          <div className="space-y-3 border-t border-border pt-3">
            <NameListInput
              label="Who showed up unexpectedly?"
              placeholder="Player name…"
              items={unrostered}
              onAdd={addUnrostered}
              onRemove={removeUnrostered}
            />

            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={alsoBothModes}
                onChange={toggleBothModes}
                className="rounded border-border"
              />
              Also someone was absent
            </label>

            {alsoBothModes && (
              <NameListInput
                label="Who was absent?"
                placeholder="Player name…"
                items={absences}
                onAdd={addAbsence}
                onRemove={removeAbsence}
              />
            )}
          </div>
        )}

        {/* Free text for all modes */}
        {mode && mode !== 'everyone' && (
          <div>
            <p className="label-xs mb-1">Any additional context?</p>
            <textarea
              value={freeText}
              onChange={e => handleFreeText(e.target.value)}
              placeholder="Add any notes about attendance…"
              rows={2}
              className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
            />
          </div>
        )}

        {/* Safety note */}
        <p className="text-[10px] text-text-muted">
          Attendance draft only — not official attendance. Director must review before any record is updated.
        </p>
      </div>
    </div>
  )
}
