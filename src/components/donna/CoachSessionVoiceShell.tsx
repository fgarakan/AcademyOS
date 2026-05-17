'use client'

// Sprint 613 — Voice-First Coach Session Shell V1
// Coach-facing voice entry point for a session.
// Captures voice input, shows DONNA command flow, routes to appropriate preview.
// No DB — all writes go through callback props.

import { useState, useEffect, useRef } from 'react'
import { Mic, Type, X } from 'lucide-react'
import { useVoiceDictation } from '@/lib/donna/useVoiceDictation'
import { classifyDonnaIntent } from '@/lib/donna/donnaIntentClassifier'
import { routeDonnaCommand } from '@/lib/donna/donnaCommandRouter'
import type { DonnaFlowState, DonnaFlowEvent } from '@/lib/donna/donnaMultiStepFlow'
import { createInitialFlowState, transitionFlow, FLOW_STEP_LABELS } from '@/lib/donna/donnaMultiStepFlow'
import { DONNACommandPreviewCard } from './DONNACommandPreviewCard'
import { DONNACommandClarification, buildDefaultClarificationOptions } from './DONNACommandClarification'
import { DONNACommandRejectionBanner } from './DONNACommandRejectionBanner'
import type { DonnaCommandCategory } from '@/lib/donna/donnaCommandRouter'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CoachSessionVoiceShellProps {
  sessionId: string
  sessionLabel: string
  onCommandConfirmed?: (category: DonnaCommandCategory, rawInput: string) => void
  onClose?: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CoachSessionVoiceShell({
  sessionId,
  sessionLabel,
  onCommandConfirmed,
  onClose,
}: CoachSessionVoiceShellProps) {
  const [flow, setFlow] = useState<DonnaFlowState>(createInitialFlowState())
  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice')
  const processedRef = useRef(false)

  const voice = useVoiceDictation()

  const dispatch = (event: DonnaFlowEvent) => setFlow(prev => transitionFlow(prev, event))

  // When voice dictation completes, process the transcript
  useEffect(() => {
    if (voice.status === 'done' && voice.transcript && !processedRef.current) {
      processedRef.current = true
      submitInput(voice.transcript)
    }
    if (voice.status === 'idle') {
      processedRef.current = false
    }
    if (voice.status === 'error') {
      setInputMode('text')
    }
  }, [voice.status, voice.transcript])

  function submitInput(input: string) {
    if (!input.trim()) return
    dispatch({ type: 'INPUT_SUBMITTED', input })
    const classification = classifyDonnaIntent(input)
    const route = routeDonnaCommand(classification.category)
    dispatch({ type: 'CLASSIFIED', classification, route })
  }

  function handleCategorySelect(category: DonnaCommandCategory) {
    if (!flow.rawInput) return
    const updatedClassification = {
      category,
      confidence: 'high' as const,
      matchedSignals: [],
      requiresClarification: false,
      clarificationPrompt: null,
    }
    const route = routeDonnaCommand(category)
    dispatch({ type: 'CLARIFICATION_SELECTED', updatedClassification, route })
  }

  function handleProceed() {
    dispatch({ type: 'PREVIEW_CONFIRMED' })
    if (flow.classification && flow.rawInput) {
      onCommandConfirmed?.(flow.classification.category, flow.rawInput)
    }
    dispatch({ type: 'SUBMIT_SUCCESS' })
    setTimeout(() => dispatch({ type: 'RESET' }), 1500)
  }

  const isClassified = flow.step === 'previewing' || flow.step === 'clarifying'
  const isClarifying = flow.step === 'clarifying'
  const isCancelled = flow.step === 'cancelled'
  const isComplete = flow.step === 'complete'

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-lime shrink-0" />
          <p className="text-xs font-semibold text-text-secondary">DONNA — {sessionLabel}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted">{FLOW_STEP_LABELS[flow.step]}</span>
          {onClose && (
            <button type="button" onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Input area */}
      {(flow.step === 'idle' || flow.step === 'input') && (
        <div className="px-3.5 py-3 space-y-3">
          {inputMode === 'voice' && voice.isAvailable ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <button
                onClick={() => {
                  dispatch({ type: 'START_INPUT' })
                  voice.reset()
                  processedRef.current = false
                  voice.start()
                }}
                disabled={voice.status === 'listening'}
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-colors ${
                  voice.status === 'listening'
                    ? 'bg-lime/10 border-lime text-lime'
                    : 'bg-surface border-border text-text-muted hover:border-lime/40 hover:text-lime'
                }`}
              >
                <Mic className="w-6 h-6" />
              </button>
              {voice.status === 'listening' && (
                <p className="text-xs text-lime">Listening…</p>
              )}
              {voice.interimTranscript && (
                <p className="text-xs text-text-muted italic">{voice.interimTranscript}</p>
              )}
              <button
                onClick={() => setInputMode('text')}
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
              >
                <Type className="w-3 h-3" />
                Type instead
              </button>
            </div>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault()
                const val = textInput.trim()
                if (val) {
                  dispatch({ type: 'START_INPUT' })
                  submitInput(val)
                  setTextInput('')
                }
              }}
              className="flex gap-2"
            >
              <input
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="What do you need, Coach?"
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40"
                autoFocus
              />
              <button type="submit" className="btn-lime text-xs py-2 px-3">Ask</button>
            </form>
          )}
          {inputMode === 'text' && voice.isAvailable && (
            <button
              onClick={() => setInputMode('voice')}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            >
              <Mic className="w-3 h-3" />
              Use voice
            </button>
          )}
        </div>
      )}

      {/* Classification preview */}
      {isClassified && !isClarifying && flow.classification && flow.route && (
        <div className="px-3.5 py-3">
          <DONNACommandPreviewCard
            rawInput={flow.rawInput ?? ''}
            classification={flow.classification}
            destination={flow.route.destination}
            requiresDirectorApproval={flow.route.requiresDirectorApproval}
            isReadOnly={flow.route.isReadOnly}
            routingNote={flow.route.routingNote}
            onProceed={handleProceed}
            onClarify={() => dispatch({ type: 'RESET' })}
            onCancel={() => dispatch({ type: 'CANCEL' })}
          />
        </div>
      )}

      {/* Clarification */}
      {isClarifying && flow.classification && (
        <div className="px-3.5 py-3">
          <DONNACommandClarification
            prompt={flow.classification.clarificationPrompt ?? 'What did you need?'}
            options={buildDefaultClarificationOptions()}
            onSelect={handleCategorySelect}
            onTypeRefinement={input => {
              dispatch({ type: 'RESET' })
              setTimeout(() => submitInput(input), 50)
            }}
            onCancel={() => dispatch({ type: 'CANCEL' })}
          />
        </div>
      )}

      {/* Cancelled */}
      {isCancelled && (
        <div className="px-3.5 py-3">
          <DONNACommandRejectionBanner
            reason="user_cancelled"
            onRetry={() => dispatch({ type: 'RESET' })}
            onDismiss={onClose}
          />
        </div>
      )}

      {/* Complete */}
      {isComplete && (
        <div className="px-3.5 py-3 text-center py-4">
          <p className="text-xs text-status-green">Proposal submitted to review queue.</p>
        </div>
      )}
    </div>
  )
}
