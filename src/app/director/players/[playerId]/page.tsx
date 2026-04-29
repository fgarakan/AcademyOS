import { notFound } from 'next/navigation'
import { Trophy, Activity } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import { getPlayerById } from '@/lib/backend/players'
import { getPlayerCurriculumDomains } from '@/lib/backend/curriculum'
import { getCoachObservations, getPlayerDevelopmentSummary } from '@/lib/backend/notes'
import { assignCurriculumAction, evaluateAdvancementAction } from '@/lib/actions/curriculum'
import { addObservationAction, updateDevelopmentSummaryAction, addVoiceNoteAction } from '@/lib/actions/notes'
import { PlayerProfileHeader } from '@/components/player/PlayerProfileHeader'
import { CurriculumProgressGrid } from '@/components/player/CurriculumProgressGrid'
import { PlayerCurriculumEmptyState } from '@/components/player/PlayerCurriculumEmptyState'
import { EvaluateAdvancementButton } from '@/components/player/EvaluateAdvancementButton'
import { CoachObservationTimeline } from '@/components/player/CoachObservationTimeline'
import { DevelopmentSummarySection } from '@/components/player/DevelopmentSummarySection'
import { AddObservationForm } from '@/components/player/AddObservationForm'
import { AddVoiceNoteForm } from '@/components/player/AddVoiceNoteForm'
import { EditDevelopmentSummaryForm } from '@/components/player/EditDevelopmentSummaryForm'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { PlayerProfileTabs } from './_components/PlayerProfileTabs'

interface PageProps {
  params: { playerId: string }
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single<Pick<Tables<'profiles'>, 'academy_id'>>()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  let player
  try {
    player = await getPlayerById(supabase, params.playerId)
  } catch {
    notFound()
  }

  if (!player) notFound()

  const domainRows = await getPlayerCurriculumDomains(supabase, params.playerId, academyId)
  const hasCurriculum = domainRows.length > 0
  const curriculumSummary = domainRows[0] ?? null

  const assignAction = assignCurriculumAction.bind(null, params.playerId, academyId)
  const evaluateAction = evaluateAdvancementAction.bind(null, params.playerId, academyId)

  const blockedBy = curriculumSummary?.advancement_blocked_by ?? []
  const domainCounts = {
    complete:    domainRows.filter(r => r.status === 'complete').length,
    in_progress: domainRows.filter(r => r.status === 'in_progress').length,
    regressed:   domainRows.filter(r => r.status === 'regressed').length,
    not_started: domainRows.filter(r => r.status === 'not_started').length,
  }

  // ─── Tab 1: Overview ─────────────────────────────────────────────────────
  const overviewSlot = (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-6 items-start">

      {/* Player Info */}
      <Card>
        <CardHeader>
          <p className="label-xs">Player Info</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>
            <p className="text-[11px] text-text-muted mb-0.5">Status</p>
            <p className="text-sm text-text-primary capitalize">
              {player.status?.replace(/_/g, ' ') ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-text-muted mb-0.5">Joined</p>
            <p className="text-sm text-text-primary">{formatDate(player.join_date)}</p>
          </div>
          <div>
            <p className="text-[11px] text-text-muted mb-0.5">Date of birth</p>
            <p className="text-sm text-text-primary">{formatDate(player.date_of_birth)}</p>
          </div>
          {player.notes && (
            <div>
              <p className="text-[11px] text-text-muted mb-0.5">Notes</p>
              <p className="text-sm text-text-secondary leading-relaxed">{player.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coach Focus summary */}
      <div className="space-y-4">
        <p className="label-xs">Coach Focus</p>

        <Card>
          <CardContent className="py-4 space-y-3">
            {curriculumSummary?.advancement_eligible ? (
              <p className="text-xs text-lime">Player meets advancement criteria.</p>
            ) : hasCurriculum ? (
              <p className="text-xs text-text-muted">
                Open the Skill Path tab to evaluate advancement eligibility.
              </p>
            ) : (
              <p className="text-xs text-text-muted">
                No curriculum assigned yet. Use the Skill Path tab to get started.
              </p>
            )}
          </CardContent>
        </Card>

        {hasCurriculum && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-[11px] uppercase tracking-widest text-text-muted">Domain summary</p>
              {([
                { label: 'Complete',    count: domainCounts.complete,    color: 'text-lime' },
                { label: 'In progress', count: domainCounts.in_progress, color: 'text-status-blue' },
                { label: 'Regressed',   count: domainCounts.regressed,   color: 'text-status-red' },
                { label: 'Not started', count: domainCounts.not_started, color: 'text-text-muted' },
              ] as const).map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">{label}</span>
                  <span className={`text-sm font-mono font-bold ${color}`}>{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  )

  // ─── Tab 2: Skill Path ────────────────────────────────────────────────────
  const skillPathSlot = (
    <div className="space-y-6">

      {/* Advancement action card */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <EvaluateAdvancementButton onEvaluate={evaluateAction} />

          {curriculumSummary?.advancement_eligible && (
            <p className="text-xs text-lime">Player meets advancement criteria.</p>
          )}

          {hasCurriculum && !curriculumSummary?.advancement_eligible && blockedBy.length === 0 && (
            <p className="text-xs text-text-muted">
              Run evaluation to check advancement eligibility.
            </p>
          )}

          {blockedBy.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Blocked by</p>
              <ul className="space-y-1">
                {blockedBy.map((item, i) => (
                  <li key={i} className="text-xs text-status-orange flex gap-2">
                    <span className="shrink-0">·</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Curriculum grid or empty state */}
      {hasCurriculum ? (
        <CurriculumProgressGrid rows={domainRows} />
      ) : (
        <Card>
          <PlayerCurriculumEmptyState onAssign={assignAction} />
        </Card>
      )}

    </div>
  )

  // ─── Tab 3: Competition ───────────────────────────────────────────────────
  const competitionSlot = (
    <Card>
      <EmptyState
        icon={<Trophy className="w-5 h-5" />}
        title="Competition tracking coming soon"
        description="Match results, UTR history, and tournament records will appear here."
      />
    </Card>
  )

  // ─── Tab 4: Fitness / Load ────────────────────────────────────────────────
  const fitnessSlot = (
    <Card>
      <EmptyState
        icon={<Activity className="w-5 h-5" />}
        title="Fitness & load tracking coming soon"
        description="Training load, physical assessments, and conditioning metrics will appear here."
      />
    </Card>
  )

  // ─── Tab 5: Notes ─────────────────────────────────────────────────────────
  const observations = await getCoachObservations(supabase, params.playerId)
  const developmentSummary = await getPlayerDevelopmentSummary(supabase, params.playerId)

  const addObsAction = addObservationAction.bind(null, params.playerId, academyId)
  const updateSummaryAction = updateDevelopmentSummaryAction.bind(null, params.playerId, academyId)
  const addVoiceNoteServerAction = addVoiceNoteAction.bind(null, params.playerId, academyId)

  const notesSlot = (
    <div className="space-y-6">

      {/* Development Summary display */}
      <Card>
        <CardHeader>
          <p className="label-xs">Development Summary</p>
        </CardHeader>
        <CardContent className="pt-0">
          <DevelopmentSummarySection summary={developmentSummary} />
        </CardContent>
      </Card>

      {/* Edit Development Summary form */}
      <EditDevelopmentSummaryForm summary={developmentSummary} onSubmit={updateSummaryAction} />

      {/* Observation history */}
      <div>
        <p className="label-xs mb-4">Observation History</p>
        <CoachObservationTimeline observations={observations} />
      </div>

      {/* Add Observation form */}
      <AddObservationForm onSubmit={addObsAction} />

      {/* Voice Note form */}
      <AddVoiceNoteForm onSubmit={addVoiceNoteServerAction} />

    </div>
  )

  return (
    <div className="animate-fade-in p-6">
      <PlayerProfileHeader player={player} curriculumSummary={curriculumSummary} />
      <PlayerProfileTabs
        overview={overviewSlot}
        skillPath={skillPathSlot}
        competition={competitionSlot}
        fitness={fitnessSlot}
        notes={notesSlot}
      />
    </div>
  )
}
