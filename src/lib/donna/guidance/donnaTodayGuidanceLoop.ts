// Sprint 1861–1880 — DONNA Today Guidance Loop V1
//
// When the director asks "What do I need to do today?" (or similar), DONNA should
// not just answer — she should guide the director into action.
//
// This engine:
//   1. Builds ranked today priorities from the academy attention report
//   2. Identifies the single highest-impact action
//   3. Maps the top item to a guided completion workflow (if one exists)
//   4. Generates a follow-up question ("Would you like me to walk you through it?")
//   5. Returns a DonnaTodayGuidanceOutput ready for DONNA to present
//
// The output is the source of truth for what DONNA says when this question is asked.
// The donnaAutonomousGuidanceEngine consumes this output for follow-up loops.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same context → same output.
//   - Honest empty state: returns clear all-clear when no signals exist.
//   - No mutations. Director approval always required for action.

import { buildAcademyAttentionReport } from '@/lib/donna/proactive/academyAttentionEngine'
import type { AcademyAttentionItem } from '@/lib/donna/proactive/academyAttentionEngine'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { GuidedWorkflowId } from '@/lib/donna/guidedCompletion/guidedCompletionRegistry'

// ── Output types ──────────────────────────────────────────────────────────────

export interface DonnaTodayPriority {
  /** 1-based display index */
  rank: number
  /** Short, human-readable label */
  label: string
  /** Why this item matters right now */
  reason: string
  /** Deep-link to relevant page */
  destination: string | null
  /** Whether director approval is required */
  requiresApproval: boolean
  /** The underlying attention item for further detail */
  attentionItem: AcademyAttentionItem
}

export interface DonnaTodayGuidanceOutput {
  /** DONNA's spoken/text priority summary (full sentence format) */
  summary: string
  /** Top 3 ranked items — what DONNA is recommending today */
  priorities: DonnaTodayPriority[]
  /** Single highest-impact action — DONNA's #1 recommendation */
  highestImpactItem: DonnaTodayPriority | null
  /** One-line description of what the director should do first */
  recommendedFirstAction: string
  /** DONNA's follow-up question after presenting the priorities */
  followUpQuestion: string
  /** Guided workflow DONNA can start if director says yes */
  workflowCandidate: GuidedWorkflowId | null
  /** Route for the top action */
  destination: string | null
  /** True when academy has no urgent signals */
  isAllClear: boolean
  /** Source label for UI trust/transparency */
  sourceNote: string
}

// ── Attention category → workflow mapping ─────────────────────────────────────
// Maps the top attention item's category to the best guided workflow.
// Not every category has a workflow — some items only have a destination.

import type { DonnaAttentionCategory } from '@/lib/donna/donnaAttentionRankingEngine'

const CATEGORY_TO_WORKFLOW: Partial<Record<DonnaAttentionCategory, GuidedWorkflowId>> = {
  curriculum:         'curriculum_builder_completion',
  onboarding:         'academy_setup_completion',
  player_development: 'assessment_completion',
  parent_records:     'parent_update_completion',
}

// ── Intent detection ──────────────────────────────────────────────────────────
// Detects "what do I need to do today?" and variations.
// Used by DONNA's COO router to route to this engine.

export function detectTodayGuidanceQuestion(text: string): boolean {
  const t = text.toLowerCase().trim()
  return (
    /what (do i|should i) (need to |)do today/.test(t) ||
    /what('?s| is) (on my |)(my )?(list|agenda|plate) (today|for today)/.test(t) ||
    /what('?s| is) (most |the most |)(important|urgent|critical) today/.test(t) ||
    /where (should i |do i )start today/.test(t) ||
    /what (are |)(my |the )top (3|three|priorities) today/.test(t) ||
    /give me (my |)(today'?s? |)(priorities|tasks|actions)/.test(t) ||
    /walk me through (my |)(today'?s? |)(priorities|tasks)/.test(t) ||
    /what needs (my |)(attention|action) today/.test(t)
  )
}

// ── Main engine ───────────────────────────────────────────────────────────────

/**
 * Build DONNA's today guidance loop output.
 *
 * Call this when the director asks what they should do today.
 * DONNA responds with ranked priorities and a follow-up offer to guide.
 */
export function buildTodayGuidanceLoop(ctx: DirectorDonnaContext): DonnaTodayGuidanceOutput {
  const report = buildAcademyAttentionReport(ctx)
  const prefix = ctx.isLive ? '' : '[Demo] '

  // ── All-clear state ────────────────────────────────────────────────────────
  if (report.isEmpty) {
    const allClearSummary = buildAllClearSummary(ctx, prefix)
    return {
      summary: allClearSummary,
      priorities: [],
      highestImpactItem: null,
      recommendedFirstAction: 'No urgent actions needed — academy is operating normally.',
      followUpQuestion: 'Would you like me to review curriculum coverage or check player progress?',
      workflowCandidate: null,
      destination: '/director',
      isAllClear: true,
      sourceNote: report.sourceNote,
    }
  }

  // ── Build top 3 priorities ─────────────────────────────────────────────────
  const topItems = report.allItems.slice(0, 3)
  const priorities: DonnaTodayPriority[] = topItems.map((item, i) => ({
    rank: i + 1,
    label: item.label,
    reason: item.whyItMatters,
    destination: item.href ?? null,
    requiresApproval: item.requiresApproval,
    attentionItem: item,
  }))

  const top = priorities[0] ?? null

  // ── Workflow candidate ─────────────────────────────────────────────────────
  const workflowCandidate = top
    ? (CATEGORY_TO_WORKFLOW[top.attentionItem.category] ?? null)
    : null

  // ── Summary text (what DONNA says) ────────────────────────────────────────
  const summary = buildTodaySummary(priorities, prefix)

  // ── Follow-up question ────────────────────────────────────────────────────
  const followUpQuestion = buildFollowUpQuestion(top, workflowCandidate)

  // ── Recommended first action ──────────────────────────────────────────────
  const recommendedFirstAction = top
    ? top.attentionItem.bestNextAction
    : 'Review your dashboard for the latest signals.'

  return {
    summary,
    priorities,
    highestImpactItem: top,
    recommendedFirstAction,
    followUpQuestion,
    workflowCandidate,
    destination: top?.destination ?? '/director',
    isAllClear: false,
    sourceNote: report.sourceNote,
  }
}

// ── Summary builder ───────────────────────────────────────────────────────────

function buildTodaySummary(
  priorities: DonnaTodayPriority[],
  prefix: string,
): string {
  if (priorities.length === 0) {
    return `${prefix}No urgent actions right now. Academy is operating normally.`
  }

  const lines: string[] = [
    `${prefix}Today, I recommend starting with these ${priorities.length > 1 ? priorities.length.toString() : 'top'} item${priorities.length !== 1 ? 's' : ''}:`,
    '',
  ]

  priorities.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.label}`)
  })

  if (priorities[0]) {
    lines.push('')
    lines.push(`The highest-impact item is: **${priorities[0].label}**`)
    lines.push(`Reason: ${priorities[0].reason}`)
  }

  return lines.join('\n')
}

function buildFollowUpQuestion(
  top: DonnaTodayPriority | null,
  workflowCandidate: GuidedWorkflowId | null,
): string {
  if (!top) {
    return 'Would you like me to review curriculum coverage or check player progress instead?'
  }

  if (workflowCandidate) {
    return `Would you like me to walk you through it?`
  }

  if (top.destination) {
    return `Would you like me to take you there now?`
  }

  return `Would you like more detail on this?`
}

function buildAllClearSummary(ctx: DirectorDonnaContext, prefix: string): string {
  const lines = [`${prefix}No urgent signals today — your academy is operating normally.`]

  if (ctx.todaySessions > 0) {
    lines.push(`You have ${ctx.todaySessions} session${ctx.todaySessions !== 1 ? 's' : ''} today.`)
  }

  const gapCount = ctx.curriculumGaps?.length ?? 0
  if (gapCount > 0) {
    lines.push(`There ${gapCount === 1 ? 'is' : 'are'} ${gapCount} curriculum gap${gapCount !== 1 ? 's' : ''} worth reviewing when you have time.`)
  }

  return lines.join(' ')
}

// ── Spoken version (markdown stripped) ───────────────────────────────────────

/** Strip markdown bold/italic for TTS — spoken version of the summary. */
export function toSpokenSummary(summary: string): string {
  return summary
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[Demo\] /g, '')
    .trim()
}
