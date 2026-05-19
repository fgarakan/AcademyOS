'use client'

import { useEffect, useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import type { OnboardingDraft } from './OnboardingShell'

const STORAGE_KEY = 'academyos_onboarding_draft_v2'

export function useOnboardingDraftPersistence(
  draft: OnboardingDraft,
  setDraft: (d: OnboardingDraft) => void,
) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)

  // Save draft to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
      setLastSaved(new Date())
    } catch {
      // localStorage may be unavailable in some environments — fail silently
    }
  }, [draft])

  // Restore draft from localStorage on mount
  const restoreDraft = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as OnboardingDraft
        setDraft(parsed)
        setHasRestoredDraft(true)
      }
    } catch {
      // Corrupted storage — ignore
    }
  }

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setLastSaved(null)
    } catch {
      // fail silently
    }
  }

  const hasSavedDraft = (): boolean => {
    try {
      return !!localStorage.getItem(STORAGE_KEY)
    } catch {
      return false
    }
  }

  return { lastSaved, hasRestoredDraft, restoreDraft, clearDraft, hasSavedDraft }
}

interface Props {
  lastSaved: Date | null
  onClear?: () => void
}

export function OnboardingSaveStatus({ lastSaved, onClear }: Props) {
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    if (!lastSaved) return
    const update = () => {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      if (seconds < 5) setTimeAgo('just now')
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`)
      else setTimeAgo(`${Math.floor(seconds / 60)}m ago`)
    }
    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [lastSaved])

  if (!lastSaved) return null

  return (
    <div className="flex items-center gap-2">
      <Save className="w-3 h-3 text-text-muted/50 shrink-0" />
      <span className="text-[10px] text-text-muted/50">
        Saved in this browser {timeAgo}
      </span>
      {onClear && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 text-[9px] text-text-muted/40 hover:text-text-muted transition-colors"
          title="Clear saved draft"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          Clear
        </button>
      )}
    </div>
  )
}

export function DraftResumeBanner({ onResume, onDismiss }: { onResume: () => void; onDismiss: () => void }) {
  return (
    <div className="rounded-xl bg-surface border border-lime/20 px-4 py-3 flex items-center gap-3">
      <Save className="w-4 h-4 text-lime shrink-0" />
      <p className="text-[12px] text-text-secondary flex-1 leading-relaxed">
        You have a saved onboarding draft in this browser.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onResume}
          className="text-[11px] font-semibold text-lime hover:brightness-110 transition-colors"
        >
          Resume
        </button>
        <button
          onClick={onDismiss}
          className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
        >
          Start fresh
        </button>
      </div>
    </div>
  )
}
