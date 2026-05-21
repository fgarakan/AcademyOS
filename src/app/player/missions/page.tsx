// Player Mission Map — Sprint 1070 + Sprint 601 (mission engine recommendation)
// Shows active priorities as player missions: Active, Next Up, Future.
// Director-set priority data only. No raw coach notes. No automatic level movement.
// Player-authenticated via profile_id linkage — never URL params.

import Link from 'next/link'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { CheckCircle2, Lock, ArrowRight, ChevronRight, Map, AlertCircle, Sparkles } from 'lucide-react'
import { buildMissionEngineReport } from '@/lib/player/missionEngine'
import { MISSION_DEFINITIONS } from '@/lib/player/missionModel'
import { buildPlayerProgressIndicators } from '@/lib/player/progressIndicators'
import type { ProgressStatusSummary } from '@/lib/player/evidenceQueries'

interface PriorityRow {
  id: string
  title: string
  description: string | null
  category: string | null
  urgency: string | null
  priority_rank: number | null
}

const CATEGORY_LABELS: Record<string, string> = {
  technical:   'Technical',
  tactical:    'Tactical',
  fitness:     'Fitness',
  competition: 'Competition',
  behavioral:  'Behavioral',
  mental:      'Mental',
}

const URGENCY_LABELS: Record<string, string> = {
  critical: 'Priority focus',
  high:     'High focus',
  medium:   'Building toward',
  low:      'When ready',
}

function deriveMissionStatus(rank: number | null, total: number): 'active' | 'next' | 'future' {
  if (rank === 1 || rank === null) return 'active'
  if (rank === 2 && total > 1) return 'next'
  return 'future'
}

interface MissionCardProps {
  priority: PriorityRow
  status: 'active' | 'next' | 'future'
}

function MissionCard({ priority, status }: MissionCardProps) {
  const isActive = status === 'active'
  const isNext = status === 'next'
  const isFuture = status === 'future'
  const categoryLabel = CATEGORY_LABELS[priority.category ?? ''] ?? priority.category ?? 'General'
  const urgencyLabel = URGENCY_LABELS[priority.urgency ?? ''] ?? null

  return (
    <div className={`rounded-xl border px-4 py-4 ${
      isActive  ? 'bg-lime/5 border-lime/20' :
      isNext    ? 'bg-status-blue/5 border-status-blue/15' :
      'bg-surface-raised border-border opacity-70'
    }`}>
      {/* Status badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${
          isActive ? 'bg-lime/10 text-lime' :
          isNext   ? 'bg-status-blue/10 text-status-blue' :
          'bg-surface border-border text-text-muted'
        }`}>
          {isActive && <CheckCircle2 className="w-2.5 h-2.5" />}
          {isFuture && <Lock className="w-2.5 h-2.5" />}
          {isActive ? 'Active' : isNext ? 'Next Up' : 'Future'}
        </span>
        <span className="text-[10px] text-text-muted shrink-0">{categoryLabel}</span>
      </div>

      {/* Title */}
      <p className={`text-sm font-semibold leading-snug mb-1 ${
        isFuture ? 'text-text-secondary' : 'text-text-primary'
      }`}>
        {priority.title}
      </p>

      {/* Description */}
      {priority.description && (
        <p className="text-xs text-text-secondary leading-relaxed mb-3">
          {priority.description}
        </p>
      )}

      {/* Urgency + CTA row */}
      <div className="flex items-center justify-between gap-2 mt-2">
        {urgencyLabel && (
          <span className="text-[10px] text-text-muted">{urgencyLabel}</span>
        )}
        {isActive && (
          <Link
            href={`/player/missions/${priority.id}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime hover:text-lime/80 transition-colors ml-auto"
          >
            See details <ArrowRight className="w-3 h-3" />
          </Link>
        )}
        {isNext && (
          <span className="inline-flex items-center gap-1 text-[11px] text-status-blue ml-auto">
            Coming up <ChevronRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  )
}

export default async function PlayerMissionsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let priorities: PriorityRow[] = []
  let noMappingReason: string | null = null
  let currentLevelName: string | null = null
  let enginePrimaryMissionLabel: string | null = null
  let enginePrimaryMissionReason: string | null = null

  if (user) {
    const rawDb = supabase as any

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id ?? null

    if (!academyId) {
      noMappingReason = 'no_academy'
    } else {
      const { data: playerRow } = await rawDb
        .from('players')
        .select('id')
        .eq('academy_id', academyId)
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!playerRow) {
        noMappingReason = 'no_player_link'
      } else {
        // Fetch active priorities
        const { data: priorityRows } = await rawDb
          .from('player_priorities')
          .select('id, title, description, category, urgency, priority_rank')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .eq('is_active', true)
          .order('priority_rank', { ascending: true })
          .limit(6)

        priorities = (priorityRows ?? []) as PriorityRow[]

        // Fetch current level name
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

        // Mission engine recommendation (graceful fallback)
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
          const { data: attRows } = await rawDb
            .from('session_attendance')
            .select('status')
            .eq('player_id', playerRow.id)
            .eq('academy_id', academyId)
            .limit(20)
          let attendanceStreak = 0
          for (const s of (attRows ?? []) as Array<{ status: string }>) {
            if (s.status === 'present' || s.status === 'late') attendanceStreak++
            else break
          }
          const { data: obsRows } = await rawDb
            .from('coach_observations')
            .select('id')
            .eq('player_id', playerRow.id)
            .eq('academy_id', academyId)
            .limit(1)
          const engineReport = buildMissionEngineReport({
            playerId: playerRow.id,
            progressSummary,
            progressIndicators: buildPlayerProgressIndicators(progressSummary, []),
            attendanceStreak,
            observationCount: (obsRows ?? []).length,
            nextAssessmentDue: null,
            promotionReady: null,
          })
          if (engineReport.primaryMission) {
            const def = MISSION_DEFINITIONS[engineReport.primaryMission.missionId]
            enginePrimaryMissionLabel = def.title
            enginePrimaryMissionReason = engineReport.recommendedMissions[0]?.reason ?? null
          }
        } catch {
          // Graceful fallback
        }
      }
    }
  }

  const total = priorities.length
  const active   = priorities.filter((_, i) => deriveMissionStatus(priorities[i].priority_rank, total) === 'active')
  const next     = priorities.filter((_, i) => deriveMissionStatus(priorities[i].priority_rank, total) === 'next')
  const future   = priorities.filter((_, i) => deriveMissionStatus(priorities[i].priority_rank, total) === 'future')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">
          {currentLevelName ?? 'Missions'}
        </p>
        <h1 className="page-title">My Missions</h1>
        <p className="page-subtitle">Complete missions to build toward your next level.</p>
      </div>

      {/* No mapping state */}
      {noMappingReason && (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-text-muted" />
            <p className="text-text-primary text-sm font-medium">Missions not available</p>
            <p className="text-text-muted text-xs leading-relaxed max-w-xs">
              Ask your academy director to link your profile so your missions appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No priorities yet */}
      {!noMappingReason && total === 0 && (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <Map className="w-8 h-8 text-text-muted" />
            <p className="text-text-primary text-sm font-medium">Your first mission is on its way</p>
            <p className="text-text-muted text-xs leading-relaxed max-w-xs">
              Your coach will set up your first mission soon. Keep showing up to every session.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active missions */}
      {active.length > 0 && (
        <section className="space-y-2">
          <p className="label-xs text-lime">Current Mission</p>
          {active.map(p => (
            <MissionCard key={p.id} priority={p} status="active" />
          ))}
        </section>
      )}

      {/* Next missions */}
      {next.length > 0 && (
        <section className="space-y-2">
          <p className="label-xs text-status-blue">Next Mission</p>
          {next.map(p => (
            <MissionCard key={p.id} priority={p} status="next" />
          ))}
        </section>
      )}

      {/* Future missions */}
      {future.length > 0 && (
        <section className="space-y-2">
          <p className="label-xs text-text-muted">Future Missions</p>
          {future.map(p => (
            <MissionCard key={p.id} priority={p} status="future" />
          ))}
        </section>
      )}

      {/* DONNA mission engine suggestion */}
      {enginePrimaryMissionLabel && (
        <div className="rounded-xl border border-status-blue/20 bg-status-blue/5 px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-status-blue shrink-0" />
            <p className="text-[9px] uppercase tracking-widest text-status-blue font-semibold">DONNA suggests</p>
          </div>
          <p className="text-xs font-medium text-text-primary">{enginePrimaryMissionLabel}</p>
          {enginePrimaryMissionReason && (
            <p className="text-[10px] text-text-muted">{enginePrimaryMissionReason}</p>
          )}
          <p className="text-[9px] text-text-muted/60">Suggestion — your coach's mission always takes priority.</p>
        </div>
      )}

      {/* Level Up discovery */}
      {total > 0 && (
        <Link href="/player/level-up">
          <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 flex items-center justify-between hover:border-lime/20 transition-colors">
            <div>
              <p className="text-sm font-medium text-text-primary">Level Up Requirements</p>
              <p className="text-xs text-text-muted">See what you need to advance</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
          </div>
        </Link>
      )}

      {/* Footer note */}
      {total > 0 && (
        <p className="text-[10px] text-text-muted text-center px-4">
          Missions are set by your coach and director. Keep working on your active mission.
        </p>
      )}
    </div>
  )
}
