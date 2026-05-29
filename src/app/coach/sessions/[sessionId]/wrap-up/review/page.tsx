// Sprint 932 — Coach Session Recap Review Status V1
// Added: "Your player notes" section showing observation draft review status.
// Read-only, best-effort. Coach sees only their own drafts for this session.

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CheckCircle, Clock, ShieldCheck, Target, Users, Sparkles, MessageSquare } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'

interface PageProps {
  params: { sessionId: string }
}

// ── Section label keys (matches WrapUpPageClient question keys) ──

const SECTION_LABELS: Record<string, string> = {
  overall:    'Session Overview',
  attendance: 'Attendance',
  standouts:  'Positive Standouts',
  attention:  'Needs Extra Attention',
  adjust:     'Next Session Adjustments',
  followup:   'Follow-Up Items',
}

const PAYLOAD_TO_SECTION: Array<{ key: string; payloadField: string }> = [
  { key: 'overall',    payloadField: 'group_note' },
  { key: 'attendance', payloadField: 'raw_attendance_answer' },
  { key: 'standouts',  payloadField: 'raw_standouts_answer' },
  { key: 'attention',  payloadField: 'raw_attention_answer' },
  { key: 'adjust',     payloadField: 'changes_note' },
  { key: 'followup',   payloadField: 'next_focus' },
]

// ── Observation draft display helpers ─────────────────────────

type ObsStatus = 'pending_review' | 'approved' | 'executed' | 'rejected' | 'clarification_needed' | string

function obsStatusLabel(status: ObsStatus): string {
  switch (status) {
    case 'pending_review':       return 'Pending review'
    case 'approved':             return 'Approved'
    case 'executed':             return 'Applied'
    case 'rejected':             return 'Needs revision'
    case 'clarification_needed': return 'Director has questions'
    default:                     return 'Pending review'
  }
}

function obsStatusColor(status: ObsStatus): string {
  switch (status) {
    case 'pending_review':       return 'text-status-blue border-status-blue/30 bg-status-blue/10'
    case 'approved':             return 'text-status-green border-status-green/30 bg-status-green/10'
    case 'executed':             return 'text-status-green border-status-green/30 bg-status-green/10'
    case 'rejected':             return 'text-status-red border-status-red/30 bg-status-red/10'
    case 'clarification_needed': return 'text-status-orange border-status-orange/30 bg-status-orange/10'
    default:                     return 'text-text-muted border-border bg-surface-raised'
  }
}

function obsTypeLabel(type: string): string {
  switch (type) {
    case 'positive':       return 'Positive'
    case 'needs_attention': return 'Needs attention'
    default:               return 'General'
  }
}

function obsTypeDotColor(type: string): string {
  switch (type) {
    case 'positive':       return 'bg-status-green'
    case 'needs_attention': return 'bg-status-orange'
    default:               return 'bg-text-muted'
  }
}

// ── Sprint 933 — Loop completion state derivation ─────────────
// Pure function — no queries. Derived from existing action + obs data.

type LoopState =
  | 'pending'          // wrap-up or obs draft still awaiting review
  | 'wrapup_rejected'  // session wrap-up itself was rejected (existing banner handles this)
  | 'needs_attention'  // at least one obs draft has clarification_needed
  | 'needs_revision'   // at least one obs draft rejected (and none pending/clarification)
  | 'partial'          // wrap-up reviewed; some obs drafts approved but not yet applied
  | 'complete'         // wrap-up reviewed; all obs drafts applied or none exist

function deriveLoopState(
  wrapUpStatus: string,
  obs: Array<{ status: ObsStatus }>,
): LoopState {
  if (wrapUpStatus === 'pending_review') return 'pending'
  if (wrapUpStatus === 'rejected') return 'wrapup_rejected'
  // Wrap-up is 'approved' or 'executed'
  if (obs.some(o => o.status === 'clarification_needed')) return 'needs_attention'
  if (obs.some(o => o.status === 'pending_review')) return 'pending'
  if (obs.some(o => o.status === 'rejected')) return 'needs_revision'
  if (obs.some(o => o.status === 'approved')) return 'partial'
  return 'complete'
}

// ─────────────────────────────────────────────────────────────

export default async function CoachWrapUpReviewPage({ params }: PageProps) {
  const { sessionId } = params
  const supabase = await getSupabaseServer()

  // Auth + academy
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  const academyId = profile?.academy_id
  if (!academyId) notFound()

  // Session — verify academy ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, scheduled_date')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) notFound()

  // Fetch most recent wrap-up proposed action for this session
  const rawDb = supabase as any
  const { data: actions } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload, created_at, risk_notes')
    .eq('academy_id', academyId)
    .eq('target_object_id', sessionId)
    .eq('target_module', 'session_wrap_up_v1')
    .order('created_at', { ascending: false })
    .limit(1)

  const action = actions?.[0] ?? null
  const payload = action?.proposed_payload ?? null

  // Sprint 932 — Observation draft review status for this session
  // Scoped to: academy_id + current coach (proposed_by_id) + target_module
  // Filtered server-side by payload.session_id === sessionId
  interface ObsDraft {
    id: string
    status: ObsStatus
    reviewer_notes: string | null
    playerName: string
    observationType: string
    note: string
  }
  let obsDrafts: ObsDraft[] = []

  try {
    const { data: obsDraftRows } = await rawDb
      .from('proposed_actions')
      .select('id, status, reviewer_notes, proposed_payload')
      .eq('academy_id', academyId)
      .eq('target_module', 'coach_observation_draft_v1')
      .eq('proposed_by_id', user.id)
      .in('status', ['pending_review', 'approved', 'executed', 'rejected', 'clarification_needed'])
      .order('created_at', { ascending: true })
      .limit(20)

    obsDrafts = ((obsDraftRows ?? []) as Array<{
      id: string
      status: string
      reviewer_notes: string | null
      proposed_payload: Record<string, unknown>
    }>)
      .filter(row => row.proposed_payload?.session_id === sessionId)
      .map(row => ({
        id: row.id,
        status: row.status as ObsStatus,
        reviewer_notes: row.reviewer_notes,
        playerName: (row.proposed_payload?.player_name as string | null) ?? 'Unknown player',
        observationType: (row.proposed_payload?.observation_type as string | null) ?? 'general',
        note: (row.proposed_payload?.note as string | null) ?? '',
      }))
  } catch { /* non-critical — section renders empty if query fails */ }

  // Sprint 935 — Attendance exception status for this session
  // Direct column query: target_object_id = sessionId (no JSON filter needed)
  // Scoped: academy_id + target_module + target_object_id + proposed_by_id (coach's own)
  interface AttExcDraft {
    id: string
    status: string
    reviewer_notes: string | null
    absentCount: number
    unrosteredCount: number
  }
  let attExcDrafts: AttExcDraft[] = []

  try {
    const { data: attExcRows } = await rawDb
      .from('proposed_actions')
      .select('id, status, reviewer_notes, proposed_payload')
      .eq('academy_id', academyId)
      .eq('target_module', 'attendance_exception')
      .eq('target_object_id', sessionId)
      .eq('proposed_by_id', user.id)
      .in('status', ['pending_review', 'approved', 'executed', 'rejected', 'clarification_needed'])
      .order('created_at', { ascending: false })
      .limit(5)

    attExcDrafts = ((attExcRows ?? []) as Array<{
      id: string
      status: string
      reviewer_notes: string | null
      proposed_payload: Record<string, unknown>
    }>).map(row => ({
      id: row.id,
      status: row.status,
      reviewer_notes: row.reviewer_notes,
      absentCount: Array.isArray(row.proposed_payload?.rostered_attendance)
        ? (row.proposed_payload.rostered_attendance as unknown[]).length
        : 0,
      unrosteredCount: Array.isArray(row.proposed_payload?.unrostered_attendees)
        ? (row.proposed_payload.unrostered_attendees as unknown[]).length
        : 0,
    }))
  } catch { /* non-critical — section renders with empty state if query fails */ }

  const sessionHref = `/coach/sessions/${sessionId}`
  const wrapUpHref  = `/coach/sessions/${sessionId}/wrap-up`

  const statusLabel = !action ? null
    : action.status === 'pending_review' ? 'Pending Director Review'
    : action.status === 'approved' ? 'Approved'
    : action.status === 'applied' ? 'Applied'
    : action.status === 'rejected' ? 'Rejected'
    : action.status

  const statusColor = !action ? ''
    : action.status === 'pending_review' ? 'text-status-orange'
    : action.status === 'approved' ? 'text-status-green'
    : action.status === 'applied' ? 'text-text-muted'
    : action.status === 'rejected' ? 'text-status-red'
    : 'text-text-muted'

  // Sprint 933 — derive loop completion state and counts from existing data (no new queries)
  const loopState: LoopState | null = action ? deriveLoopState(action.status, obsDrafts) : null
  const appliedCount   = obsDrafts.filter(o => o.status === 'executed').length
  const approvedCount  = obsDrafts.filter(o => o.status === 'approved').length
  const pendingObsCount = obsDrafts.filter(o => o.status === 'pending_review').length
  const attentionCount = obsDrafts.filter(o => o.status === 'clarification_needed').length
  const revisionCount  = obsDrafts.filter(o => o.status === 'rejected').length
  const totalNotes     = obsDrafts.length

  return (
    <div className="min-h-screen bg-base max-w-lg mx-auto px-4 py-6 space-y-5">

      {/* Top nav */}
      <div className="flex items-center gap-2">
        <Link
          href={sessionHref}
          className="flex items-center gap-1 text-text-muted text-xs hover:text-text-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
          {session.name ?? 'Session'}
        </Link>
      </div>

      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Wrap-Up Review</p>
        </div>
        <h1 className="text-xl font-bold text-text-primary">{session.name ?? 'Session'}</h1>
        {session.scheduled_date && (
          <p className="text-xs text-text-muted mt-0.5">
            {new Date(session.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Sprint 933 — Loop completion summary card */}
      {loopState && loopState !== 'wrapup_rejected' && (() => {
        const isComplete = loopState === 'complete'
        const isPartial  = loopState === 'partial'
        const isAttention = loopState === 'needs_attention'
        const isRevision  = loopState === 'needs_revision'

        const borderBg = isComplete  ? 'border-status-green/30 bg-status-green/5' :
                         isPartial   ? 'border-lime/25 bg-lime/4' :
                         isAttention ? 'border-status-orange/30 bg-status-orange/5' :
                         isRevision  ? 'border-status-red/25 bg-status-red/5' :
                         'border-border bg-surface-raised'

        const icon = isComplete || isPartial
          ? <CheckCircle className={`w-4 h-4 shrink-0 ${isComplete ? 'text-status-green' : 'text-lime'}`} />
          : <Clock className={`w-4 h-4 shrink-0 ${isAttention ? 'text-status-orange' : isRevision ? 'text-status-red' : 'text-text-muted'}`} />

        const headline =
          isComplete  ? 'Loop complete' :
          isPartial   ? 'Reviewed — waiting to be applied' :
          isAttention ? 'Director has questions' :
          isRevision  ? 'Some notes need revision' :
          'Waiting for director review'

        const headlineColor =
          isComplete  ? 'text-status-green' :
          isPartial   ? 'text-lime' :
          isAttention ? 'text-status-orange' :
          isRevision  ? 'text-status-red' :
          'text-text-primary'

        const explanation =
          isComplete && totalNotes > 0
            ? `Your recap and ${appliedCount} player note${appliedCount !== 1 ? 's' : ''} are now in the official record.`
          : isComplete
            ? 'Your session recap is now in the official record.'
          : isPartial
            ? 'Your recap was reviewed. Some player notes are approved and waiting to be added to official records.'
          : isAttention
            ? 'Your director has questions about some player notes. Check the details below and follow up.'
          : isRevision
            ? 'Your director could not approve some player notes. See the details below.'
          : 'Your recap has been submitted. You\'ll see updates here after your director reviews it.'

        return (
          <div className={`rounded-2xl border p-4 space-y-3 ${borderBg}`}>
            <div className="flex items-center gap-2">
              {icon}
              <p className={`text-sm font-semibold ${headlineColor}`}>{headline}</p>
            </div>
            <p className="text-xs text-text-secondary leading-snug">{explanation}</p>
            {totalNotes > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {appliedCount > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-status-green/10 text-status-green border-status-green/30">
                    {appliedCount} applied
                  </span>
                )}
                {approvedCount > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-lime/10 text-lime border-lime/30">
                    {approvedCount} approved
                  </span>
                )}
                {pendingObsCount > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-status-blue/10 text-status-blue border-status-blue/30">
                    {pendingObsCount} pending review
                  </span>
                )}
                {attentionCount > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-status-orange/10 text-status-orange border-status-orange/30">
                    {attentionCount} director has questions
                  </span>
                )}
                {revisionCount > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-status-red/10 text-status-red border-status-red/30">
                    {revisionCount} needs revision
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* No submission yet */}
      {!action && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center space-y-3">
          <Clock className="w-6 h-6 text-text-muted mx-auto" />
          <div>
            <p className="text-sm font-semibold text-text-primary">No wrap-up submitted yet</p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-xs mx-auto">
              Complete the wrap-up questions to generate a structured draft for director review.
            </p>
          </div>
          <Link
            href={wrapUpHref}
            className="inline-block px-5 py-2.5 rounded-xl bg-lime text-black text-sm font-bold hover:bg-lime/90 transition-all"
          >
            Start Wrap-Up
          </Link>
        </div>
      )}

      {/* Submission review */}
      {action && payload && (
        <>
          {/* Status banner */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
            action.status === 'pending_review' ? 'border-status-orange/30 bg-status-orange/5' :
            action.status === 'approved' ? 'border-status-green/30 bg-status-green/5' :
            'border-border bg-surface-raised'
          }`}>
            {action.status === 'approved'
              ? <CheckCircle className="w-4 h-4 text-status-green shrink-0" />
              : <Clock className={`w-4 h-4 shrink-0 ${statusColor}`} />
            }
            <div>
              <p className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</p>
              {action.status === 'pending_review' && (
                <p className="text-[10px] text-text-muted">Director will review before applying to session records</p>
              )}
            </div>
          </div>

          {/* Answer sections */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-text-muted">DONNA Summary Draft</p>
            </div>

            {PAYLOAD_TO_SECTION.map(({ key, payloadField }) => {
              const value = (payload[payloadField] as string | null | undefined)?.trim()
              if (!value) return null
              return (
                <div key={key}>
                  <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">
                    {SECTION_LABELS[key]}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">{value}</p>
                </div>
              )
            })}
          </div>

          {/* Block completion summary */}
          {Array.isArray(payload.block_completion) && payload.block_completion.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <p className="text-[9px] uppercase tracking-widest text-text-muted">Block Completion (Self-Reported)</p>
              <div className="space-y-1.5">
                {(payload.block_completion as Array<{ block_name: string; status: string; note: string }>).map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      b.status === 'completed' ? 'bg-status-green' :
                      b.status === 'skipped' ? 'bg-text-muted' :
                      'bg-status-orange'
                    }`} />
                    <p className="text-xs text-text-secondary">{b.block_name}</p>
                    <span className={`text-[10px] ml-auto shrink-0 ${
                      b.status === 'completed' ? 'text-status-green' :
                      b.status === 'skipped' ? 'text-text-muted' :
                      'text-status-orange'
                    }`}>{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next focus */}
          {(payload.next_focus as string | null)?.trim() && (
            <div className="rounded-2xl border border-border bg-surface px-4 py-3 flex items-start gap-2">
              <Target className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] uppercase tracking-widest text-lime mb-0.5">Next Session Focus</p>
                <p className="text-xs text-text-secondary">{payload.next_focus}</p>
              </div>
            </div>
          )}

          {/* Attendance raw */}
          {(payload.raw_attendance_answer as string | null)?.trim() && (
            <div className="rounded-2xl border border-border bg-surface px-4 py-3 flex items-start gap-2">
              <Users className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">Attendance Note</p>
                <p className="text-xs text-text-secondary">{payload.raw_attendance_answer}</p>
              </div>
            </div>
          )}

          {/* Safety notice */}
          <div className="flex items-start gap-1.5 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-muted leading-snug">
              This draft is pending director review. No session records, player profiles, or parent communications have been modified.
            </p>
          </div>

          {/* Submitted timestamp */}
          {action.created_at && (
            <p className="text-[9px] text-text-muted text-center">
              Submitted {new Date(action.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </>
      )}

      {/* Sprint 932 — Your player notes section */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Your player notes</p>
        </div>

        {obsDrafts.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-text-muted">No player note drafts for this session yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {obsDrafts.map(draft => {
              const notePreview = draft.note.length > 100
                ? draft.note.slice(0, 100).trimEnd() + '…'
                : draft.note
              return (
                <div key={draft.id} className="px-4 py-3 space-y-2">
                  {/* Player + type */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${obsTypeDotColor(draft.observationType)}`} />
                      <span className="text-xs font-medium text-text-primary truncate">{draft.playerName}</span>
                    </div>
                    <span className="text-[10px] text-text-muted shrink-0">{obsTypeLabel(draft.observationType)}</span>
                    <span className={`ml-auto text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${obsStatusColor(draft.status)}`}>
                      {obsStatusLabel(draft.status)}
                    </span>
                  </div>

                  {/* Note preview */}
                  {notePreview && (
                    <p className="text-xs text-text-secondary leading-snug">{notePreview}</p>
                  )}

                  {/* Director note (for clarification_needed or rejected) */}
                  {draft.reviewer_notes && (draft.status === 'clarification_needed' || draft.status === 'rejected') && (
                    <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-surface-raised border border-border">
                      <span className="text-[10px] font-medium text-text-muted shrink-0">Director:</span>
                      <p className="text-[10px] text-text-secondary leading-snug">{draft.reviewer_notes}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sprint 935 — Attendance exceptions section */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Attendance exceptions</p>
        </div>

        {attExcDrafts.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-text-muted">No attendance exceptions detected.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {attExcDrafts.map(draft => {
              const parts: string[] = []
              if (draft.absentCount === 1)      parts.push('1 absent player')
              else if (draft.absentCount > 1)   parts.push(`${draft.absentCount} absent players`)
              if (draft.unrosteredCount === 1)    parts.push('1 unexpected attendee')
              else if (draft.unrosteredCount > 1) parts.push(`${draft.unrosteredCount} unexpected attendees`)
              const summary = parts.join(' · ') || 'Exception detected'
              const isResolved = draft.status === 'executed' || draft.status === 'approved'

              return (
                <div key={draft.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-text-secondary flex-1 min-w-0 truncate">{summary}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${obsStatusColor(draft.status)}`}>
                      {obsStatusLabel(draft.status)}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted leading-snug">
                    {isResolved
                      ? 'Director reviewed this exception.'
                      : 'Sent for director review — no attendance changes until approved.'}
                  </p>
                  {draft.reviewer_notes && (draft.status === 'clarification_needed' || draft.status === 'rejected') && (
                    <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-surface-raised border border-border">
                      <span className="text-[10px] font-medium text-text-muted shrink-0">Director:</span>
                      <p className="text-[10px] text-text-secondary leading-snug">{draft.reviewer_notes}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Back to session */}
      <Link
        href={sessionHref}
        className="block w-full py-3 rounded-xl border border-border text-sm font-medium text-text-secondary text-center hover:bg-surface-raised transition-all"
      >
        Back to Session
      </Link>

    </div>
  )
}
