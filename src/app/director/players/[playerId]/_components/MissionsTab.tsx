// Sprint 1113-1120 — Missions Tab
// Server Component — fetches missions from player_mission_assignments.
// Shows missions grouped by status. Director can see pending_review items with action CTA.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { CheckCircle2, Circle, Clock, SkipForward, Target, Zap, Trophy, Heart, Brain } from 'lucide-react'
import { approveMissionFormAction, skipMissionFormAction } from './missionFormActions'

interface MissionsTabProps {
  playerId: string
  academyId: string
}

interface MissionRow {
  id: string
  mission_label: string
  mission_description: string | null
  status: string
  source_type: string
  assigned_by: string | null
  curriculum_level_key: string | null
  period_label: string | null
  starts_at: string | null
  ends_at: string | null
  completion_note: string | null
  completed_at: string | null
  review_notes: string | null
  created_at: string
}

type StatusGroup = 'pending_review' | 'active' | 'completed' | 'other'

const PATHWAY_COLORS: Record<string, string> = {
  skill:       'text-lime',
  competition: 'text-status-blue',
  fitness:     'text-status-orange',
  mental:      'text-status-green',
}

const STATUS_CONFIG: Record<StatusGroup, { label: string; icon: React.ElementType; className: string }> = {
  pending_review: { label: 'Pending Review', icon: Clock,        className: 'text-status-orange' },
  active:         { label: 'Active Missions', icon: Target,      className: 'text-lime' },
  completed:      { label: 'Completed',       icon: CheckCircle2, className: 'text-status-green' },
  other:          { label: 'Archived / Skipped', icon: SkipForward, className: 'text-text-muted' },
}

function groupStatus(status: string): StatusGroup {
  if (status === 'pending_review') return 'pending_review'
  if (status === 'active') return 'active'
  if (status === 'completed') return 'completed'
  return 'other'
}

function MissionCard({ mission, showActions }: { mission: MissionRow; showActions: boolean }) {
  const group = groupStatus(mission.status)
  const config = STATUS_CONFIG[group]
  const StatusIcon = config.icon

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <StatusIcon className={`w-4 h-4 ${config.className} shrink-0 mt-0.5`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-tight">{mission.mission_label}</p>
            {mission.mission_description && (
              <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">{mission.mission_description}</p>
            )}
          </div>
        </div>
        <span className={`shrink-0 text-[8px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border ${
          group === 'pending_review' ? 'text-status-orange bg-status-orange/8 border-status-orange/20' :
          group === 'active' ? 'text-lime bg-lime/8 border-lime/20' :
          group === 'completed' ? 'text-status-green bg-status-green/8 border-status-green/20' :
          'text-text-muted bg-surface-raised border-border'
        }`}>
          {mission.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 flex-wrap">
        {mission.curriculum_level_key && (
          <span className="text-[10px] text-text-muted">{mission.curriculum_level_key}</span>
        )}
        {mission.period_label && (
          <span className="text-[10px] text-text-muted">{mission.period_label}</span>
        )}
        {mission.source_type !== 'director' && (
          <span className="text-[10px] text-text-muted capitalize">via {mission.source_type}</span>
        )}
        <span className="text-[10px] text-text-muted ml-auto">
          {new Date(mission.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Completion note */}
      {mission.completion_note && (
        <p className="text-[10px] text-status-green leading-relaxed border-t border-border pt-2">
          ✓ {mission.completion_note}
        </p>
      )}

      {/* Director actions for pending_review */}
      {showActions && group === 'pending_review' && (
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <form action={approveMissionFormAction.bind(null, mission.id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lime text-base text-[10px] font-semibold hover:brightness-110 transition-all"
            >
              <CheckCircle2 className="w-3 h-3" />
              Approve
            </button>
          </form>
          <form action={skipMissionFormAction.bind(null, mission.id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-[10px] font-medium text-text-muted hover:text-text-secondary hover:border-border-strong transition-all"
            >
              <SkipForward className="w-3 h-3" />
              Skip
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export async function MissionsTab({ playerId, academyId }: MissionsTabProps) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <p className="text-xs text-text-muted">Not authenticated.</p>

  const rawDb = supabase as any

  let missions: MissionRow[] = []
  let isSchemaMissing = false

  try {
    const { data, error } = await rawDb
      .from('player_mission_assignments')
      .select([
        'id', 'mission_label', 'mission_description', 'status', 'source_type',
        'assigned_by', 'curriculum_level_key', 'period_label',
        'starts_at', 'ends_at', 'completion_note', 'completed_at',
        'review_notes', 'created_at',
      ].join(', '))
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })

    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      isSchemaMissing = true
    } else {
      missions = data ?? []
    }
  } catch {
    isSchemaMissing = true
  }

  if (isSchemaMissing) {
    return (
      <div className="rounded-xl bg-surface-raised border border-border px-4 py-6 text-center">
        <p className="text-xs text-text-muted">Migration 076 not yet applied. Apply to enable player missions.</p>
      </div>
    )
  }

  // Group missions by status
  const groups: Record<StatusGroup, MissionRow[]> = {
    pending_review: missions.filter(m => m.status === 'pending_review'),
    active:         missions.filter(m => m.status === 'active'),
    completed:      missions.filter(m => m.status === 'completed'),
    other:          missions.filter(m => !['pending_review', 'active', 'completed'].includes(m.status)),
  }

  if (missions.length === 0) {
    return (
      <div className="rounded-xl bg-surface border border-border px-6 py-8 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
          <Target className="w-6 h-6 text-text-muted" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary mb-1">No missions yet</p>
          <p className="text-xs text-text-muted leading-relaxed max-w-xs">
            Missions are generated automatically when a player is placed, or can be added manually by the director.
          </p>
        </div>
      </div>
    )
  }

  const orderedGroups: StatusGroup[] = ['pending_review', 'active', 'completed', 'other']

  return (
    <div className="space-y-6">
      {orderedGroups.map(group => {
        const groupMissions = groups[group]
        if (groupMissions.length === 0) return null

        const config = STATUS_CONFIG[group]
        const StatusIcon = config.icon

        return (
          <div key={group}>
            <div className="flex items-center gap-2 mb-3">
              <StatusIcon className={`w-3.5 h-3.5 ${config.className}`} />
              <p className="label-xs text-text-muted">{config.label}</p>
              <span className={`text-[10px] font-bold ${config.className} bg-opacity-10 rounded px-1.5 py-0.5`}>
                {groupMissions.length}
              </span>
            </div>

            {group === 'pending_review' && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/15">
                <Clock className="w-3 h-3 text-status-orange shrink-0" />
                <p className="text-[11px] text-text-muted">
                  These missions were generated from the development blueprint. Review and approve to make them visible to coaches and players.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {groupMissions.map(mission => (
                <MissionCard key={mission.id} mission={mission} showActions={group === 'pending_review'} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
