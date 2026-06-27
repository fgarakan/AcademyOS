// Sprint 624 — DONNA Players Roster Intelligence V1
// Pure TypeScript — no DB calls, no server actions, no mutations, no UI imports.
// Answers roster attention questions from DirectorDonnaContext.attentionItems (which carry player names).

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Detection ──────────────────────────────────────────────────────────────────
// Detects "who needs attention?" style roster questions.
// Must not overlap with dashboard priority patterns.

export function detectRosterAttentionQuestion(text: string): boolean {
  const t = text.toLowerCase().trim()
  return (
    /who (needs?|need) (attention|help|review|checking|focus|support)/.test(t) ||
    /which players? (need|needs|require|requires|are|is) (review|attention|help|assessment|at risk|struggling|behind|stalling)/.test(t) ||
    /who (is|are|should) (at risk|falling behind|struggling|stalling|behind)/.test(t) ||
    /who should i (focus on|check on|talk to|prioritize|look at|review)/.test(t) ||
    /show (me )?(at.risk|flagged|struggling|at risk|attention) players?/.test(t) ||
    /players? (at risk|falling behind|need attention|without (a )?curriculum|missing curriculum)/.test(t) ||
    /who needs (an )?assessment/.test(t) ||
    /which players? (are|have been) (flagged|stalled|stalling)/.test(t) ||
    /who is ready (to advance|for level up)/.test(t) ||
    /advancement.ready players?/.test(t) ||
    /\bplayer roster\b/.test(t) ||
    /\broster (status|health|summary|overview)\b/.test(t) ||
    /which players? should i (check|review|look at)/.test(t) ||
    // Sprint 4351 — existence / enumeration-form attention questions. These are
    // the natural-language phrasings ("Are there any players that I need to…",
    // "Any players I should look at?", "Are there players who need attention?",
    // "Do any players need review?") that the canonical interrogatives above miss.
    // Every pattern is anchored on "players" so non-roster existence questions
    // ("are there any courts free?") never match.
    /\bplayers?\b\s*(that|who|whom|which)?\s*(i|we)\s+(need|needs|should|have|ought|gotta)\s+to\b/.test(t) ||
    /\bplayers?\b.*\b(i|we)\s+(should|need to|have to|want to|ought to|gotta)\s+(look at|check|review|see|address|worry about|flag|prioritize|focus on|deal with|talk to)\b/.test(t) ||
    /\bplayers?\s+(who|that|which)\s+(need|needs|require|requires)\s+(attention|review|help|assessment|checking|support)\b/.test(t) ||
    /\b(are there|is there|do (i|we) have|have we got)\b.*\bplayers?\b.*\b(need|needs|require|requires|to (review|check|see|look at|address)|attention|at risk|flagged|struggling|review)\b/.test(t) ||
    /\bdo (any |some )?players?\s+(need|needs|require|requires)\s+(review|attention|help|assessment|checking|a look)\b/.test(t)
  )
}

// ── Hub answer (uses DirectorDonnaContext.attentionItems with player names) ────

export function buildRosterHubAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const highRisk = ctx.attentionItems.filter(a => a.risk === 'high')
  const medRisk = ctx.attentionItems.filter(a => a.risk === 'medium')
  const prefix = ctx.isLive ? '' : '[Demo] '

  if (ctx.attentionItems.length === 0) {
    return {
      actionId: 'roster_attention',
      text: `${prefix}No players currently flagged from observation and attendance data. For full roster intelligence — curriculum gaps, advancement readiness, assessment due — go to the player directory. I can also help draft a parent-safe update for any player, which goes to review before anything is sent.`,
      confidence: ctx.confidence,
      sourceNote: ctx.isLive ? 'Live from observations and attendance' : 'Demo data',
      followUp: 'Want to see the full player directory?',
      href: '/director/players',
      isAnswerable: true,
    }
  }

  const highNames = highRisk
    .filter(a => a.playerName)
    .slice(0, 3)
    .map(a => a.playerName as string)

  const parts: string[] = []
  if (highRisk.length > 0) {
    const nameNote = highNames.length > 0 ? ` (${highNames.join(', ')})` : ''
    parts.push(`${highRisk.length} high-risk player${highRisk.length !== 1 ? 's' : ''}${nameNote}`)
  }
  if (medRisk.length > 0) {
    parts.push(`${medRisk.length} medium-risk player${medRisk.length !== 1 ? 's' : ''}`)
  }

  const topItem = highRisk[0] ?? medRisk[0]
  const reasonNote = topItem?.reason ? ` Most urgent: ${topItem.reason}.` : ''

  // Sprint 847: link directly to the top at-risk player's profile when a playerId is available,
  // instead of the general player list. buildFocusTargetForRoute already handles
  // /director/players/<uuid> routes with targetId: 'player-profile-header' (Sprint 841 prefix
  // fallback), so this link is compatible with DONNA's navigate+highlight system if used through
  // the dispatcher. The followUp CTA reflects the specific player when known.
  const playerHref = topItem?.playerId
    ? `/director/players/${topItem.playerId}`
    : '/director/players'
  const followUpText = topItem?.playerId && topItem?.playerName
    ? `View ${topItem.playerName}'s profile`
    : 'Want to see the full attention list?'

  return {
    actionId: 'roster_attention',
    text: `${prefix}${parts.join(' and ')} flagged for attention.${reasonNote} I can help draft a parent-safe update or coach summary for any of these players — it will go to your review queue before anything is sent. Visit the player directory for curriculum and advancement data.`,
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Live from observations and attendance' : 'Demo data',
    followUp: followUpText,
    href: playerHref,
    isAnswerable: true,
  }
}

// ── Combined detector + answerer ───────────────────────────────────────────────

export function tryAnswerRosterAttentionQuestion(
  text: string,
  directorCtx: DirectorDonnaContext | null,
): DonnaSafeReadAnswer | null {
  if (!detectRosterAttentionQuestion(text)) return null
  if (!directorCtx) return null
  return buildRosterHubAnswer(directorCtx)
}
