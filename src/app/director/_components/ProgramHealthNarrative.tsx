import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { DonnaSignalMeta } from './DonnaSignalMeta'
import type { ConfidenceLevel } from '@/lib/donna/confidenceEngine'

interface GroupRow {
  group_name: string | null
  player_count: number | null
  max_players: number | null
}

interface Props {
  healthPct: number
  activePlayers: number
  sessionsThisWeek: number
  improvingCount: number
  groups: GroupRow[]
  overCapacityCount: number
  advancementReadyCount: number
  topSignal: string | null
  confidence: ConfidenceLevel
  evidenceSummary: string
}

function healthColor(pct: number): string {
  if (pct >= 80) return '#30D158'
  if (pct >= 60) return '#FF9500'
  return '#FF3B30'
}

function GroupRow({ group }: { group: GroupRow }) {
  const count  = group.player_count ?? 0
  const max    = group.max_players
  const pct    = max ? Math.round((count / max) * 100) : null
  const isOver = max !== null && count > max
  const isLight = max !== null && count < max * 0.6

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-text-primary truncate">
          {group.group_name ?? 'Unnamed Group'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-mono text-[13px] font-bold ${isOver ? 'text-status-orange' : isLight ? 'text-status-blue' : 'text-text-primary'}`}>
          {count}
        </span>
        {max !== null && (
          <span className="text-[10px] text-text-muted">/ {max}</span>
        )}
        {pct !== null && (
          <div className="w-16 h-1.5 rounded-full overflow-hidden bg-surface-raised">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: isOver ? '#FF9500' : isLight ? '#0A84FF' : '#30D158',
              }}
            />
          </div>
        )}
        {isOver && (
          <span className="text-[9px] font-semibold text-status-orange uppercase tracking-wider">Over</span>
        )}
        {isLight && !isOver && (
          <span className="text-[9px] font-semibold text-status-blue uppercase tracking-wider">Light</span>
        )}
      </div>
    </div>
  )
}

export function ProgramHealthNarrative({
  healthPct,
  activePlayers,
  sessionsThisWeek,
  improvingCount,
  groups,
  overCapacityCount,
  advancementReadyCount,
  topSignal,
  confidence,
  evidenceSummary,
}: Props) {
  const color  = healthColor(healthPct)
  const hasGroups = groups.length > 0

  return (
    <section className="space-y-2">
      <p className="label-xs">Program Health</p>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">

        {/* DONNA narrative + health score */}
        <div className="px-4 py-4 space-y-3" style={{ borderBottom: hasGroups ? '1px solid var(--color-border, #222222)' : undefined }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
              <span className="text-[10px] uppercase tracking-widest text-lime font-semibold">DONNA · Program Analysis</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono font-bold text-[22px] leading-none" style={{ color }}>{healthPct}%</span>
              <span className="text-[10px] text-text-muted">health</span>
            </div>
          </div>

          {topSignal ? (
            <p className="text-[13px] font-semibold text-text-primary leading-snug">{topSignal}</p>
          ) : (
            <p className="text-[13px] font-semibold text-text-primary leading-snug">
              Program is running to plan. No critical signals today.
            </p>
          )}

          {/* 3 key numbers */}
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div>
              <p className="font-mono font-bold text-[18px] text-lime leading-none">{activePlayers}</p>
              <p className="text-[10px] text-text-muted mt-0.5">Active players</p>
            </div>
            <div>
              <p className="font-mono font-bold text-[18px] text-text-primary leading-none">{sessionsThisWeek}</p>
              <p className="text-[10px] text-text-muted mt-0.5">Sessions this week</p>
            </div>
            <div>
              <p className={`font-mono font-bold text-[18px] leading-none ${improvingCount > 0 ? 'text-status-green' : 'text-text-muted'}`}>
                {improvingCount}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">Improving</p>
            </div>
          </div>

          {advancementReadyCount > 0 && (
            <p className="text-[11px] text-lime">
              {advancementReadyCount} player{advancementReadyCount !== 1 ? 's' : ''} advancement-eligible
            </p>
          )}

          <DonnaSignalMeta
            confidence={confidence}
            evidenceSummary={evidenceSummary}
            recommendedAction="View detailed health report"
            actionHref="/director/kpi"
          />
        </div>

        {/* Group enrollment table */}
        {hasGroups && (
          <div>
            <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--color-border, #222222)' }}>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                Group Enrollment
                {overCapacityCount > 0 && (
                  <span className="ml-2 text-status-orange">· {overCapacityCount} over capacity</span>
                )}
              </p>
            </div>
            <div className="divide-y divide-border">
              {groups.slice(0, 8).map((g, i) => (
                <GroupRow key={i} group={g} />
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-2.5 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--color-border, #222222)' }}>
          <p className="text-[10px] text-text-muted">
            Groups, curriculum levels, and session data
          </p>
          <Link href="/director/players" className="text-[11px] text-lime hover:opacity-80 font-medium">
            View players →
          </Link>
        </div>
      </div>
    </section>
  )
}
