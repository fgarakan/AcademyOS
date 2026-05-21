// Sprint 596 — Player Celebration V1
// Celebration page for mission completion. Shows earned badges and next mission.
// Player-authenticated via profile_id linkage. Director-approved data only.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { Star, Trophy, ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { buildBadgeEligibilityReport, getEarnedBadges } from '@/lib/badges/badgeEligibilityEngine'
import { BADGE_DEFINITIONS } from '@/lib/badges/badgeModel'
import { buildPlayerProgressIndicators } from '@/lib/player/progressIndicators'
import type { ProgressStatusSummary } from '@/lib/player/evidenceQueries'

export default async function PlayerCelebrationPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let playerFirstName: string | null = null
  let earnedBadgeNames: string[] = []
  let nextMissionTitle: string | null = null
  let currentLevelName: string | null = null

  if (user) {
    const rawDb = supabase as any

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id ?? null

    if (academyId) {
      const { data: playerRow } = await rawDb
        .from('players')
        .select('id, first_name, full_name')
        .eq('academy_id', academyId)
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (playerRow) {
        playerFirstName = playerRow.first_name ?? playerRow.full_name ?? null

        // Current level name
        const { data: csRows } = await rawDb
          .from('player_curriculum_states')
          .select('current_level_id')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .limit(1)
        const levelId = csRows?.[0]?.current_level_id ?? null
        if (levelId) {
          const { data: lvl } = await rawDb
            .from('curriculum_levels')
            .select('display_name')
            .eq('id', levelId)
            .single()
          currentLevelName = lvl?.display_name ?? null
        }

        // Next mission (next active priority)
        const { data: priorityRows } = await rawDb
          .from('player_priorities')
          .select('title')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .eq('is_active', true)
          .order('priority_rank', { ascending: true })
          .limit(2)
        if (priorityRows && priorityRows.length > 1) {
          nextMissionTitle = priorityRows[1].title ?? null
        } else if (priorityRows && priorityRows.length === 1) {
          nextMissionTitle = priorityRows[0].title ?? null
        }

        // Earned badges (graceful fallback)
        try {
          const { data: attRows } = await rawDb
            .from('session_attendance')
            .select('status')
            .eq('player_id', playerRow.id)
            .eq('academy_id', academyId)
            .limit(30)
          let attendanceStreak = 0
          for (const s of (attRows ?? []) as Array<{ status: string }>) {
            if (s.status === 'present' || s.status === 'late') attendanceStreak++
            else break
          }

          const { data: progressRows } = await rawDb
            .from('player_requirement_progress')
            .select('id, status, curriculum_level_id')
            .eq('player_id', playerRow.id)
            .eq('academy_id', academyId)
            .limit(200)

          const rows = (progressRows ?? []) as Array<{ id: string; status: string; curriculum_level_id: string }>
          const progressSummary: ProgressStatusSummary = {
            total: rows.length,
            notStarted: rows.filter(r => r.status === 'not_started').length,
            inProgress: rows.filter(r => r.status === 'in_progress').length,
            achieved: rows.filter(r => r.status === 'met').length,
            confirmed: rows.filter(r => r.status === 'waived').length,
          }
          const progressIndicators = buildPlayerProgressIndicators(progressSummary, [])
          const report = buildBadgeEligibilityReport({
            playerId: playerRow.id,
            progressSummary,
            progressIndicators,
            promotionReady: null,
            attendanceStreak,
            domainCompletedIds: [],
            levelCompleted: progressSummary.total > 0 && progressSummary.total === (progressSummary.achieved + progressSummary.confirmed),
          })
          earnedBadgeNames = getEarnedBadges(report).map(a => BADGE_DEFINITIONS[a.badgeId].name)
        } catch {
          // Graceful fallback
        }
      }
    }
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="pt-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-lime/10 border border-lime/20 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-lime" />
        </div>
        <p className="page-eyebrow text-lime">Achievement Unlocked</p>
        <h1 className="page-title">
          {playerFirstName ? `${playerFirstName}, you did it!` : 'Mission Complete!'}
        </h1>
        <p className="page-subtitle">
          {currentLevelName
            ? `Keep pushing in ${currentLevelName}.`
            : 'Your coach and director will have your next mission ready soon.'}
        </p>
      </div>

      {/* Earned badges */}
      {earnedBadgeNames.length > 0 && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-xs font-semibold text-text-primary">Badges Earned</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {earnedBadgeNames.map(name => (
                <span key={name} className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-lime/10 border border-lime/20 text-lime font-semibold">
                  <Star className="w-2.5 h-2.5" />
                  {name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coming soon if no badges yet */}
      {earnedBadgeNames.length === 0 && (
        <Card>
          <CardContent className="py-6 space-y-2 text-center">
            <Sparkles className="w-7 h-7 text-lime/40 mx-auto" />
            <p className="text-text-primary text-sm font-medium">Badges coming as you progress</p>
            <p className="text-text-muted text-xs leading-relaxed max-w-xs mx-auto">
              Complete requirements and attend consistently — your first badge is closer than you think.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Next mission */}
      {nextMissionTitle && (
        <Link href="/player/missions">
          <div className="rounded-2xl bg-lime/5 border border-lime/20 px-4 py-4 flex items-center justify-between gap-3 hover:bg-lime/8 transition-colors">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-lime mb-1">Your Next Mission</p>
              <p className="text-sm font-semibold text-text-primary">{nextMissionTitle}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-lime/60 shrink-0" />
          </div>
        </Link>
      )}

      {/* See all badges */}
      <Link href="/player/wins">
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 flex items-center justify-between hover:border-lime/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
              <Trophy className="w-3.5 h-3.5 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary">See all badges</p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
        </div>
      </Link>

      <Link href="/player" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
        <ChevronRight className="w-3 h-3 rotate-180" />
        Back to Home
      </Link>
    </div>
  )
}
