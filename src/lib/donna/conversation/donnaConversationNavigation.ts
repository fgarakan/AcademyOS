// Mega Sprint 2471–2500 — DONNA Conversational Operating System V1
//
// Conversational Navigation — maps natural director intent to a destination
// route without requiring the director to know what page to go to.
//
// The director thinks in goals, not pages.
// DONNA determines the destination automatically.
//
// Examples:
//   "I need to add a drill"              → /director/curriculum
//   "I need a new Green Ball template"   → /director/class-templates
//   "Show me Alex"                       → entity resolution → /director/players/:id
//   "Review that recommendation"         → /director/review
//   "Where are my pending approvals?"    → /director/review
//   "I want to see the schedule"         → /director/sessions
//   "Check on the coaches"              → (entity resolution for coaches)
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Returns null when input is not a navigation intent.
//   - Entity-specific navigation (show me Alex) is handled by entity resolution —
//     this module handles topic/goal navigation only.

import type { ConversationOperatingContext } from './donnaConversationOperatingContext'
import { isContextThreadActive } from './donnaConversationOperatingContext'

// ── Navigation result ─────────────────────────────────────────────────────────

export interface ConversationalNavigationResult {
  destination:    string
  destinationLabel: string
  responseText:   string
  confidence:     'high' | 'medium'
}

// ── Route map ─────────────────────────────────────────────────────────────────

interface NavEntry {
  patterns:    RegExp[]
  destination: string
  label:       string
  response:    string
}

const NAV_TABLE: NavEntry[] = [
  {
    patterns: [
      /\b(add|create|build|write|draft)\s+(a |an )?(new )?(drill|skill|objective|curriculum item|knowledge|content)\b/i,
      /\b(curriculum|knowledge library|knowledge builder)\b/i,
      /\bi need (to )?(add|create|build).+(drill|skill|objective)\b/i,
    ],
    destination: '/director/curriculum',
    label:       'Curriculum Builder',
    response:    "Taking you to the Curriculum Builder — that's where you can add drills, skills, and objectives.",
  },
  {
    patterns: [
      /\b(class template|session template|new template|create.+template|add.+template|template for)\b/i,
      /\bi need (a |an )?(new )?(green|red|orange|yellow|hp|high.?perf).+(template|class)\b/i,
    ],
    destination: '/director/class-templates',
    label:       'Class Templates',
    response:    "Taking you to Class Templates — you can create or modify session templates there.",
  },
  {
    patterns: [
      /\b(pending approval|review queue|approvals?|what needs (my |my\s+)?review|what('?s| is) (pending|waiting))\b/i,
      /\b(i need to (approve|review|sign off)|waiting for (my |my\s+)?approval)\b/i,
      /\bopen (the )?review queue\b/i,
    ],
    destination: '/director/review',
    label:       'Review Queue',
    response:    "Opening the Review Queue — that's where everything pending your approval lives.",
  },
  {
    patterns: [
      /\b(sessions?|schedule|today'?s? sessions?|upcoming sessions?|coach sessions?)\b/i,
      /\b(see|check|open|look at)\s+(the )?(sessions?|schedule)\b/i,
    ],
    destination: '/director/sessions',
    label:       'Sessions',
    response:    "Taking you to Sessions — you can see the full schedule and session details there.",
  },
  {
    patterns: [
      /\b(players?|roster|player (list|directory|overview))\b/i,
      /\b(see|check|open|look at|show me)\s+(the |my )?(players?|roster)\b/i,
      /\bwho (are|is) (my |the |on the |in the )?(players?|roster)\b/i,
    ],
    destination: '/director/players',
    label:       'Player Directory',
    response:    "Taking you to the Player Directory — all players and their current status are there.",
  },
  {
    patterns: [
      /\b(kpi|academy health|academy (stats?|metrics?|numbers?|overview)|how('?s| is) the academy (doing|performing))\b/i,
      /\b(health (dashboard|score|report)|academy (performance|report))\b/i,
    ],
    destination: '/director/kpi',
    label:       'Academy Health',
    response:    "Taking you to Academy Health — that's the KPI and health overview for your academy.",
  },
  {
    patterns: [
      /\b(today|today'?s? (dashboard|overview|brief|priorities)|home|dashboard)\b/i,
      /\b(back to (home|start|dashboard|main))\b/i,
      /\bwhat should i (do|focus on|start with) today\b/i,
    ],
    destination: '/director',
    label:       'Director Dashboard',
    response:    "Taking you back to the Director Dashboard — that's your home base.",
  },
]

// ── Context-aware navigation ───────────────────────────────────────────────────

/** Get context-enriched navigation suggestions for entity-specific commands. */
function getEntityNavigation(
  lower: string,
  ctx: ConversationOperatingContext,
): ConversationalNavigationResult | null {
  if (!isContextThreadActive(ctx)) return null

  // "Show me [entity name]" — when entity is already in context
  const showEntityPattern = /^show me\s+/i
  if (showEntityPattern.test(lower) && ctx.currentEntityLabel) {
    const inputName = lower.replace(/^show me\s+/i, '').trim()
    // If the phrase roughly matches the current entity, navigate there
    if (inputName.length > 0 && ctx.currentEntityRoute &&
        (ctx.currentEntityLabel.toLowerCase().includes(inputName) || inputName.includes(ctx.currentEntityLabel.toLowerCase()))) {
      return {
        destination:      ctx.currentEntityRoute,
        destinationLabel: ctx.currentEntityLabel,
        responseText:     `Opening ${ctx.currentEntityLabel}'s profile.`,
        confidence:       'high',
      }
    }
  }

  // "Review that recommendation" / "review their recommendation"
  if (/\breview.+recommendation\b/i.test(lower) && ctx.currentEntityRoute) {
    return {
      destination:      ctx.currentEntityRoute,
      destinationLabel: ctx.currentEntityLabel ?? 'Entity profile',
      responseText:     ctx.currentRecommendationTitle
        ? `Let me take you to ${ctx.currentEntityLabel ?? 'the profile'} to review "${ctx.currentRecommendationTitle}".`
        : `Taking you to ${ctx.currentEntityLabel ?? 'the entity profile'} to review the recommendations.`,
      confidence: 'high',
    }
  }

  return null
}

// ── Main navigator ────────────────────────────────────────────────────────────

/**
 * Detect and resolve a natural language navigation intent.
 * Returns null if input is not a navigation request.
 *
 * Entity-specific navigation ("Show me Alex") is handled upstream by
 * entity intent detection in donnaOrchestratorAction — this handles
 * topic/goal-based navigation.
 */
export function resolveConversationalNavigation(
  userInput: string,
  ctx: ConversationOperatingContext | null,
): ConversationalNavigationResult | null {
  const lower = userInput.toLowerCase().trim()

  // ── Context-aware entity navigation (when entity is in thread) ────────────
  if (ctx) {
    const entityNav = getEntityNavigation(lower, ctx)
    if (entityNav) return entityNav
  }

  // ── Topic/goal navigation table ───────────────────────────────────────────
  for (const entry of NAV_TABLE) {
    if (entry.patterns.some(p => p.test(userInput))) {
      return {
        destination:      entry.destination,
        destinationLabel: entry.label,
        responseText:     entry.response,
        confidence:       'high',
      }
    }
  }

  return null
}

// ── Navigation context section for system prompt ──────────────────────────────

/**
 * Build a "## Natural Navigation" section for the system prompt.
 * Tells DONNA which page/route is available for the current context.
 * Injected into contextPacket.ts when navigation context is available.
 */
export function buildNavigationContextSection(ctx: ConversationOperatingContext): string {
  if (!isContextThreadActive(ctx)) return ''

  const lines: string[] = []

  if (ctx.currentNavigationTarget && ctx.currentNavigationLabel) {
    lines.push('\n## Natural Navigation Context')
    lines.push(`When the director asks to navigate, open, or show something — use this route: ${ctx.currentNavigationTarget} (${ctx.currentNavigationLabel})`)
    lines.push('Commands "open it", "show me", "take me there", "go there" all point to the entity route above.')
  }

  return lines.join('\n')
}
