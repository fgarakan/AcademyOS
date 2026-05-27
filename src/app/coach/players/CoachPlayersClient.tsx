'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Users, ArrowUpDown } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter, EmptyState } from '@/components/ui'

interface PlayerRow {
  player_id: string | null
  full_name: string | null
  group_name: string | null
  level_label: string | null
  level_number: number | null
  focus_areas: string[] | null
  last_assessed_at: string | null
  player_status: string | null
}

type SortKey = 'name' | 'group' | 'level' | 'assessed'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'group', label: 'Group' },
  { key: 'level', label: 'Level' },
  { key: 'assessed', label: 'Last assessed' },
]

function playerInitials(fullName: string | null): string {
  if (!fullName) return '?'
  const parts = fullName.trim().split(' ')
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
}

function sortPlayers(players: PlayerRow[], key: SortKey): PlayerRow[] {
  return [...players].sort((a, b) => {
    switch (key) {
      case 'name':
        return (a.full_name ?? '').localeCompare(b.full_name ?? '')
      case 'group':
        return (a.group_name ?? '').localeCompare(b.group_name ?? '')
      case 'level':
        return (b.level_number ?? 0) - (a.level_number ?? 0)
      case 'assessed':
        if (!a.last_assessed_at && !b.last_assessed_at) return 0
        if (!a.last_assessed_at) return 1
        if (!b.last_assessed_at) return -1
        return new Date(b.last_assessed_at).getTime() - new Date(a.last_assessed_at).getTime()
    }
  })
}

function formatAssessedDate(iso: string | null): string {
  if (!iso) return 'Not assessed'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function CoachPlayersClient({ players }: { players: PlayerRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('name')

  const sorted = sortPlayers(players, sortKey)

  return (
    <div className="space-y-6" data-donna-focus-id="coach-player-list">
      <div>
        <p className="page-eyebrow">Your Players</p>
        <h1 className="page-title">My Players</h1>
        <p className="text-text-muted text-sm mt-1">Players assigned to your groups will appear here.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">My Players</p>
                <p className="text-text-muted text-xs">Filtered to your assigned groups</p>
              </div>
            </div>
            {players.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface-raised text-text-muted border border-border shrink-0">
                {players.length} {players.length === 1 ? 'player' : 'players'}
              </span>
            )}
          </div>

          {players.length > 1 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <ArrowUpDown className="w-3 h-3 text-text-muted shrink-0" />
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                    sortKey === opt.key
                      ? 'bg-lime/10 text-lime border-lime/30 font-semibold'
                      : 'text-text-muted border-border hover:text-text-secondary hover:border-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {sorted.length > 0 ? (
            <ul className="divide-y divide-border">
              {sorted.map((p, i) => {
                const initials = playerInitials(p.full_name)
                return (
                  <li key={p.player_id ?? i}>
                    <Link
                      href={p.player_id ? `/coach/players/${p.player_id}` : '#'}
                      className="flex items-start gap-3 py-3 hover:bg-surface-raised transition-colors rounded-lg px-1 -mx-1 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-text-secondary">{initials}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-lime transition-colors">
                          {p.full_name ?? '—'}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-text-muted">
                          {p.group_name && <span>{p.group_name}</span>}
                          {p.level_label && <span>{p.level_label}</span>}
                          {!p.group_name && !p.level_label && <span>No group or level</span>}
                        </div>
                        {p.focus_areas && p.focus_areas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.focus_areas.slice(0, 3).map((fa, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-lime/5 text-lime border border-lime/15"
                              >
                                {fa}
                              </span>
                            ))}
                            {p.focus_areas.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-raised text-text-muted border border-border">
                                +{p.focus_areas.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        {sortKey === 'assessed' && (
                          <p className="text-[10px] text-text-muted mt-1">
                            {formatAssessedDate(p.last_assessed_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mt-1">
                        {p.player_status && (
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            p.player_status === 'active'
                              ? 'bg-status-green/10 text-status-green border-status-green/30'
                              : p.player_status === 'pending_placement'
                              ? 'bg-status-orange/10 text-status-orange border-status-orange/30'
                              : 'bg-surface-raised text-text-muted border-border'
                          }`}>
                            {p.player_status.replace(/_/g, ' ')}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors" />
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              icon={<Users className="w-5 h-5" />}
              title="No players assigned yet"
              description="Players will appear here once you are assigned to a group in the platform."
              className="py-10"
            />
          )}
        </CardContent>

        <CardFooter>
          <p className="text-text-muted text-xs">Tap a player to view their development snapshot and recent observations.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
