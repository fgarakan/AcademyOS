import React from 'react'

export interface PlayerIntelligenceItem {
  playerId: string
  fullName: string
  attendanceStatus: 'present' | 'absent' | 'late' | 'excused' | null
  curriculumLevelName: string | null
  curriculumStage: string | null
  curriculumSource: string | null
  strengths: string[]
  thingsToWorkOn: string[]
  developmentFocus: string | null
  topPriority: string | null
}

export function ClassRosterIntelligencePanel({ players }: { players: PlayerIntelligenceItem[] }) {
  if (players.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-text-muted">No players in this group.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {players.map(player => (
        <PlayerIntelligenceCard key={player.playerId} player={player} />
      ))}
    </div>
  )
}

function PlayerIntelligenceCard({ player }: { player: PlayerIntelligenceItem }) {
  const hasDevelopmentData =
    player.strengths.length > 0 ||
    player.thingsToWorkOn.length > 0 ||
    !!player.topPriority ||
    !!player.developmentFocus

  return (
    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
      {/* Player header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{player.fullName}</p>
          {player.curriculumLevelName ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-text-muted">{player.curriculumLevelName}</p>
              {player.curriculumSource && (
                <span className="text-[9px] text-text-muted">· {player.curriculumSource}</span>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-text-muted mt-0.5 italic">No curriculum assignment</p>
          )}
        </div>
        <RosterAttendancePill status={player.attendanceStatus} />
      </div>

      {/* Development data */}
      {hasDevelopmentData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1.5">Strengths</p>
            {player.strengths.length > 0 ? (
              <ul className="space-y-0.5">
                {player.strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-[11px] text-text-secondary flex items-start gap-1.5">
                    <span className="shrink-0 mt-1 w-1 h-1 rounded-full bg-status-green" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[10px] text-text-muted italic">No strengths recorded</p>
            )}
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1.5">Focus Areas</p>
            {player.thingsToWorkOn.length > 0 ? (
              <ul className="space-y-0.5">
                {player.thingsToWorkOn.slice(0, 3).map((t, i) => (
                  <li key={i} className="text-[11px] text-text-secondary flex items-start gap-1.5">
                    <span className="shrink-0 mt-1 w-1 h-1 rounded-full bg-status-orange" />
                    {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[10px] text-text-muted italic">No focus areas recorded</p>
            )}
          </div>

          {player.topPriority && (
            <div className="sm:col-span-2">
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Current Priority</p>
              <p className="text-[11px] text-text-secondary">{player.topPriority}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-text-muted italic pt-2 border-t border-border">
          No development data recorded for this player.
        </p>
      )}
    </div>
  )
}

function RosterAttendancePill({ status }: { status: 'present' | 'absent' | 'late' | 'excused' | null }) {
  if (!status) {
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface text-text-muted border border-border">
        —
      </span>
    )
  }
  const styles: Record<string, string> = {
    present: 'bg-status-green/10 text-status-green border-status-green/30',
    absent: 'bg-status-red/10 text-status-red border-status-red/30',
    late: 'bg-status-orange/10 text-status-orange border-status-orange/30',
    excused: 'bg-status-blue/10 text-status-blue border-status-blue/30',
  }
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  )
}
