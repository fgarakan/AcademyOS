import Link from 'next/link'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { LevelBadge } from '@/components/ui'
import { AdvancementStatusBadge } from './AdvancementStatusBadge'
import { formatRelativeDate, getInitials } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/database.types'

type Player = Tables<'players'>
type DomainRow = Tables<'v_player_curriculum_detail'>

interface PlayerProfileHeaderProps {
  player: Player
  curriculumSummary: DomainRow | null
}

export function PlayerProfileHeader({ player, curriculumSummary }: PlayerProfileHeaderProps) {
  const displayName = player.full_name ?? `${player.first_name} ${player.last_name}`
  const initials = getInitials(displayName)

  return (
    <div className="mb-6">
      <Link
        href="/director/players"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-secondary text-sm mb-4 transition-colors duration-100"
      >
        <ChevronLeft className="w-4 h-4" />
        All Players
      </Link>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-text-primary">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary">{displayName}</h1>
            {curriculumSummary?.stage && (
              <LevelBadge
                stage={curriculumSummary.stage}
                levelName={curriculumSummary.current_level_name ?? undefined}
                size="md"
              />
            )}
            <AdvancementStatusBadge eligible={curriculumSummary?.advancement_eligible ?? null} />
          </div>

          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            {curriculumSummary?.stage_name && (
              <span className="text-sm text-text-secondary">{curriculumSummary.stage_name}</span>
            )}
            {curriculumSummary?.last_evaluated_at && (
              <span className="text-sm text-text-muted">
                Last evaluated {formatRelativeDate(curriculumSummary.last_evaluated_at)}
              </span>
            )}
            {!curriculumSummary && (
              <span className="flex items-center gap-1.5 text-sm text-status-orange">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                No curriculum level — assign one to begin tracking
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
