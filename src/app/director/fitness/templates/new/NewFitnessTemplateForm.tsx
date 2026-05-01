'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import { createFitnessTemplateAction } from '../../fitnessTemplateActions'
import type { FitnessTemplateType } from '../../fitnessTemplateActions'

const TEMPLATE_TYPES: { value: FitnessTemplateType; label: string }[] = [
  { value: 'standard',        label: 'Standard' },
  { value: 'pre_tournament',  label: 'Pre-Tournament' },
  { value: 'post_tournament', label: 'Post-Tournament' },
  { value: 'high_intensity',  label: 'High-Intensity' },
  { value: 'low_load',        label: 'Low-Load' },
  { value: 'assessment',      label: 'Assessment' },
  { value: 'recovery',        label: 'Recovery' },
]

export function NewFitnessTemplateForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [templateType, setTemplateType] = useState<FitnessTemplateType>('standard')
  const [description, setDescription] = useState('')
  const [totalDurationMin, setTotalDurationMin] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Template name is required.'); return }
    setError(null)

    startTransition(async () => {
      const result = await createFitnessTemplateAction({
        name: name.trim(),
        templateType,
        description: description.trim() || undefined,
        totalDurationMin: totalDurationMin ? parseInt(totalDurationMin, 10) : undefined,
      })

      if (!result.ok || !result.templateId) {
        setError(result.error ?? 'Failed to create template.')
        return
      }

      router.push(`/director/fitness/templates/${result.templateId}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="label-xs">Template Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Pre-Season Fitness Protocol"
          maxLength={100}
          disabled={isPending}
          className="input-base w-full"
        />
      </div>

      <div className="space-y-1.5">
        <label className="label-xs">Template Type</label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={isPending}
              onClick={() => setTemplateType(value)}
              className={[
                'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                templateType === value
                  ? 'bg-lime/10 border-lime/30 text-lime'
                  : 'bg-surface-raised border-border text-text-muted hover:text-text-secondary hover:border-lime/20',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

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
          href="/director/fitness/templates"
          className="btn-ghost text-xs px-4 py-2"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
