// Donna Review Queue Types — Sprint 273
// In-panel quick review layer. No DB, no API, no AI.

// ---------------------------------------------------------------------------
// Item classification
// ---------------------------------------------------------------------------

export type DonnaReviewItemType =
  | 'coach_note_pending_review'   // voice_note pending_review with player_id set
  | 'unlinked_voice_note'         // voice_note pending_review with player_id null
  | 'session_needs_blocks'        // planned session with no session_blocks
  | 'unknown'

export type DonnaReviewItemStatus =
  | 'pending_review'
  | 'needs_routing'
  | 'reviewed'
  | 'blocked'
  | 'unsupported'

export type DonnaReviewItemPriority = 'low' | 'medium' | 'high'

export type DonnaReviewQueueActionType =
  | 'mark_reviewed'
  | 'route_to_player'
  | 'route_to_session'
  | 'start_populate_blocks'

// ---------------------------------------------------------------------------
// Review item
// ---------------------------------------------------------------------------

export interface DonnaReviewItem {
  id: string
  type: DonnaReviewItemType
  title: string
  summary: string
  status: DonnaReviewItemStatus
  priority: DonnaReviewItemPriority
  createdAt: string
  playerId: string | null
  playerLabel: string | null
  sessionId: string | null
  sessionLabel: string | null
  /** Table the item was sourced from */
  sourceTable: string
  /** Primary key of the source row */
  sourceId: string
  tags: string[]
  whyItNeedsReview: string
  allowedActions: DonnaReviewQueueActionType[]
  blockedActions: DonnaReviewQueueActionType[]
  safetyNotes: string[]
  /** Truncated preview of the raw note text */
  previewText: string
}

// ---------------------------------------------------------------------------
// Summary returned from getDonnaReviewQueueAction
// ---------------------------------------------------------------------------

export interface DonnaReviewQueueSummary {
  totalCount: number
  pendingReviewCount: number
  needsRoutingCount: number
  sessionNeedsBlocksCount: number
  items: DonnaReviewItem[]
  fetchedAt: string
}

// ---------------------------------------------------------------------------
// Action result
// ---------------------------------------------------------------------------

export interface DonnaReviewQueueActionResult {
  ok: boolean
  status: 'success' | 'blocked' | 'error'
  message: string
  safetyNotes: string[]
}

// ---------------------------------------------------------------------------
// Explanation shape (returned by donnaReviewQueueExplainer)
// ---------------------------------------------------------------------------

export interface DonnaReviewItemExplanation {
  headline: string
  detail: string
  safeMissingData: string | null
  suggestedNextAction: string
  whatDonnaWillNotDo: string
}
