'use client'

// Sprint 964 — DONNA Panel Page Chips
// Page-aware chip bar rendered inside the DONNA side panel.
// Chips either highlight a data-donna-focus-id target or send a prompt into DONNA.
//
// Highlight escalation:
//   - First click on a target: teal glow (highlightStyle: 'teal-glow')
//   - Repeated clicks on the same target: warning pulse (highlightStyle: 'warning')
//   Escalation count is tracked in a useRef — resets when the component unmounts
//   (i.e., when the panel closes), which is the correct UX behaviour.
//
// Graceful degradation:
//   If the target element is not present on the current page, DonnaHighlightBanner
//   silently does nothing. No crash. No error.
//
// No DB. No mutations. No private data. Pure visual guidance + conversational shortcuts.

import { useRef, useState } from 'react'
import { setDonnaFocusTarget } from '@/lib/donna/donnaFocusTarget'
import { getChipsForRoute, type DonnaPageChip } from '@/lib/donna/donnaPageChipRegistry'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  /** Current route pathname from usePathname() — already available in the parent. */
  pathname: string
  /**
   * Called for prompt chips. Parent (DonnaAssistantButton) passes handleCommandSubmit
   * so the prompt enters the existing DONNA conversation flow — no new surface.
   */
  onPrompt: (text: string) => void
  /**
   * Sprint 966 — Called for brief chips. Parent passes () => void handleFetchDailyBrief()
   * so brief chips reuse the existing daily brief fetch + speak + render path.
   * No new API, no new voice path, no new DONNA surface.
   */
  onBrief?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DonnaPanelPageChips({ pathname, onPrompt, onBrief }: Props) {
  const chips = getChipsForRoute(pathname)

  // Track how many times each targetId has been highlighted this session.
  // useRef — does not cause re-renders; only escalatedIds (below) drives style.
  const highlightCountsRef = useRef<Record<string, number>>({})

  // Tracks which targets have been highlighted more than once (escalated).
  // Used to apply stronger visual style and show the pulse dot.
  const [escalatedIds, setEscalatedIds] = useState<Set<string>>(new Set())

  // Sprint 1094D — cap to 3 visible + More toggle to reduce active-surface height
  const [showMore, setShowMore] = useState(false)

  if (chips.length === 0) return null

  const visibleChips = showMore ? chips : chips.slice(0, 3)

  function handleHighlightChip(chip: DonnaPageChip) {
    if (!chip.targetId) return

    const prev = highlightCountsRef.current[chip.targetId] ?? 0
    const next = prev + 1
    highlightCountsRef.current[chip.targetId] = next

    const isEscalated = next > 1
    if (isEscalated) {
      setEscalatedIds(ids => {
        const updated = new Set(ids)
        updated.add(chip.targetId!)
        return updated
      })
    }

    // Write target to sessionStorage — DonnaHighlightBanner reads it on the
    // 'donna:highlight' event and applies the glow to the matching element.
    setDonnaFocusTarget({
      route: pathname,
      targetId: chip.targetId,
      label: chip.label,
      highlightStyle: isEscalated ? 'warning' : 'teal-glow',
      expiresAt: Date.now() + 8000,
    })

    // Same-page highlight path (Sprint 871): dispatch after writing sessionStorage.
    window.dispatchEvent(new CustomEvent('donna:highlight'))
  }

  function handlePromptChip(chip: DonnaPageChip) {
    if (!chip.prompt) return
    onPrompt(chip.prompt)
  }

  // Sprint 966 — brief chips reuse handleFetchDailyBrief via onBrief prop.
  function handleBriefChip() {
    onBrief?.()
  }

  return (
    <div
      className="flex flex-wrap gap-1.5"
      aria-label="Page shortcuts"
    >
      {visibleChips.map(chip => {
        const isEscalated = chip.targetId
          ? escalatedIds.has(chip.targetId)
          : false

        return (
          <button
            key={chip.id}
            type="button"
            title={
              chip.actionType === 'highlight'
                ? isEscalated
                  ? `Point to "${chip.label}" again (escalated highlight)`
                  : `Point to "${chip.label}" on this page`
                : chip.actionType === 'brief'
                  ? 'Load DONNA daily brief'
                  : chip.prompt
            }
            onClick={() => {
              if (chip.actionType === 'highlight') handleHighlightChip(chip)
              else if (chip.actionType === 'brief') handleBriefChip()
              else handlePromptChip(chip)
            }}
            className="inline-flex items-center gap-1 shrink-0 text-[11px] px-2.5 py-1 rounded-full transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
            style={{
              background: isEscalated
                ? 'rgba(17,217,223,0.12)'
                : chip.actionType === 'highlight'
                  ? 'rgba(17,217,223,0.05)'
                  : chip.actionType === 'brief'
                    ? 'rgba(200,255,0,0.07)'
                    : 'rgba(200,255,0,0.04)',
              border: isEscalated
                ? '1px solid rgba(17,217,223,0.45)'
                : chip.actionType === 'highlight'
                  ? '1px solid rgba(17,217,223,0.18)'
                  : chip.actionType === 'brief'
                    ? '1px solid rgba(200,255,0,0.25)'
                    : '1px solid rgba(200,255,0,0.15)',
              color: isEscalated
                ? '#11d9df'
                : chip.actionType === 'highlight'
                  ? 'rgba(17,217,223,0.65)'
                  : chip.actionType === 'brief'
                    ? 'rgba(200,255,0,0.75)'
                    : 'rgba(200,255,0,0.55)',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{chip.label}</span>
            {/* Pulse dot: shown after the first escalated highlight */}
            {isEscalated && (
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                style={{ background: '#11d9df' }}
              />
            )}
          </button>
        )
      })}

      {/* Sprint 1094D — More / Less toggle when chip count exceeds 3 */}
      {chips.length > 3 && (
        <button
          type="button"
          onClick={() => setShowMore(p => !p)}
          className="inline-flex items-center shrink-0 text-[11px] px-2.5 py-1 rounded-full transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          {showMore ? 'Less ↑' : `More ↓`}
        </button>
      )}
    </div>
  )
}
