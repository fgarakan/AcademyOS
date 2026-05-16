'use client'

import { useState } from 'react'
import { Plus, Trash2, MessageSquare, Shield, UserCheck, Heart, Calendar } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type FollowUpType =
  | 'parent_update'
  | 'director_follow_up'
  | 'coach_follow_up'
  | 'player_support'
  | 'admin_note'

export interface FollowUpItem {
  id: string
  type: FollowUpType
  description: string
  playerName: string | null
  urgency: 'low' | 'medium' | 'high'
  sendApplied: false
  directorReviewRequired: true
}

export interface FollowUpAnswer {
  items: FollowUpItem[]
  sendApplied: false
  directorReviewRequired: true
}

// ── Type config ───────────────────────────────────────────────────────────────

interface FollowUpTypeConfig {
  id: FollowUpType
  label: string
  description: string
  icon: React.ReactNode
  accentClass: string
  requiresPlayerName: boolean
  placeholder: string
}

const FOLLOW_UP_TYPES: FollowUpTypeConfig[] = [
  {
    id: 'parent_update',
    label: 'Parent update',
    description: 'Something a parent should know — draft only.',
    icon: <MessageSquare size={14} />,
    accentClass: 'text-status-blue',
    requiresPlayerName: true,
    placeholder: 'What should the parent know? (draft — not sent)…',
  },
  {
    id: 'director_follow_up',
    label: 'Director follow-up',
    description: 'Needs director attention.',
    icon: <Shield size={14} />,
    accentClass: 'text-lime',
    requiresPlayerName: false,
    placeholder: 'What does the director need to know or decide?…',
  },
  {
    id: 'coach_follow_up',
    label: 'Coach follow-up',
    description: 'Something I (or another coach) needs to handle.',
    icon: <UserCheck size={14} />,
    accentClass: 'text-status-green',
    requiresPlayerName: false,
    placeholder: 'What needs to happen next from a coaching perspective?…',
  },
  {
    id: 'player_support',
    label: 'Player support',
    description: 'A player who needs extra care beyond the session.',
    icon: <Heart size={14} />,
    accentClass: 'text-status-orange',
    requiresPlayerName: true,
    placeholder: 'What support does this player need outside of sessions?…',
  },
  {
    id: 'admin_note',
    label: 'Scheduling / admin note',
    description: 'Scheduling, facilities, or admin issues.',
    icon: <Calendar size={14} />,
    accentClass: 'text-text-secondary',
    requiresPlayerName: false,
    placeholder: 'Scheduling conflict, facilities issue, or admin note…',
  },
]

// ── Single follow-up entry ────────────────────────────────────────────────────

let idCounter = 0
function makeId() { return `fu-${++idCounter}-${Date.now()}` }

function FollowUpEntry({
  item,
  config,
  onChange,
  onRemove,
}: {
  item: FollowUpItem
  config: FollowUpTypeConfig
  onChange: (updated: FollowUpItem) => void
  onRemove: () => void
}) {
  return (
    <div className="border border-border rounded-xl p-3 space-y-2.5 bg-surface-raised">
      {/* Type label */}
      <div className={`flex items-center gap-1.5 text-xs font-medium ${config.accentClass}`}>
        {config.icon}
        {config.label}
      </div>

      {/* Player name (if required) */}
      {config.requiresPlayerName && (
        <input
          type="text"
          value={item.playerName ?? ''}
          onChange={e => onChange({ ...item, playerName: e.target.value || null })}
          placeholder="Player name (if applicable)…"
          className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
        />
      )}

      {/* Description */}
      <textarea
        value={item.description}
        onChange={e => onChange({ ...item, description: e.target.value })}
        placeholder={config.placeholder}
        rows={2}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
      />

      {/* Urgency */}
      <div className="flex items-center gap-2">
        <p className="text-[11px] text-text-muted">Urgency:</p>
        {(['low', 'medium', 'high'] as const).map(level => (
          <button
            key={level}
            onClick={() => onChange({ ...item, urgency: level })}
            className={`text-[10px] px-2 py-0.5 rounded border capitalize transition-colors ${
              item.urgency === level
                ? level === 'high' ? 'border-status-red/50 bg-status-red/10 text-status-red font-medium'
                : level === 'medium' ? 'border-status-orange/50 bg-status-orange/10 text-status-orange font-medium'
                : 'border-border bg-surface-raised text-text-secondary font-medium'
                : 'border-border text-text-muted hover:border-text-muted'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* No-send guard */}
      {item.type === 'parent_update' && (
        <p className="text-[10px] text-status-orange">
          Draft only — not sent. Director must review before any parent communication.
        </p>
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

interface WrapUpFollowUpInputProps {
  initialValue?: FollowUpAnswer
  onChange: (answer: FollowUpAnswer) => void
  className?: string
}

export function WrapUpFollowUpInput({ initialValue, onChange, className }: WrapUpFollowUpInputProps) {
  const [items, setItems] = useState<FollowUpItem[]>(initialValue?.items ?? [])
  const [addingType, setAddingType] = useState<FollowUpType | null>(null)

  function buildAnswer(next: FollowUpItem[]): FollowUpAnswer {
    return {
      items: next,
      sendApplied: false,
      directorReviewRequired: true,
    }
  }

  function addItem(type: FollowUpType) {
    const newItem: FollowUpItem = {
      id: makeId(),
      type,
      description: '',
      playerName: null,
      urgency: 'medium',
      sendApplied: false,
      directorReviewRequired: true,
    }
    const next = [...items, newItem]
    setItems(next)
    onChange(buildAnswer(next))
    setAddingType(null)
  }

  function updateItem(id: string, updated: FollowUpItem) {
    const next = items.map(i => i.id === id ? updated : i)
    setItems(next)
    onChange(buildAnswer(next))
  }

  function removeItem(id: string) {
    const next = items.filter(i => i.id !== id)
    setItems(next)
    onChange(buildAnswer(next))
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-xs text-text-muted italic">No follow-up items added.</p>
        )}

        {items.map(item => {
          const cfg = FOLLOW_UP_TYPES.find(t => t.id === item.type)!
          return (
            <FollowUpEntry
              key={item.id}
              item={item}
              config={cfg}
              onChange={updated => updateItem(item.id, updated)}
              onRemove={() => removeItem(item.id)}
            />
          )
        })}

        {/* Add type picker */}
        {addingType === null ? (
          <button
            onClick={() => setAddingType('parent_update')}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary border border-border border-dashed rounded-xl px-3 py-2.5 w-full transition-colors hover:border-text-muted"
          >
            <Plus size={13} />
            Add follow-up item
          </button>
        ) : (
          <div className="border border-border rounded-xl p-3 space-y-2">
            <p className="label-xs">What type of follow-up?</p>
            <div className="grid grid-cols-1 gap-1.5">
              {FOLLOW_UP_TYPES.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => addItem(opt.id)}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border border-border hover:border-text-muted text-left transition-colors`}
                >
                  <span className={`mt-0.5 ${opt.accentClass}`}>{opt.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-text-primary">{opt.label}</p>
                    <p className="text-[10px] text-text-muted">{opt.description}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setAddingType(null)}
                className="text-xs text-text-muted hover:text-text-secondary py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-text-muted">
          No follow-up items are sent or actioned automatically. Director review required before any communication or decision.
        </p>
      </div>
    </div>
  )
}
