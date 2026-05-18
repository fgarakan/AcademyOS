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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  level: CurriculumLevel
  levelGates: CurriculumGate[]
  levelDrills: CurriculumDrill[]
  competition: CurriculumCompetitionTrack | null
  fitness: CurriculumFitnessGuidance | null
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

// ─── Section card ─────────────────────────────────────────────────────────────

interface CardProps {
  icon: React.ReactNode
  title: string
  status: { color: string; bg: string; label: string }
  count?: string
  preview: React.ReactNode
  onDonna: () => void
  onAdd: () => void
}

function SectionCard({ icon, title, status, count, preview, onDonna, onAdd }: CardProps) {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="h-0.5 w-full" style={{ background: status.color }} />

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>{icon}</span>
            <p className="text-[12px] font-semibold text-text-primary">{title}</p>
          </div>
          <div className="flex items-center gap-2">
            {count && (
              <span className="text-[10px] font-mono text-text-secondary">{count}</span>
            )}
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* Content preview */}
        <div className="flex-1 min-h-[52px]">
          {preview}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
          <button
            onClick={onDonna}
            className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg transition-colors"
            style={{
              border: '1px solid rgba(17,217,223,0.22)',
              color: '#11d9df',
              background: 'rgba(17,217,223,0.05)',
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
}: Props) {
  const [drillOpen,   setDrillOpen]   = useState(false)
  const [gateOpen,    setGateOpen]    = useState(false)
  const [fitnessOpen, setFitnessOpen] = useState(false)

  const skillStatus   = countStatus(levelDrills.length, 3)
  const gateStatus    = countStatus(levelGates.length, 2)
  const compStatus    = boolStatus(!!competition)
  const fitStatus     = boolStatus(!!fitness)

  const domainCount = new Set(levelDrills.map(d => d.domain).filter(Boolean)).size

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Skill Path */}
        <SectionCard
          icon={<Target className="w-4 h-4" />}
          title="Skill Path"
          status={skillStatus}
          count={`${levelDrills.length} drill${levelDrills.length !== 1 ? 's' : ''} · ${domainCount} domain${domainCount !== 1 ? 's' : ''}`}
          preview={
            <div className="space-y-1.5">
              {levelDrills.length === 0 ? (
                <p className="text-[11px] text-text-muted">No drills added yet.</p>
              ) : (
                levelDrills.slice(0, 3).map(d => (
                  <div key={d.id} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full shrink-0 mt-1.5" style={{ background: '#555' }} />
                    <p className="text-[11px] text-text-secondary leading-snug line-clamp-1">{d.name}</p>
                  </div>
                ))
              )}
              {levelDrills.length > 3 && (
                <p className="text-[10px] text-text-muted">+{levelDrills.length - 3} more</p>
              )}
            </div>
          }
          onDonna={() => setDrillOpen(true)}
          onAdd={() => setDrillOpen(true)}
        />

        {/* Competition Path */}
        <SectionCard
          icon={<Trophy className="w-4 h-4" />}
          title="Competition Path"
          status={compStatus}
          preview={
            <div className="space-y-1.5">
              {!competition ? (
                <p className="text-[11px] text-text-muted">No competition data at this level.</p>
              ) : (
                <>
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
                </>
              )}
            </div>
          }
          onDonna={() => setGateOpen(true)}
          onAdd={() => setGateOpen(true)}
        />

        {/* Fitness Support */}
        <SectionCard
          icon={<Dumbbell className="w-4 h-4" />}
          title="Fitness Support"
          status={fitStatus}
          preview={
            <div className="space-y-1.5">
              {!fitness ? (
                <p className="text-[11px] text-text-muted">No fitness guidance at this level.</p>
              ) : (
                <>
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
                </>
              )}
            </div>
          }
          onDonna={() => setFitnessOpen(true)}
          onAdd={() => setFitnessOpen(true)}
        />

        {/* Assessment Gates */}
        <SectionCard
          icon={<Shield className="w-4 h-4" />}
          title="Assessment Gates"
          status={gateStatus}
          count={`${levelGates.length} gate${levelGates.length !== 1 ? 's' : ''}`}
          preview={
            <div className="space-y-1.5">
              {levelGates.length === 0 ? (
                <p className="text-[11px] text-text-muted">No assessment gates added yet.</p>
              ) : (
                levelGates.slice(0, 3).map(g => (
                  <div key={g.id} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full shrink-0 mt-1.5" style={{ background: '#555' }} />
                    <p className="text-[11px] text-text-secondary leading-snug line-clamp-1">{g.criterion}</p>
                  </div>
                ))
              )}
            </div>
          }
          onDonna={() => setGateOpen(true)}
          onAdd={() => setGateOpen(true)}
        />

        {/* Player Missions */}
        <SectionCard
          icon={<Sparkles className="w-4 h-4" />}
          title="Player Missions"
          status={EMPTY_STATUS}
          preview={
            <p className="text-[11px] text-text-muted leading-relaxed">
              No missions yet. Missions are player-facing challenges that make development feel like a journey.
            </p>
          }
          onDonna={() => setDrillOpen(true)}
          onAdd={() => setDrillOpen(true)}
        />
      </div>

      {/* Donna draft panels */}
      {drillOpen && (
        <DonnaAddDrillDraft level={level} onClose={() => setDrillOpen(false)} />
      )}
      {gateOpen && (
        <DonnaAddAssessmentGateDraft level={level} onClose={() => setGateOpen(false)} />
      )}
      {fitnessOpen && (
        <DonnaAddFitnessExerciseDraft level={level} onClose={() => setFitnessOpen(false)} />
      )}
    </div>
  )
}
