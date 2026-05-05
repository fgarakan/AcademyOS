import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, HelpCircle, Eye, MessageSquare, ExternalLink, Info } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'

interface TimelineItem {
  sessionId: string
  sessionName: string | null
  sessionDate: string
  attendanceStatus: string
  blockCount: number
  observationCount: number
}

function AttendancePill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    present: 'bg-status-green/10 text-status-green border-status-green/20',
    late: 'bg-status-orange/10 text-status-orange border-status-orange/20',
    absent: 'bg-status-red/10 text-status-red border-status-red/20',
    excused: 'bg-status-blue/10 text-status-blue border-status-blue/20',
  }
  const icons: Record<string, React.ReactNode> = {
    present: <CheckCircle2 className="w-2.5 h-2.5" />,
    late: <Clock className="w-2.5 h-2.5" />,
    absent: <XCircle className="w-2.5 h-2.5" />,
    excused: <HelpCircle className="w-2.5 h-2.5" />,
  }
  const style = styles[status] ?? 'bg-surface-raised text-text-muted border-border'
  const icon = icons[status] ?? null
  return (
    <span className={`flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${style}`}>
      {icon}
      {status}
    </span>
  )
}

function ExposureInference({ status, blockCount }: { status: string; blockCount: number }) {
  if (status === 'absent' || status === 'excused') {
    return (
      <span className="text-[10px] text-status-red">
        Possible missed exposure · {blockCount > 0 ? `${blockCount} planned block${blockCount > 1 ? 's' : ''}` : 'blocks unknown'}
      </span>
    )
  }
  if (status === 'present' || status === 'late') {
    return (
      <span className="text-[10px] text-status-green">
        Likely exposed · {blockCount > 0 ? `${blockCount} block${blockCount > 1 ? 's' : ''}` : 'block data unknown'}
      </span>
    )
  }
  return (
    <span className="text-[10px] text-text-muted">
      Attendance not confirmed — exposure unknown
    </span>
  )
}

interface Props {
  items: TimelineItem[]
  playerId: string
}

export function PlayerTrainingExposureTimeline({ items, playerId: _playerId }: Props) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center space-y-1">
          <Eye className="w-4 h-4 text-text-muted mx-auto" />
          <p className="text-sm text-text-muted">No session attendance recorded in the last 60 days.</p>
          <p className="text-xs text-text-muted">Timeline appears once attendance is marked for this player.</p>
        </CardContent>
      </Card>
    )
  }

  const presentCount = items.filter(i => i.attendanceStatus === 'present' || i.attendanceStatus === 'late').length
  const absentCount = items.filter(i => i.attendanceStatus === 'absent').length
  const excusedCount = items.filter(i => i.attendanceStatus === 'excused').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="label-xs">Training Exposure — Last 60 Days</p>
          <div className="flex flex-wrap gap-3 text-[10px] text-text-muted">
            <span className="text-status-green">{presentCount} attended</span>
            {absentCount > 0 && <span className="text-status-red">{absentCount} absent</span>}
            {excusedCount > 0 && <span className="text-status-blue">{excusedCount} excused</span>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {items.map(item => (
          <div
            key={item.sessionId}
            className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-surface-raised border border-border"
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-medium text-text-primary truncate">
                  {item.sessionName ?? 'Session'}
                </p>
                <AttendancePill status={item.attendanceStatus} />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-[10px] text-text-muted">
                  {formatDate(item.sessionDate)}
                </span>
                <ExposureInference status={item.attendanceStatus} blockCount={item.blockCount} />
                {item.observationCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-status-blue">
                    <MessageSquare className="w-2.5 h-2.5" />
                    {item.observationCount} note{item.observationCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/director/sessions/${item.sessionId}`}
              className="shrink-0 flex items-center gap-1 text-[10px] text-text-muted hover:text-lime transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        ))}

        {/* V1 note */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[10px] text-text-muted mt-2">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            Exposure is inferred from attendance + session block count. No official exposure records are created.
            Curriculum context per session requires the Planned vs Actual panel on the session detail page.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
