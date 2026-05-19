// Parent Wins — Sprint 1081
// Positive highlights for parents. Observation counts only (never content).
// Session consistency and gate achievement counts.
// Parent-authenticated via guardian -> player_guardians chain.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { Star, CheckCircle2, Calendar, AlertCircle } from 'lucide-react'

export default async function ParentWinsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let childFirstName: string | null = null
  let positiveHighlightCount = 0
  let sessionsPresentCount = 0
  let sessionsRecordedCount = 0
  let longestStreak = 0
  let gatesPassedCount = 0
  let noAccess = false

  if (user) {
    const rawDb = supabase as any

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id ?? null

    if (!academyId) {
      noAccess = true
    } else {
      const { data: guardian } = await rawDb
        .from('guardians')
        .select('id')
        .eq('profile_id', user.id)
        .eq('academy_id', academyId)
        .maybeSingle()

      if (!guardian) {
        noAccess = true
      } else {
        const { data: pgRows } = await rawDb
          .from('player_guardians')
          .select('player_id')
          .eq('guardian_id', guardian.id)
          .limit(3)

        const playerIds: string[] = (pgRows ?? []).map((r: any) => r.player_id)

        if (playerIds.length === 0) {
          noAccess = true
        } else {
          const { data: playerRow } = await rawDb
            .from('players')
            .select('id, first_name, full_name')
            .eq('id', playerIds[0])
            .eq('academy_id', academyId)
            .eq('is_active', true)
            .maybeSingle()

          if (!playerRow) {
            noAccess = true
          } else {
            childFirstName = playerRow.first_name ?? playerRow.full_name ?? null

            // Positive highlight observation count
            const { data: posRows } = await rawDb
              .from('coach_observations')
              .select('id')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .eq('observation_type', 'positive_highlight')
            positiveHighlightCount = (posRows ?? []).length

            // Session attendance
            const { data: attRows } = await rawDb
              .from('session_attendance')
              .select('status, session_id')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .limit(50)

            const attData = (attRows ?? []) as Array<{ status: string; session_id: string }>
            sessionsRecordedCount = attData.length
            sessionsPresentCount = attData.filter(r => r.status === 'present' || r.status === 'late').length

            // Consecutive sessions streak — fetch sessions in order to calculate
            if (attData.length > 0) {
              const sessionIds = attData.map(r => r.session_id)
              const { data: sessRows } = await rawDb
                .from('sessions')
                .select('id, scheduled_date')
                .in('id', sessionIds)
                .order('scheduled_date', { ascending: false })
                .limit(30)

              const attMap = new Map<string, string>()
              for (const r of attData) attMap.set(r.session_id, r.status)

              const orderedStatuses = (sessRows ?? [])
                .map((s: any) => attMap.get(s.id) ?? 'absent')

              let streak = 0
              for (const status of orderedStatuses) {
                if (status === 'present' || status === 'late') streak++
                else break
              }
              longestStreak = streak
            }

            // Gate passes count
            const { data: gatePassRows } = await rawDb
              .from('player_gate_status')
              .select('id')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .eq('status', 'passed')
            gatesPassedCount = (gatePassRows ?? []).length
          }
        }
      }
    }
  }

  const name = childFirstName ?? 'Your child'
  const hasAnyData = positiveHighlightCount > 0 || sessionsPresentCount > 0 || gatesPassedCount > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">Highlights</p>
        <h1 className="page-title">Wins & Highlights</h1>
        <p className="page-subtitle">Positive moments from {name}&apos;s tennis journey.</p>
      </div>

      {noAccess && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-7 h-7 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">Ask the academy director to link your parent account.</p>
          </CardContent>
        </Card>
      )}

      {!noAccess && !hasAnyData && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-status-orange/10 border border-status-orange/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-status-orange" />
            </div>
            <p className="text-text-primary text-sm font-medium">Wins are building</p>
            <p className="text-text-muted text-xs leading-relaxed max-w-xs">
              As {name} attends sessions and their coach logs observations, positive highlights will appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {!noAccess && hasAnyData && (
        <>
          {/* Positive highlights */}
          <div className="rounded-2xl border border-status-orange/20 bg-status-orange/5 px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-status-orange/15 border border-status-orange/20 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-status-orange" />
              </div>
              <div>
                <p className="label-xs text-status-orange mb-1">Coach Highlights</p>
                <p className="text-3xl font-mono font-bold text-text-primary leading-none">
                  {positiveHighlightCount}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  positive moments noted by your coaching team
                </p>
              </div>
            </div>
          </div>

          {/* Session consistency */}
          {sessionsRecordedCount > 0 && (
            <div className="rounded-xl border border-border bg-surface-raised px-5 py-4">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-4 h-4 text-lime shrink-0" />
                <p className="text-sm font-semibold text-text-primary">Session Consistency</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-lime">{sessionsPresentCount}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Sessions attended</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-text-secondary">{sessionsRecordedCount}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Total recorded</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-status-blue">{longestStreak}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Current streak</p>
                </div>
              </div>
              {sessionsRecordedCount > 0 && (
                <div className="mt-4">
                  <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full rounded-full bg-lime transition-all"
                      style={{ width: `${Math.round((sessionsPresentCount / sessionsRecordedCount) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">
                    {Math.round((sessionsPresentCount / sessionsRecordedCount) * 100)}% attendance rate
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Gate achievements */}
          {gatesPassedCount > 0 && (
            <div className="rounded-xl border border-status-green/20 bg-status-green/5 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-status-green/15 border border-status-green/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-status-green" />
                </div>
                <div>
                  <p className="label-xs text-status-green mb-0.5">Advancement Progress</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {gatesPassedCount} requirement{gatesPassedCount !== 1 ? 's' : ''} confirmed by coach
                  </p>
                  <p className="text-xs text-text-muted">
                    These are milestones toward {name}&apos;s next level.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Encouragement */}
          <div className="rounded-xl bg-surface-raised border border-border px-4 py-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              The best support you can give is showing up, staying positive, and letting the coaching team lead the technical work.
              {name} is building something real — one session at a time.
            </p>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-text-muted text-center px-4">
            Highlight counts reflect coach-logged observations only. Content is never shared without director approval.
          </p>
        </>
      )}
    </div>
  )
}
