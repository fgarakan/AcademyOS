// Sprint 930 — Coach Player Profile Wrap-Up Signal V1
// Added: pending observation draft count + recent group session wrap-up status signals.
// All new queries are best-effort (try/catch). Player profile renders normally on failure.

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, EmptyState, SectionHeader } from '@/components/ui'
import { CoachPlayerSnapshot } from '@/components/player/CoachPlayerSnapshot'
import { formatDate } from '@/lib/utils'
import { loadWrapUpStatusMap, type WrapUpDisplayStatus } from '@/lib/coach/wrapUpStatusMap'

interface PageProps {
  params: { playerId: string }
}

// ── Signal helpers (pure, module-level) ──────────────────────────────────────

function wrapUpSignalLabel(status: WrapUpDisplayStatus | undefined): string {
  if (!status || status === 'not_started') return 'Wrap-up needed'
  switch (status) {
    case 'pending_review':       return 'Pending review'
    case 'approved':             return 'Approved'
    case 'executed':             return 'Applied'
    case 'rejected':             return 'Needs revision'
    case 'clarification_needed': return 'Director has questions'
    default:                     return 'Wrap-up needed'
  }
}

function wrapUpSignalTextColor(status: WrapUpDisplayStatus | undefined): string {
  if (!status || status === 'not_started') return 'text-status-orange'
  switch (status) {
    case 'pending_review':       return 'text-status-blue'
    case 'approved':
    case 'executed':             return 'text-status-green'
    case 'rejected':             return 'text-status-red'
    case 'clarification_needed': return 'text-status-orange'
    default:                     return 'text-status-orange'
  }
}

function wrapUpSignalDotColor(status: WrapUpDisplayStatus | undefined): string {
  if (!status || status === 'not_started') return 'bg-status-orange'
  switch (status) {
    case 'pending_review':       return 'bg-status-blue'
    case 'approved':
    case 'executed':             return 'bg-status-green'
    case 'rejected':             return 'bg-status-red'
    case 'clarification_needed': return 'bg-status-orange'
    default:                     return 'bg-status-orange'
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function CoachPlayerProfilePage({ params }: PageProps) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const rawDb = supabase as any

  // 1. Fetch player — academy-scoped (use rawDb to avoid type errors on missing columns)
  const { data: player, error: playerError } = await rawDb
    .from('players')
    .select('id, first_name, last_name, full_name, is_active')
    .eq('id', params.playerId)
    .eq('academy_id', academyId)
    .single()

  if (playerError || !player) notFound()

  const playerName: string = (player.full_name ?? `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim()) || 'Unknown Player'
  const playerFirstName: string = player.first_name ?? playerName.split(' ')[0] ?? 'Player'

  // 2. Curriculum state + level
  let currentLevelName: string | null = null
  let currentStage: string | null = null
  let coachFocus: string | null = null
  let doingWell: string[] = []
  let workingOn: string[] = []
  let levelUpdatedAt: string | null = null

  const { data: csRows } = await rawDb
    .from('player_curriculum_states')
    .select('curriculum_level_id, updated_at')
    .eq('player_id', player.id)
    .eq('academy_id', academyId)
    .limit(1)

  const cs = csRows?.[0] ?? null
  levelUpdatedAt = cs?.updated_at ?? null

  if (cs?.curriculum_level_id) {
    const { data: lvl } = await rawDb
      .from('curriculum_levels')
      .select('display_name, stage')
      .eq('id', cs.curriculum_level_id)
      .single()
    currentLevelName = lvl?.display_name ?? null
    currentStage = lvl?.stage ?? null

    const { data: clData } = await rawDb
      .from('curriculum_coach_language')
      .select('current_focus, doing_well, working_on')
      .eq('level_id', cs.curriculum_level_id)
      .limit(1)
    const cl = clData?.[0] ?? null
    if (cl) {
      coachFocus = cl.current_focus ?? null
      if (cl.doing_well) doingWell = [cl.doing_well]
      if (cl.working_on) workingOn = [cl.working_on]
    }
  }

  // 3. Active priorities (top 1)
  const { data: priorityRows } = await rawDb
    .from('player_priorities')
    .select('title')
    .eq('player_id', player.id)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('priority_rank', { ascending: true })
    .limit(1)
  const topPriority: string | null = priorityRows?.[0]?.title ?? null

  // 4. Recent coach observations (last 5, private included — coach view)
  const { data: obsRows } = await rawDb
    .from('coach_observations')
    .select('id, content, observation_type, is_private, created_at')
    .eq('player_id', player.id)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(5)

  interface ObsRow { id: string; content: string; observation_type: string; is_private: boolean; created_at: string }
  const observations: ObsRow[] = (obsRows ?? []) as ObsRow[]
  const recentNote = observations[0]?.content ?? null
  const recentNoteDate = observations[0]?.created_at ?? null

  // 5. Group name — find via group_memberships (players don't have a direct group_id col in types)
  let groupName: string | null = null
  const { data: memRows } = await supabase
    .from('group_memberships')
    .select('group_id')
    .eq('player_id', params.playerId)
    .eq('academy_id', academyId)
    .eq('is_current', true)
    .limit(1)
  const firstGroupId: string | null = memRows?.[0]?.group_id ?? null
  if (firstGroupId) {
    const { data: grp } = await supabase
      .from('groups')
      .select('name')
      .eq('id', firstGroupId)
      .eq('academy_id', academyId)
      .single()
    groupName = grp?.name ?? null
  }

  // 6. Sprint 930 — Pending observation drafts for this player (read-only, best-effort)
  let pendingDraftCount = 0
  try {
    const { data: draftRows } = await rawDb
      .from('proposed_actions')
      .select('id')
      .eq('academy_id', academyId)
      .eq('target_module', 'coach_observation_draft_v1')
      .eq('target_object_id', player.id)
      .eq('status', 'pending_review')
      .limit(10)
    pendingDraftCount = (draftRows ?? []).length
  } catch { /* non-critical — signal hidden if query fails */ }

  // 7. Sprint 930 — Recent group session wrap-up status (read-only, best-effort)
  let latestGroupWrapUpStatus: WrapUpDisplayStatus | undefined = undefined
  let sessionsNeedingWrapUp = 0
  let hasCompletedGroupSession = false

  if (firstGroupId) {
    try {
      const { data: groupSessionRows } = await rawDb
        .from('sessions')
        .select('id, status')
        .eq('group_id', firstGroupId)
        .eq('academy_id', academyId)
        .not('status', 'eq', 'cancelled')
        .order('scheduled_date', { ascending: false })
        .limit(3)

      type GroupSession = { id: string; status: string }
      const groupSessions: GroupSession[] = (groupSessionRows ?? []) as GroupSession[]
      const groupSessionIds = groupSessions.map(s => s.id)

      if (groupSessionIds.length > 0) {
        const wrapUpStatusRecord = await loadWrapUpStatusMap(supabase, groupSessionIds, academyId)

        const latestCompleted = groupSessions.find(s => s.status === 'completed') ?? null
        if (latestCompleted) {
          hasCompletedGroupSession = true
          latestGroupWrapUpStatus = wrapUpStatusRecord[latestCompleted.id]
        }

        sessionsNeedingWrapUp = groupSessions.filter(s =>
          s.status === 'completed' &&
          (!wrapUpStatusRecord[s.id] || wrapUpStatusRecord[s.id] === 'not_started')
        ).length
      }
    } catch { /* non-critical — signal hidden if query fails */ }
  }

  const hasSignals = pendingDraftCount > 0 || hasCompletedGroupSession

  return (
    <div className="space-y-6 pb-10">

      {/* Back */}
      <Link
        href="/coach/players"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        My Players
      </Link>

      {/* Header */}
      <div>
        <p className="page-eyebrow">{groupName ?? 'Player'}</p>
        <h1 className="page-title">{playerName}</h1>
        {currentLevelName && (
          <p className="page-subtitle">
            {currentLevelName}
            {currentStage && ` · ${currentStage.replace(/_/g, ' ')}`}
          </p>
        )}
      </div>

      {/* Coach Snapshot */}
      <CoachPlayerSnapshot
        currentFocus={coachFocus}
        doingWell={doingWell}
        workingOn={workingOn}
        topPriority={topPriority}
        recentNote={recentNote}
        recentNoteDate={recentNoteDate}
        updatedAt={levelUpdatedAt}
      />

      {/* Sprint 930 — Coach Signals */}
      <div>
        <SectionHeader title="COACH SIGNALS" />
        {hasSignals ? (
          <Card>
            <CardContent className="py-4 space-y-3">
              {/* Pending observation drafts */}
              {pendingDraftCount > 0 && (
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-status-blue shrink-0" />
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">{pendingDraftCount}</span>{' '}
                    observation draft{pendingDraftCount !== 1 ? 's' : ''} pending director review
                  </p>
                </div>
              )}

              {/* Latest group session wrap-up status */}
              {hasCompletedGroupSession && (
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${wrapUpSignalDotColor(latestGroupWrapUpStatus)}`} />
                  <p className="text-sm text-text-secondary">
                    Latest group wrap-up:{' '}
                    <span className={`font-medium ${wrapUpSignalTextColor(latestGroupWrapUpStatus)}`}>
                      {wrapUpSignalLabel(latestGroupWrapUpStatus)}
                    </span>
                  </p>
                </div>
              )}

              {/* Additional sessions needing wrap-up (when more than the one shown above) */}
              {sessionsNeedingWrapUp > 1 && (
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-status-orange shrink-0" />
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium text-status-orange">{sessionsNeedingWrapUp}</span>{' '}
                    group sessions still need a wrap-up
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={<span className="text-xl">📋</span>}
                title="No recent signals"
                description="No recent signals — add observations after sessions."
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Observations */}
      <div>
        <SectionHeader title="RECENT OBSERVATIONS" />
        {observations.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={<span className="text-xl">📋</span>}
                title="No observations yet"
                description="Observations recorded during sessions will appear here."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {observations.map(obs => (
              <Card key={obs.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-secondary">
                        {obs.observation_type.replace(/_/g, ' ')}
                      </span>
                      {obs.is_private && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-muted">
                          Internal
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-muted shrink-0">{formatDate(obs.created_at)}</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-text-secondary leading-relaxed">{obs.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Level indicator (if no curriculum state) */}
      {!currentLevelName && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-text-muted">
              No curriculum level assigned yet.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Ask your director to assign a curriculum level for {playerFirstName}.
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
