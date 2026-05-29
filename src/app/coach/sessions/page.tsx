// Sprint 929 — Coach Sessions List Wrap-Up Status V1
// Replaced inline proposed_actions status query with loadWrapUpStatusMap (Sprint 928 helper).
// Aligned WrapUpBadge labels to Sprint 928 language.
// Added "Wrap-up needed" badge for completed sessions with no draft.

import Link from 'next/link'
import { Calendar, ChevronRight, CheckCircle2, ClipboardList } from 'lucide-react'
import {
  Card,
  CardContent,
  EmptyState,
  SectionHeader,
} from '@/components/ui'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCoachWorkspaceSummary } from '@/lib/backend/coachWorkspace'
import { formatDate } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/database.types'
import { loadWrapUpSessionSelector } from '@/lib/coach/wrapUpSessionSelector'
import type { WrapUpSessionSelectorResult } from '@/lib/coach/wrapUpSessionSelector'
import { loadWrapUpStatusMap, type WrapUpDisplayStatus } from '@/lib/coach/wrapUpStatusMap'
import { DonnaOpenChip } from '@/components/assistant/DonnaOpenChip'

type SessionRow = Pick<Tables<'sessions'>, 'id' | 'name' | 'scheduled_date' | 'scheduled_time' | 'status'>

const STATUS_STYLES: Record<string, string> = {
  in_progress: 'bg-lime/10 text-lime border-lime/30',
  completed:   'bg-status-green/10 text-status-green border-status-green/30',
  cancelled:   'bg-status-red/10 text-status-red border-status-red/30',
  planned:     'bg-surface-raised text-text-muted border-border',
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ')
}

export default async function CoachSessionsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let todaySessions: Tables<'sessions'>[] = []
  let upcomingSessions: SessionRow[] = []
  let recentCompleted: SessionRow[] = []
  let coachId: string | null = null
  let academyId: string | null = null
  let wrapUpStatusRecord: Record<string, WrapUpDisplayStatus> = {}
  let wrapUpSelector: WrapUpSessionSelectorResult = { needsWrapUp: [], alreadySubmitted: [], totalSessions: 0 }

  if (user) {
    try {
      const summary = await getCoachWorkspaceSummary(supabase, user.id)
      todaySessions = summary.todaySessions
      coachId = summary.profile?.id ?? null
      academyId = summary.profile?.academy_id ?? null
    } catch {
      // query failed — empty state renders
    }

    if (coachId) {
      const todayDate = new Date().toISOString().slice(0, 10)

      // Upcoming sessions (after today)
      const { data: upcoming } = await supabase
        .from('sessions')
        .select('id, name, scheduled_date, scheduled_time, status')
        .eq('coach_id', coachId)
        .gt('scheduled_date', todayDate)
        .not('status', 'eq', 'cancelled')
        .order('scheduled_date', { ascending: true })
        .limit(10)
      upcomingSessions = upcoming ?? []

      // Recent completed sessions
      const { data: completed } = await supabase
        .from('sessions')
        .select('id, name, scheduled_date, scheduled_time, status')
        .eq('coach_id', coachId)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false })
        .limit(8)
      recentCompleted = completed ?? []

      if (academyId) {
        // Wrap-up session selector (Sprint 526) — used for "WRAP-UPS NEEDED" banner
        wrapUpSelector = await loadWrapUpSessionSelector(supabase, coachId, academyId)

        // Sprint 929 — per-session wrap-up review status (replaces inline query)
        // Best-effort: page renders normally if this fails
        const sessionIds = [
          ...todaySessions.map(s => s.id),
          ...recentCompleted.map(s => s.id),
        ]
        if (sessionIds.length > 0) {
          try {
            wrapUpStatusRecord = await loadWrapUpStatusMap(supabase, sessionIds, academyId)
          } catch {
            // non-critical — badges stay hidden if status load fails
          }
        }
      }
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <p className="page-eyebrow">Sessions</p>
        <h1 className="page-title">Your Sessions</h1>
        <p className="text-text-muted text-sm mt-1">{today}</p>
      </div>

      {/* ── Wrap-Ups Needed — Sprint 526/652 ────────────────────── */}
      {/* Sprint 652: primary CTA is Ask DONNA; session link preserved as secondary. */}
      {wrapUpSelector.needsWrapUp.length > 0 && (
        <div>
          <SectionHeader title="WRAP-UPS NEEDED" />
          <div className="space-y-2">
            {wrapUpSelector.needsWrapUp.map(s => (
              <div
                key={s.sessionId}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-status-orange/30 bg-status-orange/5"
              >
                <Link
                  href={`/coach/sessions/${s.sessionId}`}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                >
                  <ClipboardList className="w-4 h-4 text-status-orange shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{s.sessionName}</p>
                    <p className="text-[11px] text-text-muted">{formatDate(s.scheduledDate)}{s.scheduledTime ? ` · ${s.scheduledTime.slice(0, 5)}` : ''}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <DonnaOpenChip prompt={`Help me wrap up: ${s.sessionName}`} />
                  <Link
                    href={`/coach/sessions/${s.sessionId}`}
                    className="text-xs text-text-muted hover:text-lime transition-colors flex items-center gap-0.5"
                  >
                    Open <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Today ────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="TODAY" />
        <div className="space-y-2">
          {todaySessions.length > 0 ? (
            todaySessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                primary
                wrapUpStatus={wrapUpStatusRecord[s.id]}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-10">
                <EmptyState
                  icon={<Calendar className="w-5 h-5" />}
                  title="Nothing on the court today"
                  description="Sessions scheduled for today will appear here. Check back if you're expecting one, or contact your director."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Upcoming ─────────────────────────────────────────── */}
      <div>
        <SectionHeader title="UPCOMING" />
        <Card>
          <CardContent className="py-2">
            {upcomingSessions.length > 0 ? (
              <ul className="divide-y divide-border">
                {upcomingSessions.map(s => (
                  <SessionRow key={s.id} session={s} showDate />
                ))}
              </ul>
            ) : (
              <div className="py-8">
                <EmptyState
                  icon={<Calendar className="w-5 h-5" />}
                  title="No upcoming sessions scheduled"
                  description="Future sessions will appear here as your director adds them to the schedule."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Completed ────────────────────────────────────────── */}
      {recentCompleted.length > 0 && (
        <div>
          <SectionHeader title="COMPLETED" />
          <Card>
            <CardContent className="py-2">
              <ul className="divide-y divide-border">
                {recentCompleted.map(s => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    showDate
                    wrapUpStatus={wrapUpStatusRecord[s.id]}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SessionCard — prominent card for Today's sessions
// ─────────────────────────────────────────────────────────────

function SessionCard({
  session,
  primary = false,
  wrapUpStatus,
}: {
  session: Pick<Tables<'sessions'>, 'id' | 'name' | 'scheduled_date' | 'scheduled_time' | 'status'>
  primary?: boolean
  wrapUpStatus?: WrapUpDisplayStatus
}) {
  const isActive = session.status === 'in_progress'
  const sessionCompleted = session.status === 'completed'
  return (
    <Link href={`/coach/sessions/${session.id}`} className="block">
      <div className={[
        'flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors',
        isActive
          ? 'border-lime/30 bg-lime/5 hover:bg-lime/10'
          : primary
            ? 'border-border bg-surface hover:border-lime/20'
            : 'border-border bg-surface hover:border-lime/20',
      ].join(' ')}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={[
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            isActive ? 'bg-lime/20' : 'bg-surface-raised border border-border',
          ].join(' ')}>
            <Calendar className={`w-4 h-4 ${isActive ? 'text-lime' : 'text-text-muted'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {session.name ?? 'Session'}
            </p>
            <p className="text-xs text-text-muted">
              {session.scheduled_time ? session.scheduled_time.slice(0, 5) : 'Time TBD'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <WrapUpBadge wrapUpStatus={wrapUpStatus} sessionCompleted={sessionCompleted} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[session.status] ?? STATUS_STYLES.planned}`}>
            {statusLabel(session.status)}
          </span>
          <span className="btn-lime text-xs px-3 py-1.5 flex items-center gap-1">
            Open
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────
// SessionRow — compact list item for Upcoming / Completed
// ─────────────────────────────────────────────────────────────

function SessionRow({
  session,
  showDate = false,
  wrapUpStatus,
}: {
  session: SessionRow
  showDate?: boolean
  wrapUpStatus?: WrapUpDisplayStatus
}) {
  const isCompleted = session.status === 'completed'
  return (
    <li>
      <Link
        href={`/coach/sessions/${session.id}`}
        className="flex items-center justify-between gap-2 py-3 group"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isCompleted && (
            <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate group-hover:text-lime transition-colors">
              {session.name ?? 'Session'}
            </p>
            <p className="text-xs text-text-muted">
              {showDate ? formatDate(session.scheduled_date) : (session.scheduled_time?.slice(0, 5) ?? null)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <WrapUpBadge wrapUpStatus={wrapUpStatus} sessionCompleted={isCompleted} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[session.status] ?? STATUS_STYLES.planned}`}>
            {statusLabel(session.status)}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors" />
        </div>
      </Link>
    </li>
  )
}

// ─────────────────────────────────────────────────────────────
// WrapUpBadge — compact inline status badge
// Sprint 929: aligned to Sprint 928 labels; added "Wrap-up needed"
// for completed sessions with no draft.
// ─────────────────────────────────────────────────────────────

const WRAP_UP_LABEL: Partial<Record<WrapUpDisplayStatus, string>> = {
  pending_review:       'Pending review',
  approved:             'Approved',
  executed:             'Applied',
  clarification_needed: 'Director has questions',
  rejected:             'Needs revision',
}

const WRAP_UP_STYLE: Partial<Record<WrapUpDisplayStatus, string>> = {
  pending_review:       'bg-status-blue/10 text-status-blue border-status-blue/30',
  approved:             'bg-status-green/10 text-status-green border-status-green/30',
  executed:             'bg-status-green/10 text-status-green border-status-green/30',
  clarification_needed: 'bg-status-orange/10 text-status-orange border-status-orange/30',
  rejected:             'bg-status-red/10 text-status-red border-status-red/30',
}

function WrapUpBadge({
  wrapUpStatus,
  sessionCompleted = false,
}: {
  wrapUpStatus?: WrapUpDisplayStatus
  sessionCompleted?: boolean
}) {
  // No draft (undefined or 'not_started'): only show badge for completed sessions
  if (!wrapUpStatus || wrapUpStatus === 'not_started') {
    if (!sessionCompleted) return null
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-status-orange/10 text-status-orange border-status-orange/30">
        Wrap-up needed
      </span>
    )
  }

  const label = WRAP_UP_LABEL[wrapUpStatus]
  const style = WRAP_UP_STYLE[wrapUpStatus]
  if (!label || !style) return null

  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style}`}>
      {label}
    </span>
  )
}
