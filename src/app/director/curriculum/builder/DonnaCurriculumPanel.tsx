'use client'

// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1716–1745
// Extended: Mega Sprint 1836–1865 — duplicate detection + impact preview
// DonnaCurriculumPanel: the curriculum architect conversation UI.

import { useState, useRef, useEffect } from 'react'
import { Sparkles, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, X, Send, Loader2, Info, TriangleAlert } from 'lucide-react'
import type { CurriculumIntelligenceContext } from '@/lib/donna/curriculum/curriculumIntelligenceContext'
import type { CurriculumDraftObject, CurriculumModificationIntent } from '@/lib/donna/curriculum/curriculumDraftObject'
import { createEmptyDraft } from '@/lib/donna/curriculum/curriculumDraftObject'
import {
  interpretDirectorInput,
  assembleDraftFromContext,
  generateArchitectResponse,
  getUnansweredFields,
  buildCurriculumRecommendations,
  isV2DeferredIntent,
  buildDeferredIntentResponse,
  type ArchitectResponse,
  type InterpretedIntent,
} from '@/lib/donna/curriculum/curriculumArchitect'
import {
  buildReviewSummary,
  isDraftComplete,
  buildReplaceExplanation,
  INTENT_LABELS,
} from '@/lib/donna/curriculum/curriculumDraftReviewPanel'
import { checkForDuplicates, type DuplicateCheckResult } from '@/lib/donna/curriculum/curriculumDuplicateDetector'
import { buildImpactPreview, type ImpactPreview } from '@/lib/donna/curriculum/curriculumImpactPreview'
import { saveCurriculumDraftAction } from '@/lib/actions/saveCurriculumDraftAction'
import { routeDonnaIntentV1 } from '@/lib/donna/donnaIntentRouterV1'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConversationTurn {
  role: 'director' | 'donna'
  content: string
}

type PanelState = 'idle' | 'drafting' | 'reviewing' | 'saving' | 'success' | 'error'

interface Props {
  context: CurriculumIntelligenceContext
  initialIntent?: CurriculumModificationIntent
  initialLevelId?: string
  onDraftSaved?: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaCurriculumPanel({ context, initialIntent, initialLevelId, onDraftSaved }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [panelState, setPanelState] = useState<PanelState>('idle')
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState<ConversationTurn[]>([])
  const [draft, setDraft] = useState<CurriculumDraftObject | null>(null)
  const [interpreted, setInterpreted] = useState<InterpretedIntent | null>(null)
  const [architectResponse, setArchitectResponse] = useState<ArchitectResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null)
  const [impactPreview, setImpactPreview] = useState<ImpactPreview | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Pre-fill when launched from a recommendation
  useEffect(() => {
    if (initialIntent && initialLevelId && !isExpanded) {
      setIsExpanded(true)
    }
  }, [initialIntent, initialLevelId])

  useEffect(() => {
    if (isExpanded && panelState === 'idle' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded, panelState])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, architectResponse])

  function reset() {
    setPanelState('idle')
    setInput('')
    setConversation([])
    setDraft(null)
    setInterpreted(null)
    setArchitectResponse(null)
    setErrorMessage(null)
    setDuplicateResult(null)
    setImpactPreview(null)
  }

  function handleDirectorInput(text: string) {
    if (!text.trim()) return

    const routeResult = routeDonnaIntentV1(text, '/director/curriculum/builder')

    // Check for V2-deferred intents
    if (isV2DeferredIntent(routeResult.intent)) {
      const deferredMsg = buildDeferredIntentResponse(routeResult.intent)
      setConversation(prev => [
        ...prev,
        { role: 'director', content: text },
        { role: 'donna', content: deferredMsg },
      ])
      setInput('')
      return
    }

    const newInterpreted = interpretDirectorInput(text, context)
    const newDraft = assembleDraftFromContext(newInterpreted, context)

    // If launched with a pre-fill from recommendation
    if (initialLevelId && !newDraft.levelId) {
      const level = context.levels.find(l => l.id === initialLevelId)
      if (level) {
        newDraft.levelId   = level.id
        newDraft.levelName = level.displayName
      }
    }

    newDraft.rawInput = text

    const response = generateArchitectResponse(newInterpreted, newDraft, context)

    setInterpreted(newInterpreted)
    setDraft(newDraft)
    setArchitectResponse(response)
    setConversation(prev => [
      ...prev,
      { role: 'director', content: text },
      { role: 'donna', content: response.message },
    ])
    setInput('')

    if (isDraftComplete(newDraft) && getUnansweredFields(newDraft).length === 0) {
      setDuplicateResult(checkForDuplicates(newDraft, context.curriculumItems))
      setImpactPreview(buildImpactPreview(newDraft, context))
      setPanelState('reviewing')
    } else {
      setPanelState('drafting')
    }
  }

  function handleFollowUpAnswer(fieldId: string, value: string) {
    if (!draft) return
    const updated = { ...draft }

    if (fieldId === 'title')        updated.title = value
    else if (fieldId === 'level') {
      const level = context.levels.find(
        l => l.displayName.toLowerCase() === value.toLowerCase() ||
             l.id === value,
      )
      if (level) { updated.levelId = level.id; updated.levelName = level.displayName }
    }
    else if (fieldId === 'target_item')   updated.targetItemTitle = value
    else if (fieldId === 'target_level') {
      const level = context.levels.find(
        l => l.displayName.toLowerCase() === value.toLowerCase() ||
             l.id === value,
      )
      if (level) { updated.levelId = level.id; updated.levelName = level.displayName }
    }
    else if (fieldId === 'coaching_cues')    updated.coachingCues   = value.split('\n').filter(Boolean)
    else if (fieldId === 'success_criteria') updated.successCriteria = value.split('\n').filter(Boolean)
    else if (fieldId === 'purpose')          updated.purpose        = value

    const newResponse = generateArchitectResponse(interpreted!, updated, context)
    const unanswered  = getUnansweredFields(updated)

    setDraft(updated)
    setArchitectResponse(newResponse)
    setConversation(prev => [
      ...prev,
      { role: 'director', content: value },
      { role: 'donna', content: newResponse.message },
    ])
    setInput('')

    if (unanswered.length === 0) {
      setDuplicateResult(checkForDuplicates(updated, context.curriculumItems))
      setImpactPreview(buildImpactPreview(updated, context))
      setPanelState('reviewing')
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (panelState === 'idle' || panelState === 'drafting') {
        if (panelState === 'idle') {
          handleDirectorInput(input)
        } else if (architectResponse?.nextQuestion) {
          handleFollowUpAnswer(architectResponse.nextQuestion.fieldId, input)
        }
      }
    }
  }

  function handleDraftFieldEdit(fieldId: string, value: string) {
    if (!draft) return
    const updated = { ...draft }
    if (fieldId === 'title')               updated.title            = value
    else if (fieldId === 'purpose')        updated.purpose          = value
    else if (fieldId === 'coachingCues')   updated.coachingCues     = value.split('\n').filter(Boolean)
    else if (fieldId === 'commonErrors')   updated.commonErrors     = value.split('\n').filter(Boolean)
    else if (fieldId === 'successCriteria') updated.successCriteria = value.split('\n').filter(Boolean)
    else if (fieldId === 'progressions')   updated.progressions     = value.split('\n').filter(Boolean)
    else if (fieldId === 'regressions')    updated.regressions      = value.split('\n').filter(Boolean)
    else if (fieldId === 'parentExplanation')   updated.parentExplanation  = value
    else if (fieldId === 'placementReasoning') updated.placementReasoning = value
    else if (fieldId === 'setup')              updated.setup              = value
    else if (fieldId === 'instructions')       updated.instructions       = value
    else if (fieldId === 'relatedSkills')      updated.relatedSkills      = value.split('\n').filter(Boolean)
    setDraft(updated)
  }

  async function handleSave() {
    if (!draft) return
    setPanelState('saving')
    setErrorMessage(null)
    try {
      const result = await saveCurriculumDraftAction(draft)
      if (!result.ok) {
        setErrorMessage(result.error)
        setPanelState('error')
        return
      }
      setSavedCount(result.draftCount)
      setPanelState('success')
      onDraftSaved?.()
    } catch (err) {
      setErrorMessage('Something went wrong. Please try again.')
      setPanelState('error')
    }
  }

  // ── Render helpers ──────────────────────────────────────

  const reviewFields = draft ? buildReviewSummary(draft) : []
  const isReplaceIntent = draft?.intent === 'replace'

  return (
    <div className="rounded-xl border border-border bg-[#111111] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1A1A1A] transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-lime shrink-0" aria-hidden="true" />
          <span className="text-[13px] font-medium text-white">
            DONNA — Curriculum Architect
          </span>
          {context.pendingOverrideCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-lime/10 text-lime text-[11px] font-mono">
              {context.pendingOverrideCount} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#555] hidden sm:block">
            Add · Modify · Move · Expand · Replace · Remove
          </span>
          {isExpanded
            ? <ChevronUp className="w-4 h-4 text-[#555]" aria-hidden="true" />
            : <ChevronDown className="w-4 h-4 text-[#555]" aria-hidden="true" />
          }
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-[#222]">

          {/* Success state */}
          {panelState === 'success' && (
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#30D158] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-[14px] text-white font-medium">
                    {savedCount === 2
                      ? 'Two drafts saved to your review queue.'
                      : 'Draft saved to your review queue.'}
                  </p>
                  <p className="text-[12px] text-[#AAAAAA] mt-1">
                    Nothing changes until you approve {savedCount === 2 ? 'both items' : 'it'} in the Pending Modifications queue above.
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="self-start text-[12px] text-lime hover:text-lime/80 transition-colors"
              >
                Start another change →
              </button>
            </div>
          )}

          {/* Error state */}
          {panelState === 'error' && (
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#FF3B30] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-[13px] text-white font-medium">Save failed</p>
                  <p className="text-[12px] text-[#AAAAAA] mt-1">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setPanelState('reviewing')}
                className="self-start text-[12px] text-lime hover:text-lime/80 transition-colors"
              >
                ← Back to review
              </button>
            </div>
          )}

          {/* Review screen */}
          {panelState === 'reviewing' && draft && (
            <div className="p-5 flex flex-col gap-5">
              <div>
                <p className="text-[12px] text-[#AAAAAA] mb-1">
                  Review each field before saving. Edit anything inline.
                </p>
                {isReplaceIntent && (
                  <p className="text-[11px] text-[#FF9500] mt-1">
                    {buildReplaceExplanation(draft)}
                  </p>
                )}
              </div>

              {/* ── Duplicate detection warning ─────────────────────────── */}
              {duplicateResult && duplicateResult.risk !== 'none' && (
                <div className={`rounded-xl border px-4 py-3 flex flex-col gap-2 ${
                  duplicateResult.risk === 'likely'
                    ? 'border-[#FF9500]/30 bg-[#FF9500]/5'
                    : 'border-[#555]/40 bg-[#1A1A1A]'
                }`}>
                  <div className="flex items-center gap-2">
                    <TriangleAlert
                      className={`w-3.5 h-3.5 shrink-0 ${duplicateResult.risk === 'likely' ? 'text-[#FF9500]' : 'text-[#AAAAAA]'}`}
                      aria-hidden="true"
                    />
                    <span className={`text-[11px] font-medium uppercase tracking-wider ${
                      duplicateResult.risk === 'likely' ? 'text-[#FF9500]' : 'text-[#AAAAAA]'
                    }`}>
                      {duplicateResult.risk === 'likely' ? 'Possible duplicate' : 'Review similar item'}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#AAAAAA] leading-snug">
                    {duplicateResult.explanation}
                  </p>
                  {duplicateResult.matches.slice(0, 2).map(m => (
                    <div key={m.itemId} className="flex items-center gap-2 text-[11px] text-[#555]">
                      <span className="px-1.5 py-0.5 rounded bg-[#222] text-[#AAAAAA]">{m.levelName}</span>
                      <span>"{m.itemTitle}"</span>
                      <span className="text-[#555]">· {m.contentType}</span>
                    </div>
                  ))}
                  {duplicateResult.recommendation === 'improve_existing' && (
                    <p className="text-[11px] text-[#FF9500] mt-1">
                      DONNA recommends improving the existing item instead of adding a new one.
                    </p>
                  )}
                </div>
              )}

              {/* ── Draft fields ─────────────────────────────────────────── */}
              <div className="flex flex-col gap-3">
                {reviewFields.map(field => (
                  <div key={field.fieldId} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-[#555]">
                        {field.label}
                      </span>
                      {field.isGateSensitive && (
                        <span className="text-[10px] text-[#FF9500]">gate-sensitive</span>
                      )}
                      {field.isMissing && (
                        <span className="text-[10px] text-[#FF3B30]">missing</span>
                      )}
                    </div>
                    {field.isArray ? (
                      <textarea
                        className="w-full bg-[#1A1A1A] border border-[#222] rounded-lg px-3 py-2 text-[13px] text-white resize-y min-h-[60px] focus:outline-none focus:border-lime/40 placeholder:text-[#555]"
                        value={(field.value as string[]).join('\n')}
                        onChange={e => handleDraftFieldEdit(field.fieldId, e.target.value)}
                        placeholder="One per line"
                        aria-label={field.label}
                      />
                    ) : (
                      <input
                        type="text"
                        className="w-full bg-[#1A1A1A] border border-[#222] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-lime/40 placeholder:text-[#555]"
                        value={field.value as string}
                        onChange={e => handleDraftFieldEdit(field.fieldId, e.target.value)}
                        aria-label={field.label}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* ── Impact preview ───────────────────────────────────────── */}
              {impactPreview && (
                <div className="flex flex-col gap-3 border-t border-[#222] pt-4">
                  <span className="text-[10px] uppercase tracking-widest text-[#555]">Impact Preview</span>

                  {/* Expected Benefit */}
                  {impactPreview.expectedBenefit.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-[#30D158] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                        Expected Benefit
                      </span>
                      {impactPreview.expectedBenefit.map((line, i) => (
                        <p key={i} className="text-[12px] text-[#AAAAAA] pl-4 leading-snug">{line.text}</p>
                      ))}
                    </div>
                  )}

                  {/* Possible Risk */}
                  {impactPreview.possibleRisk.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-[11px] flex items-center gap-1.5 ${impactPreview.hasWarnings ? 'text-[#FF9500]' : 'text-[#555]'}`}>
                        <TriangleAlert className="w-3 h-3 shrink-0" aria-hidden="true" />
                        Possible Risk
                      </span>
                      {impactPreview.possibleRisk.map((line, i) => (
                        <p key={i} className={`text-[12px] pl-4 leading-snug ${
                          line.severity === 'warning' ? 'text-[#FF9500]' : 'text-[#AAAAAA]'
                        }`}>{line.text}</p>
                      ))}
                    </div>
                  )}

                  {/* Who Is Affected */}
                  {impactPreview.whoIsAffected.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-[#555] flex items-center gap-1.5">
                        <Info className="w-3 h-3 shrink-0" aria-hidden="true" />
                        Who Is Affected
                      </span>
                      {impactPreview.whoIsAffected.map((line, i) => (
                        <p key={i} className="text-[12px] text-[#AAAAAA] pl-4 leading-snug">{line.text}</p>
                      ))}
                    </div>
                  )}

                  {/* What To Review Next */}
                  {impactPreview.whatToReviewNext.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-[#555] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
                        What To Review Next
                      </span>
                      {impactPreview.whatToReviewNext.map((line, i) => (
                        <p key={i} className="text-[12px] text-[#AAAAAA] pl-4 leading-snug">{line.text}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Approval gate statement */}
              <p className="text-[11px] text-[#555] border-t border-[#222] pt-4">
                Nothing changes until you approve{isReplaceIntent ? ' both items' : ' this draft'} in your review queue.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-lime text-black text-[13px] font-semibold hover:bg-lime/90 transition-colors"
                >
                  Save to review queue
                  {isReplaceIntent && ' (2 items)'}
                </button>
                <button
                  onClick={() => setPanelState('drafting')}
                  className="px-4 py-2 rounded-lg border border-[#222] text-[13px] text-[#AAAAAA] hover:bg-[#1A1A1A] transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Conversation + drafting state */}
          {(panelState === 'idle' || panelState === 'drafting') && (
            <div className="flex flex-col">

              {/* Context gap notice */}
              {!context.dataAvailable && (
                <div className="px-5 pt-4 pb-0">
                  <p className="text-[11px] text-[#555]">
                    {context.dataGaps.includes('academy_dna_not_set')
                      ? 'Your academy profile is not set up yet — complete onboarding for philosophy-based recommendations.'
                      : `Some intelligence layers couldn't load (${context.dataGaps.join(', ')}) — coverage insights may be incomplete.`
                    }
                  </p>
                </div>
              )}

              {/* Conversation history */}
              {conversation.length > 0 && (
                <div className="px-5 pt-4 pb-2 flex flex-col gap-3 max-h-64 overflow-y-auto">
                  {conversation.map((turn, i) => (
                    <div key={i} className={`flex ${turn.role === 'director' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed ${
                          turn.role === 'director'
                            ? 'bg-lime/10 text-white border border-lime/20'
                            : 'bg-[#1A1A1A] text-[#AAAAAA] border border-[#222]'
                        }`}
                      >
                        {turn.role === 'donna' && (
                          <span className="text-[10px] uppercase tracking-widest text-lime block mb-1">DONNA</span>
                        )}
                        {turn.content}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}

              {/* Insight chips (shown when drafting and insights exist) */}
              {panelState === 'drafting' && architectResponse && architectResponse.insightLines.length > 1 && (
                <div className="px-5 py-3 flex flex-col gap-1.5 border-t border-[#222]">
                  {architectResponse.insightLines.slice(1).map((line, i) => (
                    <p key={i} className="text-[11px] text-[#555]">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {/* Current question hint */}
              {panelState === 'drafting' && architectResponse?.nextQuestion && (
                <div className="px-5 py-2 border-t border-[#222]">
                  <p className="text-[11px] text-[#555]">
                    {architectResponse.nextQuestion.hint}
                  </p>
                </div>
              )}

              {/* Input row */}
              <div className="px-5 py-4 border-t border-[#222] flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-[#1A1A1A] border border-[#222] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-lime/40"
                  placeholder={
                    panelState === 'idle'
                      ? 'Describe what you want to do — e.g. "add a tactical drill to Yellow Ball 3"'
                      : architectResponse?.nextQuestion?.question ?? 'Your answer…'
                  }
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  disabled={false}
                  aria-label="DONNA curriculum input"
                />
                <button
                  onClick={() => {
                    if (panelState === 'idle') handleDirectorInput(input)
                    else if (architectResponse?.nextQuestion)
                      handleFollowUpAnswer(architectResponse.nextQuestion.fieldId, input)
                  }}
                  disabled={!input.trim()}
                  className="p-2.5 rounded-xl bg-lime/10 border border-lime/20 text-lime hover:bg-lime/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
                {panelState === 'drafting' && (
                  <button
                    onClick={reset}
                    className="p-2.5 rounded-xl border border-[#222] text-[#555] hover:text-[#AAAAAA] hover:bg-[#1A1A1A] transition-colors"
                    aria-label="Clear and start over"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Review shortcut when draft is complete */}
              {panelState === 'drafting' && draft && isDraftComplete(draft) && getUnansweredFields(draft).length === 0 && (
                <div className="px-5 pb-4">
                  <button
                    onClick={() => {
                      setDuplicateResult(checkForDuplicates(draft, context.curriculumItems))
                      setImpactPreview(buildImpactPreview(draft, context))
                      setPanelState('reviewing')
                    }}
                    className="text-[12px] text-lime hover:text-lime/80 transition-colors"
                  >
                    Draft is ready — review before saving →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Saving overlay */}
          {panelState === 'saving' && (
            <div className="p-5 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-lime animate-spin shrink-0" aria-hidden="true" />
              <span className="text-[13px] text-[#AAAAAA]">Saving to review queue…</span>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
