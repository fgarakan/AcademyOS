// Mega Sprint 2561–2590 — DONNA Academy Director Questions Engine V1
//
// Deterministic answers for broad director questions, powered by
// AcademyIntelligencePacket data.
//
// These answers bypass the LLM entirely — zero hallucination risk,
// sub-millisecond latency, and grounded in real DB data.
//
// Covers: attention, focus, defer, advance, coach_support,
//         parent_followup, risk, opportunity, status.

import type { AcademyIntelligencePacket, DirectorQuestionType } from './academyIntelligenceEngine'

// ── Result type ───────────────────────────────────────────────────────────────

export interface DirectorQuestionResult {
  questionType:     DirectorQuestionType
  responseText:     string
  navigationHint:   string | null
  topEntityLabel:   string | null
  topEntityRoute:   string | null
  confidence:       'high' | 'medium'
}

// ── Answer engine ─────────────────────────────────────────────────────────────

export function answerAcademyDirectorQuestion(
  questionType: DirectorQuestionType,
  packet: AcademyIntelligencePacket,
): DirectorQuestionResult {
  const top = packet.attentionQueue[0] ?? null

  switch (questionType) {

    case 'attention': {
      if (packet.attentionQueue.length === 0) {
        return {
          questionType,
          responseText:   'No active attention items right now. Academy is on track.',
          navigationHint: null,
          topEntityLabel: null,
          topEntityRoute: null,
          confidence:     'high',
        }
      }
      const items = packet.attentionQueue.slice(0, 3)
      const listText = items.map((item, i) => `${i + 1}. ${item.playerName} — ${item.title} (${item.urgency}${item.isOverdue ? ', OVERDUE' : ''})`).join('\n')
      return {
        questionType,
        responseText:   `${items.length} items need attention:\n${listText}\n\nStart with ${items[0].playerName}: ${items[0].riskIfIgnored}`,
        navigationHint: items[0].playerRoute,
        topEntityLabel: items[0].playerName,
        topEntityRoute: items[0].playerRoute,
        confidence:     'high',
      }
    }

    case 'focus': {
      if (!top) {
        return {
          questionType,
          responseText:   'Academy is clear — no outstanding items. Consider a curriculum review or coaching check-in.',
          navigationHint: '/director',
          topEntityLabel: null,
          topEntityRoute: null,
          confidence:     'high',
        }
      }
      const second = packet.attentionQueue[1]
      const secondLine = second
        ? `After that: ${second.playerName} — ${second.title}.`
        : 'After that, the academy is clear.'
      return {
        questionType,
        responseText:   `Focus on ${top.playerName}: ${top.title}. It's ${top.urgency} priority${top.isOverdue ? ' and overdue' : ''}.\n\n${top.riskIfIgnored}\n\n${secondLine}`,
        navigationHint: top.playerRoute,
        topEntityLabel: top.playerName,
        topEntityRoute: top.playerRoute,
        confidence:     'high',
      }
    }

    case 'defer': {
      const deferCandidates = packet.attentionQueue
        .filter(i => i.urgency === 'low' || (i.urgency === 'medium' && i.daysSince < 7))
        .slice(0, 3)
      if (deferCandidates.length === 0) {
        return {
          questionType,
          responseText:   'All active items are urgent or immediate — nothing safe to defer right now.',
          navigationHint: null,
          topEntityLabel: null,
          topEntityRoute: null,
          confidence:     'high',
        }
      }
      const listText = deferCandidates.map(i => `- ${i.playerName}: ${i.title} (${i.daysSince}d pending)`).join('\n')
      return {
        questionType,
        responseText:   `These can wait without significant risk:\n${listText}\n\nMonitor weekly unless urgency changes.`,
        navigationHint: null,
        topEntityLabel: null,
        topEntityRoute: null,
        confidence:     'high',
      }
    }

    case 'advance': {
      if (packet.advancementCandidates.length === 0) {
        return {
          questionType,
          responseText:   'No players are currently marked advancement-eligible. Check recent assessment results or curriculum states.',
          navigationHint: '/director/players',
          topEntityLabel: null,
          topEntityRoute: null,
          confidence:     'high',
        }
      }
      const names = packet.advancementCandidates.map(c => c.name).join(', ')
      const first = packet.advancementCandidates[0]
      const plural = packet.advancementCandidates.length > 1
      return {
        questionType,
        responseText:   `${packet.advancementCandidates.length} player${plural ? 's are' : ' is'} ready to advance: ${names}.\n\nOpen ${first.name}'s profile to confirm and queue the advancement action.`,
        navigationHint: first.route,
        topEntityLabel: first.name,
        topEntityRoute: first.route,
        confidence:     'high',
      }
    }

    case 'coach_support': {
      return {
        questionType,
        responseText:   'Coach-level intelligence is not yet available at the academy summary level. Open a specific coach profile or check the review queue for coach-related items.',
        navigationHint: '/director',
        topEntityLabel: null,
        topEntityRoute: null,
        confidence:     'medium',
      }
    }

    case 'parent_followup': {
      if (packet.parentFollowupQueue.length === 0) {
        return {
          questionType,
          responseText:   'No parent follow-up items are flagged right now.',
          navigationHint: null,
          topEntityLabel: null,
          topEntityRoute: null,
          confidence:     'high',
        }
      }
      const items = packet.parentFollowupQueue.slice(0, 3)
      const listText = items.map(i => `- ${i.playerName}: ${i.title}`).join('\n')
      const plural = items.length > 1
      return {
        questionType,
        responseText:   `${items.length} parent follow-up${plural ? 's' : ''} pending:\n${listText}`,
        navigationHint: items[0].playerRoute,
        topEntityLabel: items[0].playerName,
        topEntityRoute: items[0].playerRoute,
        confidence:     'high',
      }
    }

    case 'risk': {
      if (packet.riskQueue.length === 0 && !top) {
        return {
          questionType,
          responseText:   'No active risk items flagged. Academy is on track.',
          navigationHint: null,
          topEntityLabel: null,
          topEntityRoute: null,
          confidence:     'high',
        }
      }
      const riskItem = packet.riskQueue[0] ?? top!
      return {
        questionType,
        responseText:   `Biggest risk: ${riskItem.playerName} — ${riskItem.title}.\n\n${riskItem.riskIfIgnored}\n\nOpen their profile to review and queue an action.`,
        navigationHint: riskItem.playerRoute,
        topEntityLabel: riskItem.playerName,
        topEntityRoute: riskItem.playerRoute,
        confidence:     'high',
      }
    }

    case 'opportunity': {
      if (packet.advancementCandidates.length > 0) {
        const first = packet.advancementCandidates[0]
        return {
          questionType,
          responseText:   `Biggest opportunity: ${first.name} is ready to advance. Confirm and queue the advancement — this strengthens their development track and shows parents visible progress.`,
          navigationHint: first.route,
          topEntityLabel: first.name,
          topEntityRoute: first.route,
          confidence:     'high',
        }
      }
      return {
        questionType,
        responseText:   'No clear advancement opportunities flagged right now. Focus on clearing the attention queue to create headroom for development.',
        navigationHint: null,
        topEntityLabel: null,
        topEntityRoute: null,
        confidence:     'medium',
      }
    }

    case 'status': {
      const healthLabel =
        packet.overallHealthSignal === 'on_track'         ? 'stable' :
        packet.overallHealthSignal === 'attention_needed' ? 'needs attention' :
        'critical'
      const topLine = packet.attentionQueue[0]
        ? `Top item: ${packet.attentionQueue[0].playerName} — ${packet.attentionQueue[0].title}.`
        : 'No urgent items outstanding.'
      return {
        questionType,
        responseText:   `Academy health: ${healthLabel}.\n${packet.playerCount} active players. ${packet.activeRecommendationCount} open recommendation${packet.activeRecommendationCount !== 1 ? 's' : ''}. ${packet.pendingActionsCount} pending approval${packet.pendingActionsCount !== 1 ? 's' : ''}.\n\n${topLine}`,
        navigationHint: '/director',
        topEntityLabel: top ? top.playerName : null,
        topEntityRoute: top ? top.playerRoute : null,
        confidence:     'high',
      }
    }

    default:
      return {
        questionType,
        responseText:   'Academy intelligence is loading.',
        navigationHint: null,
        topEntityLabel: null,
        topEntityRoute: null,
        confidence:     'medium',
      }
  }
}
