'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  ClipboardList,
  Sparkles,
  ClipboardCheck,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { StepAssessment, type AssessmentData } from './StepAssessment'
import { StepDonnaRecommendation } from './StepDonnaRecommendation'
import { StepDirectorReview } from './StepDirectorReview'
import { StepActivatePlayer } from './StepActivatePlayer'
import { StepParentCapture } from './StepParentCapture'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingData {
  playerId: string
  academyId: string
  player: {
    id: string
    first_name: string | null
    last_name: string | null
    full_name: string | null
    date_of_birth: string | null
    gender: string | null
    status: string | null
    notes: string | null
  }
  guardianCount: number
  latestAssessment: AssessmentData | null
  approvedRec: {
    id: string
    recommended_group_id: string | null
    group_name: string | null
  } | null
  groups: Array<{ id: string; name: string; track: string | null }>
  playerAgeYears: number | null
  initialStep: number
  isActive: boolean
}

// ─── Step definitions ─────────────────────────────────────────────────────────

type StepDef = {
  number: number
  label: string
  shortLabel: string
  Icon: React.ComponentType<{ className?: string }>
}

const STEPS: StepDef[] = [
  { number: 1, label: 'Player Profile',       shortLabel: 'Profile',    Icon: User },
  { number: 2, label: 'Parent / Contact',     shortLabel: 'Parent',     Icon: Users },
  { number: 3, label: 'Starting Assessment',  shortLabel: 'Assessment', Icon: ClipboardList },
  { number: 4, label: 'DONNA Recommendation', shortLabel: 'DONNA',      Icon: Sparkles },
  { number: 5, label: 'Placement Review',     shortLabel: 'Placement',  Icon: ClipboardCheck },
  { number: 6, label: 'Activate Player',      shortLabel: 'Activate',   Icon: Zap },
]

const DONNA_COMMENTARY: Record<number, string> = {
  1: 'Good start. Confirm the player details look right before moving on. You can always edit them from the full player profile.',
  2: 'Linking a parent or guardian now means they can receive updates once the player is activated. This is optional — add contacts later from the player profile.',
  3: 'A quick assessment gives me the context to suggest the right group. Rate each domain 1–4. Skipping is fine, but more data means a better recommendation.',
  4: 'Based on the assessment, here is my suggested placement. I have matched the scores against your available groups. You have full authority over the final decision.',
  5: 'Confirm where this player will train. My suggestion is pre-filled — change it if you prefer. This creates an official placement record.',
  6: 'When you activate, this player becomes fully part of your academy system. No automatic messages or portal access are created until you set them up from the player profile.',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDob(dob: string | null): string {
  if (!dob) return '—'
  return new Date(dob).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
      <p className="text-[10px] text-text-muted mb-0.5">{label}</p>
      <p className="text-sm text-text-primary break-words">{value}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OnboardingStepperClient({ data }: { data: OnboardingData }) {
  const { player, playerId, academyId } = data

  const [activeStep, setActiveStep] = useState(data.initialStep)

  // Guardian count — updated when a guardian is added inline in Step 2
  const [localGuardianCount, setLocalGuardianCount] = useState(data.guardianCount)

  // Assessment state (may be updated after Step 3 saves)
  const [localAssessment, setLocalAssessment] = useState<AssessmentData | null>(
    data.latestAssessment,
  )
  const [hasAssessment, setHasAssessment] = useState(data.latestAssessment !== null)

  // DONNA-recommended group (set when director clicks Continue from Step 4)
  const [donnaGroupId, setDonnaGroupId] = useState<string | null>(null)

  // Approved placement rec (may be set after Step 5 confirms)
  const [localApprovedRecId, setLocalApprovedRecId] = useState<string | null>(
    data.approvedRec?.id ?? null,
  )
  const [localApprovedGroupName, setLocalApprovedGroupName] = useState<string | null>(
    data.approvedRec?.group_name ?? null,
  )

  const playerName =
    player.full_name ??
    (`${player.first_name ?? ''} ${player.last_name ?? ''}`.trim() || 'New Player')

  const age = data.playerAgeYears

  // ── Step completion ─────────────────────────────────────────────────────────

  function isComplete(step: number): boolean {
    switch (step) {
      case 1: return true
      case 2: return localGuardianCount > 0
      case 3: return hasAssessment
      case 4: return hasAssessment
      case 5: return localApprovedRecId !== null
      case 6: return data.isActive
      default: return false
    }
  }

  // ── Progress bar ────────────────────────────────────────────────────────────

  const progressBar = (
    <Card>
      <CardContent className="py-4 px-3 sm:px-6">
        <div className="flex items-start">
          {STEPS.map((step, i) => {
            const done = isComplete(step.number)
            const active = activeStep === step.number
            return (
              <div key={step.number} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveStep(step.number)}
                    aria-label={`Step ${step.number}: ${step.label}`}
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center border-2
                      text-[11px] font-bold transition-all shrink-0
                      ${done && active
                        ? 'bg-lime border-lime text-base'
                        : done
                        ? 'bg-lime/20 border-lime text-lime'
                        : active
                        ? 'border-lime text-lime bg-transparent'
                        : 'border-border text-text-muted bg-transparent'}
                    `}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : step.number}
                  </button>
                  <span
                    className={`text-[9px] font-medium hidden sm:block transition-colors text-center leading-tight ${
                      active ? 'text-text-primary' : done ? 'text-lime' : 'text-text-muted'
                    }`}
                  >
                    {step.shortLabel}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mt-[-8px] sm:mt-[-18px] transition-colors ${
                      isComplete(step.number) ? 'bg-lime/40' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  // ── Step content ────────────────────────────────────────────────────────────

  function renderStep() {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoTile label="Name" value={playerName} />
              <InfoTile
                label="Date of birth"
                value={`${formatDob(player.date_of_birth)}${age !== null ? ` (age ${age})` : ''}`}
              />
              {player.gender && (
                <InfoTile label="Gender" value={player.gender} />
              )}
              {player.notes && (
                <div className="sm:col-span-2">
                  <InfoTile label="Notes" value={player.notes} />
                </div>
              )}
            </div>
            <Link
              href={`/director/players/${playerId}`}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Edit from full profile →
            </Link>
          </div>
        )

      case 2:
        return (
          <StepParentCapture
            playerId={playerId}
            initialCount={localGuardianCount}
            onGuardianAdded={() => setLocalGuardianCount(c => c + 1)}
          />
        )

      case 3:
        return (
          <StepAssessment
            playerId={playerId}
            existingAssessment={localAssessment}
            onDone={newAssessment => {
              if (newAssessment) {
                setLocalAssessment(newAssessment)
                setHasAssessment(true)
              }
              setActiveStep(4)
            }}
          />
        )

      case 4:
        return (
          <StepDonnaRecommendation
            assessment={localAssessment}
            groups={data.groups}
            playerAgeYears={age}
            onDone={recommendedGroupId => {
              setDonnaGroupId(recommendedGroupId)
              setActiveStep(5)
            }}
          />
        )

      case 5:
        return (
          <StepDirectorReview
            playerId={playerId}
            groups={data.groups}
            approvedRecId={localApprovedRecId}
            approvedGroupName={localApprovedGroupName}
            donnaRecommendedGroupId={donnaGroupId}
            onDone={(recId, selectedGroupId) => {
              setLocalApprovedRecId(recId)
              const g = data.groups.find(x => x.id === selectedGroupId)
              setLocalApprovedGroupName(g?.name ?? null)
              setActiveStep(6)
            }}
          />
        )

      case 6:
        return (
          <StepActivatePlayer
            playerId={playerId}
            academyId={academyId}
            approvedRecId={localApprovedRecId}
            groupName={localApprovedGroupName}
            playerName={playerName}
            isActive={data.isActive}
          />
        )

      default:
        return null
    }
  }

  const currentStepDef = STEPS[activeStep - 1]
  const CurrentIcon = currentStepDef?.Icon

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in p-4 sm:p-6 max-w-2xl space-y-5">
      {/* Back link */}
      <Link
        href="/director/players"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        All Players
      </Link>

      {/* Header */}
      <div>
        <p className="page-eyebrow">Onboarding</p>
        <h1 className="page-title">{playerName}</h1>
        <p className="page-subtitle">
          Step {activeStep} of {STEPS.length} — {currentStepDef?.label}
        </p>
      </div>

      {/* Progress bar */}
      {progressBar}

      {/* DONNA commentary */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/15">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          {DONNA_COMMENTARY[activeStep]}
        </p>
      </div>

      {/* Step panel */}
      <Card>
        <CardContent className="py-5">
          {CurrentIcon && (
            <div className="flex items-center gap-2 mb-4">
              <CurrentIcon className="w-4 h-4 text-lime shrink-0" />
              <p className="label-xs">{currentStepDef.label}</p>
            </div>
          )}
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pb-4">
        <button
          type="button"
          onClick={() => setActiveStep(s => Math.max(1, s - 1))}
          disabled={activeStep === 1}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <Link
            href={`/director/players/${playerId}`}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Skip to full profile
          </Link>
          {activeStep < STEPS.length && (
            <button
              type="button"
              onClick={() => setActiveStep(s => Math.min(STEPS.length, s + 1))}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
