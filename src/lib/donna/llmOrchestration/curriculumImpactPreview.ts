// Sprint 1021 — Curriculum Impact Preview V1
// Builds a safe "what would change?" preview for a curriculum draft proposal.
// Pure TypeScript — no DB, no API, no mutations.
//
// Purpose:
//   Before a director submits a curriculum change to the Review Queue, they should be able
//   to understand its impact. This module builds a structured preview that shows:
//     1. What would change if approved
//     2. What would NOT change (explicit safety list)
//     3. Which stages/domains are affected
//     4. Estimated effort level (simple / moderate / significant)
//
// Safety invariants:
//   - Impact preview is display-only — it does not create any DB records
//   - "Will happen" items are projected impacts only — nothing is guaranteed
//   - "Will not happen" items are always shown explicitly
//   - Preview always includes "requires your approval before anything changes"

import type { CurriculumDraftProposal } from './philosophyCurriculumDraftEngine'
import type { CurriculumStage } from './academyPhilosophyProfile'

// ── Impact preview types ──────────────────────────────────────────────────────

export type ImpactEffortLevel = 'low' | 'moderate' | 'significant'

export interface CurriculumImpactPreview {
  /** Human-readable title */
  title: string
  /** What will happen if this change is approved */
  willHappen: string[]
  /** What will explicitly NOT happen (safety reassurance) */
  willNotHappen: string[]
  /** Stages affected by this change */
  affectedStages: CurriculumStage[]
  /** Domains affected */
  affectedDomains: string[]
  /** Estimated effort level for implementation */
  effortLevel: ImpactEffortLevel
  /** Estimated impact on players */
  playerImpactSummary: string
  /** Approval requirement note */
  approvalRequirement: string
  /** Whether this change is reversible (all curriculum changes are reversible) */
  isReversible: true
}

// ── Approval note ─────────────────────────────────────────────────────────────

const APPROVAL_REQUIREMENT =
  'This change requires your explicit approval in the Review Queue. Nothing is applied automatically.'

// ── Impact builder ────────────────────────────────────────────────────────────

/**
 * Build a curriculum impact preview for a draft proposal.
 * Conservative — only shows impacts DONNA is confident about from the proposal type.
 * Never shows player names, coach names, or raw IDs.
 */
export function buildCurriculumImpactPreview(
  proposal: CurriculumDraftProposal,
): CurriculumImpactPreview {
  const affectedStages: CurriculumStage[] = proposal.targetStage ? [proposal.targetStage] : []
  const affectedDomains: string[] = proposal.targetDomain ? [proposal.targetDomain] : []

  switch (proposal.changeType) {
    case 'define_stage_structure': {
      return {
        title: `Impact: ${proposal.title}`,
        willHappen: [
          'A new curriculum stage structure will be defined in your curriculum.',
          'The curriculum builder will show the new stage with placeholder content.',
          'DONNA will be able to reference the stage in future curriculum discussions.',
        ],
        willNotHappen: [
          'Players will not be automatically moved or re-assigned.',
          'Existing player curriculum levels will not change.',
          'Coach session plans will not be affected.',
          'No parent or player communications will be sent.',
        ],
        affectedStages,
        affectedDomains,
        effortLevel: 'moderate',
        playerImpactSummary: 'No direct player impact — curriculum structure only. Players benefit once content is added to the new stage.',
        approvalRequirement: APPROVAL_REQUIREMENT,
        isReversible: true,
      }
    }

    case 'add_content_to_stage': {
      const stageName = proposal.targetStage ?? 'the selected stage'
      return {
        title: `Impact: ${proposal.title}`,
        willHappen: [
          `New content items will be added to the ${stageName} stage in the curriculum.`,
          `The curriculum coverage map for ${stageName} will show increased coverage.`,
          'Directors and coaches will be able to reference the new content in sessions.',
        ],
        willNotHappen: [
          'Players will not be automatically moved or re-assessed.',
          'Session templates will not be automatically updated.',
          'Existing session plans will not change.',
          'No parent or player communications will be sent.',
        ],
        affectedStages,
        affectedDomains,
        effortLevel: 'low',
        playerImpactSummary: `Players in the ${stageName} stage may benefit from more structured content guidance in future sessions.`,
        approvalRequirement: APPROVAL_REQUIREMENT,
        isReversible: true,
      }
    }

    case 'rebalance_domain': {
      const domainName = proposal.targetDomain ?? 'the selected domain'
      return {
        title: `Impact: ${proposal.title}`,
        willHappen: [
          `Content coverage for the ${domainName} domain will be reviewed and updated.`,
          `The domain balance view in the curriculum builder will reflect the new coverage.`,
        ],
        willNotHappen: [
          'Player assessments will not be automatically updated.',
          'Session templates will not be changed automatically.',
          'Existing player progress records will not be affected.',
          'No parent or player communications will be sent.',
        ],
        affectedStages,
        affectedDomains,
        effortLevel: 'moderate',
        playerImpactSummary: `Players may see more ${domainName}-focused content in future sessions once coaches update their templates.`,
        approvalRequirement: APPROVAL_REQUIREMENT,
        isReversible: true,
      }
    }

    case 'review_stage_coverage':
    default: {
      return {
        title: `Impact: ${proposal.title}`,
        willHappen: [
          'A curriculum coverage review will be initiated for the identified stage.',
          'Gaps in current coverage will be documented for director decision.',
        ],
        willNotHappen: [
          'No automatic curriculum changes will occur.',
          'Players will not be affected until director approves specific changes.',
          'No parent or player communications will be sent.',
        ],
        affectedStages,
        affectedDomains,
        effortLevel: 'low',
        playerImpactSummary: 'No direct player impact — this is a review and analysis step only.',
        approvalRequirement: APPROVAL_REQUIREMENT,
        isReversible: true,
      }
    }
  }
}

// ── Plain text formatter ──────────────────────────────────────────────────────

/**
 * Format a curriculum impact preview as plain text for DONNA panel display.
 */
export function formatImpactPreviewText(preview: CurriculumImpactPreview): string {
  const lines: string[] = [
    preview.title,
    '',
    'Will happen if approved:',
    ...preview.willHappen.map(item => `• ${item}`),
    '',
    'Will NOT happen:',
    ...preview.willNotHappen.map(item => `• ${item}`),
    '',
    preview.playerImpactSummary,
    '',
    preview.approvalRequirement,
  ]
  return lines.join('\n')
}
