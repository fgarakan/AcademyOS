import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import { getPlayerById } from '@/lib/backend/players'
import { getPlayerCurriculumDomains } from '@/lib/backend/curriculum'
import { assignCurriculumAction, evaluateAdvancementAction } from '@/lib/actions/curriculum'
import { PlayerProfileHeader } from '@/components/player/PlayerProfileHeader'
import { CurriculumProgressGrid } from '@/components/player/CurriculumProgressGrid'
import { PlayerCurriculumEmptyState } from '@/components/player/PlayerCurriculumEmptyState'
import { EvaluateAdvancementButton } from '@/components/player/EvaluateAdvancementButton'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'

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

  return (
    <div className="animate-fade-in p-6">
      <PlayerProfileHeader player={player} curriculumSummary={curriculumSummary} />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_240px] gap-6 items-start">

        {/* Left — Player info */}
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

        {/* Center — Skill Path */}
        <div>
          <p className="label-xs mb-3">Skill Path</p>
          {hasCurriculum ? (
            <CurriculumProgressGrid rows={domainRows} />
          ) : (
            <Card>
              <PlayerCurriculumEmptyState onAssign={assignAction} />
            </Card>
          )}
        </div>

        {/* Right — Coach Focus */}
        <div className="space-y-4 lg:col-span-2 xl:col-span-1">
          <p className="label-xs">Coach Focus</p>

          <Card>
            <CardContent className="py-4 space-y-4">
              <EvaluateAdvancementButton onEvaluate={evaluateAction} />

              {curriculumSummary?.advancement_eligible && (
                <p className="text-xs text-lime">
                  Player meets advancement criteria.
                </p>
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
    </div>
  )
}
