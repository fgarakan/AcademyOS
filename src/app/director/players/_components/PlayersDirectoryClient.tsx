'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Users, Search, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LevelBadge } from '@/components/ui/LevelBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchFilterBar } from '@/components/ui/SearchFilterBar'
import { FilterChip } from '@/components/ui/SearchFilterBar'
import { formatRelativeDate, formatDate } from '@/lib/utils'
import type { VPlayerSummary } from '@/lib/backend/players'

type StatusBadgeStatus = 'action_needed' | 'needs_attention' | 'check_in' | 'on_track' | 'complete' | 'building' | 'warning' | 'info'
type StatusFilter = 'all' | 'active' | 'reassessment_due' | 'on_hold' | 'pending'

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

interface Props {
  players: VPlayerSummary[]
}

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',               label: 'All' },
  { key: 'active',            label: 'Active' },
  { key: 'reassessment_due',  label: 'Reassessment due' },
  { key: 'on_hold',           label: 'On hold' },
  { key: 'pending',           label: 'Pending' },
]

export function PlayersDirectoryClient({ players }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

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

      return matchesName && matchesStatus
    })
  }, [players, search, statusFilter])

  const hasPlayers = players.length > 0

  return (
    <div className="space-y-4">
      <SearchFilterBar
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
          </>
        }
      />

      {!hasPlayers ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="No players yet"
          description="Players will appear here once they are added to the academy."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="w-5 h-5" />}
          title="No players match"
          description="Try a different name or filter."
        />
      ) : (
        <div className="table-card">
          <ul style={{ '--divide-color': 'var(--border-subtle)' } as React.CSSProperties}>
            {filtered.map((player, idx) => {
              if (!player.player_id) return null
              const badge = playerStatusBadge(player.player_status)
              const nextDueOverdue = isOverdue(player.next_assessment_due)
              const isFirst = idx === 0
              const isLast = idx === filtered.length - 1

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
                        {player.promotion_ready && (
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

                    {/* Level badge — hidden on small screens */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-36">
                      {player.current_track ? (
                        <LevelBadge
                          stage={player.current_track}
                          levelName={player.level_label ?? undefined}
                          size="sm"
                        />
                      ) : (
                        <span className="text-xs text-text-muted">No level</span>
                      )}
                    </div>

                    {/* Assessment dates — hidden on small screens */}
                    <div className="hidden md:flex flex-col items-end gap-1 shrink-0 w-40 text-right">
                      {player.last_assessed_at ? (
                        <span className="text-xs text-text-secondary">
                          Last: {formatRelativeDate(player.last_assessed_at)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Never assessed</span>
                      )}
                      {player.next_assessment_due ? (
                        <span className={[
                          'text-xs',
                          nextDueOverdue ? 'text-status-red font-medium' : 'text-text-muted',
                        ].join(' ')}>
                          Due: {formatDate(player.next_assessment_due)}
                          {nextDueOverdue && ' · overdue'}
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
