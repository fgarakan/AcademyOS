// Sprint 1748 — DONNA Academy Intelligence Answer Dispatcher V1
// Detects intelligence questions and routes to the appropriate module.
// Returns DonnaSafeReadAnswer for direct use in DonnaVoiceReadyShell.
//
// Supported intents:
//   academy_learning    → full intelligence report
//   progression         → who is ready / stalled / level velocity
//   who_is_ready        → specifically advancement-eligible players
//   who_is_stalled      → specifically stalled players
//   curriculum_bottleneck → level bottleneck analysis
//   coach_impact        → wrap-up coverage + assessment cadence
//   retention           → retention risk signals
//   what_changed        → recent activity signals
//   health_brief        → strategic academy health brief
//   improve_next        → top recommendation from health brief

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import { buildProgressionAnswer, buildWhoIsReadyAnswer, buildWhoIsStalledAnswer } from '@/lib/donna/intelligence/progressionIntelligence'
import { buildCurriculumBottleneckAnswer } from '@/lib/donna/intelligence/curriculumBottleneckIntelligence'
import { buildCoachImpactAnswer } from '@/lib/donna/intelligence/coachImpactIntelligence'
import { buildRetentionAnswer } from '@/lib/donna/intelligence/retentionIntelligence'
import { buildWhatChangedAnswer } from '@/lib/donna/intelligence/whatChangedIntelligence'
import { buildAcademyHealthBriefAnswer } from '@/lib/donna/intelligence/academyHealthBrief'
import { buildAcademyIntelligenceReport, formatIntelligenceReportAsMessage } from '@/lib/donna/intelligence/academyIntelligenceEngine'

// ─── Intent type ──────────────────────────────────────────────────────────────

export type IntelligenceIntent =
  | 'academy_learning'
  | 'progression'
  | 'who_is_ready'
  | 'who_is_stalled'
  | 'curriculum_bottleneck'
  | 'coach_impact'
  | 'retention'
  | 'what_changed'
  | 'health_brief'
  | 'improve_next'

// ─── Pattern map ──────────────────────────────────────────────────────────────

const PATTERNS: Array<{ intent: IntelligenceIntent; pattern: RegExp }> = [
  // Academy learning / intelligence overview
  {
    intent:  'academy_learning',
    pattern: /\b(what (is|are) (the academy|we) (learning|seeing|finding)|academy intelligence|what (patterns|signals) (do you see|are you seeing|exist)|academy (insights?|analysis|data patterns?)|what (does|do) the data (say|show|tell))\b/i,
  },
  // Who is ready to advance
  {
    intent:  'who_is_ready',
    pattern: /\b(who (is|are) (ready|eligible) (to (advance|move up|promote|level up)|for advancement)|which players? (are ready|can advance|should (advance|move up|be promoted))|advancement.{0,20}ready|ready (to advance|for promotion)|who should (advance|move up|be promoted))\b/i,
  },
  // Who is stalled
  {
    intent:  'who_is_stalled',
    pattern: /\b(who (is|are) (stalled?|stuck|not progressing|not advancing)|which players? (are (stalled?|stuck)|haven'?t (advanced|progressed|moved up))|stalled? players?|players? (not progressing|not advancing|stuck))\b/i,
  },
  // General progression (ready + stalled + close)
  {
    intent:  'progression',
    pattern: /\b(player progression|progression (overview|report|status|picture|summary)|which players? (are close|are near|are progressing|are stalling)|level (velocity|movement|progress)|how (are|is) players? progressing|progression (signals?|data|analysis))\b/i,
  },
  // Curriculum bottleneck
  {
    intent:  'curriculum_bottleneck',
    pattern: /\b(which (level|curriculum) (is|are) (a |the )?(bottleneck|blocking|slowing)|curriculum (bottleneck|gaps?|issues?|problems?|blockers?)|which (level|curriculum) (needs? improvement|should (we |i )?improve|has (the )?most (gaps?|issues?|problems?))|what'?s? (blocking|slowing) (players?|advancement)|level (bottleneck|blocking|slowing))\b/i,
  },
  // Coach impact
  {
    intent:  'coach_impact',
    pattern: /\b(which (coaches?|coach) (is|are) (progressing players? fastest|helping players?|supporting players?|performing)|coach (impact|performance|effectiveness|support|activity)|how (are|is) (coaches?|the coaches?|my coaches?) (doing|performing|supporting)|coach (stats?|signals?|data|health|wrap.?up))\b/i,
  },
  // Retention
  {
    intent:  'retention',
    pattern: /\b(why (are players? leaving|is player churn|is retention|are we losing players?)|retention (signals?|risk|data|issues?|analysis|patterns?)|player (churn|attrition|leaving|dropout)|which (levels?|players?) (have|has) (churn|retention) risk|who (is|are) (at risk of leaving|likely to leave))\b/i,
  },
  // What changed
  {
    intent:  'what_changed',
    pattern: /\b(what changed (this month|this quarter|recently|last month|last week)|what'?s? (changed|new|different|improved|gotten worse) (this month|this quarter|recently)?|what (is improving|is getting worse|improved|regressed|changed)|month (review|summary|overview|update)|quarter (review|summary|overview|update))\b/i,
  },
  // Academy health brief
  {
    intent:  'health_brief',
    pattern: /\b(academy (health|health brief|health summary|health check|overview|summary|status report|report card)|how (is|are) the academy (doing|performing|looking|health)|academy (performance|state|condition|health)|give me (a |the |an )?academy (health|brief|overview|summary|report))\b/i,
  },
  // What should we improve next
  {
    intent:  'improve_next',
    pattern: /\b(what should (i|we) improve (next|first)|what (is|are) (the |our )?(main |biggest |top )?(opportunity|area to improve|improvement area|next step|priority)|where should (i|we) focus (next|first|our energy|improvement)|what'?s? (the most important|top priority|biggest opportunity) (to improve|for improvement|for the academy)?)\b/i,
  },
]

// ─── Detection ────────────────────────────────────────────────────────────────

export function detectIntelligenceQuestion(text: string): IntelligenceIntent | null {
  for (const { intent, pattern } of PATTERNS) {
    if (pattern.test(text)) return intent
  }
  return null
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export function buildIntelligenceAnswer(
  text:  string,
  ctx:   DirectorDonnaContext,
): DonnaSafeReadAnswer | null {
  const intent = detectIntelligenceQuestion(text)
  if (!intent) return null

  switch (intent) {
    case 'academy_learning': {
      const report = buildAcademyIntelligenceReport(ctx)
      return {
        actionId:    'academy_intelligence_report',
        text:        formatIntelligenceReportAsMessage(report),
        confidence:  report.dataConfidence === 'high' ? 'high' : 'partial',
        sourceNote:  'Full academy intelligence report',
        followUp:    report.topObservation?.destination ? 'Take me there' : null,
        href:        report.topObservation?.destination ?? null,
        isAnswerable: report.observations.length > 0,
      }
    }
    case 'who_is_ready':       return buildWhoIsReadyAnswer(ctx)
    case 'who_is_stalled':     return buildWhoIsStalledAnswer(ctx)
    case 'progression':        return buildProgressionAnswer(ctx)
    case 'curriculum_bottleneck': return buildCurriculumBottleneckAnswer(ctx)
    case 'coach_impact':       return buildCoachImpactAnswer(ctx)
    case 'retention':          return buildRetentionAnswer(ctx)
    case 'what_changed':       return buildWhatChangedAnswer(ctx)
    case 'health_brief':       return buildAcademyHealthBriefAnswer(ctx)
    case 'improve_next': {
      const brief = buildAcademyHealthBriefAnswer(ctx)
      // Narrow the response to just the opportunity + action
      const lines = [
        '**Observation:**',
        'Top academy improvement opportunity based on current signals.',
        '',
        brief.text.split('\n').filter(l => l.startsWith('**Main Opportunity') || l.startsWith('**Recommended First Action') || (!l.startsWith('**') && brief.text.indexOf(l) > brief.text.indexOf('**Main Opportunity'))).slice(0, 6).join('\n'),
      ]
      return {
        actionId:    'improve_next_recommendation',
        text:        lines.join('\n'),
        confidence:  brief.confidence,
        sourceNote:  'Academy health brief — top recommendation',
        followUp:    brief.followUp,
        href:        brief.href,
        isAnswerable: true,
      }
    }
    default:
      return null
  }
}
