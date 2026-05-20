'use client'

import { CheckCircle2, Circle, Pencil } from 'lucide-react'
import type { OnboardingDraft } from './OnboardingShell'

interface SectionStatus {
  label: string
  complete: boolean
  summary: string
  stepIndex: number
}

interface Props {
  draft: OnboardingDraft
  onEditStep?: (stepIndex: number) => void
  compact?: boolean
}

// ── Compact mode helpers ──────────────────────────────────────

function getSections(draft: OnboardingDraft): SectionStatus[] {
  const ageGroupLabels: Record<string, string> = {
    'red-ball':             'Red Ball',
    'orange-ball':          'Orange Ball',
    'green-ball':           'Green Ball',
    'yellow-ball-juniors':  'Yellow Ball Juniors',
    'high-performance':     'High Performance',
    'adult-programs':       'Adult Programs',
  }
  const modelLabels: Record<string, string> = {
    'private-lessons-only':     'Private Lessons Only',
    'group-programs':            'Group Programs',
    'high-performance':          'High Performance Academy',
    'recreational-development':  'Recreational + Development',
    'multi-program':             'Multi-Program Academy',
    'school-partnership':        'School / Campus Partnership',
  }
  return [
    {
      label: 'Academy Identity',
      stepIndex: 1,
      complete: !!(draft.academyName.trim() || draft.ageGroups.length || draft.academyModel),
      summary: [
        draft.academyName.trim() || 'No name set',
        draft.ageGroups.length ? draft.ageGroups.map(id => ageGroupLabels[id] ?? id).join(', ') : null,
        draft.academyModel ? modelLabels[draft.academyModel] ?? draft.academyModel : null,
      ].filter(Boolean).join(' · '),
    },
    {
      label: 'Coaching DNA',
      stepIndex: 2,
      complete: !!(draft.coachingStyles.length || draft.primaryCommunication),
      summary: [
        draft.coachingStyles.length ? draft.coachingStyles.length + ' coaching style' + (draft.coachingStyles.length > 1 ? 's' : '') : null,
        draft.primaryCommunication ? 'Primary: ' + draft.primaryCommunication.replace(/-/g, ' ') : null,
      ].filter(Boolean).join(' · ') || 'Not configured',
    },
    {
      label: 'Session Structure',
      stepIndex: 4,
      complete: !!(draft.sessionBlocks.length || draft.developmentPriorities.length),
      summary: [
        draft.sessionBlocks.length ? draft.sessionBlocks.length + ' block' + (draft.sessionBlocks.length > 1 ? 's' : '') + ' selected' : null,
        draft.developmentPriorities.length ? draft.developmentPriorities.length + ' dev priorit' + (draft.developmentPriorities.length > 1 ? 'ies' : 'y') : null,
      ].filter(Boolean).join(' · ') || 'Not configured',
    },
    {
      label: 'Parent + Player Experience',
      stepIndex: 6,
      complete: !!(draft.parentStyles.length || draft.playerMissionStyle),
      summary: [
        draft.parentStyles.length ? draft.parentStyles.length + ' parent style' + (draft.parentStyles.length > 1 ? 's' : '') : null,
        draft.playerMissionStyle ? 'Player: ' + draft.playerMissionStyle.replace(/-/g, ' ') : null,
        Object.values(draft.parentVisibilityRules).filter(Boolean).length + '/5 privacy rules active',
      ].filter(Boolean).join(' · '),
    },
  ]
}

// ── Non-compact (premium DNA card) helpers ────────────────────

const MODEL_BADGE_LABELS: Record<string, string> = {
  'private-lessons-only':     'Private Lessons',
  'group-programs':            'Group Programs',
  'high-performance':          'High Performance',
  'recreational-development':  'Recreational + Development',
  'multi-program':             'Multi-Program',
  'school-partnership':        'School Partnership',
}

const MODEL_NARRATIVE_PHRASES: Record<string, string> = {
  'private-lessons-only':     'private lessons',
  'group-programs':            'group programs',
  'high-performance':          'high-performance training',
  'recreational-development':  'recreational and developmental programs',
  'multi-program':             'multi-program delivery',
  'school-partnership':        'school and campus programs',
}

const STYLE_NARRATIVE_PHRASES: Record<string, string> = {
  'fundamentals-first':  'fundamentals-first coaching',
  'game-based':          'game-based learning',
  'high-performance':    'high-performance training methods',
  'player-centered':     'player-centered coaching',
  'tactical-first':      'tactical development',
  'movement-first':      'movement-first training',
  'competition-ready':   'competition preparation',
  'joy-retention':       'joy and player retention',
}

function getMonogram(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const words = trimmed.split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return trimmed.slice(0, 2).toUpperCase()
}

function buildNarrative(draft: OnboardingDraft): string {
  const hasContent = draft.academyModel || draft.coachingStyles.length || draft.sessionBlocks.length
  if (!hasContent) {
    return 'Complete the earlier steps and DONNA will generate a personalized summary of your academy DNA here.'
  }

  const model = draft.academyModel
    ? (MODEL_NARRATIVE_PHRASES[draft.academyModel] ?? draft.academyModel.replace(/-/g, ' '))
    : 'your academy'

  const styleParts = draft.coachingStyles.slice(0, 2)
    .map(s => STYLE_NARRATIVE_PHRASES[s] ?? s.replace(/-/g, ' '))

  const builtAround: string[] = [
    ...styleParts,
    draft.sessionBlocks.length > 0
      ? `${draft.sessionBlocks.length}-block session structure`
      : '',
    draft.developmentPriorities.length > 0
      ? `${draft.developmentPriorities.length} ranked development priorit${draft.developmentPriorities.length > 1 ? 'ies' : 'y'}`
      : '',
  ].filter(Boolean)

  const builtPart = builtAround.length > 0
    ? ` built around ${builtAround.join(', ')}`
    : ''

  return `Based on your answers, DONNA sees this as a ${model} environment${builtPart}. This DNA will guide future curriculum suggestions, class templates, coach defaults, and parent-safe communication drafts.`
}

// ── Component ─────────────────────────────────────────────────

export function AcademyDnaSummaryCard({ draft, onEditStep, compact }: Props) {

  // ── Compact variant (used in ActivationChecklistStep) ──
  if (compact) {
    const sections = getSections(draft)
    return (
      <div className="flex flex-col gap-2">
        {sections.map(section => (
          <div
            key={section.label}
            className="flex items-start gap-3 rounded-xl bg-surface border border-border px-3 py-2.5"
          >
            {section.complete
              ? <CheckCircle2 className="w-4 h-4 text-lime shrink-0 mt-0.5" />
              : <Circle className="w-4 h-4 text-border-strong shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
              <p className={[
                'text-xs font-semibold',
                section.complete ? 'text-text-secondary' : 'text-text-muted',
              ].join(' ')}>
                {section.label}
              </p>
              <p className="text-[10px] text-text-muted/70 leading-relaxed mt-0.5 truncate">
                {section.summary}
              </p>
            </div>
            {onEditStep && (
              <button
                onClick={() => onEditStep(section.stepIndex)}
                className="p-1 text-text-muted hover:text-lime transition-colors shrink-0"
                title={`Edit ${section.label}`}
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    )
  }

  // ── Non-compact variant — premium DNA identity card ──
  const monogram   = getMonogram(draft.academyName)
  const narrative  = buildNarrative(draft)
  const modelBadge = draft.academyModel
    ? (MODEL_BADGE_LABELS[draft.academyModel] ?? draft.academyModel.replace(/-/g, ' '))
    : null

  const stats = [
    { label: 'Coaching Styles',  value: draft.coachingStyles.length },
    { label: 'Session Blocks',   value: draft.sessionBlocks.length },
    { label: 'Dev Priorities',   value: draft.developmentPriorities.length },
    { label: 'Parent Styles',    value: draft.parentStyles.length },
  ]

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">

      {/* Identity header — monogram + name + model badge */}
      <div className="px-5 pt-5 pb-4 border-b border-border bg-surface-raised">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-lime/10 border border-lime/25 flex items-center justify-center shrink-0">
            <span
              className="font-bold text-lime leading-none select-none"
              style={{ fontSize: monogram.length > 1 ? '14px' : '18px' }}
            >
              {monogram}
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-bold text-text-primary leading-tight truncate mb-1.5">
              {draft.academyName.trim() || 'Draft Academy DNA'}
            </p>
            {modelBadge ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] text-text-muted font-medium">
                {modelBadge}
              </span>
            ) : (
              <span className="text-[10px] text-text-muted/50 italic">Model not selected</span>
            )}
          </div>
        </div>
      </div>

      {/* DONNA narrative */}
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">
          DONNA Learned
        </p>
        <p className="text-[11px] text-text-muted leading-relaxed">
          {narrative}
        </p>
      </div>

      {/* 2x2 stat grid */}
      <div className="px-5 py-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Draft Summary
        </p>
        <div className="grid grid-cols-2 gap-2">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="rounded-xl bg-surface-raised border border-border px-3 py-2.5"
            >
              <p className="text-xl font-mono font-bold leading-none mb-1.5">
                {stat.value > 0
                  ? <span className="text-text-primary">{stat.value}</span>
                  : <span className="text-text-muted/30">—</span>
                }
              </p>
              <p className="text-[9px] font-medium text-text-muted uppercase tracking-wide leading-tight">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Safety note */}
      <div className="px-5 pb-4">
        <p className="text-[9px] text-text-muted/40 text-center">
          Draft only — review before saving
        </p>
      </div>

    </div>
  )
}
