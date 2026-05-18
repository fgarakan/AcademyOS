'use client'

import { useState } from 'react'
import { Sparkles, BookOpen, Target, Shield, Dumbbell, MessageSquare, AlertTriangle } from 'lucide-react'
import type { CurriculumExplorerData, CurriculumLevel } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelDetailPanel } from '@/components/curriculum/CurriculumLevelDetailPanel'
import { DonnaAddDrillDraft } from './DonnaAddDrillDraft'
import { DonnaAddAssessmentGateDraft } from './DonnaAddAssessmentGateDraft'
import { DonnaAddFitnessExerciseDraft } from './DonnaAddFitnessExerciseDraft'
import { DonnaCurriculumContextPanel } from './DonnaCurriculumContextPanel'
import { DonnaSafetyDisclosure } from './DonnaSafetyDisclosure'

type Tab = 'overview' | 'drills' | 'gates' | 'fitness' | 'language'

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview',  label: 'Overview',  Icon: BookOpen },
  { id: 'drills',    label: 'Drills',    Icon: Target },
  { id: 'gates',     label: 'Gates',     Icon: Shield },
  { id: 'fitness',   label: 'Fitness',   Icon: Dumbbell },
  { id: 'language',  label: 'Language',  Icon: MessageSquare },
]

interface Props {
  level: CurriculumLevel
  data: CurriculumExplorerData
}

export function CurriculumLevelBuilderShell({ level, data }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [drillDraftOpen, setDrillDraftOpen] = useState(false)
  const [gateDraftOpen, setGateDraftOpen] = useState(false)
  const [fitnessDraftOpen, setFitnessDraftOpen] = useState(false)

  const levelGates = data.gates.filter(g => g.from_level_id === level.id)
  const levelDrills = data.drills.filter(d => d.level_min_id === level.id)
  const levelLanguage = data.coachLanguage.filter(cl => cl.level_id === level.id)
  const competition = data.competitionTrack.find(ct => ct.level_id === level.id) ?? null
  const fitness = data.fitnessGuidance.find(fg => fg.level_id === level.id) ?? null
  const volume = data.volumeGuidance.find(vg => vg.level_id === level.id) ?? null

  const isMissing = levelGates.length === 0 && levelDrills.length === 0
  const isLow = !isMissing && (levelGates.length < 2 || levelDrills.length < 3)
  const gaps: string[] = []
  if (levelGates.length === 0) gaps.push('no assessment gates')
  else if (levelGates.length < 2) gaps.push('low gate count')
  if (levelDrills.length === 0) gaps.push('no drills')
  else if (levelDrills.length < 3) gaps.push('low drill count')

  const statusColor = isMissing ? '#FF3B30' : isLow ? '#FF9500' : '#30D158'
  const statusLabel = isMissing ? 'Missing content' : isLow ? 'Low content' : 'Complete'

  return (
    <div className="space-y-4">

      {/* Level summary card */}
      <div className="rounded-xl border border-border bg-surface-raised px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${statusColor}18`, color: statusColor }}
              >
                {statusLabel}
              </span>
              {gaps.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-status-orange">
                  <AlertTriangle className="w-3 h-3" />
                  {gaps.join(' · ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[11px] text-text-muted">
                <span className="font-mono text-text-secondary">{levelGates.length}</span> gates
              </span>
              <span className="text-[11px] text-text-muted">
                <span className="font-mono text-text-secondary">{levelDrills.length}</span> drills
              </span>
              <span className="text-[11px] text-text-muted">
                <span className="font-mono text-text-secondary">{levelLanguage.length}</span> language entries
              </span>
            </div>
          </div>
          <button
            onClick={() => setDrillDraftOpen(true)}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-lime/30 text-lime hover:bg-lime/10 transition-colors shrink-0"
          >
            <Sparkles className="w-3 h-3" />
            Ask DONNA
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 flex-wrap">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
              tab === id
                ? 'bg-lime/15 text-lime border border-lime/30'
                : 'text-text-muted hover:text-text-secondary border border-transparent hover:border-border'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <CurriculumLevelDetailPanel
            level={level}
            gates={levelGates}
            drills={levelDrills}
            coachLanguage={levelLanguage}
            competition={competition}
            fitness={fitness}
            volume={volume}
            tablesAvailable={data.tablesAvailable}
          />
          <DonnaCurriculumContextPanel
            level={level}
            drillCount={levelDrills.length}
            gateCount={levelGates.length}
          />
          <DonnaSafetyDisclosure context="level_edit" />
        </div>
      )}

      {tab === 'drills' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">
              {levelDrills.length} drill{levelDrills.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setDrillDraftOpen(true)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-lime/30 text-lime hover:bg-lime/10 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Ask DONNA to draft a drill
            </button>
          </div>
          {levelDrills.length === 0 ? (
            <div className="rounded-xl border border-border border-dashed p-6 text-center">
              <p className="text-[12px] text-text-secondary">No drills at this level yet.</p>
              <p className="text-[11px] text-text-muted mt-1">Ask DONNA to draft one, or add via advanced tools.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {levelDrills.map(drill => (
                <div key={drill.id} className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                  <p className="text-[12px] font-semibold text-text-primary">{drill.name}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{drill.domain} · {drill.session_block}</p>
                  {drill.objective && <p className="text-[11px] text-text-secondary mt-1">{drill.objective}</p>}
                </div>
              ))}
            </div>
          )}
          {drillDraftOpen && (
            <DonnaAddDrillDraft level={level} onClose={() => setDrillDraftOpen(false)} />
          )}
        </div>
      )}

      {tab === 'gates' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">
              {levelGates.length} gate{levelGates.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setGateDraftOpen(true)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-lime/30 text-lime hover:bg-lime/10 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Ask DONNA to draft a gate
            </button>
          </div>
          {levelGates.length === 0 ? (
            <div className="rounded-xl border border-border border-dashed p-6 text-center">
              <p className="text-[12px] text-text-secondary">No gates at this level yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {levelGates.map(gate => (
                <div key={gate.id} className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                  <p className="text-[12px] font-semibold text-text-primary">{gate.criterion}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{gate.domain} · {gate.gate_type}</p>
                  <p className="text-[11px] text-text-secondary mt-1">{gate.threshold}</p>
                </div>
              ))}
            </div>
          )}
          {gateDraftOpen && (
            <DonnaAddAssessmentGateDraft level={level} onClose={() => setGateDraftOpen(false)} />
          )}
        </div>
      )}

      {tab === 'fitness' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Fitness Guidance</p>
            <button
              onClick={() => setFitnessDraftOpen(true)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-lime/30 text-lime hover:bg-lime/10 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Ask DONNA to draft fitness content
            </button>
          </div>
          {!fitness ? (
            <div className="rounded-xl border border-border border-dashed p-6 text-center">
              <p className="text-[12px] text-text-secondary">No fitness guidance at this level yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-2">
              <p className="text-[12px] font-semibold text-text-primary">{fitness.fitness_phase}</p>
              {fitness.primary_energy_system && <p className="text-[11px] text-text-secondary">{fitness.primary_energy_system}</p>}
              {fitness.coaching_notes && <p className="text-[11px] text-text-muted">{fitness.coaching_notes}</p>}
            </div>
          )}
          {fitnessDraftOpen && (
            <DonnaAddFitnessExerciseDraft level={level} onClose={() => setFitnessDraftOpen(false)} />
          )}
        </div>
      )}

      {tab === 'language' && (
        <div className="space-y-2">
          {levelLanguage.length === 0 ? (
            <div className="rounded-xl border border-border border-dashed p-6 text-center">
              <p className="text-[12px] text-text-secondary">No coach language at this level yet.</p>
            </div>
          ) : (
            levelLanguage.map(lang => (
              <div key={lang.id} className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">{lang.domain}</p>
                <div className="space-y-1">
                  <p className="text-[11px] text-text-secondary"><span className="text-text-muted font-medium">Doing well: </span>{lang.doing_well}</p>
                  <p className="text-[11px] text-text-secondary"><span className="text-text-muted font-medium">Working on: </span>{lang.working_on}</p>
                  <p className="text-[11px] text-text-secondary"><span className="text-text-muted font-medium">Focus: </span>{lang.current_focus}</p>
                  <p className="text-[11px] text-text-secondary"><span className="text-text-muted font-medium">Next: </span>{lang.next_step}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  )
}
