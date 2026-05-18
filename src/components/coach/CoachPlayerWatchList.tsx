import { AlertTriangle, TrendingUp, Dumbbell, Trophy, Brain, Star } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

export type PathwayTag = 'Skill' | 'Competition' | 'Fitness' | 'Mindset'
export type AttentionFlag = 'watch' | 'concern' | null

export interface WatchListPlayer {
  playerId: string
  fullName: string
  currentPriority: string | null
  pathwayTag: PathwayTag | null
  coachWatchFor: string | null
  lastSafeNote: string | null
  attentionFlag: AttentionFlag
  curriculumLevel: string | null
}

// ── Pathway icon map ──────────────────────────────────────────

const PATHWAY_ICON: Record<PathwayTag, React.ReactNode> = {
  Skill:       <TrendingUp className="w-3 h-3" />,
  Competition: <Trophy className="w-3 h-3" />,
  Fitness:     <Dumbbell className="w-3 h-3" />,
  Mindset:     <Brain className="w-3 h-3" />,
}

const PATHWAY_COLOR: Record<PathwayTag, string> = {
  Skill:       'text-lime border-lime/30 bg-lime/5',
  Competition: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  Fitness:     'text-violet-400 border-violet-400/30 bg-violet-400/5',
  Mindset:     'text-status-blue border-status-blue/30 bg-status-blue/5',
}

// ── Player card ───────────────────────────────────────────────

function PlayerWatchCard({ player }: { player: WatchListPlayer }) {
  const pathway = player.pathwayTag
  const pathwayColor = pathway ? PATHWAY_COLOR[pathway] : 'text-text-muted border-border bg-surface-raised'
  const initials = player.fullName
    .trim()
    .split(' ')
    .map(p => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`rounded-2xl border bg-surface p-4 space-y-3 ${
      player.attentionFlag === 'concern'
        ? 'border-status-red/30'
        : player.attentionFlag === 'watch'
        ? 'border-status-orange/30'
        : 'border-border'
    }`}>

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-text-secondary">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{player.fullName}</p>
            {player.curriculumLevel && (
              <p className="text-[10px] text-text-muted">{player.curriculumLevel}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {player.attentionFlag === 'concern' && (
            <span className="flex items-center gap-1 text-[10px] text-status-red font-medium">
              <AlertTriangle className="w-3 h-3" />
              Concern
            </span>
          )}
          {player.attentionFlag === 'watch' && (
            <span className="flex items-center gap-1 text-[10px] text-status-orange font-medium">
              <AlertTriangle className="w-3 h-3" />
              Watch
            </span>
          )}
          {player.attentionFlag === null && pathway && (
            <span className={`flex items-center gap-1 text-[10px] font-medium border rounded-full px-1.5 py-0.5 ${pathwayColor}`}>
              {PATHWAY_ICON[pathway]}
              {pathway}
            </span>
          )}
        </div>
      </div>

      {/* Current priority */}
      {player.currentPriority && (
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">Current Priority</p>
          <p className="text-xs text-text-secondary leading-snug">{player.currentPriority}</p>
        </div>
      )}

      {/* Coach watch-for */}
      {player.coachWatchFor && (
        <div className="rounded-xl bg-surface-raised border border-border px-3 py-2">
          <p className="text-[9px] uppercase tracking-widest text-lime mb-0.5">Watch For</p>
          <p className="text-xs text-text-secondary leading-snug">{player.coachWatchFor}</p>
        </div>
      )}

      {/* Last safe note */}
      {player.lastSafeNote && (
        <p className="text-[10px] text-text-muted leading-snug line-clamp-2">
          <span className="text-text-muted/60">Last note: </span>{player.lastSafeNote}
        </p>
      )}

    </div>
  )
}

// ── Main component ────────────────────────────────────────────

interface Props {
  players: WatchListPlayer[]
  sessionId?: string
}

export function CoachPlayerWatchList({ players, sessionId }: Props) {
  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <Star className="w-5 h-5 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-secondary">No player watch list yet.</p>
        <p className="text-xs text-text-muted mt-1">
          Player priorities and watch-fors will appear here once set by your director.
        </p>
      </div>
    )
  }

  // Sort: concerns first, then watches, then others
  const sorted = [...players].sort((a, b) => {
    const rank = (f: AttentionFlag) => f === 'concern' ? 0 : f === 'watch' ? 1 : 2
    return rank(a.attentionFlag) - rank(b.attentionFlag)
  })

  return (
    <div className="space-y-3">
      {sorted.map(p => (
        <PlayerWatchCard key={p.playerId} player={p} />
      ))}
    </div>
  )
}
