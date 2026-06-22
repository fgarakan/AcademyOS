// Mega Sprint 3391–3420 — ONE DONNA Guided Completion Convergence V1
// Part 1 — The canonical DONNA Completion Contract.
//
// This is the ONE behavioral contract every DONNA conversation converges on.
// It is NOT a new engine, router, or OpenAI pathway. It is a small, pure set of
// types + classifiers that the three existing completion systems
//   • Form Guided Completion   (guidedCompletion/*)
//   • Goal Session Completion  (workflows/donnaGoalCompletionModel)
//   • Page Execution Guidance  (guided/pageExecutionGuidance, operating/*)
// all map onto, so the director never has to know multiple systems exist.
//
// THE DONNA COMPLETION CONTRACT
//   • Every conversation has exactly one Goal.
//   • Every Goal has exactly one Current State.
//   • Every Goal always has one Next Action.
//   • Every Goal always ends in one of five terminal states.
//   • There are no dangling conversations.
//
// OPERATING LAWS
//   1. Never answer and leave — always guide to completion.
//   2. The director never has to remember where they are — DONNA remembers.
//   3. "Continue." always resumes the current goal.
//
// Design rules: pure TypeScript. No DB, no React, no network, no mutations,
// no side effects. Deterministic — safe to call from the brain, the live
// pipeline, the three completion systems, and certification alike.

// ── Completion state ────────────────────────────────────────────────────────────

/** The five terminal states every goal must end in. No conversation dangles. */
export type TerminalCompletionState =
  | 'COMPLETE'   // the goal is finished — summary shown
  | 'WAITING'    // DONNA asked a question, awaiting the director's reply
  | 'APPROVAL'   // a drafted action is parked, awaiting director approval
  | 'BLOCKED'    // cannot proceed without director input — DONNA explains why
  | 'FOLLOW_UP'  // a next step is queued — DONNA offers to continue

/** Non-terminal (in-flight) states a goal passes through before it terminates. */
export type ActiveCompletionState =
  | 'PROPOSED'   // DONNA identified the goal, not yet started
  | 'ACTIVE'     // the director is actively working through steps

export type CompletionState = TerminalCompletionState | ActiveCompletionState

export const TERMINAL_STATES: readonly TerminalCompletionState[] = [
  'COMPLETE',
  'WAITING',
  'APPROVAL',
  'BLOCKED',
  'FOLLOW_UP',
] as const

export const COMPLETION_STATES: readonly CompletionState[] = [
  ...TERMINAL_STATES,
  'PROPOSED',
  'ACTIVE',
] as const

export function isTerminalState(state: CompletionState): boolean {
  return (TERMINAL_STATES as readonly string[]).includes(state)
}

// ── The canonical contract (operating context) ──────────────────────────────────
//
// This is the single behavioral interface for every conversation. Every response
// leaving the brain must be expressible as one of these — that is what the
// live-pipeline guarantor (enforceCompletionContract) proves before the response
// reaches the Executive Communication Layer.

export interface DonnaCompletionContract {
  /** Exactly one goal per conversation. Never empty. */
  goal: string
  /** Exactly one current state. */
  currentState: CompletionState
  /** The step the director is on (null when the goal is single-shot). */
  currentStep: string | null
  /** ALWAYS one next action. Never empty — this enforces "never answer and leave". */
  nextAction: string
  /** Whether the next action is approval-gated. */
  requiredApproval: boolean
  /** Present only when currentState === 'BLOCKED'. */
  blockingReason: string | null
  /** Present only when currentState === 'COMPLETE'. */
  completionSummary: string | null
  /** The director's last action/utterance, so DONNA remembers context. */
  lastUserAction: string | null
  /** Where the director is, so guidance is page-aware. */
  currentPage: string | null
  /** Provenance token for the RealitySnapshot the answer was grounded on. */
  realitySnapshotVersion: string | null
}

export const COMPLETION_CONTRACT = {
  contract: 'donnaCompletionContract',
  oneGoalPerConversation: true,
  oneStatePerGoal: true,
  alwaysOneNextAction: true,
  terminalStates: TERMINAL_STATES,
  laws: [
    'never_answer_and_leave',
    'donna_remembers_where_you_are',
    'continue_always_resumes_the_current_goal',
  ],
  noDanglingConversations: true,
} as const

// ── Universal phrase layer (Phase 2 pilot blockers) ─────────────────────────────
//
// The six control phrases every conversation must handle predictably. They are
// guidance signals, never field data. Detection is conservative: it only fires on
// SHORT messages so a real answer that merely contains a keyword (e.g. "I want to
// continue working on the serve and volley today") is treated as an answer.

export type CompletionIntent =
  | 'stuck'      // "I'm stuck"      → trigger help, never store as an answer
  | 'dont_know'  // "I don't know"   → trigger guidance, never capture as field data
  | 'continue'   // "Continue"       → resume the current goal, never restart
  | 'done'       // "Done"           → verify progress + advance, never cancel
  | 'actually'   // "Actually…"      → preserve context, revise naturally
  | 'cancel'     // "Cancel"         → confirm explicitly, never infer
  | 'answer'     // anything else    → a real answer / field value

/** Max words for a message to still count as a short control phrase. */
const CONTROL_PHRASE_MAX_WORDS = 6

/** Start-anchored patterns. Order matters — first match wins. */
const INTENT_PATTERNS: ReadonlyArray<readonly [CompletionIntent, RegExp]> = [
  ['cancel',    /^(cancel|stop|never\s?mind|forget it|abort|quit)\b/],
  ['actually',  /^(actually|wait|no wait|hold on|scratch that|on second thought|let me change|change that|instead)\b/],
  ['stuck',     /^(i'?m stuck|stuck|help|i need help|i'?m lost|lost|i'?m confused|confused)\b/],
  ['dont_know', /^(i don'?t know|don'?t know|i do not know|not sure|i'?m not sure|no idea|idk|dunno|unsure)\b/],
  ['continue',  /^(continue|resume|keep going|carry on|go on|next|pick up|where was i|where were we)\b/],
  ['done',      /^(done|i'?m done|finished|that'?s it|that'?s all|all set|good to go|complete|completed)\b/],
]

/**
 * Classify a director utterance into one canonical completion intent.
 * Conservative: control intents only fire on short messages so real answers are
 * never misread as control phrases.
 */
export function resolveCompletionIntent(raw: string): CompletionIntent {
  const text = (raw ?? '').trim().toLowerCase().replace(/[.!?,;:]+$/g, '')
  if (!text) return 'answer'
  const wordCount = text.split(/\s+/).filter(Boolean).length
  if (wordCount > CONTROL_PHRASE_MAX_WORDS) return 'answer'
  for (const [intent, pattern] of INTENT_PATTERNS) {
    if (pattern.test(text)) return intent
  }
  return 'answer'
}

/**
 * True when the utterance is a control phrase (anything other than a real answer).
 * The guard the guided-completion answer path uses so it never stores
 * "I don't know" / "I'm stuck" / "cancel" as field data.
 */
export function isControlPhrase(raw: string): boolean {
  return resolveCompletionIntent(raw) !== 'answer'
}

/**
 * Cancellation must always be confirmed explicitly — never inferred.
 * (Kept as a function so the law is enforced at the one call site, not duplicated.)
 */
export function requiresExplicitCancelConfirmation(intent: CompletionIntent): boolean {
  return intent === 'cancel'
}

// ── Executive guidance verbs (Phase 5) ──────────────────────────────────────────
//
// Every response must carry exactly one executive verb — never a passive menu
// ("Here's what you can do"). DONNA leads ("I'll walk you through it").

export type ExecutiveGuidanceVerb =
  | 'Navigate'
  | 'Explain'
  | 'Continue'
  | 'Approve'
  | 'Confirm'
  | 'Complete'

export const EXECUTIVE_GUIDANCE_VERBS: readonly ExecutiveGuidanceVerb[] = [
  'Navigate',
  'Explain',
  'Continue',
  'Approve',
  'Confirm',
  'Complete',
] as const

/**
 * Map a contract to the single executive verb DONNA should lead with.
 * Total over every CompletionState — there is always a verb, so a response can
 * never be a passive dead-end.
 */
export function classifyGuidanceVerb(contract: DonnaCompletionContract): ExecutiveGuidanceVerb {
  if (contract.requiredApproval) return 'Approve'
  switch (contract.currentState) {
    case 'APPROVAL':  return 'Approve'
    case 'COMPLETE':  return 'Complete'
    case 'BLOCKED':   return 'Explain'
    case 'WAITING':   return 'Confirm'
    case 'FOLLOW_UP': return 'Continue'
    case 'ACTIVE':    return 'Continue'
    case 'PROPOSED':  return contract.currentPage ? 'Navigate' : 'Continue'
  }
}
