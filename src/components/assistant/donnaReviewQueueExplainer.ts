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

    case 'parent_update_pending_review':
      return {
        headline: 'This parent update draft is pending your review.',
        detail: `A parent-facing update draft was composed${item.playerLabel ? ` for ${item.playerLabel}` : ''} and saved for director review. It has not been sent to the parent or player. No visibility flags have been changed.`,
        safeMissingData: null,
        suggestedNextAction:
          'Approve the draft status to mark it reviewed, request clarification if you need more context, or discard it if it is no longer needed.',
        whatDonnaWillNotDo:
          "I will not send this update to the parent or player. I will not change any show_to_parent or show_to_student flag. Approving the draft status does not send the update — it only records your review decision.",
      }

    case 'level_readiness_pending_review':
      return {
        headline: 'This level readiness review is pending your decision.',
        detail: `A level readiness evidence summary was compiled${item.playerLabel ? ` for ${item.playerLabel}` : ''} and is awaiting director review. No level change has occurred. The player remains at their current level until you explicitly advance them.`,
        safeMissingData: item.previewText ? null : 'Level details were not available at draft time.',
        suggestedNextAction:
          'Mark reviewed to record your decision, or request clarification if the evidence needs more context.',
        whatDonnaWillNotDo:
          "I will not move the player to the next level. I will not update the player profile or curriculum state. Marking reviewed only records your review — the player's level is unchanged.",
      }

    case 'curriculum_adjustment_pending_review':
      return {
        headline: 'This curriculum adjustment proposal is pending your review.',
        detail:
          'A curriculum adjustment proposal was submitted and is awaiting director review. No curriculum data, templates, or requirements have been changed.',
        safeMissingData: null,
        suggestedNextAction:
          'Approve the proposal status to mark it reviewed, request clarification if you need more context, or discard it.',
        whatDonnaWillNotDo:
          "I will not change any curriculum requirements, templates, or drills. Approving the proposal status does not apply the change — it only records that you have reviewed the proposal.",
      }

    case 'coach_communication_pending_review':
      return {
        headline: 'This coach communication draft is pending your review.',
        detail: `A draft message intended for a coach was saved for director review. It has NOT been sent — no coach communication infrastructure exists in this system. This is an internal reference draft only.`,
        safeMissingData: null,
        suggestedNextAction:
          'Mark reviewed to close this item. If the message needs to be sent, handle that separately outside this system.',
        whatDonnaWillNotDo:
          'I will not send this draft to the coach. No messaging, email, or notification will be triggered. Marking reviewed only records your review decision.',
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
