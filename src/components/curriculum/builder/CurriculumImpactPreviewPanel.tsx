'use client'

import { Users, Layers, Clock, AlertCircle } from 'lucide-react'

export interface ImpactEstimate {
  playersAffected: number
  levelsAffected: number
  estimatedRolloutWeeks: number
  changeType: 'add_drill' | 'add_gate' | 'add_fitness' | 'modify_gate' | 'remove_drill'
}

interface Props {
  estimate: ImpactEstimate | null
  levelName: string
}

const CHANGE_LABELS: Record<ImpactEstimate['changeType'], string> = {
  add_drill:    'Adding a drill',
  add_gate:     'Adding an assessment gate',
  add_fitness:  'Adding a fitness exercise',
  modify_gate:  'Modifying a gate requirement',
  remove_drill: 'Removing a drill',
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

  return (
    <div className="rounded-2xl border border-border bg-surface-raised space-y-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[12px] font-semibold text-text-primary">Impact estimate — {levelName}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{CHANGE_LABELS[estimate.changeType]}</p>
      </div>

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

      <div className="flex items-start gap-2 px-4 py-3 border-t border-border">
        <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-relaxed">
          Estimates are based on current enrolment data and curriculum mapping. Actual impact depends on
          approval timing and coach rollout. Nothing changes until approved in the Review Queue.
        </p>
      </div>
    </div>
  )
}
