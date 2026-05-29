// Sprint 926 — Coach Daily Brief + Session Execution V1
// Pre-session brief card for the coach home page.
// Shows next session details, player watch-fors, coaching focus, and CTA.
// Mobile-first, low cognitive load.

import Link from 'next/link'
import { Calendar, ArrowRight, Eye, Target, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

interface SessionBrief {
  id: string
  name: string | null
  scheduledTime: string | null
  groupName: string | null
  blockCount: number
  curriculumFocus: string | null
  watchFors: Array<{ playerName: string; focus: string }>
}

interface Props {
  nextSession: SessionBrief | null
  totalToday: number
}

function formatTime(time: string | null): string {
  if (!time) return ''
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return time.slice(0, 5)
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`
}

export function CoachDailyBriefCard({ nextSession, totalToday }: Props) {
  if (!nextSession) {
    return (
      <Card>
        <CardContent className="py-5 text-center space-y-1">
          <p className="text-sm text-text-secondary">No sessions scheduled for today.</p>
          <p className="text-[11px] text-text-muted">Your director will add sessions when ready.</p>
        </CardContent>
      </Card>
    )
  }

  const time = formatTime(nextSession.scheduledTime)

  return (
    <div className="rounded-2xl border border-lime/15 bg-lime/3 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-widest font-semibold text-lime/70 mb-0.5">
            Next Session
            {totalToday > 1 && ` · ${totalToday} today`}
          </p>
          <p className="text-base font-bold text-text-primary leading-snug truncate">
            {nextSession.name ?? 'Unnamed Session'}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-text-muted">
            {time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {time}
              </span>
            )}
            {nextSession.groupName && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {nextSession.groupName}
              </span>
            )}
            {nextSession.blockCount > 0 && (
              <span>{nextSession.blockCount} block{nextSession.blockCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <Link
          href={`/coach/sessions/${nextSession.id}`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-lime bg-lime/10 border border-lime/20 hover:bg-lime/20 transition-colors shrink-0 whitespace-nowrap"
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Curriculum focus */}
      {nextSession.curriculumFocus && (
        <div className="px-4 py-2 border-t border-lime/10">
          <div className="flex items-start gap-2">
            <Target className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-snug">
              <span className="font-medium text-text-primary">Focus: </span>
              {nextSession.curriculumFocus}
            </p>
          </div>
        </div>
      )}

      {/* Player watch-fors */}
      {nextSession.watchFors.length > 0 && (
        <div className="px-4 py-2 border-t border-lime/10 space-y-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Eye className="w-3.5 h-3.5 text-status-orange shrink-0" />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-status-orange">Watch For</p>
          </div>
          {nextSession.watchFors.slice(0, 3).map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-status-orange shrink-0 mt-1.5" />
              <p className="text-xs text-text-secondary leading-snug">
                <span className="font-medium text-text-primary">{w.playerName}: </span>
                {w.focus}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Session action CTA */}
      <div className="px-4 py-3 border-t border-lime/10 flex items-center gap-2">
        <Link
          href={`/coach/sessions/${nextSession.id}/execute`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-lime text-black hover:opacity-90 transition-opacity"
        >
          Start Session
          <ArrowRight className="w-3 h-3" />
        </Link>
        <Link
          href={`/coach/sessions/${nextSession.id}`}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-text-muted border border-border hover:border-lime/20 transition-colors"
        >
          Details
        </Link>
      </div>
    </div>
  )
}
