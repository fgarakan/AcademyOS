'use client'

// Sprint 817 — DONNA Navigate + Highlight Runtime V1
// Sprint 871 — DONNA Same-Page Highlight via Custom Event
// Reads sessionStorage for an active DonnaFocusTarget on every pathname change
// AND on 'donna:highlight' custom window event (same-page case).
// When a valid, non-expired target matches the current route:
//   1. Finds the element with [data-donna-focus-id="<targetId>"]
//   2. Scrolls it into view smoothly
//   3. Applies donna-focus-ring (or donna-focus-ring-warning) CSS class
//   4. Shows a small floating teal badge: "DONNA is pointing here"
//   5. Auto-dismisses after the target's expiresAt timestamp
//   6. Manual dismiss via × button
//
// No database. No mutations. No private data. Pure visual guidance only.
// Safe to mount in director layout — runs client-side only.

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import {
  getDonnaFocusTarget,
  clearDonnaFocusTarget,
  type DonnaFocusTarget,
} from '@/lib/donna/donnaFocusTarget'

export function DonnaHighlightBanner() {
  const pathname = usePathname()
  const [active, setActive] = useState<DonnaFocusTarget | null>(null)

  // Sprint 871 — cleanupRef holds the current timer + class-removal teardown.
  // Called before each new highlight attempt and on dismiss, so only one
  // highlight is active at a time regardless of how it was triggered.
  const cleanupRef = useRef<(() => void) | null>(null)

  // Sprint 871 — shared highlight logic used by both the pathname-change effect
  // and the donna:highlight event listener. Deps on pathname so that the
  // route-guard check reflects the current page.
  const triggerHighlight = useCallback(() => {
    // Cancel any active highlight before starting a new one
    cleanupRef.current?.()
    cleanupRef.current = null

    const target = getDonnaFocusTarget()

    // No target or wrong page — clear any lingering glow and bail
    if (!target || pathname !== target.route) {
      setActive(null)
      return
    }

    // Find the target element
    const el = document.querySelector<HTMLElement>(`[data-donna-focus-id="${target.targetId}"]`)
    if (!el) {
      // Element not on page yet — silently ignore (no error, no banner)
      return
    }

    // Apply glow class
    const glowClass = target.highlightStyle === 'warning' ? 'donna-focus-ring-warning' : 'donna-focus-ring'
    el.classList.add(glowClass)

    // Scroll into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Show badge
    setActive(target)

    // Auto-dismiss
    const remaining = Math.max((target.expiresAt ?? 0) - Date.now(), 1500)
    const timer = setTimeout(() => {
      el.classList.remove(glowClass)
      clearDonnaFocusTarget()
      setActive(null)
      cleanupRef.current = null
    }, remaining)

    // Store teardown in ref so dismiss() and subsequent calls can cancel it
    cleanupRef.current = () => {
      clearTimeout(timer)
      el.classList.remove(glowClass)
    }
  }, [pathname])

  // Pathname-change path — existing Sprint 817 behaviour
  useEffect(() => {
    triggerHighlight()
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [triggerHighlight])

  // Sprint 871 — Same-page path via donna:highlight custom event.
  // DonnaAssistantButton dispatches this synchronously after setDonnaFocusTarget
  // when result.route === pathname, so sessionStorage is written before the
  // listener fires and triggerHighlight() reads it correctly.
  useEffect(() => {
    const onHighlight = () => triggerHighlight()
    window.addEventListener('donna:highlight', onHighlight)
    return () => window.removeEventListener('donna:highlight', onHighlight)
  }, [triggerHighlight])

  const dismiss = useCallback(() => {
    if (!active) return
    // Cancel auto-dismiss timer and remove glow class
    cleanupRef.current?.()
    cleanupRef.current = null
    clearDonnaFocusTarget()
    setActive(null)
  }, [active])

  if (!active) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50
                 flex items-center gap-2
                 bg-[#07090c] border border-[#11d9df]/40 rounded-lg
                 px-3 py-2 shadow-lg
                 pointer-events-none"
    >
      {/* Teal pulse dot */}
      <span className="w-1.5 h-1.5 rounded-full bg-[#11d9df] animate-pulse shrink-0" />

      {/* Label */}
      <span className="text-[#11d9df] text-xs font-medium whitespace-nowrap">
        DONNA is pointing here
        {active.label ? ` — ${active.label}` : ''}
      </span>

      {/* Manual dismiss */}
      <button
        aria-label="Dismiss DONNA highlight"
        className="ml-1 pointer-events-auto text-[#11d9df]/60 hover:text-[#11d9df] transition-colors"
        onClick={dismiss}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
