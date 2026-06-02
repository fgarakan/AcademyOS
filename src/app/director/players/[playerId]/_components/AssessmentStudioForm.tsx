'use client'

import { useState, useTransition, useCallback } from 'react'
import {
  ChevronDown, ChevronRight, CheckCircle, AlertCircle,
  Loader2, ClipboardList, RotateCcw, Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { submitAssessmentStudioAction } from '../assessmentStudioAction'
import { compareAssessments } from '@/lib/assessment/assessmentComparisonEngine'
import type {
  AssessmentFormConfig,
  AssessmentLabel,
  AssessmentMode,
  AssessmentView,
  FormSection,
  PreviousAssessmentData,
  ScoresDetail,
  SectionScore,
  SkillScore,
  AssessmentComparison,
} from '@/lib/assessment/assessmentTemplateTypes'
import {
  ASSESSMENT_LABEL_ORDER,
  ASSESSMENT_LABEL_DISPLAY,
  ASSESSMENT_MODE_LABELS,
  ASSESSMENT_MODE_DESCRIPTIONS,
  ASSESSMENT_VIEW_LABELS,
  ASSESSMENT_VIEW_ORDER,
} from '@/lib/assessment/assessmentTemplateTypes'
import { AssessmentComparisonCard } from './AssessmentComparisonCard'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  playerId:           string
  academyId:          string
  formConfig:         AssessmentFormConfig
  previousAssessment: PreviousAssessmentData | null
  playerStage:        string | null
  userRole:           string
  playerFirstName:    string | null
}

// ─── Score state shape ────────────────────────────────────────────────────────

type SectionState = {
  section_score: number | null
  not_assessed: boolean
  notes: string
  skills: Record<string, { score: number | null; not_assessed: boolean }>
}

type SectionStates = Record<string, SectionState>

function initSectionStates(
  config: AssessmentFormConfig,
  previous: PreviousAssessmentData | null,
): SectionStates {
  const state: SectionStates = {}
  const prevDetail = previous?.scores_detail ?? null
  for (const section of config.sections) {
    const prevSection = prevDetail?.sections?.[section.section_key]
    const skills: Record<string, { score: number | null; not_assessed: boolean }> = {}
    for (const skill of section.skills) {
      const prevSkill = prevSection?.skills?.[skill.skill_key]
      skills[skill.skill_key] = { score: null, not_assessed: prevSkill?.not_assessed ?? false }
    }
    state[section.section_key] = {
      section_score: null,
      not_assessed:  false,
      notes:         '',
      skills,
    }
  }
  return state
}

// ─── Score picker (1–10) ──────────────────────────────────────────────────────

function ScorePicker({
  value,
  onChange,
  disabled,
  prevScore,
}: {
  value: number | null
  onChange: (v: number | null) => void
  disabled?: boolean
  prevScore?: number | null
}) {
  const delta = value !== null && prevScore != null ? value - prevScore : null

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
          const selected = value === n
          const color = n <= 3 ? 'red' : n <= 5 ? 'orange' : n <= 7 ? 'lime' : 'green'
          const colorMap: Record<string, string> = {
            red:    selected ? 'bg-status-red/20 text-status-red border-status-red/60' : 'border-border text-text-muted hover:border-status-red/40 hover:text-status-red',
            orange: selected ? 'bg-status-orange/20 text-status-orange border-status-orange/60' : 'border-border text-text-muted hover:border-status-orange/40',
            lime:   selected ? 'bg-lime/20 text-lime border-lime/60' : 'border-border text-text-muted hover:border-lime/40',
            green:  selected ? 'bg-status-green/20 text-status-green border-status-green/60' : 'border-border text-text-muted hover:border-status-green/40',
          }
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(value === n ? null : n)}
              className={`w-8 h-8 rounded-lg border text-xs font-mono font-semibold transition-colors disabled:opacity-40 ${colorMap[color]}`}
            >
              {n}
            </button>
          )
        })}
      </div>
      {prevScore != null && (
        <p className="text-[10px] text-text-muted">
          Previous: <span className="font-mono">{prevScore}</span>
          {delta !== null && (
            <span className={delta > 0 ? 'text-status-green ml-1' : delta < 0 ? 'text-status-red ml-1' : 'text-text-muted ml-1'}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </p>
      )}
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  state,
  mode,
  expanded,
  onToggleExpand,
  onSectionScore,
  onSectionNotAssessed,
  onSectionNotes,
  onSkillScore,
  onSkillNotAssessed,
  prevDetail,
}: {
  section:              FormSection
  state:                SectionState
  mode:                 AssessmentMode
  expanded:             boolean
  onToggleExpand:       () => void
  onSectionScore:       (v: number | null) => void
  onSectionNotAssessed: (v: boolean) => void
  onSectionNotes:       (v: string) => void
  onSkillScore:         (skillKey: string, v: number | null) => void
  onSkillNotAssessed:   (skillKey: string, v: boolean) => void
  prevDetail:           ScoresDetail | null
}) {
  const prevSection = prevDetail?.sections?.[section.section_key]

  const isQuick = mode === 'quick'
  const hasSkills = section.skills.length > 0

  const filledCount = Object.values(state.skills).filter(s => s.score !== null && !s.not_assessed).length

  return (
    <Card>
      <div
        className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggleExpand()}
      >
        <div className="flex items-center gap-2 min-w-0">
          {!isQuick && (
            expanded
              ? <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
              : <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{section.display_name}</p>
            {!isQuick && hasSkills && (
              <p className="text-[10px] text-text-muted mt-0.5">
                {filledCount}/{section.skills.length} skills scored
              </p>
            )}
          </div>
        </div>

        {/* Section-level score (always shown, even when collapsed in standard mode) */}
        <div className="shrink-0" onClick={e => e.stopPropagation()}>
          {state.not_assessed ? (
            <span className="text-[10px] text-text-muted">Not assessed</span>
          ) : (
            <div className="flex items-center gap-2">
              {state.section_score !== null && (
                <span className="text-sm font-mono font-bold text-lime">{state.section_score}</span>
              )}
              {!isQuick && (
                <span className="text-[10px] text-text-muted">
                  {state.section_score !== null ? '/ 10' : 'section score'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {(isQuick || expanded) && (
        <CardContent className="pt-0 space-y-4 border-t border-border">

          {/* Not assessed toggle */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => onSectionNotAssessed(!state.not_assessed)}
              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                state.not_assessed
                  ? 'bg-surface-raised border-border text-text-muted'
                  : 'border-border text-text-muted hover:border-border'
              }`}
            >
              {state.not_assessed ? 'Mark as assessed' : 'Not assessed this section'}
            </button>
          </div>

          {!state.not_assessed && (
            <>
              {/* Section-level score */}
              {!isQuick && (
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-widest text-text-muted">
                    Section Score {prevSection?.section_score != null ? '' : ''}
                  </p>
                  <ScorePicker
                    value={state.section_score}
                    onChange={onSectionScore}
                    prevScore={prevSection?.section_score ?? null}
                  />
                </div>
              )}

              {/* Individual skills */}
              {hasSkills && (
                <div className="space-y-3 pt-1 border-t border-border/50">
                  {section.skills.map(skill => {
                    const skillState = state.skills[skill.skill_key] ?? { score: null, not_assessed: false }
                    const prevSkill = prevSection?.skills?.[skill.skill_key]
                    const prevSkillScore = prevSkill?.not_assessed ? null : (prevSkill?.score ?? null)
                    return (
                      <div key={skill.skill_key} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] text-text-secondary">
                            {skill.display_name}
                            {skill.is_required && (
                              <span className="ml-1 text-status-orange text-[9px]">required</span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => onSkillNotAssessed(skill.skill_key, !skillState.not_assessed)}
                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors shrink-0 ${
                              skillState.not_assessed
                                ? 'bg-surface-raised border-border text-text-muted'
                                : 'border-transparent text-text-muted hover:border-border'
                            }`}
                          >
                            {skillState.not_assessed ? 'N/A' : 'N/A?'}
                          </button>
                        </div>
                        {!skillState.not_assessed && (
                          <ScorePicker
                            value={skillState.score}
                            onChange={v => onSkillScore(skill.skill_key, v)}
                            prevScore={prevSkillScore}
                          />
                        )}
                        {skill.coach_guidance && (
                          <p className="text-[9px] text-text-muted italic">{skill.coach_guidance}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Section notes */}
              {!isQuick && (
                <div className="space-y-1 pt-1">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Section notes (optional)</p>
                  <textarea
                    value={state.notes}
                    onChange={e => onSectionNotes(e.target.value)}
                    placeholder="Observations for this section…"
                    rows={2}
                    maxLength={300}
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function AssessmentStudioForm({
  playerId,
  academyId,
  formConfig: initialConfig,
  previousAssessment,
  playerStage,
  userRole,
  playerFirstName,
}: Props) {
  const isCoach = userRole === 'coach'
  const isReassessment = previousAssessment !== null

  const [open, setOpen] = useState(false)

  const [view, setView] = useState<AssessmentView>(initialConfig.view)
  const [mode, setMode] = useState<AssessmentMode>(initialConfig.mode)
  const [assessmentLabel, setAssessmentLabel] = useState<AssessmentLabel>(
    isReassessment ? 'monthly_development_check' : 'director_requested'
  )
  const [isBaseline, setIsBaseline] = useState(!isReassessment)
  const [globalNotes, setGlobalNotes] = useState('')
  const [sectionStates, setSectionStates] = useState<SectionStates>(
    () => initSectionStates(initialConfig, null)
  )
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [comparison, setComparison] = useState<AssessmentComparison | null>(null)
  const [submittedAssessmentId, setSubmittedAssessmentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Rebuild section states when view/mode changes
  const resetSectionStates = useCallback((newConfig: AssessmentFormConfig) => {
    setSectionStates(initSectionStates(newConfig, null))
    setExpandedSections(new Set())
  }, [])

  function toggleSection(key: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function updateSectionScore(sectionKey: string, v: number | null) {
    setSectionStates(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], section_score: v },
    }))
  }

  function updateSectionNotAssessed(sectionKey: string, v: boolean) {
    setSectionStates(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], not_assessed: v },
    }))
  }

  function updateSectionNotes(sectionKey: string, v: string) {
    setSectionStates(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], notes: v },
    }))
  }

  function updateSkillScore(sectionKey: string, skillKey: string, v: number | null) {
    setSectionStates(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        skills: { ...prev[sectionKey].skills, [skillKey]: { ...prev[sectionKey].skills[skillKey], score: v } },
      },
    }))
  }

  function updateSkillNotAssessed(sectionKey: string, skillKey: string, v: boolean) {
    setSectionStates(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        skills: { ...prev[sectionKey].skills, [skillKey]: { ...prev[sectionKey].skills[skillKey], not_assessed: v, score: null } },
      },
    }))
  }

  function buildScoresDetail(): ScoresDetail {
    const sections: Record<string, SectionScore> = {}
    for (const [key, state] of Object.entries(sectionStates)) {
      const skills: Record<string, SkillScore> = {}
      for (const [sk, sv] of Object.entries(state.skills)) {
        skills[sk] = { score: sv.score, not_assessed: sv.not_assessed }
      }
      sections[key] = {
        section_score: state.section_score,
        not_assessed:  state.not_assessed,
        notes:         state.notes || null,
        skills,
      }
    }
    return {
      assessment_label:    assessmentLabel,
      assessment_view:     view,
      mode,
      template_id:         initialConfig.templateId,
      template_version_id: initialConfig.templateVersionId,
      sections,
      voice_notes:         null,
    }
  }

  function hasAnyScore(): boolean {
    return Object.values(sectionStates).some(s =>
      s.section_score !== null ||
      Object.values(s.skills).some(sk => sk.score !== null)
    )
  }

  function handleSubmit() {
    if (!hasAnyScore()) {
      setError('Score at least one field before submitting.')
      return
    }
    setError(null)
    startTransition(async () => {
      const detail = buildScoresDetail()
      const result = await submitAssessmentStudioAction({
        playerId,
        assessmentLabel,
        assessmentView: view,
        mode,
        scoresDetail:   detail,
        isBaseline,
        isReassessment,
        notes:          globalNotes || null,
        templateVersionId: initialConfig.templateVersionId,
      })

      if (result.ok) {
        setSuccess(true)
        setIsDraft(result.isDraft)
        setSubmittedAssessmentId(result.assessmentId)

        // Build comparison if we have a previous assessment
        if (previousAssessment) {
          const { deriveDomainScores } = await import('@/lib/assessment/assessmentComparisonEngine')
          const derived = deriveDomainScores(detail)
          const currentForComparison = {
            id:                result.assessmentId ?? '',
            assessed_date:     new Date().toISOString().split('T')[0],
            overall_score:     derived.overall_score,
            technical_score:   derived.technical_score,
            tactical_score:    derived.tactical_score,
            movement_score:    derived.movement_score,
            competition_score: derived.competition_score,
            behavioral_score:  derived.behavioral_score,
            scores_detail:     detail,
          }
          const comp = compareAssessments(currentForComparison, previousAssessment)
          setComparison(comp)
        }
      } else {
        setError(result.error ?? 'Could not save assessment.')
      }
    })
  }

  // ── Collapsed state ────────────────────────────────────────────────────────
  if (!open) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                <ClipboardList className="w-4.5 h-4.5 text-text-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {isReassessment ? 'Start Reassessment' : 'Start Assessment'}
                </p>
                <p className="text-xs text-text-muted">
                  {isReassessment
                    ? `Previous: ${previousAssessment?.assessed_date ? new Date(previousAssessment.assessed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'on record'} · Overall: ${previousAssessment?.overall_score?.toFixed(1) ?? '—'}`
                    : 'Template-driven · Quick, Standard, or Deep'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn-lime text-xs px-4 py-2 shrink-0"
            >
              {isReassessment ? 'Reassess' : 'Start'}
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-status-green shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {isDraft ? 'Assessment draft submitted for review' : 'Assessment recorded'}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {isDraft
                    ? 'Sent to director review queue. No blueprint, mission, or level changes until approved.'
                    : 'Saved as official record. No automatic level or blueprint changes.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuccess(false)
                  setComparison(null)
                  setGlobalNotes('')
                  setSectionStates(initSectionStates(initialConfig, null))
                  setOpen(false)
                }}
                className="text-xs text-text-muted hover:text-text-secondary shrink-0"
              >
                Close
              </button>
            </div>
          </CardContent>
        </Card>

        {comparison && (
          <AssessmentComparisonCard
            comparison={comparison}
            playerFirstName={playerFirstName}
            isDraft={isDraft}
          />
        )}
      </div>
    )
  }

  // ── Open form ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-lime" />
          <p className="text-sm font-semibold text-text-primary">
            {isReassessment ? 'Reassessment' : 'Assessment'}
            {isCoach && <span className="ml-2 text-[10px] text-status-orange bg-status-orange/10 border border-status-orange/20 rounded px-1.5 py-0.5">Coach Draft</span>}
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-text-muted hover:text-text-secondary">
          Cancel
        </button>
      </div>

      {/* Configuration row */}
      <Card>
        <CardContent className="py-4 space-y-4">

          {/* Assessment view */}
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest text-text-muted">Assessment View</p>
            <div className="flex flex-wrap gap-1.5">
              {ASSESSMENT_VIEW_ORDER.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setView(v)
                    resetSectionStates({ ...initialConfig, view: v })
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    view === v
                      ? 'bg-lime/10 text-lime border-lime/40'
                      : 'border-border text-text-muted hover:border-border hover:text-text-secondary'
                  }`}
                >
                  {ASSESSMENT_VIEW_LABELS[v]}
                </button>
              ))}
            </div>
            {initialConfig.view !== view && (
              <p className="text-[10px] text-text-muted flex items-center gap-1">
                <Info className="w-3 h-3" />
                Auto-suggested: {ASSESSMENT_VIEW_LABELS[initialConfig.view]}
              </p>
            )}
          </div>

          {/* Mode */}
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest text-text-muted">Mode</p>
            <div className="flex gap-1.5">
              {(['quick', 'standard', 'deep'] as AssessmentMode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); resetSectionStates({ ...initialConfig, mode: m }) }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    mode === m
                      ? 'bg-lime/10 text-lime border-lime/40'
                      : 'border-border text-text-muted hover:border-border'
                  }`}
                >
                  {ASSESSMENT_MODE_LABELS[m]}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-text-muted">{ASSESSMENT_MODE_DESCRIPTIONS[mode]}</p>
          </div>

          {/* Assessment type */}
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest text-text-muted">Assessment Type</p>
            <select
              value={assessmentLabel}
              onChange={e => setAssessmentLabel(e.target.value as AssessmentLabel)}
              className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-lime/50"
            >
              {ASSESSMENT_LABEL_ORDER.map(label => (
                <option key={label} value={label}>{ASSESSMENT_LABEL_DISPLAY[label]}</option>
              ))}
            </select>
          </div>

          {/* Baseline toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBaseline(b => !b)}
              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                isBaseline ? 'bg-lime border-lime' : 'border-border'
              }`}
            >
              {isBaseline && <span className="text-base-black text-[8px] font-bold">✓</span>}
            </button>
            <p className="text-xs text-text-secondary">Mark as baseline assessment</p>
          </div>

        </CardContent>
      </Card>

      {/* Reassessment banner */}
      {isReassessment && previousAssessment && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface border border-lime/20">
          <RotateCcw className="w-4 h-4 text-lime shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-lime">Reassessment mode</p>
            <p className="text-[11px] text-text-muted">
              Previous scores shown beside each field.
              Overall: <span className="font-mono">{previousAssessment.overall_score?.toFixed(1) ?? '—'}</span>
              {' '}·{' '}
              {new Date(previousAssessment.assessed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Section cards */}
      <div className="space-y-3">
        {initialConfig.sections.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-text-muted">
            No sections visible for the selected view. Try changing the assessment view or check your template settings.
          </div>
        ) : (
          initialConfig.sections.map(section => {
            const state = sectionStates[section.section_key] ?? {
              section_score: null, not_assessed: false, notes: '', skills: {},
            }
            return (
              <SectionCard
                key={section.section_key}
                section={section}
                state={state}
                mode={mode}
                expanded={mode === 'quick' || mode === 'deep' || expandedSections.has(section.section_key)}
                onToggleExpand={() => toggleSection(section.section_key)}
                onSectionScore={v => updateSectionScore(section.section_key, v)}
                onSectionNotAssessed={v => updateSectionNotAssessed(section.section_key, v)}
                onSectionNotes={v => updateSectionNotes(section.section_key, v)}
                onSkillScore={(sk, v) => updateSkillScore(section.section_key, sk, v)}
                onSkillNotAssessed={(sk, v) => updateSkillNotAssessed(section.section_key, sk, v)}
                prevDetail={previousAssessment?.scores_detail ?? null}
              />
            )
          })
        )}
      </div>

      {/* Global notes */}
      <Card>
        <CardContent className="py-4 space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-text-muted">Overall notes (optional)</p>
          <textarea
            value={globalNotes}
            onChange={e => setGlobalNotes(e.target.value)}
            placeholder="Overall impressions, context, anything not captured above…"
            rows={3}
            maxLength={1000}
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50"
          />
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-status-red px-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-lime flex items-center gap-2 text-sm px-5 py-2.5 disabled:opacity-50"
        >
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : isCoach
              ? <><CheckCircle className="w-4 h-4" /> Submit for review</>
              : <><CheckCircle className="w-4 h-4" /> {isReassessment ? 'Submit reassessment' : 'Submit assessment'}</>
          }
        </button>
        {isCoach && (
          <p className="text-[10px] text-text-muted leading-relaxed">
            Sent to director review. No changes until approved.
          </p>
        )}
      </div>

      <p className="text-[10px] text-text-muted border-t border-border pt-3 leading-relaxed">
        No automatic level movement, blueprint changes, or parent notifications.
        All changes require director approval.
      </p>

    </div>
  )
}
