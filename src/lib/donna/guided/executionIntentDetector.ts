// Mega Sprint 2681–2740 — DONNA Guided Execution OS V1+V2
// Execution Intent Detector.
//
// Detects four execution-layer intents from the Director's natural language:
//
//   next_best_action   — "What next?", "Continue.", "What else?", "Keep going."
//   task_completed     — "Done.", "Finished.", "Handled.", "Approved."
//   execution_help     — "Help.", "I'm stuck.", "Walk me through it."
//   navigate_to_action — "Take me there.", "Open it.", "Go there."
//
// IMPORTANT: This detector runs BEFORE detectOperatingQuestion in the
// orchestrator (Step 3e). It catches the complete set of spec-listed aliases
// so the execution engine can return a structured NextBestAction object in
// addition to the text response.
//
// Distinct from:
//   detectOperatingQuestion  — broader domain questions (what_missing, getting_worse)
//   detectBroadAcademyQuery  — academy-level intelligence questions

// ── Intent type ───────────────────────────────────────────────────────────────

export type ExecutionIntentType =
  | 'next_best_action'
  | 'task_completed'
  | 'execution_help'
  | 'navigate_to_action'

// ── Pattern tables ────────────────────────────────────────────────────────────

const NEXT_BEST_ACTION_PATTERNS: RegExp[] = [
  // Short-form continuations — primary reason this detector exists
  /^(what\s+)?next[.!?]?$/i,
  /^continue[.!?]?$/i,
  /^keep\s+going[.!?]?$/i,
  /^what\s+else[.!?]?$/i,
  /^anything\s+else[.!?]?$/i,
  /^what\s+now[.!?]?$/i,
  /^guide\s+me[.!?]?$/i,
  // Multi-word but short forms
  /^what\s+should\s+i\s+do[.!?]?$/i,
  /^what\s+should\s+i\s+focus\s+on[.!?]?$/i,
  /^what'?s\s+(most\s+)?important[.!?]?$/i,
  /^what\s+can'?t?\s+wait[.!?]?$/i,
  /^what\s+would\s+you\s+do[.!?]?$/i,
  /^what\s+should\s+brian\s+do[.!?]?$/i,
  // Full question forms (also caught here to return NextBestAction object)
  /^what\s+(should\s+i|do\s+i)\s+(do\s+)?next[.!?]?$/i,
  /^what'?s\s+next[.!?]?$/i,
  /^where\s+(should|do)\s+i\s+start[.!?]?$/i,
  /^what('s|\s+is)\s+(my\s+)?next\s+(step|action|move)[.!?]?$/i,
  /^what\s+should\s+i\s+do\s+now[.!?]?$/i,
]

const TASK_COMPLETED_PATTERNS: RegExp[] = [
  /^done[.!]?$/i,
  /^finished[.!]?$/i,
  /^handled[.!]?$/i,
  /^completed[.!]?$/i,
  /^resolved[.!]?$/i,
  /^approved[.!]?$/i,
  /^sent[.!]?$/i,
  /^fixed[.!]?$/i,
  // Short contextual variants
  /^(all\s+)?done(\s+with\s+that)?[.!]?$/i,
  /^(that'?s?\s+)?done[.!]?$/i,
  /^(it'?s?\s+)?done[.!]?$/i,
  /^i('ve)?\s+(done|finished|completed|handled|resolved|approved|sent|fixed)\s+(it|that)[.!]?$/i,
  /^(all\s+)?complete(d)?[.!]?$/i,
]

const EXECUTION_HELP_PATTERNS: RegExp[] = [
  /^help[.!?]?$/i,
  /^i'?m?\s+stuck[.!?]?$/i,
  /^i\s+don'?t\s+understand[.!?]?$/i,
  /^walk\s+me\s+through\s+it[.!?]?$/i,
  /^how\s+do\s+i\s+do\s+that[.!?]?$/i,
  /^what\s+does\s+that\s+mean[.!?]?$/i,
  /^explain[.!?]?$/i,
  /^can\s+you\s+guide\s+me[.!?]?$/i,
  /^i\s+need\s+help[.!?]?$/i,
  /^(can\s+you\s+)?help\s+me[.!?]?$/i,
  /^guide\s+me\s+through\s+(it|this)[.!?]?$/i,
  /^what\s+do\s+i\s+(click|do)\s+(on\s+this\s+page)?[.!?]?$/i,
]

const NAVIGATE_TO_ACTION_PATTERNS: RegExp[] = [
  /^take\s+me\s+there[.!?]?$/i,
  /^open\s+it[.!?]?$/i,
  /^go\s+there[.!?]?$/i,
  /^bring\s+me\s+to\s+it[.!?]?$/i,
  /^navigate(\s+there)?[.!?]?$/i,
  /^show\s+me(\s+where)?[.!?]?$/i,
  /^go\s+to\s+it[.!?]?$/i,
  /^take\s+me\s+to\s+it[.!?]?$/i,
  /^open\s+that\s+page[.!?]?$/i,
]

// ── Main detector ─────────────────────────────────────────────────────────────

/**
 * Detect an execution-layer intent from the Director's input.
 *
 * Returns null when the input is not an execution intent, allowing the
 * orchestrator to fall through to operating questions or LLM.
 *
 * Priority order when patterns could overlap:
 *   task_completed > execution_help > navigate_to_action > next_best_action
 */
export function detectExecutionIntent(userInput: string): ExecutionIntentType | null {
  const text = userInput.trim()

  if (TASK_COMPLETED_PATTERNS.some(p => p.test(text)))   return 'task_completed'
  if (EXECUTION_HELP_PATTERNS.some(p => p.test(text)))   return 'execution_help'
  if (NAVIGATE_TO_ACTION_PATTERNS.some(p => p.test(text))) return 'navigate_to_action'
  if (NEXT_BEST_ACTION_PATTERNS.some(p => p.test(text))) return 'next_best_action'

  return null
}

/** True when the input is any execution-layer intent. */
export function isExecutionIntent(userInput: string): boolean {
  return detectExecutionIntent(userInput) !== null
}
