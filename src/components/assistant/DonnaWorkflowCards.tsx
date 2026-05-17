'use client'

// Sprint 384 — DONNA Modularization
// Renders the cluster of output/workflow cards that appear in the DONNA panel:
// active draft card, command response, daily brief, attention report,
// recommendations, communication draft, attendance exception, onboarding
// suggestions, and the live context summary.
//
// State lives in DonnaAssistantButton (orchestrator). All mutations go through callbacks.
// Future agent owner: Workflow card / COO output team.

import { X } from 'lucide-react'
import { DonnaDraftCard } from './DonnaDraftCard'
import { DonnaVersionHistoryPanel } from './DonnaVersionHistoryPanel'
import { DonnaClassTemplateDraftPreviewFromDraft } from './DonnaClassTemplateDraftPreviewFromDraft'
import { DonnaDailyBriefCard } from './DonnaDailyBriefCard'
import { DonnaAttentionCard } from './DonnaAttentionCard'
import { DonnaRecommendationCard } from './DonnaRecommendationCard'
import { DonnaCommunicationDraftCard } from './DonnaCommunicationDraftCard'
import { DonnaMessageReviewPanel } from './DonnaMessageReviewPanel'
import { DonnaAttendanceLayer } from './DonnaAttendanceLayer'
import { DONNA_PUBLIC_NAME } from './donnaAssistantCopy'
import { summarizeDraft } from './donnaDraftRuntime'
import { clearDraftSession } from './donnaDraftPersistence'
import { DONNA_ONBOARDING_STEPS } from './donnaOnboardingFlow'
import type { ConversationState } from './donnaConversationController'
import type { CommunicationDraft } from './donnaCommunicationDraft'
import type { AttendanceExceptionDraft } from './donnaAttendanceWorkflow'
import type { AttendanceSessionOption } from './donnaAttendanceSessionResolution'
import type { DonnaApprovalExecutionResult } from './donnaApprovalExecutionTypes'
import type { DonnaRecommendationSet, DonnaRecommendation } from './donnaRecommendationTypes'
import type { DonnaContextSummary } from './donnaContextTypes'
import type { DailyBrief } from './donnaDailyBrief'
import type { AttentionReport } from './donnaAttentionEngine'
import type { TemplateDraft } from './templateDraftTypes'
import type { GenericTaskDraft } from './donnaGenericDraftTypes'
import type { LastCardActionRecord } from './donnaWorkflowCardActions'
import { makeLastCardAction } from './donnaWorkflowCardActions'

interface CommandResponse {
  message: string
  type: 'info' | 'honest'
  label?: string
}

interface Props {
  // Active conversation draft (conversation controller path)
  convState: ConversationState
  convShowDraftReview: boolean
  onConvUndo: () => void
  onConvStartOver: () => void
  onConvDiscard: () => void
  onConvReview: () => void
  onCloseConvReview: () => void
  draftRestoredFromSession: boolean
  onClearSavedDraft: () => void
  // Legacy draft guards (used to suppress conv draft card)
  genericDraft: GenericTaskDraft | null
  templateDraft: TemplateDraft | null
  // Command response
  commandResponse: CommandResponse | null
  onDismissCommandResponse: () => void
  // Daily brief
  dailyBrief: DailyBrief | null
  isDailyBriefLoading: boolean
  onDismissDailyBrief: () => void
  onDailyBriefOpenReviewQueue: () => void
  onDailyBriefPrepareCoachBriefs: () => void
  // Attention
  attentionReport: AttentionReport | null
  isAttentionLoading: boolean
  onDismissAttention: () => void
  onClosePanel: () => void
  onAttentionOpenReviewQueue: () => void
  // Recommendations
  recommendationSet: DonnaRecommendationSet | null
  onRecommendationAction: (rec: DonnaRecommendation) => void
  onSetLastCardAction: (action: LastCardActionRecord | null) => void
  // Communication draft
  communicationDraft: CommunicationDraft | null
  showMessageReview: boolean
  onCommunicationDraftDiscard: () => void
  onCommunicationDraftReview: () => void
  onCommunicationDraftRevise: (cmd: string) => void
  onCommunicationDraftUpdate: (updated: CommunicationDraft) => void
  onCommunicationDraftMessageDiscard: () => void
  // Attendance
  attendanceExceptionDraft: AttendanceExceptionDraft | null
  attendanceSessionOptions: AttendanceSessionOption[]
  isLoadingAttendanceSessions: boolean
  attendanceQueueing: boolean
  attendanceQueueResult: DonnaApprovalExecutionResult | null
  onAttendanceDiscard: () => void
  onAttendanceSessionSelect: (option: AttendanceSessionOption) => void
  onAttendanceQueueForReview: () => void
  // Onboarding suggestions
  showOnboardingSuggestions: boolean
  onDismissOnboardingSuggestions: () => void
  onOnboardingSuggestionClick: (taskHint: string) => void
  // Context summary
  contextSummary: DonnaContextSummary | null
  onDismissContextSummary: () => void
}

export function DonnaWorkflowCards({
  convState,
  convShowDraftReview,
  onConvUndo,
  onConvStartOver,
  onConvDiscard,
  onConvReview,
  onCloseConvReview,
  draftRestoredFromSession,
  onClearSavedDraft,
  genericDraft,
  templateDraft,
  commandResponse,
  onDismissCommandResponse,
  dailyBrief,
  isDailyBriefLoading,
  onDismissDailyBrief,
  onDailyBriefOpenReviewQueue,
  onDailyBriefPrepareCoachBriefs,
  attentionReport,
  isAttentionLoading,
  onDismissAttention,
  onClosePanel,
  onAttentionOpenReviewQueue,
  recommendationSet,
  onRecommendationAction,
  onSetLastCardAction,
  communicationDraft,
  showMessageReview,
  onCommunicationDraftDiscard,
  onCommunicationDraftReview,
  onCommunicationDraftRevise,
  onCommunicationDraftUpdate,
  onCommunicationDraftMessageDiscard,
  attendanceExceptionDraft,
  attendanceSessionOptions,
  isLoadingAttendanceSessions,
  attendanceQueueing,
  attendanceQueueResult,
  onAttendanceDiscard,
  onAttendanceSessionSelect,
  onAttendanceQueueForReview,
  showOnboardingSuggestions,
  onDismissOnboardingSuggestions,
  onOnboardingSuggestionClick,
  contextSummary,
  onDismissContextSummary,
}: Props) {
  return (
    <>
      {/* Active conversation draft card */}
      {convState.activeDraft !== null && !genericDraft && !templateDraft && (
        <>
          <DonnaDraftCard
            draft={convState.activeDraft}
            onUndo={onConvUndo}
            onStartOver={onConvStartOver}
            onDiscard={onConvDiscard}
            onReview={onConvReview}
          />
          {convState.activeDraft.history.length > 0 && (
            <DonnaVersionHistoryPanel draft={convState.activeDraft} />
          )}

          {draftRestoredFromSession && (
            <button
              type="button"
              onClick={() => {
                clearDraftSession()
                onClearSavedDraft()
              }}
              className="w-full text-[10px] text-text-muted hover:text-status-red transition-colors text-center py-0.5 underline underline-offset-2"
            >
              Clear saved draft
            </button>
          )}

          {convState.activeDraft.workflowId === 'class_template_creation' && (
            <DonnaClassTemplateDraftPreviewFromDraft draft={convState.activeDraft} />
          )}

          {convShowDraftReview && (() => {
            const summary = summarizeDraft(convState.activeDraft!)
            return (
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: 'var(--surface-raised)', border: '1px solid rgba(200,255,0,0.2)' }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">
                    Draft Review
                  </p>
                  <button
                    type="button"
                    onClick={onCloseConvReview}
                    aria-label="Close draft review"
                    className="p-2 -mr-1 -mt-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {summary.fieldLines.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">
                      What I have
                    </p>
                    {summary.fieldLines.map(({ label, value }) => (
                      <div key={label} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-lime mt-px shrink-0">·</span>
                        <span>
                          <span className="text-text-muted uppercase tracking-wide text-[10px]">{label}: </span>
                          <span className="text-text-primary">{value}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-text-muted italic">No fields collected yet.</p>
                )}

                {summary.missingRequiredIds.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">
                      Still needed
                    </p>
                    {summary.missingRequiredIds.map(fieldId => (
                      <p key={fieldId} className="text-[11px] text-text-muted">· {fieldId.replace(/_/g, ' ')}</p>
                    ))}
                  </div>
                )}

                <div
                  className="px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.12)' }}
                >
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-0.5">
                    What approval does
                  </p>
                  <p className="text-[11px] text-text-secondary leading-snug">
                    {convState.activeDraft!.phase === 'ready_for_review'
                      ? 'This draft is ready. Clicking the approval button will save it safely with a full audit trail.'
                      : 'Answer remaining questions, then click the approval button — nothing saves until you do.'}
                  </p>
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* Command response card */}
      {commandResponse && (
        <div
          className="rounded-xl px-3.5 py-3"
          style={{
            background:
              commandResponse.type === 'honest'
                ? 'rgba(255,149,0,0.06)'
                : 'rgba(139,92,246,0.06)',
            border:
              commandResponse.type === 'honest'
                ? '1px solid rgba(255,149,0,0.2)'
                : '1px solid rgba(139,92,246,0.18)',
          }}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                style={{ color: commandResponse.type === 'honest' ? '#FF9500' : '#8b5cf6' }}
              >
                {commandResponse.label ?? (commandResponse.type === 'honest' ? 'Not available yet' : DONNA_PUBLIC_NAME)}
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {commandResponse.message}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismissCommandResponse}
              aria-label="Dismiss"
              className="shrink-0 p-2 -mr-1 -mt-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Daily brief card */}
      {isDailyBriefLoading && (
        <div className="text-[11px] text-text-muted text-center py-2 animate-pulse">
          Loading daily brief…
        </div>
      )}
      {dailyBrief && !isDailyBriefLoading && (
        <DonnaDailyBriefCard
          brief={dailyBrief}
          onDismiss={onDismissDailyBrief}
          onOpenReviewQueue={() => {
            const r = makeLastCardAction('open_review_queue')
            if (r) onSetLastCardAction(r)
            onDailyBriefOpenReviewQueue()
          }}
          onPrepareCoachBriefs={() => {
            const r = makeLastCardAction('prepare_coach_briefs')
            if (r) onSetLastCardAction(r)
            onDailyBriefPrepareCoachBriefs()
          }}
        />
      )}

      {/* Attention card */}
      {isAttentionLoading && (
        <div className="text-[11px] text-text-muted text-center py-2 animate-pulse">
          Checking what needs attention…
        </div>
      )}
      {attentionReport && !isAttentionLoading && (
        <DonnaAttentionCard
          report={attentionReport}
          onDismiss={onDismissAttention}
          onClose={onClosePanel}
          onOpenReviewQueue={() => {
            const r = makeLastCardAction('open_review_queue')
            if (r) onSetLastCardAction(r)
            onAttentionOpenReviewQueue()
          }}
        />
      )}

      {/* Rule-based recommendations */}
      {recommendationSet && recommendationSet.recommendations.length > 0 && !attentionReport && !dailyBrief && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted px-0.5">
            Recommendations
          </p>
          {recommendationSet.recommendations.map((rec) => (
            <DonnaRecommendationCard
              key={rec.id}
              recommendation={rec}
              onAction={(r) => {
                const action = makeLastCardAction('view_recommendation_evidence')
                if (action) onSetLastCardAction(action)
                onRecommendationAction(r)
              }}
            />
          ))}
        </div>
      )}

      {/* Communication draft card + review panel */}
      {communicationDraft && !showMessageReview && (
        <DonnaCommunicationDraftCard
          draft={communicationDraft}
          onDiscard={() => {
            const r = makeLastCardAction('discard_draft')
            if (r) onSetLastCardAction(r)
            onCommunicationDraftDiscard()
          }}
          onReview={() => {
            const r = makeLastCardAction('open_draft_review')
            if (r) onSetLastCardAction(r)
            onCommunicationDraftReview()
          }}
          onRevise={(cmd) => {
            const actionId = cmd.includes('warmer') ? 'revise_warmer' : 'revise_shorter'
            const r = makeLastCardAction(actionId)
            if (r) onSetLastCardAction(r)
            onCommunicationDraftRevise(cmd)
          }}
        />
      )}
      {communicationDraft && showMessageReview && (
        <DonnaMessageReviewPanel
          draft={communicationDraft}
          onUpdate={onCommunicationDraftUpdate}
          onDiscard={onCommunicationDraftMessageDiscard}
        />
      )}

      {/* Attendance exception draft card */}
      <DonnaAttendanceLayer
        draft={attendanceExceptionDraft}
        sessionOptions={attendanceSessionOptions}
        isLoadingSessions={isLoadingAttendanceSessions}
        isQueueing={attendanceQueueing}
        queueResult={attendanceQueueResult}
        onDiscard={onAttendanceDiscard}
        onSelectSession={onAttendanceSessionSelect}
        onQueueForReview={onAttendanceQueueForReview}
      />

      {/* Onboarding suggested routes */}
      {showOnboardingSuggestions && !genericDraft && !templateDraft && (
        <div
          className="rounded-xl px-3.5 py-3 space-y-2"
          style={{
            background: 'rgba(200,255,0,0.04)',
            border: '1px solid rgba(200,255,0,0.2)',
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">
              Get started
            </p>
            <button
              type="button"
              onClick={onDismissOnboardingSuggestions}
              aria-label="Dismiss"
              className="p-2 -mr-1 -mt-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            {DONNA_ONBOARDING_STEPS[1].suggestedRoutes?.map((route) => (
              <button
                key={route.taskHint}
                type="button"
                onClick={() => onOnboardingSuggestionClick(route.taskHint)}
                className="w-full text-left text-[12px] text-text-secondary hover:text-text-primary
                  px-3 py-2 rounded-lg hover:bg-surface-raised transition-all leading-snug border border-border"
                style={{ background: 'var(--bg-surface)' }}
              >
                {route.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-text-muted leading-snug pt-1">
            Voice can fill drafts. Final saves always require the on-screen button.
          </p>
        </div>
      )}

      {/* Context summary result card — read-only live data, no writes */}
      {contextSummary && (
        <div
          className="rounded-xl px-3.5 py-3 space-y-2.5"
          style={{
            background: 'rgba(200,255,0,0.04)',
            border: '1px solid rgba(200,255,0,0.18)',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5 text-lime">
                {contextSummary.title}
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {contextSummary.summary}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismissContextSummary}
              aria-label="Dismiss summary"
              className="shrink-0 p-2 -mr-1 -mt-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {contextSummary.keyFacts.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">
                Key facts
              </p>
              <ul className="space-y-0.5">
                {contextSummary.keyFacts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary leading-snug">
                    <span className="shrink-0 mt-px text-lime">·</span>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contextSummary.suggestedNextSteps.length > 0 && (
            <div
              className="pt-2"
              style={{ borderTop: '1px solid rgba(200,255,0,0.1)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">
                Suggested next steps
              </p>
              <ul className="space-y-0.5">
                {contextSummary.suggestedNextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary leading-snug">
                    <span className="shrink-0 mt-px text-lime">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contextSummary.missingData.length > 0 && (
            <div
              className="pt-2"
              style={{ borderTop: '1px solid rgba(200,255,0,0.1)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">
                Missing data
              </p>
              <ul className="space-y-0.5">
                {contextSummary.missingData.map((m, i) => (
                  <li key={i} className="text-[11px] text-text-muted leading-snug">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p
            className="text-[9px] text-text-muted pt-1"
            style={{ borderTop: '1px solid rgba(200,255,0,0.08)' }}
          >
            Read-only · fetched {new Date(contextSummary.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </>
  )
}
