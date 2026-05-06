// Academy OS assistant personality constants.
// No external API. No AI calls. Pure display/copy config.

export const ASSISTANT_VOICE = {
  WRAP_UP_QUESTIONS: [
    'Was everyone here, or was anyone missing or added today?',
    'Did you complete all the planned blocks?',
    'What changed or got skipped — and why?',
    'Who stood out today — in a good way or needs follow-up?',
    'Who needs specific attention next session?',
    'What should the focus be for the next session?',
  ],

  SUMMARY_HEADER: 'Here\'s what I understood',
  SUMMARY_SUBTEXT: 'Review before saving. Nothing is official yet.',
  SAFETY_NOTE: 'This will be saved for director review. Nothing else changes.',

  // Voice output — browser speechSynthesis
  SPEECH_RATE: 0.9,
  SPEECH_PITCH: 1,
  VOICE_DISCLAIMER: 'Voice output only. You still type or use your device keyboard.',
} as const

export const DIRECTOR_ASSISTANT = {
  PANEL_LABEL: 'Academy OS Assistant',
  PANEL_HEADLINE: 'Ask what needs attention',
  PANEL_SUBTEXT: 'Select a question for a deterministic answer and direct action link. No AI required.',

  SAFETY_FOOTER: 'Nothing changes until you approve each item.',
  DRAFT_LABEL: 'Draft — pending review',
} as const

export const PARENT_LANGUAGE: Record<string, string> = {
  IDP: 'Development plan',
  curriculum_level: 'Training level',
  score_delta: 'Progress trend',
  assessment: 'Skills check',
  proposed_action: 'Pending update',
  pending_placement: 'Joining the academy',
  present: 'Attended',
  absent: 'Missed',
  late: 'Attended late',
  excused: 'Excused',
} as const

export const PLAYER_LANGUAGE: Record<string, string> = {
  assessment: 'Skills check',
  gate_evidence: 'Progress milestone',
  curriculum_level: 'Your current level',
  next_level: 'Next milestone',
  focus_areas: 'What to work on',
  IDP: 'Your training plan',
} as const
