'use client'

import { useState } from 'react'
import { Plus, ClipboardList } from 'lucide-react'
import { QuickCaptureDrawer } from '@/components/capture/QuickCaptureDrawer'
import { CoachWrapUpDrawer } from './CoachWrapUpDrawer'

interface Props {
  sessionId: string
  academyId: string
  sessionName: string
}

export function CoachSessionActions({ sessionId, academyId, sessionName }: Props) {
  const [captureOpen, setCaptureOpen] = useState(false)
  const [wrapUpOpen, setWrapUpOpen] = useState(false)

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-text-muted">Session Actions</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Quick Note — opens inline capture drawer */}
        <button
          onClick={() => setCaptureOpen(true)}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface border border-border hover:border-lime/30 transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center group-hover:bg-lime/20 transition-colors">
            <Plus className="w-4 h-4 text-lime" />
          </div>
          <span className="text-xs font-medium text-text-secondary text-center leading-tight group-hover:text-text-primary transition-colors">
            Quick Note
          </span>
          <span className="text-[10px] text-text-muted">Capture a thought</span>
        </button>

        {/* Wrap Up Session */}
        <button
          onClick={() => setWrapUpOpen(true)}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface border border-border hover:border-lime/30 transition-colors group"
        >
          <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center group-hover:bg-lime/20 transition-colors">
            <ClipboardList className="w-4 h-4 text-lime" />
          </div>
          <span className="text-xs font-medium text-text-secondary text-center leading-tight group-hover:text-text-primary transition-colors">
            Wrap Up Session
          </span>
          <span className="text-[10px] text-text-muted">Guided recap</span>
        </button>
      </div>

      <QuickCaptureDrawer
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        academyId={academyId}
      />

      {wrapUpOpen && (
        <CoachWrapUpDrawer
          sessionId={sessionId}
          sessionName={sessionName}
          onClose={() => setWrapUpOpen(false)}
        />
      )}
    </div>
  )
}
