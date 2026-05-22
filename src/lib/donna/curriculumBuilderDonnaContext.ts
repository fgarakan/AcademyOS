// Sprint 616 — Curriculum Builder DONNA Context
// Pure TypeScript chip helpers for DONNA entry points in curriculum builder flows.
// No DB calls. No AI calls. No mutations. No side effects.
//
// WIRING STATUS for curriculum builder registry actions (documented here for sprint tracking):
//   identify_curriculum_gaps — answer_only, implemented_not_wired. Gap analysis lib exists in
//     src/lib/curriculum/gapAnalysis.ts. No mutation. Entry point added to CurriculumSetupBuilder.
//   explain_curriculum_builder_step — answer_only, registry_only. No backend needed. CTA only.
//   draft_curriculum_item — draft_only, implemented_not_wired. saveCurriculumDraftAction exists in
//     src/lib/actions/curriculumDraft.ts and routes through proposed_actions, but inserts into
//     voice_commands first as a hard dependency. Code comment notes: "Schema may need
//     voice_command_id to be optional for curriculum drafts." Do not wire until this dependency
//     is verified or relaxed. DonnaAddDrillDraft and DonnaCurriculumNodeAddCard are UI-only
//     mocks that set local state only — they do not call saveCurriculumDraftAction.
//   draft_drill, draft_curriculum_mission, draft_curriculum_badge — registry_only. No server
//     actions built yet. Do not wire until actions exist.
//
// FOLLOW-UP SPRINT REQUIRED:
//   1. Verify voice_commands insert in saveCurriculumDraftAction or make voice_command_id optional.
//   2. Wire saveCurriculumDraftAction to DonnaAddDrillDraft / DonnaCurriculumNodeAddCard.
//   3. Build draft_drill / draft_curriculum_mission / draft_curriculum_badge server actions.

export interface CurriculumDonnaSuggestionChip {
  label: string       // short button text shown on the CTA
  prompt: string      // full text dispatched to donna:open
  safetyNote: string  // shown alongside the chip to set correct expectations
}

export function buildCurriculumGapChip(): CurriculumDonnaSuggestionChip {
  return {
    label: 'Ask DONNA: identify curriculum gaps',
    prompt:
      'What is missing in the academy curriculum? ' +
      'Which levels have the biggest coverage gaps, ' +
      'and what are the highest-priority things to add or fix first?',
    safetyNote:
      'DONNA provides read-only gap analysis — no curriculum content is changed until you approve a draft in the Review Queue.',
  }
}

export function buildCurriculumBuilderExplainChip(stepContext?: string): CurriculumDonnaSuggestionChip {
  const context = stepContext ? ` specifically about: ${stepContext}` : ''
  return {
    label: 'Ask DONNA: explain this step',
    prompt:
      `What am I configuring here${context}? ` +
      'What should I pay attention to at this step, and how will it affect players and coaches?',
    safetyNote:
      'DONNA explains only — no curriculum setting is changed.',
  }
}
