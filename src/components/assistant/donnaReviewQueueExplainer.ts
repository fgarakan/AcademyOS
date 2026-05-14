// Donna Review Queue Explainer — Sprint 273
// Pure deterministic helper. No AI, no DB, no API, no async.
// Given a DonnaReviewItem, returns a plain-language explanation for the director.

import type { DonnaReviewItem, DonnaReviewItemExplanation } from './donnaReviewQueueTypes'

export function explainReviewItem(item: DonnaReviewItem): DonnaReviewItemExplanation {
  switch (item.type) {
    case 'coach_note_pending_review':
      return {
        headline: 'This note is pending director review.',
        detail: `A voice note was captured${item.playerLabel ? ` for ${item.playerLabel}` : ''} and saved as pending review. It is internal only — not visible to parents or players until you explicitly approve it through the full review queue.`,
        safeMissingData: item.sessionId ? null : 'No session is linked to this note.',
        suggestedNextAction: 'Mark reviewed to close this item, or keep it pending if further director action is needed.',
        whatDonnaWillNotDo:
          "I will not send this note to parents or players, move the player's level, make curriculum changes, or notify any coach.",
      }

    case 'unlinked_voice_note':
      return {
        headline: 'This note is not yet linked to a player.',
        detail:
          'A voice or text note was captured but the player was not confirmed at the time of capture. It needs to be routed to the correct player record before it can be used in development decisions.',
        safeMissingData:
          'Player identity is not confirmed — routing uses the resolver to find the right player.',
        suggestedNextAction:
          'Use "Route to Player" to link this note to a player record, or mark reviewed if this note is no longer needed.',
        whatDonnaWillNotDo:
          "I will not guess the player from the note text. I will not send this note to anyone. Routing links an internal record only — it does not publish the note.",
      }

    case 'session_needs_blocks':
      return {
        headline: 'This planned session has no blocks yet.',
        detail: `The session "${item.sessionLabel ?? item.title}" is in planned status but no session blocks have been copied from a template yet. Blocks define what activities will happen during the session.`,
        safeMissingData: 'No session blocks exist for this session.',
        suggestedNextAction:
          'Click "Populate Blocks" to start the guided block population task. Your explicit approval is required before any blocks are written.',
        whatDonnaWillNotDo:
          'I will not populate blocks directly or automatically. The populate task requires your explicit approval. No coach, parent, or player is notified.',
      }

    default:
      return {
        headline: 'This item needs director review.',
        detail: item.whyItNeedsReview || 'This item was flagged for director attention.',
        safeMissingData: null,
        suggestedNextAction: 'Review the item and take action as needed.',
        whatDonnaWillNotDo: 'I will not make any automatic changes to this item.',
      }
  }
}
