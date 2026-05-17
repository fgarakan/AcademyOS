import Link from 'next/link'
import { AlertTriangle, Users, Calendar, BookOpen, MessageSquare, ExternalLink, CheckCircle2, XCircle, FileText, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { StructuredDraftPayload } from '@/app/director/sessions/[sessionId]/structureRecapAction'
import { DraftDecisionControls } from './DraftDecisionControls'
import { ApplyApprovedDraftControls } from './ApplyApprovedDraftControls'

export interface EnrichedDraftItem {
  id: string
  payload: StructuredDraftPayload
  createdAt: string
  status: string
  sessionId: string | null
  sessionName: string | null
  sessionDate: string | null
  proposerName: string | null
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   'text-status-green',
  medium: 'text-status-orange',
  low:    'text-status-red',
}

export function StructuredDraftCard({ draft }: { draft: EnrichedDraftItem }) {
  const { payload } = draft
  const detectedCount = payload.detected_players.length
  const attendanceCount = payload.attendance_mentions.length
  const observationCount = payload.player_observation_drafts.length
  const parentSafeCount = payload.parent_safe_draft_candidates.length

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-lime font-medium">
              Structured Draft V1 ·{' '}
              {draft.status === 'approved' ? 'approved — ready to apply' : 'pending review'}
            </p>
            {draft.sessionName && (
              <p className="text-sm font-semibold text-text-primary mt-0.5">{draft.sessionName}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted mt-1">
              {draft.sessionDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(draft.sessionDate)}
                </span>
              )}
              {draft.proposerName && <span>by {draft.proposerName}</span>}
              <span>
                Created{' '}
                {new Date(draft.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          {draft.sessionId && (
            <Link
              href={`/director/sessions/${draft.sessionId}`}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-lime transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Session
            </Link>
          )}
        </div>

        {/* Safety banner */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Draft only. Nothing has been applied to player records, attendance, priorities, or parent communications.
          </span>
        </div>

        {/* Count summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <CountStat label="Detected Players" value={detectedCount} />
          <CountStat label="Attendance Mentions" value={attendanceCount} />
          <CountStat label="Observation Drafts" value={observationCount} />
          <CountStat label="Parent-Safe Drafts" value={parentSafeCount} />
        </div>

        {/* Director summary preview */}
        {payload.director_summary_draft && (
          <section className="space-y-1.5">
            <p className="label-xs">Director Summary Draft</p>
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
              {payload.director_summary_draft}
            </p>
          </section>
        )}

        {/* Detected players */}
        {payload.detected_players.length > 0 && (
          <section className="space-y-1.5">
            <p className="label-xs flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              Detected Players
            </p>
            <div className="flex flex-wrap gap-1.5">
              {payload.detected_players.map(p => (
                <span
                  key={p.player_id}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-secondary"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Attendance mentions */}
        {payload.attendance_mentions.length > 0 && (
          <section className="space-y-1.5">
            <p className="label-xs flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              Possible Attendance Notes
            </p>
            <div className="space-y-1">
              {payload.attendance_mentions.map((a, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`font-semibold ${
                      a.status === 'absent' ? 'text-status-red' : 'text-status-orange'
                    }`}
                  >
                    {a.status}
                  </span>
                  <span className="text-text-primary">{a.player_name}</span>
                  <span className={`font-medium ${CONFIDENCE_COLOR[a.confidence] ?? 'text-text-muted'}`}>
                    {a.confidence} confidence
                  </span>
                  <span className="text-text-muted">· review required</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Player observation drafts */}
        {payload.player_observation_drafts.length > 0 && (
          <section className="space-y-1.5">
            <p className="label-xs flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              Player Observation Drafts
            </p>
            <div className="space-y-2">
              {payload.player_observation_drafts.map((obs, i) => (
                <div key={i} className="pl-3 border-l border-border space-y-0.5">
                  <p className="text-xs font-medium text-text-primary">{obs.player_name}</p>
                  {obs.possible_focus.length > 0 && (
                    <p className="text-[10px] text-text-muted">
                      Focus: {obs.possible_focus.join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-text-secondary line-clamp-2">{obs.observation}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Session actual draft — what changed from plan */}
        {payload.session_actual_draft?.actual_focus && payload.session_actual_draft.actual_focus.length > 0 && (
          <section className="space-y-1.5">
            <p className="label-xs flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Session Focus (from recap)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {payload.session_actual_draft.actual_focus.map((f, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-secondary">
                  {f}
                </span>
              ))}
            </div>
            {payload.session_actual_draft.skipped_or_reduced.length > 0 && (
              <p className="text-[10px] text-text-muted">
                Skipped or reduced: {payload.session_actual_draft.skipped_or_reduced.join(', ')}
              </p>
            )}
          </section>
        )}

        {/* Parent-safe candidate count */}
        {payload.parent_safe_draft_candidates.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <MessageSquare className="w-3.5 h-3.5" />
            {payload.parent_safe_draft_candidates.length} parent-safe draft
            {payload.parent_safe_draft_candidates.length !== 1 ? 's' : ''} — review required
            before sending
          </div>
        )}

        {/* What will change if approved */}
        <WillChangePanel payload={payload} />

        {/* Source recap */}
        {payload.raw_recap && (
          <section className="space-y-1.5">
            <p className="label-xs flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              Source Recap
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed line-clamp-4 italic">
              &ldquo;{payload.raw_recap}&rdquo;
            </p>
          </section>
        )}

        {/* Director controls — decision for pending, apply for approved */}
        {draft.status === 'approved' ? (
          <ApplyApprovedDraftControls proposedActionId={draft.id} />
        ) : (
          <DraftDecisionControls proposedActionId={draft.id} />
        )}
      </CardContent>
    </Card>
  )
}

function CountStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">{label}</p>
      <p className="text-lg font-mono font-bold text-lime">{value}</p>
    </div>
  )
}

function WillChangePanel({ payload }: { payload: StructuredDraftPayload }) {
  const willChange: string[] = []
  const willNotChange: string[] = [
    'Player curriculum levels',
    'Published parent communications',
    'Advancement decisions',
  ]

  if (payload.attendance_mentions.length > 0)
    willChange.push(`${payload.attendance_mentions.length} attendance record(s) flagged for director confirmation`)
  if (payload.player_observation_drafts.length > 0)
    willChange.push(`${payload.player_observation_drafts.length} player observation draft(s) added to review queue`)
  if (payload.parent_safe_draft_candidates.length > 0)
    willChange.push(`${payload.parent_safe_draft_candidates.length} parent-safe draft(s) staged — require separate approval before sending`)
  if (payload.director_summary_draft)
    willChange.push('Director summary draft saved for review')

  if (willChange.length === 0) return null

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <section className="space-y-1.5">
        <p className="label-xs flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-status-green" />
          Will change if approved
        </p>
        <ul className="space-y-1">
          {willChange.map((item, i) => (
            <li key={i} className="flex gap-1.5 text-[11px] text-text-secondary">
              <span className="text-status-green shrink-0 mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-1.5">
        <p className="label-xs flex items-center gap-1.5">
          <XCircle className="w-3 h-3 text-status-red" />
          Will not change automatically
        </p>
        <ul className="space-y-1">
          {willNotChange.map((item, i) => (
            <li key={i} className="flex gap-1.5 text-[11px] text-text-muted">
              <span className="text-status-red shrink-0 mt-0.5">✕</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
