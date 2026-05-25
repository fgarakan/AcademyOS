'use client'

import { useState } from 'react'
import { Target, Trophy, Dumbbell, Shield, Sparkles, Plus } from 'lucide-react'
import type {
  CurriculumLevel,
  CurriculumGate,
  CurriculumDrill,
  CurriculumCompetitionTrack,
  CurriculumFitnessGuidance,
} from '@/lib/backend/curriculumExplorer'
import { DonnaAddDrillDraft } from './DonnaAddDrillDraft'
import { DonnaAddAssessmentGateDraft } from './DonnaAddAssessmentGateDraft'
import { DonnaAddFitnessExerciseDraft } from './DonnaAddFitnessExerciseDraft'

// ─── Active panel state ───────────────────────────────────────────────────────

export type ActivePanel = null | 'skillDrill' | 'competition' | 'fitness' | 'gate' | 'missions'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  level: CurriculumLevel
  levelGates: CurriculumGate[]
  levelDrills: CurriculumDrill[]
  competition: CurriculumCompetitionTrack | null
  fitness: CurriculumFitnessGuidance | null
  // Optional controlled mode — parent manages activePanel state
  activePanel?: ActivePanel
  onActivePanelChange?: (panel: ActivePanel) => void
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function countStatus(count: number, min: number): { color: string; bg: string; label: string } {
  if (count >= min) return { color: '#30D158', bg: 'rgba(48,209,88,0.12)',  label: 'Complete' }
  if (count > 0)    return { color: '#FF9500', bg: 'rgba(255,149,0,0.12)',  label: 'Partial'  }
  return              { color: '#FF3B30', bg: 'rgba(255,59,48,0.12)',   label: 'Empty'    }
}

function boolStatus(has: boolean): { color: string; bg: string; label: string } {
  if (has) return { color: '#30D158', bg: 'rgba(48,209,88,0.12)', label: 'Set'   }
  return   { color: '#FF3B30', bg: 'rgba(255,59,48,0.12)',  label: 'Empty' }
}

const EMPTY_STATUS = { color: '#FF3B30', bg: 'rgba(255,59,48,0.12)', label: 'Empty' }

// ─── Empty state block ────────────────────────────────────────────────────────

function EmptyBlock({ copy, onDonna }: { copy: string; onDonna: () => void }) {
  return (
    <div
      className="rounded-xl p-3.5 text-center space-y-2"
      style={{ border: '1px dashed rgba(255,255,255,0.10)' }}
    >
      <p className="text-[11px] text-text-muted">{copy}</p>
      <button
        onClick={onDonna}
        className="text-[10px] transition-opacity hover:opacity-70"
        style={{ color: '#C8FF00' }}
      >
        Ask DONNA to draft one
      </button>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

interface CardProps {
  icon: React.ReactNode
  title: string
  description: string
  status: { color: string; bg: string; label: string }
  count?: string
  isActive: boolean
  preview: React.ReactNode
  onDonna: () => void
  onAdd: () => void
}

function SectionCard({
  icon,
  title,
  description,
  status,
  count,
  isActive,
  preview,
  onDonna,
  onAdd,
}: CardProps) {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden transition-all"
      style={{
        background: 'rgba(0,0,0,0.30)',
        border: `1px solid ${isActive ? 'rgba(200,255,0,0.22)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {/* Top color bar */}
      <div className="h-0.5 w-full" style={{ background: status.color }} />

      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Header: icon + title + status chip */}
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>{icon}</span>
          <p className="text-[12px] font-semibold text-text-primary">{title}</p>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
          {count && (
            <span className="text-[10px] font-mono text-text-muted ml-auto shrink-0">{count}</span>
          )}
        </div>

        {/* Description */}
        <p className="text-[11px] text-text-muted leading-relaxed -mt-1">{description}</p>

        {/* Content preview */}
        <div className="flex-1 min-h-[52px]">
          {preview}
        </div>

        {/* Footer: action buttons + safety note */}
        <div className="pt-2 border-t border-white/[0.05] space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onDonna}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg transition-colors"
              style={{
                border: '1px solid rgba(200,255,0,0.22)',
                color: '#C8FF00',
                background: isActive ? 'rgba(200,255,0,0.10)' : 'rgba(200,255,0,0.05)',
              }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              Ask DONNA
            </button>
            <button
              onClick={onAdd}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-white/[0.10] text-text-muted hover:text-text-secondary hover:border-white/20 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
              Add
            </button>
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Draft only &middot; director approval required
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CurriculumLevelBuilderGrid({
  level,
  levelGates,
  levelDrills,
  competition,
  fitness,
  activePanel: controlledPanel,
  onActivePanelChange,
}: Props) {
  const [internalPanel, setInternalPanel] = useState<ActivePanel>(null)

  // Controlled mode when parent passes activePanel; otherwise use internal state
  const activePanel = controlledPanel !== undefined ? controlledPanel : internalPanel

  function open(panel: ActivePanel) {
    const next = activePanel === panel ? null : panel
    if (onActivePanelChange) onActivePanelChange(next)
    else setInternalPanel(next)
  }
  function close() {
    if (onActivePanelChange) onActivePanelChange(null)
    else setInternalPanel(null)
  }

  const skillStatus = countStatus(levelDrills.length, 3)
  const gateStatus  = countStatus(levelGates.length, 2)
  const compStatus  = boolStatus(!!competition)
  const fitStatus   = boolStatus(!!fitness)

  const domainCount = new Set(levelDrills.map(d => d.domain).filter(Boolean)).size

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* ── Skill Path ──────────────────────────────────────────────────── */}
        <SectionCard
          icon={<Target className="w-4 h-4" />}
          title="Skill Path"
          description="Drills and domain-focused activities that build the skills for this level."
          status={skillStatus}
          count={levelDrills.length > 0
            ? `${levelDrills.length} drill${levelDrills.length !== 1 ? 's' : ''} · ${domainCount} domain${domainCount !== 1 ? 's' : ''}`
            : undefined}
          isActive={activePanel === 'skillDrill'}
          preview={
            levelDrills.length === 0 ? (
              <EmptyBlock copy="No drills connected yet." onDonna={() => open('skillDrill')} />
            ) : (
              <div className="space-y-1.5">
                {levelDrills.slice(0, 3).map(d => (
                  <div key={d.id} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full shrink-0 mt-1.5" style={{ background: '#555' }} />
                    <p className="text-[11px] text-text-secondary leading-snug line-clamp-1">{d.name}</p>
                  </div>
                ))}
                {levelDrills.length > 3 && (
                  <p className="text-[10px] text-text-muted">+{levelDrills.length - 3} more</p>
                )}
              </div>
            )
          }
          onDonna={() => open('skillDrill')}
          onAdd={() => open('skillDrill')}
        />

        {/* ── Competition Path ────────────────────────────────────────────── */}
        <SectionCard
          icon={<Trophy className="w-4 h-4" />}
          title="Competition Path"
          description="Match formats, scoring systems, and tournament guidance for this level."
          status={compStatus}
          isActive={activePanel === 'competition'}
          preview={
            !competition ? (
              <EmptyBlock copy="No competition focus connected yet." onDonna={() => open('competition')} />
            ) : (
              <div className="space-y-1.5">
                {competition.match_format && (
                  <p className="text-[11px] text-text-secondary line-clamp-1">
                    <span className="text-text-muted">Format: </span>{competition.match_format}
                  </p>
                )}
                {competition.scoring_system && (
                  <p className="text-[11px] text-text-secondary line-clamp-1">
                    <span className="text-text-muted">Scoring: </span>{competition.scoring_system}
                  </p>
                )}
                {competition.tournament_cadence && (
                  <p className="text-[11px] text-text-secondary line-clamp-1">
                    <span className="text-text-muted">Cadence: </span>{competition.tournament_cadence}
                  </p>
                )}
              </div>
            )
          }
          onDonna={() => open('competition')}
          onAdd={() => open('competition')}
        />

        {/* ── Fitness Support ─────────────────────────────────────────────── */}
        <SectionCard
          icon={<Dumbbell className="w-4 h-4" />}
          title="Fitness Support"
          description="Off-court conditioning, energy systems, and load guidelines for this level."
          status={fitStatus}
          isActive={activePanel === 'fitness'}
          preview={
            !fitness ? (
              <EmptyBlock copy="No fitness support connected yet." onDonna={() => open('fitness')} />
            ) : (
              <div className="space-y-1.5">
                <p className="text-[11px] text-text-secondary line-clamp-1">
                  <span className="text-text-muted">Phase: </span>{fitness.fitness_phase}
                </p>
                {fitness.primary_energy_system && (
                  <p className="text-[11px] text-text-secondary line-clamp-1">
                    <span className="text-text-muted">Energy: </span>{fitness.primary_energy_system}
                  </p>
                )}
                {fitness.strength_band && (
                  <p className="text-[11px] text-text-secondary line-clamp-1">
                    <span className="text-text-muted">Strength: </span>{fitness.strength_band}
                  </p>
                )}
              </div>
            )
          }
          onDonna={() => open('fitness')}
          onAdd={() => open('fitness')}
        />

        {/* ── Assessment Gates ────────────────────────────────────────────── */}
        <SectionCard
          icon={<Shield className="w-4 h-4" />}
          title="Assessment Gates"
          description="Measurable pass criteria a player must meet before advancing to the next level."
          status={gateStatus}
          count={levelGates.length > 0
            ? `${levelGates.length} gate${levelGates.length !== 1 ? 's' : ''}`
            : undefined}
          isActive={activePanel === 'gate'}
          preview={
            levelGates.length === 0 ? (
              <EmptyBlock copy="No assessment gates yet." onDonna={() => open('gate')} />
            ) : (
              <div className="space-y-1.5">
                {levelGates.slice(0, 3).map(g => (
                  <div key={g.id} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full shrink-0 mt-1.5" style={{ background: '#555' }} />
                    <p className="text-[11px] text-text-secondary leading-snug line-clamp-1">{g.criterion}</p>
                  </div>
                ))}
                {levelGates.length > 3 && (
                  <p className="text-[10px] text-text-muted">+{levelGates.length - 3} more</p>
                )}
              </div>
            )
          }
          onDonna={() => open('gate')}
          onAdd={() => open('gate')}
        />

        {/* ── Player Missions ─────────────────────────────────────────────── */}
        <SectionCard
          icon={<Sparkles className="w-4 h-4" />}
          title="Player Missions"
          description="Player-facing challenges that make development feel like a journey, not just practice."
          status={EMPTY_STATUS}
          isActive={activePanel === 'missions'}
          preview={
            <EmptyBlock copy="No missions connected yet." onDonna={() => open('missions')} />
          }
          onDonna={() => open('missions')}
          onAdd={() => open('missions')}
        />
      </div>

      {/* ── Active DONNA draft panel (only one open at a time) ──────────── */}
      {(activePanel === 'skillDrill' || activePanel === 'missions') && (
        <DonnaAddDrillDraft level={level} onClose={close} />
      )}
      {(activePanel === 'competition' || activePanel === 'gate') && (
        <DonnaAddAssessmentGateDraft level={level} onClose={close} />
      )}
      {activePanel === 'fitness' && (
        <DonnaAddFitnessExerciseDraft level={level} onClose={close} />
      )}
    </div>
  )
}
