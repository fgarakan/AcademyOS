// DONNA First Daily Greeting V1
//
// Shown at the top of the Today page.
// Uses real data — never invents alerts.
// Constitution: director sees what matters immediately.
//
// Format:
//   "Good morning, Brian.
//    Today needs your attention:
//    - 3 coach assessments need review
//    - 2 players may be ready for reassessment
//    - 1 parent update needs approval
//    Ask me anything."
//
// Tone: calm operating layer, not a widget.

import { Sparkles } from 'lucide-react'

interface DonnaFirstGreetingProps {
  directorFirstName: string
  pendingWrapUps: number
  pendingPlacements: number
  attentionCount: number
  parentUpdatesPending: number
  advancementReadyCount: number
  activePlayers: number
  greeting: string  // "Good morning" | "Good afternoon" | "Good evening"
}

function buildAttentionItems(props: DonnaFirstGreetingProps): string[] {
  const {
    pendingWrapUps,
    pendingPlacements,
    attentionCount,
    parentUpdatesPending,
    advancementReadyCount,
  } = props

  const items: string[] = []

  if (pendingWrapUps > 0) {
    items.push(`${pendingWrapUps} coach wrap-up${pendingWrapUps > 1 ? 's' : ''} need${pendingWrapUps === 1 ? 's' : ''} review`)
  }
  if (pendingPlacements > 0) {
    items.push(`${pendingPlacements} player${pendingPlacements > 1 ? 's' : ''} need${pendingPlacements === 1 ? 's' : ''} placement`)
  }
  if (attentionCount > 0) {
    items.push(`${attentionCount} player${attentionCount > 1 ? 's' : ''} need${attentionCount === 1 ? 's' : ''} attention`)
  }
  if (advancementReadyCount > 0) {
    items.push(`${advancementReadyCount} player${advancementReadyCount > 1 ? 's' : ''} may be ready to advance`)
  }
  if (parentUpdatesPending > 0) {
    items.push(`${parentUpdatesPending} parent update${parentUpdatesPending > 1 ? 's' : ''} need${parentUpdatesPending === 1 ? 's' : ''} approval`)
  }

  return items.slice(0, 4)
}

export function DonnaFirstGreeting(props: DonnaFirstGreetingProps) {
  const { directorFirstName, greeting, activePlayers } = props
  const items = buildAttentionItems(props)
  const totalUrgent = items.length

  return (
    <div className="rounded-2xl border border-lime/20 bg-lime/4 px-5 py-5 space-y-3">
      {/* DONNA identity */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-lime" />
        </div>
        <span className="text-xs font-bold text-lime uppercase tracking-widest">DONNA</span>
      </div>

      {/* Greeting */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-primary">
          {greeting}, {directorFirstName}.
        </p>

        {totalUrgent === 0 ? (
          <p className="text-sm text-text-secondary">
            Academy looks calm today.
            {activePlayers > 0 && ` ${activePlayers} active player${activePlayers !== 1 ? 's' : ''}.`}
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-text-secondary">Today needs your attention:</p>
            <ul className="space-y-0.5">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[11px] text-lime/70">Ask me anything.</p>
      </div>
    </div>
  )
}
