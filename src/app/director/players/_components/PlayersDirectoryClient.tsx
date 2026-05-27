'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Users, Search, Zap, Upload, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LevelBadge } from '@/components/ui/LevelBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchFilterBar } from '@/components/ui/SearchFilterBar'
import { FilterChip } from '@/components/ui/SearchFilterBar'
import { formatRelativeDate, formatDate } from '@/lib/utils'
import type { VPlayerSummary } from '@/lib/backend/players'
import type { PlayerCurriculumEntry } from '../page'

type StatusBadgeStatus = 'action_needed' | 'needs_attention' | 'check_in' | 'on_track' | 'complete' | 'building' | 'warning' | 'info'
type StatusFilter = 'all' | 'active' | 'reassessment_due' | 'on_hold' | 'pending'
type StageFilter = 'all' | string

function playerStatusBadge(status: string | null): { status: StatusBadgeStatus; label: string } {
  switch (status) {
    case 'active':                return { status: 'on_track',        label: 'Active' }
    case 'reassessment_due':      return { status: 'needs_attention', label: 'Reassessment due' }
    case 'on_hold':               return { status: 'warning',         label: 'On hold' }
    case 'pending_placement':     return { status: 'building',        label: 'Pending' }
    case 'placement_in_progress': return { status: 'building',        label: 'Pending' }
    case 'pending_approval':      return { status: 'check_in',        label: 'Pending approval' }
    case 'inactive':              return { status: 'check_in',        label: 'Inactive' }
    default:                      return { status: 'on_track',        label: status ?? '—' }
  }
}

function isPending(status: string | null): boolean {
  return status === 'pending_placement' || status === 'placement_in_progress' || status === 'pending_approval'
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

const STAGE_LABEL: Record<string, string> = {
  red_foundation:    'Red',
  orange_development:'Orange',
  green_performance: 'Green',
  yellow_competitive:'Yellow',
  high_performance:  'HP',
}

const STAGE_COLOR: Record<string, string> = {
  red_foundation:    'text-red-400 border-red-400/30 bg-red-400/5',
  orange_development:'text-amber-400 border-amber-400/30 bg-amber-400/5',
  green_performance: 'text-green-400 border-green-400/30 bg-green-400/5',
  yellow_competitive:'text-yellow-300 border-yellow-300/30 bg-yellow-300/5',
  high_performance:  'text-violet-400 border-violet-400/30 bg-violet-400/5',
}

interface Props {
  players: VPlayerSummary[]
  curriculumMap?: Record<string, PlayerCurriculumEntry>
}

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',               label: 'All' },
  { key: 'active',            label: 'Active' },
  { key: 'reassessment_due',  label: 'Reassessment due' },
  { key: 'on_hold',           label: 'On hold' },
  { key: 'pending',           label: 'Pending' },
]

export function PlayersDirectoryClient({ players, curriculumMap = {} }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')

  const distinctGroups = useMemo(() => {
    const seen = new Set<string>()
    const groups: string[] = []
    for (const p of players) {
      if (p.group_name && !seen.has(p.group_name)) {
        seen.add(p.group_name)
        groups.push(p.group_name)
      }
    }
    return groups.sort()
  }, [players])

  const distinctStages = useMemo(() => {
    const seen = new Set<string>()
    const stages: string[] = []
    for (const p of players) {
      const stage = p.player_id ? curriculumMap[p.player_id]?.stage : undefined
      if (stage && !seen.has(stage)) {
        seen.add(stage)
        stages.push(stage)
      }
    }
    return stages
  }, [players, curriculumMap])

  const filtered = useMemo(() => {
    return players.filter(p => {
      const matchesName = !search ||
        (p.full_name ?? '').toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
          ? isPending(p.player_status)
          : p.player_status === statusFilter

      const matchesGroup =
        groupFilter === 'all' ? true : p.group_name === groupFilter

      const playerStage = p.player_id ? curriculumMap[p.player_id]?.stage : undefined
      const matchesStage =
        stageFilter === 'all' ? true : playerStage === stageFilter

      return matchesName && matchesStatus && matchesGroup && matchesStage
    })
  }, [players, search, statusFilter, groupFilter, stageFilter, curriculumMap])

  const hasPlayers = players.length > 0

  return (
    <div className="space-y-4">
      {/* Sprint 820: data-donna-focus-id for DONNA filter bar highlight */}
      <SearchFilterBar
        data-donna-focus-id="player-filter-bar"
        value={search}
        onChange={setSearch}
        placeholder="Search players by name…"
        filters={
          <>
            {STATUS_FILTERS.map(f => (
              <FilterChip
                key={f.key}
                label={f.label}
                active={statusFilter === f.key}
                onClick={() => setStatusFilter(f.key)}
              />
            ))}
            {distinctGroups.length > 0 && (
              <>
                <span className="text-text-muted/40 select-none">·</span>
                <FilterChip
                  label="All groups"
                  active={groupFilter === 'all'}
                  onClick={() => setGroupFilter('all')}
                />
                {distinctGroups.map(g => (
                  <FilterChip
                    key={g}
                    label={g}
                    active={groupFilter === g}
                    onClick={() => setGroupFilter(g)}
                  />
                ))}
              </>
            )}
            {distinctStages.length > 0 && (
              <>
                <span className="text-text-muted/40 select-none">·</span>
                <FilterChip
                  label="All stages"
                  active={stageFilter === 'all'}
                  onClick={() => setStageFilter('all')}
                />
                {distinctStages.map(s => (
                  <FilterChip
                    key={s}
                    label={STAGE_LABEL[s] ?? s}
                    active={stageFilter === s}
                    onClick={() => setStageFilter(s)}
                  />
                ))}
              </>
            )}
          </>
        }
      />

      {!hasPlayers ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="No players yet"
          description="Add your first player or import a roster from a CSV file."
          action={
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Link
                href="/director/players/import"
                className="btn-lime flex items-center gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                Import roster
              </Link>
              <Link
                href="/director/players/new"
                className="btn-ghost flex items-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add player
              </Link>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="w-5 h-5" />}
          title="No players match"
          description="Try a different name or filter."
        />
      ) : (
        /* Sprint 820: data-donna-focus-id for DONNA player-list highlight */
        <div className="table-card" data-donna-focus-id="player-list">
          <ul style={{ '--divide-color': 'var(--border-subtle)' } as React.CSSProperties}>
            {filtered.map((player, idx) => {
              if (!player.player_id) return null
              const badge = playerStatusBadge(player.player_status)
              const nextDueOverdue = isOverdue(player.next_assessment_due)
              const isFirst = idx === 0
              const isLast = idx === filtered.length - 1

              const curricEntry = player.player_id ? curriculumMap[player.player_id] : undefined

              return (
                <li key={player.player_id} style={!isFirst ? { borderTop: '1px solid var(--border-subtle)' } : {}}>
                  <Link
                    href={`/director/players/${player.player_id}`}
                    className={[
                      'flex items-center gap-4 px-5 py-4',
                      'transition-colors duration-100',
                      'hover:bg-surface-raised group',
                      isFirst ? 'rounded-t-2xl' : '',
                      isLast  ? 'rounded-b-2xl' : '',
                    ].join(' ')}
                  >
                    {/* Avatar */}
                    <Avatar name={player.full_name ?? '?'} size="md" />

                    {/* Name + status + coach */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-text-primary truncate">
                          {player.full_name ?? '—'}
                        </span>
                        <StatusBadge status={badge.status} label={badge.label} size="sm" />
                        {(curricEntry?.advancementEligible || player.promotion_ready) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-lime/10 border border-lime/30 text-lime">
                            <Zap className="w-3 h-3" />
                            Ready to advance
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {[player.group_name, player.coach_name ? `Coach: ${player.coach_name}` : null]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                    </div>

                    {/* Curriculum level badge — prefers new system, falls back to old */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-40">
                      {curricEntry ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STAGE_COLOR[curricEntry.stage] ?? 'text-text-muted border-border bg-surface-raised'}`}>
                            {STAGE_LABEL[curricEntry.stage] ?? curricEntry.stage}
                          </span>
                          <span className="text-[10px] text-text-secondary text-right leading-snug">
                            {curricEntry.levelName}
                          </span>
                        </div>
                      ) : player.current_track ? (
                        <LevelBadge
                          stage={player.current_track}
                          levelName={player.level_label ?? undefined}
                          size="sm"
                        />
                      ) : (
                        <span className="text-xs text-text-muted">No level</span>
                      )}
                    </div>

                    {/* Assessment context — hidden on small screens */}
                    <div className="hidden md:flex flex-col items-end gap-1 shrink-0 w-44 text-right">
                      {player.overall_score !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-bold text-text-primary">{player.overall_score}</span>
                          {player.score_delta !== null && player.score_delta !== 0 && (
                            <span className={`text-[10px] font-semibold ${player.score_delta > 0 ? 'text-status-green' : 'text-status-red'}`}>
                              {player.score_delta > 0 ? '+' : ''}{player.score_delta}
                            </span>
                          )}
                        </div>
                      ) : null}
                      {player.last_assessed_at ? (
                        <span className="text-xs text-text-muted">
                          {formatRelativeDate(player.last_assessed_at)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Never assessed</span>
                      )}
                      {player.next_assessment_due && nextDueOverdue ? (
                        <span className="text-[11px] text-status-red font-medium">
                          Due {formatDate(player.next_assessment_due)} · overdue
                        </span>
                      ) : player.next_assessment_due ? (
                        <span className="text-[11px] text-text-muted">
                          Due {formatDate(player.next_assessment_due)}
                        </span>
                      ) : null}
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-text-muted text-right">
          {filtered.length} {filtered.length === 1 ? 'player' : 'players'}
          {statusFilter !== 'all' || search ? ` · filtered from ${players.length}` : ''}
        </p>
      )}
    </div>
  )
}
