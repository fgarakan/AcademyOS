'use client'

import { useState } from 'react'
import { Sparkles, BookOpen, Target, Shield, Dumbbell, MessageSquare } from 'lucide-react'
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

  return (
    <div className="space-y-4">

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
