// Mega Sprint 2681–2740 — DONNA Guided Execution OS V2
// Workflow Execution Loops — guided sequences for all 10 core workflows.
//
// Each workflow defines structured phases:
//   start → navigate → explain → help → verify → complete → next
//
// These loops are deterministic — DONNA guides through them without LLM.
// The loop engine uses existing DONNA guidance + signals to personalize each step.
//
// Supported workflows:
//   1. player_onboarding     6. recommendation_approval
//   2. parent_followup       7. session_creation
//   3. coach_followup        8. template_creation
//   4. assessment_review     9. curriculum_update
//   5. placement_review     10. end_of_day_review

// ── Types ─────────────────────────────────────────────────────────────────────

export type WorkflowType =
  | 'player_onboarding'
  | 'parent_followup'
  | 'coach_followup'
  | 'assessment_review'
  | 'placement_review'
  | 'recommendation_approval'
  | 'session_creation'
  | 'template_creation'
  | 'curriculum_update'
  | 'end_of_day_review'

export type WorkflowPhase =
  | 'start'
  | 'navigate'
  | 'explain'
  | 'help'
  | 'verify'
  | 'complete'
  | 'next'

export interface WorkflowStep {
  phase:              WorkflowPhase
  instruction:        string
  detailInstruction:  string
  route:              string | null
  completionCriteria: string
  helpText:           string
  verifyQuestion:     string
}

export interface WorkflowLoop {
  type:           WorkflowType
  displayName:    string
  goalStatement:  string
  estimatedTime:  string
  steps:          WorkflowStep[]
}

// ── Workflow definitions ───────────────────────────────────────────────────────

const PLAYER_ONBOARDING: WorkflowLoop = {
  type:          'player_onboarding',
  displayName:   'Player Onboarding',
  goalStatement: 'Bring a new player into the academy with assessment, placement, and profile setup.',
  estimatedTime: '30–45 minutes',
  steps: [
    {
      phase:              'start',
      instruction:        'Open the Players section and find the new player.',
      detailInstruction:  'Navigate to /director/players and locate the player with "Pending" or "Intake" status.',
      route:              '/director/players',
      completionCriteria: 'Player profile is open.',
      helpText:           'Go to the Players section, use the search or status filter to find players in "Pending" status.',
      verifyQuestion:     'Is the player profile open?',
    },
    {
      phase:              'navigate',
      instruction:        'Open the player profile and review the intake assessment.',
      detailInstruction:  'On the player profile, go to the Assessment tab. Review their intake data.',
      route:              '/director/players',
      completionCriteria: 'Intake assessment reviewed — all four domains (skill, competition, fitness, mental) have data.',
      helpText:           'Click on the player name from the list to open their profile. Then select the "Assessment" tab.',
      verifyQuestion:     'Have you reviewed the intake assessment across all four domains?',
    },
    {
      phase:              'explain',
      instruction:        'Confirm the placement recommendation.',
      detailInstruction:  'DONNA will recommend a curriculum level based on assessment data. Review and confirm or adjust.',
      route:              null,
      completionCriteria: 'Placement decision made — player assigned to a level.',
      helpText:           'The placement recommendation is shown below the assessment. You can accept it or adjust the level manually.',
      verifyQuestion:     'Is the player assigned to a curriculum level?',
    },
    {
      phase:              'verify',
      instruction:        'Activate the player profile.',
      detailInstruction:  'Complete activation so the player appears in session rosters and coach views.',
      route:              null,
      completionCriteria: 'Player status is Active — visible in sessions and coach roster.',
      helpText:           'Look for the "Activate Player" button on the profile. This runs the placement finalization function.',
      verifyQuestion:     'Is the player status now "Active"?',
    },
    {
      phase:              'complete',
      instruction:        'Schedule the first session and notify parents.',
      detailInstruction:  'With the player activated, schedule their first group session and create a parent update draft.',
      route:              '/director/sessions',
      completionCriteria: 'First session scheduled. Parent notification drafted.',
      helpText:           'Go to Sessions, find the appropriate group for the player\'s level, and add them to the roster.',
      verifyQuestion:     'Has the player been added to a session roster and has a parent notification been drafted?',
    },
  ],
}

const PARENT_FOLLOWUP: WorkflowLoop = {
  type:          'parent_followup',
  displayName:   'Parent Follow-Up',
  goalStatement: 'Reach out to a parent with overdue communication or a concern requiring response.',
  estimatedTime: '15–25 minutes',
  steps: [
    {
      phase:              'start',
      instruction:        'Identify the parent requiring follow-up.',
      detailInstruction:  'Ask DONNA "Which parents need follow-up?" to get the ranked list.',
      route:              null,
      completionCriteria: 'Parent identified — name and concern known.',
      helpText:           'Say "Which parents need follow-up?" and DONNA will give you the top priority parent.',
      verifyQuestion:     'Do you know which parent and what the concern is?',
    },
    {
      phase:              'navigate',
      instruction:        'Open the player profile for this parent\'s child.',
      detailInstruction:  'Navigate to the player profile and review any relevant notes and history.',
      route:              '/director/players',
      completionCriteria: 'Player profile open, parent contact reviewed.',
      helpText:           'Go to Players, find the player, and open their profile. The parent contact tab shows communication history.',
      verifyQuestion:     'Is the player profile open and have you reviewed the communication history?',
    },
    {
      phase:              'explain',
      instruction:        'Draft the parent update.',
      detailInstruction:  'Ask DONNA to draft a parent update. Review and personalize before sending.',
      route:              null,
      completionCriteria: 'Draft written, personalized, and ready for review.',
      helpText:           'Say "Draft a parent update for [player name]" and DONNA will create a draft. Edit it to add personal details.',
      verifyQuestion:     'Is the parent update draft ready?',
    },
    {
      phase:              'verify',
      instruction:        'Submit the parent update for approval.',
      detailInstruction:  'Route the draft through the review queue for final check before sending.',
      route:              '/director/review',
      completionCriteria: 'Parent update in review queue — approved and queued for delivery.',
      helpText:           'The draft goes to your Approvals page. Go to /director/review and approve the parent update.',
      verifyQuestion:     'Is the parent update approved in the review queue?',
    },
    {
      phase:              'complete',
      instruction:        'Log the follow-up in the player notes.',
      detailInstruction:  'Add a brief note to the player profile confirming the outreach was completed.',
      route:              null,
      completionCriteria: 'Note logged — parent follow-up marked complete.',
      helpText:           'Go back to the player profile, open the Notes tab, and add a brief note about the parent outreach.',
      verifyQuestion:     'Is the outreach logged in the player profile?',
    },
  ],
}

const RECOMMENDATION_APPROVAL: WorkflowLoop = {
  type:          'recommendation_approval',
  displayName:   'Recommendation Approval',
  goalStatement: 'Clear the review queue — approve, defer, or reject all pending recommendations.',
  estimatedTime: '10–20 minutes',
  steps: [
    {
      phase:              'start',
      instruction:        'Open the Approvals page.',
      detailInstruction:  'Navigate to /director/review to see all pending items.',
      route:              '/director/review',
      completionCriteria: 'Approvals page open, items visible.',
      helpText:           'Go to the "Approvals" section from the sidebar or say "Take me there."',
      verifyQuestion:     'Is the approvals page open?',
    },
    {
      phase:              'navigate',
      instruction:        'Start with the oldest item in the queue.',
      detailInstruction:  'Items are sorted by age — oldest first. This reduces escalation risk.',
      route:              null,
      completionCriteria: 'Oldest item reviewed.',
      helpText:           'Click the first item in the list — it\'s the oldest. Read the recommendation and context.',
      verifyQuestion:     'Have you reviewed the oldest pending item?',
    },
    {
      phase:              'explain',
      instruction:        'For each item: approve, defer, or reject.',
      detailInstruction:  'Approve if the recommendation is sound. Defer if more information is needed. Reject with a note.',
      route:              null,
      completionCriteria: 'All items have a decision.',
      helpText:           'Each item has three buttons: Approve, Defer, Reject. Ask DONNA about any item you\'re unsure of.',
      verifyQuestion:     'Have all pending items received a decision?',
    },
    {
      phase:              'complete',
      instruction:        'Confirm the queue is clear.',
      detailInstruction:  'The pending count should reach zero. Any deferred items will resurface on schedule.',
      route:              null,
      completionCriteria: 'Review queue pending count is zero.',
      helpText:           'Check the badge in the sidebar — when it shows 0, all decisions are made.',
      verifyQuestion:     'Is the review queue clear?',
    },
  ],
}

const ASSESSMENT_REVIEW: WorkflowLoop = {
  type:          'assessment_review',
  displayName:   'Assessment Review',
  goalStatement: 'Review and confirm player assessment data for advancement and placement decisions.',
  estimatedTime: '20–40 minutes',
  steps: [
    {
      phase:              'start',
      instruction:        'Identify players with overdue or pending assessments.',
      detailInstruction:  'Ask DONNA "Which players need assessment?" to get the list.',
      route:              '/director/players',
      completionCriteria: 'Assessment list identified.',
      helpText:           'Say "Which players need assessment?" and DONNA will show you the players with overdue data.',
      verifyQuestion:     'Do you have a list of players needing assessment?',
    },
    {
      phase:              'navigate',
      instruction:        'Open the first player\'s profile and go to the Assessment tab.',
      detailInstruction:  'Review assessment data across all four domains: skill, competition, fitness, mental.',
      route:              null,
      completionCriteria: 'Assessment data reviewed for top player.',
      helpText:           'Click on the player name to open their profile, then click the "Assessment" tab.',
      verifyQuestion:     'Have you reviewed the assessment data for this player?',
    },
    {
      phase:              'verify',
      instruction:        'Submit or update the assessment.',
      detailInstruction:  'If assessment data is complete, confirm it. If gaps exist, flag for coach follow-up.',
      route:              null,
      completionCriteria: 'Assessment submitted or flagged for coach input.',
      helpText:           'Click "Submit Assessment" or "Request Coach Input" depending on data completeness.',
      verifyQuestion:     'Has the assessment been submitted or flagged?',
    },
    {
      phase:              'complete',
      instruction:        'Repeat for all players on the assessment list.',
      detailInstruction:  'Work through the full list. Say "Next." after each player to advance.',
      route:              null,
      completionCriteria: 'All flagged players have current assessment data.',
      helpText:           'After each player, say "Next." and DONNA will guide you to the next one.',
      verifyQuestion:     'Have all flagged players been assessed?',
    },
  ],
}

const END_OF_DAY_REVIEW: WorkflowLoop = {
  type:          'end_of_day_review',
  displayName:   'End-of-Day Review',
  goalStatement: 'Close out the day — clear the queue, log decisions, and prep for tomorrow.',
  estimatedTime: '15–25 minutes',
  steps: [
    {
      phase:              'start',
      instruction:        'Ask DONNA "What should I review today?"',
      detailInstruction:  'DONNA will give you the prioritized end-of-day checklist.',
      route:              null,
      completionCriteria: 'End-of-day checklist identified.',
      helpText:           'Simply say "What should I review today?" and DONNA will organize the list.',
      verifyQuestion:     'Do you have today\'s review list?',
    },
    {
      phase:              'navigate',
      instruction:        'Clear the approval queue first.',
      detailInstruction:  'Recommendations age overnight — clearing them today prevents tomorrow\'s escalations.',
      route:              '/director/review',
      completionCriteria: 'Review queue cleared or deferred.',
      helpText:           'Go to Approvals and work through the queue. Defer any items that need more information.',
      verifyQuestion:     'Is the review queue at zero?',
    },
    {
      phase:              'explain',
      instruction:        'Check for any missed parent follow-ups.',
      detailInstruction:  'Any parent contacts older than 7 days escalate overnight. Address them now.',
      route:              null,
      completionCriteria: 'No parent follow-ups older than 7 days unaddressed.',
      helpText:           'Ask DONNA "Which parents need follow-up?" to get the end-of-day parent list.',
      verifyQuestion:     'Are all urgent parent contacts addressed?',
    },
    {
      phase:              'verify',
      instruction:        'Review academy health score.',
      detailInstruction:  'Check the operating feed for any declining domains that need attention.',
      route:              '/director',
      completionCriteria: 'Academy health reviewed — no critical domain below 40.',
      helpText:           'Go back to the dashboard and check the health ring in the operating feed.',
      verifyQuestion:     'Is the academy health score reviewed and stable?',
    },
    {
      phase:              'complete',
      instruction:        'Set tomorrow\'s first priority.',
      detailInstruction:  'Ask DONNA "What should I focus on tomorrow?" to seed tomorrow\'s execution.',
      route:              null,
      completionCriteria: 'Tomorrow\'s first priority identified and noted.',
      helpText:           'DONNA will identify the highest-priority item for tomorrow based on today\'s data.',
      verifyQuestion:     'Do you know what tomorrow\'s first action is?',
    },
  ],
}

// ── Workflow registry ──────────────────────────────────────────────────────────

const WORKFLOW_REGISTRY: Record<WorkflowType, WorkflowLoop> = {
  player_onboarding:       PLAYER_ONBOARDING,
  parent_followup:         PARENT_FOLLOWUP,
  coach_followup: {
    type:          'coach_followup',
    displayName:   'Coach Follow-Up',
    goalStatement: 'Follow up with a coach on session execution, recap quality, or player concerns.',
    estimatedTime: '10–20 minutes',
    steps: [
      {
        phase: 'start', instruction: 'Identify which coach needs follow-up.',
        detailInstruction: 'Ask DONNA "Which coach needs support?" for the priority list.',
        route: null, completionCriteria: 'Coach identified.',
        helpText: 'Say "Which coach needs support?" and DONNA will identify the highest-priority coach.',
        verifyQuestion: 'Do you know which coach to follow up with?',
      },
      {
        phase: 'navigate', instruction: 'Review recent sessions for this coach.',
        detailInstruction: 'Go to Sessions and filter by coach to review recent execution.',
        route: '/director/sessions', completionCriteria: 'Recent sessions reviewed.',
        helpText: 'Go to Sessions and use the coach filter to see their recent work.',
        verifyQuestion: 'Have you reviewed the coach\'s recent sessions?',
      },
      {
        phase: 'complete', instruction: 'Draft a coach communication.',
        detailInstruction: 'Ask DONNA to draft a coach follow-up note based on the session data.',
        route: null, completionCriteria: 'Coach communication drafted and submitted for approval.',
        helpText: 'Say "Draft a coach note for [coach name]" and DONNA will create a follow-up draft.',
        verifyQuestion: 'Is the coach communication drafted and in the review queue?',
      },
    ],
  },
  assessment_review:       ASSESSMENT_REVIEW,
  placement_review: {
    type:          'placement_review',
    displayName:   'Placement Review',
    goalStatement: 'Review and confirm player placement recommendations in the approval queue.',
    estimatedTime: '15–30 minutes',
    steps: [
      {
        phase: 'start', instruction: 'Open the Approvals page and filter for Placement Reviews.',
        detailInstruction: 'Navigate to /director/review and select the Placements tab.',
        route: '/director/review', completionCriteria: 'Placement review items visible.',
        helpText: 'Go to Approvals and click the "Placements" tab to see pending placement decisions.',
        verifyQuestion: 'Are the placement review items visible?',
      },
      {
        phase: 'explain', instruction: 'Review each placement recommendation.',
        detailInstruction: 'For each player, review assessment data, recommended level, and coach notes before deciding.',
        route: null, completionCriteria: 'All placement items have a decision.',
        helpText: 'Click on each placement item to see the full assessment context before approving.',
        verifyQuestion: 'Have all placement items been decided?',
      },
      {
        phase: 'complete', instruction: 'Confirm placements are activated.',
        detailInstruction: 'Approved placements activate players — confirm each is now active.',
        route: '/director/players', completionCriteria: 'All approved players show Active status.',
        helpText: 'Go to Players and check that approved placements show as Active.',
        verifyQuestion: 'Are all approved placements now showing as Active?',
      },
    ],
  },
  recommendation_approval: RECOMMENDATION_APPROVAL,
  session_creation: {
    type:          'session_creation',
    displayName:   'Session Creation',
    goalStatement: 'Create a new group session using a template.',
    estimatedTime: '10–15 minutes',
    steps: [
      {
        phase: 'start', instruction: 'Go to the Sessions page and click "New Session."',
        detailInstruction: 'Navigate to /director/sessions and use the session creation flow.',
        route: '/director/sessions', completionCriteria: 'Session creation form open.',
        helpText: 'Go to Sessions and look for the "New Session" or "+" button.',
        verifyQuestion: 'Is the session creation form open?',
      },
      {
        phase: 'navigate', instruction: 'Select a template and group.',
        detailInstruction: 'Choose the appropriate session template for the group level and date.',
        route: null, completionCriteria: 'Template selected and group assigned.',
        helpText: 'Select the group first, then pick a template that matches their curriculum level.',
        verifyQuestion: 'Is a template selected and group assigned?',
      },
      {
        phase: 'complete', instruction: 'Confirm and save the session.',
        detailInstruction: 'Review the session summary and save. It will appear in coach views.',
        route: null, completionCriteria: 'Session saved — visible in the session list.',
        helpText: 'Review the session details and click "Save Session" or "Confirm."',
        verifyQuestion: 'Is the session saved and visible in the list?',
      },
    ],
  },
  template_creation: {
    type:          'template_creation',
    displayName:   'Template Creation',
    goalStatement: 'Create a new session template for a group level.',
    estimatedTime: '15–30 minutes',
    steps: [
      {
        phase: 'start', instruction: 'Navigate to the Curriculum Templates section.',
        detailInstruction: 'Go to /director/curriculum and open the Templates view.',
        route: '/director/curriculum', completionCriteria: 'Template editor open.',
        helpText: 'Go to Curriculum and look for the "Templates" section or tab.',
        verifyQuestion: 'Is the template editor open?',
      },
      {
        phase: 'navigate', instruction: 'Select the target level and add blocks.',
        detailInstruction: 'Choose the curriculum level, then add session blocks (warm-up, technical, point play, etc.).',
        route: null, completionCriteria: 'Level selected and all required blocks added.',
        helpText: 'Say "Create a template for [level]" and DONNA will start the template creation flow.',
        verifyQuestion: 'Are all required blocks added to the template?',
      },
      {
        phase: 'complete', instruction: 'Save and review the template.',
        detailInstruction: 'Save the template — it becomes available for session creation immediately.',
        route: null, completionCriteria: 'Template saved and visible in the template library.',
        helpText: 'Click "Save Template" and confirm it appears in the template list.',
        verifyQuestion: 'Is the template saved and available in the library?',
      },
    ],
  },
  curriculum_update: {
    type:          'curriculum_update',
    displayName:   'Curriculum Update',
    goalStatement: 'Update curriculum content for a level or domain.',
    estimatedTime: '20–40 minutes',
    steps: [
      {
        phase: 'start', instruction: 'Open the Curriculum editor.',
        detailInstruction: 'Navigate to /director/curriculum and select the level to update.',
        route: '/director/curriculum', completionCriteria: 'Curriculum editor open with target level selected.',
        helpText: 'Go to Curriculum and click on the level you want to update.',
        verifyQuestion: 'Is the curriculum level open for editing?',
      },
      {
        phase: 'explain', instruction: 'Review coverage gaps before making changes.',
        detailInstruction: 'Check coverage analysis to identify which domains need more content.',
        route: null, completionCriteria: 'Coverage gaps identified.',
        helpText: 'The coverage tab shows which domains are under-represented in this level\'s curriculum.',
        verifyQuestion: 'Have you identified the coverage gaps?',
      },
      {
        phase: 'complete', instruction: 'Make changes and submit for review.',
        detailInstruction: 'Add or update content nodes. Submit changes via the proposal flow.',
        route: null, completionCriteria: 'Curriculum changes submitted — in review queue.',
        helpText: 'Changes go through the review queue. Click "Propose Changes" when done.',
        verifyQuestion: 'Are the curriculum changes submitted for review?',
      },
    ],
  },
  end_of_day_review: END_OF_DAY_REVIEW,
}

// ── Lookup and response ───────────────────────────────────────────────────────

export function getWorkflowLoop(type: WorkflowType): WorkflowLoop {
  return WORKFLOW_REGISTRY[type]
}

export function getWorkflowStep(
  type:  WorkflowType,
  phase: WorkflowPhase,
): WorkflowStep | null {
  const loop = WORKFLOW_REGISTRY[type]
  return loop.steps.find(s => s.phase === phase) ?? null
}

export function buildWorkflowLoopResponse(
  type:  WorkflowType,
  phase: WorkflowPhase,
): string {
  const loop = WORKFLOW_REGISTRY[type]
  const step = loop.steps.find(s => s.phase === phase)
  if (!step) return `Continue with the ${loop.displayName} workflow.`

  const lines = [
    `**${loop.displayName} — ${phase.charAt(0).toUpperCase() + phase.slice(1)}**`,
    '',
    `**${step.instruction}**`,
    '',
    step.detailInstruction,
    '',
    `**Done when:** ${step.completionCriteria}`,
    '',
    `*Say "Help" if you need more guidance, or "Done" when complete.*`,
  ]
  return lines.join('\n')
}

export function buildWorkflowHelpResponse(
  type:  WorkflowType,
  phase: WorkflowPhase,
): string {
  const loop = WORKFLOW_REGISTRY[type]
  const step = loop.steps.find(s => s.phase === phase)
  if (!step) return `Continue with the ${loop.displayName} workflow.`

  const lines = [
    `**${loop.displayName} — Help**`,
    '',
    step.helpText,
    '',
    `**Done when:** ${step.completionCriteria}`,
    `**Verification:** ${step.verifyQuestion}`,
  ]
  return lines.join('\n')
}
