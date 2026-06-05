// Mega Sprint 2216–2240 — DONNA Goal Completion Engine V1
// Goal Workflow Registry — 8 goal-level workflows DONNA can orchestrate.
//
// Each workflow defines:
//   - trigger intents: what the director says to start it
//   - required context: data signals DONNA needs
//   - first step: opening DONNA message
//   - steps: ordered sequence with user questions + answer options
//   - completion criteria: what "done" looks like
//   - safe actions: what DONNA can do without approval
//   - approval boundaries: what requires explicit director sign-off
//   - fallback route: where to navigate when needed
//
// Priority order (determines which workflow DONNA starts first):
//   P1: blocker              → player_placement, onboarding_completion
//   P2: approval             → review_queue, coach_recap_review, parent_update_review
//   P3: curriculum_bottleneck → curriculum_improvement
//   P4: academy_health       → academy_health_action
//   P5: opportunity          → daily_priorities
//
// Short-phrase recognition:
//   "yes" / "start" / "walk me through it" → accept / start
//   "skip" / "next" / "move on"            → skip current item
//   "approve" / "looks good"               → approve current item
//   "reject" / "no"                        → reject current item
//   "show evidence" / "why" / "details"    → show evidence/reasoning
//   "adjust" / "change"                    → modify current item
//   "defer" / "not now"                    → defer for later
//   "stop" / "done" / "cancel"             → stop workflow
//   "summary" / "what have we done"        → show progress summary
//   "resume" / "continue"                  → resume paused workflow
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - DONNA guides and drafts. Director decides. System executes.
//   - Every approval-gated action is named explicitly.

import type { GoalType, WorkflowPriority } from './donnaGoalCompletionModel'

// ── User option ────────────────────────────────────────────────────────────────

export type GoalWorkflowOptionIntent =
  | 'approve'
  | 'reject'
  | 'skip'
  | 'review'
  | 'adjust'
  | 'defer'
  | 'show_evidence'
  | 'next'
  | 'confirm'
  | 'start'
  | 'stop'

export interface GoalWorkflowOption {
  phrase:  string
  label:   string
  intent:  GoalWorkflowOptionIntent
}

// ── Workflow step ──────────────────────────────────────────────────────────────

export interface GoalWorkflowStep {
  stepNumber:       number
  label:            string
  donnaQuestion:    string
  hint:             string | null
  userOptions:      GoalWorkflowOption[]
  requiresApproval: boolean
  safeNavigateTo:   string | null
}

// ── Workflow definition ────────────────────────────────────────────────────────

export interface GoalWorkflow {
  id:                    GoalType
  label:                 string
  priority:              WorkflowPriority
  triggerIntents:        string[]
  requiredContext:       string[]
  firstStep:             string
  steps:                 GoalWorkflowStep[]
  completionCriteria:    string
  safeActions:           string[]
  approvalBoundaries:    string[]
  fallbackRoute:         string
  openingMessage:        string
  completionTemplate:    (completed: number, total: number, remaining: number) => string
  nextWorkflowCandidate: GoalType | null
}

// ── Short-phrase resolver ──────────────────────────────────────────────────────

export type GoalSessionCommand =
  | 'yes'
  | 'no'
  | 'skip'
  | 'approve'
  | 'reject'
  | 'show_evidence'
  | 'adjust'
  | 'defer'
  | 'stop'
  | 'next'
  | 'summary'
  | 'resume'
  | null

const COMMAND_PATTERNS: Array<[GoalSessionCommand, RegExp]> = [
  ['stop',          /^(stop|stop donna|stop guidance|enough|cancel|cancel workflow|exit|quit|i'?m done|that'?s enough|end session|no more)\.?$/i],
  ['approve',       /^(approve|approve it|approve this|approved|looks good|confirm|yes approve|i approve|that'?s right|all good)\.?$/i],
  ['reject',        /^(reject|reject it|no|nope|decline|don'?t approve|not approved|disagree|wrong)\.?$/i],
  ['show_evidence', /^(show me evidence|show evidence|what'?s the evidence|why|explain|show reasoning|what does this mean|details|more info|tell me more|evidence please)\.?$/i],
  ['adjust',        /^(adjust|change|modify|edit|different level|override|i disagree|not quite right|change recommendation|different|wrong level)\.?$/i],
  ['defer',         /^(defer|defer this|come back to this|remind me later|do this later|later|not this one yet)\.?$/i],
  ['skip',          /^(skip|skip this|skip it|skip this one|pass|move past this|i'?ll do that later|not this one|next item)\.?$/i],
  ['summary',       /^(summary|show summary|what have we done|what did we complete|status|show progress|progress|how are we doing)\.?$/i],
  ['resume',        /^(resume|continue from where|pick up|go back|where were we|continue|keep going|proceed)\.?$/i],
  ['next',          /^(next|what'?s next|move forward|go on|next priority|advance|continue to next)\.?$/i],
  ['yes',           /^(yes|yes please|yeah|yep|absolutely|sure|ok|okay|let'?s do it|let'?s start|start|go ahead|begin|walk me through|walk me through it|do it|i'?m ready)\.?$/i],
  ['no',            /^(no|nah|not now|not right now|maybe later|hold on|pause|wait)\.?$/i],
]

/**
 * Resolve a director's short phrase into a GoalSessionCommand.
 * Returns null when the text is not a recognized command (treat as a question).
 */
export function resolveGoalSessionCommand(text: string): GoalSessionCommand {
  const trimmed = text.trim()
  for (const [command, pattern] of COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) return command
  }
  return null
}

// ── Workflow definitions ───────────────────────────────────────────────────────

const WORKFLOWS: GoalWorkflow[] = [

  // ── 1. Daily Priorities (P5: opportunity) ───────────────────────────────────
  {
    id:       'daily_priorities',
    label:    'Daily Priorities',
    priority: 'opportunity',
    triggerIntents: [
      'what should i do today',
      'what do i need to do today',
      "what's most important today",
      'what matters most today',
      "today's priorities",
      'where should i start today',
      'what should i focus on',
      'give me my priorities',
      "what's on my plate",
      'help me prioritize today',
      'what needs my attention today',
      'daily overview',
      'start my day',
    ],
    requiredContext: ['academy_id', 'attention_queue'],
    firstStep: 'Identify top priority from attention queue by priority order',
    steps: [
      {
        stepNumber:       1,
        label:            'Top Priority',
        donnaQuestion:    'Here is your highest-value task today. Would you like me to walk you through it now?',
        hint:             'Items are ranked: blockers first, then approvals, then curriculum, then health.',
        userOptions: [
          { phrase: 'yes',            label: 'Yes, walk me through it',    intent: 'start' },
          { phrase: 'skip',           label: 'Skip to next priority',       intent: 'skip' },
          { phrase: 'show evidence',  label: 'Why is this the top priority?', intent: 'show_evidence' },
        ],
        requiresApproval: false,
        safeNavigateTo:   null,
      },
      {
        stepNumber:       2,
        label:            'Next Priority',
        donnaQuestion:    'That is complete. Here is your next priority. Would you like me to walk you through it?',
        hint:             null,
        userOptions: [
          { phrase: 'yes',   label: 'Yes, continue',   intent: 'start' },
          { phrase: 'skip',  label: 'Skip this one',   intent: 'skip' },
          { phrase: 'stop',  label: "I'm done for now", intent: 'stop' },
        ],
        requiresApproval: false,
        safeNavigateTo:   null,
      },
    ],
    completionCriteria: 'All top-3 priorities reviewed, walked through, or skipped by director.',
    safeActions: [
      'read attention queue and rank items by priority order',
      'explain why each item matters',
      'navigate to the relevant page for each priority',
      'start a guided workflow for the priority item',
      'summarize what was completed after each workflow',
    ],
    approvalBoundaries: [
      'approve any placement decision',
      'approve any review queue item',
      'change any curriculum content',
      'publish any parent communication',
    ],
    fallbackRoute:         '/director',
    openingMessage:        "I've reviewed your academy. Here is what matters most today.",
    completionTemplate:    (c, t, r) =>
      `Daily priorities complete. ${c} of ${t} reviewed. ${r > 0 ? `${r} deferred for later.` : 'All done.'}`,
    nextWorkflowCandidate: null,
  },

  // ── 2. Player Placement (P1: blocker) ───────────────────────────────────────
  {
    id:       'player_placement',
    label:    'Player Placement',
    priority: 'blocker',
    triggerIntents: [
      'walk me through player placements',
      'help me with placements',
      'review player placements',
      'player placement',
      'pending placements',
      'players waiting for placement',
      'place players',
      'review placements',
      "let's do placements",
      'guide me through placement',
      'players need to be placed',
      'unplaced players',
    ],
    requiredContext: ['academy_id', 'pending_placement_players'],
    firstStep: 'Show first pending player with recommendation and evidence summary',
    steps: [
      {
        stepNumber:       1,
        label:            'Player Review',
        donnaQuestion:    'This player is recommended for the level shown. Would you like to approve, review evidence, adjust the level, or skip?',
        hint:             'Recommendation is based on assessment scores, age range, and coach notes.',
        userOptions: [
          { phrase: 'approve',       label: 'Approve placement',       intent: 'approve' },
          { phrase: 'show evidence', label: 'Review evidence first',   intent: 'show_evidence' },
          { phrase: 'adjust',        label: 'Choose a different level', intent: 'adjust' },
          { phrase: 'skip',          label: 'Skip this player',        intent: 'skip' },
        ],
        requiresApproval: true,
        safeNavigateTo:   '/director/review',
      },
      {
        stepNumber:       2,
        label:            'Evidence Review',
        donnaQuestion:    'Here is the supporting evidence. Assessment scores, coach observations, and intake notes. Does this change your decision?',
        hint:             'You can still approve, adjust, or skip after reviewing.',
        userOptions: [
          { phrase: 'approve', label: 'Approve with this evidence',  intent: 'approve' },
          { phrase: 'adjust',  label: 'I still want to adjust',      intent: 'adjust' },
          { phrase: 'skip',    label: 'Skip this player',            intent: 'skip' },
        ],
        requiresApproval: true,
        safeNavigateTo:   null,
      },
    ],
    completionCriteria: 'All pending placement players reviewed — each approved, adjusted, or skipped.',
    safeActions: [
      'show pending players ordered by wait time',
      'summarize recommended placement and confidence reasoning',
      'show supporting evidence: assessment scores, coach notes, intake data',
      'navigate to player profile or review queue',
      'build placement approval draft for director review',
    ],
    approvalBoundaries: [
      'approve placement (requires finalize_player_placement)',
      'change player curriculum level',
      'activate a player profile',
      'link player to a group or session',
    ],
    fallbackRoute:         '/director/review',
    openingMessage:        'I have found players waiting for placement. Unplaced players block coach planning and parent clarity.',
    completionTemplate:    (c, _t, r) =>
      `Placement review complete. ${c} player${c === 1 ? '' : 's'} decided. ${r > 0 ? `${r} skipped for later.` : 'All done.'}`,
    nextWorkflowCandidate: 'review_queue',
  },

  // ── 3. Curriculum Improvement (P3: curriculum_bottleneck) ───────────────────
  {
    id:       'curriculum_improvement',
    label:    'Curriculum Improvement',
    priority: 'curriculum_bottleneck',
    triggerIntents: [
      'help me with curriculum',
      'improve curriculum',
      'curriculum improvement',
      'improve a level',
      "what's wrong with curriculum",
      'curriculum bottleneck',
      'fix curriculum',
      'review curriculum gaps',
      'curriculum gaps',
      'help me improve a level',
      'curriculum issues',
      'players are stuck',
      'level is blocking players',
    ],
    requiredContext: ['academy_id', 'curriculum_levels', 'bottleneck_signals'],
    firstStep: 'Identify the most blocked curriculum level by player stall rate',
    steps: [
      {
        stepNumber:       1,
        label:            'Level Bottleneck',
        donnaQuestion:    'This level has the highest bottleneck signal. Players are stalling here. Would you like to review the draft improvement plan?',
        hint:             'Based on player progress stalls, gate completion rates, and coach observations.',
        userOptions: [
          { phrase: 'yes',           label: 'Review improvement plan',      intent: 'review' },
          { phrase: 'show evidence', label: 'Show me the evidence first',   intent: 'show_evidence' },
          { phrase: 'skip',          label: 'Skip to next level',           intent: 'skip' },
          { phrase: 'defer',         label: 'Come back to this later',      intent: 'defer' },
        ],
        requiresApproval: false,
        safeNavigateTo:   '/director/curriculum',
      },
      {
        stepNumber:       2,
        label:            'Improvement Options',
        donnaQuestion:    'Here is the draft improvement plan. Would you like to approve the draft, adjust a requirement, or defer this level?',
        hint:             'All changes are draft-only. Nothing is published without your approval.',
        userOptions: [
          { phrase: 'approve', label: 'Approve draft plan',    intent: 'approve' },
          { phrase: 'adjust',  label: 'Edit a requirement',    intent: 'adjust' },
          { phrase: 'defer',   label: 'Defer — come back later', intent: 'defer' },
          { phrase: 'skip',    label: 'Skip this level',        intent: 'skip' },
        ],
        requiresApproval: true,
        safeNavigateTo:   null,
      },
    ],
    completionCriteria: 'All flagged curriculum levels reviewed — each with approved draft, adjustment, or deferral.',
    safeActions: [
      'identify most blocked curriculum levels by player stall rate',
      'explain the bottleneck and supporting evidence',
      'build draft improvement plan (drill + cue + requirement)',
      'suggest drills and coach cues from curriculum library',
      'navigate to curriculum explorer',
    ],
    approvalBoundaries: [
      'save curriculum changes to database',
      'publish curriculum changes to coaches',
      'change requirements or gates for a level',
      'notify coaches of curriculum updates',
    ],
    fallbackRoute:         '/director/curriculum',
    openingMessage:        'I have identified curriculum levels with active bottlenecks. Players are stalling and coaches need better content.',
    completionTemplate:    (c, _t, r) =>
      `Curriculum improvement complete. ${c} level${c === 1 ? '' : 's'} addressed. ${r > 0 ? `${r} deferred.` : 'All done.'}`,
    nextWorkflowCandidate: 'review_queue',
  },

  // ── 4. Review Queue (P2: approval) ──────────────────────────────────────────
  {
    id:       'review_queue',
    label:    'Review & Decide',
    priority: 'approval',
    triggerIntents: [
      'help me clear approvals',
      'help me finish approvals',
      'clear the review queue',
      'work through approvals',
      'review queue',
      'pending approvals',
      'process approvals',
      'decide on approvals',
      'review and decide',
      "let's clear approvals",
      'help me approve things',
      'walk me through the review queue',
      'what needs my approval',
      'things waiting for me',
    ],
    requiredContext: ['academy_id', 'pending_review_items'],
    firstStep: 'Count pending items, rank by risk/impact, start with highest',
    steps: [
      {
        stepNumber:       1,
        label:            'Review Item',
        donnaQuestion:    'Here is the highest-impact item waiting for your decision. Would you like to approve, edit, reject, or skip?',
        hint:             'Items are ordered: high-risk first, then by age (oldest waiting first).',
        userOptions: [
          { phrase: 'approve', label: 'Approve',              intent: 'approve' },
          { phrase: 'adjust',  label: 'Edit before approving', intent: 'adjust' },
          { phrase: 'reject',  label: 'Reject',                intent: 'reject' },
          { phrase: 'skip',    label: 'Skip for now',          intent: 'skip' },
        ],
        requiresApproval: true,
        safeNavigateTo:   '/director/review',
      },
    ],
    completionCriteria: 'All pending review items decided — approved, rejected, or explicitly skipped.',
    safeActions: [
      'count and rank pending review items by risk and age',
      'summarize each item with context and risk level',
      'navigate to the review queue',
      'show item detail and supporting context',
    ],
    approvalBoundaries: [
      'approve any review item (execute_approved_action)',
      'reject any review item',
      'send any parent communication',
      'apply any placement decision',
      'apply any curriculum change',
    ],
    fallbackRoute:         '/director/review',
    openingMessage:        'I have found items waiting for your decision in the review queue.',
    completionTemplate:    (c, t, r) =>
      `Review queue work complete. ${c} of ${t} items decided. ${r > 0 ? `${r} skipped for later.` : 'Queue is clear.'}`,
    nextWorkflowCandidate: 'player_placement',
  },

  // ── 5. Onboarding Completion (P1: blocker) ──────────────────────────────────
  {
    id:       'onboarding_completion',
    label:    'Academy Onboarding',
    priority: 'blocker',
    triggerIntents: [
      'finish onboarding',
      'complete onboarding',
      'help me finish setup',
      'walk me through onboarding',
      'finish setup',
      'complete my setup',
      "what's missing from setup",
      'setup incomplete',
      'onboarding incomplete',
    ],
    requiredContext: ['academy_id', 'onboarding_progress'],
    firstStep: 'Identify incomplete onboarding steps',
    steps: [
      {
        stepNumber:       1,
        label:            'Setup Step',
        donnaQuestion:    'Here is the next incomplete setup step. Would you like to complete it now?',
        hint:             'Completing setup unlocks coach and player access.',
        userOptions: [
          { phrase: 'yes',   label: 'Complete this step', intent: 'start' },
          { phrase: 'skip',  label: 'Skip for now',       intent: 'skip' },
          { phrase: 'defer', label: 'Come back to this',  intent: 'defer' },
        ],
        requiresApproval: false,
        safeNavigateTo:   '/director',
      },
    ],
    completionCriteria: 'All required onboarding steps completed or acknowledged.',
    safeActions: [
      'identify incomplete onboarding steps',
      'navigate to the relevant setup page',
      'explain why each step matters for coaches and players',
    ],
    approvalBoundaries: [
      'save any academy configuration',
      'activate coach or player accounts',
      'enable parent portal access',
    ],
    fallbackRoute:         '/director',
    openingMessage:        'Your academy setup is incomplete. Some features are unavailable until setup is finished.',
    completionTemplate:    (c, t, _r) =>
      `Onboarding review complete. ${c} of ${t} steps addressed.`,
    nextWorkflowCandidate: 'player_placement',
  },

  // ── 6. Academy Health Action (P4: academy_health) ───────────────────────────
  {
    id:       'academy_health_action',
    label:    'Academy Health Action',
    priority: 'academy_health',
    triggerIntents: [
      'academy health',
      "what's wrong with the academy",
      'academy issues',
      'fix academy health',
      'address health issues',
      'improve academy health',
      'kpi issues',
      'what do my kpis say',
      'help me with kpis',
      'academy performance',
      'walk me through health issues',
      'health signals',
    ],
    requiredContext: ['academy_id', 'kpi_signals', 'health_status'],
    firstStep: 'Identify most critical KPI health issue',
    steps: [
      {
        stepNumber:       1,
        label:            'Health Signal',
        donnaQuestion:    'This is your most critical health signal. Would you like to investigate and take action?',
        hint:             'Based on KPI thresholds and academy signals.',
        userOptions: [
          { phrase: 'yes',           label: 'Investigate this issue',   intent: 'review' },
          { phrase: 'show evidence', label: 'Show me the signals',      intent: 'show_evidence' },
          { phrase: 'skip',          label: 'Skip to next issue',       intent: 'skip' },
          { phrase: 'defer',         label: 'Defer for now',            intent: 'defer' },
        ],
        requiresApproval: false,
        safeNavigateTo:   '/director/kpi',
      },
    ],
    completionCriteria: 'All critical health signals reviewed with director decision on each.',
    safeActions: [
      'identify critical KPI signals',
      'explain health issues and context',
      'navigate to KPI dashboard',
      'suggest relevant corrective actions',
    ],
    approvalBoundaries: [
      'change any academy configuration',
      'modify coach assignments',
      'change player programs or levels',
    ],
    fallbackRoute:         '/director/kpi',
    openingMessage:        'I have identified academy health signals that need your attention.',
    completionTemplate:    (c, t, r) =>
      `Academy health review complete. ${c} of ${t} issues addressed. ${r > 0 ? `${r} deferred.` : 'All done.'}`,
    nextWorkflowCandidate: 'curriculum_improvement',
  },

  // ── 7. Coach Recap Review (P2: approval) ────────────────────────────────────
  {
    id:       'coach_recap_review',
    label:    'Coach Recap Review',
    priority: 'approval',
    triggerIntents: [
      'review coach recaps',
      'help me review recaps',
      'wrap-up reviews',
      'session recaps',
      'coach wrap-ups',
      'review wrap-ups',
      'pending recaps',
      'coach session reviews',
      'approve recaps',
    ],
    requiredContext: ['academy_id', 'pending_recap_items'],
    firstStep: 'Count pending coach wrap-ups, start with most recent',
    steps: [
      {
        stepNumber:       1,
        label:            'Recap Review',
        donnaQuestion:    'Here is the coach recap waiting for your review. Would you like to approve, request clarification, or reject?',
        hint:             'Approved recaps apply attendance and session notes to player records.',
        userOptions: [
          { phrase: 'approve', label: 'Approve recap',              intent: 'approve' },
          { phrase: 'adjust',  label: 'Request clarification',      intent: 'adjust' },
          { phrase: 'reject',  label: 'Reject recap',               intent: 'reject' },
          { phrase: 'skip',    label: 'Skip for now',               intent: 'skip' },
        ],
        requiresApproval: true,
        safeNavigateTo:   '/director/review',
      },
    ],
    completionCriteria: 'All pending coach recaps decided.',
    safeActions: [
      'count and rank pending recaps',
      'summarize each recap with session context',
      'navigate to review queue',
    ],
    approvalBoundaries: [
      'approve recap (applies session notes to player records)',
      'reject recap',
      'apply attendance changes',
    ],
    fallbackRoute:         '/director/review',
    openingMessage:        'I have found coach recaps waiting for your review.',
    completionTemplate:    (c, _t, r) =>
      `Coach recap review complete. ${c} decided. ${r > 0 ? `${r} remaining.` : 'All done.'}`,
    nextWorkflowCandidate: 'parent_update_review',
  },

  // ── 8. Parent Update Review (P2: approval) ──────────────────────────────────
  {
    id:       'parent_update_review',
    label:    'Parent Update Review',
    priority: 'approval',
    triggerIntents: [
      'review parent updates',
      'parent update review',
      'approve parent updates',
      'parent communications',
      'review parent messages',
      'pending parent updates',
      'parent update approvals',
    ],
    requiredContext: ['academy_id', 'pending_parent_items'],
    firstStep: 'Count pending parent update drafts',
    steps: [
      {
        stepNumber:       1,
        label:            'Parent Update',
        donnaQuestion:    'Here is the parent update draft waiting for your approval. Would you like to approve, edit, or reject?',
        hint:             'Nothing is sent to parents without your explicit approval.',
        userOptions: [
          { phrase: 'approve', label: 'Approve update',          intent: 'approve' },
          { phrase: 'adjust',  label: 'Edit before approving',   intent: 'adjust' },
          { phrase: 'reject',  label: 'Reject update',           intent: 'reject' },
          { phrase: 'skip',    label: 'Skip for now',            intent: 'skip' },
        ],
        requiresApproval: true,
        safeNavigateTo:   '/director/review',
      },
    ],
    completionCriteria: 'All pending parent update drafts decided.',
    safeActions: [
      'count and rank pending parent updates',
      'summarize each update with player context',
      'navigate to review queue',
    ],
    approvalBoundaries: [
      'approve update (queues for sending)',
      'send any parent communication',
      'publish any parent-visible content',
    ],
    fallbackRoute:         '/director/review',
    openingMessage:        'I have found parent update drafts waiting for your review.',
    completionTemplate:    (c, _t, r) =>
      `Parent update review complete. ${c} decided. ${r > 0 ? `${r} remaining.` : 'All done.'}`,
    nextWorkflowCandidate: null,
  },
]

// ── Priority order ─────────────────────────────────────────────────────────────

const PRIORITY_ORDER: WorkflowPriority[] = [
  'blocker',
  'approval',
  'curriculum_bottleneck',
  'academy_health',
  'opportunity',
]

// ── Registry ───────────────────────────────────────────────────────────────────

const WORKFLOW_MAP = new Map<GoalType, GoalWorkflow>(
  WORKFLOWS.map(w => [w.id, w])
)

// ── Public API ─────────────────────────────────────────────────────────────────

export function getGoalWorkflow(id: GoalType): GoalWorkflow | null {
  return WORKFLOW_MAP.get(id) ?? null
}

export function getAllGoalWorkflows(): GoalWorkflow[] {
  return WORKFLOWS
}

/**
 * Returns all workflows ordered by priority (P1 first, P5 last).
 * Within the same priority, order is preserved from the registry.
 */
export function getWorkflowsByPriority(): GoalWorkflow[] {
  return [...WORKFLOWS].sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf(a.priority)
    const bi = PRIORITY_ORDER.indexOf(b.priority)
    return ai - bi
  })
}

/**
 * Detect whether the director's text matches any workflow trigger intent.
 * Returns the highest-priority matching workflow.
 */
export function detectGoalWorkflowIntent(text: string): GoalWorkflow | null {
  const lower = text.toLowerCase().trim()
  for (const workflow of getWorkflowsByPriority()) {
    for (const intent of workflow.triggerIntents) {
      if (lower.includes(intent)) return workflow
    }
  }
  return null
}

export function getWorkflowStep(id: GoalType, stepNumber: number): GoalWorkflowStep | null {
  return getGoalWorkflow(id)?.steps[stepNumber - 1] ?? null
}

export function buildCompletionSummaryText(
  id: GoalType,
  completed: number,
  total: number,
  remaining: number,
): string {
  return getGoalWorkflow(id)?.completionTemplate(completed, total, remaining) ?? 'Workflow complete.'
}

/**
 * Returns the step options formatted as a DONNA prompt with labelled choices.
 */
export function buildStepOptionsText(step: GoalWorkflowStep): string {
  return step.userOptions
    .map(o => `• **${o.label}** — say "${o.phrase}"`)
    .join('\n')
}
