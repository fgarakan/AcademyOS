'use client'

import { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ObservationSkillTag =
  | 'technical'
  | 'tactical'
  | 'footwork'
  | 'serve_return'
  | 'rally_tolerance'
  | 'net_play'
  | 'competition'
  | 'fitness'
  | 'mental'
  | 'effort'
  | 'focus'
  | 'attitude'
  | 'other'

export type ObservationVisibility = 'staff_only' | 'director_review' | 'parent_safe_candidate'

export interface PlayerObservationDraft {
  id: string
  playerName: string
  observation: string
  skillTag: ObservationSkillTag | null
  nextStep: string
  visibility: ObservationVisibility
  isParentSafeCandidate: boolean
  observationType: 'positive' | 'concern' | 'neutral'
  directorReviewRequired: true
  profileMutationApplied: false
}

// ── Skill tags ────────────────────────────────────────────────────────────────

const SKILL_TAG_OPTIONS: { id: ObservationSkillTag; label: string }[] = [
  { id: 'technical', label: 'Technical' },
  { id: 'tactical', label: 'Tactical' },
  { id: 'footwork', label: 'Footwork' },
  { id: 'serve_return', label: 'Serve / Return' },
  { id: 'rally_tolerance', label: 'Rally Tolerance' },
  { id: 'net_play', label: 'Net Play' },
  { id: 'competition', label: 'Competition' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'mental', label: 'Mental' },
  { id: 'effort', label: 'Effort' },
  { id: 'focus', label: 'Focus' },
  { id: 'attitude', label: 'Attitude' },
  { id: 'other', label: 'Other' },
]

// ── Single observation entry ──────────────────────────────────────────────────

let idCounter = 0
function makeId() { return `obs-${++idCounter}-${Date.now()}` }

function ObservationEntry({
  entry,
  observationType,
  onChange,
  onRemove,
}: {
  entry: PlayerObservationDraft
  observationType: 'positive' | 'concern'
  onChange: (updated: PlayerObservationDraft) => void
  onRemove: () => void
}) {
  const [showExtra, setShowExtra] = useState(false)

  function update(patch: Partial<PlayerObservationDraft>) {
    onChange({ ...entry, ...patch })
  }

  return (
    <div className="border border-border rounded-xl p-3 space-y-3 bg-surface-raised">
      {/* Player name */}
      <div>
        <p className="label-xs mb-1">Player name</p>
        <input
          type="text"
          value={entry.playerName}
          onChange={e => update({ playerName: e.target.value })}
          placeholder="Player name…"
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
        />
      </div>

      {/* Observation */}
      <div>
        <p className="label-xs mb-1">Observation</p>
        <textarea
          value={entry.observation}
          onChange={e => update({ observation: e.target.value })}
          placeholder={
            observationType === 'positive'
              ? 'What stood out? What did they do well?'
              : 'What needs attention? What should change?'
          }
          rows={2}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
        />
      </div>

      {/* Skill tag */}
      <div>
        <p className="label-xs mb-1">Skill / Priority area</p>
        <div className="flex flex-wrap gap-1.5">
          {SKILL_TAG_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => update({ skillTag: entry.skillTag === opt.id ? null : opt.id })}
              className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                entry.skillTag === opt.id
                  ? 'border-lime/50 bg-lime/10 text-lime font-medium'
                  : 'border-border text-text-muted hover:border-text-muted hover:text-text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable extra fields */}
      <button
        onClick={() => setShowExtra(v => !v)}
        className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
      >
        {showExtra ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {showExtra ? 'Fewer fields' : 'Add next step + visibility'}
      </button>

      {showExtra && (
        <div className="space-y-3 pt-1 border-t border-border">
          {/* Next step */}
          <div>
            <p className="label-xs mb-1">Next step (optional)</p>
            <input
              type="text"
              value={entry.nextStep}
              onChange={e => update({ nextStep: e.target.value })}
              placeholder="What should happen next for this player?…"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
            />
          </div>

          {/* Visibility */}
          <div>
            <p className="label-xs mb-1">Visibility</p>
            <div className="flex gap-2">
              {[
                { id: 'staff_only' as ObservationVisibility, label: 'Staff only', icon: <EyeOff size={11} /> },
                { id: 'director_review' as ObservationVisibility, label: 'Director review', icon: <Eye size={11} /> },
                { id: 'parent_safe_candidate' as ObservationVisibility, label: 'Parent-safe candidate', icon: <Eye size={11} /> },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => update({
                    visibility: v.id,
                    isParentSafeCandidate: v.id === 'parent_safe_candidate',
                  })}
                  className={`flex items-center gap-1 text-[11px] px-2 py-1.5 rounded border transition-colors ${
                    entry.visibility === v.id
                      ? 'border-lime/50 bg-lime/10 text-lime font-medium'
                      : 'border-border text-text-muted hover:border-text-muted'
                  }`}
                >
                  {v.icon}
                  {v.label}
                </button>
              ))}
            </div>
            {entry.visibility === 'parent_safe_candidate' && (
              <p className="text-[10px] text-status-orange mt-1">
                Marked as parent-safe candidate — director must review before any parent communication.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Remove */}
      <div className="flex justify-end">
        <button
          onClick={onRemove}
          className="flex items-center gap-1 text-[11px] text-text-muted hover:text-status-red transition-colors"
        >
          <Trash2 size={11} />
          Remove
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface WrapUpPlayerObservationInputProps {
  observationType: 'positive' | 'concern'
  initialEntries?: PlayerObservationDraft[]
  onChange: (entries: PlayerObservationDraft[]) => void
  className?: string
}

export function WrapUpPlayerObservationInput({
  observationType,
  initialEntries = [],
  onChange,
  className,
}: WrapUpPlayerObservationInputProps) {
  const [entries, setEntries] = useState<PlayerObservationDraft[]>(initialEntries)

  function addEntry() {
    const newEntry: PlayerObservationDraft = {
      id: makeId(),
      playerName: '',
      observation: '',
      skillTag: null,
      nextStep: '',
      visibility: 'staff_only',
      isParentSafeCandidate: false,
      observationType,
      directorReviewRequired: true,
      profileMutationApplied: false,
    }
    const next = [...entries, newEntry]
    setEntries(next)
    onChange(next)
  }

  function updateEntry(id: string, updated: PlayerObservationDraft) {
    const next = entries.map(e => e.id === id ? updated : e)
    setEntries(next)
    onChange(next)
  }

  function removeEntry(id: string) {
    const next = entries.filter(e => e.id !== id)
    setEntries(next)
    onChange(next)
  }

  const label = observationType === 'positive' ? 'standout' : 'concern'

  return (
    <div className={className}>
      <div className="space-y-3">
        {entries.length === 0 && (
          <p className="text-xs text-text-muted italic">No {label}s added yet.</p>
        )}

        {entries.map(entry => (
          <ObservationEntry
            key={entry.id}
            entry={entry}
            observationType={observationType}
            onChange={updated => updateEntry(entry.id, updated)}
            onRemove={() => removeEntry(entry.id)}
          />
        ))}

        <button
          onClick={addEntry}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary border border-border border-dashed rounded-xl px-3 py-2.5 w-full transition-colors hover:border-text-muted"
        >
          <Plus size={13} />
          Add {label}
        </button>

        <p className="text-[10px] text-text-muted">
          Observations are private drafts (staff only) unless you mark them as parent-safe candidates. Director review required before any publication.
        </p>
      </div>
    </div>
  )
}
