// Mega Sprint 4051–4080 — DONNA Executive Dialogue Engine V1
//
// Makes DONNA think WITH the Director across a long conversation instead of
// answering each message in isolation. This is dialogue QUALITY — not a new router,
// not a new context engine, not a new memory store. Dialogue state is DERIVED, per
// turn, from the conversation history that already flows through the Executive
// Context Packet. Nothing is persisted; nothing new is routed.
//
// What it derives and feeds into the existing reasoning prompt:
//   • the active objective + strategic topic of the discussion
//   • decisions already made, decisions still open, assumptions, risks, tradeoffs
//   • the current progressive-planning stage (objective → … → review)
//   • whether the latest idea deserves a respectful executive challenge
//   • whether a candidate reply would repeat what was already said
//
// Pure TypeScript — no DB, no API, no React, no side effects.

export type ConversationTurn = { role: 'user' | 'donna'; content: string }

// ── Progressive planning (Objective 4) ──────────────────────────────────────────

export const PROGRESSIVE_STAGES = [
  'objective',     // agree on what we're solving
  'constraints',   // surface the limits
  'options',       // evaluate the choices
  'recommendation',// commit to a course
  'execution',     // do it
  'review',        // check the result
] as const
export type PlanningStage = typeof PROGRESSIVE_STAGES[number]

export function nextStage(stage: PlanningStage): PlanningStage {
  const i = PROGRESSIVE_STAGES.indexOf(stage)
  return PROGRESSIVE_STAGES[Math.min(i + 1, PROGRESSIVE_STAGES.length - 1)]
}

// ── Strategic topics (Objective 2) ──────────────────────────────────────────────

export type StrategicTopic =
  | 'build_academy'
  | 'curriculum'
  | 'retention'
  | 'revenue'
  | 'onboarding'
  | 'staffing'
  | 'scheduling'
  | 'player_development'
  | 'general'

const TOPIC_SIGNALS: Array<{ topic: StrategicTopic; re: RegExp }> = [
  { topic: 'build_academy', re: /\b(build|launch|start|set up|open)\b.*\bacademy\b|\bbuild an academy\b/i },
  { topic: 'curriculum', re: /\b(curriculum|development spine|levels?|progression|syllabus)\b/i },
  { topic: 'retention', re: /\b(retention|churn|drop[- ]?off|keep players|stay enrolled|leaving)\b/i },
  { topic: 'revenue', re: /\b(revenue|pricing|fees|income|monet|profit|upsell)\b/i },
  { topic: 'onboarding', re: /\b(onboarding|intake|placement|new (player|family)|first (week|session))\b/i },
  { topic: 'staffing', re: /\b(staff|coach(es)?|hire|hiring|headcount|payroll)\b/i },
  { topic: 'scheduling', re: /\b(schedul|timetable|court time|sessions per|calendar|slots?)\b/i },
  { topic: 'player_development', re: /\b(player development|advancement|skill path|assessment|player progress)\b/i },
]

export function detectStrategicTopic(text: string): StrategicTopic {
  for (const { topic, re } of TOPIC_SIGNALS) if (re.test(text)) return topic
  return 'general'
}

// ── Derived dialogue state (Objective 1 + 5) ────────────────────────────────────

export interface DialogueState {
  turnCount: number
  strategicTopic: StrategicTopic
  /** The objective the discussion is working toward (from the earliest objective-set turn). */
  activeObjective: string | null
  /** Conclusions/decisions reached (a DONNA recommendation the Director then accepted). */
  decisionsMade: string[]
  /** Questions DONNA raised that the Director has not yet resolved. */
  openDecisions: string[]
  assumptions: string[]
  risks: string[]
  tradeoffs: string[]
  /** Furthest progressive-planning stage the discussion has reached. */
  stage: PlanningStage
}

const OBJECTIVE_VERB = /\b(build|launch|redesign|improve|increase|grow|optimi[sz]e|fix|reduce|raise|cut|design|rework|expand)\b/i
const ACK = /^(yes|yep|yeah|ok|okay|sure|sounds good|do it|let'?s do it|agreed|go ahead|perfect|great)\b/i
const STAGE_SIGNALS: Array<{ stage: PlanningStage; re: RegExp }> = [
  { stage: 'constraints', re: /\b(constraint|budget|limit|only have|can'?t afford|staff|time|space|courts?|capacity)\b/i },
  { stage: 'options', re: /\b(options?|alternatives?|either|versus|vs\.?|or we could|on the other hand|two ways|approach(es)?)\b/i },
  // A SOLUTION recommendation advances the stage — but process talk ("I'd recommend
  // we lock the constraints next") does not, so exclude "recommend we …".
  { stage: 'recommendation', re: /\b(i'?d recommend|i recommend)(?!\s+we\b)|\b(the move is|my recommendation|best path|i'?d go with)\b/i },
  { stage: 'execution', re: /\b(let'?s (do|start|build|create)|execute|kick off|get started|i'?ll set up|create the)\b/i },
  { stage: 'review', re: /\b(review|how did it|results|outcome|did it work|measure|track the impact|follow[- ]?up)\b/i },
]

function firstSentence(s: string): string {
  return (s.trim().split(/(?<=[.!?])\s+/)[0] ?? s).trim()
}

function collect(history: ConversationTurn[], re: RegExp): string[] {
  const out: string[] = []
  for (const t of history) {
    for (const sentence of t.content.split(/(?<=[.!?])\s+/)) {
      if (re.test(sentence)) out.push(sentence.trim())
    }
  }
  return Array.from(new Set(out))
}

/**
 * Derive the full dialogue state from the conversation so far + the current message.
 * Pure and idempotent — the same history always yields the same state.
 */
export function deriveDialogueState(
  history: ConversationTurn[],
  currentMessage = '',
): DialogueState {
  const all: ConversationTurn[] = currentMessage.trim()
    ? [...history, { role: 'user', content: currentMessage }]
    : [...history]
  const joined = all.map(t => t.content).join('\n')

  // Strategic topic: the first detected across the discussion.
  let strategicTopic: StrategicTopic = 'general'
  for (const t of all) {
    const topic = detectStrategicTopic(t.content)
    if (topic !== 'general') { strategicTopic = topic; break }
  }

  // Active objective: earliest user turn that sets an objective.
  let activeObjective: string | null = null
  for (const t of all) {
    if (t.role === 'user' && OBJECTIVE_VERB.test(t.content)) {
      activeObjective = firstSentence(t.content)
      break
    }
  }

  // Decisions made: a DONNA recommendation the Director accepted on the next turn.
  const decisionsMade: string[] = []
  for (let i = 0; i < all.length - 1; i++) {
    const cur = all[i]
    const nxt = all[i + 1]
    if (cur.role === 'donna' && /\b(i'?d recommend|i recommend|the move is|let'?s|we'?ll|best path)\b/i.test(cur.content)) {
      if (nxt.role === 'user' && ACK.test(nxt.content.trim())) {
        decisionsMade.push(firstSentence(cur.content))
      }
    }
  }

  // Open decisions: DONNA questions not yet answered by a later substantive turn.
  const openDecisions: string[] = []
  for (let i = 0; i < all.length; i++) {
    const t = all[i]
    if (t.role !== 'donna') continue
    const q = t.content.split(/(?<=[?])\s+/).find(s => s.trim().endsWith('?'))
    if (!q) continue
    const answered = all.slice(i + 1).some(n => n.role === 'user' && n.content.trim().length > 0)
    if (!answered) openDecisions.push(q.trim())
  }

  // Furthest stage reached.
  let stage: PlanningStage = 'objective'
  for (const { stage: s, re } of STAGE_SIGNALS) {
    if (re.test(joined)) {
      if (PROGRESSIVE_STAGES.indexOf(s) > PROGRESSIVE_STAGES.indexOf(stage)) stage = s
    }
  }

  return {
    turnCount: history.length,
    strategicTopic,
    activeObjective,
    decisionsMade: Array.from(new Set(decisionsMade)),
    openDecisions: Array.from(new Set(openDecisions)).slice(-3),
    assumptions: collect(all, /\b(assume|assuming|i'?ll take it that|presumably)\b/i).slice(0, 4),
    risks: collect(all, /\b(risk|danger|downside|exposure|jeopardi[sz]e|could backfire)\b/i).slice(0, 4),
    tradeoffs: collect(all, /\b(tradeoff|trade[- ]?off|in exchange|at the cost of|on the other hand|versus)\b/i).slice(0, 4),
    stage,
  }
}

// ── Executive challenge (Objective 3) ───────────────────────────────────────────

export interface IdeaAssessment {
  weak: boolean
  /** Why the idea is weak — always given so a challenge is never argumentative. */
  reason: string | null
  /** A respectful executive challenge frame, ready to open a response. */
  challenge: string | null
  kind: 'overcomplex' | 'wrong_problem' | 'premature' | 'scope_creep' | 'brute_force' | null
}

const WEAK_IDEA_SIGNALS: Array<{ kind: NonNullable<IdeaAssessment['kind']>; re: RegExp; reason: string; frame: string }> = [
  { kind: 'overcomplex', re: /\b(all at once|everything at once|build everything|from scratch|fully custom|every feature)\b/i,
    reason: 'doing it all at once spreads the effort thin and delays anything shipping', frame: 'That introduces unnecessary complexity' },
  { kind: 'brute_force', re: /\b(just hire (more|another)|just add more|throw (more )?(money|staff|coaches)|as many as possible)\b/i,
    reason: 'adding capacity treats the symptom, not the cause, and raises cost without fixing the bottleneck', frame: "I wouldn't recommend that" },
  { kind: 'wrong_problem', re: /\b(more marketing|spend more on ads|new logo|rebrand)\b/i,
    reason: "the constraint here isn't awareness — it's what happens after a family arrives", frame: "I think we're solving the wrong problem" },
  { kind: 'scope_creep', re: /\b(also add|while we'?re at it|might as well|and also build|on top of that build)\b/i,
    reason: 'bolting on scope now risks the core objective slipping', frame: "Let's not widen the scope yet" },
  { kind: 'premature', re: /\b(let'?s (just )?launch|ship it now|skip (the )?(planning|assessment)|go live (today|now))\b/i,
    reason: "we haven't agreed the objective and constraints, so we'd be building blind", frame: "There's a simpler, safer path" },
]

/** Assess the Director's latest idea for a respectful executive challenge. */
export function assessIdea(message: string, state?: DialogueState): IdeaAssessment {
  for (const sig of WEAK_IDEA_SIGNALS) {
    if (sig.re.test(message)) {
      return {
        weak: true,
        reason: sig.reason,
        kind: sig.kind,
        challenge: `${sig.frame} — ${sig.reason}.`,
      }
    }
  }
  // Premature execution: pushing to execute before the objective is set.
  if (state && !state.activeObjective && /\b(let'?s (do|start|build|create)|execute|go live|launch)\b/i.test(message)) {
    return {
      weak: true,
      kind: 'premature',
      reason: "we haven't agreed what we're actually solving yet",
      challenge: "I'd hold off for one moment — we haven't agreed what we're actually solving yet.",
    }
  }
  return { weak: false, reason: null, challenge: null, kind: null }
}

/** A challenge is respectful: it explains why and never attacks. */
export function isRespectfulChallenge(text: string): boolean {
  const explainsWhy = /—|because|the reason|so that|since/i.test(text)
  const argumentative = /\b(stupid|ridiculous|bad idea|that'?s wrong|you'?re wrong|absolutely not|no\.)\b/i.test(text)
  return explainsWhy && !argumentative
}

// ── Anti-repetition (Objective 6) ───────────────────────────────────────────────

function tokenize(s: string): Set<string> {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3),
  )
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  const inter = Array.from(a).filter(w => b.has(w)).length
  return inter / (a.size + b.size - inter)
}

/** True when a candidate reply substantially repeats a prior DONNA turn. */
export function isRepetitiveWith(candidate: string, history: ConversationTurn[], threshold = 0.6): boolean {
  const cand = tokenize(candidate)
  return history.some(t => t.role === 'donna' && jaccard(cand, tokenize(t.content)) >= threshold)
}

// ── Prompt fragment (fed into the existing reasoning gateway) ────────────────────

/** A compact DIALOGUE STATE block + directive for the OpenAI reasoning call. */
export function buildDialogueDirective(state: DialogueState, assessment?: IdeaAssessment): string {
  const lines: string[] = ['DIALOGUE STATE (think WITH the Director — do not restart):']
  if (state.activeObjective) lines.push(`OBJECTIVE: ${state.activeObjective}`)
  if (state.strategicTopic !== 'general') lines.push(`TOPIC: ${state.strategicTopic.replace(/_/g, ' ')}`)
  lines.push(`PLANNING_STAGE: ${state.stage} (next: ${nextStage(state.stage)})`)
  if (state.decisionsMade.length) lines.push(`DECIDED: ${state.decisionsMade.slice(-3).join(' | ')}`)
  if (state.openDecisions.length) lines.push(`OPEN: ${state.openDecisions.join(' | ')}`)
  if (state.assumptions.length) lines.push(`ASSUMPTIONS: ${state.assumptions.join(' | ')}`)
  if (state.risks.length) lines.push(`RISKS: ${state.risks.join(' | ')}`)
  if (state.tradeoffs.length) lines.push(`TRADEOFFS: ${state.tradeoffs.join(' | ')}`)

  const directive = [
    'Continue the SAME line of reasoning: reference what was already decided, do not re-derive it, and do not repeat points you have made.',
    `Move the discussion one step forward toward the ${nextStage(state.stage)} stage — build progressively, do not dump one large answer.`,
    assessment?.weak
      ? `The latest idea is weak (${assessment.kind}). Challenge it respectfully and explain why: ${assessment.challenge}`
      : 'If the Director proposes something weak, challenge it respectfully and explain why; otherwise build on it.',
    'Speak as a trusted COO thinking alongside the Director — natural, confident, direct, never robotic or repetitive.',
  ].join(' ')

  return `${lines.join('\n')}\n\n${directive}`
}
