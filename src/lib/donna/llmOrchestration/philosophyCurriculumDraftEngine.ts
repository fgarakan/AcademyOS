// Sprint 1020 — Philosophy-to-Curriculum Draft Engine V1
// Converts academy philosophy gap analysis into safe curriculum change draft proposals.
// Pure TypeScript — no DB writes, no API calls, no mutations.
//
// Purpose:
//   When a director asks DONNA to suggest curriculum changes based on philosophy
//   analysis ("we need more fitness content for orange level"), DONNA should be able to
//   produce a structured draft proposal that:
//     1. Describes the proposed change clearly
//     2. Links it to the philosophy profile gap
//     3. Routes it to the Review Queue for director approval (never auto-applies)
//     4. Includes the standard "nothing changes until you approve" safety note
//
// Safety invariants:
//   - Draft proposals are display-only structures
//   - They describe what SHOULD go into a proposed_action — they do not create one
//   - Creating an actual proposed_action requires a server action + director confirmation
//   - This module only produces the draft description, not the DB record
//   - No player names, coach notes, or private data in any draft
//
// Usage:
//   const proposal = buildCurriculumDraftProposal(gap, profile)
//   // Show proposal to director → director can choose to submit for Review Queue

import type { AcademyPhilosophyProfile, PhilosophyGapSignal, CurriculumStage } from './academyPhilosophyProfile'

// ── Draft proposal types ──────────────────────────────────────────────────────

export type CurriculumChangeType =
  | 'add_content_to_stage'     // Add content to an underserved curriculum stage
  | 'rebalance_domain'         // Adjust content domain balance (e.g. add more fitness)
  | 'define_stage_structure'   // Create stage structure where none exists
  | 'review_stage_coverage'    // Flag a stage for coverage review

export interface CurriculumDraftProposal {
  /** Human-readable title for this proposal */
  title: string
  /** What this change proposes — safe, no raw notes */
  description: string
  /** The change type */
  changeType: CurriculumChangeType
  /** Which curriculum stage this targets */
  targetStage: CurriculumStage | null
  /** Which content domain this targets (if domain-specific) */
  targetDomain: string | null
  /** The philosophy gap this addresses */
  gapRationale: string
  /** Safety level — always review_only for curriculum changes */
  safetyLevel: 'review_only'
  /** Explicit confirmation that nothing changes until director approves */
  approvalNote: string
  /** Suggested action label for the Review Queue button */
  reviewActionLabel: string
  /** Whether this proposal is derived from philosophy analysis (vs. director-initiated) */
  source: 'philosophy_analysis'
}

// ── Approval note ─────────────────────────────────────────────────────────────

const STANDARD_APPROVAL_NOTE =
  'This is a draft proposal only. Nothing changes in your curriculum until you review and approve it in the Review Queue.'

// ── Proposal builders ─────────────────────────────────────────────────────────

/**
 * Build a curriculum draft proposal from a philosophy gap signal.
 * Pure TypeScript — does not write to DB.
 * The proposal describes what should be submitted to the Review Queue.
 */
export function buildProposalFromGap(
  gap: PhilosophyGapSignal,
  profile: AcademyPhilosophyProfile,
): CurriculumDraftProposal {
  // Stage-coverage gap
  const stageFromGap = extractStageFromGap(gap)

  if (gap.gapDescription.includes('No curriculum content')) {
    return {
      title: 'Define Initial Curriculum Structure',
      description: `Your curriculum does not have any content defined yet. Based on your academy's ${profile.developmentEmphasis.replace(/_/g, ' ')} approach, creating a curriculum structure for ${profile.primaryStages.join(', ')} stages would be the recommended starting point.`,
      changeType: 'define_stage_structure',
      targetStage: profile.primaryStages[0] ?? null,
      targetDomain: null,
      gapRationale: gap.gapDescription,
      safetyLevel: 'review_only',
      approvalNote: STANDARD_APPROVAL_NOTE,
      reviewActionLabel: 'Review curriculum structure proposal',
      source: 'philosophy_analysis',
    }
  }

  if (stageFromGap) {
    return {
      title: `Add Content to ${capitalize(stageFromGap)} Stage`,
      description: `Your philosophy profile identifies ${stageFromGap} as a primary curriculum stage, but content may not be defined for it yet. Adding stage-appropriate content would align your curriculum with your stated development philosophy.`,
      changeType: 'add_content_to_stage',
      targetStage: stageFromGap,
      targetDomain: null,
      gapRationale: gap.gapDescription,
      safetyLevel: 'review_only',
      approvalNote: STANDARD_APPROVAL_NOTE,
      reviewActionLabel: `Review ${capitalize(stageFromGap)} stage content proposal`,
      source: 'philosophy_analysis',
    }
  }

  // Domain balance gap
  return {
    title: `Review ${capitalize(gap.domain)} Content Balance`,
    description: `Based on your philosophy profile, ${gap.domain} is a high-priority content domain. A review of current ${gap.domain} coverage across all stages may identify opportunities to strengthen this area.`,
    changeType: 'rebalance_domain',
    targetStage: null,
    targetDomain: gap.domain,
    gapRationale: gap.gapDescription,
    safetyLevel: 'review_only',
    approvalNote: STANDARD_APPROVAL_NOTE,
    reviewActionLabel: `Review ${gap.domain} balance proposal`,
    source: 'philosophy_analysis',
  }
}

/**
 * Build a plain-text summary of a curriculum draft proposal for DONNA to present.
 * Suitable for use in DonnaResponseCard text field.
 */
export function buildProposalSummaryText(proposal: CurriculumDraftProposal): string {
  return [
    proposal.title,
    '',
    proposal.description,
    '',
    `Gap addressed: ${proposal.gapRationale}`,
    '',
    proposal.approvalNote,
  ].join('\n')
}

/**
 * Build a collection of proposals from multiple gap signals.
 * Caps at 3 proposals to avoid overwhelming the director.
 */
export function buildProposalsFromGaps(
  gaps: PhilosophyGapSignal[],
  profile: AcademyPhilosophyProfile,
): CurriculumDraftProposal[] {
  return gaps
    .slice(0, 3)
    .map(gap => buildProposalFromGap(gap, profile))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function extractStageFromGap(gap: PhilosophyGapSignal): CurriculumStage | null {
  const stages: CurriculumStage[] = ['red', 'orange', 'green', 'yellow', 'purple']
  for (const stage of stages) {
    if (gap.gapDescription.toLowerCase().includes(stage)) return stage
  }
  return null
}
