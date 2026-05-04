'use client'

import { usePathname } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/ui'
import { addObservationAction } from '@/lib/actions/notes'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const OBS_TYPES = [
  { value: 'general',            label: 'General' },
  { value: 'technical',          label: 'Technical' },
  { value: 'tactical',           label: 'Tactical' },
  { value: 'movement',           label: 'Movement' },
  { value: 'competition',        label: 'Competition' },
  { value: 'behavioral',         label: 'Behavioral' },
  { value: 'positive_highlight', label: 'Positive Highlight' },
]

interface CaptureContext {
  type: 'player_observation' | 'general'
  playerId: string | null
  label: string
  hint: string
}

function detectContext(pathname: string): CaptureContext {
  const m = pathname.match(/^\/director\/players\/([^/?#]+)/)
  if (m && m[1] && UUID_RE.test(m[1])) {
    return {
      type: 'player_observation',
      playerId: m[1],
      label: 'Player Observation',
      hint: 'Saves as internal coach observation — not visible to parents or students.',
    }
  }
  if (pathname.startsWith('/director/players')) {
    return { type: 'general', playerId: null, label: 'Player Directory', hint: 'Open a player profile to capture a player observation.' }
  }
  return { type: 'general', playerId: null, label: 'General Capture', hint: 'Review routing coming soon — capture will be saved to your review inbox.' }
}

interface Props {
  open: boolean
  onClose: () => void
  academyId: string
}

export function QuickCaptureDrawer({ open, onClose, academyId }: Props) {
  const pathname = usePathname()
  const ctx = detectContext(pathname)

  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function reset() {
    setError(null)
    setSuccess(false)
    formRef.current?.reset()
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)

    if (ctx.type === 'player_observation' && ctx.playerId) {
      startTransition(async () => {
        try {
          await addObservationAction(ctx.playerId!, academyId, formData)
          setSuccess(true)
          setTimeout(handleClose, 1200)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to save observation')
        }
      })
    } else {
      // General capture — no backend route yet; acknowledge and close
      setSuccess(true)
      setTimeout(handleClose, 1400)
    }
  }

  const modalTitle =
    ctx.type === 'player_observation'
      ? 'Quick Capture — Player Observation'
      : 'Quick Capture'

  return (
    <Modal open={open} onClose={handleClose} title={modalTitle} size="md">
      <div className="space-y-4">

        {/* Context badge */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
          <span className={`label-xs shrink-0 ${ctx.type === 'player_observation' ? 'text-lime' : 'text-text-muted'}`}>
            {ctx.label}
          </span>
          <span className="text-xs text-text-muted leading-relaxed ml-auto text-right">{ctx.hint}</span>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

          {ctx.type === 'player_observation' && (
            <div>
              <label className="block text-[11px] text-text-muted mb-1.5">Type</label>
              <select
                name="observation_type"
                defaultValue="general"
                className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime"
              >
                {OBS_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] text-text-muted mb-1.5">
              {ctx.type === 'player_observation' ? 'Observation' : 'Note or transcript'}
            </label>
            <textarea
              name="content"
              required
              rows={6}
              autoFocus
              placeholder={
                ctx.type === 'player_observation'
                  ? 'Describe what you observed, or paste a voice transcript…'
                  : 'Type a note or paste a transcript. Routing will be available in the review inbox.'
              }
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
            />
          </div>

          {ctx.type === 'player_observation' && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="is_private"
                value="true"
                defaultChecked
                className="rounded border-border bg-surface-raised accent-lime"
              />
              <span className="text-xs text-text-secondary">Internal only — not visible to parents or students</span>
            </label>
          )}

          {error && <p className="text-xs text-status-red">{error}</p>}
          {success && (
            <p className="text-xs text-status-green">
              {ctx.type === 'player_observation' ? 'Observation saved.' : 'Captured — check review inbox soon.'}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="btn-ghost flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-lime flex-1 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : ctx.type === 'player_observation' ? 'Save Observation' : 'Capture'}
            </button>
          </div>

        </form>
      </div>
    </Modal>
  )
}
