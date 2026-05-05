import { CheckCircle2, XCircle, HelpCircle, Info, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import {
  deriveSessionExposureCandidates,
  type PlayerExposureCandidate,
} from '@/lib/curriculum/exposureTracking'
import type { SessionActualDraftPayload } from '@/app/coach/sessions/[sessionId]/saveWrapUpDraftAction'

interface AttendingPlayer {
  playerId: string
  playerName: string
  attendanceStatus: string | null
}

interface PlannedBlock {
  id: string
  name: string
  type: string
  duration_min: number | null
}

interface Props {
  players: AttendingPlayer[]
  blocks: PlannedBlock[]
  wrapUpPayload: SessionActualDraftPayload | null
}

function ConfidencePill({ confidence }: { confidence: PlayerExposureCandidate['confidence'] }) {
  if (confidence === 'likely') {
    return (
      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-status-green/10 text-status-green border border-status-green/20">
        likely exposed
      </span>
    )
  }
  if (confidence === 'missed') {
    return (
      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-status-red/10 text-status-red border border-status-red/20">
        possible gap
      </span>
    )
  }
  return (
    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-surface-raised text-text-muted border border-border">
      unknown
    </span>
  )
}

export function SessionExposureSummaryPanel({ players, blocks, wrapUpPayload }: Props) {
  if (players.length === 0 || blocks.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-text-muted text-sm">
            {players.length === 0
              ? 'No roster data available for exposure tracking.'
              : 'No session blocks available for exposure tracking.'}
          </p>
          <p className="text-text-muted text-xs mt-1">
            Assign a group and generate session blocks to enable this panel.
          </p>
        </CardContent>
      </Card>
    )
  }

  const candidates = deriveSessionExposureCandidates(
    players,
    blocks,
    wrapUpPayload?.block_completion ?? null
  )

  const likelyCount = candidates.filter(c => c.confidence === 'likely').length
  const missedCount = candidates.filter(c => c.confidence === 'missed').length
  const unknownCount = candidates.filter(c => c.confidence === 'possible').length

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex flex-wrap gap-4 px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Players</p>
          <p className="text-xs font-mono font-bold text-text-primary">{candidates.length}</p>
        </div>
        {likelyCount > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Likely Exposed</p>
            <p className="text-xs font-mono font-bold text-status-green">{likelyCount}</p>
          </div>
        )}
        {missedCount > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Possible Gap</p>
            <p className="text-xs font-mono font-bold text-status-red">{missedCount}</p>
          </div>
        )}
        {unknownCount > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Unknown</p>
            <p className="text-xs font-mono font-bold text-text-muted">{unknownCount}</p>
          </div>
        )}
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Blocks Tracked</p>
          <p className="text-xs font-mono font-bold text-text-primary">{blocks.length}</p>
        </div>
      </div>

      {/* Per-player rows */}
      <div className="space-y-2">
        {candidates.map(candidate => (
          <div
            key={candidate.playerId}
            className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-surface-raised border border-border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-medium text-text-primary">{candidate.playerName}</p>
                <ConfidencePill confidence={candidate.confidence} />
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">{candidate.note}</p>
              {candidate.possibleMissedExposure.length > 0 && (
                <p className="text-[10px] text-status-red mt-0.5">
                  Missed: {candidate.possibleMissedExposure.map(b => b.blockName).join(', ')}
                </p>
              )}
            </div>
            <div className="shrink-0 pt-0.5">
              {candidate.confidence === 'likely' && <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />}
              {candidate.confidence === 'missed' && <XCircle className="w-3.5 h-3.5 text-status-red" />}
              {candidate.confidence === 'possible' && <HelpCircle className="w-3.5 h-3.5 text-text-muted" />}
            </div>
          </div>
        ))}
      </div>

      {/* Confidence key */}
      <div className="flex flex-wrap gap-4 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[10px] text-text-muted">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-status-green" /> Attended + wrap-up confirms coverage</span>
        <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-status-red" /> Absent from session</span>
        <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3 text-text-muted" /> Attendance not recorded</span>
      </div>

      {/* Safety note */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          These are exposure candidates — deterministic inference from attendance and session data.
          No official gap records are created here. Assign gaps only after director review.
        </span>
      </div>
    </div>
  )
}
