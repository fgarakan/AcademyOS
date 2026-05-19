'use client'

import { ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react'
import type { OnboardingDraft } from '../OnboardingShell'
import { OnboardingStepHeader } from '../OnboardingStepHeader'
import { AcademyDnaSummaryCard } from '../AcademyDnaSummaryCard'
import { DonnaAdjustmentDraftPanel } from '../DonnaAdjustmentDraftPanel'

const COACHING_STYLE_LABELS: Record<string, string> = {
  'fundamentals-first': 'Fundamentals First',
  'game-based': 'Game-Based Learning',
  'high-performance': 'High-Performance Discipline',
  'player-centered': 'Player-Centered Coaching',
  'tactical-first': 'Tactical First',
  'movement-first': 'Movement First',
  'competition-ready': 'Competition-Ready',
  'joy-retention': 'Joy + Retention',
}

const COMM_STYLE_LABELS: Record<string, string> = {
  'direct-clear': 'Direct + Clear',
  'encouraging-positive': 'Encouraging + Positive',
  'question-led': 'Question-Led',
  'high-energy': 'High-Energy Motivator',
  'calm-precise': 'Calm + Precise',
  'standards-based': 'Standards-Based',
}

const SESSION_BLOCK_LABELS: Record<string, string> = {
  'technique-blocks': 'Technique Blocks',
  'live-ball-heavy': 'Live Ball Heavy',
  'constraint-games': 'Constraint Games',
  'point-play': 'Point Play Progression',
  'stations': 'Stations + Rotations',
  'assessment': 'Assessment Moments',
  'fitness-integrated': 'Fitness Integrated',
}

const DEV_PRIORITY_LABELS: Record<string, string> = {
  'technical-foundation': 'Technical Foundation',
  'tactical-iq': 'Tactical IQ',
  'movement-quality': 'Movement Quality',
  'competitive-toughness': 'Competitive Toughness',
  'emotional-regulation': 'Emotional Regulation',
  'consistency': 'Consistency + Rally Tolerance',
  'aggressive-identity': 'Aggressive Identity',
  'all-court': 'All-Court Development',
  'serve-return': 'Serve + Return Priority',
  'independence': 'Independence + Ownership',
}

const PARENT_STYLE_LABELS: Record<string, string> = {
  'informed-partner': 'Informed Partner',
  'development-focused': 'Development-Focused',
  'competition-aware': 'Competition-Aware',
  'minimal-interference': 'Minimal Interference',
  'high-involvement': 'High Involvement',
  'emotion-safe': 'Emotion-Safe Zone',
  'data-driven': 'Data-Driven',
}

const PLAYER_MISSION_LABELS: Record<string, string> = {
  'challenge-seeker': 'Challenge Seeker',
  'skill-builder': 'Skill Builder',
  'team-player': 'Team Player',
  'compete-to-win': 'Compete to Win',
  'love-the-game': 'Love the Game',
  'personal-growth': 'Personal Growth',
  'explorer': 'Explorer',
}

interface DnaRowProps {
  label: string
  value: React.ReactNode
  onEdit: () => void
}

function DnaRow({ label, value, onEdit }: DnaRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">{label}</p>
        <div className="text-xs text-text-secondary leading-relaxed">{value}</div>
      </div>
      <button
        onClick={onEdit}
        className="text-[10px] font-medium text-text-muted hover:text-lime transition-colors shrink-0 mt-0.5 px-2 py-1 rounded-lg hover:bg-lime/8 border border-transparent hover:border-lime/20"
      >
        Edit
      </button>
    </div>
  )
}

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
  onNext: () => void
  onPrev: () => void
  onEditStep: (stepIndex: number) => void
}

export function AcademyDnaReviewStep({ draft, updateDraft, onNext, onPrev, onEditStep }: Props) {
  const hasAnyContent = !!(
    draft.academyName.trim() ||
    draft.ageGroups.length ||
    draft.academyModel ||
    draft.coachingStyles.length ||
    draft.primaryCommunication ||
    draft.sessionBlocks.length ||
    draft.developmentPriorities.length ||
    draft.parentStyles.length ||
    draft.playerMissionStyle
  )

  const pillList = (ids: string[], labelMap: Record<string, string>) =>
    ids.length === 0
      ? <span className="text-text-muted/50 italic">Not set</span>
      : (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {ids.map((id, i) => (
            <span key={id} className="inline-flex items-center gap-1 bg-surface-raised border border-border rounded-md px-2 py-0.5 text-[10px] text-text-secondary">
              {ids.length > 1 && <span className="text-lime font-bold text-[8px]">{i + 1}</span>}
              {labelMap[id] ?? id}
            </span>
          ))}
        </div>
      )

  const singleValue = (id: string, labelMap: Record<string, string>) =>
    id
      ? <span className="font-medium text-text-primary">{labelMap[id] ?? id}</span>
      : <span className="text-text-muted/50 italic">Not set</span>

  const hiddenCount = Object.values(draft.parentVisibilityRules).filter(Boolean).length

  return (
    <div>
      <OnboardingStepHeader
        stepNumber={11}
        totalSteps={12}
        title="Review your Academy DNA"
        subtitle="Everything DONNA will use to build your starting operating system."
      />

      {/* Readiness card */}
      <div className="mb-6">
        <AcademyDnaSummaryCard draft={draft} onEditStep={onEditStep} />
      </div>

      {/* Full DNA detail */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
          Full Academy DNA Draft
        </p>

        <div className="rounded-2xl bg-surface border border-border overflow-hidden">

          {/* Academy Identity */}
          <div className="px-4 py-2 bg-surface-raised border-b border-border">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Academy Identity</p>
          </div>

          <DnaRow
            label="Academy Name"
            value={draft.academyName.trim()
              ? <span className="font-medium text-text-primary">{draft.academyName}</span>
              : <span className="text-text-muted/50 italic">Not set</span>
            }
            onEdit={() => onEditStep(1)}
          />
          <DnaRow
            label="Age Groups"
            value={pillList(draft.ageGroups, {
              'red-ball': 'Red Ball',
              'orange-ball': 'Orange Ball',
              'green-ball': 'Green Ball',
              'yellow-ball-juniors': 'Yellow Ball Juniors',
              'high-performance': 'High Performance',
              'adult-programs': 'Adult Programs',
            })}
            onEdit={() => onEditStep(1)}
          />
          <DnaRow
            label="Academy Model"
            value={singleValue(draft.academyModel, {
              'private-lessons-only': 'Private Lessons Only',
              'group-programs': 'Group Programs',
              'high-performance': 'High Performance Academy',
              'recreational-development': 'Recreational + Development',
              'multi-program': 'Multi-Program Academy',
              'school-partnership': 'School / Campus Partnership',
            })}
            onEdit={() => onEditStep(1)}
          />

          {/* Coaching DNA */}
          <div className="px-4 py-2 bg-surface-raised border-b border-border border-t">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Coaching DNA</p>
          </div>

          <DnaRow
            label="Coaching Styles"
            value={pillList(draft.coachingStyles, COACHING_STYLE_LABELS)}
            onEdit={() => onEditStep(2)}
          />
          <DnaRow
            label="Communication Voice"
            value={
              draft.primaryCommunication || draft.secondaryCommunication ? (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {draft.primaryCommunication && (
                    <span className="inline-flex items-center gap-1 bg-lime/10 border border-lime/30 rounded-md px-2 py-0.5 text-[10px] text-lime font-medium">
                      Primary: {COMM_STYLE_LABELS[draft.primaryCommunication] ?? draft.primaryCommunication}
                    </span>
                  )}
                  {draft.secondaryCommunication && (
                    <span className="inline-flex items-center gap-1 bg-surface-raised border border-border rounded-md px-2 py-0.5 text-[10px] text-text-secondary">
                      Secondary: {COMM_STYLE_LABELS[draft.secondaryCommunication] ?? draft.secondaryCommunication}
                    </span>
                  )}
                </div>
              ) : <span className="text-text-muted/50 italic">Not set</span>
            }
            onEdit={() => onEditStep(2)}
          />

          {/* Session Structure */}
          <div className="px-4 py-2 bg-surface-raised border-b border-border border-t">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Session Structure</p>
          </div>

          <DnaRow
            label="Session Blocks"
            value={pillList(draft.sessionBlocks, SESSION_BLOCK_LABELS)}
            onEdit={() => onEditStep(3)}
          />
          <DnaRow
            label="Development Priorities"
            value={pillList(draft.developmentPriorities, DEV_PRIORITY_LABELS)}
            onEdit={() => onEditStep(3)}
          />

          {/* Parent + Player */}
          <div className="px-4 py-2 bg-surface-raised border-b border-border border-t">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Parent + Player Experience</p>
          </div>

          <DnaRow
            label="Parent Communication"
            value={pillList(draft.parentStyles, PARENT_STYLE_LABELS)}
            onEdit={() => onEditStep(4)}
          />
          <DnaRow
            label="Privacy Rules"
            value={
              <span className="font-medium text-text-secondary">
                {hiddenCount}/5 rules active
                <span className="text-text-muted font-normal ml-1">— parent portal protected</span>
              </span>
            }
            onEdit={() => onEditStep(4)}
          />
          <DnaRow
            label="Player Mission Style"
            value={singleValue(draft.playerMissionStyle, PLAYER_MISSION_LABELS)}
            onEdit={() => onEditStep(4)}
          />

        </div>
      </div>

      {/* DONNA adjustment panel */}
      <div className="mb-6">
        <DonnaAdjustmentDraftPanel draft={draft} updateDraft={updateDraft} />
      </div>

      {/* DONNA summary */}
      {hasAnyContent && (
        <div className="mb-8 rounded-2xl bg-lime/5 border border-lime/20 px-5 py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-lime shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">
                DONNA is ready to build your starting system.
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                Based on your Academy DNA draft, I'll prepare your default curriculum structure, session templates, coach cue library, parent communication defaults, and player portal framing.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  'Curriculum defaults',
                  'Session templates',
                  'Coach cues',
                  'Parent updates',
                  'Player portal',
                ].map(item => (
                  <span key={item} className="inline-flex items-center gap-1.5 bg-lime/8 border border-lime/20 rounded-lg px-2.5 py-1 text-[10px] text-lime font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
          className={[
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
            hasAnyContent
              ? 'bg-lime text-base hover:brightness-110 shadow-lime'
              : 'bg-surface border border-border text-text-muted cursor-not-allowed',
          ].join(' ')}
        >
          <Sparkles className="w-4 h-4" />
          Proceed to Activation
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
