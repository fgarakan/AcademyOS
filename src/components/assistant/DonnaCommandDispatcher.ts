// Sprint 384 — DONNA Modularization
// Documents the command dispatch contract. The runtime implementations
// (dispatchCooCommand, detectAndHandleCommand, handleCommandSubmit) remain
// in DonnaAssistantButton.tsx because they close over 30+ state setters
// (setConvState, setAttendanceExceptionDraft, setCommunicationDraft, setDailyBrief,
// setAttentionReport, setReviewQueueData, setTemplateDraft, setCommandResponse,
// setActiveMode, setLastCardAction, etc.) and cannot be cleanly extracted
// without a full context/reducer refactor.
//
// Future path: If DonnaAssistantButton migrates to useReducer, the dispatch
// logic can move here as a pure reducer function that returns state updates
// and side-effect descriptors.
//
// Future agent owner: Command routing / COO workflow team.

import type { DirectorWorkflowCommandId } from './donnaDirectorWorkflowCommands'

/**
 * Describes the outcome of a single command dispatch.
 * Returned by dispatchCooCommand in DonnaAssistantButton.
 */
export interface DonnaDispatchResult {
  handled: boolean
  commandId: DirectorWorkflowCommandId | null
  sideEffects: Array<
    | 'attendance_exception_started'
    | 'coach_brief_started'
    | 'recommendation_summary_shown'
    | 'parent_update_started'
    | 'daily_brief_fetched'
    | 'attention_report_fetched'
    | 'review_queue_opened'
    | 'context_summary_fetched'
    | 'unrecognized'
  >
}
