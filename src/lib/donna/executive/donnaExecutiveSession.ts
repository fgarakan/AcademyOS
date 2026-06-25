// Mega Sprint 4081–4110 — DONNA Executive Operating Session V1
//
// DONNA stops thinking one conversation at a time and starts thinking one WORKDAY at
// a time. She owns the Director's operating session: which objectives are active,
// paused, or done; the operating agenda; the session timeline; and the next step —
// so the Director never has to remember where they left off.
//
// Derived, not stored. The session is REDUCED, per turn, from the conversation history
// that already flows through the Executive Context Packet — no new memory store, no new
// route, no new OpenAI call. Topic/work-area switches in the conversation drive
// pause/resume; the same history always reduces to the same session.
//
// Pure TypeScript — no DB, no API, no React, no side effects.

import type { ConversationTurn } from './donnaExecutiveDialogue'
import { detectStrategicTopic } from './donnaExecutiveDialogue'

// ── Work areas (the Director's objectives map to operating areas) ────────────────

export type WorkArea =
  | 'onboarding'
  | 'curriculum'
  | 'templates'
  | 'players'
  | 'coaches'
  | 'sessions'
  | 'approvals'
  | 'today'
  | 'placement'
  | 'level_up'

const AREA_LABEL: Record<WorkArea, string> = {
  onboarding: 'Academy setup',
  curriculum: 'Curriculum',
  templates: 'Templates',
  players: 'Players',
  coaches: 'Coaches',
  sessions: 'Sessions',
  approvals: 'Approvals',
  today: 'Today',
  placement: 'Placement',
  level_up: 'Level-up review',
}

export function areaLabel(area: WorkArea): string { return AREA_LABEL[area] }

// Route → area (used when the live turn carries a route). Most specific first.
const ROUTE_AREA: Array<[RegExp, WorkArea]> = [
  [/\/director\/(onboarding|setup)/, 'onboarding'],
  [/\/director\/curriculum/, 'curriculum'],
  [/\/director\/(class-templates|fitness|templates)/, 'templates'],
  [/\/director\/placement/, 'placement'],
  [/\/director\/level-up/, 'level_up'],
  [/\/director\/players/, 'players'],
  [/\/director\/coaches/, 'coaches'],
  [/\/director\/sessions/, 'sessions'],
  [/\/director\/review/, 'approvals'],
  [/\/director\/today/, 'today'],
]

// Message keyword → area. Order matters (specific before generic).
const AREA_SIGNALS: Array<[RegExp, WorkArea]> = [
  [/\b(onboarding|academy setup|set ?up the academy|academy dna|finish setup|first group)\b/i, 'onboarding'],
  [/\b(templates?|class template|fitness template)\b/i, 'templates'],
  [/\b(curriculum|development spine|progression levels?|the levels)\b/i, 'curriculum'],
  [/\b(placement|intake)\b/i, 'placement'],
  [/\b(level ?up|advancement review)\b/i, 'level_up'],
  [/\b(players?|player profile|skill path)\b/i, 'players'],
  [/\b(coach(es)?|staffing|hiring)\b/i, 'coaches'],
  [/\b(approvals?|review queue|pending review|pending approval)\b/i, 'approvals'],
  [/\b(sessions?|schedule|wrap[- ]?up)\b/i, 'sessions'],
  [/\b(today|daily brief)\b/i, 'today'],
]

/** Resolve the work area a turn refers to, preferring an explicit route. */
export function detectWorkArea(text: string, route?: string | null): WorkArea | null {
  if (route) {
    for (const [re, area] of ROUTE_AREA) if (re.test(route)) return area
  }
  for (const [re, area] of AREA_SIGNALS) if (re.test(text)) return area
  return null
}

// ── Phrase detectors (continuity / interruption / completion) ───────────────────

const RESUME_VERB = /\b(continue|resume|pick up|back to|return to|where were we|carry on|let'?s get back|go back to)\b/i
const BARE_RESUME = /^(continue|resume|next|carry on|keep going|where were we\??|pick up where we left off)\b/i
const CONTINUITY_QUERY = /\b(where were we|what remains|what'?s left|what should i do (now|next)|what'?s next|what do i (still )?need|what'?s outstanding)\b/i
const COMPLETION = /\b(done|finished|complete[d]?|that'?s set( up)?|all set|wrapped up|good to go|sorted|locked in)\b/i

/** True when the Director is asking DONNA to resume / report the session, not start new work. */
export function isWorkContinuityQuery(text: string): boolean {
  return CONTINUITY_QUERY.test(text) || BARE_RESUME.test(text.trim())
}

// ── Session model ───────────────────────────────────────────────────────────────

export type ObjectiveStatus = 'active' | 'paused' | 'completed'

export interface Objective {
  area: WorkArea
  label: string
  status: ObjectiveStatus
  startedAtTurn: number
  lastTouchedTurn: number
  /** Conclusions reached while working this objective (from DONNA recommendations). */
  decisions: string[]
  /** What the Director was last doing here — used to resume exactly. */
  lastProgress: string | null
}

export interface OperatingAgenda {
  currentPriority: string | null
  currentTask: string | null
  currentDecision: string | null
  currentBlocker: string | null
  nextAction: string | null
  futureQueue: string[]
}

export type TimelineKind = 'started' | 'decision' | 'completed' | 'deferred' | 'resumed' | 'state'

export interface TimelineEntry {
  turn: number
  kind: TimelineKind
  area: WorkArea | null
  detail: string
}

export interface ExecutiveSession {
  todaysObjectives: Objective[]
  activeObjective: Objective | null
  completedObjectives: Objective[]
  pausedObjectives: Objective[]
  /** active + paused — everything still open. */
  unfinishedObjectives: Objective[]
  pendingApprovals: number | null
  nextRecommendedAction: string | null
  agenda: OperatingAgenda
  timeline: TimelineEntry[]
  /** 0–1 confidence that the session state is cleanly tracked. */
  confidence: number
}

const RECOMMENDATION = /\b(i'?d recommend|i recommend|the move is|let'?s|we'?ll|next,? (create|set|define|open|review))\b/i

function firstSentence(s: string): string {
  return (s.trim().split(/(?<=[.!?])\s+/)[0] ?? s).trim()
}

// ── The reducer ─────────────────────────────────────────────────────────────────

export interface ReduceOptions {
  /** Route of the latest turn, when available (live wiring). */
  currentRoute?: string | null
  /** Pending approvals count (from already-loaded academy truth), if known. */
  pendingApprovals?: number | null
}

/**
 * Reduce the conversation into the live Executive Session. Pure + idempotent: the same
 * history always yields the same session. Work-area switches pause the active objective
 * (storing its progress + decisions) and activate/resume another; completion phrases
 * close an objective; resume phrases reactivate the most-recent paused objective.
 */
export function reduceExecutiveSession(
  history: ConversationTurn[],
  opts: ReduceOptions = {},
): ExecutiveSession {
  const objectives = new Map<WorkArea, Objective>()
  const order: WorkArea[] = []
  const timeline: TimelineEntry[] = []
  let active: WorkArea | null = null
  let pausedStack: WorkArea[] = [] // most-recent paused at the end

  const ensure = (area: WorkArea, turn: number): Objective => {
    let o = objectives.get(area)
    if (!o) {
      o = { area, label: AREA_LABEL[area], status: 'active', startedAtTurn: turn, lastTouchedTurn: turn, decisions: [], lastProgress: null }
      objectives.set(area, o)
      order.push(area)
      timeline.push({ turn, kind: 'started', area, detail: `Started ${AREA_LABEL[area]}` })
    }
    return o
  }

  const pauseActive = (turn: number) => {
    if (!active) return
    const o = objectives.get(active)
    if (o && o.status === 'active') {
      o.status = 'paused'
      o.lastTouchedTurn = turn
      pausedStack = pausedStack.filter(a => a !== active)
      pausedStack.push(active)
      timeline.push({ turn, kind: 'deferred', area: active, detail: `Paused ${o.label}` })
    }
  }

  const activate = (area: WorkArea, turn: number, resumed: boolean) => {
    const o = ensure(area, turn)
    o.status = 'active'
    o.lastTouchedTurn = turn
    pausedStack = pausedStack.filter(a => a !== area)
    active = area
    if (resumed) timeline.push({ turn, kind: 'resumed', area, detail: `Resumed ${o.label}${o.lastProgress ? ` — ${o.lastProgress}` : ''}` })
  }

  const complete = (area: WorkArea, turn: number) => {
    const o = objectives.get(area)
    if (!o) return
    o.status = 'completed'
    o.lastTouchedTurn = turn
    pausedStack = pausedStack.filter(a => a !== area)
    if (active === area) active = null
    timeline.push({ turn, kind: 'completed', area, detail: `Completed ${o.label}` })
  }

  for (let i = 0; i < history.length; i++) {
    const turn = history[i]
    const turnNo = i + 1
    // Use the live route only for the LAST turn (it reflects "now").
    const route = i === history.length - 1 ? opts.currentRoute ?? null : null

    if (turn.role === 'donna') {
      // Capture decisions/progress for the active objective.
      if (active) {
        const o = objectives.get(active)
        if (o && RECOMMENDATION.test(turn.content)) {
          o.decisions.push(firstSentence(turn.content))
          o.lastProgress = firstSentence(turn.content)
          timeline.push({ turn: turnNo, kind: 'decision', area: active, detail: firstSentence(turn.content) })
        }
      }
      continue
    }

    const text = turn.content
    const namedArea = detectWorkArea(text, route)

    // 1. Completion ("onboarding is done", "that's set up") — close named or active.
    if (COMPLETION.test(text)) {
      const target = namedArea ?? active
      if (target) { complete(target, turnNo); continue }
    }

    // 2. A continuity query ("what remains / what should I do now / where were we")
    // is a REPORT, not new work — never let it start an objective (e.g. the "today"
    // in "what remains today?" is temporal, not the Today page). Resume verbs fall
    // through to step 3.
    if (isWorkContinuityQuery(text) && !RESUME_VERB.test(text)) {
      continue
    }

    // 3. Resume ("back to onboarding", bare "continue/next") → reactivate.
    if (RESUME_VERB.test(text) || BARE_RESUME.test(text.trim())) {
      const target = namedArea ?? pausedStack[pausedStack.length - 1] ?? null
      if (target) {
        if (active && active !== target) pauseActive(turnNo)
        activate(target, turnNo, true)
        continue
      }
    }

    // 4. Work-area switch / start.
    if (namedArea && namedArea !== active) {
      pauseActive(turnNo)
      const wasKnown = objectives.has(namedArea)
      activate(namedArea, turnNo, wasKnown && objectives.get(namedArea)!.status !== 'completed')
      continue
    }
    // Same area → just touch it.
    if (namedArea && active === namedArea) {
      objectives.get(namedArea)!.lastTouchedTurn = turnNo
    }
  }

  const all = order.map(a => objectives.get(a)!).filter(Boolean)
  const activeObjective = active ? objectives.get(active) ?? null : null
  const completed = all.filter(o => o.status === 'completed')
  const paused = all.filter(o => o.status === 'paused')
  const unfinished = all.filter(o => o.status !== 'completed')

  // Next recommended action: finish the active objective, else resume the most-recent
  // paused, else the highest-value open item.
  const nextResume = pausedStack.length ? objectives.get(pausedStack[pausedStack.length - 1]) ?? null : null
  const nextRecommendedAction =
    activeObjective ? `Finish ${activeObjective.label}${activeObjective.lastProgress ? ` — ${activeObjective.lastProgress}` : ''}.`
    : nextResume ? `Resume ${nextResume.label} where you left off${nextResume.lastProgress ? ` — ${nextResume.lastProgress}` : ''}.`
    : paused[0] ? `Pick up ${paused[0].label}.`
    : unfinished[0] ? `Continue ${unfinished[0].label}.`
    : 'Tell me what you’d like to take on next.'

  const agenda: OperatingAgenda = {
    currentPriority: (activeObjective ?? nextResume ?? unfinished[0])?.label ?? null,
    currentTask: activeObjective?.lastProgress ?? activeObjective?.label ?? null,
    currentDecision: activeObjective?.decisions[activeObjective.decisions.length - 1] ?? null,
    currentBlocker: null,
    nextAction: nextRecommendedAction,
    futureQueue: unfinished.filter(o => o.area !== active).map(o => o.label),
  }

  timeline.push({
    turn: history.length,
    kind: 'state',
    area: active,
    detail: activeObjective
      ? `Active: ${activeObjective.label}. ${unfinished.length - 1} other open, ${completed.length} done.`
      : `No active objective. ${unfinished.length} open, ${completed.length} done.`,
  })

  // Confidence: clean when objectives were detected and the active state is unambiguous.
  const confidence = all.length === 0 ? 0.5
    : Math.min(1, 0.6 + 0.1 * Math.min(all.length, 3) + (activeObjective || completed.length ? 0.1 : 0))

  return {
    todaysObjectives: all,
    activeObjective,
    completedObjectives: completed,
    pausedObjectives: paused,
    unfinishedObjectives: unfinished,
    pendingApprovals: opts.pendingApprovals ?? null,
    nextRecommendedAction,
    agenda,
    timeline,
    confidence,
  }
}

// ── Work continuity (Objective 2) ───────────────────────────────────────────────

/**
 * Answer a "where were we / what remains / continue" query directly from the session —
 * DONNA never asks for context she already owns.
 */
export function answerWorkContinuity(session: ExecutiveSession): string {
  const done = session.completedObjectives.map(o => o.label)
  const open = session.unfinishedObjectives.map(o => o.label)
  const parts: string[] = []
  if (session.activeObjective) {
    parts.push(`We're on ${session.activeObjective.label}${session.activeObjective.lastProgress ? ` — ${session.activeObjective.lastProgress}` : ''}.`)
  }
  if (done.length) parts.push(`Done today: ${done.join(', ')}.`)
  if (open.length) parts.push(`Still open: ${open.join(', ')}.`)
  parts.push(session.nextRecommendedAction ?? 'Tell me what you’d like to take on next.')
  return parts.join(' ')
}

// ── Proactive guidance (Objective 6) ────────────────────────────────────────────

export interface ProactiveSignals {
  onboardingComplete?: boolean | null
  pendingApprovals?: number | null
  curriculumGaps?: number | null
  staffingIssues?: number | null
  academyRisks?: number | null
  highestValueOpportunity?: string | null
}

export interface ProactiveItem {
  kind: 'onboarding' | 'approvals' | 'curriculum' | 'staffing' | 'risk' | 'opportunity'
  message: string
  priority: number // higher = surface first
}

/**
 * Surface what deserves attention — but only when appropriate (no deep active work, or
 * the Director asked). Returns a ranked list; empty when DONNA should not interrupt.
 */
export function surfaceProactive(
  session: ExecutiveSession,
  signals: ProactiveSignals,
  opts: { directorAsked?: boolean } = {},
): { appropriate: boolean; items: ProactiveItem[] } {
  // Don't interrupt mid-objective unless asked.
  const appropriate = opts.directorAsked === true || session.activeObjective === null
  const items: ProactiveItem[] = []
  if (signals.onboardingComplete === false) items.push({ kind: 'onboarding', message: 'Academy setup is unfinished — it gates curriculum and groups.', priority: 90 })
  if ((signals.pendingApprovals ?? 0) > 0) items.push({ kind: 'approvals', message: `${signals.pendingApprovals} approval${signals.pendingApprovals! > 1 ? 's' : ''} waiting on you.`, priority: 80 })
  if ((signals.academyRisks ?? 0) > 0) items.push({ kind: 'risk', message: `${signals.academyRisks} academy risk${signals.academyRisks! > 1 ? 's' : ''} to look at.`, priority: 75 })
  if ((signals.curriculumGaps ?? 0) > 0) items.push({ kind: 'curriculum', message: `${signals.curriculumGaps} curriculum gap${signals.curriculumGaps! > 1 ? 's' : ''} open.`, priority: 60 })
  if ((signals.staffingIssues ?? 0) > 0) items.push({ kind: 'staffing', message: `${signals.staffingIssues} staffing issue${signals.staffingIssues! > 1 ? 's' : ''} to resolve.`, priority: 55 })
  if (signals.highestValueOpportunity) items.push({ kind: 'opportunity', message: signals.highestValueOpportunity, priority: 50 })
  items.sort((a, b) => b.priority - a.priority)
  return { appropriate, items: appropriate ? items : [] }
}

// ── Session timeline + diagnostics (Objectives 7 + 8) ────────────────────────────

/** Compact developer-only diagnostics of the operating session. */
export interface SessionDiagnostics {
  activeObjective: string | null
  pausedObjectives: string[]
  completedObjectives: string[]
  agenda: OperatingAgenda
  timeline: string[]
  nextRecommendedAction: string | null
  confidence: number
}

export function buildSessionDiagnostics(session: ExecutiveSession): SessionDiagnostics {
  return {
    activeObjective: session.activeObjective?.label ?? null,
    pausedObjectives: session.pausedObjectives.map(o => o.label),
    completedObjectives: session.completedObjectives.map(o => o.label),
    agenda: session.agenda,
    timeline: session.timeline.map(t => `t${t.turn} ${t.kind}${t.area ? ` [${t.area}]` : ''}: ${t.detail}`),
    nextRecommendedAction: session.nextRecommendedAction,
    confidence: session.confidence,
  }
}

/** A compact OPERATING SESSION block for the reasoning prompt (no new OpenAI call). */
export function buildSessionDirective(session: ExecutiveSession): string {
  const lines: string[] = ['OPERATING SESSION (you own the workday — resume, never re-ask):']
  if (session.activeObjective) lines.push(`ACTIVE: ${session.activeObjective.label}${session.activeObjective.lastProgress ? ` — ${session.activeObjective.lastProgress}` : ''}`)
  if (session.completedObjectives.length) lines.push(`DONE: ${session.completedObjectives.map(o => o.label).join(', ')}`)
  if (session.pausedObjectives.length) lines.push(`PAUSED: ${session.pausedObjectives.map(o => o.label + (o.lastProgress ? ` (${o.lastProgress})` : '')).join(' | ')}`)
  if (session.agenda.currentPriority) lines.push(`PRIORITY: ${session.agenda.currentPriority}`)
  if (session.agenda.futureQueue.length) lines.push(`QUEUE: ${session.agenda.futureQueue.join(', ')}`)
  lines.push(`NEXT: ${session.nextRecommendedAction ?? 'ask what to take on next'}`)
  lines.push('If the Director says "continue / next / where were we / what remains", resume from ACTIVE or the most-recent PAUSED — do not ask what they were doing.')
  return lines.join('\n')
}

export { detectStrategicTopic }
