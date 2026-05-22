'use client'

import { useState, useTransition } from 'react'
import { GraduationCap, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { requestPrivateLessonAction } from './requestPrivateLessonAction'

interface Props {
  playerId: string
  playerFirstName: string
}

export function PrivateLessonRequestCard({ playerId, playerFirstName }: Props) {
  const [preferredDay, setPreferredDay] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [focusArea, setFocusArea] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)
  const [isPending, startTransition] = useTransition()

  const submitted = result?.ok === true

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await requestPrivateLessonAction({
        playerId,
        playerName: playerFirstName,
        preferredDay,
        preferredTime,
        focusArea,
        additionalNotes,
      })
      setResult(res)
    })
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-status-green/10 border border-status-green/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-status-green" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-text-primary">Request sent</p>
            <p className="text-xs text-text-muted">
              Your private lesson request has been sent to the academy. Your coach or director will follow up.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm">Request a Private Lesson</p>
            <p className="text-text-muted text-xs">Send a request to your coaching team</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
              Preferred Day <span className="text-status-red">*</span>
            </label>
            <select
              value={preferredDay}
              onChange={e => setPreferredDay(e.target.value)}
              required
              disabled={isPending}
              className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
            >
              <option value="">Select a day</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
              <option value="flexible">Any day — flexible</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
              Preferred Time (optional)
            </label>
            <select
              value={preferredTime}
              onChange={e => setPreferredTime(e.target.value)}
              disabled={isPending}
              className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary focus:outline-none focus:border-lime/40 disabled:opacity-50"
            >
              <option value="">No preference</option>
              <option value="morning">Morning (before noon)</option>
              <option value="afternoon">Afternoon (noon – 5pm)</option>
              <option value="evening">Evening (after 5pm)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
              What to focus on <span className="text-status-red">*</span>
            </label>
            <textarea
              value={focusArea}
              onChange={e => setFocusArea(e.target.value)}
              required
              disabled={isPending}
              rows={3}
              placeholder={`What would you like ${playerFirstName} to work on in this lesson?`}
              className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 resize-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
              Additional notes (optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              disabled={isPending}
              rows={2}
              placeholder="Any scheduling constraints or context for the coaching team?"
              className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 resize-none disabled:opacity-50"
            />
          </div>

          {result?.ok === false && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-red/10 border border-status-red/30 text-xs text-status-red">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {result.error ?? 'Something went wrong. Please try again.'}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full btn-lime disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Sending…' : 'Send Request'}
          </button>

          <p className="text-[10px] text-text-muted leading-relaxed">
            This sends a request to your coaching team for review. It does not automatically schedule a session.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
