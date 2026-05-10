'use client'

import { useState } from 'react'
import { Plus, ClipboardList } from 'lucide-react'
import { QuickCaptureDrawer } from '@/components/capture/QuickCaptureDrawer'
import { CoachWrapUpDrawer } from './CoachWrapUpDrawer'
import type { SessionBlock, RosterPlayer } from './page'

interface Props {
  sessionId: string
  academyId: string
  sessionName: string
  blocks: SessionBlock[]
  roster: RosterPlayer[]
  wrapUpStatus?: string | null
}

interface WrapUpCTA {
  label: string
  helper: string
  helperColor: string
  disabled: boolean
}

function resolveWrapUpCTA(status: string | null | undefined): WrapUpCTA {
  switch (status) {
    case 'pending_review':
      return {
        label: 'Wrap-up submitted',
        helper: 'Director is reviewing your notes.',
        helperColor: 'text-text-muted',
        disabled: true,
      }
    case 'approved':
      return {
        label: 'Wrap-up approved',
        helper: 'Director can apply it to the session record.',
        helperColor: 'text-text-muted',
        disabled: true,
      }
    case 'executed':
      return {
        label: 'Wrap-up applied',
        helper: 'Your notes are part of the official session record.',
        helperColor: 'text-text-muted',
        disabled: true,
      }
    case 'clarification_needed':
      return {
        label: 'Update Wrap-Up',
        helper: 'Director requested clarification.',
        helperColor: 'text-status-orange',
        disabled: false,
      }
    case 'rejected':
      return {
        label: 'Submit New Wrap-Up',
        helper: 'Your previous wrap-up was not approved.',
        helperColor: 'text-text-muted',
        disabled: false,
      }
    default:
      return { label: 'Wrap Up Session', helper: '', helperColor: '', disabled: false }
  }
}

export function CoachSessionActions({ sessionId, academyId, sessionName, blocks, roster, wrapUpStatus }: Props) {
  const [captureOpen, setCaptureOpen] = useState(false)
  const [wrapUpOpen, setWrapUpOpen] = useState(false)
  const cta = resolveWrapUpCTA(wrapUpStatus)

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-text-muted">Wrap Up</p>

      {/* Primary CTA — guarded by existing wrap-up status */}
      <button
        onClick={cta.disabled ? undefined : () => setWrapUpOpen(true)}
        disabled={cta.disabled}
        className={[
          'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-colors',
          cta.disabled
            ? 'bg-surface-raised border border-border text-text-muted cursor-not-allowed'
            : 'bg-lime text-black hover:bg-lime/90',
        ].join(' ')}
      >
        <ClipboardList className="w-4 h-4" />
        {cta.label}
      </button>
      {cta.helper && (
        <p className={`text-[10px] text-center leading-snug ${cta.helperColor}`}>{cta.helper}</p>
      )}

      {/* Secondary — Quick Note (informal capture, not a session recap) */}
      <button
        onClick={() => setCaptureOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium text-text-secondary border border-border hover:border-lime/30 hover:text-text-primary transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Quick Note
      </button>
      {!cta.disabled && (
        <p className="text-[10px] text-text-muted text-center leading-snug">
          Quick Note is an informal internal capture — not a session recap.
          Use <span className="text-text-secondary">Wrap Up Session</span> to submit your end-of-session review.
        </p>
      )}

      <QuickCaptureDrawer
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        academyId={academyId}
      />

      {wrapUpOpen && (
        <CoachWrapUpDrawer
          sessionId={sessionId}
          sessionName={sessionName}
          blocks={blocks}
          roster={roster}
          onClose={() => setWrapUpOpen(false)}
        />
      )}
    </div>
  )
}
