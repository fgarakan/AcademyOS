'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import { createClassTemplateAction } from '../createClassTemplateAction'

export function NewClassTemplateForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [track, setTrack] = useState('')
  const [totalDurationMin, setTotalDurationMin] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Template name is required.'); return }
    setError(null)

    startTransition(async () => {
      const result = await createClassTemplateAction({
        name: name.trim(),
        description: description.trim() || undefined,
        track: track.trim() || undefined,
        totalDurationMin: totalDurationMin ? parseInt(totalDurationMin, 10) : undefined,
      })

      if (!result.ok || !result.templateId) {
        setError(result.error ?? 'Failed to create template.')
        return
      }

      router.push(`/director/class-templates/${result.templateId}`)
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
          placeholder="e.g. Junior Intermediate Group Session"
          maxLength={100}
          disabled={isPending}
          className="input-base w-full"
        />
      </div>

      <div className="space-y-1.5">
        <label className="label-xs">Track / Category</label>
        <input
          type="text"
          value={track}
          onChange={e => setTrack(e.target.value)}
          placeholder="e.g. juniors, competitive, group"
          maxLength={80}
          disabled={isPending}
          className="input-base w-full"
        />
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
          href="/director/class-templates"
          className="btn-ghost text-xs px-4 py-2"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
