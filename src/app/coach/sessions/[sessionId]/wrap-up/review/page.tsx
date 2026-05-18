import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CheckCircle, Clock, ShieldCheck, Target, Users, Sparkles } from 'lucide-react'
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
