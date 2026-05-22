// Sprint 615 — Assessment DONNA Context
// Pure TypeScript helpers for generating contextual DONNA prompts in assessment and placement flows.
// No DB calls. No AI calls. No mutations. No side effects.
// Used to surface read-only DONNA entry points from QuickAssessmentPanel and PlacementEngineClient.
//
// FOLLOW-UP SPRINT REQUIRED (backend gap documented here):
//   draft_assessment_recommendation — the proposed_action shape for assessment recommendations is
//     not yet defined in the proposed_actions schema. quickAssessmentAction.ts writes directly to
//     the assessments table and is not a DONNA draft path. Until a DONNA→proposed_actions assessment
//     action is built, DONNA can only explain and suggest — not create assessment records.
//   propose_player_placement — placementDraftAction.ts writes directly to placement_recommendations,
//     bypassing the proposed_actions pipeline. A DONNA→proposed_actions placement path must be built
//     before DONNA can create placement drafts. Until then, this entry point is read-only only.

export interface DonnaSuggestionChip {
  label: string       // short button text shown on the CTA
  prompt: string      // full text dispatched to donna:open
  safetyNote: string  // shown alongside the chip to set correct expectations
}

export function buildAssessmentDonnaChip(): DonnaSuggestionChip {
  return {
    label: 'Ask DONNA: assessment focus areas',
    prompt:
      'What domains should the next assessment focus on for this player? ' +
      'Based on their development profile and curriculum level, ' +
      'what areas need the most evidence or attention right now?',
    safetyNote:
      'DONNA provides context only — no assessment record is created until you save a rating above.',
  }
}

export function buildPlacementDonnaChip(): DonnaSuggestionChip {
  return {
    label: 'Ask DONNA: placement guidance',
    prompt:
      'Help me think through this player\'s placement. ' +
      'What should I consider when choosing a track, group, and level? ' +
      'What questions should I ask to make a strong placement rationale?',
    safetyNote:
      'DONNA provides context only — creating a placement draft requires your action on this page.',
  }
}
