// Sprint 690 — DONNA Natural Response Composer V1
// Converts routing results and raw answer data into premium COO-quality text.
// Pure TS — no DB, no API, no mutations. Style: concise, warm, direct, honest.

import type { DonnaRoutingResult } from './donnaConversationalRouter'
import type { DonnaDirectorIntent } from './donnaIntentClassifier'
import { getPageCapabilityMap, whatCanYouHelpWith, whatActionsRequireApproval, whatShouldINotDo, whereAmI, whatShouldIInspectFirst } from './donnaPageContextEngine'
import { howDoesThisSystemWork, whatHappensAfterCoachRecap, howDoesParentUpdateGetApproved, howDoMissionsAndBadgesConnectToCurriculum, whatShouldITestFirst, whatIsConnectedToPlayerProgress, getModuleDefinition } from './donnaSystemMap'
// Sprint 705 — KPI explainer wiring
import { explainKpiByStatus } from './kpiExplanations/kpiExplainer'
import type { AcademyKpiId } from '@/lib/kpis/academyKpiModel'
// Sprint 706 — Review queue + roster intel composers
import type { DonnaReviewQueueSummary } from '@/components/assistant/donnaReviewQueueTypes'
import type { AttentionReport } from '@/components/assistant/donnaAttentionEngine'

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
  // Sprint 712 — add missing KPI ID
  if (t.includes('progress velocity') || t.includes('player velocity') || t.includes('development velocity') || t.includes('player progress')) return 'player_progress_velocity'
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
    case 'inspect_first':
      // Sprint 710 — wired: was falling through to default
      return directAnswer(whatShouldIInspectFirst(pathname))
    case 'approval_actions':
      return directAnswer(whatActionsRequireApproval(pathname))
    case 'not_do':
      return directAnswer(whatShouldINotDo(pathname))
    default:
      return directAnswer(whatCanYouHelpWith(pathname, firstName))
  }
}

// ── Sprint 710 — module-specific system answer ────────────────────────────────

function detectModuleId(text: string): string | null {
  const t = text.toLowerCase()
  if (t.includes('review center') || t.includes('review queue')) return 'review_center'
  if (t.includes('kpi') || t.includes('metric')) return 'kpi'
  if (t.includes('curriculum')) return 'curriculum'
  if (t.includes('placement')) return 'placement'
  if (t.includes('assessment')) return 'assessments'
  if (t.includes('coach recap') || t.includes('session recap')) return 'coach_recaps'
  if (t.includes('parent summary') || t.includes('parent update')) return 'parent_summaries'
  if (t.includes('parent portal')) return 'parent_portal'
  if (t.includes('player portal')) return 'player_portal'
  if (t.includes('player profile') || t.includes('player record')) return 'player_profiles'
  if (t.includes('mission')) return 'missions'
  if (t.includes('badge')) return 'badges'
  if (t.includes('level up') || t.includes('level movement')) return 'level_up'
  if (t.includes('voice assistant') || t.includes('voice command')) return 'voice_assistant'
  if (t.includes('signal') || t.includes('attention queue')) return 'attention_queue'
  if (t.includes('dashboard')) return 'director_dashboard'
  return null
}

export function composeModuleAnswer(text: string, firstName: string | null = null): ComposedDonnaResponse | null {
  const moduleId = detectModuleId(text)
  if (!moduleId) return null
  const mod = getModuleDefinition(moduleId)
  if (!mod) return null
  const name = firstName ? `${firstName}, ` : ''
  const safeList = mod.safeReadActions.slice(0, 3).map(a => `• ${a}`).join('\n')
  const reviewList = mod.reviewRequiredActions.slice(0, 2).map(a => `• ${a}`).join('\n')
  return directAnswer(
    `${name}**${mod.label}**: ${mod.userFacingExplanation}\n\nWhat I can read here:\n${safeList}\n\nWhat requires your approval:\n${reviewList}`,
    `View ${mod.label}`,
  )
}

// ── Sprint 706 — Review queue live count composer ──────────────────────────────

export function composeReviewQueueAnswer(
  count: number,
  queueData: DonnaReviewQueueSummary | null,
  firstName: string | null = null,
): ComposedDonnaResponse {
  const name = firstName ? `${firstName}, ` : ''

  if (count === 0) {
    return directAnswer(
      `${name}your review queue is clear right now. Nothing is waiting for your approval — coaches are up to date and no proposed actions are pending.`,
      'Open Review Center',
      '/director/review',
    )
  }

  const parts: string[] = []
  if (queueData) {
    if (queueData.proposedActionsCount > 0) parts.push(`${queueData.proposedActionsCount} proposed action${queueData.proposedActionsCount !== 1 ? 's' : ''}`)
    if (queueData.sessionNeedsBlocksCount > 0) parts.push(`${queueData.sessionNeedsBlocksCount} session${queueData.sessionNeedsBlocksCount !== 1 ? 's' : ''} without blocks`)
    if (queueData.needsRoutingCount > 0) parts.push(`${queueData.needsRoutingCount} item${queueData.needsRoutingCount !== 1 ? 's' : ''} needing routing`)
  }
  const breakdown = parts.length > 0 ? ` — ${parts.join(', ')}` : ''

  return directAnswer(
    `${name}${count} item${count !== 1 ? 's are' : ' is'} waiting in your review queue${breakdown}. Items are sorted by risk — parent-visible items first, then level changes, then internal drafts. Nothing takes effect until you approve it.`,
    'Open Review Center',
    '/director/review',
  )
}

// ── Sprint 706 / Sprint 713 — Roster intel composer ──────────────────────────

export function composeRosterIntelAnswer(
  report: AttentionReport | null,
  reviewData: DonnaReviewQueueSummary | null,
  firstName: string | null = null,
): ComposedDonnaResponse {
  const name = firstName ? `${firstName}, ` : ''

  // Sprint 713 — extract unique player names from review queue items
  const reviewPlayerNames: string[] = reviewData
    ? Array.from(new Set(reviewData.items.map(i => i.playerLabel).filter((l): l is string => !!l))).slice(0, 4)
    : []

  if (!report || report.items.length === 0) {
    if (reviewPlayerNames.length > 0) {
      return directAnswer(
        `${name}no attention flags from observations, but ${reviewPlayerNames.length} player${reviewPlayerNames.length !== 1 ? 's have' : ' has'} items in the review queue: ${reviewPlayerNames.join(', ')}. I can help draft a parent-safe update or coach summary — it will go to review before anything is sent.`,
        'View Players',
        '/director/players',
      )
    }
    return directAnswer(
      `${name}no players are currently flagged for attention. For full roster intelligence — curriculum gaps, advancement readiness, assessment due — navigate to the player directory and I'll surface what matters there.`,
      'View Players',
      '/director/players',
    )
  }

  const urgent = report.items.filter(i => i.urgency === 'critical' || i.urgency === 'high')
  const totalCount = report.items.length
  const urgentCount = urgent.length
  const topTitles = urgent.slice(0, 2).map(i => i.title).join(' and ')
  const urgencyNote = urgentCount > 0
    ? ` ${urgentCount} need${urgentCount !== 1 ? '' : 's'} urgent attention${topTitles ? ` (${topTitles})` : ''}.`
    : ''
  // Sprint 713 — add player names from review queue if available
  const playerNameNote = reviewPlayerNames.length > 0
    ? ` Players with pending review items: ${reviewPlayerNames.join(', ')}.`
    : ''

  return directAnswer(
    `${name}${totalCount} player${totalCount !== 1 ? 's are' : ' is'} flagged for attention.${urgencyNote}${playerNameNote}\n\nI can help draft a parent-safe update or coach summary for any of these players — it will go to your review queue before anything is sent.`,
    'View Players',
    '/director/players',
  )
}

// ── Sprint 716 — Curriculum Intelligence Deep (Category 11: 6→9) ─────────────

type CurriculumQuestionType =
  | 'gap_explanation'      // What are curriculum gaps? / What gaps exist?
  | 'how_it_works'         // How does curriculum work? / Explain curriculum
  | 'level_focus'          // What should Orange 1 focus on? / Level-specific
  | 'fix_gaps'             // How do I fix gaps? / Improve coverage
  | 'advancement_link'     // How does curriculum connect to advancement?
  | 'template_assignment'  // How do templates work? / Assign curriculum
  | 'general'              // Fallback

export function detectCurriculumQuestionType(lower: string): CurriculumQuestionType {
  if (lower.includes('gap') || lower.includes('missing') || lower.includes('coverage')) return 'gap_explanation'
  if ((lower.includes('fix') || lower.includes('improve') || lower.includes('resolve') || lower.includes('address')) &&
      (lower.includes('curriculum') || lower.includes('gap') || lower.includes('coverage'))) return 'fix_gaps'
  if (lower.includes('advancement') || lower.includes('level up') || lower.includes('level change') ||
      lower.includes('advance') || (lower.includes('connect') && lower.includes('curriculum'))) return 'advancement_link'
  if (lower.includes('orange') || lower.includes('red') ||
      (lower.includes('focus') && lower.includes('level'))) return 'level_focus'
  if (lower.includes('template') && !lower.includes('create a class template')) return 'template_assignment'
  if (lower.includes('how') && (lower.includes('work') || lower.includes('system') ||
      lower.includes('structured') || lower.includes('does'))) return 'how_it_works'
  return 'general'
}

export function composeCurriculumAnswer(questionType: CurriculumQuestionType, firstName: string | null = null): ComposedDonnaResponse {
  const name = firstName ? `${firstName}, ` : ''

  switch (questionType) {
    case 'gap_explanation':
      return directAnswer(
        `${name}a curriculum gap means a player or group at a level hasn't received coaching in a required skill area — or no class template covers a skill that level should include.\n\n**Three types of gaps:**\n• **Coverage gap** — a player attended sessions but sessions had no block for a required skill category\n• **Template gap** — the class template for a level is missing a required block type (e.g., no mental performance block)\n• **Assignment gap** — a player has no active template assignment at all and is receiving no structured curriculum\n\n**How to find them:** Open the Curriculum Builder → select a level → look for blocks with low coverage percentages or players without assignments.\n\nI can draft a curriculum adjustment proposal for your review once you identify the gap.`,
        'Open Curriculum Builder',
        '/director/curriculum/builder',
      )

    case 'how_it_works':
      return directAnswer(
        `${name}the curriculum runs on three connected layers:\n\n**1. Levels** (e.g., Orange 1–4) — define the development stage. Each level has a recommended set of skill block categories and advancement milestones.\n\n**2. Class templates** — define what sessions look like for a group at a level. Each template specifies an ordered sequence of blocks: warm-up, technical, tactical, physical, mental. Templates are reusable across multiple groups at the same level.\n\n**3. Session blocks** — when a session runs and a coach logs notes, block coverage is recorded per player. This creates the coverage record that shows which skills each player has been coached on.\n\nCurriculum health = every active player has a template covering all required block categories for their level, and sessions are being logged.`,
        'Open Curriculum Builder',
        '/director/curriculum/builder',
      )

    case 'level_focus':
      return directAnswer(
        `${name}each level in the academy curriculum has a progression focus:\n\n• **Foundation levels** (e.g., Orange 1–2) — mechanics and fundamentals: grip, stance, contact point, movement patterns, basic rally construction. Sessions emphasize repetition and correct technique.\n• **Development levels** (e.g., Orange 3–4) — tactical awareness: cross-court vs. down-the-line, rally patterns, point construction, competitive mental habits. More emphasis on match-realistic drills.\n• **Performance levels** (e.g., Red 1–4) — performance under pressure: competitive patterns, point play, match simulation, physical load management, mental performance blocks, strategic planning.\n\nTo see your academy's specific level definitions and required block categories, open the Curriculum Builder → select the level.`,
        'Open Curriculum Builder',
        '/director/curriculum/builder',
      )

    case 'fix_gaps':
      return directAnswer(
        `${name}here's how to resolve each type of curriculum gap:\n\n**Template gaps** — edit the class template for the affected level and add the missing block type. All sessions using that template will include the block going forward. I can draft a template adjustment for your review.\n\n**Assignment gaps** — navigate to the player's profile and assign them to a group or template. Players without an assignment have no curriculum coverage. This needs your approval.\n\n**Coverage gaps** — if a player attended sessions but shows low coverage, check whether the coach logged session notes and whether session blocks were populated. I can draft a coach note request.\n\nAll curriculum changes and template edits go through the Review Center — nothing changes until you approve.`,
        'Open Curriculum Builder',
        '/director/curriculum/builder',
      )

    case 'advancement_link':
      return directAnswer(
        `${name}curriculum coverage is one of three signals that determines advancement readiness:\n\n1. **Coverage** — has the player been coached on the required skill blocks for their current level?\n2. **Assessment scores** — has the player demonstrated the skills in evaluation?\n3. **Coach recommendation** — does the coach believe the player is ready?\n\nA player can have high assessment scores but low curriculum coverage — it means they're performing the skills but haven't received structured coaching on all required areas. Both matter for advancement.\n\nWhen a player approaches the advancement threshold, they appear in the Level Readiness queue. I can surface a readiness summary and draft a level-change proposal for your review.`,
        'View Players',
        '/director/players',
      )

    case 'template_assignment':
      return directAnswer(
        `${name}class templates are how curriculum design translates into daily sessions:\n\n**Creating a template** — define the session structure for a level: total duration, block sequence, and block types. Templates are reusable across multiple groups at the same level. I can draft a new template for your review.\n\n**Assigning a template** — when you create or edit a session, you assign a template to it. All players in that group then inherit the block coverage from that session's template.\n\n**Sessions without templates** — sessions run without a template assignment don't contribute structured curriculum coverage. I can flag these sessions in your review queue.\n\nAll template changes go through the Review Center before taking effect.`,
        'Open Curriculum Builder',
        '/director/curriculum/builder',
      )

    case 'general':
    default:
      return directAnswer(
        `${name}the academy curriculum is structured in three layers: **Levels** (what stage a player is at) → **Class templates** (what sessions cover for that level) → **Session blocks** (what was coached and logged).\n\nGaps appear when players lack coverage in required skill categories — no template assignment, missing block types, or sessions not logged. I can explain gaps, templates, level focus areas, how curriculum connects to advancement, or how to fix specific gaps. What would you like to dig into?`,
        'Open Curriculum Builder',
        '/director/curriculum/builder',
      )
  }
}

// Sprint 714 alias — preserved for callers; routes to gap_explanation type
export function composeCurriculumExplanationAnswer(firstName: string | null = null): ComposedDonnaResponse {
  return composeCurriculumAnswer('gap_explanation', firstName)
}
