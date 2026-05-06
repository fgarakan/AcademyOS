'use client'

import { useState, useTransition } from 'react'
import { Link2, Link2Off, User, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { linkPlayerPortalAction, unlinkPlayerPortalAction } from './playerPortalLinkAction'

interface Props {
  playerId: string
  linkedProfileId: string | null
  linkedProfileEmail?: string | null
  linkedProfileName?: string | null
}

export function PlayerPortalLinkPanel({
  playerId,
  linkedProfileId,
  linkedProfileEmail,
  linkedProfileName,
}: Props) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLinked, setIsLinked] = useState(!!linkedProfileId)
  const [currentEmail, setCurrentEmail] = useState(linkedProfileEmail ?? null)
  const [currentName, setCurrentName] = useState(linkedProfileName ?? null)
  const [isPending, startTransition] = useTransition()

  function handleLink() {
    if (!email.trim()) return
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await linkPlayerPortalAction(playerId, email.trim())
      if (res.ok) {
        setIsLinked(true)
        setCurrentEmail(email.trim())
        setCurrentName(null)
        setEmail('')
        setSuccess(true)
      } else {
        setError(res.error ?? 'Failed to link account.')
      }
    })
  }

  function handleUnlink() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await unlinkPlayerPortalAction(playerId)
      if (res.ok) {
        setIsLinked(false)
        setCurrentEmail(null)
        setCurrentName(null)
        setSuccess(false)
      } else {
        setError(res.error ?? 'Failed to unlink account.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <p className="label-xs flex items-center gap-1.5">
          <User className="w-3 h-3" /> Player Portal Access
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {isLinked ? (
          <>
            <div className="flex items-start gap-2 p-2 rounded bg-surface-raised border border-status-green/20">
              <Link2 className="w-3.5 h-3.5 text-status-green shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-status-green font-medium">Portal linked</p>
                {currentName && (
                  <p className="text-[11px] text-text-secondary truncate">{currentName}</p>
                )}
                {currentEmail && (
                  <p className="text-[11px] text-text-muted truncate">{currentEmail}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-1.5 p-2 rounded bg-surface-raised border border-border">
              <AlertTriangle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[10px] text-text-muted leading-snug">
                This controls which account can access the player portal. Only remove if the link is incorrect.
              </p>
            </div>
            <button
              onClick={handleUnlink}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs text-status-red hover:text-status-red/80 transition-colors disabled:opacity-50"
            >
              <Link2Off className="w-3 h-3" />
              {isPending ? 'Removing…' : 'Remove portal link'}
            </button>
          </>
        ) : (
          <>
            <p className="text-[11px] text-text-muted leading-snug">
              Link a player account by email so they can access the player portal. The account must already exist.
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="player@email.com"
              className="w-full bg-surface-raised border border-border rounded px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50"
            />
            {error && <p className="text-[11px] text-status-red">{error}</p>}
            {success && <p className="text-[11px] text-status-green">Portal linked successfully.</p>}
            <button
              onClick={handleLink}
              disabled={isPending || !email.trim()}
              className="btn-lime text-xs px-3 py-1.5 w-full disabled:opacity-50"
            >
              {isPending ? 'Linking…' : 'Link account'}
            </button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
