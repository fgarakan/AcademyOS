'use client'

import { useState, useTransition } from 'react'
import { Sparkles, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { AssessmentStudioForm } from './AssessmentStudioForm'
import { loadTemplateForPurposeAction } from '../_actions/loadTemplateForPurposeAction'
import {
  ASSESSMENT_PURPOSE_LABELS,
  ASSESSMENT_PURPOSE_DESCRIPTIONS,
  ASSESSMENT_PURPOSE_ORDER,
  buildDonnaExplanationForPurpose,
  type AssessmentPurpose,
} from '@/lib/assessment/assessmentTemplateResolver'
import type {
  AssessmentFormConfig,
  PreviousAssessmentData,
} from '@/lib/assessment/assessmentTemplateTypes'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  playerId:                string
  academyId:               string
  playerStage:             string | null
  playerStatus:            string | null
  playerFirstName:         string | null
  existingAssessmentCount: number
  userRole:                string
  resolvedPurpose:         AssessmentPurpose
  resolvedTemplateName:    string
  donnaExplanation:        string
  confidence:              'high' | 'medium' | 'low'
  fallbackUsed:            boolean
  fallbackReason:          string | null
  formConfig:              AssessmentFormConfig & { fallbackUsed: boolean; fallbackReason: string | null }
  previousAssessment:      PreviousAssessmentData | null
}

// ─── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const cls =
    confidence === 'high'
      ? 'bg-status-green/10 text-status-green border-status-green/30'
      : confidence === 'medium'
      ? 'bg-lime/10 text-lime border-lime/30'
      : 'bg-status-orange/10 text-status-orange border-status-orange/30'
  const label = confidence === 'high' ? 'Strong match' : confidence === 'medium' ? 'Good match' : 'Best available'
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AssessmentPurposePicker(props: Props) {
  const {
    playerId, academyId, playerStage, playerStatus, playerFirstName,
    existingAssessmentCount, userRole, previousAssessment,
  } = props

  const [activePurpose, setActivePurpose]     = useState<AssessmentPurpose>(props.resolvedPurpose)
  const [activeExplanation, setActiveExplanation] = useState(props.donnaExplanation)
  const [activeConfidence, setActiveConfidence]   = useState(props.confidence)
  const [activeFormConfig, setActiveFormConfig]   = useState(props.formConfig)
  const [activeFallback, setActiveFallback]       = useState(props.fallbackUsed)
  const [activeFallbackReason, setActiveFallbackReason] = useState(props.fallbackReason)
  const [activeTemplateName, setActiveTemplateName] = useState(props.resolvedTemplateName)

  const [isPending, startTransition] = useTransition()
  const [overrideError, setOverrideError]   = useState<string | null>(null)
  const [purposeOpen, setPurposeOpen] = useState(false)

  function handlePurposeChange(newPurpose: AssessmentPurpose) {
    if (newPurpose === activePurpose) { setPurposeOpen(false); return }
    setOverrideError(null)
    startTransition(async () => {
      const result = await loadTemplateForPurposeAction({
        assessmentPurpose:        newPurpose,
        playerStage,
        playerStatus,
        playerFirstName,
        existingAssessmentCount,
        academyId,
      })
      if (!result.ok || !result.formConfig || !result.resolution) {
        setOverrideError(result.error ?? 'Failed to load template.')
        return
      }
      setActivePurpose(newPurpose)
      setActiveExplanation(
        buildDonnaExplanationForPurpose(newPurpose, playerStage, playerFirstName),
      )
      setActiveConfidence(result.resolution.confidence)
      setActiveFormConfig(result.formConfig)
      setActiveFallback(result.formConfig.fallbackUsed)
      setActiveFallbackReason(result.formConfig.fallbackReason)
      setActiveTemplateName(result.resolution.templateName)
      setPurposeOpen(false)
    })
  }

  return (
    <div className="space-y-4">

      {/* DONNA routing explanation */}
      <div className="px-4 py-3.5 rounded-xl bg-lime/5 border border-lime/15">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <p className="text-[10px] uppercase tracking-widest text-lime">DONNA</p>
              <ConfidenceBadge confidence={activeConfidence} />
              <span className="text-[10px] text-text-muted ml-auto truncate">
                {activeTemplateName}
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {activeExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* Fallback warning */}
      {activeFallback && activeFallbackReason && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20">
          <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-xs text-status-orange leading-relaxed">{activeFallbackReason}</p>
        </div>
      )}

      {/* Purpose override */}
      <div>
        <button
          type="button"
          onClick={() => setPurposeOpen(o => !o)}
          disabled={isPending}
          className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors disabled:opacity-50"
        >
          {isPending
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Loading template…</>
            : <>{purposeOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Change assessment type</>
          }
        </button>

        {purposeOpen && !isPending && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ASSESSMENT_PURPOSE_ORDER.map(purpose => {
              const active = purpose === activePurpose
              return (
                <button
                  key={purpose}
                  type="button"
                  onClick={() => handlePurposeChange(purpose)}
                  className={`text-left px-3 py-2.5 rounded-xl border transition-colors ${
                    active
                      ? 'bg-lime/10 border-lime/40 text-text-primary'
                      : 'bg-surface border-border text-text-muted hover:border-lime/25 hover:text-text-secondary'
                  }`}
                >
                  <p className="text-xs font-semibold leading-snug">
                    {ASSESSMENT_PURPOSE_LABELS[purpose]}
                  </p>
                  <p className="text-[10px] mt-0.5 leading-snug opacity-70">
                    {ASSESSMENT_PURPOSE_DESCRIPTIONS[purpose]}
                  </p>
                </button>
              )
            })}
          </div>
        )}

        {overrideError && (
          <p className="mt-2 text-[10px] text-status-red">{overrideError}</p>
        )}
      </div>

      {/* Assessment Studio Form */}
      <AssessmentStudioForm
        playerId={playerId}
        academyId={academyId}
        formConfig={activeFormConfig}
        previousAssessment={previousAssessment}
        playerStage={playerStage}
        userRole={userRole}
        playerFirstName={playerFirstName}
      />
    </div>
  )
}
