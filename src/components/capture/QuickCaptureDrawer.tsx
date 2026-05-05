'use client'

import { usePathname } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Modal } from '@/components/ui'
import { addObservationAction } from '@/lib/actions/notes'
import { saveGeneralCaptureAction } from '@/lib/actions/capture'

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

type DestType = 'player_observation' | 'general'

interface DetectedContext {
  autoType: DestType
  playerId: string | null
  autoLabel: string
  routeHint: string
}

function detectRouteContext(pathname: string): DetectedContext {
  const playerMatch = pathname.match(/^\/director\/players\/([^/?#]+)/)
  if (playerMatch && playerMatch[1] && UUID_RE.test(playerMatch[1])) {
    return {
      autoType:  'player_observation',
      playerId:  playerMatch[1],
      autoLabel: 'Player Observation',
      routeHint: 'Player profile detected',
    }
  }
  if (pathname.startsWith('/director/players')) {
    return {
      autoType:  'general',
      playerId:  null,
      autoLabel: 'General Player Directory Note',
      routeHint: 'Player directory — open a player profile to save a player observation.',
    }
  }
  if (pathname === '/director' || pathname === '/director/') {
    return {
      autoType:  'general',
      playerId:  null,
      autoLabel: 'Director Capture',
      routeHint: 'Director dashboard',
    }
  }
  return {
    autoType:  'general',
    playerId:  null,
    autoLabel: 'General Capture',
    routeHint: 'Unrouted — will appear in review inbox.',
  }
}

interface Props {
  open: boolean
  onClose: () => void
  academyId: string
}

export function QuickCaptureDrawer({ open, onClose, academyId }: Props) {
  const pathname = usePathname()
  const detected = detectRouteContext(pathname)

  // Allow user to override destination away from auto-detected (e.g., save general instead of player obs)
  const [destOverride, setDestOverride] = useState<DestType | null>(null)
  const activeType: DestType = destOverride ?? detected.autoType

  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function resetForm() {
    setError(null)
    setSuccess(false)
    setDestOverride(null)
    formRef.current?.reset()
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)

    const canSaveObservation =
      activeType === 'player_observation' && detected.playerId

    if (canSaveObservation) {
      startTransition(async () => {
        try {
          await addObservationAction(detected.playerId!, academyId, formData)
          setSuccess(true)
          setTimeout(handleClose, 1200)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to save observation')
        }
      })
    } else {
      // General capture — persist to voice_notes for review inbox
      const content = (formData.get('content') as string | null)?.trim() ?? ''
      startTransition(async () => {
        try {
          await saveGeneralCaptureAction(academyId, content)
          setSuccess(true)
          setTimeout(handleClose, 1200)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to save capture')
        }
      })
    }
  }

  const activeLabel =
    activeType === 'player_observation' ? 'Player Observation' : detected.autoLabel

  const modalTitle =
    activeType === 'player_observation'
      ? 'Quick Capture — Player Observation'
      : 'Quick Capture'

  return (
    <Modal open={open} onClose={handleClose} title={modalTitle} size="md">
      <div className="space-y-4">

        {/* Context indicator */}
        <div className="rounded-lg bg-surface-raised border border-border px-3 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className={`label-xs ${activeType === 'player_observation' ? 'text-lime' : 'text-text-muted'}`}>
              {activeLabel}
            </span>
            <span className="text-[10px] text-text-muted">{detected.routeHint}</span>
          </div>

          {/* Destination override — only available when player context was auto-detected */}
          {detected.autoType === 'player_observation' && (
            <div className="flex items-center gap-2">
              {destOverride === 'general' ? (
                <>
                  <span className="text-[11px] text-status-orange">Switched to General Draft</span>
                  <button
                    type="button"
                    onClick={() => setDestOverride(null)}
                    className="text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary transition-colors"
                  >
                    Restore Player Observation
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setDestOverride('general')}
                  className="text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary transition-colors"
                >
                  Change to General Draft instead
                </button>
              )}
            </div>
          )}
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

          {activeType === 'player_observation' && (
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
              {activeType === 'player_observation' ? 'Observation' : 'Note or transcript'}
            </label>
            <textarea
              name="content"
              required
              rows={6}
              autoFocus
              placeholder={
                activeType === 'player_observation'
                  ? 'Describe what you observed, or paste a voice transcript…'
                  : 'Type a note or paste a transcript. Routing will be available in the review inbox.'
              }
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
            />
          </div>

          {activeType === 'player_observation' && (
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

          {activeType === 'general' && (
            <p className="text-[11px] text-text-muted">
              Saved to your review inbox at Director → Draft Review Queue. Route to a player from there.
            </p>
          )}

          {error && <p className="text-xs text-status-red">{error}</p>}
          {success && (
            <p className="text-xs text-status-green">
              {activeType === 'player_observation'
                ? 'Observation saved.'
                : 'Saved to review inbox.'}
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
              {isPending
                ? 'Saving…'
                : activeType === 'player_observation'
                ? 'Save Observation'
                : 'Capture'}
            </button>
          </div>

        </form>
      </div>
    </Modal>
  )
}
