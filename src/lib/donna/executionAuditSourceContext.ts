// Sprint 589 — Execution Audit Trail Source Context V1
// Enriches execution audit entries with origin context.
// Pure TypeScript — no DB writes, no execution.

import type { ExecutionSourceType } from '@/components/donna/ExecutionAuditTrailPanel'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditSourceContextType =
  | 'voice_transcript'
  | 'wrap_up_question'
  | 'donna_command'
  | 'director_decision'
  | 'system_rule'

export interface AuditSourceContext {
  contextType: AuditSourceContextType
  label: string
  excerpt: string | null
  questionId: string | null  // WrapUpQuestionId if from wrap-up
  commandText: string | null
  sessionLabel: string | null
}

export interface EnrichedExecutionEntry {
  entryId: string
  sourceContext: AuditSourceContext | null
}

// ── Builders ──────────────────────────────────────────────────────────────────

export function buildVoiceTranscriptContext(
  transcript: string,
  sessionLabel?: string,
): AuditSourceContext {
  const excerpt = transcript.length > 120
    ? transcript.slice(0, 120).trimEnd() + '…'
    : transcript

  return {
    contextType: 'voice_transcript',
    label: 'Voice transcript',
    excerpt,
    questionId: null,
    commandText: null,
    sessionLabel: sessionLabel ?? null,
  }
}

export function buildWrapUpQuestionContext(
  questionId: string,
  questionLabel: string,
  answerExcerpt: string | null,
  sessionLabel?: string,
): AuditSourceContext {
  return {
    contextType: 'wrap_up_question',
    label: `Wrap-up: ${questionLabel}`,
    excerpt: answerExcerpt,
    questionId,
    commandText: null,
    sessionLabel: sessionLabel ?? null,
  }
}

export function buildDonnaCommandContext(
  commandText: string,
  sessionLabel?: string,
): AuditSourceContext {
  const excerpt = commandText.length > 120
    ? commandText.slice(0, 120).trimEnd() + '…'
    : commandText

  return {
    contextType: 'donna_command',
    label: 'DONNA command',
    excerpt,
    questionId: null,
    commandText,
    sessionLabel: sessionLabel ?? null,
  }
}

export function buildDirectorDecisionContext(
  decisionNote: string,
  sessionLabel?: string,
): AuditSourceContext {
  return {
    contextType: 'director_decision',
    label: 'Director decision',
    excerpt: decisionNote,
    questionId: null,
    commandText: null,
    sessionLabel: sessionLabel ?? null,
  }
}

export function buildSystemRuleContext(ruleCode: string): AuditSourceContext {
  return {
    contextType: 'system_rule',
    label: `System rule: ${ruleCode}`,
    excerpt: null,
    questionId: null,
    commandText: null,
    sessionLabel: null,
  }
}

// ── Source type → default context type ───────────────────────────────────────

export function defaultContextTypeForSource(
  sourceType: ExecutionSourceType,
): AuditSourceContextType {
  switch (sourceType) {
    case 'donna_voice':    return 'voice_transcript'
    case 'donna_text':     return 'donna_command'
    case 'coach_wrap_up':  return 'wrap_up_question'
    case 'director_manual': return 'director_decision'
    case 'system':         return 'system_rule'
  }
}

// ── Label helper ──────────────────────────────────────────────────────────────

export const CONTEXT_TYPE_LABELS: Record<AuditSourceContextType, string> = {
  voice_transcript: 'Voice',
  wrap_up_question: 'Wrap-up',
  donna_command:    'DONNA',
  director_decision: 'Director',
  system_rule:      'System',
}
