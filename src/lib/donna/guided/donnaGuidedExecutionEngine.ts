// Mega Sprint 2681–2740 — DONNA Guided Execution OS V1+V2
// DonnaGuidedExecutionEngine — formats guided responses for all execution intents.
//
// This engine DOES NOT select what to do next — that is delegated to:
//   buildNextBestAction()   (donnaNextBestActionEngine.ts)
//   buildDirectorGuidance() (directorGuidanceEngine.ts)
//
// This engine ONLY formats responses for:
//   next_best_action   — "What next?", "Continue.", "What else?"
//   task_completed     — "Done.", "Finished.", "Handled."
//   execution_help     — "Help.", "I'm stuck."
//   navigate_to_action — "Take me there.", "Open it."
//
// Pure TypeScript — no DB, no LLM, no side effects.

import type { NextBestAction, ExecutionState } from './nextBestAction'

// ── Response shapes ───────────────────────────────────────────────────────────

export interface GuidedResponse {
  text:           string
  navigationHint: string | null
  thinkingText:   string | null
}

// ── 1. NEXT_BEST_ACTION — "What next?", "Continue.", "What else?" ──────────────

export function handleNextBestAction(
  action:          NextBestAction,
  isContinuation:  boolean = false,
): GuidedResponse {
  const prefix = isContinuation ? 'Moving on. ' : ''

  const lines = [
    `${prefix}**${action.title}**`,
    '',
    action.description,
    '',
    `**Why now:** ${action.reason}`,
    `**Time:** ${action.estimatedMinutes}`,
    `**Done when:** ${action.completionCriteria}`,
  ]

  if (action.route) {
    lines.push('')
    lines.push(`*Say "Take me there" to navigate, or "Help" for step-by-step guidance.*`)
  } else {
    lines.push('')
    lines.push(`*Say "Help" for detailed steps, or "Done" when complete.*`)
  }

  if (action.nextActionHint) {
    lines.push('')
    lines.push(`**After that:** ${action.nextActionHint}`)
  }

  return {
    text:           lines.join('\n'),
    navigationHint: action.route,
    thinkingText:   null,
  }
}

// Thinking text for the "What next?" loading state
export function getNextBestActionThinkingText(isContinuation: boolean): string {
  return isContinuation
    ? 'Re-ranking priorities…'
    : 'Identifying your highest-leverage action…'
}

// ── 2. TASK_COMPLETED — "Done.", "Finished." ──────────────────────────────────

/**
 * @param completedTitle     - Title of the action just marked complete (from ExecutionState)
 * @param completionCriteria - Verification criteria for the completed action
 * @param nextAction         - The next action (null = all work done)
 */
export function handleTaskCompleted(
  completedTitle:      string | null,
  completionCriteria:  string | null,
  nextAction:          NextBestAction | null,
): GuidedResponse {
  const ack = completedTitle
    ? `Excellent — **${completedTitle}** done.`
    : 'Done — noted.'

  const criteriaLine = completionCriteria
    ? `\n*Verification: ${completionCriteria}*`
    : ''

  if (!nextAction) {
    const text = [
      ack,
      criteriaLine,
      '',
      'No further high-priority actions at this moment. The academy is being monitored.',
      '',
      '*Ask "How is the academy?" for a current health check, or "What am I missing?" for blind spots.*',
    ].filter(Boolean).join('\n')

    return { text, navigationHint: null, thinkingText: null }
  }

  const text = [
    ack,
    criteriaLine,
    '',
    '---',
    '',
    `**Next: ${nextAction.title}**`,
    '',
    nextAction.description,
    '',
    `**Done when:** ${nextAction.completionCriteria}`,
    '',
    nextAction.route
      ? `*Say "Take me there" to navigate, or "Help" for guidance.*`
      : `*Say "Help" for detailed steps, or "Done" when complete.*`,
  ].filter(Boolean).join('\n')

  return {
    text,
    navigationHint: nextAction.route,
    thinkingText:   null,
  }
}

// ── 3. EXECUTION_HELP — "Help.", "I'm stuck.", "Walk me through it." ──────────

/**
 * Returns step-by-step guidance for the current active action.
 * If no active action is known, returns generic guidance.
 */
export function handleExecutionHelp(
  action:         NextBestAction,
  executionState: ExecutionState | null = null,
): GuidedResponse {
  const helpCount = executionState?.helpCount ?? 0
  const isRepeatHelp = helpCount > 0

  const header = isRepeatHelp
    ? `**Guidance (continued): ${action.title}**`
    : `**Step-by-step: ${action.title}**`

  const lines = [
    header,
    '',
    '**What to do:**',
    action.description,
    '',
    '**Where to go:**',
    action.route ? `Navigate to: ${action.route}` : 'Stay on the current page — the action is here.',
    '',
    '**Why this matters:**',
    action.reason,
    '',
    '**How to know you\'re done:**',
    action.completionCriteria,
    '',
    `**Time estimate:** ${action.estimatedMinutes}`,
    '',
    `*Say "Take me there" to navigate, or "Done" when complete.*`,
  ]

  return {
    text:           lines.join('\n'),
    navigationHint: action.route,
    thinkingText:   null,
  }
}

/**
 * Fallback help when no active action is known.
 * Guides the Director to ask for their next action.
 */
export function handleExecutionHelpFallback(): GuidedResponse {
  return {
    text: [
      '**DONNA Guided Execution — Help**',
      '',
      'No active task is set. Let\'s find the right starting point.',
      '',
      '*Say "What next?" and DONNA will identify your highest-leverage action.*',
      '*Or try: "What should I focus on?" / "What\'s most urgent?"*',
    ].join('\n'),
    navigationHint: null,
    thinkingText:   null,
  }
}

// ── 4. NAVIGATE_TO_ACTION — "Take me there.", "Open it." ─────────────────────

/**
 * @param action         - The action whose route to navigate to
 * @param executionState - Current execution state (for fallback route)
 */
export function handleNavigateIntent(
  action:         NextBestAction | null,
  executionState: ExecutionState | null = null,
): GuidedResponse {
  const route  = action?.route ?? executionState?.activeRoute ?? null
  const title  = action?.title ?? executionState?.activeActionTitle ?? 'the current action'
  const criteria = action?.completionCriteria ?? executionState?.completionCriteria ?? null

  if (!route) {
    return {
      text: [
        'No specific page target for the current task — the action happens on the current page.',
        '',
        criteria ? `**Done when:** ${criteria}` : '',
        '',
        `*Say "Help" for step-by-step guidance, or "Done" when complete.*`,
      ].filter(Boolean).join('\n'),
      navigationHint: null,
      thinkingText:   null,
    }
  }

  const lines = [
    `Opening the right page now.`,
    '',
    `**Your task:** ${title}`,
    '',
    criteria ? `**Done when:** ${criteria}` : '',
    '',
    `*Say "Help" when you arrive for step-by-step guidance, or "Done" when complete.*`,
  ].filter(Boolean)

  return {
    text:           lines.join('\n'),
    navigationHint: route,
    thinkingText:   null,
  }
}

// ── 5. ALL-DONE FALLBACK ──────────────────────────────────────────────────────

/** Response when all known actions have been completed. */
export function handleAllActionsComplete(): GuidedResponse {
  return {
    text: [
      '**All current priorities addressed.**',
      '',
      'The academy is up to date based on available data.',
      '',
      '*DONNA is monitoring for new signals. Say "How is the academy?" for a health check,',
      'or check back later and ask "What next?" for the next priority.*',
    ].join('\n'),
    navigationHint: null,
    thinkingText:   null,
  }
}
