'use client'

import { Users, Layers, Clock, AlertCircle, BookOpen, Target, Shield, MessageSquare, User } from 'lucide-react'

export interface ImpactEstimate {
  playersAffected: number
  levelsAffected: number
  estimatedRolloutWeeks: number
  changeType: 'add_drill' | 'add_gate' | 'add_fitness' | 'modify_gate' | 'remove_drill' | 'add_mission' | 'rewrite_level'
}

interface Props {
  estimate: ImpactEstimate | null
  levelName: string
}

const CHANGE_LABELS: Record<ImpactEstimate['changeType'], string> = {
  add_drill:     'Adding a drill',
  add_gate:      'Adding an assessment gate',
  add_fitness:   'Adding a fitness exercise',
  modify_gate:   'Modifying a gate requirement',
  remove_drill:  'Removing a drill',
  add_mission:   'Adding a player mission',
  rewrite_level: 'Rewriting level intent',
}

const IMPACT_AREAS: Record<ImpactEstimate['changeType'], Array<{ icon: typeof BookOpen; label: string; note: string }>> = {
  add_drill:     [
    { icon: Target,       label: 'Drills at this level',         note: 'One new drill added to the coach drill library for this level' },
    { icon: BookOpen,     label: 'Session templates',            note: 'Coaches can add this drill to session templates when ready' },
    { icon: User,         label: 'Players at this level',        note: 'Players enrolled at this level become eligible for this drill' },
  ],
  add_gate:      [
    { icon: Shield,       label: 'Assessment gates',             note: 'One new gate added — players at this level must pass it to advance' },
    { icon: User,         label: 'Players approaching advance',  note: 'Players near advancement will need to pass this gate before promotion' },
    { icon: MessageSquare,label: 'Parent-safe summaries',        note: 'Gate names appear in parent development updates when results are recorded' },
  ],
  add_fitness:   [
    { icon: Target,       label: 'Fitness guidance',             note: 'Off-court fitness content updated for this level' },
    { icon: BookOpen,     label: 'Coach context',                note: 'Coaches see this fitness guidance in their session planning context' },
  ],
  modify_gate:   [
    { icon: Shield,       label: 'Assessment gates',             note: 'Gate threshold or criterion changed — existing evaluations are not retroactively affected' },
    { icon: User,         label: 'Players not yet evaluated',    note: 'Players who haven\'t been evaluated on this gate will see the new threshold' },
  ],
  remove_drill:  [
    { icon: Target,       label: 'Drills at this level',         note: 'One drill removed — existing sessions using this drill are not affected' },
    { icon: BookOpen,     label: 'Session templates',            note: 'Templates referencing this drill may need manual update after removal' },
  ],
  add_mission:   [
    { icon: Target,       label: 'Player missions',              note: 'One new mission added — visible to players at this level after approval' },
    { icon: User,         label: 'Players at this level',        note: 'All enrolled players at this level will see this mission in their portal' },
  ],
  rewrite_level: [
    { icon: BookOpen,     label: 'Level intent and goal',        note: 'Level description updated — coaches and directors see the new framing' },
    { icon: MessageSquare,label: 'Parent communications',        note: 'Level name used in parent updates — wording change visible in future reports' },
    { icon: User,         label: 'Player profiles',              note: 'Level goals appear in player development summaries — wording update only' },
  ],
}

export function CurriculumImpactPreviewPanel({ estimate, levelName }: Props) {
  if (!estimate) {
    return (
      <div className="rounded-2xl border border-border border-dashed bg-surface p-6 text-center space-y-2">
        <Layers className="w-5 h-5 text-text-muted mx-auto" />
        <p className="text-[11px] text-text-muted">
          Draft a change above to see its estimated impact on players and levels.
        </p>
      </div>
    )
  }

  const areas = IMPACT_AREAS[estimate.changeType] ?? []

  return (
    <div className="rounded-2xl border border-border bg-surface-raised overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[12px] font-semibold text-text-primary">Impact preview — {levelName}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{CHANGE_LABELS[estimate.changeType]}</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 divide-x divide-border">
        <div className="px-4 py-4 space-y-1 text-center">
          <Users className="w-4 h-4 text-status-blue mx-auto" />
          <p className="text-[20px] font-mono font-bold text-text-primary">{estimate.playersAffected}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Players</p>
        </div>
        <div className="px-4 py-4 space-y-1 text-center">
          <Layers className="w-4 h-4 text-lime mx-auto" />
          <p className="text-[20px] font-mono font-bold text-text-primary">{estimate.levelsAffected}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Level{estimate.levelsAffected !== 1 ? 's' : ''}</p>
        </div>
        <div className="px-4 py-4 space-y-1 text-center">
          <Clock className="w-4 h-4 text-status-orange mx-auto" />
          <p className="text-[20px] font-mono font-bold text-text-primary">{estimate.estimatedRolloutWeeks}w</p>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Rollout</p>
        </div>
      </div>

      {/* Impact areas */}
      {areas.length > 0 && (
        <div className="px-4 py-3 border-t border-border space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">What this affects</p>
          {areas.map(({ icon: Icon, label, note }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-text-secondary">{label}</p>
                <p className="text-[10px] text-text-muted leading-relaxed">{note}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety note */}
      <div className="flex items-start gap-2 px-4 py-3 border-t border-border">
        <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-relaxed">
          Estimates are read-only. Nothing changes until approved in the Review Queue. Actual impact depends on approval timing and coach rollout.
        </p>
      </div>
    </div>
  )
}
