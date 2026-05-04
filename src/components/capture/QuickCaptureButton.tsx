'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { QuickCaptureDrawer } from './QuickCaptureDrawer'

interface Props {
  academyId: string
}

export function QuickCaptureButton({ academyId }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Quick Capture"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-lime text-black font-semibold text-sm shadow-lg hover:bg-lime/90 active:scale-95 transition-all select-none"
      >
        <Plus className="w-4 h-4 shrink-0" />
        Capture
      </button>

      <QuickCaptureDrawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        academyId={academyId}
      />
    </>
  )
}
