// Sprint 2381B–2410B — DONNA Today Decision Layer V2
// Who Needs Attention — up to 3 named players ranked by urgency tier.
// Tier priority: 1=High Risk · 2=Stalled Progression · 3=Overdue Assessment
//                4=Advancement Ready · 5=General Attention
// The #1 player is always: "If the Director only looked at one player today, who should it be?"

import Link from 'next/link'
import { Users, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui'

export interface PlayerAttentionItem {
  playerId: string
  name: string
  reason: string
  recommendedAction: string
  route: string
}

interface Props {
  players: PlayerAttentionItem[]
}

export function PlayersNeedingAttentionPanel({ players }: Props) {
  if (players.length === 0) return null

  return (
    <Card className="overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Users size={13} className="text-text-muted shrink-0" />
          <span className="label-xs">PLAYERS NEEDING ATTENTION</span>
        </div>
        <Link
          href="/director/players"
          className="label-xs text-text-muted hover:text-lime transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Player rows — max 3, ranked by urgency tier */}
      <div className="divide-y divide-border">
        {players.map((player, i) => (
          <div key={player.playerId} className="flex items-start gap-4 px-5 py-4">
            {/* Priority rank */}
            <span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-text-muted shrink-0 mt-0.5">
              {i + 1}
            </span>

            {/* Name · reason · recommended action */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-base font-semibold text-text-primary leading-snug">
                {player.name}
              </p>
              <p className="text-sm text-text-secondary leading-snug">
                {player.reason}
              </p>
              <p className="text-xs leading-snug">
                <span className="text-text-secondary font-medium">Recommended: </span>
                <span className="text-text-muted">{player.recommendedAction}</span>
              </p>
            </div>

            {/* Review link */}
            <Link
              href={player.route}
              className="inline-flex items-center gap-1 text-sm font-semibold text-lime hover:underline shrink-0 mt-0.5 py-1"
            >
              Review
              <ChevronRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </Card>
  )
}
