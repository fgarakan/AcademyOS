// Blueprint Update Recommendation Engine V1
//
// Takes an assessment comparison result and produces structured recommendations
// for what to do with the current blueprint after a reassessment.
//
// Pure TypeScript — no DB, no API, no mutations, no side effects.
// All recommendations require director approval before anything changes.

import type { AssessmentComparisonResult } from './assessmentComparisonEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BlueprintUpdateAction =
  | 'keep'                      // No significant changes — keep current blueprint
  | 'update_priorities'         // Update priorities but keep level and missions
  | 'archive_and_regenerate'    // Significant changes — archive old, generate new blueprint
  | 'trigger_level_review'      // Performance suggests player may be ready for level move
  | 'trigger_parent_update'     // Progress worth communicating to parents
  | 'flag_concern'              // Decline significant enough to flag for discussion

export interface BlueprintRecommendation {
  action: BlueprintUpdateAction
  priority: 'high' | 'medium' | 'low'
  label: string
  rationale: string
  requiresDirectorApproval: boolean
  /**
   * True when this recommendation should create a proposed_action in the review queue.
   * Director reviews and approves before system applies any change.
   */
  routesToReviewQueue: boolean
}

export interface BlueprintUpdateRecommendations {
  /** Primary recommended action */
  primaryAction: BlueprintUpdateAction
  /** All recommendations, ordered by priority */
  recommendations: BlueprintRecommendation[]
  /** Human-readable summary of all recommendations */
  summaryText: string
  /**
   * Quick-read label for the director:
   * 'no_change' | 'update_recommended' | 'review_required' | 'concern_flagged'
   */
  overallStatus: 'no_change' | 'update_recommended' | 'review_required' | 'concern_flagged'
}

// ── Recommendation builders ────────────────────────────────────────────────────

function keepRecommendation(): BlueprintRecommendation {
  return {
    action: 'keep',
    priority: 'low',
    label: 'Keep current blueprint',
    rationale: 'The assessment shows stable progress consistent with the current development focus. No blueprint changes recommended at this time.',
    requiresDirectorApproval: false,
    routesToReviewQueue: false,
  }
}

function updatePrioritiesRecommendation(changedDomains: string[]): BlueprintRecommendation {
  return {
    action: 'update_priorities',
    priority: 'medium',
    label: 'Update development priorities',
    rationale: `${changedDomains.join(', ')} showed meaningful changes in this assessment. The development priorities in the blueprint should be refreshed to reflect the current state.`,
    requiresDirectorApproval: true,
    routesToReviewQueue: true,
  }
}

function regenerateBlueprintRecommendation(): BlueprintRecommendation {
  return {
    action: 'archive_and_regenerate',
    priority: 'high',
    label: 'Generate new development blueprint',
    rationale: 'Significant overall progress since the last blueprint was generated. Archiving the current blueprint and generating a fresh one will better reflect the player\'s current development needs.',
    requiresDirectorApproval: true,
    routesToReviewQueue: true,
  }
}

function levelReviewRecommendation(): BlueprintRecommendation {
  return {
    action: 'trigger_level_review',
    priority: 'high',
    label: 'Trigger level readiness review',
    rationale: 'The assessment results suggest this player may be approaching readiness for the next curriculum level. A level readiness review should be initiated — no movement happens without director approval.',
    requiresDirectorApproval: true,
    routesToReviewQueue: true,
  }
}

function parentUpdateRecommendation(): BlueprintRecommendation {
  return {
    action: 'trigger_parent_update',
    priority: 'medium',
    label: 'Draft parent progress update',
    rationale: 'The assessment shows notable progress that would be meaningful for parents to know. A parent-safe update draft should be created for director review before sharing.',
    requiresDirectorApproval: true,
    routesToReviewQueue: true,
  }
}

function flagConcernRecommendation(domains: string[]): BlueprintRecommendation {
  return {
    action: 'flag_concern',
    priority: 'high',
    label: 'Flag development concern for review',
    rationale: `${domains.join(', ')} show significant decline since the last assessment. This warrants a focused coaching review and may require mission or focus area adjustments.`,
    requiresDirectorApproval: true,
    routesToReviewQueue: true,
  }
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * Generate blueprint update recommendations from an assessment comparison.
 * All high-priority recommendations route to the director review queue.
 * No automatic mutations — director approval required for all changes.
 */
export function generateBlueprintUpdateRecommendations(
  comparison: AssessmentComparisonResult,
): BlueprintUpdateRecommendations {
  const recs: BlueprintRecommendation[] = []

  // Identify changed domains for labeling
  const improvedDomains = comparison.domains
    .filter(d => d.domain !== 'overall' && d.notableProgress)
    .map(d => d.label)

  const declinedDomains = comparison.domains
    .filter(d => d.domain !== 'overall' && (d.changeLabel === 'decline' || d.changeLabel === 'strong_decline'))
    .map(d => d.label)

  // Flag concerns first (highest urgency)
  if (comparison.hasSignificantDecline && declinedDomains.length > 0) {
    recs.push(flagConcernRecommendation(declinedDomains))
  }

  // Level review if strong overall progress
  if (comparison.readyForLevelReview) {
    recs.push(levelReviewRecommendation())
  }

  // Blueprint regeneration if significant changes
  if (comparison.blueprintUpdateRecommended && comparison.overallImproved && comparison.improved >= 3) {
    recs.push(regenerateBlueprintRecommendation())
  } else if (comparison.blueprintUpdateRecommended && improvedDomains.length >= 2) {
    recs.push(updatePrioritiesRecommendation(improvedDomains))
  }

  // Parent update if notable progress and no concerns
  if (comparison.overallImproved && !comparison.hasSignificantDecline && comparison.improved >= 2) {
    recs.push(parentUpdateRecommendation())
  }

  // Default: keep if no significant changes
  if (recs.length === 0) {
    recs.push(keepRecommendation())
  }

  // Determine primary action and overall status
  const primaryAction = recs[0].action
  let overallStatus: BlueprintUpdateRecommendations['overallStatus']

  if (primaryAction === 'keep') {
    overallStatus = 'no_change'
  } else if (primaryAction === 'flag_concern') {
    overallStatus = 'concern_flagged'
  } else if (primaryAction === 'trigger_level_review' || primaryAction === 'archive_and_regenerate') {
    overallStatus = 'review_required'
  } else {
    overallStatus = 'update_recommended'
  }

  // Build summary
  const summaryLines = [
    `Blueprint update assessment (${comparison.daysBetween} days since last assessment):`,
    comparison.summaryText.split('\n').find(l => l.startsWith('Summary:')) ?? '',
    '',
    'Recommendations:',
    ...recs.map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.label} — ${r.rationale.slice(0, 80)}...`),
  ].filter(Boolean)

  return {
    primaryAction,
    recommendations: recs,
    summaryText: summaryLines.join('\n'),
    overallStatus,
  }
}
