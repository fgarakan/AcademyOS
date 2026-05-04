// Coach Session Gap Brief Panel — Sprint 237
// Async Server Component. Coach internal — never rendered in player or parent views.
// Surfaces per-player coach gap guidance as a session pre-brief.
// Read-only. No mutations. No AI calls. All gap detection is deterministic.

import { AlertTriangle, Eye, ClipboardList } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { detectTrainingGaps } from '@/lib/gaps/trainingGapDetection'
import { detectKnowledgeGaps } from '@/lib/gaps/knowledgeGapDetection'
import { buildCoachGapGuidance } from '@/lib/gaps/roleSpecificGapGuidance'
import type { GapGuidancePriority, RoleSpecificGapGuidance } from '@/lib/gaps/roleSpecificGapGuidance'

interface Props {
  playerIds: string[]
  academyId: string
  rosterNames: Record<string, string>
}

interface PlayerGapContext {
  playerId: string
  fullName: string
  levelName: string | null
  guidance: RoleSpecificGapGuidance
}

export async function CoachSessionGapBriefPanel({ playerIds, academyId, rosterNames }: Props) {
  if (playerIds.length === 0) return null

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Load aggregation for all roster players
  const { data: loadRows } = await rawDb
    .from('player_load_aggregation')
    .select([
      'player_id',
      'sessions_7d', 'sessions_28d', 'duration_28d_min',
      'skill_sessions_28d', 'fitness_sessions_28d', 'competition_sessions_28d',
      'overload_flag', 'fatigue_risk_score', 'fatigue_risk_label',
      'load_trend_7d', 'absences_7d',
    ].join(', '))
    .in('player_id', playerIds)

  const loadMap: Record<string, {
    sessions_7d: number; sessions_28d: number; duration_28d_min: number
    skill_sessions_28d: number; fitness_sessions_28d: number; competition_sessions_28d: number
    overload_flag: boolean; fatigue_risk_score: number; fatigue_risk_label: string
    load_trend_7d: string; absences_7d: number
  }> = {}
  for (const row of (loadRows ?? []) as any[]) {
    loadMap[row.player_id] = row
  }

  // 2. Curriculum state with level name + stage per player
  const { data: csRows } = await rawDb
    .from('player_curriculum_states')
    .select('player_id, curriculum_level_id, curriculum_levels(display_name, stage)')
    .eq('academy_id', academyId)
    .in('player_id', playerIds)

  const csMap: Record<string, { levelId: string; levelName: string; stage: string }> = {}
  const levelIds: string[] = []
  for (const row of (csRows ?? []) as any[]) {
    if (row.curriculum_level_id && row.curriculum_levels) {
      csMap[row.player_id] = {
        levelId: row.curriculum_level_id,
        levelName: row.curriculum_levels.display_name ?? null,
        stage: row.curriculum_levels.stage ?? null,
      }
      if (!levelIds.includes(row.curriculum_level_id)) {
        levelIds.push(row.curriculum_level_id)
      }
    }
  }

  // 3. Gates per level (open gates only)
  const gatesPerLevel: Record<string, Array<{ domain: string; criterion: string }>> = {}
  if (levelIds.length > 0) {
    const { data: gatesData } = await rawDb
      .from('curriculum_gates')
      .select('from_level_id, domain, criterion')
      .in('from_level_id', levelIds)
      .eq('is_active', true)
    for (const g of (gatesData ?? []) as any[]) {
      if (!gatesPerLevel[g.from_level_id]) gatesPerLevel[g.from_level_id] = []
      gatesPerLevel[g.from_level_id].push({ domain: g.domain, criterion: g.criterion })
    }
  }

  // 4. Coach language availability per level
  const hasLangPerLevel: Record<string, boolean> = {}
  const langDomainsPerLevel: Record<string, string[]> = {}
  if (levelIds.length > 0) {
    const { data: langRows } = await rawDb
      .from('curriculum_coach_language')
      .select('level_id, domain')
      .in('level_id', levelIds)
    for (const l of (langRows ?? []) as any[]) {
      hasLangPerLevel[l.level_id] = true
      if (!langDomainsPerLevel[l.level_id]) langDomainsPerLevel[l.level_id] = []
      langDomainsPerLevel[l.level_id].push(l.domain)
    }
  }

  // 5. Drill count per level
  const drillCountPerLevel: Record<string, number> = {}
  if (levelIds.length > 0) {
    const { data: drillRows } = await rawDb
      .from('curriculum_drills')
      .select('level_min_id')
      .in('level_min_id', levelIds)
      .eq('is_active', true)
    for (const d of (drillRows ?? []) as any[]) {
      drillCountPerLevel[d.level_min_id] = (drillCountPerLevel[d.level_min_id] ?? 0) + 1
    }
  }

  // 6. Build coach gap guidance per player
  const playerContexts: PlayerGapContext[] = playerIds.map(playerId => {
    const load = loadMap[playerId] ?? null
    const cs = csMap[playerId] ?? null
    const levelId = cs?.levelId ?? null
    const openGates = levelId ? (gatesPerLevel[levelId] ?? []) : []

    const trainingGaps = detectTrainingGaps({
      player_id: playerId,
      sessions_7d:              load?.sessions_7d ?? null,
      sessions_28d:             load?.sessions_28d ?? null,
      duration_28d_min:         load?.duration_28d_min ?? null,
      skill_sessions_28d:       load?.skill_sessions_28d ?? null,
      fitness_sessions_28d:     load?.fitness_sessions_28d ?? null,
      competition_sessions_28d: load?.competition_sessions_28d ?? null,
      overload_flag:            load?.overload_flag ?? null,
      fatigue_risk_score:       load?.fatigue_risk_score ?? null,
      fatigue_risk_label:       load?.fatigue_risk_label ?? null,
      load_trend_7d:            load?.load_trend_7d ?? null,
      absences_7d:              load?.absences_7d ?? null,
      current_level:            cs?.levelName ?? null,
      current_stage:            cs?.stage ?? null,
      open_gate_count:          openGates.length,
    })

    const knowledgeGaps = detectKnowledgeGaps({
      player_id:              playerId,
      current_level:          cs?.levelName ?? null,
      current_stage:          cs?.stage ?? null,
      open_gates:             openGates,
      has_coach_language:     levelId ? (hasLangPerLevel[levelId] ?? false) : false,
      coach_language_domains: levelId ? (langDomainsPerLevel[levelId] ?? []) : [],
      available_drill_count:  levelId ? (drillCountPerLevel[levelId] ?? 0) : 0,
    })

    const guidance = buildCoachGapGuidance(playerId, trainingGaps, knowledgeGaps)

    return {
      playerId,
      fullName: rosterNames[playerId] ?? 'Unknown Player',
      levelName: cs?.levelName ?? null,
      guidance,
    }
  })

  // Only list players who have at least one guidance item
  const withGuidance = playerContexts.filter(p => p.guidance.items.length > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Session Pre-brief</p>
              <p className="text-text-muted text-xs">Coach internal — not visible to players</p>
            </div>
          </div>
          {withGuidance.length > 0 && (
            <span className="font-mono text-[10px] text-text-muted">
              {withGuidance.length} {withGuidance.length === 1 ? 'player' : 'players'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {withGuidance.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-5 h-5" />}
            title="No gap guidance for this session"
            description="No training or knowledge gaps detected for current roster players."
            className="py-6"
          />
        ) : (
          <ul className="divide-y divide-border">
            {withGuidance.map(ctx => (
              <PlayerGapRow key={ctx.playerId} ctx={ctx} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function PlayerGapRow({ ctx }: { ctx: PlayerGapContext }) {
  const { guidance, fullName, levelName } = ctx
  const topPriority: GapGuidancePriority | null =
    guidance.act_now.length > 0 ? 'act_now' :
    guidance.monitor.length > 0 ? 'monitor' :
    null

  const extraCount = guidance.items.length - 1

  return (
    <li className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
      <PriorityIcon priority={topPriority} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-sm font-medium text-text-primary">{fullName}</span>
          {levelName && (
            <span className="text-[9px] uppercase tracking-widest text-text-muted">{levelName}</span>
          )}
          {topPriority && <PriorityBadge priority={topPriority} />}
          {extraCount > 0 && (
            <span className="text-[9px] text-text-muted">+{extraCount} more</span>
          )}
        </div>
        {guidance.top_action && (
          <p className="text-xs text-text-secondary leading-relaxed">{guidance.top_action}</p>
        )}
      </div>
    </li>
  )
}

function PriorityIcon({ priority }: { priority: GapGuidancePriority | null }) {
  if (priority === 'act_now') {
    return <AlertTriangle className="w-3.5 h-3.5 text-status-red shrink-0 mt-1" />
  }
  if (priority === 'monitor') {
    return <Eye className="w-3.5 h-3.5 text-status-orange shrink-0 mt-1" />
  }
  return <div className="w-3.5 h-3.5 shrink-0" />
}

function PriorityBadge({ priority }: { priority: GapGuidancePriority }) {
  const styles: Record<GapGuidancePriority, string> = {
    act_now:       'bg-status-red/10 text-status-red border-status-red/20',
    monitor:       'bg-status-orange/10 text-status-orange border-status-orange/20',
    informational: 'bg-status-blue/10 text-status-blue border-status-blue/20',
  }
  const labels: Record<GapGuidancePriority, string> = {
    act_now: 'Act now', monitor: 'Monitor', informational: 'Info',
  }
  return (
    <span className={`text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded-full border leading-none ${styles[priority]}`}>
      {labels[priority]}
    </span>
  )
}
