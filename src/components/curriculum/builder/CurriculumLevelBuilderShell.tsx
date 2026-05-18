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

type Tab = 'overview' | 'skills' | 'drills' | 'competition' | 'fitness' | 'gates' | 'missions' | 'language'

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview',    label: 'Overview',    Icon: BookOpen },
  { id: 'skills',      label: 'Skill Path',  Icon: Target },
  { id: 'drills',      label: 'Drills',      Icon: Target },
  { id: 'competition', label: 'Competition', Icon: Shield },
  { id: 'fitness',     label: 'Fitness',     Icon: Dumbbell },
  { id: 'gates',       label: 'Gates',       Icon: Shield },
  { id: 'missions',    label: 'Missions',    Icon: Sparkles },
  { id: 'language',    label: 'Language',    Icon: MessageSquare },
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

      {/* Sprint 855 — Skill Path: domain-grouped drill view */}
      {tab === 'skills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Skill Path — by domain</p>
            <button
              onClick={() => setDrillDraftOpen(true)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-lime/30 text-lime hover:bg-lime/10 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Ask DONNA to add a skill drill
            </button>
          </div>
          <p className="text-[11px] text-text-muted">Drills organized by skill domain. All edits are draft-only.</p>
          {levelDrills.length === 0 ? (
            <div className="rounded-xl border border-border border-dashed p-6 text-center">
              <p className="text-[12px] text-text-secondary">No drills linked to this level yet.</p>
              <p className="text-[11px] text-text-muted mt-1">Ask DONNA to draft skill-focused drills for this level.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                levelDrills.reduce<Record<string, typeof levelDrills>>((acc, d) => {
                  const domain = d.domain || 'General'
                  if (!acc[domain]) acc[domain] = []
                  acc[domain].push(d)
                  return acc
                }, {})
              ).map(([domain, drills]) => (
                <div key={domain}>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">{domain}</p>
                  <div className="space-y-2">
                    {drills.map(drill => (
                      <div key={drill.id} className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                        <p className="text-[12px] font-semibold text-text-primary">{drill.name}</p>
                        {drill.objective && <p className="text-[11px] text-text-secondary mt-1">{drill.objective}</p>}
                        {drill.success_criteria && <p className="text-[10px] text-text-muted mt-1">Success: {drill.success_criteria}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {drillDraftOpen && (
            <DonnaAddDrillDraft level={level} onClose={() => setDrillDraftOpen(false)} />
          )}
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
            <div className="rounded-xl border border-border border-dashed p-6 text-center space-y-2">
              <Shield className="w-5 h-5 text-text-muted mx-auto" />
              <p className="text-[12px] text-text-secondary">No assessment gates at this level yet.</p>
              <p className="text-[11px] text-text-muted">Gates define measurable pass criteria before a player can advance. Ask DONNA to draft the first gate.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {levelGates.map(gate => (
                <div key={gate.id} className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-text-primary">{gate.criterion}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded border text-text-muted border-border">{gate.domain}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border text-text-muted border-border">{gate.gate_type}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border text-text-muted border-border">{gate.evaluator}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-text-muted font-medium">Threshold</p>
                      <p className="text-[11px] text-text-secondary">{gate.threshold}</p>
                    </div>
                    {gate.recording_method && (
                      <div>
                        <p className="text-[10px] text-text-muted font-medium">Recording</p>
                        <p className="text-[11px] text-text-secondary">{gate.recording_method}</p>
                      </div>
                    )}
                  </div>
                  {gate.notes && <p className="text-[10px] text-text-muted italic">{gate.notes}</p>}
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
            <div className="rounded-xl border border-border border-dashed p-6 text-center space-y-2">
              <Dumbbell className="w-5 h-5 text-text-muted mx-auto" />
              <p className="text-[12px] text-text-secondary">No fitness guidance at this level yet.</p>
              <p className="text-[11px] text-text-muted">Ask DONNA to draft fitness content that fits this level's energy demands.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Fitness Phase</p>
                <p className="text-[12px] font-semibold text-text-primary">{fitness.fitness_phase}</p>
              </div>
              {fitness.primary_energy_system && (
                <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Primary Energy System</p>
                  <p className="text-[12px] text-text-primary">{fitness.primary_energy_system}</p>
                </div>
              )}
              {fitness.strength_band && (
                <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Strength Band</p>
                  <p className="text-[12px] text-text-primary">{fitness.strength_band}</p>
                </div>
              )}
              {(fitness.off_court_sessions_per_week_min != null || fitness.off_court_sessions_per_week_max != null) && (
                <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Off-Court Sessions / Week</p>
                  <p className="text-[12px] text-text-primary">
                    <span className="font-mono text-lime">{fitness.off_court_sessions_per_week_min ?? '?'}</span>
                    {fitness.off_court_sessions_per_week_max != null && <span className="text-text-muted"> – <span className="font-mono text-lime">{fitness.off_court_sessions_per_week_max}</span></span>}
                  </p>
                </div>
              )}
              {fitness.coaching_notes && (
                <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Coaching Notes</p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">{fitness.coaching_notes}</p>
                </div>
              )}
            </div>
          )}
          {fitnessDraftOpen && (
            <DonnaAddFitnessExerciseDraft level={level} onClose={() => setFitnessDraftOpen(false)} />
          )}
        </div>
      )}

      {/* Sprint 856 — Competition Path Editing UX */}
      {tab === 'competition' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Competition Path</p>
            <button
              onClick={() => setGateDraftOpen(true)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-lime/30 text-lime hover:bg-lime/10 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Ask DONNA to refine
            </button>
          </div>
          {!competition ? (
            <div className="rounded-xl border border-border border-dashed p-6 text-center">
              <p className="text-[12px] text-text-secondary">No competition track data at this level yet.</p>
              <p className="text-[11px] text-text-muted mt-1">Competition path data is defined in the master curriculum spine.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {competition.match_format && (
                <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Match Format</p>
                  <p className="text-[12px] text-text-primary">{competition.match_format}</p>
                </div>
              )}
              {competition.scoring_system && (
                <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Scoring System</p>
                  <p className="text-[12px] text-text-primary">{competition.scoring_system}</p>
                </div>
              )}
            </div>
          )}
          <div className="rounded-xl border border-lime/10 bg-lime/[0.02] px-4 py-3">
            <p className="text-[11px] text-text-muted">Competition path edits are draft-only. Changes go to the Review Queue.</p>
          </div>
        </div>
      )}

      {/* Sprint 859 — Player Missions */}
      {tab === 'missions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Player Missions</p>
            <button
              onClick={() => setDrillDraftOpen(true)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-lime/30 text-lime hover:bg-lime/10 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Ask DONNA to draft a mission
            </button>
          </div>
          <div className="rounded-xl border border-border border-dashed p-6 text-center space-y-2">
            <Sparkles className="w-5 h-5 text-text-muted mx-auto" />
            <p className="text-[12px] text-text-secondary">Player missions not yet defined for this level.</p>
            <p className="text-[11px] text-text-muted">Missions are player-facing challenges that connect practice to progress. Ask DONNA to draft the first mission for this level.</p>
          </div>
          <div className="rounded-xl border border-lime/10 bg-lime/[0.02] px-4 py-3">
            <p className="text-[11px] text-text-muted">Mission drafts are saved to the Review Queue. Players only see approved missions.</p>
          </div>
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
