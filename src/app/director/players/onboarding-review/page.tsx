import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle, Users, Sparkles, Upload, GraduationCap } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'

interface ReviewPlayer {
  playerId: string
  fullName: string
  hasCurriculumAssignment: boolean
  hasGroupAssignment: boolean
  hasDevelopmentData: boolean
  hasPriority: boolean
}

function ReadinessBar({ total, ready }: { total: number; ready: number }) {
  const pct = total === 0 ? 0 : Math.round((ready / total) * 100)
  return (
    <div className="space-y-1">
      <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div
          className="h-full bg-lime rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-text-muted">{ready} of {total} fully set up</p>
    </div>
  )
}

function GapRow({ label, count, total, link, linkLabel }: {
  label: string
  count: number
  total: number
  link?: string
  linkLabel?: string
}) {
  const ok = count === 0
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {ok
          ? <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          : <AlertCircle className="w-4 h-4 text-status-orange shrink-0" />}
        <div>
          <p className="text-sm text-text-primary">{label}</p>
          {!ok && (
            <p className="text-xs text-text-muted">
              {count} of {total} player{total !== 1 ? 's' : ''} missing
            </p>
          )}
        </div>
      </div>
      {!ok && link && (
        <Link
          href={link}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors shrink-0"
        >
          {linkLabel ?? 'Fix'}
        </Link>
      )}
      {ok && (
        <span className="text-xs text-status-green shrink-0">All set</span>
      )}
    </div>
  )
}

export default async function OnboardingReviewPage() {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

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

  // Load active players
  const { data: playerRows } = await supabase
    .from('players')
    .select('id, full_name, first_name, last_name, current_group_id')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .eq('status', 'active')
    .order('full_name')

  const players = playerRows ?? []
  const playerIds = players.map(p => p.id)
  const totalCount = players.length

  if (totalCount === 0) {
    return (
      <div className="animate-fade-in p-6 space-y-6 max-w-2xl">
        <Link href="/director/players" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          All Players
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Onboarding Review</h1>
          <p className="text-sm text-text-secondary mt-1">Check which players are ready for coach intelligence.</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-text-primary font-medium">No active players yet</p>
            <p className="text-sm text-text-muted">Import players first to begin the onboarding review.</p>
            <Link href="/director/players/import" className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors">
              <Upload className="w-4 h-4" />
              Import Players
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Load curriculum states
  const csSet = new Set<string>()
  if (playerIds.length > 0) {
    const { data: csRows } = await rawDb
      .from('player_curriculum_states')
      .select('player_id')
      .in('player_id', playerIds)
      .eq('academy_id', academyId)
    for (const r of csRows ?? []) csSet.add(r.player_id)
  }

  // Load group memberships (current)
  const gmSet = new Set<string>()
  if (playerIds.length > 0) {
    const { data: gmRows } = await supabase
      .from('group_memberships')
      .select('player_id')
      .in('player_id', playerIds)
      .eq('academy_id', academyId)
      .eq('is_current', true)
    for (const r of gmRows ?? []) gmSet.add(r.player_id)
  }

  // Also check denormalized current_group_id on player
  for (const p of players) {
    if (p.current_group_id) gmSet.add(p.id)
  }

  // Load development summaries
  const devSet = new Set<string>()
  if (playerIds.length > 0) {
    const { data: devRows } = await rawDb
      .from('player_development_summary')
      .select('player_id, current_strengths, things_to_work_on')
      .in('player_id', playerIds)
    for (const r of devRows ?? []) {
      const hasData = ((r.current_strengths as string[]) ?? []).length > 0 ||
                      ((r.things_to_work_on as string[]) ?? []).length > 0
      if (hasData) devSet.add(r.player_id)
    }
  }

  // Load active priorities
  const prioritySet = new Set<string>()
  if (playerIds.length > 0) {
    const { data: priRows } = await rawDb
      .from('player_priorities')
      .select('player_id')
      .in('player_id', playerIds)
      .eq('academy_id', academyId)
      .eq('is_active', true)
    for (const r of priRows ?? []) prioritySet.add(r.player_id)
  }

  // Build review list
  const reviewPlayers: ReviewPlayer[] = players.map(p => ({
    playerId: p.id,
    fullName: p.full_name ?? `${p.first_name} ${p.last_name}`.trim(),
    hasCurriculumAssignment: csSet.has(p.id),
    hasGroupAssignment: gmSet.has(p.id),
    hasDevelopmentData: devSet.has(p.id),
    hasPriority: prioritySet.has(p.id),
  }))

  // Counts
  const missingCurriculum = reviewPlayers.filter(p => !p.hasCurriculumAssignment).length
  const missingGroup = reviewPlayers.filter(p => !p.hasGroupAssignment).length
  const missingDev = reviewPlayers.filter(p => !p.hasDevelopmentData).length
  const missingPriority = reviewPlayers.filter(p => !p.hasPriority).length

  const fullyReady = reviewPlayers.filter(
    p => p.hasCurriculumAssignment && p.hasGroupAssignment && p.hasDevelopmentData && p.hasPriority
  ).length

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-2xl">
      <Link href="/director/players" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        All Players
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Onboarding Review</h1>
        <p className="text-sm text-text-secondary mt-1">
          Check which players are set up and ready for coach intelligence.
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-lime" />
              <p className="text-sm font-semibold text-text-primary">{totalCount} active player{totalCount !== 1 ? 's' : ''}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              fullyReady === totalCount
                ? 'bg-status-green/10 text-status-green border-status-green/30'
                : 'bg-status-orange/10 text-status-orange border-status-orange/30'
            }`}>
              {fullyReady === totalCount ? 'All ready' : `${fullyReady} ready`}
            </span>
          </div>

          <ReadinessBar total={totalCount} ready={fullyReady} />
        </CardContent>
      </Card>

      {/* Gap checklist */}
      <Card>
        <CardContent className="py-4">
          <p className="label-xs mb-3">Setup Checklist</p>
          <GapRow
            label="Curriculum Level"
            count={missingCurriculum}
            total={totalCount}
            link="/director/players"
            linkLabel="Assign via Player Profiles"
          />
          <GapRow
            label="Group Assignment"
            count={missingGroup}
            total={totalCount}
            link="/director/players"
            linkLabel="Assign via Player Profiles"
          />
          <GapRow
            label="Development Profile (strengths + needs)"
            count={missingDev}
            total={totalCount}
            link="/director/players/development-intake"
            linkLabel="Development Intake"
          />
          <GapRow
            label="Current Priority"
            count={missingPriority}
            total={totalCount}
            link="/director/players/development-intake"
            linkLabel="Development Intake"
          />
        </CardContent>
      </Card>

      {/* Individual player list */}
      <div>
        <p className="label-xs mb-3">Player Readiness</p>
        <div className="space-y-1.5">
          {reviewPlayers.map(p => {
            const ready = p.hasCurriculumAssignment && p.hasGroupAssignment && p.hasDevelopmentData && p.hasPriority
            return (
              <div key={p.playerId} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-surface-raised border border-border">
                <Link
                  href={`/director/players/${p.playerId}`}
                  className="flex-1 min-w-0 text-sm text-text-primary hover:text-lime transition-colors truncate"
                >
                  {p.fullName}
                </Link>
                <div className="flex items-center gap-1.5 shrink-0">
                  <GraduationCap
                    className={`w-3.5 h-3.5 ${p.hasCurriculumAssignment ? 'text-lime' : 'text-surface-raised'}`}
                  />
                  <Users
                    className={`w-3.5 h-3.5 ${p.hasGroupAssignment ? 'text-lime' : 'text-surface-raised'}`}
                  />
                  <Sparkles
                    className={`w-3.5 h-3.5 ${p.hasDevelopmentData ? 'text-lime' : 'text-surface-raised'}`}
                  />
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${p.hasPriority ? 'text-lime' : 'text-surface-raised'}`}
                  />
                </div>
                {ready && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30 shrink-0">
                    Ready
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick links */}
      <Card>
        <CardContent className="py-4 space-y-2">
          <p className="label-xs mb-3">Quick Links</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/director/players/import" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Import Players
            </Link>
            <Link href="/director/players/development-intake" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Development Intake
            </Link>
            <Link href="/director/players" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors">
              <Users className="w-3.5 h-3.5" />
              All Players
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="text-[10px] text-text-muted">
        Players with all four attributes set are fully ready for Coach Class Intelligence and Adaptive Session Suggestions.
      </p>
    </div>
  )
}
