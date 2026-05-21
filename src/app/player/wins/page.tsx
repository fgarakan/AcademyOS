// Sprint 595 — Player Wins Page V1
// Full badge status grid for the player. Shows earned, in-progress, and locked badges.
// Computed from player_requirement_progress — graceful fallback if table absent.
// Player-authenticated via profile_id linkage. No coach notes exposed.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { Star, Lock, Trophy, Flame, ChevronRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { buildBadgeEligibilityReport } from '@/lib/badges/badgeEligibilityEngine'
import { BADGE_DEFINITIONS, getVisibleBadgesForPlayer } from '@/lib/badges/badgeModel'
import type { BadgeEligibilityReport } from '@/lib/badges/badgeEligibilityEngine'
import { buildPlayerProgressIndicators } from '@/lib/player/progressIndicators'
import type { ProgressStatusSummary } from '@/lib/player/evidenceQueries'

const RARITY_STYLE: Record<string, string> = {
  common:    'bg-surface-raised border-border text-text-muted',
  uncommon:  'bg-status-blue/5 border-status-blue/20 text-status-blue',
  rare:      'bg-status-orange/5 border-status-orange/20 text-status-orange',
  legendary: 'bg-lime/5 border-lime/20 text-lime',
}

const STATUS_STYLE = {
  earned:      'bg-lime/5 border-lime/20',
  in_progress: 'bg-surface border-border',
  locked:      'bg-surface-raised border-border opacity-60',
}

export default async function PlayerWinsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let badgeReport: BadgeEligibilityReport | null = null
  let attendanceStreak = 0
  let sessionsAttended = 0
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
      const { data: playerRow } = await rawDb
        .from('players')
        .select('id')
        .eq('academy_id', academyId)
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!playerRow) {
        noAccess = true
      } else {
        // Attendance streak
        const { data: attRows } = await rawDb
          .from('session_attendance')
          .select('status')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .limit(30)

        const attData = (attRows ?? []) as Array<{ status: string }>
        sessionsAttended = attData.filter(r => r.status === 'present' || r.status === 'late').length
        for (const s of attData) {
          if (s.status === 'present' || s.status === 'late') attendanceStreak++
          else break
        }

        // Requirement progress (graceful fallback)
        try {
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

          badgeReport = buildBadgeEligibilityReport({
            playerId: playerRow.id,
            progressSummary,
            progressIndicators,
            promotionReady: null,
            attendanceStreak,
            domainCompletedIds: [],
            levelCompleted: progressSummary.total > 0 && progressSummary.total === (progressSummary.achieved + progressSummary.confirmed),
          })
        } catch {
          // Table absent — show locked state
        }
      }
    }
  }

  const visibleBadges = getVisibleBadgesForPlayer()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">Achievements</p>
        <h1 className="page-title">Wins &amp; Badges</h1>
        <p className="page-subtitle">Badges earned through consistent training and curriculum progress.</p>
      </div>

      {/* No access */}
      {noAccess && (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-text-muted" />
            <p className="text-text-primary text-sm font-medium">Profile not connected</p>
            <p className="text-text-muted text-xs max-w-xs leading-relaxed">
              Ask your academy director to link your profile so your wins appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Attendance streak highlight */}
      {attendanceStreak >= 3 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-status-orange/5 border border-status-orange/20">
          <Flame className="w-4 h-4 text-status-orange shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text-primary">{attendanceStreak}-session streak</p>
            <p className="text-xs text-text-muted">Keep it going!</p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      {badgeReport && (
        <div className="grid grid-cols-3 gap-2">
          <div className="px-3 py-3 rounded-xl bg-lime/5 border border-lime/20 text-center">
            <p className="text-2xl font-mono font-bold text-lime">{badgeReport.earnedCount}</p>
            <p className="text-[9px] uppercase tracking-widest text-lime/60 mt-0.5">Earned</p>
          </div>
          <div className="px-3 py-3 rounded-xl bg-surface border border-border text-center">
            <p className="text-2xl font-mono font-bold text-text-secondary">{badgeReport.inProgressCount}</p>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mt-0.5">In Progress</p>
          </div>
          <div className="px-3 py-3 rounded-xl bg-surface-raised border border-border text-center">
            <p className="text-2xl font-mono font-bold text-text-muted">{badgeReport.lockedCount}</p>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mt-0.5">Locked</p>
          </div>
        </div>
      )}

      {/* Badge grid */}
      {!noAccess && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-text-muted" />
              <p className="text-sm font-semibold text-text-primary">All Badges</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleBadges.map(def => {
              const award = badgeReport?.awards.find(a => a.badgeId === def.id)
              const status = award?.status ?? 'locked'
              const pct = award && award.progressMax > 0
                ? Math.round((award.progress / award.progressMax) * 100)
                : 0
              return (
                <div
                  key={def.id}
                  className={`px-3 py-3 rounded-xl border ${STATUS_STYLE[status]}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${RARITY_STYLE[def.rarity]}`}>
                      {status === 'earned'
                        ? <Star className="w-3.5 h-3.5" />
                        : status === 'in_progress'
                        ? <Flame className="w-3.5 h-3.5 text-status-orange" />
                        : <Lock className="w-3.5 h-3.5 text-text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-semibold ${status === 'earned' ? 'text-lime' : status === 'in_progress' ? 'text-text-primary' : 'text-text-muted'}`}>
                          {def.name}
                        </p>
                        <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${RARITY_STYLE[def.rarity]}`}>
                          {def.rarity}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{def.description}</p>
                      {status === 'in_progress' && award && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] text-text-muted">{award.progressLabel}</p>
                            <p className="text-[9px] text-text-muted">{pct}%</p>
                          </div>
                          <div className="h-1 bg-surface-raised rounded-full overflow-hidden">
                            <div className="h-full bg-status-orange/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                      {status === 'earned' && (
                        <p className="text-[9px] text-lime/60 mt-1">Earned</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Attendance note */}
      {sessionsAttended > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
          <Trophy className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[10px] text-text-muted">
            {sessionsAttended} session{sessionsAttended !== 1 ? 's' : ''} attended. Badges update as you progress.
          </p>
        </div>
      )}

      {/* Back link */}
      <Link href="/player" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
        <ChevronRight className="w-3 h-3 rotate-180" />
        Back to Home
      </Link>
    </div>
  )
}
