// Sprint 1761 — DONNA Learning Foundations V1
// Learning command router — classifies DONNA queries about academy patterns
// and routes them to the appropriate structured answer.
// Pure TypeScript. No DB calls. No mutations.
// Every answer includes: Observation, Confidence, Evidence, Limitations, Recommended Next Action.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import { buildAcademyLearningReport, formatLearningReportAsMessage } from './academyLearningEngine'
import { buildAcademyPlaybook, formatPlaybookForDonna } from './academyPlaybook'

// ─── Learning intent types ─────────────────────────────────────────────────────

export type LearningIntent =
  | 'academy_patterns'
  | 'decision_history'
  | 'recommendation_acceptance'
  | 'academy_playbook'
  | 'advancement_signals'
  | 'curriculum_patterns'
  | 'learning_status'
  | 'unknown_learning'

// ─── Intent detection ─────────────────────────────────────────────────────────

const LEARNING_INTENT_SIGNALS: Array<{ intent: LearningIntent; signals: string[] }> = [
  {
    intent: 'academy_playbook',
    signals: ['playbook', 'academy playbook', 'our playbook'],
  },
  {
    intent: 'decision_history',
    signals: [
      'decision history', 'recent decisions', 'what was approved', 'what was rejected',
      'approval history', 'rejection history', 'recent approvals', 'recent rejections',
    ],
  },
  {
    intent: 'recommendation_acceptance',
    signals: [
      'acceptance rate', 'recommendation history', 'how often do i accept',
      'how often you are right', 'how well are you doing', 'dismissed recommendations',
    ],
  },
  {
    intent: 'advancement_signals',
    signals: [
      'advancement patterns', 'advancing players', 'who is advancing',
      'player advancement patterns', 'level advancement patterns',
    ],
  },
  {
    intent: 'curriculum_patterns',
    signals: [
      'curriculum patterns', 'curriculum coverage patterns',
      'recurring curriculum', 'what curriculum issues repeat',
    ],
  },
  {
    intent: 'learning_status',
    signals: [
      'what have you learned', 'what do you know about us', 'learning summary',
      'academy intelligence', 'what do you know so far',
    ],
  },
  {
    intent: 'academy_patterns',
    signals: [
      'what patterns', 'what repeats', 'recurring issues', 'what keeps happening',
      'pattern observed', 'early signal', 'what signals do you see',
    ],
  },
]

export function classifyLearningIntent(input: string): LearningIntent {
  const normalized = input.toLowerCase().trim()
  for (const { intent, signals } of LEARNING_INTENT_SIGNALS) {
    if (signals.some(s => normalized.includes(s))) return intent
  }
  return 'unknown_learning'
}

export function isLearningPhrase(input: string): boolean {
  return classifyLearningIntent(input) !== 'unknown_learning'
}

// ─── Answer result ─────────────────────────────────────────────────────────────

export interface LearningAnswerResult {
  intent:      LearningIntent
  message:     string
  confidence:  'medium' | 'low' | 'insufficient'
  destination: string | null
}

// ─── Answer builder ────────────────────────────────────────────────────────────

export function buildLearningAnswer(
  input: string,
  ctx: DirectorDonnaContext,
): LearningAnswerResult {
  const intent = classifyLearningIntent(input)
  const report  = buildAcademyLearningReport(ctx)
  const playbook = buildAcademyPlaybook(ctx, report)

  switch (intent) {

    case 'academy_playbook':
      return {
        intent,
        message:     formatPlaybookForDonna(playbook),
        confidence:  playbook.playbookDepth === 'medium' ? 'medium'
                   : playbook.playbookDepth === 'low'    ? 'low'
                   : 'insufficient',
        destination: '/director',
      }

    case 'decision_history': {
      const decisions = ctx.recentDecisions
      if (decisions.length === 0) {
        return {
          intent,
          message: [
            '**Observed Pattern:**',
            'No recent decision history is available yet.',
            '',
            '**Confidence:** Insufficient',
            '',
            '**Evidence:**',
            '• No approved, rejected, or executed proposed_actions found in the loaded window.',
            '',
            '**Limitations:**',
            '• Decision history builds as you approve or reject DONNA recommendations.',
            '• V1 does not infer outcomes — decisions are tracked by status only.',
            '',
            '**Recommended Next Action:**',
            'Review pending items in the review queue to begin building decision history.',
          ].join('\n'),
          confidence:  'insufficient',
          destination: '/director/review',
        }
      }

      const approved = decisions.filter(d => d.status === 'approved' || d.status === 'executed').length
      const rejected = decisions.filter(d => d.status === 'rejected').length
      const modified = decisions.filter(d => d.status === 'modified').length

      return {
        intent,
        message: [
          '**Observed Pattern:**',
          `${decisions.length} recent decisions loaded. ${approved} approved/executed, ${rejected} rejected, ${modified} modified.`,
          '',
          `**Confidence:** ${decisions.length >= 10 ? 'Medium' : 'Low'}`,
          '',
          '**Evidence:**',
          `• ${decisions.length} decisions in the current window (last ${decisions.length} non-pending proposed_actions)`,
          `• ${approved} approved or executed`,
          `• ${rejected} rejected`,
          `• ${modified} modified before approval`,
          '',
          '**Limitations:**',
          '• V1 does not track outcomes — approved decisions are not confirmed as beneficial.',
          `• Only the last ${decisions.length} decisions are loaded. Long-term patterns are not yet detectable.`,
          '• Approval and rejection counts do not imply quality judgements about the recommendations.',
          '',
          '**Recommended Next Action:**',
          'Continue reviewing pending items. More history improves the learning signal.',
        ].join('\n'),
        confidence:  decisions.length >= 10 ? 'medium' : 'low',
        destination: '/director/review',
      }
    }

    case 'recommendation_acceptance': {
      const decisions = ctx.recentDecisions
      const approved = decisions.filter(d => d.status === 'approved' || d.status === 'executed').length
      const rejected = decisions.filter(d => d.status === 'rejected').length
      const modified = decisions.filter(d => d.status === 'modified').length
      const total    = decisions.length

      if (total < 3) {
        return {
          intent,
          message: [
            '**Observed Pattern:**',
            'Not enough decision history yet to compute an acceptance rate.',
            '',
            '**Confidence:** Insufficient',
            '',
            '**Evidence:**',
            `• Only ${total} decision${total !== 1 ? 's' : ''} in the loaded window — minimum 3 needed.`,
            '',
            '**Limitations:**',
            '• V1 acceptance tracking requires a history of review queue activity.',
            '• Acceptance rate is a frequency count, not a quality measure.',
            '',
            '**Recommended Next Action:**',
            'Review and decide on pending items in the review queue.',
          ].join('\n'),
          confidence:  'insufficient',
          destination: '/director/review',
        }
      }

      const rate = Math.round((approved / total) * 100)
      return {
        intent,
        message: [
          '**Observed Pattern:**',
          `${rate}% of recent recommendations were approved or executed (${approved} of ${total}).`,
          '',
          `**Confidence:** ${total >= 10 ? 'Medium' : 'Low'}`,
          '',
          '**Evidence:**',
          `• ${approved} approved/executed`,
          `• ${rejected} rejected`,
          `• ${modified} modified before approval`,
          `• ${total} total decisions in the loaded window`,
          '',
          '**Limitations:**',
          '• This is a frequency count, not a quality measure.',
          '• V1 cannot determine whether approved recommendations led to positive outcomes.',
          '• Rejection does not confirm a recommendation was wrong.',
          '',
          '**Recommended Next Action:**',
          'Continue building decision history. Outcome tracking will be available in a future version.',
        ].join('\n'),
        confidence:  total >= 10 ? 'medium' : 'low',
        destination: '/director/review',
      }
    }

    case 'advancement_signals': {
      const eligible = ctx.advancementEligibleCount
      return {
        intent,
        message: [
          '**Observed Pattern:**',
          eligible >= 2
            ? `${eligible} players appear advancement-eligible in current curriculum state data. This is an early signal — not an advancement recommendation.`
            : 'No clear advancement cluster detected in current data.',
          '',
          `**Confidence:** ${eligible >= 3 ? 'Low' : 'Insufficient'}`,
          '',
          '**Evidence:**',
          `• ${eligible} players flagged as advancement-eligible`,
          `• ${ctx.playerCurriculumStateCount} total curriculum states loaded`,
          '',
          '**Limitations:**',
          '• Advancement eligibility does not confirm readiness — formal assessment is required.',
          '• No causal link to any curriculum change, coach action, or assessment is inferred.',
          '• Do not use this signal to bypass the finalize_player_placement() pathway.',
          '• V1 does not know whether these players have been eligible for days or months.',
          '',
          '**Recommended Next Action:**',
          eligible >= 2
            ? 'Review advancement-eligible players in the player directory and initiate formal assessment if appropriate.'
            : 'Continue monitoring curriculum states. Advancement signals will appear as players progress.',
        ].join('\n'),
        confidence:  eligible >= 3 ? 'low' : 'insufficient',
        destination: '/director/players',
      }
    }

    case 'curriculum_patterns': {
      const gaps = ctx.curriculumGaps
      return {
        intent,
        message: [
          '**Observed Pattern:**',
          gaps.length >= 2
            ? `${gaps.length} curriculum coverage gaps detected in current data. Whether these are recurring or new cannot be determined in V1.`
            : 'No significant curriculum gap cluster detected at this time.',
          '',
          `**Confidence:** ${gaps.length >= 3 ? 'Low' : 'Insufficient'}`,
          '',
          '**Evidence:**',
          ...(gaps.length > 0
            ? gaps.slice(0, 3).map(g => `• ${g}`)
            : ['• No significant gaps currently flagged']
          ),
          '',
          '**Limitations:**',
          '• V1 does not track gap history — cannot confirm recurrence vs. newly detected.',
          '• No causal link between curriculum gaps and player outcomes is inferred.',
          '• Gap presence does not indicate curriculum failure.',
          '',
          '**Recommended Next Action:**',
          gaps.length >= 2
            ? 'Review curriculum coverage in the curriculum explorer. Consider addressing the most critical gaps first.'
            : 'Continue monitoring curriculum coverage as more data is collected.',
        ].join('\n'),
        confidence:  gaps.length >= 3 ? 'low' : 'insufficient',
        destination: '/director/curriculum',
      }
    }

    case 'learning_status':
    case 'academy_patterns':
    default:
      return {
        intent,
        message:     formatLearningReportAsMessage(report),
        confidence:  report.dataDepth === 'medium' ? 'medium'
                   : report.dataDepth === 'low'    ? 'low'
                   : 'insufficient',
        destination: '/director',
      }
  }
}
