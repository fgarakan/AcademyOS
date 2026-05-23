// Sprint 690 — DONNA Natural Response Composer V1
// Converts routing results and raw answer data into premium COO-quality text.
// Pure TS — no DB, no API, no mutations. Style: concise, warm, direct, honest.

import type { DonnaRoutingResult } from './donnaConversationalRouter'
import type { DonnaDirectorIntent } from './donnaIntentClassifier'
import { getPageCapabilityMap, whatCanYouHelpWith, whatActionsRequireApproval, whatShouldINotDo, whereAmI } from './donnaPageContextEngine'
import { howDoesThisSystemWork, whatHappensAfterCoachRecap, howDoesParentUpdateGetApproved, howDoMissionsAndBadgesConnectToCurriculum, whatShouldITestFirst, whatIsConnectedToPlayerProgress } from './donnaSystemMap'
// Sprint 705 — KPI explainer wiring
import { explainKpiByStatus } from './kpiExplanations/kpiExplainer'
import type { AcademyKpiId } from '@/lib/kpis/academyKpiModel'

// ── Response style rules ───────────────────────────────────────────────────────
// 1. Start with the answer, not a preamble.
// 2. Use the director's name if available — one sentence max.
// 3. One clear next step at the end. No trailing questions unless clarification is needed.
// 4. Acknowledge what you can't do. Offer an alternative.
// 5. Never say "Intent classified" or "confidence 0.7" — translate to plain language.

// ── Composed response ──────────────────────────────────────────────────────────

export interface ComposedDonnaResponse {
  text: string
  nextStepLabel: string | null
  nextStepHref: string | null
  isBlocked: boolean
  safeAlternative: string | null
}

// ── Safe alternative by intent ─────────────────────────────────────────────────

const SAFE_ALTERNATIVE: Partial<Record<DonnaDirectorIntent, string>> = {
  unsafe_visibility_request: 'I can draft a parent-safe version and route it through the Review Center instead.',
  level_movement: 'I can prepare a level-change proposal with readiness evidence and send it to the Review Center.',
  parent_summary: 'I can draft a parent update for your review before anything is sent.',
  curriculum_builder: 'I can show the current template structure and suggest changes for your review.',
}

const REVIEW_ROUTE_HREFS: Partial<Record<DonnaDirectorIntent, string>> = {
  parent_summary: '/director/review',
  level_movement: '/director/review',
  curriculum_builder: '/director/review',
  coach_note_summary: '/director/review',
}

// ── Template library ───────────────────────────────────────────────────────────

function directAnswer(text: string, nextStep?: string, href?: string): ComposedDonnaResponse {
  return { text, nextStepLabel: nextStep ?? null, nextStepHref: href ?? null, isBlocked: false, safeAlternative: null }
}

function blockedResponse(firstName: string | null, intent: DonnaDirectorIntent): ComposedDonnaResponse {
  const name = firstName ? `, ${firstName}` : ''
  const alt = SAFE_ALTERNATIVE[intent] ?? 'I can help you find a safe path that goes through the Review Center.'
  const text = intent === 'unsafe_visibility_request'
    ? `I can't do that${name}. Sharing raw or unreviewed content directly with parents or players isn't something I'm able to do — it could expose private information without your approval.\n\n${alt}`
    : `I can't do that directly from our conversation${name}. Any action that affects records, communications, or player data needs to go through the Review Center first.\n\n${alt}`
  return { text, nextStepLabel: 'Go to Review Center', nextStepHref: '/director/review', isBlocked: true, safeAlternative: alt }
}

function reviewRouteResponse(firstName: string | null, intent: DonnaDirectorIntent): ComposedDonnaResponse {
  const name = firstName ? `, ${firstName}` : ''
  const alt = SAFE_ALTERNATIVE[intent] ?? 'I\'ll route this to the Review Center.'
  const href = REVIEW_ROUTE_HREFS[intent] ?? '/director/review'

  if (intent === 'parent_summary') {
    return directAnswer(
      `I can prepare that as a review item${name}. I won't send anything to the parent until you've reviewed and approved it.\n\n${alt}`,
      'Go to Review Center',
      href,
    )
  }
  if (intent === 'level_movement') {
    return directAnswer(
      `Level changes always go through review first${name}. I'll prepare a readiness summary with the evidence — you decide whether to approve, defer, or skip.\n\n${alt}`,
      'Go to Review Center',
      href,
    )
  }
  return directAnswer(
    `This needs your review before anything takes effect${name}. I'll prepare the draft and send it to the Review Center.\n\n${alt}`,
    'Go to Review Center',
    href,
  )
}

function clarificationResponse(firstName: string | null, question: string): ComposedDonnaResponse {
  const name = firstName ? `${firstName}, ` : ''
  return directAnswer(`${name}${question}`)
}

function limitationResponse(firstName: string | null, missingContext: string | null): ComposedDonnaResponse {
  const name = firstName ? `, ${firstName}` : ''
  const ctx = missingContext ?? 'the data needed for this'
  return directAnswer(
    `I don't have enough evidence to say that confidently${name}. I'm missing ${ctx}. The safest next step is to review the player profile or check the relevant section directly.`,
  )
}

// ── Main composer ──────────────────────────────────────────────────────────────

export function composeDonnaResponse(
  routing: DonnaRoutingResult,
  pathname: string,
  firstName: string | null = null,
): ComposedDonnaResponse {
  const { responseMode, intent, safetyClass, missingContext, shouldAskClarification, clarificationQuestion } = routing

  if (safetyClass === 'blocked') {
    return blockedResponse(firstName, intent)
  }

  if (shouldAskClarification && clarificationQuestion) {
    return clarificationResponse(firstName, clarificationQuestion)
  }

  switch (responseMode) {
    case 'block_unsafe_request':
      return blockedResponse(firstName, intent)

    case 'route_to_review':
      return reviewRouteResponse(firstName, intent)

    case 'build_action_preview': {
      const name = firstName ? `, ${firstName}` : ''
      return directAnswer(
        `Before I do anything${name}, here's what would happen: I'll prepare a proposal with the relevant context, and nothing will change until you explicitly approve it in the Review Center.`,
        'Go to Review Center',
        '/director/review',
      )
    }

    case 'ask_clarification':
      return clarificationResponse(firstName, clarificationQuestion ?? 'Can you give me more context?')

    case 'explain_limitation':
      return limitationResponse(firstName, missingContext)

    case 'use_page_context': {
      const map = getPageCapabilityMap(pathname)
      // Route to the specific page question based on the input
      const text = whatCanYouHelpWith(pathname, firstName)
      return directAnswer(text, `Explore ${map.pageLabel}`)
    }

    case 'use_system_map': {
      // Pick the most relevant system answer based on which system question was detected
      // Caller can override; here we default to the top-level system overview
      return directAnswer(howDoesThisSystemWork(), 'View Review Center', '/director/review')
    }

    case 'use_kpi_answer': {
      const name = firstName ? `${firstName}, ` : ''
      return directAnswer(
        `${name}KPI data reflects real activity in your academy — attendance records, coach sessions, and assessment results. A low KPI usually means either the data pipeline isn't yet populated, or there's a real gap to address.\n\nTo improve a KPI, look at what it measures and trace it to the source: attendance → sessions → coaches. I can explain any specific KPI in detail.`,
        'View KPIs',
        '/director/kpi',
      )
    }

    case 'use_roster_intel': {
      const name = firstName ? `${firstName}, ` : ''
      return directAnswer(
        `${name}I can help identify players who need attention based on attendance gaps, missing coach notes, or development flags. Navigate to the player directory or a specific player profile and I'll surface what matters there.`,
        'View Players',
        '/director/players',
      )
    }

    case 'use_review_context': {
      const name = firstName ? `${firstName}, ` : ''
      return directAnswer(
        `${name}the Review Center holds every pending action that needs your approval before it takes effect. Items are sorted by risk — parent-visible items first, then level changes, then internal drafts. Nothing in the queue is live until you say so.`,
        'Open Review Center',
        '/director/review',
      )
    }

    case 'answer_directly':
    default: {
      const name = firstName ? `${firstName}, ` : ''
      return directAnswer(
        `${name}I'm ready to help. Ask me what needs attention, what a section means, or how to handle a specific situation. I'll answer directly and route anything sensitive through the Review Center.`,
      )
    }
  }
}

// ── Sprint 705 — KPI explainer: detect KPI from text, return explanation ──────

function detectKpiId(text: string): AcademyKpiId | null {
  const t = text.toLowerCase()
  if (t.includes('attendance')) return 'attendance_rate'
  if (t.includes('recap') || t.includes('session note')) return 'recap_completion_rate'
  if (t.includes('parent summar') || t.includes('parent update') || t.includes('family update')) return 'parent_summary_freshness'
  if (t.includes('curriculum') || t.includes('coverage')) return 'curriculum_coverage'
  if (t.includes('template')) return 'template_usage_rate'
  if (t.includes('follow') || t.includes('follow-through')) return 'coach_followthrough_rate'
  if (t.includes('level readiness') || t.includes('advancement queue')) return 'level_readiness_queue_size'
  if (t.includes('mission')) return 'mission_completion_rate'
  if (t.includes('badge')) return 'badge_progress_rate'
  if (t.includes('mental')) return 'mental_performance_coverage'
  if (t.includes('priority') || t.includes('priorities')) return 'player_priority_coverage'
  return null
}

export function composeKpiAnswer(text: string, firstName: string | null = null): ComposedDonnaResponse {
  const name = firstName ? `${firstName}, ` : ''
  const kpiId = detectKpiId(text)

  if (!kpiId) {
    return directAnswer(
      `${name}KPI data reflects real activity in your academy — attendance records, coach sessions, and assessment results. A low KPI usually means either the data pipeline isn't yet populated, or there's a real gap to address.\n\nTell me which specific KPI you want to understand — attendance, recap completion, curriculum coverage, parent summaries, template usage, or level readiness — and I'll give you a direct explanation.`,
      'View KPIs',
      '/director/kpi',
    )
  }

  const explanation = explainKpiByStatus(kpiId, 'warning')
  return directAnswer(
    `${name}${explanation.headline}.\n\n${explanation.whyItMatters}\n\n**What to do:** ${explanation.recommendedNextAction}`,
    'View KPIs',
    explanation.nextActionHref ?? '/director/kpi',
  )
}

// ── Specialized composers ──────────────────────────────────────────────────────
// For callers who know exactly which system question was asked.

export function composeSystemFlowAnswer(questionType: 'coach_recap' | 'parent_update' | 'missions_badges' | 'player_progress' | 'test_first' | 'system_overview'): ComposedDonnaResponse {
  switch (questionType) {
    case 'coach_recap':
      return directAnswer(whatHappensAfterCoachRecap())
    case 'parent_update':
      return directAnswer(howDoesParentUpdateGetApproved(), 'View Review Center', '/director/review')
    case 'missions_badges':
      return directAnswer(howDoMissionsAndBadgesConnectToCurriculum())
    case 'player_progress':
      return directAnswer(whatIsConnectedToPlayerProgress())
    case 'test_first':
      return directAnswer(whatShouldITestFirst(), 'View Dashboard', '/director')
    case 'system_overview':
    default:
      return directAnswer(howDoesThisSystemWork(), 'View Review Center', '/director/review')
  }
}

export function composePageContextAnswer(questionType: 'where_am_i' | 'help_here' | 'inspect_first' | 'approval_actions' | 'not_do', pathname: string, firstName: string | null = null): ComposedDonnaResponse {
  switch (questionType) {
    case 'where_am_i':
      return directAnswer(whereAmI(pathname, firstName))
    case 'help_here':
      return directAnswer(whatCanYouHelpWith(pathname, firstName))
    case 'approval_actions':
      return directAnswer(whatActionsRequireApproval(pathname))
    case 'not_do':
      return directAnswer(whatShouldINotDo(pathname))
    default:
      return directAnswer(whatCanYouHelpWith(pathname, firstName))
  }
}
