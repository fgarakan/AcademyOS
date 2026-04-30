import { AlertTriangle, Users, Calendar, BookOpen, MessageSquare, Info } from 'lucide-react'
import type { StructuredDraftPayload } from './structureRecapAction'

interface Props {
  draft: StructuredDraftPayload
  createdAt: string
}

export function StructuredDraftView({ draft, createdAt }: Props) {
  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[10px] uppercase tracking-widest text-lime font-medium">
          Structured Draft V1
        </p>
        <p className="text-[10px] text-text-muted">
          {new Date(createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Draft only. Rule-based extraction — no AI. Nothing has been applied to player records,
          attendance, priorities, or parent communications.
        </span>
      </div>

      {/* Structuring warnings */}
      {draft.warnings.length > 0 && (
        <div className="space-y-1">
          {draft.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-muted">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Detected players */}
      {draft.detected_players.length > 0 && (
        <section className="space-y-2">
          <p className="label-xs flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            Detected Players
          </p>
          {draft.detected_players.map((p) => (
            <div key={p.player_id} className="flex items-center gap-2 text-xs">
              <span className="text-text-primary">{p.name}</span>
              <span className="text-text-muted">— {p.evidence}</span>
            </div>
          ))}
        </section>
      )}

      {/* Possible attendance notes */}
      {draft.attendance_mentions.length > 0 && (
        <section className="space-y-1.5">
          <p className="label-xs flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            Possible Attendance Notes
          </p>
          {draft.attendance_mentions.map((a, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`font-semibold ${a.status === 'absent' ? 'text-status-red' : 'text-status-orange'}`}>
                {a.status}
              </span>
              <span className="text-text-primary">{a.player_name}</span>
              <span className="text-text-muted">({a.confidence} confidence · review required)</span>
            </div>
          ))}
        </section>
      )}

      {/* Session actual draft */}
      <section className="space-y-1.5">
        <p className="label-xs">Session Actual Draft</p>
        <div className="space-y-1 text-xs">
          <div className="flex gap-2">
            <span className="text-text-muted w-36 shrink-0">Changed from plan</span>
            <span className={draft.session_actual_draft.changed_from_plan ? 'text-status-orange' : 'text-text-secondary'}>
              {draft.session_actual_draft.changed_from_plan ? 'Possible — review required' : 'Not detected'}
            </span>
          </div>
          {draft.session_actual_draft.actual_focus.length > 0 && (
            <div className="flex gap-2">
              <span className="text-text-muted w-36 shrink-0">Focus keywords</span>
              <span className="text-text-secondary">
                {draft.session_actual_draft.actual_focus.join(', ')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Player observation drafts */}
      {draft.player_observation_drafts.length > 0 && (
        <section className="space-y-2">
          <p className="label-xs flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" />
            Player Observation Drafts
          </p>
          {draft.player_observation_drafts.map((obs, i) => (
            <div key={i} className="pl-3 border-l border-border space-y-0.5">
              <p className="text-xs font-medium text-text-primary">{obs.player_name}</p>
              {obs.possible_focus.length > 0 && (
                <p className="text-[10px] text-text-muted">
                  Focus: {obs.possible_focus.join(', ')}
                </p>
              )}
              <p className="text-xs text-text-secondary">{obs.observation}</p>
              <p className="text-[10px] text-text-muted">Review required</p>
            </div>
          ))}
        </section>
      )}

      {/* Director summary draft */}
      <section className="space-y-1.5">
        <p className="label-xs">Director Summary Draft</p>
        <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
          {draft.director_summary_draft}
        </p>
      </section>

      {/* Parent-safe draft candidates */}
      {draft.parent_safe_draft_candidates.length > 0 && (
        <section className="space-y-2">
          <p className="label-xs flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            Parent-Safe Draft Candidates
          </p>
          {draft.parent_safe_draft_candidates.map((c, i) => (
            <div key={i} className="pl-3 border-l border-border space-y-0.5">
              <p className="text-[10px] text-text-muted">{c.player_name}</p>
              <p className="text-xs text-text-secondary">{c.draft}</p>
              <p className="text-[10px] text-text-muted">Review required before sending</p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
