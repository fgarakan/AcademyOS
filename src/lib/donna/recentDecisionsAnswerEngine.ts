// Sprint 742F — DONNA Recent Decisions Answer Engine V1
// Pure logic. No DB calls. No mutations. Operates on DirectorDonnaContext.
//
// Answers questions about recent director decisions:
//   - "What happened last?" / "What was approved?"
//   - "Recent decisions" / "Show recent activity"
//   - "What was rejected?" / "Can we undo X?"
//
// Rollback explanation: DONNA honestly surfaces that no automatic rollback exists.
// A director can manually reverse a decision via the Review Queue.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import type { RecentDecisionSummary, RecentDecisionStatus } from '@/lib/donna/recentDecisionsLoader'

// ── Pattern matcher ────────────────────────────────────────────────────────────

export const RECENT_DECISIONS_PATTERNS =
  /\b(recent (decisions?|actions?|approvals?|activity|history)|what (happened|was done|was approved|was rejected|was executed|changed)(\s+last|\s+recently)?|last (approved|rejected|executed|decision|action)|show (recent|latest) (decisions?|actions?|approvals?|history)|decision (history|log|trail)|audit (trail|log|history)|what did (i|the director|you|we) (approve|reject|do|decide)|undo|roll.?back|reverse (a|the|that|an|this) (decision|action|approval)|can we undo|can (i|the director) undo|how to undo|revert (a|the|that|an|this) (decision|action)|what actions? (were|have been) (taken|approved|rejected|executed)|executed (this week|today|recently)|approved (this week|today|recently)|rejected (this week|today|recently))\b/i

// ── Helpers ───────────────────────────────────────────────────────────────────

function friendlyStatus(s: RecentDecisionStatus): string {
  switch (s) {
    case 'approved':   return '✅ Approved'
    case 'executed':   return '✅ Executed'
    case 'rejected':   return '❌ Rejected'
    case 'modified':   return '✏️ Modified'
    case 'expired':    return '⏰ Expired'
    case 'failed':     return '🔴 Failed'
    default:           return s
  }
}

function friendlyModule(module: string): string {
  // Convert underscore_keys to readable labels
  return module
    .replace(/_v\d+$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function friendlyDate(isoStr: string | null): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return isoStr.slice(0, 10)
  }
}

function isRollbackQuestion(input: string): boolean {
  return /\b(undo|roll.?back|reverse|revert|can (i|we|the director) undo)\b/i.test(input)
}

function isRejectedFocus(input: string): boolean {
  return /\b(rejected?|what was rejected)\b/i.test(input)
}

// ── Answer builder ─────────────────────────────────────────────────────────────

export function buildRecentDecisionsAnswer(
  ctx: DirectorDonnaContext,
  userInput?: string,
): DonnaSafeReadAnswer {
  const { recentDecisions, recentDecisionContextAvailable } = ctx

  // ── Rollback / undo question ─────────────────────────────────────────────────
  if (userInput && isRollbackQuestion(userInput)) {
    const lastExecuted = recentDecisions.find(d => d.status === 'executed')
    const subjectLine = lastExecuted
      ? `The last executed action was: **${lastExecuted.actionLabel}** (${friendlyDate(lastExecuted.approvedAt ?? lastExecuted.createdAt)}).`
      : 'No recently executed action was found in the loaded history.'

    return {
      actionId: 'recent_decisions_rollback_explain',
      text: [
        '🔄 **Rollback policy:**',
        subjectLine,
        '',
        'AcademyOS does not have automatic rollback. Reversing a decision is a director action:',
        '1. Go to the Review Center → find the executed action in the history',
        '2. Submit a new proposed action to reverse the effect (e.g., move the player back, revert the template)',
        '3. Approve and execute the reversal',
        '',
        'All reversals are logged in the audit trail for accountability.',
      ].join('\n'),
      confidence: recentDecisionContextAvailable ? 'high' : 'partial',
      sourceNote: 'Policy explanation + live decision history',
      followUp: 'Take me to Review Center',
      href: '/director/review',
      isAnswerable: true,
    }
  }

  // ── Context unavailable ──────────────────────────────────────────────────────
  if (!recentDecisionContextAvailable || recentDecisions.length === 0) {
    return {
      actionId: 'recent_decisions_unavailable',
      text: [
        '📋 **Recent decisions:**',
        '',
        'No decision history is available yet. This typically means no proposed actions have been approved, executed, or rejected for this academy.',
        '',
        'When directors approve or reject proposals, those decisions appear here.',
      ].join('\n'),
      confidence: 'partial',
      sourceNote: 'Decision history not yet available',
      followUp: 'Take me to Review Center',
      href: '/director/review',
      isAnswerable: true,
    }
  }

  // ── Rejected-focus question ───────────────────────────────────────────────────
  const showRejectedOnly = userInput ? isRejectedFocus(userInput) : false
  const decisionsToShow = showRejectedOnly
    ? recentDecisions.filter(d => d.status === 'rejected').slice(0, 5)
    : recentDecisions.slice(0, 7)

  const lines: string[] = []

  if (showRejectedOnly) {
    if (decisionsToShow.length === 0) {
      lines.push('No rejections found in recent history.')
    } else {
      lines.push(`**Rejected actions (${decisionsToShow.length}):**`)
      for (const d of decisionsToShow) {
        const dateStr = friendlyDate(d.rejectedAt ?? d.createdAt)
        lines.push(`• ${d.actionLabel} — ${friendlyModule(d.targetModule)} — ${dateStr}`)
        if (d.reviewerNotes) {
          lines.push(`  _Reason: ${d.reviewerNotes}_`)
        }
      }
    }
  } else {
    const approved = recentDecisions.filter(d => d.status === 'approved' || d.status === 'executed').length
    const rejected = recentDecisions.filter(d => d.status === 'rejected').length
    const other = recentDecisions.filter(d => !['approved', 'executed', 'rejected'].includes(d.status)).length

    lines.push(`**Last ${decisionsToShow.length} decisions** (${approved} approved/executed · ${rejected} rejected${other > 0 ? ` · ${other} other` : ''}):`)
    lines.push('')

    for (const d of decisionsToShow) {
      const dateStr = friendlyDate(d.approvedAt ?? d.rejectedAt ?? d.createdAt)
      lines.push(`${friendlyStatus(d.status)} **${d.actionLabel}**`)
      lines.push(`  ${friendlyModule(d.targetModule)} · ${dateStr}`)
      if (d.reviewerNotes && d.status === 'rejected') {
        lines.push(`  _Reason: ${d.reviewerNotes}_`)
      }
    }
  }

  const mostRecent = recentDecisions[0]
  const followUpText =
    mostRecent?.status === 'rejected'
      ? 'Review the rejection reasons'
      : 'Go to Review Center'

  return {
    actionId: 'recent_decisions_history',
    text: [
      '📋 **Recent decisions:**',
      '',
      ...lines,
      '',
      'All decisions are logged. To reverse an action, submit a new proposal through the Review Center.',
    ].join('\n'),
    confidence: 'high',
    sourceNote: 'Live proposed_actions history (last 15 non-pending)',
    followUp: followUpText,
    href: '/director/review',
    isAnswerable: true,
  }
}
