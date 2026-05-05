'use client'

import { useState, useTransition } from 'react'
import { Clock, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { dismissGeneralCaptureAction } from '@/lib/actions/capture'

export interface GeneralCaptureItem {
  id: string
  content: string
  createdAt: string
  authorName: string | null
  academyId: string
}

interface Props {
  capture: GeneralCaptureItem
}

export function GeneralCaptureDraftCard({ capture }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (dismissed) return null

  function handleDismiss() {
    setError(null)
    startTransition(async () => {
      try {
        await dismissGeneralCaptureAction(capture.id, capture.academyId)
        setDismissed(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to dismiss')
      }
    })
  }

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

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            disabled
            title="Route to player coming in Sprint 5"
            className="flex items-center gap-1.5 text-xs text-text-muted border border-border rounded px-3 py-1.5 opacity-40 cursor-not-allowed select-none"
          >
            <MapPin className="w-3 h-3" />
            Route to Player — coming soon
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

      </CardContent>
    </Card>
  )
}
