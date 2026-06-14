// Mega Sprint 2471–2500 — DONNA Conversational Operating System V1
//
// Proactive COO Dialogue — instruction section and trigger logic for
// DONNA to naturally volunteer useful information during entity discussions.
//
// Target behavior:
//   Director: "How's Alex?"
//   DONNA: "Alex is doing well. One thing I'd watch is advancement readiness.
//            The recommendation has been waiting 17 days. Would you like to review it?"
//
// Not robotic. Not a dashboard. A COO talking.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Only triggers when there is something specific to volunteer (rec or signal).
//   - Injected into contextPacket.ts as a system prompt section.
//   - Under 100 words when triggered. Sound like a COO.

import type { ConversationOperatingContext } from './donnaConversationOperatingContext'
import type { EntityMemoryContext } from '@/lib/donna/memory/donnaMemoryContextTypes'
import { isContextThreadActive } from './donnaConversationOperatingContext'

// ── Proactive signal ──────────────────────────────────────────────────────────

export interface ProactiveCOOSignal {
  topic:       string
  insight:     string
  urgency:     'high' | 'medium' | 'low'
  prompt:      string   // The natural closing line ("Would you like to review it?")
}

// ── Signal builder from entity context ───────────────────────────────────────

/**
 * Extract the most important proactive signal from entity context.
 * Returns null when there is nothing worth volunteering.
 */
export function buildProactiveCOOSignal(
  em: EntityMemoryContext | null,
  ctx: ConversationOperatingContext | null,
): ProactiveCOOSignal | null {
  if (!em) return null

  // ── 1. Overdue recommendation ─────────────────────────────────────────────
  const typedRecs = em.typedRecommendations ?? []
  const overdueRec = typedRecs.find(r => r.isOverdue && r.followUpRequired)
  if (overdueRec) {
    const daysSince = overdueRec.reviewDate
      ? Math.floor((Date.now() - new Date(overdueRec.reviewDate).getTime()) / (1000 * 60 * 60 * 24))
      : null
    const age = daysSince !== null && daysSince > 0 ? ` — ${daysSince} day${daysSince !== 1 ? 's' : ''} overdue` : ''
    return {
      topic:   overdueRec.recommendationType.replace(/_/g, ' '),
      insight: `"${overdueRec.title}" is overdue${age}`,
      urgency: 'high',
      prompt:  'Would you like to review it?',
    }
  }

  // ── 2. Urgent active recommendation ──────────────────────────────────────
  const urgentRec = typedRecs.find(r => (r.urgency === 'urgent' || r.urgency === 'immediate') && r.followUpRequired)
  if (urgentRec) {
    return {
      topic:   urgentRec.recommendationType.replace(/_/g, ' '),
      insight: `there is an urgent recommendation: "${urgentRec.title}"`,
      urgency: 'high',
      prompt:  'Want me to draft the action for your review?',
    }
  }

  // ── 3. High health score with pending recommendation ──────────────────────
  if (em.healthScore !== undefined && em.healthScore >= 8 && typedRecs.length > 0) {
    const rec = typedRecs[0]
    return {
      topic:   'overall status',
      insight: `things look good overall, but there is one open item: "${rec.title}"`,
      urgency: 'low',
      prompt:  'Should I surface it for review?',
    }
  }

  // ── 4. Low health score with active priorities ────────────────────────────
  if (em.healthScore !== undefined && em.healthScore <= 4 && em.activePriorities.length > 0) {
    return {
      topic:   'health signal',
      insight: `there are some signals worth watching: ${em.activePriorities.slice(0, 2).join('; ')}`,
      urgency: 'medium',
      prompt:  'Would you like to go deeper on any of these?',
    }
  }

  return null
}

// ── System prompt section builder ─────────────────────────────────────────────

/**
 * Build the "## Proactive COO Guidance" section of the system prompt.
 *
 * When injected, DONNA is instructed to naturally volunteer one insight
 * at the END of an entity answer — not as a data dump, but as a natural
 * COO remark.
 *
 * Only injected when:
 *   - A specific signal exists (recommendation, health flag, stale item)
 *   - The entity thread is active
 *   - The current input is a status/health query (not an action command)
 */
export function buildProactiveCOOSection(
  signal: ProactiveCOOSignal | null,
  entityLabel: string | null,
): string {
  if (!signal || !entityLabel) return ''

  const urgencyWord = signal.urgency === 'high' ? 'One thing I\'d watch is' : 'One thing worth noting is'

  return `\n## Proactive COO Guidance
At the end of your answer about ${entityLabel}, naturally volunteer this insight in 1–2 sentences:
${urgencyWord} ${signal.topic}. ${signal.insight}. ${signal.prompt}

Rules:
- Do NOT list this as a bullet or header. Weave it naturally into the response.
- Sound like a COO talking, not a dashboard printing data.
- This is the LAST sentence of your response — not the intro.
- Do not repeat this if the director is already asking about this topic directly.`
}

// ── Trigger gate ──────────────────────────────────────────────────────────────

/**
 * Returns true when the current user input is a status/health query
 * that warrants proactive COO volunteering.
 * Returns false for action commands (avoid volunteering during "let's do it").
 */
export function shouldTriggerProactiveCOO(
  userInput: string,
  ctx: ConversationOperatingContext | null,
): boolean {
  if (!ctx || !isContextThreadActive(ctx) || !ctx.currentEntityLabel) return false

  const lower = userInput.toLowerCase().trim()

  // Status/health queries → yes
  if (/\b(how('?s| is)|what('?s| is) (the )?status|doing|going|update me|tell me about|what'?s up with)\b/i.test(lower)) return true
  // General entity open questions
  if (/\b(how are|is|are (they|he|she)|what about)\b/i.test(lower) && lower.length < 50) return true

  // Action commands → no (don't volunteer during "let's do it")
  if (/\b(approve|let'?s do it|do it|open it|show me|apply|create|archive)\b/i.test(lower)) return false

  return false
}
