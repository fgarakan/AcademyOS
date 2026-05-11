'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { QuickCaptureDrawer } from './QuickCaptureDrawer'

// Routes where directors are in a focused guided builder flow.
// Quick Capture is hidden on these routes so it never covers stepper
// navigation buttons (Back, Next, Review + Save, Generate Session).
const FOCUSED_BUILDER_PATTERNS = [
  /^\/director\/fitness\/templates\/[^/]+/,
  /^\/director\/class-templates\/new/,
  /^\/director\/class-templates\/[^/]+/,
]

function isFocusedBuilderRoute(pathname: string): boolean {
  return FOCUSED_BUILDER_PATTERNS.some(re => re.test(pathname))
}

interface Props {
  academyId: string
}

export function QuickCaptureButton({ academyId }: Props) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Hide on builder/stepper routes — stepper primary actions take priority.
  if (isFocusedBuilderRoute(pathname)) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Quick Capture"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-lime text-black font-semibold text-sm shadow-lg hover:bg-lime/90 active:scale-95 transition-all select-none"
      >
        <Plus className="w-4 h-4 shrink-0" />
        Quick Capture
      </button>

      <QuickCaptureDrawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        academyId={academyId}
      />
    </>
  )
}
