// Mega Sprint 4261–4290 — DONNA Executive Intelligence Engine V1
//
// The first proactive-COO layer: review the academy's real state, detect risks and
// opportunities (each with evidence), prioritize what matters, and recommend the next
// best action — before the Director asks. Pure + deterministic over signals that are
// ALREADY computed elsewhere (DonnaAcademySignals / LivePageState) plus Durable
// Learning. No data fetching here, no invented signals (null = unknown → ignored), no
// new OpenAI pathway, no new memory system.
//
// Reuses: the live academy signals, the Durable Learning entries (LearningEntry), and
// the executive packet's DecisionRef slot for integration. It does not duplicate the
// attention/daily-brief engines — it unifies their inputs into one ranked executive view.

import type { LearningEntry } from '@/lib/donna/learning/learningEntryModel'
import type { DecisionRef } from './executiveTypes'

// ── Objective 1 — Academy Signal Map ────────────────────────────────────────────

export type SignalDomain =
  | 'onboarding' | 'players' | 'curriculum' | 'templates' | 'coaches'
  | 'sessions' | 'approvals' | 'assessments' | 'parent_player_risk' | 'durable_learning'

/** The (already-computed) signals this engine reasons over. Both DonnaAcademySignals
 *  and LivePageState are structurally assignable. Every field is optional + nullable —
 *  null/undefined means UNKNOWN and is never turned into a finding (no invented data). */
export interface AcademySignalSnapshot {
  onboardingComplete?: boolean | null
  curriculumSpineActive?: boolean | null
  playersMissingCurriculumLevel?: number | null
  placementQueueCount?: number | null
  levelUpQueueCount?: number | null
  playersNeedingAttention?: number | null
  playersWithoutAssessment?: number | null
  pendingParentApprovals?: number | null
  pendingCoachApprovals?: number | null
  activePlayerCount?: number | null
  activeCoachCount?: number | null
  upcomingSessions?: number | null
  unassignedSessions?: number | null
}

export interface MappedSignal {
  key: string
  domain: SignalDomain
  value: number | boolean
  /** Whether this signal was actually known (non-null) in the source. */
  known: true
  label: string
}

export interface ExecutiveSignalMap {
  signals: MappedSignal[]
  /** Count of distinct signal slots that were KNOWN (the engine's evidence base). */
  knownCount: number
  domainsCovered: SignalDomain[]
  /** Approved durable learning available to inform recommendations. */
  learningCount: number
}

const SIGNAL_DEFS: Array<{ key: keyof AcademySignalSnapshot; domain: SignalDomain; label: string }> = [
  { key: 'onboardingComplete', domain: 'onboarding', label: 'Onboarding complete' },
  { key: 'curriculumSpineActive', domain: 'curriculum', label: 'Curriculum spine active' },
  { key: 'playersMissingCurriculumLevel', domain: 'curriculum', label: 'Players missing a curriculum level' },
  { key: 'placementQueueCount', domain: 'players', label: 'Players in placement intake' },
  { key: 'levelUpQueueCount', domain: 'players', label: 'Players eligible for promotion' },
  { key: 'playersNeedingAttention', domain: 'parent_player_risk', label: 'Players needing attention' },
  { key: 'playersWithoutAssessment', domain: 'assessments', label: 'Players without a recent assessment' },
  { key: 'pendingParentApprovals', domain: 'approvals', label: 'Pending parent-facing approvals' },
  { key: 'pendingCoachApprovals', domain: 'approvals', label: 'Pending coach approvals' },
  { key: 'activePlayerCount', domain: 'players', label: 'Active players' },
  { key: 'activeCoachCount', domain: 'coaches', label: 'Active coaches' },
  { key: 'upcomingSessions', domain: 'sessions', label: 'Upcoming sessions (7 days)' },
  { key: 'unassignedSessions', domain: 'sessions', label: 'Sessions with no coach' },
]

function approvedLearning(learning: LearningEntry[]): LearningEntry[] {
  return learning.filter((e) => e.status === 'approved' || e.status === 'promoted')
}

/** Build the unified signal map from real, already-computed signals. */
export function buildSignalMap(snapshot: AcademySignalSnapshot, learning: LearningEntry[] = []): ExecutiveSignalMap {
  const signals: MappedSignal[] = []
  for (const def of SIGNAL_DEFS) {
    const v = snapshot[def.key]
    if (v === null || v === undefined) continue // unknown → never invented
    signals.push({ key: def.key, domain: def.domain, value: v as number | boolean, known: true, label: def.label })
  }
  const domainsCovered = Array.from(new Set(signals.map((s) => s.domain)))
  const learningCount = approvedLearning(learning).length
  if (learningCount > 0 && !domainsCovered.includes('durable_learning')) domainsCovered.push('durable_learning')
  return { signals, knownCount: signals.length, domainsCovered, learningCount }
}

function num(map: ExecutiveSignalMap, key: string): number | null {
  const s = map.signals.find((x) => x.key === key)
  return s && typeof s.value === 'number' ? s.value : null
}
function bool(map: ExecutiveSignalMap, key: string): boolean | null {
  const s = map.signals.find((x) => x.key === key)
  return s && typeof s.value === 'boolean' ? s.value : null
}

// ── Findings (risks + opportunities), each evidence-bearing ─────────────────────

export type FindingKind = 'risk' | 'opportunity'

export interface Evidence {
  signal: string
  detail: string
}

export interface Finding {
  id: string
  kind: FindingKind
  category: string
  domain: SignalDomain
  title: string
  evidence: Evidence[]      // ALWAYS non-empty (a finding without evidence is never emitted)
  urgency: number           // 0–1
  impact: number            // 0–1
  confidence: number        // 0–1
  effort: number            // 0–1 (lower = easier)
  dependency: number        // 0–1 (lower = fewer blockers)
  directorRelevance: number // 0–1
}

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)) }
/** Diminishing-returns magnitude → 0–1 (1 item ≈ 0.3, 5 ≈ 0.65, 12+ ≈ ~0.9). */
function magnitude(n: number): number { return clamp01(1 - Math.exp(-n / 4)) }

let _fid = 0
function mkFinding(f: Omit<Finding, 'id'>): Finding {
  _fid += 1
  return { id: `f${_fid}`, ...f }
}

// ── Objective 2 — Risk detection ────────────────────────────────────────────────

export function detectRisks(map: ExecutiveSignalMap): Finding[] {
  const out: Finding[] = []

  const spine = bool(map, 'curriculumSpineActive')
  const onboarding = bool(map, 'onboardingComplete')
  if (onboarding === false || spine === false) {
    const ev: Evidence[] = []
    if (onboarding === false) ev.push({ signal: 'onboardingComplete', detail: 'Onboarding is not finished' })
    if (spine === false) ev.push({ signal: 'curriculumSpineActive', detail: 'Curriculum spine is not active' })
    out.push(mkFinding({ kind: 'risk', category: 'incomplete_onboarding', domain: 'onboarding', title: 'Academy setup is incomplete', evidence: ev, urgency: 0.7, impact: 0.85, confidence: 1, effort: 0.5, dependency: 0.2, directorRelevance: 0.9 }))
  }

  const pp = num(map, 'pendingParentApprovals') ?? 0
  const pc = num(map, 'pendingCoachApprovals') ?? 0
  if (pp + pc > 0) {
    const ev: Evidence[] = []
    if (pp > 0) ev.push({ signal: 'pendingParentApprovals', detail: `${pp} parent-facing approval${pp === 1 ? '' : 's'} waiting` })
    if (pc > 0) ev.push({ signal: 'pendingCoachApprovals', detail: `${pc} coach approval${pc === 1 ? '' : 's'} waiting` })
    out.push(mkFinding({ kind: 'risk', category: 'pending_approvals', domain: 'approvals', title: 'Approvals are waiting in the queue', evidence: ev, urgency: clamp01(0.6 + magnitude(pp + pc) * 0.4), impact: magnitude(pp + pc), confidence: 1, effort: 0.2, dependency: 0.1, directorRelevance: 1 }))
  }

  const missing = num(map, 'playersMissingCurriculumLevel') ?? 0
  if (missing > 0) {
    out.push(mkFinding({ kind: 'risk', category: 'curriculum_gaps', domain: 'curriculum', title: 'Players have no curriculum level', evidence: [{ signal: 'playersMissingCurriculumLevel', detail: `${missing} active player${missing === 1 ? '' : 's'} without a level` }], urgency: clamp01(0.45 + magnitude(missing) * 0.4), impact: magnitude(missing), confidence: 1, effort: 0.4, dependency: 0.3, directorRelevance: 0.8 }))
  }

  const attention = num(map, 'playersNeedingAttention') ?? 0
  if (attention > 0) {
    out.push(mkFinding({ kind: 'risk', category: 'player_stagnation', domain: 'parent_player_risk', title: 'Players are showing attention signals', evidence: [{ signal: 'playersNeedingAttention', detail: `${attention} player${attention === 1 ? '' : 's'} flagged` }], urgency: clamp01(0.5 + magnitude(attention) * 0.4), impact: clamp01(0.5 + magnitude(attention) * 0.4), confidence: 0.9, effort: 0.5, dependency: 0.3, directorRelevance: 0.85 }))
  }

  const noAssess = num(map, 'playersWithoutAssessment') ?? 0
  if (noAssess > 0) {
    out.push(mkFinding({ kind: 'risk', category: 'missed_assessments', domain: 'assessments', title: 'Players are overdue for assessment', evidence: [{ signal: 'playersWithoutAssessment', detail: `${noAssess} player${noAssess === 1 ? '' : 's'} not assessed in 90 days` }], urgency: clamp01(0.35 + magnitude(noAssess) * 0.4), impact: magnitude(noAssess), confidence: 1, effort: 0.5, dependency: 0.3, directorRelevance: 0.7 }))
  }

  const unassigned = num(map, 'unassignedSessions') ?? 0
  if (unassigned > 0) {
    out.push(mkFinding({ kind: 'risk', category: 'workflow_blockers', domain: 'sessions', title: 'Upcoming sessions have no coach', evidence: [{ signal: 'unassignedSessions', detail: `${unassigned} session${unassigned === 1 ? '' : 's'} unassigned` }], urgency: clamp01(0.65 + magnitude(unassigned) * 0.35), impact: magnitude(unassigned), confidence: 1, effort: 0.3, dependency: 0.4, directorRelevance: 0.9 }))
  }

  return out
}

// ── Objective 3 — Opportunity detection ─────────────────────────────────────────

export function detectOpportunities(map: ExecutiveSignalMap, learning: LearningEntry[] = []): Finding[] {
  const out: Finding[] = []

  const levelUp = num(map, 'levelUpQueueCount') ?? 0
  if (levelUp > 0) {
    out.push(mkFinding({ kind: 'opportunity', category: 'promotion_candidates', domain: 'players', title: 'Players are ready to advance', evidence: [{ signal: 'levelUpQueueCount', detail: `${levelUp} player${levelUp === 1 ? '' : 's'} eligible for promotion` }], urgency: clamp01(0.4 + magnitude(levelUp) * 0.3), impact: clamp01(0.5 + magnitude(levelUp) * 0.4), confidence: 0.95, effort: 0.3, dependency: 0.2, directorRelevance: 0.85 }))
  }

  const placement = num(map, 'placementQueueCount') ?? 0
  if (placement > 0) {
    out.push(mkFinding({ kind: 'opportunity', category: 'enrollment_leverage', domain: 'players', title: 'Players are waiting to be placed', evidence: [{ signal: 'placementQueueCount', detail: `${placement} player${placement === 1 ? '' : 's'} in intake` }], urgency: clamp01(0.5 + magnitude(placement) * 0.3), impact: clamp01(0.55 + magnitude(placement) * 0.35), confidence: 1, effort: 0.4, dependency: 0.3, directorRelevance: 0.8 }))
  }

  const unassigned = num(map, 'unassignedSessions') ?? 0
  const coaches = num(map, 'activeCoachCount') ?? 0
  if (unassigned > 0 && coaches > 0) {
    out.push(mkFinding({ kind: 'opportunity', category: 'coach_assignment', domain: 'coaches', title: 'Coaches can cover open sessions', evidence: [{ signal: 'unassignedSessions', detail: `${unassigned} unassigned` }, { signal: 'activeCoachCount', detail: `${coaches} active coach${coaches === 1 ? '' : 'es'} available` }], urgency: 0.5, impact: magnitude(unassigned), confidence: 0.9, effort: 0.3, dependency: 0.3, directorRelevance: 0.75 }))
  }

  const pp = num(map, 'pendingParentApprovals') ?? 0
  if (pp > 0) {
    out.push(mkFinding({ kind: 'opportunity', category: 'parent_communication', domain: 'approvals', title: 'A parent-communication moment is open', evidence: [{ signal: 'pendingParentApprovals', detail: `${pp} parent-facing item${pp === 1 ? '' : 's'} ready to send` }], urgency: 0.45, impact: clamp01(0.4 + magnitude(pp) * 0.3), confidence: 0.9, effort: 0.2, dependency: 0.1, directorRelevance: 0.7 }))
  }

  // Curriculum-improvement opportunity informed by durable learning (reuse, not refetch).
  const curricLearning = approvedLearning(learning).filter((e) => e.tags[0] === 'curriculum_choice')
  if (curricLearning.length > 0) {
    out.push(mkFinding({ kind: 'opportunity', category: 'curriculum_improvement', domain: 'durable_learning', title: 'Apply a learned curriculum standard', evidence: curricLearning.slice(0, 2).map((e) => ({ signal: 'durable_learning', detail: e.summary })), urgency: 0.3, impact: 0.6, confidence: 0.7, effort: 0.4, dependency: 0.3, directorRelevance: 0.65 }))
  }

  return out
}

// ── Objective 4 — Prioritization ────────────────────────────────────────────────

export interface PrioritizedFinding extends Finding {
  score: number
}

const WEIGHTS = { urgency: 0.28, impact: 0.24, confidence: 0.16, effort: 0.12, dependency: 0.10, relevance: 0.10 }

/** Composite priority score (0–1). Effort and dependency are inverted (less = better). */
export function priorityScore(f: Finding): number {
  const base =
    WEIGHTS.urgency * f.urgency +
    WEIGHTS.impact * f.impact +
    WEIGHTS.confidence * f.confidence +
    WEIGHTS.effort * (1 - f.effort) +
    WEIGHTS.dependency * (1 - f.dependency) +
    WEIGHTS.relevance * f.directorRelevance
  // A real, time-sensitive risk edges out an equivalent opportunity.
  return clamp01(base + (f.kind === 'risk' ? 0.03 : 0))
}

/** Rank all findings and return only the top N (default 5; never a noisy dashboard). */
export function prioritize(findings: Finding[], max = 5): PrioritizedFinding[] {
  return findings
    .map((f) => ({ ...f, score: priorityScore(f) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(3, Math.min(max, 5)))
}

// ── Objective 5 — Executive recommendation ──────────────────────────────────────

export interface ExecutiveRecommendation {
  category: string
  kind: FindingKind
  situation: string
  evidence: string[]
  confidence: number
  impact: string
  recommendedAction: string
  whyNow: string
  nextStep: string
  score: number
}

const PLAYBOOK: Record<string, { action: string; whyNow: string; nextStep: string }> = {
  incomplete_onboarding: { action: 'Finish academy setup — activate the curriculum spine', whyNow: 'Nothing downstream (levels, sessions, assessments) works until setup is complete', nextStep: 'Open Academy Setup and complete the curriculum spine step' },
  pending_approvals: { action: 'Clear the review queue', whyNow: 'Approvals gate parent communication and coach actions — every hour they sit is a delay', nextStep: 'Open the review queue and approve or adjust each item' },
  curriculum_gaps: { action: 'Assign curriculum levels to the unplaced players', whyNow: 'Coaches cannot plan sessions for players without a level', nextStep: 'Open Players and set a level for each one missing it' },
  player_stagnation: { action: 'Review the flagged players and decide a next step', whyNow: 'Attention signals are the earliest sign of a retention or development risk', nextStep: 'Open the attention list and triage the top flags' },
  missed_assessments: { action: 'Schedule assessments for the overdue players', whyNow: 'Placement and promotion decisions need current data', nextStep: 'Open Players, filter overdue, and book assessments' },
  workflow_blockers: { action: 'Assign coaches to the open sessions', whyNow: 'An unassigned session cannot run', nextStep: 'Open Sessions and assign a coach to each unassigned slot' },
  promotion_candidates: { action: 'Review and approve the promotion-ready players', whyNow: 'Holding ready players back stalls their development and parent confidence', nextStep: 'Open the level-up queue and confirm each promotion' },
  enrollment_leverage: { action: 'Place the players waiting in intake', whyNow: 'Placement is the gate to active enrollment and revenue', nextStep: 'Open Placement and run each intake to completion' },
  coach_assignment: { action: 'Assign available coaches to the open sessions', whyNow: 'You have coverage capacity sitting idle against open slots', nextStep: 'Open Sessions and match coaches to unassigned slots' },
  parent_communication: { action: 'Send the ready parent-facing updates', whyNow: 'Timely, on-brand parent communication is a low-effort trust win', nextStep: 'Open the review queue and send the parent items' },
  curriculum_improvement: { action: 'Apply the curriculum standard you established', whyNow: 'You already decided this — applying it keeps the academy consistent', nextStep: 'Open Curriculum and apply the standard to the relevant levels' },
}

export function toRecommendation(f: PrioritizedFinding): ExecutiveRecommendation {
  const play = PLAYBOOK[f.category] ?? { action: f.title, whyNow: 'It is the highest-leverage item right now', nextStep: 'Open the relevant page and act on it' }
  return {
    category: f.category,
    kind: f.kind,
    situation: f.title,
    evidence: f.evidence.map((e) => e.detail),
    confidence: f.confidence,
    impact: f.impact >= 0.66 ? 'high' : f.impact >= 0.33 ? 'medium' : 'low',
    recommendedAction: play.action,
    whyNow: play.whyNow,
    nextStep: play.nextStep,
    score: f.score,
  }
}

// ── Objective 7 — Developer diagnostics ─────────────────────────────────────────

export interface ExecutiveIntelligenceDiagnostics {
  signalsInspected: number
  signalsKnown: number
  risksFound: number
  opportunitiesFound: number
  topPriorityScore: number
  evidenceUsed: number
  confidence: number
  recommendationSource: 'executive_intelligence'
  learningUsed: number
}

export function formatExecutiveIntelligenceDiagnostics(d: ExecutiveIntelligenceDiagnostics): string {
  return (
    `[donna.intelligence] inspected=${d.signalsInspected} known=${d.signalsKnown} ` +
    `risks=${d.risksFound} opps=${d.opportunitiesFound} topScore=${d.topPriorityScore.toFixed(2)} ` +
    `evidence=${d.evidenceUsed} confidence=${d.confidence.toFixed(2)} ` +
    `source=${d.recommendationSource} learningUsed=${d.learningUsed}`
  )
}

// ── Objective 6 — DONNA integration ─────────────────────────────────────────────

export interface ExecutiveBriefing {
  /** True only when there is real, known state to brief on. */
  hasState: boolean
  headline: string
  recommendations: ExecutiveRecommendation[]
  diagnostics: ExecutiveIntelligenceDiagnostics
}

const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five']

/** The full proactive pipeline: signals → risks + opportunities → top priorities →
 *  executive recommendations + a COO briefing. Pure. */
export function buildExecutiveBriefing(
  snapshot: AcademySignalSnapshot,
  learning: LearningEntry[] = [],
  opts: { max?: number } = {},
): ExecutiveBriefing {
  const map = buildSignalMap(snapshot, learning)
  const risks = detectRisks(map)
  const opportunities = detectOpportunities(map, learning)
  const top = prioritize([...risks, ...opportunities], opts.max ?? 5)
  const recommendations = top.map(toRecommendation)

  const evidenceUsed = top.reduce((n, f) => n + f.evidence.length, 0)
  const confidence = top.length ? top.reduce((s, f) => s + f.confidence, 0) / top.length : 0

  const diagnostics: ExecutiveIntelligenceDiagnostics = {
    signalsInspected: SIGNAL_DEFS.length,
    signalsKnown: map.knownCount,
    risksFound: risks.length,
    opportunitiesFound: opportunities.length,
    topPriorityScore: top[0]?.score ?? 0,
    evidenceUsed,
    confidence,
    recommendationSource: 'executive_intelligence',
    learningUsed: map.learningCount,
  }

  const n = recommendations.length
  const hasState = map.knownCount > 0 && n > 0
  const word = COUNT_WORDS[Math.min(n, 5)] ?? `${n}`
  const headline = !hasState
    ? "I reviewed the academy — nothing needs your attention right now."
    : `Good morning. I reviewed the academy. ${word.charAt(0).toUpperCase() + word.slice(1)} thing${n === 1 ? '' : 's'} need${n === 1 ? 's' : ''} attention today.`

  return { hasState, headline, recommendations, diagnostics }
}

/** A direct, calm, executive spoken briefing built from the recommendations. */
export function formatBriefingSpoken(b: ExecutiveBriefing): string {
  if (!b.hasState) return b.headline
  const lead = b.recommendations[0]
  const parts = [b.headline]
  parts.push(`First: ${lead.recommendedAction}. ${lead.situation} — ${lead.evidence.join(', ')}. ${lead.whyNow}. Next step: ${lead.nextStep}.`)
  if (b.recommendations.length > 1) {
    const rest = b.recommendations.slice(1).map((r) => r.recommendedAction)
    parts.push(`After that: ${rest.join('; ')}.`)
  }
  return parts.join(' ')
}

// Proactive questions that should be answered from Executive Intelligence, not chat.
const PROACTIVE =
  /\b(good morning|what should i do( today)?|how is the academy|how'?s the academy|what needs attention|what am i missing|what'?s (the )?highest priority|highest priority|what'?s most important|where (should|do) i (start|begin)|what'?s going on|brief me|catch me up)\b/i

/** True when the Director's message is a proactive "what matters?" question. */
export function isProactiveExecutiveQuestion(text: string): boolean {
  return PROACTIVE.test(text.trim())
}

/** Map the top recommendations into the executive packet's existing DecisionRef slot,
 *  so a live executive turn is grounded in the real priorities (reuse, not a new source). */
export function recommendationsToDecisions(recs: ExecutiveRecommendation[]): DecisionRef[] {
  return recs.map((r, i) => ({
    id: `ei-${i}-${r.category}`,
    summary: `${r.recommendedAction} — ${r.evidence.join(', ')}`,
    urgency: r.score >= 0.66 ? 'high' : r.score >= 0.4 ? 'medium' : 'low',
  }))
}
