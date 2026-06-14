// Sprint 978 — DONNA LLM Orchestration Context Packet
// Sprint 979 — V2: conversation history, tool manifest, page context, approval rules,
//               safe academy state summary, richer system prompt.
// Pure TypeScript — no DB, no API, no React.
//
// The context packet is the LLM's complete world model for one DONNA turn.
// It contains only safe, non-sensitive information.
// No raw coach notes, no player observations, no private data.
// No player names unless explicitly included by a future sprint with director approval.
//
// V1 (Sprint 978): role, page, pending count, next action, explanation, user input.
// V2 (Sprint 979): + conversation history, available tools, blocked actions,
//                    page context summary, academy state summary, approval rules.
//
// Usage:
//   const packet = buildContextPacket({ role, pathname, pendingReviews, firstName, conversationHistory })
//   // packet.systemPrompt — full structured system prompt for LLM
//   // packet.safeSignals — structured data the LLM can reference
//   // packet.pageContext — page-specific context (chips, highlight targets)
//   // packet.toolManifest — tools available to the LLM in this turn

import type {
  OrchestratorRole,
  OrchestratorToolId,
  ConversationHistory,
  ConversationTurn,
  PageContextSummary,
  AcademyStateSummary,
} from './types'
import type { DirectorNextAction } from '../directorNextActionEngine'
import type { DirectorActionExplanation } from '../directorActionExplanation'
import { getChipsForRoute } from '../donnaPageChipRegistry'
// Sprint 1018 — curriculum strategy conversation framing
import {
  isCurriculumStrategyQuery,
  CURRICULUM_STRATEGY_PROMPT_SECTION,
} from './curriculumStrategyConversation'
// Sprint 2261–2290 — DONNA Memory Activation
import type {
  PriorSessionContext,
  DecisionMemoryContext,
  EntityMemoryContext,
  AcademyMemoryContext,
} from '../memory/donnaMemoryContextTypes'

// ── Context packet input ──────────────────────────────────────────────────────

export interface ContextPacketInput {
  /** Role of the current user */
  role: OrchestratorRole
  /** Current page pathname */
  pathname: string
  /** User's first name for personalization */
  firstName?: string | null
  /** Pending review queue items (already loaded in panel state) */
  pendingReviews?: number
  /** The current page's human-readable label */
  pageLabel?: string
  /** Pre-computed next action from directorNextActionEngine (optional) */
  nextAction?: DirectorNextAction | null
  /** Pre-computed action explanation from directorActionExplanation (optional) */
  actionExplanation?: DirectorActionExplanation | null
  /** The director's typed/spoken input */
  userInput: string
  /** Sprint 979 — Recent conversation turns (capped at 10 by builder) */
  conversationHistory?: ConversationHistory
  /** Sprint 979 — Safe academy state summary from panel state or brief */
  academyState?: Partial<AcademyStateSummary>
  /** Sprint 1002 — Academy ID for server-side live context tool retrieval (never sent to LLM) */
  academyId?: string
  /** Sprint 1003 — Player ID from route context for player-specific tool (never guessed by LLM) */
  playerId?: string
  /** Sprint 1004 — Session ID from route context for session-specific tool (never guessed by LLM) */
  sessionId?: string
  /**
   * Sprint 1075 — Academy profile summary from server-side AcademyProfileContext.
   * Built in donnaOrchestratorAction from authenticated academy data — never from client input.
   * Injected into the system prompt as "## Academy Context" when present.
   * Missing fields are explicit (see getAcademyProfileSummaryText).
   */
  academyProfileSummary?: string
  // Sprint 2261–2290 — DONNA Memory Activation: four-tier memory context
  priorSessionContext?: PriorSessionContext | null
  decisionMemoryContext?: DecisionMemoryContext | null
  entityMemoryContext?: EntityMemoryContext | null
  academyMemoryContext?: AcademyMemoryContext | null
  /** True when this is the first DONNA panel open of the calendar day — triggers Tier 2 + Tier 4 injection */
  isFirstSessionOfDay?: boolean
}

// ── Safe signals ──────────────────────────────────────────────────────────────

/** Structured safe data the LLM can reference. No raw private data. */
export interface SafeSignals {
  role: OrchestratorRole
  pathname: string
  pageLabel: string
  pendingReviews: number
  hasUrgentItems: boolean
  nextActionId: string | null
  nextActionTitle: string | null
  nextActionSafetyLevel: string | null
  nextActionRequiresApproval: boolean
  actionExplanationSafetyBadge: string | null
  actionExplanationChangesRecords: boolean
  /** Sprint 979 — */
  hasMissingRecaps: boolean
  hasPlayersNeedingPlacement: boolean
  hasAdvancementEligiblePlayers: boolean
  academyHealthSignal: AcademyStateSummary['academyHealthSignal']
  conversationTurnCount: number
  /** Sprint 1002 — Academy ID for server-side live tool retrieval (stored in signals, never in LLM prompt) */
  academyId: string | null
  /** Sprint 1003 — Player ID from route context (stored in signals, never guessed by LLM) */
  playerId: string | null
  /** Sprint 1003 — Whether player profile context is available for get_player_profile_summary */
  hasPlayerContext: boolean
  /** Sprint 1004 — Session ID from route context (stored in signals, never guessed by LLM) */
  sessionId: string | null
  /** Sprint 1004 — Whether session context is available for get_session_context */
  hasSessionContext: boolean
}

// ── Tool manifest ─────────────────────────────────────────────────────────────

/** The tools available to the LLM in the current turn, with descriptions. */
export interface ToolManifestEntry {
  id: OrchestratorToolId
  description: string
  safetyLevel: 'safe' | 'review_only' | 'approval_gated'
  requiresParams: string[]
}

export type ToolManifest = ToolManifestEntry[]

// ── Context packet ────────────────────────────────────────────────────────────

export interface ContextPacket {
  /** The system prompt to include at the top of the LLM request */
  systemPrompt: string
  /** Structured signals the LLM can reference */
  safeSignals: SafeSignals
  /** The user's input (sanitized) */
  userInput: string
  /** Token-efficient summary for compact LLM requests */
  compactSummary: string
  /** Sprint 979 — page context (chips, highlight targets, approval gates) */
  pageContext: PageContextSummary
  /** Sprint 979 — tool manifest for this turn */
  toolManifest: ToolManifest
  /** Sprint 979 — sanitized conversation history (last 6 turns max for tokens) */
  conversationHistory: ConversationHistory
  /** Sprint 979 — estimated token cost category for this context packet */
  tokenBudget: 'compact' | 'standard' | 'extended'
}

// ── Role context ──────────────────────────────────────────────────────────────

const ROLE_CONTEXT: Record<OrchestratorRole, string> = {
  academy_director: [
    'You are DONNA, a COO-style operating assistant for an academy director.',
    'You help directors understand their academy state, make good decisions, and take safe actions.',
    'You have access to structured academy signals but never expose raw private data.',
    'You help directors decide — you never decide for them.',
  ].join(' '),
  head_coach: [
    'You are DONNA, a coaching assistant for a head coach.',
    'You help head coaches prepare for sessions, submit accurate wrap-ups, and review player signals.',
    'You never expose player data to parents or other coaches.',
  ].join(' '),
  coach: [
    'You are DONNA, a coaching assistant.',
    'You help coaches run sessions and submit wrap-ups for director review.',
    'All notes you help create enter the director review queue before becoming official.',
  ].join(' '),
}

// ── Tool manifest builder ─────────────────────────────────────────────────────

const TOOL_MANIFEST_ALL: ToolManifestEntry[] = [
  { id: 'get_pending_review_count', description: 'Returns pending review item count from panel state. No DB query.', safetyLevel: 'safe', requiresParams: [] },
  { id: 'get_next_action_recommendation', description: 'Returns the deterministic next-action recommendation for the current page and signals.', safetyLevel: 'safe', requiresParams: ['pathname'] },
  { id: 'get_action_explanation', description: 'Returns structured safety/approval explanation for a recommended action.', safetyLevel: 'safe', requiresParams: ['actionId'] },
  { id: 'get_review_queue_guidance', description: 'Returns COO-style guidance for review queue decisions.', safetyLevel: 'safe', requiresParams: ['intent'] },
  { id: 'get_page_context', description: 'Returns page label, chips, and highlight targets for the current route.', safetyLevel: 'safe', requiresParams: ['pathname'] },
  { id: 'set_highlight_target', description: 'Highlights a UI element by writing to sessionStorage and dispatching donna:highlight.', safetyLevel: 'safe', requiresParams: ['targetId', 'label', 'route'] },
  { id: 'draft_proposed_action', description: 'Creates a proposed_action draft for director review. Requires confirmation before execution.', safetyLevel: 'approval_gated', requiresParams: ['actionType', 'payload', 'actorId', 'academyId'] },
  { id: 'route_to_page', description: 'Suggests navigation to a route. Does not navigate automatically — director clicks.', safetyLevel: 'safe', requiresParams: ['route'] },
  // Sprint 1002 — Live DB-backed context tools (server-side only, RLS enforced, counts and flags only)
  { id: 'get_academy_state', description: 'Returns live academy operational state: pending reviews, sessions, player counts, health signal. Counts and flags only — no player names. RLS enforced server-side.', safetyLevel: 'safe', requiresParams: ['academyId'] },
  { id: 'get_player_development_summary', description: 'Returns live player development signals: active count, placement/advancement flags, overdue assessments. Counts and flags only — no player names. RLS enforced server-side.', safetyLevel: 'safe', requiresParams: ['academyId'] },
  // Sprint 1003 — Player-specific context tool (only available when player profile context exists)
  { id: 'get_player_profile_summary', description: 'Returns director-safe player profile summary: current level, status, advancement flag, priority count, session count, evidence count, overdue assessment flag. Director-facing only. No raw notes. No assessment scores. No behavioral flags. playerId injected from route context — you cannot supply it directly.', safetyLevel: 'safe', requiresParams: ['playerId'] },
  // Sprint 1004 — Session-specific context tool (only available when session context exists)
  { id: 'get_session_context', description: 'Returns director/coach-safe session context: name, status, date/time, template label, coach name, group name, block count, attendance counts, wrap-up status. No raw coach notes. No individual player names. No observation text. sessionId injected from route context — you cannot supply it directly.', safetyLevel: 'safe', requiresParams: ['sessionId'] },
  // Sprint 1015 — Curriculum context tool (available for director role, academy-scoped)
  { id: 'get_curriculum_context', description: 'Returns curriculum structure context: total levels, levels with content, pending curriculum change drafts. Structure and counts only — no raw curriculum content, no learning objectives text. RLS enforced server-side.', safetyLevel: 'safe', requiresParams: ['academyId'] },
  // Sprint 1017 — Knowledge Builder retrieval (platform-owner-approved content only, advisory only)
  { id: 'get_knowledge_content', description: 'Returns platform-owner-approved knowledge entries relevant to a query. Draft and under-review entries are always excluded. Advisory only — nothing changes automatically. V1: returns empty until Knowledge Builder DB table is wired. Provide: query (required), contentType (optional: drill/coaching_tip/curriculum_note/etc.), stage (optional: red/orange/green/etc.)', safetyLevel: 'safe', requiresParams: ['query'] },
]

// Sprint 1081 — Page-relevant tool IDs per route category.
// Sending all 14 tools on every call adds ~700 chars to the system prompt
// for tools the LLM will never use on that page. Each set below is the
// minimal useful subset for the route type. Falls back to TOOL_MANIFEST_ALL
// for unknown routes (preserving full capability for complex queries).
const TOOL_IDS_ACADEMY_HEALTH: Set<string> = new Set([
  'get_academy_state',
  'get_player_development_summary',
  'get_pending_review_count',
  'get_next_action_recommendation',
  'route_to_page',
])
const TOOL_IDS_PLAYER: Set<string> = new Set([
  'get_player_profile_summary',
  'get_player_development_summary',
  'get_pending_review_count',
  'draft_proposed_action',
  'route_to_page',
])
const TOOL_IDS_SESSION: Set<string> = new Set([
  'get_session_context',
  'get_player_profile_summary',
  'get_pending_review_count',
  'draft_proposed_action',
  'route_to_page',
])
const TOOL_IDS_CURRICULUM: Set<string> = new Set([
  'get_curriculum_context',
  'get_knowledge_content',
  'draft_proposed_action',
  'route_to_page',
])
const TOOL_IDS_REVIEW: Set<string> = new Set([
  'get_pending_review_count',
  'get_review_queue_guidance',
  'get_action_explanation',
  'route_to_page',
])
const TOOL_IDS_DASHBOARD: Set<string> = new Set([
  'get_academy_state',
  'get_player_development_summary',
  'get_pending_review_count',
  'get_next_action_recommendation',
  'get_page_context',
  'route_to_page',
])

function resolveToolIds(pathname: string): Set<string> | null {
  if (pathname === '/director/kpi') return TOOL_IDS_ACADEMY_HEALTH
  if (pathname.startsWith('/director/players/') && pathname.split('/').length === 4) return TOOL_IDS_PLAYER
  if (pathname === '/director/players') return TOOL_IDS_PLAYER
  if (pathname.startsWith('/director/sessions/')) return TOOL_IDS_SESSION
  if (pathname.startsWith('/director/curriculum')) return TOOL_IDS_CURRICULUM
  if (pathname === '/director/review') return TOOL_IDS_REVIEW
  if (pathname === '/director' || pathname === '/director/today') return TOOL_IDS_DASHBOARD
  // Unknown route — return null to signal full manifest
  return null
}

function buildToolManifest(role: OrchestratorRole, pathname?: string): ToolManifest {
  // Sprint 1081 — filter to page-relevant tools when route is known.
  // Falls back to full manifest for unknown routes (Deep Mode preservation).
  if (pathname) {
    const relevantIds = resolveToolIds(pathname)
    if (relevantIds) {
      return TOOL_MANIFEST_ALL.filter(t => relevantIds.has(t.id))
    }
  }
  return TOOL_MANIFEST_ALL
}

// ── Page context builder ──────────────────────────────────────────────────────

const DIRECTOR_ONLY_ROUTES = [
  '/director/review', '/director/curriculum', '/director/class-templates',
  '/director/sessions', '/director/players', '/director',
]

function buildPageContext(pathname: string): PageContextSummary {
  const chips = getChipsForRoute(pathname)
  const highlightTargets = chips.filter(c => c.actionType === 'highlight' && c.targetId).map(c => c.targetId!)
  const promptChips = chips.filter(c => c.actionType === 'prompt' && c.prompt).map(c => c.label)
  const hasApprovalGates = pathname.startsWith('/director/review')
  const isDirectorOnly = DIRECTOR_ONLY_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))

  const PAGE_LABELS: Record<string, string> = {
    '/director': 'Director Dashboard',
    '/director/review': 'Review Queue',
    '/director/curriculum': 'Curriculum Builder',
    '/director/sessions': 'Sessions',
    '/director/players': 'Player Directory',
    '/director/class-templates': 'Class Templates',
    '/coach': 'Coach Dashboard',
  }

  const pageLabel =
    PAGE_LABELS[pathname] ??
    (pathname.startsWith('/director/class-templates/') ? 'Class Template Detail' :
     pathname.startsWith('/director/sessions/') ? 'Session Detail' :
     pathname.startsWith('/director/players/') ? 'Player Profile' :
     pathname.startsWith('/coach/sessions/') ? 'Coach Session Detail' :
     pathname)

  return {
    pageLabel,
    pathname,
    highlightTargets,
    promptChips,
    hasApprovalGates,
    isDirectorOnly,
  }
}

// ── Sprint 2261–2290 — Memory query detection ─────────────────────────────────

/** True when the director is asking a strategic or academy-identity question. */
export function isAcademyLevelQuery(userInput: string): boolean {
  const lower = userInput.toLowerCase()
  return /\b(academy|our approach|philosophy|how we|culture|identity|strategy|overall|this year|last quarter|history|since we started|been operating|pattern)\b/.test(lower)
}

/** True when the director is explicitly referencing prior DONNA interactions. */
export function isMemoryQuery(userInput: string): boolean {
  const lower = userInput.toLowerCase()
  return /\b(last time|remember|earlier|before|previous session|you said|you mentioned|we discussed|what did we|did we talk|last week|yesterday)\b/.test(lower)
}

// ── System prompt builder ─────────────────────────────────────────────────────

function buildSystemPrompt(
  role: OrchestratorRole,
  firstName: string | null | undefined,
  safeSignals: SafeSignals,
  pageContext: PageContextSummary,
  toolManifest: ToolManifest,
  conversationHistory: ConversationHistory,
  academyProfileSummary?: string,
  priorSessionContext?: PriorSessionContext | null,
  decisionMemoryContext?: DecisionMemoryContext | null,
  entityMemoryContext?: EntityMemoryContext | null,
  academyMemoryContext?: AcademyMemoryContext | null,
): string {
  const lines: string[] = []

  // 1. Identity + role
  lines.push('## Identity')
  lines.push(ROLE_CONTEXT[role])
  if (firstName) lines.push(`The user's name is ${firstName}.`)

  // 1.5. Sprint 1075 — Academy context (injected server-side from AcademyProfileContext).
  // Only included when the summary is present and not the generic fallback phrase.
  // Keeps the section concise — summary text is already bounded by getAcademyProfileSummaryText.
  if (academyProfileSummary && !academyProfileSummary.startsWith('Academy profile context is not available')) {
    lines.push('\n## Academy Context')
    lines.push(academyProfileSummary)
  }

  // 1.6. Sprint 2261–2290 — Memory Context (four tiers, conditional injection)

  // Tier 1: Prior session context — always inject when present
  if (priorSessionContext && priorSessionContext.sessions.length > 0) {
    lines.push('\n## Prior Session Memory')
    const [most, prev] = priorSessionContext.sessions
    lines.push(`Last session: ${most.sessionSummaryText}`)
    if (most.openItems.length > 0) {
      lines.push(`Open items from last session: ${most.openItems.join('; ')}`)
    }
    if (prev) {
      lines.push(`Earlier: ${prev.sessionSummaryText}`)
    }
  }

  // Tier 2: Decision memory — inject when present (loaded on first session of day)
  if (decisionMemoryContext && decisionMemoryContext.recentDecisions.length > 0) {
    lines.push('\n## Recent Director Decisions')
    for (const d of decisionMemoryContext.recentDecisions.slice(0, 3)) {
      lines.push(`- ${d.date}: ${d.action} → ${d.outcome}${d.targetArea ? ` (${d.targetArea})` : ''}`)
    }
    if (decisionMemoryContext.dominantArea) {
      lines.push(`Most active decision area: ${decisionMemoryContext.dominantArea}`)
    }
  }

  // Tier 3: Entity memory — inject when a specific entity is in context
  if (entityMemoryContext) {
    lines.push(`\n## ${entityMemoryContext.entityLabel} Context`)
    if (entityMemoryContext.operatingSummary) {
      lines.push(entityMemoryContext.operatingSummary)
    }
    if (entityMemoryContext.activePriorities.length > 0) {
      lines.push(`Active priorities: ${entityMemoryContext.activePriorities.join(', ')}`)
    }
    if (entityMemoryContext.recentSignals.length > 0) {
      lines.push(`Recent signals: ${entityMemoryContext.recentSignals.join('; ')}`)
    }
    if (entityMemoryContext.activeRecommendations.length > 0) {
      lines.push(`Active recommendations: ${entityMemoryContext.activeRecommendations.join('; ')}`)
    }
    if (entityMemoryContext.lastDiscussedAt) {
      lines.push(`Last discussed with DONNA: ${entityMemoryContext.lastDiscussedAt}`)
    }
  }

  // Tier 4: Academy memory — inject only on first session of day (≤150 tokens)
  if (academyMemoryContext) {
    lines.push('\n## Academy Operating Memory')
    if (academyMemoryContext.identityNarrative) {
      lines.push(academyMemoryContext.identityNarrative)
    }
    if (academyMemoryContext.dominantDecisionPattern) {
      lines.push(academyMemoryContext.dominantDecisionPattern)
    }
    if (academyMemoryContext.recentEvolutionSummary) {
      lines.push(academyMemoryContext.recentEvolutionSummary)
    }
    lines.push(`Approval rate (90 days): ${academyMemoryContext.approvalRatePercent}% on ${academyMemoryContext.totalApprovedDecisions} approved decisions`)
  }

  // 2. Current state
  lines.push('\n## Current State')
  lines.push(`Page: ${pageContext.pageLabel} (${pageContext.pathname})`)
  lines.push(`Pending review items: ${safeSignals.pendingReviews}${safeSignals.hasUrgentItems ? ' (URGENT)' : ''}`)
  if (safeSignals.hasMissingRecaps) lines.push('One or more past sessions are missing coach wrap-ups.')
  if (safeSignals.hasPlayersNeedingPlacement) lines.push('One or more players need a curriculum placement decision.')
  if (safeSignals.hasAdvancementEligiblePlayers) lines.push('One or more players are marked advancement-eligible.')
  lines.push(`Academy health: ${safeSignals.academyHealthSignal.replace('_', ' ')}`)
  // Sprint 1003 — inform LLM that player profile context is available (without raw ID)
  if (safeSignals.hasPlayerContext) {
    lines.push('Player profile context is available for this page. You may use the get_player_profile_summary tool to retrieve director-safe player signals. You cannot supply playerId — it is injected from the route context automatically.')
  }
  // Sprint 1004 — inform LLM that session context is available (without raw ID)
  if (safeSignals.hasSessionContext) {
    lines.push('Session context is available for this page. You may use the get_session_context tool to retrieve director/coach-safe session signals: status, template, coach, blocks, attendance counts, and wrap-up status. You cannot supply sessionId — it is injected from the route context automatically.')
  }

  // 3. Recommended next action
  if (safeSignals.nextActionId) {
    lines.push('\n## Recommended Next Action')
    lines.push(`Action: ${safeSignals.nextActionTitle ?? safeSignals.nextActionId}`)
    lines.push(`Safety: ${safeSignals.nextActionSafetyLevel ?? 'safe'}`)
    lines.push(`Requires approval: ${safeSignals.nextActionRequiresApproval ? 'Yes' : 'No'}`)
  }

  // 4. Page context
  lines.push('\n## Page Context')
  if (pageContext.highlightTargets.length > 0) {
    lines.push(`Highlight targets available: ${pageContext.highlightTargets.join(', ')}`)
  }
  if (pageContext.promptChips.length > 0) {
    lines.push(`Prompt suggestions available: ${pageContext.promptChips.join('; ')}`)
  }
  if (pageContext.hasApprovalGates) {
    lines.push('This page has approval gates — nothing executes automatically here.')
  }

  // 5. Available tools
  const safeTools = toolManifest.filter(t => t.safetyLevel === 'safe').map(t => t.id).join(', ')
  const gatedTools = toolManifest.filter(t => t.safetyLevel === 'approval_gated').map(t => t.id).join(', ')
  lines.push('\n## Available Tools')
  lines.push(`Safe (no confirmation needed): ${safeTools}`)
  lines.push(`Approval-gated (director must confirm): ${gatedTools}`)

  // 6. Safety rules (always included)
  lines.push('\n## Safety Rules (non-negotiable)')
  lines.push('1. Never approve, reject, or execute proposed_actions autonomously.')
  lines.push('2. Never send parent or player communications.')
  lines.push('3. Never change player levels, rosters, billing, or curriculum without explicit director action.')
  lines.push('4. Never expose raw coach notes, internal assessments, or player private data.')
  lines.push('5. Never bypass the review queue. All proposed changes go through it.')
  lines.push('6. If unsure: ask_clarifying_question. Do not guess at risky actions.')

  // 7. Output format
  lines.push('\n## Output Format')
  lines.push('Respond with one of: answer, recommend_next_action, highlight_target, explain_action, draft_proposed_action, route_to_review, ask_clarifying_question.')
  lines.push('Keep responses concise (under 200 words). Sound like a calm, experienced COO. No hype. No markdown headers in your response.')

  // 8. Conversation history (last 6 turns, oldest first)
  if (conversationHistory.length > 0) {
    lines.push('\n## Recent Conversation')
    conversationHistory.slice(-6).forEach(turn => {
      lines.push(`${turn.role === 'user' ? 'Director' : 'DONNA'}: ${turn.content.slice(0, 150)}`)
    })
  }

  return lines.join('\n')
}

// ── Sprint 1083 — History relevance filter ────────────────────────────────────

/**
 * Returns false when conversation history is unlikely to help the LLM answer
 * the current input — typically navigation commands, very short queries, and
 * single-word inputs that are clearly not follow-ups to a prior conversation.
 *
 * Keeps history for: multi-turn follow-ups, complex questions (>60 chars),
 * inputs that reference prior context ("that", "the last one", "those players").
 *
 * Skips history for: navigation commands, short queries, context-pack-style phrases.
 * Skips when no history exists (trivially correct).
 */
function isConversationHistoryRelevant(
  userInput: string,
  history: ConversationHistory,
): boolean {
  if (history.length === 0) return false

  const lower = userInput.toLowerCase().trim()

  // Very short inputs are almost certainly commands, not follow-ups
  if (lower.length < 20) return false

  // Navigation command patterns — these never need history
  if (/^(open|go to|take me to|show me|navigate to)\b/i.test(lower)) return false
  if (/^(approvals?|players?|sessions?|curriculum|academy health|settings|coaches?|today|templates?)\s*$/i.test(lower)) return false

  // Anaphoric / follow-up indicators — history is essential
  const needsHistory = /\b(that|those|them|it|the last|the previous|what you just|what you said|you mentioned|from before|earlier)\b/i.test(lower)
  if (needsHistory) return true

  // Long, complex questions — likely to benefit from context
  if (lower.length > 60) return true

  // Default: include history for medium-length inputs (could be follow-ups)
  return lower.length >= 30
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build a structured V2 context packet for the LLM.
 * Includes: system prompt, safe signals, page context, tool manifest,
 * conversation history, and compact summary.
 * No raw private data included.
 */
export function buildContextPacket(input: ContextPacketInput): ContextPacket {
  const {
    role,
    pathname,
    firstName,
    pendingReviews = 0,
    pageLabel,
    nextAction = null,
    actionExplanation = null,
    userInput,
    conversationHistory = [],
    academyState = {},
  } = input

  // Sprint 1083 — conversation history relevance filter.
  // Single-turn or command-style inputs do not benefit from injecting prior turns.
  // Saves up to ~900 chars (~280 tokens) on the most common non-conversational paths.
  // History is kept for: multi-turn follow-ups, ambiguous questions, complex analysis.
  // History is skipped for: navigation commands, very short inputs, context-pack style phrases.
  const historyIsRelevant = isConversationHistoryRelevant(userInput, conversationHistory)

  // Sanitize conversation history: cap at 10 turns, truncate content
  const sanitizedHistory: ConversationHistory = historyIsRelevant
    ? conversationHistory
        .slice(-10)
        .map((turn): ConversationTurn => ({
          ...turn,
          content: turn.content.slice(0, 200),
        }))
    : []

  const safeSignals: SafeSignals = {
    role,
    pathname,
    pageLabel: pageLabel ?? pathname,
    pendingReviews,
    hasUrgentItems: pendingReviews > 0,
    nextActionId: nextAction?.id ?? null,
    nextActionTitle: nextAction?.title ?? null,
    nextActionSafetyLevel: nextAction?.safetyLevel ?? null,
    nextActionRequiresApproval: nextAction?.requiresApproval ?? false,
    actionExplanationSafetyBadge: actionExplanation?.safetyBadge ?? null,
    actionExplanationChangesRecords: actionExplanation?.changesRecords ?? false,
    hasMissingRecaps: academyState.hasMissingRecaps ?? false,
    hasPlayersNeedingPlacement: academyState.hasPlayersNeedingPlacement ?? false,
    hasAdvancementEligiblePlayers: academyState.hasAdvancementEligiblePlayers ?? false,
    academyHealthSignal: academyState.academyHealthSignal ?? 'unknown',
    conversationTurnCount: sanitizedHistory.length,
    // Sprint 1002 — academyId stored in signals for live tool retrieval, never in LLM prompt
    academyId: input.academyId ?? null,
    // Sprint 1003 — playerId stored in signals, never guessed by LLM
    playerId: input.playerId ?? null,
    hasPlayerContext: !!input.playerId,
    // Sprint 1004 — sessionId stored in signals, never guessed by LLM
    sessionId: input.sessionId ?? null,
    hasSessionContext: !!input.sessionId,
  }

  const pageContext = buildPageContext(pathname)
  // Override pageLabel if provided
  if (pageLabel) pageContext.pageLabel = pageLabel

  const toolManifest = buildToolManifest(role, pathname)

  let systemPrompt = buildSystemPrompt(
    role,
    firstName,
    safeSignals,
    pageContext,
    toolManifest,
    sanitizedHistory,
    input.academyProfileSummary,
    input.priorSessionContext ?? null,
    input.decisionMemoryContext ?? null,
    input.entityMemoryContext ?? null,
    input.academyMemoryContext ?? null,
  )

  // Sprint 1018 — inject curriculum strategy framing when user input or page is curriculum-strategic
  const isCurriculumPage = pathname.startsWith('/director/curriculum')
  if (isCurriculumPage || isCurriculumStrategyQuery(userInput)) {
    systemPrompt = systemPrompt + '\n\n' + CURRICULUM_STRATEGY_PROMPT_SECTION
  }

  // Token budget estimation: compact (<500 chars input+history), standard (500-1500), extended (>1500)
  const totalInputSize = systemPrompt.length + userInput.length +
    sanitizedHistory.reduce((sum, t) => sum + t.content.length, 0)
  const tokenBudget: ContextPacket['tokenBudget'] =
    totalInputSize < 2000 ? 'compact' : totalInputSize < 6000 ? 'standard' : 'extended'

  const compactSummary = [
    `role:${role}`,
    `page:${pageContext.pageLabel}`,
    `pending:${pendingReviews}`,
    nextAction ? `next:${nextAction.id}` : 'next:none',
    `history:${sanitizedHistory.length}turns`,
    `budget:${tokenBudget}`,
  ].join(' ')

  return {
    systemPrompt,
    safeSignals,
    userInput: userInput.slice(0, 500),
    compactSummary,
    pageContext,
    toolManifest,
    conversationHistory: sanitizedHistory,
    tokenBudget,
  }
}

// ── Conversation history helpers ──────────────────────────────────────────────

/** Append a user turn to conversation history. Returns new array — does not mutate. */
export function appendUserTurn(history: ConversationHistory, content: string): ConversationHistory {
  const turn: ConversationTurn = {
    role: 'user',
    content: content.slice(0, 200),
    timestamp: Date.now(),
  }
  return [...history, turn].slice(-10)
}

/** Append a DONNA turn to conversation history. Returns new array — does not mutate. */
export function appendDonnaTurn(
  history: ConversationHistory,
  content: string,
  outputType?: import('./types').OrchestratorOutputType,
): ConversationHistory {
  const turn: ConversationTurn = {
    role: 'donna',
    content: content.slice(0, 200),
    timestamp: Date.now(),
    outputType,
  }
  return [...history, turn].slice(-10)
}

/** Build an AcademyStateSummary from available panel-state signals. No DB calls. */
export function buildAcademyStateSummary(params: {
  pendingReviews: number
  todaySessionCount?: number
  hasMissingRecaps?: boolean
  activePlayers?: number
  hasPlayersNeedingPlacement?: boolean
  hasAdvancementEligiblePlayers?: boolean
}): AcademyStateSummary {
  const { pendingReviews } = params
  const health: AcademyStateSummary['academyHealthSignal'] =
    pendingReviews >= 10 ? 'critical'
    : pendingReviews >= 3 || params.hasMissingRecaps ? 'attention_needed'
    : pendingReviews === 0 ? 'on_track'
    : 'attention_needed'

  return {
    pendingReviewCount: pendingReviews,
    todaySessionCount: params.todaySessionCount ?? 0,
    hasMissingRecaps: params.hasMissingRecaps ?? false,
    activePlayers: params.activePlayers ?? 0,
    hasPlayersNeedingPlacement: params.hasPlayersNeedingPlacement ?? false,
    hasAdvancementEligiblePlayers: params.hasAdvancementEligiblePlayers ?? false,
    academyHealthSignal: health,
  }
}
