interface Session {
  status: string
}

interface Props {
  sessions: Session[]
  maxDots?: number
  className?: string
}

function dotClass(status: string): string {
  switch (status) {
    case 'present': return 'bg-status-green'
    case 'late':    return 'bg-status-orange'
    case 'excused': return 'bg-status-blue'
    case 'absent':  return 'bg-surface-raised border border-border'
    default:        return 'bg-border'
  }
}

export function AttendanceSparkline({ sessions, maxDots = 20, className }: Props) {
  const dots = sessions.slice(-maxDots)
  if (dots.length === 0) return null

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className ?? ''}`}>
      {dots.map((s, i) => (
        <span
          key={i}
          title={s.status}
          className={`inline-block w-2.5 h-2.5 rounded-sm transition-colors ${dotClass(s.status)}`}
        />
      ))}
    </div>
  )
}
