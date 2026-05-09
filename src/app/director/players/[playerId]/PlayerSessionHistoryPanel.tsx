import { CalendarDays, MessageSquare } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { CoachObservationsFeed, type CoachObservationRow } from './CoachObservationsFeed'

export interface AttendanceHistoryItem {
  sessionId: string
  sessionName: string | null
  sessionDate: string
  attendanceStatus: string
  blockCount: number
  observationCount: number
}

interface Props {
  attendanceItems: AttendanceHistoryItem[]
  observations: CoachObservationRow[]
}

const STATUS_PILL: Record<string, string> = {
  present: 'text-status-green bg-status-green/10 border-status-green/25',
  absent:  'text-status-red bg-status-red/10 border-status-red/25',
  late:    'text-status-orange bg-status-orange/10 border-status-orange/25',
  excused: 'text-status-blue bg-status-blue/10 border-status-blue/25',
  unknown: 'text-text-muted bg-surface-raised border-border',
}

const STATUS_LABEL: Record<string, string> = {
  present: 'Present',
  absent:  'Absent',
  late:    'Late',
  excused: 'Excused',
  unknown: 'Unknown',
}

export function PlayerSessionHistoryPanel({ attendanceItems, observations }: Props) {
  const presentCount = attendanceItems.filter(a => a.attendanceStatus === 'present').length
  const absentOrLateCount = attendanceItems.filter(
    a => a.attendanceStatus === 'absent' || a.attendanceStatus === 'late'
  ).length
  const wrapUpCount = observations.filter(
    o => (o.ai_entities as Record<string, unknown> | null)?.source === 'coach_wrap_up'
  ).length

  return (
    <div className="space-y-5">
      <p className="text-[10px] text-text-muted px-1">
        Internal director/coach view. Raw coach observations are not shown to parents or players. No records are changed by viewing this panel.
      </p>

      {/* Summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'Sessions (60d)', value: attendanceItems.length, color: 'text-text-primary' },
          { label: 'Present',        value: presentCount,            color: 'text-status-green' },
          { label: 'Absent / Late',  value: absentOrLateCount,       color: 'text-status-red' },
          { label: 'Coach Notes',    value: observations.length,     color: 'text-lime' },
        ] as const).map(({ label, value, color }) => (
          <div key={label} className="bg-surface-raised rounded-xl border border-border p-3 text-center">
            <p className={`text-xl font-mono font-bold ${color}`}>{value}</p>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Attendance section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <p className="label-xs">Session Attendance — Last 60 Days</p>
            {attendanceItems.length > 0 && (
              <span className="text-[10px] text-text-muted font-mono">{attendanceItems.length} recorded</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {attendanceItems.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="w-5 h-5" />}
              title="No session attendance recorded"
              description="No attendance has been recorded for this player in the last 60 days. Attendance records appear here after a coach saves roster attendance from the session page. Unexpected attendee exceptions appear here once a director approves them from the review queue."
            />
          ) : (
            <div className="divide-y divide-border/50">
              {attendanceItems.map(item => {
                const pillClass = STATUS_PILL[item.attendanceStatus] ?? STATUS_PILL['unknown']
                const pillLabel = STATUS_LABEL[item.attendanceStatus] ?? item.attendanceStatus
                return (
                  <div key={item.sessionId} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs text-text-primary truncate">
                        {item.sessionName ?? 'Unnamed Session'}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {new Date(item.sessionDate).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                        {item.blockCount > 0 && (
                          <> · {item.blockCount} block{item.blockCount !== 1 ? 's' : ''}</>
                        )}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${pillClass}`}>
                      {pillLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coach observations section — applied records only, no pending/rejected drafts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <p className="label-xs">Coach Observations — Applied Only</p>
            {observations.length > 0 && (
              <div className="flex items-center gap-2">
                {wrapUpCount > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-status-green/10 text-status-green border-status-green/20">
                    {wrapUpCount} from wrap-up
                  </span>
                )}
                <span className="text-[10px] text-text-muted font-mono">{observations.length} total</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {observations.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-5 h-5" />}
              title="No coach observations applied"
              description="Coach observations appear here once a director applies an observation draft from the review queue. Pending or rejected drafts are not shown."
            />
          ) : (
            <CoachObservationsFeed observations={observations} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
