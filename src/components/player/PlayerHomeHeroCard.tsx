// PlayerHomeHeroCard — Sprint 1069
// Player-facing mission hero on the home screen.
// Shows current mission text, level progression, and navigation CTA.
// All text comes from director-approved IDP data — no raw coach notes.

import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

interface Props {
  playerFirstName: string | null
  missionText: string | null
  currentLevelName: string | null
  nextLevelName: string | null
}

export function PlayerHomeHeroCard({
  playerFirstName,
  missionText,
  currentLevelName,
  nextLevelName,
}: Props) {
  const firstName = playerFirstName ?? 'Player'

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        {/* Level row */}
        {currentLevelName && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] uppercase tracking-widest text-text-muted">
              {currentLevelName}
            </span>
            {nextLevelName && (
              <>
                <ChevronRight className="w-3 h-3 text-text-muted" />
                <span className="text-[10px] uppercase tracking-widest text-text-muted">
                  {nextLevelName}
                </span>
              </>
            )}
          </div>
        )}

        {/* Mission text */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-lime mb-1.5">
            {firstName}&apos;s Current Mission
          </p>
          {missionText ? (
            <p className="text-base font-semibold text-text-primary leading-snug">
              &ldquo;{missionText}&rdquo;
            </p>
          ) : (
            <p className="text-sm text-text-secondary leading-relaxed">
              Your coach is setting up your first mission. Keep showing up.
            </p>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/player/missions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime hover:text-lime/80 transition-colors"
        >
          See My Missions
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
