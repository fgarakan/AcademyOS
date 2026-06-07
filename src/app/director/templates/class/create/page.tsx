'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, Sparkles, GraduationCap, Target, LayoutTemplate, BookOpen, CheckCircle2, AlertCircle, Plus, X, Info, Eye, Loader2 } from 'lucide-react'
import { saveClassTemplateDraftFromWizardAction } from '@/lib/actions/templateDraftAction'
import { onPageStatePatch } from '@/lib/donna/pageSync/donnaPageSyncEvents'
import { TemplateDonnaPanel } from '@/components/templates/TemplateDonnaPanel'
import {
  CURRICULUM_LEVEL_PREVIEWS,
  getCurriculumLevelPreview,
  getCurriculumStage,
  toBlockStageKey,
  SESSION_DURATION_BY_STAGE,
  GOALS_BY_STAGE,
  getCurriculumDrillsForBlock,
  getWatchForsForBlock,
  getSupportedGatesForStage,
  getPlayerMissionsForStage,
} from '@/lib/templates/templateCurriculumPreview'
import { getRecommendedBlocksForStage } from '@/lib/templates/curriculumBlockRecommendations'

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
  { id: 1, label: 'Choose Level', icon: GraduationCap },
  { id: 2, label: 'Choose Goal', icon: Target },
  { id: 3, label: 'Build Blocks', icon: LayoutTemplate },
  { id: 4, label: 'Add Drills', icon: BookOpen },
  { id: 5, label: 'Review', icon: CheckCircle2 },
]

// 15 curriculum levels grouped by ball stage
const CURRICULUM_LEVELS = CURRICULUM_LEVEL_PREVIEWS.map(p => p.level)

const BLOCK_TYPES = [
  { id: 'warm_up', label: 'Warm-Up', color: 'text-status-blue border-status-blue/30 bg-status-blue/8' },
  { id: 'technical', label: 'Technical', color: 'text-lime border-lime/30 bg-lime/8' },
  { id: 'tactical', label: 'Tactical', color: 'text-status-orange border-status-orange/30 bg-status-orange/8' },
  { id: 'physical', label: 'Physical', color: 'text-status-purple border-status-purple/30 bg-status-purple/8' },
  { id: 'match_play', label: 'Match Play', color: 'text-status-red border-status-red/30 bg-status-red/8' },
  { id: 'cool_down', label: 'Cool-Down', color: 'text-text-secondary border-border bg-surface-raised' },
]

interface Block {
  id: string
  type: string
  title: string
  durationMin: number
  autoSuggested?: boolean
}

// Map block recommendation types to the supported class block type IDs
const REC_TYPE_TO_BLOCK_TYPE: Record<string, string> = {
  warm_up: 'warm_up',
  technical: 'technical',
  tactical: 'tactical',
  fitness: 'physical',
  competition: 'match_play',
  mental: 'tactical',
  movement: 'warm_up',
  cool_down: 'cool_down',
}

const DRILL_SUGGESTIONS: Record<string, string[]> = {
  warm_up: ['Ladder footwork', 'Shadow swings', 'Mini cooperative rally'],
  technical: ['Cone target feed', 'Down-the-line rally', 'Cross-court consistency'],
  tactical: ['Open court game', 'Pattern drill', 'Match-play scenario'],
  physical: ['Ladder agility', 'Split-step reaction', 'Lateral sprint'],
  match_play: ['First-to-5 points', 'Serve-plus-one game', 'Pressure tiebreak'],
  cool_down: ['Gentle baseline rally', 'Partner stretch', 'Team huddle'],
}

export default function CreateClassTemplatePage() {
  const [step, setStep] = useState<Step>(1)
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [templateName, setTemplateName] = useState<string>('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedDrills, setSelectedDrills] = useState<Record<string, string[]>>({})
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'schema_missing'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [donnaSyncedFields, setDonnaSyncedFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    return onPageStatePatch(patch => {
      if (!patch.route.includes('/templates')) return
      setDonnaSyncedFields(prev => new Set(prev).add(patch.fieldId))
      switch (patch.fieldId) {
        case 'template_name':
          setTemplateName(patch.value)
          break
        case 'level':
          setSelectedLevel(patch.value)
          break
        case 'objective':
          setSelectedGoal(patch.value)
          break
      }
    })
  }, [])

  const preview = getCurriculumLevelPreview(selectedLevel)
  const stage = getCurriculumStage(selectedLevel)
  const goalsForLevel = stage ? GOALS_BY_STAGE[stage] : []
  const supportedGates = stage ? getSupportedGatesForStage(stage) : []
  const playerMissions = stage ? getPlayerMissionsForStage(stage) : []
  const recommendedBlocks = stage
    ? getRecommendedBlocksForStage(toBlockStageKey(stage), 75)
    : null
  const sessionDuration = stage ? SESSION_DURATION_BY_STAGE[stage] : null

  function autoPopulateFromCurriculum() {
    if (!recommendedBlocks) return
    const autoBlocks: Block[] = recommendedBlocks.blocks.map((b, i) => {
      const mappedType = REC_TYPE_TO_BLOCK_TYPE[b.type] ?? 'technical'
      const typeInfo = BLOCK_TYPES.find(bt => bt.id === mappedType)
      return {
        id: `auto-${i}-${Date.now()}`,
        type: mappedType,
        title: b.name,
        durationMin: b.suggestedDurationMin,
        autoSuggested: true,
      }
    })
    setBlocks(autoBlocks)
  }

  function addBlock(typeId: string) {
    const typeInfo = BLOCK_TYPES.find(b => b.id === typeId)
    if (!typeInfo) return
    setBlocks(prev => [
      ...prev,
      {
        id: `block-${Date.now()}`,
        type: typeId,
        title: typeInfo.label + ' Block',
        durationMin: 15,
      },
    ])
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  function toggleDrill(blockId: string, drill: string) {
    setSelectedDrills(prev => {
      const existing = prev[blockId] ?? []
      const next = existing.includes(drill)
        ? existing.filter(d => d !== drill)
        : [...existing, drill]
      return { ...prev, [blockId]: next }
    })
  }

  async function handleSaveDraft() {
    setSaveStatus('saving')
    setSaveError(null)
    const result = await saveClassTemplateDraftFromWizardAction({
      curriculumLevel: selectedLevel,
      templateGoal: selectedGoal,
      templateName: templateName || undefined,
      blocks: blocks.map(b => ({
        type: b.type,
        title: b.title,
        durationMin: b.durationMin,
        drills: selectedDrills[b.id] ?? [],
      })),
    })
    if (result.success) {
      setSaveStatus('success')
    } else if (result.isSchemaMissing) {
      setSaveStatus('schema_missing')
    } else {
      setSaveStatus('error')
      setSaveError(result.error ?? 'Failed to save draft.')
    }
  }

  const totalDuration = blocks.reduce((sum, b) => sum + b.durationMin, 0)

  return (
    <div className="flex gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen items-start">

      <div className="flex-1 min-w-0 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-text-muted select-none">
          <Link href="/director" className="hover:text-text-secondary transition-colors duration-100">AcademyOS</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates" className="hover:text-text-secondary transition-colors duration-100">Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <Link href="/director/templates/class" className="hover:text-text-secondary transition-colors duration-100">Class Templates</Link>
          <ChevronRight className="w-3 h-3 text-text-muted/40" />
          <span className="text-text-secondary font-medium">Create</span>
        </nav>

        {/* Header */}
        <div>
          <p className="page-eyebrow">Templates</p>
          <h1 className="page-title">Create Class Template</h1>
          <p className="page-subtitle">Build a reusable session structure step by step.</p>
        </div>

        {/* Template name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-widest text-text-muted">Template Name</label>
            {donnaSyncedFields.has('template_name') && (
              <span className="flex items-center gap-1 text-[10px] text-lime">
                <Sparkles className="w-3 h-3" />
                Set by DONNA
              </span>
            )}
          </div>
          <input
            type="text"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder="e.g. Orange Ball 2 — Forehand Focus"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 focus:ring-1 focus:ring-lime/20 transition-all duration-150"
          />
        </div>

        {/* Review notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-surface-raised text-[11px] text-text-secondary">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Template drafts are submitted for director review — nothing goes live until a director approves.</span>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    if (s.id < step || (s.id === 2 && selectedLevel) || (s.id === 3 && selectedGoal)) {
                      setStep(s.id as Step)
                    }
                  }}
                  className={[
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-lime/10 border border-lime/25 text-lime'
                      : isDone
                        ? 'bg-surface-raised border border-border text-text-secondary'
                        : 'bg-surface border border-border text-text-muted',
                  ].join(' ')}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-lime' : 'text-text-muted'}`} />
                  )}
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-text-muted/30 shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-surface p-6">

          {/* Step 1 — Curriculum Level */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-text-primary">Choose Curriculum Level</h2>
                  {donnaSyncedFields.has('level') && (
                    <span className="flex items-center gap-1 text-[10px] text-lime">
                      <Sparkles className="w-3 h-3" />
                      Set by DONNA
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary">The curriculum level is the source of truth. It determines which goals, drills, and assessment gates apply to this template.</p>
              </div>

              {/* Level grid — 15 levels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {CURRICULUM_LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={[
                      'flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-left transition-all duration-150',
                      selectedLevel === level
                        ? 'border-lime/30 bg-lime/8 shadow-[0_0_20px_rgba(200,255,0,0.08)]'
                        : 'border-border bg-surface-raised hover:border-lime/20 hover:bg-surface-raised',
                    ].join(' ')}
                  >
                    <span className="text-sm font-semibold text-text-primary">{level}</span>
                    {selectedLevel === level && <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Curriculum preview card */}
              {preview && (
                <div className="rounded-xl border border-lime/15 bg-lime/4 p-5 space-y-4">
                  {/* Preview label */}
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-[10px] uppercase tracking-widest text-text-muted">
                      Curriculum-derived demo preview — Not saved — Not applied
                    </span>
                  </div>

                  {/* Level name */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Selected Level</p>
                    <p className="text-base font-bold text-lime">{preview.level}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Level Goal</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{preview.levelGoal}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Skill Pathway Focus</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{preview.skillPathwayFocus}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Competition Pathway Focus</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{preview.competitionPathwayFocus}</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Assessment Gates</p>
                        <p className="text-xs font-mono text-lime">{preview.assessmentGatesCount} gates</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Session Duration</p>
                        <p className="text-xs font-mono text-lime">{sessionDuration ?? preview.recommendedTemplateType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended block structure */}
                  {recommendedBlocks && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Recommended Block Structure</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendedBlocks.blocks.map((b, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-lime/15 bg-lime/5">
                            <span className="text-[10px] font-mono text-lime">{b.suggestedDurationMin}m</span>
                            <span className="text-[10px] text-text-secondary">{b.name}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-muted mt-1.5 italic">{recommendedBlocks.notes}</p>
                    </div>
                  )}

                  {/* Supported assessment gates */}
                  {supportedGates.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Gates This Template Can Support</p>
                      <div className="space-y-1.5">
                        {supportedGates.map(gate => (
                          <div key={gate.gateLabel} className="flex items-start gap-2 p-2.5 rounded-lg border border-lime/10 bg-lime/4">
                            <CheckCircle2 className="w-3.5 h-3.5 text-lime/60 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-text-primary leading-snug">{gate.gateLabel}</p>
                              <p className="text-[10px] text-text-muted mt-0.5">{gate.blockHint}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-muted mt-1.5">Curriculum-derived — read only — no official assessment updates</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Goal */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Choose a Session Goal</h2>
                <p className="text-sm text-text-secondary">
                  What is the primary outcome for players in this session?
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-lime/20 bg-lime/8 text-lime">{selectedLevel}</span>
                </p>
              </div>
              <div className="space-y-2">
                {goalsForLevel.map(goal => (
                  <button
                    key={goal}
                    onClick={() => setSelectedGoal(goal)}
                    className={[
                      'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-150',
                      selectedGoal === goal
                        ? 'border-lime/30 bg-lime/8'
                        : 'border-border bg-surface-raised hover:border-lime/20',
                    ].join(' ')}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedGoal === goal ? 'border-lime bg-lime' : 'border-border'}`}>
                      {selectedGoal === goal && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <span className="text-sm text-text-primary">{goal}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Blocks */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Build Session Blocks</h2>
                <p className="text-sm text-text-secondary">
                  Add blocks to define the structure of this template.
                  {selectedLevel && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-lime/20 bg-lime/8 text-lime">{selectedLevel}</span>}
                </p>
              </div>

              {/* Auto-populate from curriculum */}
              {recommendedBlocks && blocks.length === 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-lime/20 bg-lime/5">
                  <Sparkles className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary mb-0.5">Curriculum-suggested structure available</p>
                    <p className="text-xs text-text-secondary leading-relaxed mb-3">
                      Based on <span className="text-lime font-medium">{selectedLevel}</span>, DONNA suggests {recommendedBlocks.blocks.length} blocks ({recommendedBlocks.totalSessionMin}min). You can use these as a starting point and edit freely.
                    </p>
                    <button
                      onClick={autoPopulateFromCurriculum}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-lime/25 bg-lime/10 text-xs font-medium text-lime hover:bg-lime/15 transition-all duration-100"
                    >
                      <Sparkles className="w-3 h-3" />
                      Auto-suggest blocks from curriculum
                    </button>
                  </div>
                </div>
              )}

              {/* Block types to add */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Add a Block</p>
                <div className="flex flex-wrap gap-2">
                  {BLOCK_TYPES.map(bt => (
                    <button
                      key={bt.id}
                      onClick={() => addBlock(bt.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-100 ${bt.color}`}
                    >
                      <Plus className="w-3 h-3" />
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Added blocks */}
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <LayoutTemplate className="w-8 h-8 text-text-muted/30" />
                  <p className="text-sm text-text-muted">No blocks added yet. Use the buttons above to build your session structure.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
                    Session Structure — {totalDuration}min total
                  </p>
                  {blocks.map((block, i) => {
                    const typeInfo = BLOCK_TYPES.find(b => b.id === block.type)
                    return (
                      <div key={block.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-raised">
                        <span className="text-[10px] font-mono text-text-muted w-5 shrink-0">{i + 1}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border shrink-0 ${typeInfo?.color ?? ''}`}>
                          {block.title}
                        </span>
                        {block.autoSuggested && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium border border-lime/15 bg-lime/6 text-lime/70">
                            curriculum
                          </span>
                        )}
                        <div className="flex items-center gap-1 ml-auto shrink-0">
                          <button
                            onClick={() => setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, durationMin: Math.max(5, b.durationMin - 5) } : b))}
                            className="w-6 h-6 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                          >
                            <span className="text-xs font-bold">-</span>
                          </button>
                          <span className="text-xs font-mono text-text-secondary w-10 text-center">{block.durationMin}min</span>
                          <button
                            onClick={() => setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, durationMin: b.durationMin + 5 } : b))}
                            className="w-6 h-6 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                          >
                            <span className="text-xs font-bold">+</span>
                          </button>
                          <button
                            onClick={() => removeBlock(block.id)}
                            className="w-6 h-6 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-status-red transition-colors ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Drills */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Add Drills to Each Block</h2>
                <p className="text-sm text-text-secondary">
                  Select drills from the suggestions below or add custom ones later.
                  {selectedLevel && stage && (
                    <span className="ml-2 text-[11px] text-lime/70 font-medium">
                      Showing drills from {selectedLevel} curriculum
                    </span>
                  )}
                </p>
              </div>

              {blocks.length === 0 ? (
                <div className="p-6 text-center text-sm text-text-muted">
                  No blocks to add drills to. Go back to Step 3 and add some blocks first.
                </div>
              ) : (
                <div className="space-y-4">
                  {blocks.map(block => {
                    const typeInfo = BLOCK_TYPES.find(b => b.id === block.type)
                    const curriculumDrills = stage ? getCurriculumDrillsForBlock(stage, block.type) : []
                    const fallbackDrills = DRILL_SUGGESTIONS[block.type] ?? []
                    const suggestions = curriculumDrills.length > 0 ? curriculumDrills : fallbackDrills
                    const fromCurriculum = curriculumDrills.length > 0
                    const watchFors = stage ? getWatchForsForBlock(stage, block.type) : []
                    const blockDrills = selectedDrills[block.id] ?? []
                    return (
                      <div key={block.id} className="rounded-xl border border-border p-4 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border ${typeInfo?.color ?? ''}`}>
                            {block.title}
                          </span>
                          <span className="text-[11px] text-text-muted">{block.durationMin}min</span>
                          {fromCurriculum && (
                            <span className="text-[10px] text-lime/70 border border-lime/15 bg-lime/5 px-1.5 py-0.5 rounded-md">
                              Recommended from {selectedLevel} curriculum
                            </span>
                          )}
                          {blockDrills.length > 0 && (
                            <span className="ml-auto text-[10px] text-status-green">{blockDrills.length} selected</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map(drill => (
                            <button
                              key={drill}
                              onClick={() => toggleDrill(block.id, drill)}
                              className={[
                                'inline-flex items-center px-3 py-1.5 rounded-xl border text-xs transition-all duration-100',
                                blockDrills.includes(drill)
                                  ? 'border-lime/30 bg-lime/10 text-lime'
                                  : 'border-border bg-surface text-text-secondary hover:border-lime/20',
                              ].join(' ')}
                            >
                              {blockDrills.includes(drill) && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
                              {drill}
                            </button>
                          ))}
                        </div>
                        {watchFors.length > 0 && (
                          <div className="pt-1 border-t border-border/50 space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-lime/70">Watch for</p>
                            {watchFors.map(w => (
                              <div key={w} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 text-lime/50 shrink-0 mt-0.5" />
                                <span className="text-[11px] text-text-secondary leading-relaxed">{w}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 5 — Review */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">Review Template</h2>
                <p className="text-sm text-text-secondary">Check everything before saving as a draft. Nothing changes until you approve.</p>
              </div>

              {/* 8-item curriculum summary */}
              <div className="space-y-2">

                {/* 1. Curriculum Source */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-lime/6 border border-lime/20">
                  <GraduationCap className="w-4 h-4 text-lime shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Curriculum Source</p>
                    <p className="text-sm font-semibold text-lime">{selectedLevel || 'Not selected'}</p>
                  </div>
                </div>

                {/* 2. Level Goal */}
                {preview && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                    <BookOpen className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">Level Goal</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{preview.levelGoal}</p>
                    </div>
                  </div>
                )}

                {/* 3. Template Goal */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <Target className="w-4 h-4 text-lime shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Template Goal</p>
                    <p className="text-sm font-semibold text-text-primary">{selectedGoal || 'Not selected'}</p>
                  </div>
                </div>

                {/* 4. Blocks */}
                <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-1.5">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-lime shrink-0" />
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Blocks</p>
                    <span className="ml-auto text-xs font-mono text-lime">{blocks.length} blocks — {totalDuration}min</span>
                  </div>
                  {blocks.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-6">
                      {blocks.map(b => {
                        const t = BLOCK_TYPES.find(bt => bt.id === b.type)
                        return (
                          <span key={b.id} className={`px-2 py-0.5 rounded-md text-[10px] border ${t?.color ?? ''}`}>
                            {b.title} {b.durationMin}m
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Drills */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <BookOpen className="w-4 h-4 text-lime shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Drills</p>
                    <p className="text-sm font-semibold text-text-primary">
                      {Object.values(selectedDrills).flat().length} drill{Object.values(selectedDrills).flat().length !== 1 ? 's' : ''} selected
                      {stage && <span className="ml-2 text-[10px] text-lime/70 font-normal">from {selectedLevel} curriculum</span>}
                    </p>
                  </div>
                </div>

                {/* 6. Coach Watch-Fors */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Coach Watch-Fors</p>
                    <p className="text-sm text-text-primary">
                      {stage
                        ? `${blocks.reduce((sum, b) => sum + getWatchForsForBlock(stage, b.type).length, 0)} watch-fors across ${blocks.length} blocks`
                        : 'Select a level to see watch-fors'}
                    </p>
                  </div>
                </div>

                {/* 7. Gates Supported */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <Info className="w-4 h-4 text-lime shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Gates Supported</p>
                    <p className="text-sm text-text-primary">
                      {supportedGates.length > 0
                        ? `${supportedGates.length} gates — ${supportedGates[0].gateLabel}${supportedGates.length > 1 ? ` +${supportedGates.length - 1} more` : ''}`
                        : 'Select a level to see gates'}
                    </p>
                  </div>
                </div>

                {/* 8. Player Missions */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                  <Target className="w-4 h-4 text-status-blue shrink-0" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Player Missions Suggested</p>
                    <p className="text-sm text-text-primary">
                      {playerMissions.length > 0
                        ? `${playerMissions.length} suggested — draft only — not assigned`
                        : 'Select a level to see missions'}
                    </p>
                  </div>
                </div>

                {/* Draft safety */}
                <div className="flex items-center gap-2 p-3 rounded-xl border border-text-muted/10 bg-surface-raised">
                  <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <p className="text-[11px] text-text-muted">Draft only — nothing changes until review — does not change master curriculum — director approval required</p>
                </div>

              </div>

              {/* Player missions */}
              {playerMissions.length > 0 && (
                <div className="rounded-xl border border-border bg-surface-raised p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-3.5 h-3.5 text-text-muted" />
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">Player Missions Suggested</p>
                    <span className="ml-auto text-[10px] text-text-muted">suggested / draft only — not assigned</span>
                  </div>
                  {playerMissions.map(m => (
                    <div key={m.missionLabel} className="p-2.5 rounded-lg border border-border space-y-0.5">
                      <p className="text-xs font-semibold text-text-primary">{m.missionLabel}</p>
                      <p className="text-[11px] text-status-blue leading-snug">{m.playerSafeWording}</p>
                      <p className="text-[10px] text-text-muted">Linked goal: {m.linkedGoal}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Draft safety + save */}
              <div className="pt-2">
                <div className="p-4 rounded-xl border border-status-orange/20 bg-status-orange/5 text-[11px] text-status-orange mb-3 space-y-1.5">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Draft Safety
                  </p>
                  <p>This is a curriculum-derived class template draft. All drills, blocks, and player missions are coaching guidance — not a finalized session plan.</p>
                  <p>This draft does not assign to any player, session, or coach until explicitly approved by a Director or Head Coach.</p>
                </div>
                {saveStatus === 'success' && (
                  <div className="rounded-xl border border-status-green/20 bg-status-green/5 p-4 mb-3 space-y-2">
                    <p className="text-sm font-semibold text-status-green flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Draft submitted for director review
                    </p>
                    <p className="text-[11px] text-text-secondary">Your template draft has been saved. A director must approve it before it becomes available for coaching sessions.</p>
                    <ol className="space-y-1 pl-4 list-decimal text-[11px] text-text-muted">
                      <li>Director reviews the draft in the Review Queue</li>
                      <li>Once approved, template status moves to Ready</li>
                      <li>Coaches can then use it in their session builder</li>
                    </ol>
                  </div>
                )}
                {saveStatus === 'schema_missing' && (
                  <div className="rounded-xl border border-status-orange/20 bg-status-orange/5 p-4 mb-3 space-y-1">
                    <p className="text-sm font-semibold text-status-orange flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Backend not yet available
                    </p>
                    <p className="text-[11px] text-text-muted">The template database is not connected yet. Your draft is ready but cannot be saved until the backend migration is applied.</p>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="rounded-xl border border-status-red/20 bg-status-red/5 p-4 mb-3 space-y-1">
                    <p className="text-sm font-semibold text-status-red flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Failed to save draft
                    </p>
                    <p className="text-[11px] text-text-muted">{saveError}</p>
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleSaveDraft}
                    disabled={saveStatus === 'saving' || saveStatus === 'success'}
                    className="btn-lime inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Save as Draft
                      </>
                    )}
                  </button>
                  {selectedLevel && (
                    <Link
                      href={`/director/templates/coach-preview?level=${encodeURIComponent(selectedLevel)}&goal=${encodeURIComponent(selectedGoal)}&type=class`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary border border-border bg-surface-raised hover:border-lime/20 hover:text-text-primary transition-all duration-100"
                    >
                      <Eye className="w-4 h-4" />
                      Preview for Coach
                    </Link>
                  )}
                  <Link href="/director/templates/class" className="btn-ghost inline-flex items-center gap-2">
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Step navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(prev => Math.max(1, prev - 1) as Step)}
            disabled={step === 1}
            className="btn-ghost inline-flex items-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 5 && (
            <button
              onClick={() => {
                if (step === 1 && !selectedLevel) return
                if (step === 2 && !selectedGoal) return
                setStep(prev => Math.min(5, prev + 1) as Step)
              }}
              disabled={(step === 1 && !selectedLevel) || (step === 2 && !selectedGoal)}
              className="btn-lime inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* DONNA tip */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-lime/15 bg-lime/4">
          <Sparkles className="w-4 h-4 text-lime shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">DONNA tip: </span>
            {step === 1 && 'The curriculum level is the source of truth. Choose the level that matches the players this template is designed for — it determines which goals, gates, and drills apply.'}
            {step === 2 && 'The session goal is the primary outcome. Be specific — it will guide DONNA when generating drill suggestions for this curriculum level.'}
            {step === 3 && 'A well-structured class template has 4–6 blocks: warm-up, 2–3 skill blocks, a match-play block, and a cool-down.'}
            {step === 4 && 'Select 2–3 drills per block. You can always add custom drills or modify these once the template is saved.'}
            {step === 5 && 'Review before saving. The curriculum source will be shown on all views of this template so coaches always know which level it targets.'}
          </p>
        </div>

      </div>

      <TemplateDonnaPanel mode="class_create" />
    </div>
  )
}
