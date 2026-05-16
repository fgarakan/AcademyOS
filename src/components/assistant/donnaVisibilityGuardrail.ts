// Donna Visibility Guardrail — Sprint 280
// Pure TypeScript only. No DB, no Supabase, no async, no AI.
//
// Given a draft type, returns the canonical list of things Donna will not do
// automatically, and safety notes to display in the review panel.
//
// Use in review panels and draft summaries to show consistent safety copy.
// All decisions surfaced here are internal review-status decisions only.

import type { DonnaDraftType } from './donnaDraftContracts'

export interface DonnaVisibilityRules {
  willNotDo: string[]
  safetyNotes: string[]
}

const VISIBILITY_RULES: Record<DonnaDraftType, DonnaVisibilityRules> = {
  parent_update_draft: {
    willNotDo: [
      'Send this update to the parent or player.',
      'Change show_to_parent or show_to_student flags.',
      'Modify any player profile or development record.',
      'Notify the coach.',
      'Expose raw or private coach observation notes — only public observations are used.',
    ],
    safetyNotes: [
      'This draft is internal only. No messaging provider exists — the parent will not receive anything from this system.',
      'Saving this draft creates a Review Queue entry only. Approving the draft status does not send the update.',
      'All content was passed through the parent-safe sanitizer — internal jargon, private notes, and raw scores are excluded.',
    ],
  },

  level_readiness_draft: {
    willNotDo: [
      'Move the player to the next level.',
      'Update the player profile or curriculum state.',
      'Change any assessment scores.',
      'Notify the player, parent, or coach.',
    ],
    safetyNotes: [
      'This draft summarises level readiness evidence only. No level change occurs until you explicitly advance the player through the level management flow.',
      'Marking reviewed does not advance the player — it only records that the director has seen this draft.',
    ],
  },

  curriculum_adjustment_draft: {
    willNotDo: [
      'Change any curriculum requirements, templates, or drills.',
      'Modify class or fitness templates.',
      'Update player curriculum states.',
      'Apply any curriculum change to sessions.',
    ],
    safetyNotes: [
      'This draft is a proposal only. No curriculum data is changed until you explicitly apply the change through the curriculum management flow.',
      'Approving the proposal status does not modify the curriculum — it only marks the proposal reviewed.',
    ],
  },

  class_template_draft: {
    willNotDo: [
      'Save the template without your explicit Save Template action.',
      'Assign the template to sessions or groups.',
      'Notify coaches, players, or parents.',
    ],
    safetyNotes: [
      'The template is not saved until you click Save Template.',
    ],
  },

  fitness_template_draft: {
    willNotDo: [
      'Save the template without your explicit Save Fitness Template action.',
      'Assign the template to sessions.',
      'Notify coaches, players, or parents.',
    ],
    safetyNotes: [
      'The fitness template is not saved until you click Save Fitness Template.',
    ],
  },

  session_draft: {
    willNotDo: [
      'Create the session without your explicit Create Session action.',
      'Assign coaches or players to the session.',
      'Notify anyone.',
    ],
    safetyNotes: [
      'The session record is not created until you click Create Session.',
    ],
  },

  session_block_population_draft: {
    willNotDo: [
      'Copy blocks without your explicit Approve and Populate Blocks action.',
      'Send the coach brief to the coach.',
      'Notify any coach, player, or parent.',
    ],
    safetyNotes: [
      'No blocks are written until you approve. The coach brief is local only — it is never sent automatically.',
    ],
  },

  coach_note_draft: {
    willNotDo: [
      'Send the note to parents or players.',
      'Change show_to_parent or show_to_student flags.',
      'Notify any coach.',
    ],
    safetyNotes: [
      'The note is internal only until a director explicitly changes visibility.',
    ],
  },

  player_note_draft: {
    willNotDo: [
      'Change show_to_parent or show_to_student flags.',
      'Notify parents, players, or coaches.',
      'Update the player level.',
    ],
    safetyNotes: [
      'Only coach_summary and development_focus are updated. Visibility flags are never touched.',
    ],
  },

  attendance_exception_draft: {
    willNotDo: [
      'Record attendance without your explicit Apply action.',
      'Add unrostered attendees to the roster.',
      'Modify billing, enrollment, or player profiles.',
      'Send any communication.',
    ],
    safetyNotes: [
      'No attendance is written until you apply it in the Review Queue. Unrostered attendees are flagged only.',
    ],
  },

  coach_communication_draft: {
    willNotDo: [
      'Send the message to the coach.',
      'Notify the coach, player, or parent automatically.',
      'Create a session, template, or attendance record.',
    ],
    safetyNotes: [
      'This draft is internal only. No coach communication infrastructure exists — the coach will not receive anything.',
      'The draft is saved to the Review Queue for director reference. Sending must be handled separately outside this system.',
    ],
  },

  group_creation_draft: {
    willNotDo: [
      'Create the group without your explicit Create Group action.',
      'Assign players to the group.',
      'Notify anyone.',
    ],
    safetyNotes: [
      'The group record is not created until you approve.',
    ],
  },

  template_recommendation_draft: {
    willNotDo: [
      'Apply the recommendation without your explicit Approve Recommendation action.',
      'Assign a template to any session or group.',
      'Notify anyone.',
    ],
    safetyNotes: [
      'The recommendation is informational only — no session or template is created until you approve.',
    ],
  },
}

export function getDonnaVisibilityRules(draftType: DonnaDraftType): DonnaVisibilityRules {
  return (
    VISIBILITY_RULES[draftType] ?? {
      willNotDo: ['Make any automatic changes to this draft.'],
      safetyNotes: ['All decisions are internal review-status decisions only.'],
    }
  )
}
