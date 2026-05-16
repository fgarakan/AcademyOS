// DONNA Wrap-Up Question Templates — Sprint 505
// Defines question sets DONNA can handle about coach wrap-up data.
// Maps intent triggers → response templates.
// Pure TypeScript constants — no DB calls, no logic.

// ── Types ─────────────────────────────────────────────────────────────────────

export type WrapUpQuestionCategory =
  | 'submission_status'
  | 'session_summary'
  | 'observations'
  | 'follow_ups'
  | 'review_queue'

export interface DonnaWrapUpQuestion {
  id: string
  category: WrapUpQuestionCategory
  intentTriggers: string[]
  proactivePrompt: string
  responseTemplateDataAvailable: string
  responseTemplateNoData: string
  requiresDirectorApproval: boolean
  followUpQuestionIds: string[]
}

// ── Wrap-up questions ─────────────────────────────────────────────────────────

export const DONNA_WRAP_UP_QUESTIONS: DonnaWrapUpQuestion[] = [

  // ── Submission status ──────────────────────────────────────────────────────

  {
    id: 'wrap_up_submission_status',
    category: 'submission_status',
    intentTriggers: [
      'which sessions have wrap-ups',
      'wrap-up status',
      'did coaches submit',
      'any missing wrap-ups',
      'wrap-up coverage',
      'who submitted',
    ],
    proactivePrompt: "Want me to check which sessions have wrap-ups submitted today?",
    responseTemplateDataAvailable: "{{submitted}} of {{total}} sessions have wrap-ups submitted. {{outstanding}} still outstanding: {{outstandingGroups}}.",
    responseTemplateNoData: "No wrap-up submission data available for today yet.",
    requiresDirectorApproval: false,
    followUpQuestionIds: ['remind_coaches_to_submit'],
  },

  {
    id: 'remind_coaches_to_submit',
    category: 'submission_status',
    intentTriggers: [
      'remind coach to submit',
      'send a reminder',
      'nudge the coaches',
      'tell them to wrap up',
    ],
    proactivePrompt: "Should I draft a wrap-up reminder for the coaches who haven't submitted yet?",
    responseTemplateDataAvailable: "I can draft a reminder for {{coachList}} — it will go into the review queue. Nothing is sent until you approve.",
    responseTemplateNoData: "I need to know which coaches to remind. Let me check the submission status first.",
    requiresDirectorApproval: true,
    followUpQuestionIds: [],
  },

  // ── Session summary ────────────────────────────────────────────────────────

  {
    id: 'how_did_session_go',
    category: 'session_summary',
    intentTriggers: [
      'how did the session go',
      'what happened in the session',
      'session summary for',
      'tell me about the session',
      'how was the session',
    ],
    proactivePrompt: "Here's the wrap-up for {{groupName}}'s session today.",
    responseTemplateDataAvailable: "{{groupName}} — {{date}}. {{completedStatus}}. {{modificationSummary}} Coach notes: {{notes}}.",
    responseTemplateNoData: "No wrap-up has been submitted for {{groupName}}'s session yet.",
    requiresDirectorApproval: false,
    followUpQuestionIds: ['observations_from_session', 'follow_ups_from_session'],
  },

  {
    id: 'session_modification_reason',
    category: 'session_summary',
    intentTriggers: [
      'why was the session modified',
      'what changed in the session',
      'what was different',
      'why didn\'t they follow the plan',
    ],
    proactivePrompt: "The session for {{groupName}} was modified. Want to know why?",
    responseTemplateDataAvailable: "{{groupName}}'s session was modified because: {{modifications}}. Coach note: {{notes}}.",
    responseTemplateNoData: "No modification details available for this session.",
    requiresDirectorApproval: false,
    followUpQuestionIds: [],
  },

  // ── Observations ───────────────────────────────────────────────────────────

  {
    id: 'observations_from_session',
    category: 'observations',
    intentTriggers: [
      'any observations from',
      'what did the coach observe',
      'player notes from',
      'what was noted about players',
      'coach observations',
    ],
    proactivePrompt: "There are {{count}} player observations from {{groupName}}'s session. Want to hear them?",
    responseTemplateDataAvailable: "{{count}} observation(s) from {{groupName}}: {{observationList}}. {{pendingReviewCount}} are pending your review.",
    responseTemplateNoData: "No player observations were submitted with this session's wrap-up.",
    requiresDirectorApproval: false,
    followUpQuestionIds: ['approve_observation'],
  },

  {
    id: 'observation_for_player',
    category: 'observations',
    intentTriggers: [
      'what was said about',
      'any notes on',
      'coach feedback on',
      'observations for',
    ],
    proactivePrompt: "I have coach notes on {{playerName}} from recent sessions. Want to see them?",
    responseTemplateDataAvailable: "{{playerName}} — {{observationType}}: {{observation}}. Skill tag: {{skillTag}}. Next step: {{nextStep}}. Visibility: {{visibility}}.",
    responseTemplateNoData: "No observations on {{playerName}} from recent sessions.",
    requiresDirectorApproval: false,
    followUpQuestionIds: ['approve_observation', 'what_is_next_step_for_player'],
  },

  {
    id: 'approve_observation',
    category: 'observations',
    intentTriggers: [
      'approve the observation',
      'add to player profile',
      'accept the note',
      'approve coach note',
    ],
    proactivePrompt: "Should I move this observation to the review queue for profile approval?",
    responseTemplateDataAvailable: "The observation for {{playerName}} is in the review queue. Go to the review panel to approve it and add it to their profile.",
    responseTemplateNoData: "I don't have a specific observation queued for approval right now.",
    requiresDirectorApproval: true,
    followUpQuestionIds: [],
  },

  // ── Follow-ups ─────────────────────────────────────────────────────────────

  {
    id: 'follow_ups_from_session',
    category: 'follow_ups',
    intentTriggers: [
      'any follow-ups from',
      'what needs follow-up',
      'follow-up items from today',
      'open items from the session',
      'what needs action',
    ],
    proactivePrompt: "There are {{count}} follow-up item(s) from today's sessions. Want me to run through them?",
    responseTemplateDataAvailable: "{{count}} follow-up(s): {{followUpList}}. {{pendingCount}} are pending your review.",
    responseTemplateNoData: "No follow-up items were submitted with today's wrap-ups.",
    requiresDirectorApproval: false,
    followUpQuestionIds: ['parent_update_pending', 'director_followup_pending'],
  },

  {
    id: 'parent_update_pending',
    category: 'follow_ups',
    intentTriggers: [
      'any parent messages',
      'parent updates pending',
      'pending parent drafts',
      'parent follow-ups',
    ],
    proactivePrompt: "There are {{count}} parent update draft(s) waiting for your review.",
    responseTemplateDataAvailable: "{{count}} parent update draft(s) in the review queue. {{playerList}}. Nothing is sent until you approve each one.",
    responseTemplateNoData: "No parent update drafts pending review.",
    requiresDirectorApproval: true,
    followUpQuestionIds: [],
  },

  {
    id: 'director_followup_pending',
    category: 'follow_ups',
    intentTriggers: [
      'director follow-ups',
      'items for the director',
      'my follow-up list',
      'what do I need to do',
    ],
    proactivePrompt: "There are {{count}} director follow-up item(s) for you.",
    responseTemplateDataAvailable: "{{count}} director follow-up(s): {{followUpList}}.",
    responseTemplateNoData: "No director follow-ups pending.",
    requiresDirectorApproval: false,
    followUpQuestionIds: [],
  },

  // ── Review queue ───────────────────────────────────────────────────────────

  {
    id: 'review_queue_status',
    category: 'review_queue',
    intentTriggers: [
      'what\'s in the review queue',
      'pending review items',
      'what needs my approval',
      'review queue',
      'anything to approve',
    ],
    proactivePrompt: "There are {{count}} item(s) in the review queue. Want a summary?",
    responseTemplateDataAvailable: "Review queue: {{pendingCount}} pending, {{approvedCount}} approved (not yet applied), {{appliedCount}} applied. {{topModule}} has the most items.",
    responseTemplateNoData: "The review queue is empty.",
    requiresDirectorApproval: false,
    followUpQuestionIds: [],
  },

  {
    id: 'approved_not_applied',
    category: 'review_queue',
    intentTriggers: [
      'approved but not applied',
      'what\'s approved but not done',
      'pending execution',
      'items ready to apply',
    ],
    proactivePrompt: "There are {{count}} approved item(s) that haven't been applied yet.",
    responseTemplateDataAvailable: "{{count}} item(s) are approved and ready to apply: {{itemList}}. These will be applied when you trigger execution.",
    responseTemplateNoData: "No approved items waiting for execution.",
    requiresDirectorApproval: false,
    followUpQuestionIds: [],
  },
]

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getDonnaWrapUpQuestion(id: string): DonnaWrapUpQuestion | undefined {
  return DONNA_WRAP_UP_QUESTIONS.find(q => q.id === id)
}

export function getWrapUpQuestionsByCategory(
  category: WrapUpQuestionCategory,
): DonnaWrapUpQuestion[] {
  return DONNA_WRAP_UP_QUESTIONS.filter(q => q.category === category)
}

export function matchWrapUpQuestionByTrigger(input: string): DonnaWrapUpQuestion | undefined {
  const normalized = input.toLowerCase().trim()
  return DONNA_WRAP_UP_QUESTIONS.find(q =>
    q.intentTriggers.some(trigger => normalized.includes(trigger.toLowerCase())),
  )
}
