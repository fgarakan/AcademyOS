import Link from 'next/link'
import { Upload, Users, UserPlus, Zap, ChevronRight } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getPlayerSummaries } from '@/lib/backend/players'
import { PlayersDirectoryClient } from './_components/PlayersDirectoryClient'
import { DonnaPlayersPresenceCTA } from '@/components/donna/DonnaKpiExplainerPanel'
import { DonnaScreenBriefStatic } from '@/components/donna/DonnaScreenBrief'
import { DonnaCommandSection } from '@/components/donna/DonnaCommandSection'

export interface PlayerCurriculumEntry {
  levelName: string
  stage: string
  advancementEligible: boolean
}

export default async function PlayersPage() {
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

  const players = await getPlayerSummaries(supabase, academyId)

  // Enrich with new curriculum system data from player_curriculum_states + curriculum_levels.
  // rawDb avoids TS2589 on multi-join; RLS enforces academy scoping.
  const rawDb = supabase as any
  const curriculumMap: Record<string, PlayerCurriculumEntry> = {}

  const playerIds = players.map(p => p.player_id).filter(Boolean) as string[]
  if (playerIds.length > 0) {
    const { data: stateRows } = await rawDb
      .from('player_curriculum_states')
      .select('player_id, current_level_id, advancement_eligible')
      .eq('academy_id', academyId)
      .in('player_id', playerIds)

    if (stateRows && stateRows.length > 0) {
      const levelIds = stateRows
        .map((r: { current_level_id: string | null }) => r.current_level_id)
        .filter(Boolean) as string[]

      const { data: levelRows } = levelIds.length > 0
        ? await rawDb
            .from('curriculum_levels')
            .select('id, display_name, stage')
            .in('id', levelIds)
        : { data: [] }

      const levelMap = new Map<string, { display_name: string; stage: string }>(
        (levelRows ?? []).map((l: { id: string; display_name: string; stage: string }) => [l.id, l])
      )

      for (const row of stateRows as Array<{ player_id: string; current_level_id: string | null; advancement_eligible: boolean }>) {
        if (!row.player_id || !row.current_level_id) continue
        const level = levelMap.get(row.current_level_id)
        if (!level) continue
        curriculumMap[row.player_id] = {
          levelName: level.display_name,
          stage: level.stage,
          advancementEligible: row.advancement_eligible ?? false,
        }
      }
    }
  }

  const missingCurriculumCount = playerIds.filter(
    id => !curriculumMap[id]
  ).length

  const advancementReadyPlayers = players
    .filter(p => p.player_id && curriculumMap[p.player_id]?.advancementEligible)
    .slice(0, 5)

  // Compute named signals for DONNA chip (director-only, no sensitive data exposed)
  const namedSignals: Array<{ name: string; reason: string }> = []
  const now = new Date()
  for (const p of players) {
    if (!p.player_id || !p.full_name) continue
    if (p.player_status === 'on_hold') {
      namedSignals.push({ name: p.full_name, reason: 'on hold' })
    } else if (p.assessment_status === 'overdue') {
      namedSignals.push({ name: p.full_name, reason: 'assessment overdue' })
    } else if (!curriculumMap[p.player_id]) {
      namedSignals.push({ name: p.full_name, reason: 'no curriculum level' })
    } else if (typeof p.score_delta === 'number' && p.score_delta < -5) {
      namedSignals.push({ name: p.full_name, reason: 'declining score' })
    }
    if (namedSignals.length >= 5) break
  }

  const assessmentDueCount = players.filter(p =>
    p.assessment_status === 'overdue' ||
    (p.next_assessment_due && new Date(p.next_assessment_due) < now)
  ).length

  // DONNA UI Constitution brief for players list
  const activePlayers = players.filter(p => p.player_status === 'active').length
  const playersBrief = (() => {
    if (players.length === 0) return 'No players yet. Add your first player to start tracking development.'
    const parts: string[] = [`${activePlayers} active player${activePlayers !== 1 ? 's' : ''}`]
    if (missingCurriculumCount > 0) parts.push(`${missingCurriculumCount} missing a level`)
    if (advancementReadyPlayers.length > 0) parts.push(`${advancementReadyPlayers.length} ready for advancement`)
    if (assessmentDueCount > 0) parts.push(`${assessmentDueCount} with overdue assessment`)
    return parts.join(' · ') + '.'
  })()

  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-5xl">
      {/* DONNA UI Constitution brief — Sprint 1123 */}
      <DonnaScreenBriefStatic
        brief={playersBrief}
        primaryActionLabel="Add Player"
        primaryActionHref="/director/players/new"
        emphasis={assessmentDueCount > 0 || missingCurriculumCount > 0 ? 'urgent' : 'normal'}
      />

      {/* Sprint 1156: DONNA Command Section */}
      <DonnaCommandSection pagePath="/director/players" />

      {/* Sprint 820: data-donna-focus-id on page header for DONNA "player directory" highlight */}
      <div className="flex items-start justify-between gap-4" data-donna-focus-id="player-directory-summary">
        <div>
          <p className="page-eyebrow">Academy</p>
          <h1 className="page-title">Player Directory</h1>
          <p className="page-subtitle">
            {players.length > 0
              ? `${players.length} player${players.length !== 1 ? 's' : ''} registered`
              : 'Add your first player or import a roster to get started.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {missingCurriculumCount > 0 && (
            // Sprint 820: data-donna-focus-id for DONNA "players without levels" highlight
            <Link
              href="/director/curriculum"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-status-orange/30 bg-status-orange/5 text-[11px] text-status-orange hover:bg-status-orange/10 transition-colors"
              data-donna-focus-id="players-missing-level"
            >
              {missingCurriculumCount} without curriculum level
            </Link>
          )}
          {/* Sprint 820: data-donna-focus-id for DONNA "add player" highlight */}
          <Link
            href="/director/players/new"
            className="btn-lime flex items-center gap-2 text-sm"
            data-donna-focus-id="add-player-button"
          >
            <UserPlus className="w-4 h-4" />
            Add player
          </Link>
          <Link
            href="/director/players/import"
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" />
            Import
          </Link>
        </div>
      </div>

      {/* Advancement-ready players — action prompt */}
      {advancementReadyPlayers.length > 0 && (
        <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-[11px] uppercase tracking-widest font-semibold text-lime/80">
              {advancementReadyPlayers.length} player{advancementReadyPlayers.length !== 1 ? 's' : ''} ready to advance
            </p>
          </div>
          <div className="space-y-1">
            {advancementReadyPlayers.map(p => (
              <Link
                key={p.player_id}
                href={`/director/players/${p.player_id}?tab=skill-path`}
                className="flex items-center justify-between gap-3 text-xs text-text-primary hover:text-lime transition-colors py-0.5"
              >
                <span>{p.full_name ?? '—'}</span>
                <span className="flex items-center gap-0.5 text-lime/60 hover:text-lime">
                  Review readiness <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* DONNA players presence entry point — shown only when actionable signals exist.
          Sprint 1042: hide when roster has no flags; showing "Who needs attention?" with nothing
          to surface is clutter. The chip reappears the moment any signal is detected. */}
      {(namedSignals.length > 0 || assessmentDueCount > 0 || missingCurriculumCount > 0) && (
        <DonnaPlayersPresenceCTA
          activePlayers={players.length}
          missingCurriculumCount={missingCurriculumCount}
          advancementReadyCount={advancementReadyPlayers.length}
          namedSignals={namedSignals}
          assessmentDueCount={assessmentDueCount}
        />
      )}

      <PlayersDirectoryClient players={players} curriculumMap={curriculumMap} />
    </div>
  )
}
