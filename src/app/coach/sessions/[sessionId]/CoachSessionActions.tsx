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
}

export function CoachSessionActions({ sessionId, academyId, sessionName, blocks, roster }: Props) {
  const [captureOpen, setCaptureOpen] = useState(false)
  const [wrapUpOpen, setWrapUpOpen] = useState(false)

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-text-muted">Wrap Up</p>

      {/* Primary CTA — Wrap Up Session */}
      <button
        onClick={() => setWrapUpOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-lime text-black font-bold text-sm hover:bg-lime/90 transition-colors"
      >
        <ClipboardList className="w-4 h-4" />
        Wrap Up Session
      </button>

      {/* Secondary — Quick Note */}
      <button
        onClick={() => setCaptureOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium text-text-secondary border border-border hover:border-lime/30 hover:text-text-primary transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Quick Note
      </button>

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
