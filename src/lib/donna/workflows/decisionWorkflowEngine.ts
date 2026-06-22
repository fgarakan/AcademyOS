// Sprint 1711 — DONNA Decision Workflow Engine V1
// Converts issue types into guided multi-step director workflows.
// Each workflow tells the director exactly where to go, what to review,
// and what decision is needed — step by step.
//
// Core rule: DONNA guides; director decides. No automatic approvals.
//
// Design rules:
//   - Pure TypeScript. No DB calls. No mutations. No side effects.
//   - Deterministic: same input → same workflow spec.
//   - Never invents evidence not supplied by the caller.
//   - Every step with requiresApproval: true states exactly what DONNA will NOT do.
//   - All routes are real director routes, not invented paths.
//
// Workflows:
//   promotion  — 5 steps: assessment → evidence → readiness → recommendation → approve
//   placement  — 4 steps: assessment results → recommended level → evidence → approve/override
//   assessment — 3 steps: player context → run assessment → review results
//   parent_update — 3 steps: draft → evidence → approval
//   curriculum_review — 6 steps: current state → evidence → gap → suggestion → impact → approve

// ─── Types ─────────────────────────────────────────────────────────────────────

export type DecisionWorkflowType =
  | 'promotion'
  | 'placement'
  | 'assessment'
  | 'parent_update'
  | 'curriculum_review'

export interface DecisionWorkflowStep {
  stepNumber:      number
  title:           string
  description:     string
  /** Route director should be on for this step */
  route:           string
  /** data-donna-focus-id to highlight */
  focusId:         string
  /** Label for the primary action button */
  actionLabel:     string
  /** Where the action button navigates (may equal route) */
  actionHref:      string
  /** True when this step requires a director decision before proceeding */
  requiresApproval: boolean
  /** What DONNA will NOT do at this step */
  donnaWillNotDo:  string
}

export interface DecisionWorkflow {
  type:             DecisionWorkflowType
  title:            string
  /** Subject label: player name, level name, etc. */
  subjectLabel:     string
  totalSteps:       number
  steps:            DecisionWorkflowStep[]
  /** DONNA's opening message when initiating this workflow */
  openingMessage:   string
  /** DONNA's message when the workflow is complete */
  completionMessage: string
  /** Whether any step requires director approval */
  hasApprovalStep:  boolean
  /** Safety summary */
  safetyNote:       string
}

// ─── Intent detector ───────────────────────────────────────────────────────────

/** Maps text to a workflow type + subject label. Returns null if no match. */
export function detectGuidedReviewIntent(text: string): { type: DecisionWorkflowType; subjectHint: string | null } | null {
  const t = text.toLowerCase().trim()

  // Promotion / advancement review
  if (/\b(review|start|begin|open)\b.{0,30}\b(promotion|advancement|level (change|move|up)|promoting)\b/i.test(text) ||
      /\b(promotion|advancement) review\b/i.test(text)) {
    return { type: 'promotion', subjectHint: extractSubjectName(text) }
  }

  // Placement review
  if (/\b(review|start|begin|open)\b.{0,30}\b(placement|placements?)\b/i.test(text) ||
      /\breview (a |the )?placement\b/i.test(text) ||
      /\bguide (me through |the )?placement\b/i.test(text)) {
    return { type: 'placement', subjectHint: extractSubjectName(text) }
  }

  // Parent update review
  if (/\b(review|start|begin|open)\b.{0,30}\b(parent (updates?|communication|updates? review))\b/i.test(text) ||
      /\breview (parent|parent updates?)\b/i.test(text)) {
    return { type: 'parent_update', subjectHint: null }
  }

  // Curriculum review (distinct from "help me improve" which is in the improve workflow)
  if (/\b(review|help me review|walk me through|guide me through)\b.{0,40}\b(curriculum|orange ball|red ball|yellow ball|green dot|ball \d|level \d)\b/i.test(text)) {
    return { type: 'curriculum_review', subjectHint: extractLevelHint(text) }
  }

  // Assessment review
  if (/\b(review|start|begin)\b.{0,30}\b(assessment|assess (a |the |this )?player)\b/i.test(text) ||
      /\bguide (me through |the )?assessment\b/i.test(text)) {
    return { type: 'assessment', subjectHint: extractSubjectName(text) }
  }

  return null
}

function extractSubjectName(text: string): string | null {
  // Try to extract a capitalized name after "review" e.g. "review Jamie"
  const m = text.match(/\breview\s+([A-Z][a-z]{1,20})\b/)
  if (m) return m[1]
  return null
}

function extractLevelHint(text: string): string | null {
  const m = text.match(/\b(orange ball\s*\d?|red ball\s*\d?|yellow ball\s*\d?|green dot\s*\d?|high performance|level \d+)\b/i)
  return m ? m[1].replace(/\b\w/g, c => c.toUpperCase()) : null
}

// ─── Workflow builders ─────────────────────────────────────────────────────────

export function buildPromotionReviewWorkflow(
  playerLabel: string = 'this player',
  playerId?: string,
): DecisionWorkflow {
  const profileRoute = playerId ? `/director/players/${playerId}` : '/director/players'
  const steps: DecisionWorkflowStep[] = [
    {
      stepNumber:   1,
      title:        'Assessment Summary',
      description:  `Review ${playerLabel}'s assessment scores across all four domains: skill, competition, fitness, and mental. These are the foundation of the promotion decision.`,
      route:        profileRoute,
      focusId:      'player-assessments-section',
      actionLabel:  'Open Assessment',
      actionHref:   profileRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not score or modify assessments.',
    },
    {
      stepNumber:   2,
      title:        'Evidence Summary',
      description:  `Review the evidence records supporting ${playerLabel}'s readiness. Check the count, freshness, and quality of observations.`,
      route:        profileRoute,
      focusId:      'player-evidence-hub',
      actionLabel:  'View Evidence',
      actionHref:   profileRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not add or modify evidence records.',
    },
    {
      stepNumber:   3,
      title:        'Level Readiness Check',
      description:  `Confirm readiness signal: are gates met? Are assessment scores in range? Has evidence threshold been reached? This step is informational only.`,
      route:        profileRoute,
      focusId:      'player-readiness-card',
      actionLabel:  'Check Readiness',
      actionHref:   profileRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not move the player to a new level.',
    },
    {
      stepNumber:   4,
      title:        'DONNA Recommendation',
      description:  `Review DONNA's recommendation: promote, hold, or re-assess. Understand the reasoning and supporting signals.`,
      route:        profileRoute,
      focusId:      'player-priorities-card',
      actionLabel:  'View Recommendation',
      actionHref:   profileRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not apply the recommendation automatically.',
    },
    {
      stepNumber:   5,
      title:        'Your Decision',
      description:  `Approve or reject the promotion. This is your decision — I will not act until you approve. Once approved, the record is updated.`,
      route:        '/director/review',
      focusId:      'review-queue-primary',
      actionLabel:  'Go to Review Center',
      actionHref:   '/director/review',
      requiresApproval: true,
      donnaWillNotDo: 'I will not promote the player without your explicit approval in the Review Center.',
    },
  ]

  return {
    type:             'promotion',
    title:            `Promotion Review — ${playerLabel}`,
    subjectLabel:     playerLabel,
    totalSteps:       5,
    steps,
    openingMessage:   `Let me walk you through the promotion review for ${playerLabel}. We'll go step by step: assessment scores, evidence, readiness, recommendation, then your decision. Nothing changes until you approve.`,
    completionMessage: `Promotion review for ${playerLabel} is complete. Your decision has been recorded and the record will update after approval is processed.`,
    hasApprovalStep:  true,
    safetyNote:       'I will not move this player to a new level without your approval.',
  }
}

export function buildPlacementReviewWorkflow(
  playerLabel: string = 'this player',
  playerId?: string,
): DecisionWorkflow {
  const profileRoute = playerId ? `/director/players/${playerId}` : '/director/players'
  const steps: DecisionWorkflowStep[] = [
    {
      stepNumber:   1,
      title:        'Assessment Results',
      description:  `Review the intake or placement assessment results for ${playerLabel}. Check domain scores and any notes from the assessing coach.`,
      route:        profileRoute,
      focusId:      'player-assessments-section',
      actionLabel:  'View Assessment',
      actionHref:   profileRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not modify assessment scores.',
    },
    {
      stepNumber:   2,
      title:        'Recommended Level',
      description:  `DONNA's recommended curriculum level for ${playerLabel}, based on assessment scores and age range. Compare to your own judgment.`,
      route:        profileRoute,
      focusId:      'player-readiness-card',
      actionLabel:  'View Recommendation',
      actionHref:   profileRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not assign the level automatically.',
    },
    {
      stepNumber:   3,
      title:        'Supporting Evidence',
      description:  `Review any supporting evidence from trial sessions, observations, or prior coach notes for ${playerLabel}.`,
      route:        profileRoute,
      focusId:      'player-evidence-hub',
      actionLabel:  'View Evidence',
      actionHref:   profileRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not add evidence records.',
    },
    {
      stepNumber:   4,
      title:        'Approve or Override',
      description:  `Accept the recommendation or choose a different level. This decision activates the player's curriculum and starts their development path.`,
      route:        '/director/review',
      focusId:      'review-queue-primary',
      actionLabel:  'Go to Review Center',
      actionHref:   '/director/review',
      requiresApproval: true,
      donnaWillNotDo: 'I will not place the player in a curriculum level without your explicit approval.',
    },
  ]

  return {
    type:             'placement',
    title:            `Placement Review — ${playerLabel}`,
    subjectLabel:     playerLabel,
    totalSteps:       4,
    steps,
    openingMessage:   `Let's review the placement for ${playerLabel}. I'll show you assessment results, the recommended level, supporting evidence, and then you make the final call. Nothing is applied until you approve.`,
    completionMessage: `Placement review for ${playerLabel} is complete. The player will be enrolled in the approved curriculum level.`,
    hasApprovalStep:  true,
    safetyNote:       'I will not place any player in a curriculum level without director approval.',
  }
}

export function buildParentUpdateReviewWorkflow(): DecisionWorkflow {
  const steps: DecisionWorkflowStep[] = [
    {
      stepNumber:   1,
      title:        'Review the Draft',
      description:  'Read the proposed parent update. Check the tone, accuracy, and content. Confirm no sensitive internal coach notes are included.',
      route:        '/director/review',
      focusId:      'review-queue-primary',
      actionLabel:  'Open Review Center',
      actionHref:   '/director/review',
      requiresApproval: false,
      donnaWillNotDo: 'I will not send this communication.',
    },
    {
      stepNumber:   2,
      title:        'Check Supporting Evidence',
      description:  'Confirm the update references accurate, approved information. No raw coach notes or internal signals should appear in the parent-facing draft.',
      route:        '/director/review',
      focusId:      'review-queue-primary',
      actionLabel:  'Check Evidence',
      actionHref:   '/director/review',
      requiresApproval: false,
      donnaWillNotDo: 'I will not expose internal coach notes to parents.',
    },
    {
      stepNumber:   3,
      title:        'Approve or Reject',
      description:  'Approve to send the update, or reject with a note explaining why. Only approved drafts are delivered.',
      route:        '/director/review',
      focusId:      'review-queue-primary',
      actionLabel:  'Make Decision',
      actionHref:   '/director/review',
      requiresApproval: true,
      donnaWillNotDo: 'I will not send parent communications without your explicit approval.',
    },
  ]

  return {
    type:             'parent_update',
    title:            'Parent Update Review',
    subjectLabel:     'Parent Update',
    totalSteps:       3,
    steps,
    openingMessage:   "Let me guide you through the parent update review. We'll check the draft, verify the evidence it references, and then you decide whether to approve or reject. Nothing is sent without your approval.",
    completionMessage: 'Parent update review complete. The approved communication will be available for delivery.',
    hasApprovalStep:  true,
    safetyNote:       'I will not send any parent communication without your explicit approval.',
  }
}

export function buildCurriculumReviewWorkflow(
  levelLabel: string = 'this level',
  levelKey?: string,
): DecisionWorkflow {
  const improveParam = levelKey ? `?improve=${levelKey}` : ''
  const curriculumRoute = `/director/curriculum${improveParam}`
  const steps: DecisionWorkflowStep[] = [
    {
      stepNumber:   1,
      title:        'Current State',
      description:  `Review the current ${levelLabel} curriculum: level goal, gate count, skill count, and content coverage.`,
      route:        curriculumRoute,
      focusId:      'donna-curriculum-context',
      actionLabel:  'Open Curriculum',
      actionHref:   curriculumRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not modify the curriculum.',
    },
    {
      stepNumber:   2,
      title:        'Evidence Signals',
      description:  `Review evidence from player assessments and development priorities at ${levelLabel}. How many evidence records exist? How recent are they?`,
      route:        curriculumRoute,
      focusId:      'donna-curriculum-context',
      actionLabel:  'View Evidence',
      actionHref:   curriculumRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not add evidence records.',
    },
    {
      stepNumber:   3,
      title:        'Identified Gap',
      description:  `Review the identified curriculum gap: which domain or skill area is under-represented for ${levelLabel} players?`,
      route:        curriculumRoute,
      focusId:      'donna-curriculum-context',
      actionLabel:  'View Gap Analysis',
      actionHref:   curriculumRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not change any curriculum content.',
    },
    {
      stepNumber:   4,
      title:        'Suggested Change',
      description:  `Review DONNA's improvement suggestion: recommendation, confidence level, evidence count, affected players, and reasoning.`,
      route:        curriculumRoute,
      focusId:      'donna-curriculum-context',
      actionLabel:  'View Suggestion',
      actionHref:   curriculumRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not apply the suggested change.',
    },
    {
      stepNumber:   5,
      title:        'Impact Analysis',
      description:  'Understand what will and will not happen if this change is approved: which players are affected, what coach adjustments are needed, and what parents will see.',
      route:        curriculumRoute,
      focusId:      'donna-curriculum-context',
      actionLabel:  'View Impact',
      actionHref:   curriculumRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not notify coaches or parents automatically.',
    },
    {
      stepNumber:   6,
      title:        'Approve Draft',
      description:  `If you're satisfied, draft the change and approve it in the Review Center. Only approved curriculum changes are applied to ${levelLabel}.`,
      route:        '/director/review',
      focusId:      'review-queue-primary',
      actionLabel:  'Go to Review Center',
      actionHref:   '/director/review',
      requiresApproval: true,
      donnaWillNotDo: 'I will not publish curriculum changes without your explicit approval in the Review Center.',
    },
  ]

  return {
    type:             'curriculum_review',
    title:            `Curriculum Review — ${levelLabel}`,
    subjectLabel:     levelLabel,
    totalSteps:       6,
    steps,
    openingMessage:   `Let me guide you through the ${levelLabel} curriculum review. We'll look at the current state, evidence signals, the identified gap, DONNA's suggestion, impact, and then you decide whether to draft and approve the change. Nothing is applied until you approve.`,
    completionMessage: `Curriculum review for ${levelLabel} is complete. Approved changes will be reflected in the curriculum after processing.`,
    hasApprovalStep:  true,
    safetyNote:       'I will not modify curriculum content without your approval.',
  }
}

export function buildAssessmentReviewWorkflow(
  playerLabel: string = 'this player',
  playerId?: string,
): DecisionWorkflow {
  const profileRoute = playerId ? `/director/players/${playerId}` : '/director/players'
  const steps: DecisionWorkflowStep[] = [
    {
      stepNumber:   1,
      title:        'Player Context',
      description:  `Review ${playerLabel}'s current curriculum level, development history, and recent signals before running the assessment.`,
      route:        profileRoute,
      focusId:      'player-profile-header',
      actionLabel:  'Open Profile',
      actionHref:   profileRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not modify the player profile.',
    },
    {
      stepNumber:   2,
      title:        'Run Assessment',
      description:  `Complete the four-domain assessment: skill, competition, fitness, and mental performance. Score each domain based on observed performance.`,
      route:        profileRoute,
      focusId:      'player-assessments-section',
      actionLabel:  'Open Assessment Form',
      actionHref:   profileRoute,
      requiresApproval: false,
      donnaWillNotDo: 'I will not score the assessment.',
    },
    {
      stepNumber:   3,
      title:        'Review Results',
      description:  `Review the completed assessment scores and DONNA's readiness analysis. Confirm the scores are accurate and the evidence record is complete.`,
      route:        profileRoute,
      focusId:      'player-readiness-card',
      actionLabel:  'View Results',
      actionHref:   profileRoute,
      requiresApproval: true,
      donnaWillNotDo: 'I will not submit assessment results without your review.',
    },
  ]

  return {
    type:             'assessment',
    title:            `Assessment Review — ${playerLabel}`,
    subjectLabel:     playerLabel,
    totalSteps:       3,
    steps,
    openingMessage:   `Let me walk you through the assessment for ${playerLabel}. We'll review their context, complete the four-domain assessment, and then confirm the results.`,
    completionMessage: `Assessment review for ${playerLabel} is complete. Results are recorded and will feed into the readiness and evidence engines.`,
    hasApprovalStep:  true,
    safetyNote:       'I will not score or submit assessments without your review.',
  }
}

// ─── Convenience: build workflow from type ─────────────────────────────────────

export function buildWorkflowForType(
  type: DecisionWorkflowType,
  subjectLabel?: string,
  subjectId?: string,
): DecisionWorkflow {
  switch (type) {
    case 'promotion':         return buildPromotionReviewWorkflow(subjectLabel, subjectId)
    case 'placement':         return buildPlacementReviewWorkflow(subjectLabel, subjectId)
    case 'parent_update':     return buildParentUpdateReviewWorkflow()
    case 'curriculum_review': return buildCurriculumReviewWorkflow(subjectLabel, subjectId)
    case 'assessment':        return buildAssessmentReviewWorkflow(subjectLabel, subjectId)
  }
}

// ─── Step message builder ──────────────────────────────────────────────────────

export function buildStepMessage(workflow: DecisionWorkflow, stepNumber: number): string {
  const step = workflow.steps[stepNumber - 1]
  if (!step) return workflow.openingMessage
  const progress = `Step ${step.stepNumber} of ${workflow.totalSteps}`
  return [
    `**${workflow.title}** — ${progress}`,
    '',
    `**${step.title}**`,
    step.description,
    '',
    step.requiresApproval
      ? `This step requires your approval. ${step.donnaWillNotDo}`
      : step.donnaWillNotDo,
  ].join('\n')
}
