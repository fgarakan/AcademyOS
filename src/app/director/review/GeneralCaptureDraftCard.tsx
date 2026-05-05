'use client'

import { useState, useTransition } from 'react'
import { Clock, MapPin, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { dismissGeneralCaptureAction, routeGeneralCaptureToPlayerAction } from '@/lib/actions/capture'

export interface PlayerOption {
  id: string
  full_name: string | null
  first_name: string
  last_name: string
}

export interface GeneralCaptureItem {
  id: string
  content: string
  createdAt: string
  authorName: string | null
  academyId: string
}

interface Props {
  capture: GeneralCaptureItem
  players: PlayerOption[]
}

type CardState = 'idle' | 'routing' | 'routed' | 'dismissed'

export function GeneralCaptureDraftCard({ capture, players }: Props) {
  const [cardState, setCardState] = useState<CardState>('idle')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (cardState === 'dismissed' || cardState === 'routed') return null

  function handleDismiss() {
    setError(null)
    startTransition(async () => {
      try {
        await dismissGeneralCaptureAction(capture.id, capture.academyId)
        setCardState('dismissed')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to dismiss')
      }
    })
  }

  function handleRoute() {
    if (!selectedPlayerId) return
    setError(null)
    startTransition(async () => {
      try {
        await routeGeneralCaptureToPlayerAction(capture.id, capture.academyId, selectedPlayerId)
        setCardState('routed')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to route capture')
      }
    })
  }

  const selectedPlayer = players.find(p => p.id === selectedPlayerId)
  const playerLabel = selectedPlayer
    ? (selectedPlayer.full_name ?? `${selectedPlayer.first_name} ${selectedPlayer.last_name}`)
    : null

  const date = new Date(capture.createdAt)
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const timeLabel = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <Card>
      <CardContent className="py-4 space-y-3">

        {/* Meta row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="label-xs text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {dateLabel} · {timeLabel}
            </span>
            {capture.authorName && (
              <span className="label-xs text-text-muted">{capture.authorName}</span>
            )}
          </div>
          <span className="label-xs px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-muted">
            Unrouted
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
          {capture.content}
        </p>

        {error && <p className="text-xs text-status-red">{error}</p>}

        {/* Route panel */}
        {cardState === 'routing' ? (
          <div className="rounded-lg bg-surface-raised border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="label-xs text-lime">Route to Player</span>
              <button
                type="button"
                onClick={() => { setCardState('idle'); setSelectedPlayerId(''); setError(null) }}
                disabled={isPending}
                className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                aria-label="Cancel routing"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              disabled={isPending}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime disabled:opacity-50"
            >
              <option value="">Select a player…</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? `${p.first_name} ${p.last_name}`}
                </option>
              ))}
            </select>

            <p className="text-[11px] text-text-muted">
              Creates an internal coach observation on the selected player's profile. Internal only — not visible to parents or players.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRoute}
                disabled={!selectedPlayerId || isPending}
                className="btn-lime text-sm px-4 py-1.5 disabled:opacity-40"
              >
                {isPending
                  ? 'Routing…'
                  : playerLabel
                  ? `Route to ${playerLabel}`
                  : 'Route to Player'}
              </button>
            </div>
          </div>
        ) : (
          /* Default actions row */
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCardState('routing')}
              disabled={isPending || players.length === 0}
              className="flex items-center gap-1.5 text-xs border border-border rounded px-3 py-1.5 text-text-secondary hover:border-lime hover:text-lime transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MapPin className="w-3 h-3" />
              {players.length === 0 ? 'No active players' : 'Route to Player'}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              disabled={isPending}
              className="text-xs text-text-muted hover:text-status-red transition-colors disabled:opacity-50 ml-auto"
            >
              {isPending ? 'Dismissing…' : 'Dismiss'}
            </button>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
