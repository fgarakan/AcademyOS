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

function getReadinessScore(draft: OnboardingDraft): number {
  let score = 0
  if (draft.academyName.trim()) score++
  if (draft.ageGroups.length > 0) score++
  if (draft.academyModel) score++
  if (draft.coachingStyles.length > 0) score++
  if (draft.primaryCommunication) score++
  if (draft.sessionBlocks.length > 0) score++
  if (draft.developmentPriorities.length > 0) score++
  if (draft.parentStyles.length > 0) score++
  if (draft.playerMissionStyle) score++
  return score
}

function getSections(draft: OnboardingDraft): SectionStatus[] {
  const ageGroupLabels: Record<string, string> = {
    'red-ball': 'Red Ball',
    'orange-ball': 'Orange Ball',
    'green-ball': 'Green Ball',
    'yellow-ball-juniors': 'Yellow Ball Juniors',
    'high-performance': 'High Performance',
    'adult-programs': 'Adult Programs',
  }

  const modelLabels: Record<string, string> = {
    'private-lessons-only': 'Private Lessons Only',
    'group-programs': 'Group Programs',
    'high-performance': 'High Performance Academy',
    'recreational-development': 'Recreational + Development',
    'multi-program': 'Multi-Program Academy',
    'school-partnership': 'School / Campus Partnership',
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
      stepIndex: 3,
      complete: !!(draft.sessionBlocks.length || draft.developmentPriorities.length),
      summary: [
        draft.sessionBlocks.length ? draft.sessionBlocks.length + ' block' + (draft.sessionBlocks.length > 1 ? 's' : '') + ' selected' : null,
        draft.developmentPriorities.length ? draft.developmentPriorities.length + ' dev priorit' + (draft.developmentPriorities.length > 1 ? 'ies' : 'y') : null,
      ].filter(Boolean).join(' · ') || 'Not configured',
    },
    {
      label: 'Parent + Player Experience',
      stepIndex: 4,
      complete: !!(draft.parentStyles.length || draft.playerMissionStyle),
      summary: [
        draft.parentStyles.length ? draft.parentStyles.length + ' parent style' + (draft.parentStyles.length > 1 ? 's' : '') : null,
        draft.playerMissionStyle ? 'Player: ' + draft.playerMissionStyle.replace(/-/g, ' ') : null,
        Object.values(draft.parentVisibilityRules).filter(Boolean).length + '/5 privacy rules active',
      ].filter(Boolean).join(' · '),
    },
  ]
}

export function AcademyDnaSummaryCard({ draft, onEditStep, compact }: Props) {
  const sections  = getSections(draft)
  const score     = getReadinessScore(draft)
  const maxScore  = 9
  const pct       = Math.round((score / maxScore) * 100)
  const complete  = sections.filter(s => s.complete).length

  return (
    <div className={compact ? '' : 'rounded-2xl bg-surface border border-border overflow-hidden'}>
      {!compact && (
        <div className="px-5 py-4 border-b border-border bg-surface-raised">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Academy DNA Readiness
            </p>
            <span className="text-[11px] font-mono text-lime font-semibold">
              {complete}/{sections.length} sections
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-lime transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted mt-1.5">
            {pct < 40
              ? 'Fill in more sections to complete your Academy DNA.'
              : pct < 70
                ? 'Good start — complete remaining sections for full personalization.'
                : pct < 100
                  ? 'Almost there — DONNA is ready to build your starting system.'
                  : 'Academy DNA complete. Ready to activate.'}
          </p>
        </div>
      )}

      <div className={compact ? 'flex flex-col gap-2' : 'divide-y divide-border'}>
        {sections.map(section => (
          <div
            key={section.label}
            className={[
              'flex items-start gap-3',
              compact ? 'rounded-xl bg-surface border border-border px-3 py-2.5' : 'px-5 py-3.5',
            ].join(' ')}
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
    </div>
  )
}
