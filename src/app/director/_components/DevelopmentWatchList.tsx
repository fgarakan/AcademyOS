import Link from 'next/link'
import { TrendingUp, AlertCircle, Eye } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { DonnaSignalMeta } from './DonnaSignalMeta'
import type { ConfidenceLevel } from '@/lib/donna/confidenceEngine'

export interface WatchPlayer {
  playerId: string
  name: string
  levelLabel: string | null
  signal: string
  href: string
  confidence: ConfidenceLevel
  evidenceSummary: string
}

interface Props {
  movingFast: WatchPlayer[]
  needsSupport: WatchPlayer[]
  watchClosely: WatchPlayer[]
}

function PlayerRow({ player }: { player: WatchPlayer }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Avatar name={player.name} size="sm" />
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary truncate">{player.name}</p>
          {player.levelLabel && (
            <span className="shrink-0 text-[10px] text-text-muted font-medium bg-surface-raised border border-border px-1.5 py-0.5 rounded-full">
              {player.levelLabel}
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">{player.signal}</p>
        <DonnaSignalMeta
          confidence={player.confidence}
          evidenceSummary={player.evidenceSummary}
          recommendedAction="View profile"
          actionHref={player.href}
        />
      </div>
      <Link
        href={player.href}
        className="shrink-0 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity pt-0.5 whitespace-nowrap"
      >
        View →
      </Link>
    </div>
  )
}

interface BucketProps {
  icon: React.ReactNode
  label: string
  labelColor: string
  players: WatchPlayer[]
}

function Bucket({ icon, label, labelColor, players }: BucketProps) {
  if (players.length === 0) return null

  return (
    <div className="space-y-0">
      <div className={`flex items-center gap-2 px-4 py-2 ${labelColor}`}
        style={{ borderBottom: '1px solid var(--color-border, #222222)' }}>
        {icon}
        <p className="text-[10px] uppercase tracking-widest font-semibold">{label}</p>
        <span className="ml-auto text-[10px] font-mono font-bold opacity-70">{players.length}</span>
      </div>
      {players.map((p, i) => (
        <div
          key={p.playerId}
          style={i < players.length - 1 ? { borderBottom: '1px solid var(--color-border, #222222)' } : {}}
        >
          <PlayerRow player={p} />
        </div>
      ))}
    </div>
  )
}

export function DevelopmentWatchList({ movingFast, needsSupport, watchClosely }: Props) {
  const hasAny = movingFast.length > 0 || needsSupport.length > 0 || watchClosely.length > 0

  return (
    <section className="space-y-2">
      <p className="label-xs">Development Watch List</p>

      {!hasAny ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-4">
          <p className="text-[12px] text-text-secondary">
            No player development signals this week. Signals appear as sessions run and assessments accumulate.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
          <Bucket
            icon={<TrendingUp className="w-3 h-3 text-status-green" />}
            label="Moving Fast"
            labelColor="text-status-green bg-status-green/5"
            players={movingFast}
          />
          <Bucket
            icon={<AlertCircle className="w-3 h-3 text-status-orange" />}
            label="Needs Support"
            labelColor="text-status-orange bg-status-orange/5"
            players={needsSupport}
          />
          <Bucket
            icon={<Eye className="w-3 h-3 text-status-blue" />}
            label="Watch Closely"
            labelColor="text-status-blue bg-status-blue/5"
            players={watchClosely}
          />
        </div>
      )}
    </section>
  )
}
