'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import { createClassTemplateAction } from '../createClassTemplateAction'

const TEMPLATE_TYPES = [
  'Weekly Class',
  'Private Lesson',
  'Camp',
  'Match Play',
  'Tournament Prep',
  'Assessment Day',
  'Custom',
]

const BALL_LEVELS = [
  'Red Ball',
  'Orange Ball',
  'Green Ball',
  'Yellow Ball',
  'High Performance',
  'Mixed Level',
]

const GROUP_TYPES = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Competitive',
  'Performance',
  'Adult',
  'Custom',
]

export function NewClassTemplateForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [templateType, setTemplateType] = useState('')
  const [ballLevel, setBallLevel] = useState('')
  const [groupType, setGroupType] = useState('')
  const [totalDurationMin, setTotalDurationMin] = useState('')

  function buildTrack(): string | undefined {
    const parts = [templateType, ballLevel, groupType].filter(Boolean)
    return parts.length > 0 ? parts.join(' · ') : undefined
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Template name is required.'); return }
    setError(null)

    startTransition(async () => {
      const result = await createClassTemplateAction({
        name: name.trim(),
        description: description.trim() || undefined,
        track: buildTrack(),
        totalDurationMin: totalDurationMin ? parseInt(totalDurationMin, 10) : undefined,
      })

      if (!result.ok || !result.templateId) {
        setError(result.error ?? 'Failed to create template.')
        return
      }

      router.push(`/director/class-templates/${result.templateId}`)
    })
  }

  const trackPreview = buildTrack()

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Helper copy */}
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Choose who this class is for. Academy OS will use this to guide blocks, curriculum links, and coach-ready session plans.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="label-xs">Template Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Junior Intermediate Group Session"
          maxLength={100}
          disabled={isPending}
          className="input-base w-full"
        />
      </div>

      {/* Guided dropdowns — combined into track field */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="label-xs">Template Type</label>
          <select
            value={templateType}
            onChange={e => setTemplateType(e.target.value)}
            disabled={isPending}
            className="input-base w-full"
          >
            <option value="">Select type…</option>
            {TEMPLATE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="label-xs">Ball / Level Focus</label>
          <select
            value={ballLevel}
            onChange={e => setBallLevel(e.target.value)}
            disabled={isPending}
            className="input-base w-full"
          >
            <option value="">Select level…</option>
            {BALL_LEVELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="label-xs">Group Type</label>
          <select
            value={groupType}
            onChange={e => setGroupType(e.target.value)}
            disabled={isPending}
            className="input-base w-full"
          >
            <option value="">Select group…</option>
            {GROUP_TYPES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {trackPreview && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-lime/20 bg-lime/5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Track</p>
          <p className="text-xs font-medium text-lime ml-1">{trackPreview}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="label-xs">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Briefly describe this template's purpose…"
          rows={2}
          maxLength={300}
          disabled={isPending}
          className="input-base w-full resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="label-xs">Total Duration (minutes)</label>
        <input
          type="number"
          min="0"
          value={totalDurationMin}
          onChange={e => setTotalDurationMin(e.target.value)}
          placeholder="e.g. 60"
          disabled={isPending}
          className="input-base w-32"
        />
      </div>

      {error && (
        <p className="text-xs text-status-red">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="btn-lime text-xs px-4 py-2 disabled:opacity-50"
        >
          <span className="flex items-center gap-1.5">
            {isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Check className="w-3.5 h-3.5" />
            }
            Create Template
          </span>
        </button>
        <a
          href="/director/class-templates"
          className="btn-ghost text-xs px-4 py-2"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
