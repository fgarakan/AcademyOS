'use client'

import { ArrowRight, ArrowLeft, Sparkles, Eye, EyeOff } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'

const PARENT_STYLES = [
  {
    id: 'informed-partner',
    label: 'Informed Partner',
    desc: 'Parents receive regular updates on progress, session themes, and development milestones.',
    example: '"Your player worked on rally consistency this week — up to 12-ball exchanges."',
  },
  {
    id: 'development-focused',
    label: 'Development-Focused',
    desc: 'Communication centers on long-term athlete growth, not short-term results.',
    example: '"We\'re building movement habits that will compound over 2–3 years."',
  },
  {
    id: 'competition-aware',
    label: 'Competition-Aware',
    desc: 'Parents receive tournament prep notes, match context, and performance trends.',
    example: '"Going into Saturday\'s match, here\'s the one thing to watch for."',
  },
  {
    id: 'minimal-interference',
    label: 'Minimal Interference',
    desc: 'Parents trust the process. Communication is concise, milestone-only.',
    example: '"Level checkpoint reached. Progressing to the next phase."',
  },
  {
    id: 'high-involvement',
    label: 'High Involvement',
    desc: 'Parents are active partners — open to questions, details, and session observations.',
    example: '"Feel free to ask about anything you saw today — here\'s a summary to start."',
  },
  {
    id: 'emotion-safe',
    label: 'Emotion-Safe Zone',
    desc: 'Communication is filtered to protect player confidence. No raw criticism visible to parents.',
    example: '"We\'re working through a technical adjustment — player is making great progress."',
  },
  {
    id: 'data-driven',
    label: 'Data-Driven',
    desc: 'Parents appreciate metrics, trends, and objective progress signals.',
    example: '"Forehand contact point consistency improved 22% over 6 sessions."',
  },
]

const VISIBILITY_RULES: { key: keyof OnboardingDraft['parentVisibilityRules']; label: string; safeDefault: boolean; desc: string }[] = [
  {
    key: 'hideRawCoachNotes',
    label: 'Hide raw coach notes from parents',
    safeDefault: true,
    desc: 'In-session coaching notes are for coach reference only.',
  },
  {
    key: 'hideInternalDirectorNotes',
    label: 'Hide director notes from parents',
    safeDefault: true,
    desc: 'Internal program decisions and escalation flags stay private.',
  },
  {
    key: 'hideRankings',
    label: 'Hide group rankings from parents',
    safeDefault: true,
    desc: 'Player ranking within the group is not visible to parent portal.',
  },
  {
    key: 'hideComparisons',
    label: 'Hide player-to-player comparisons',
    safeDefault: true,
    desc: 'Comparative stats between players are not surfaced.',
  },
  {
    key: 'hideUnapprovedAI',
    label: 'Require director approval for AI-drafted notes',
    safeDefault: true,
    desc: 'AI-generated progress notes must be approved before parents see them.',
  },
]

const PLAYER_MISSION_STYLES = [
  {
    id: 'challenge-seeker',
    label: 'Challenge Seeker',
    desc: 'Drawn to hard targets, stretch goals, and competitive milestones.',
    icon: '🎯',
  },
  {
    id: 'skill-builder',
    label: 'Skill Builder',
    desc: 'Motivated by mastery, technical improvement, and measurable progress.',
    icon: '🔧',
  },
  {
    id: 'team-player',
    label: 'Team Player',
    desc: 'Energized by group play, team formats, and belonging to the academy.',
    icon: '🤝',
  },
  {
    id: 'compete-to-win',
    label: 'Compete to Win',
    desc: 'Tournament-focused, loves pressure moments and match situations.',
    icon: '🏆',
  },
  {
    id: 'love-the-game',
    label: 'Love the Game',
    desc: 'Intrinsically motivated — the joy of playing is the reward.',
    icon: '❤️',
  },
  {
    id: 'personal-growth',
    label: 'Personal Growth',
    desc: 'Development-oriented — tracks their own arc, not results vs. others.',
    icon: '📈',
  },
  {
    id: 'explorer',
    label: 'Explorer',
    desc: 'Curious, open to new patterns, shot shapes, and tactical experiments.',
    icon: '🧭',
  },
]

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
}

function toggleStyle(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter(i => i !== id) : [...arr, id]
}

export function ParentPlayerExperienceStep({ draft, updateDraft, onNext, onPrev }: Props) {
  const parentStyles     = draft.parentStyles
  const visibilityRules  = draft.parentVisibilityRules
  const missionStyle     = draft.playerMissionStyle

  const toggleVisibility = (key: string) => {
    updateDraft({
      parentVisibilityRules: {
        ...visibilityRules,
        [key]: !visibilityRules[key],
      },
    })
  }

  const selectedParentLabels = parentStyles
    .map(id => PARENT_STYLES.find(s => s.id === id)?.label)
    .filter(Boolean)
    .join(' + ')

  const hiddenCount = Object.values(visibilityRules).filter(Boolean).length

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={5}
        totalSteps={7}
        title="How do parents and players experience your academy?"
        subtitle="Set your parent communication style, privacy defaults, and player mission type."
      />

      {/* Parent Communication Style */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Parent Communication Style
          </p>
          <span className="text-[10px] text-text-muted">
            {parentStyles.length} selected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {PARENT_STYLES.map(style => {
            const isSelected = parentStyles.includes(style.id)
            return (
              <button
                key={style.id}
                onClick={() => updateDraft({ parentStyles: toggleStyle(parentStyles, style.id) })}
                className={[
                  'relative text-left rounded-xl border px-4 py-3.5 transition-all overflow-hidden',
                  isSelected
                    ? 'bg-lime/8 border-lime/40 shadow-lime'
                    : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised',
                ].join(' ')}
              >
                {isSelected && (
                  <span className="absolute top-0 left-0 right-0 h-0.5 bg-lime" />
                )}
                <div className="flex items-center gap-2 mb-1">
                  <p className={[
                    'text-sm font-semibold leading-tight flex-1',
                    isSelected ? 'text-text-primary' : 'text-text-secondary',
                  ].join(' ')}>
                    {style.label}
                  </p>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-lime flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-base">✓</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed mb-1.5">
                  {style.desc}
                </p>
                {isSelected && (
                  <p className="text-[10px] text-lime/70 italic leading-relaxed">
                    {style.example}
                  </p>
                )}
              </button>
            )
          })}
        </div>

        {parentStyles.length > 0 && (
          <div className="rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Parent voice:{' '}
              <span className="text-lime font-medium">{selectedParentLabels}</span>
              {'. '}
              I'll shape parent portal messages, progress updates, and coach-to-parent notes around this.
            </p>
          </div>
        )}
      </div>

      {/* Parent Privacy Rules */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Parent Visibility Rules
          </p>
          <span className="text-[10px] font-mono text-lime">
            {hiddenCount}/5 protected
          </span>
        </div>
        <p className="text-[11px] text-text-muted mb-3">
          Defaults protect player and coach privacy. You can adjust anytime after activation.
        </p>

        <div className="rounded-xl bg-surface border border-border overflow-hidden">
          {VISIBILITY_RULES.map((rule, i) => {
            const isProtected = !!visibilityRules[rule.key]
            return (
              <div
                key={rule.key}
                className={[
                  'flex items-start gap-3 px-4 py-3 transition-colors',
                  i < VISIBILITY_RULES.length - 1 ? 'border-b border-border' : '',
                  'hover:bg-surface-raised',
                ].join(' ')}
              >
                <button
                  onClick={() => toggleVisibility(rule.key)}
                  className={[
                    'mt-0.5 shrink-0 w-8 h-4.5 rounded-full flex items-center transition-all relative',
                    isProtected ? 'bg-lime/20 border border-lime/40' : 'bg-surface-raised border border-border',
                  ].join(' ')}
                  style={{ height: '18px', minWidth: '32px' }}
                >
                  <span
                    className={[
                      'absolute w-3 h-3 rounded-full transition-all',
                      isProtected ? 'bg-lime left-[17px]' : 'bg-text-muted/40 left-[2px]',
                    ].join(' ')}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isProtected
                      ? <EyeOff className="w-3 h-3 text-lime shrink-0" />
                      : <Eye className="w-3 h-3 text-text-muted/50 shrink-0" />
                    }
                    <p className={[
                      'text-xs font-medium',
                      isProtected ? 'text-text-secondary' : 'text-text-muted',
                    ].join(' ')}>
                      {rule.label}
                    </p>
                    {rule.safeDefault && isProtected && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-lime/60 bg-lime/8 border border-lime/20 rounded px-1.5 py-0.5">
                        Safe default
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted/60 mt-0.5 leading-relaxed">
                    {rule.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[12px] text-text-secondary leading-relaxed">
            These rules protect your coaches and players. I'll apply them as defaults across all parent portal views.
          </p>
        </div>
      </div>

      {/* Player Mission Style */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
          Default Player Mission Style
        </p>
        <p className="text-[11px] text-text-muted mb-3">
          How do most of your players approach development? This shapes player portal framing and mission language.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {PLAYER_MISSION_STYLES.map(style => {
            const isSelected = missionStyle === style.id
            return (
              <button
                key={style.id}
                onClick={() => updateDraft({ playerMissionStyle: isSelected ? '' : style.id })}
                className={[
                  'relative text-left rounded-xl border px-4 py-3 transition-all overflow-hidden',
                  isSelected
                    ? 'bg-lime/8 border-lime/40 shadow-lime'
                    : 'bg-surface border-border hover:border-border-strong hover:bg-surface-raised',
                ].join(' ')}
              >
                {isSelected && (
                  <span className="absolute top-0 left-0 right-0 h-0.5 bg-lime" />
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base leading-none">{style.icon}</span>
                  <p className={[
                    'text-sm font-semibold leading-tight flex-1',
                    isSelected ? 'text-text-primary' : 'text-text-secondary',
                  ].join(' ')}>
                    {style.label}
                  </p>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-lime flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-base">✓</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {style.desc}
                </p>
              </button>
            )
          })}
        </div>

        {missionStyle && (
          <div className="rounded-xl bg-lime/5 border border-lime/15 px-4 py-3 flex items-start gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary leading-relaxed">
              I'll frame player portal missions, dashboard copy, and progress language around the{' '}
              <span className="text-lime font-medium">
                {PLAYER_MISSION_STYLES.find(s => s.id === missionStyle)?.label}
              </span>{' '}
              identity.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime text-base font-semibold text-sm hover:brightness-110 transition-all shadow-lime"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
