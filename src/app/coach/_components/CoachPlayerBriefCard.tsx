// Sprint 1131-1140 — Coach Player Brief Card
//
// When a coach opens a player in their session context, show a focused brief:
//   - Current focus
//   - Watch-fors (what to observe and correct)
//   - After-session capture prompts
//
// Coach NEVER sees: director analytics, parent communications, placement debates.
// Server Component — accepts pre-fetched data (no auth needed, called from coach route).

import { Eye, MessageSquare, Target } from 'lucide-react'

interface CoachPlayerBriefCardProps {
  playerFirstName: string
  playerLastName: string
  currentLevelName: string | null
  currentFocus: string | null
  /** Top 1-2 things to observe/correct this session */
  watchFors: string[]
  /** Prompts to guide coach wrap-up capture */
  capturePrompts: string[]
  activeMissionLabel: string | null
}

export function CoachPlayerBriefCard({
  playerFirstName,
  playerLastName,
  currentLevelName,
  currentFocus,
  watchFors,
  capturePrompts,
  activeMissionLabel,
}: CoachPlayerBriefCardProps) {
  const name = playerFirstName

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-surface-raised border-b border-border flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-text-primary">{playerFirstName} {playerLastName}</p>
          {currentLevelName && <p className="text-[10px] text-text-muted">{currentLevelName}</p>}
        </div>
        {activeMissionLabel && (
          <div className="flex items-center gap-1 shrink-0">
            <Target className="w-3 h-3 text-lime" />
            <p className="text-[10px] text-lime font-medium truncate max-w-[120px]">{activeMissionLabel}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Current focus */}
        {currentFocus && (
          <div>
            <p className="label-xs text-text-muted mb-1">Today's Focus</p>
            <p className="text-xs font-semibold text-text-primary">{currentFocus}</p>
          </div>
        )}

        {/* Watch-fors */}
        {watchFors.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Eye className="w-3 h-3 text-text-muted" />
              <p className="label-xs text-text-muted">Watch For</p>
            </div>
            <ul className="space-y-1">
              {watchFors.slice(0, 3).map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[10px] text-text-muted mt-0.5">·</span>
                  <p className="text-[11px] text-text-secondary leading-snug">{w}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* After-session capture prompts */}
        {capturePrompts.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 mb-1.5">
              <MessageSquare className="w-3 h-3 text-text-muted" />
              <p className="label-xs text-text-muted">After Session — Note</p>
            </div>
            <ul className="space-y-1">
              {capturePrompts.slice(0, 3).map((p, i) => (
                <li key={i} className="text-[11px] text-text-muted leading-snug">
                  {i + 1}. {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Builder from priority + blueprint data ─────────────────────────────────────

export function buildCoachPlayerBrief(params: {
  priorityTitle: string | null
  priorityDescription: string | null
  currentFocus: string | null
  activeMissionLabel: string | null
}): { watchFors: string[]; capturePrompts: string[] } {
  const focus = (params.priorityTitle ?? params.currentFocus ?? '').toLowerCase()

  const watchFors: string[] = []
  const capturePrompts: string[] = []

  if (focus.includes('rhythm') || focus.includes('serve')) {
    watchFors.push('Late preparation on serve motion')
    watchFors.push('Rushed or inconsistent toss height')
    capturePrompts.push('Did serve rhythm improve today?')
    capturePrompts.push('Any specific pattern in errors — timing, direction, or motion?')
  } else if (focus.includes('spacing') || focus.includes('contact')) {
    watchFors.push('Arriving late to the ball — reaching rather than positioning')
    watchFors.push('Arms-only swing without full body preparation')
    capturePrompts.push('Did spacing improve on forehand or backhand today?')
    capturePrompts.push('Any progress on early positioning cue?')
  } else if (focus.includes('rally') || focus.includes('consistency')) {
    watchFors.push('Going for too much too early in the rally')
    watchFors.push('Decision-making pressure on medium-difficulty balls')
    capturePrompts.push('How long were rallies today compared to last session?')
    capturePrompts.push('Were there moments of real patience? When?')
  } else if (focus.includes('confidence') || focus.includes('mental')) {
    watchFors.push('Body language after errors — reset time, posture')
    watchFors.push('Engagement level on difficult balls')
    capturePrompts.push('Did the player bounce back quickly from mistakes?')
    capturePrompts.push('Any moments that stood out positively?')
  } else {
    if (params.priorityTitle) watchFors.push(`Focus on ${params.priorityTitle} — observe execution quality`)
    capturePrompts.push('Any improvement on today\'s focus area?')
    capturePrompts.push('What should carry forward to next session?')
  }

  // Always add mission capture prompt if available
  if (params.activeMissionLabel) {
    capturePrompts.push(`Progress on mission "${params.activeMissionLabel}"?`)
  }

  return { watchFors, capturePrompts }
}
