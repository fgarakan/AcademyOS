// Sprint 1012 — Director Context Aggregator V1
// Aggregates all director-visible DONNA context from live sources.
// Read-only. No DB writes. No migrations required. Fails safely with demo fallback.
// Sprint 741 — Curriculum structural gap query wired (loadCurriculumStructuralGaps).
// Sprint 742B — Extended context wired: player_curriculum_states, assessments, groups, templates.
// Sprint 742C — Curriculum-to-template coverage gap detection wired (pure logic, no new DB calls).
// Sprint 742F — Recent decisions loader wired (last 15 approved/executed/rejected proposed_actions).

import type { DB } from '@/lib/types/db'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'
import { deriveOverallStatus } from '@/lib/donna/cooDataStatus'
import { loadCurriculumStructuralGaps } from '@/lib/donna/curriculumStructuralGapLoader'
import {
  loadPlayerCurriculumStates,
  loadAssessmentsSummary,
  loadGroupsSummary,
  loadTemplatesSummary,
} from '@/lib/donna/extendedContextLoaders'
import type {
  PlayerCurriculumStateSummary,
  AssessmentSummary,
  GroupSummary,
  TemplateSummary,
} from '@/lib/donna/extendedContextLoaders'
import {
  detectCurriculumTemplateCoverageGaps,
} from '@/lib/donna/curriculumTemplateCoverageGapDetector'
import type {
  CurriculumTemplateCoverageGap,
} from '@/lib/donna/curriculumTemplateCoverageGapDetector'
import {
  detectAssessmentCoverageGaps,
} from '@/lib/donna/assessmentCoverageGapDetector'
import type {
  AssessmentCoverageGap,
} from '@/lib/donna/assessmentCoverageGapDetector'
import { loadRecentDecisions } from '@/lib/donna/recentDecisionsLoader'
import type { RecentDecisionSummary } from '@/lib/donna/recentDecisionsLoader'
import { detectPlayerProgressStalls } from '@/lib/donna/playerProgressStallDetector'
import type { PlayerProgressStall } from '@/lib/donna/playerProgressStallDetector'
import { loadCurriculumBottleneck } from '@/lib/donna/curriculumBottleneckLoader'
import { deriveLevelKeyFromSignal } from '@/lib/curriculum/curriculumAttentionRanking'

// ── Output types ──────────────────────────────────────────────────────────────

export type AttentionRisk = 'high' | 'medium' | 'low'

export interface DirectorAttentionItem {
  playerId: string | null
  playerName: string | null
  reason: string
  risk: AttentionRisk
  source: 'observation' | 'attendance' | 'wrap_up' | 'manual'
}

export interface DirectorAcademyRisk {
  signal: string
  detail: string
  urgency: 'high' | 'medium' | 'low'
  actionHref?: string
}

export interface DirectorRecommendedAction {
  id: string
  label: string
  reason: string
  href: string
  category: 'review' | 'approve' | 'investigate' | 'communicate'
}

export interface DirectorSourceLabel {
  field: string
  status: COOFieldStatus
  label: string
}

export interface DirectorDonnaContext {
  // Counts
  pendingReviews: number
  missingWrapUps: number
  templateDrafts: number
  attendanceExceptions: number
  evidenceDrafts: number
  todaySessions: number
  // Setup status (Sprint 721)
  playerCount: number
  coachCount: number
  isFirstTimeSetup: boolean
  // Lists
  attentionItems: DirectorAttentionItem[]
  curriculumGaps: string[]
  academyRisks: DirectorAcademyRisk[]
  recommendedActions: DirectorRecommendedAction[]
  // Extended context (Sprint 742B)
  playerCurriculumStateCount: number
  advancementEligibleCount: number
  groupCount: number
  templateCount: number
  assessmentCount: number
  recentAssessmentCount: number
  playerProgressContextAvailable: boolean
  assessmentContextAvailable: boolean
  groupContextAvailable: boolean
  templateContextAvailable: boolean
  playerCurriculumStateSummaries: PlayerCurriculumStateSummary[]
  groupSummaries: GroupSummary[]
  templateSummaries: TemplateSummary[]
  assessmentSummaries: AssessmentSummary[]
  // Curriculum-to-template coverage (Sprint 742C)
  curriculumTemplateCoverageGaps: CurriculumTemplateCoverageGap[]
  curriculumTemplateCoverageGapCount: number
  templateCoverageContextAvailable: boolean
  // Assessment coverage (Sprint 742D)
  assessmentCoverageGaps: AssessmentCoverageGap[]
  assessmentCoverageGapCount: number
  eligibleWithoutAssessmentEvidence: number
  // Recent decisions (Sprint 742F)
  recentDecisions: RecentDecisionSummary[]
  recentDecisionContextAvailable: boolean
  // Player progress stalls (Sprint 742G)
  playerProgressStalls: PlayerProgressStall[]
  playerProgressStallCount: number
  playerProgressStallContextAvailable: boolean
  // Curriculum bottleneck (Mega Sprint 1996–2005)
  mostBlockedLevelName: string | null
  mostBlockedLevelKey: string | null
  mostBlockedLevelStalledCount: number
  mostBlockedLevelAvgCompletion: number
  topTaggedConcern: string | null
  topTaggedConcernCount: number  // Sprint 2011–2015: observation count for confidence gating
  // Sprint 913.1 — Operating Intelligence Context Expansion
  // curriculum override drafts (academy_curriculum_overrides — separate from proposed_actions)
  curriculumDraftCount: number
  // oldest proposed_action in queue — null when queue is empty
  oldestPendingReviewAgeDays: number | null
  // derived risk counts from attentionItems — for cleaner answer engine logic
  highRiskPlayerCount: number
  mediumRiskPlayerCount: number
  // derived booleans from count fields
  hasPlayers: boolean
  hasCoaches: boolean
  hasTemplates: boolean
  hasCurriculumGaps: boolean
  // inferred onboarding readiness (APPROXIMATE — not the formal academy.settings flags)
  onboardingReadinessLevel: 'not_started' | 'partial' | 'nearly_ready' | 'ready_signal' | 'unknown'
  // Meta
  sourceLabels: DirectorSourceLabel[]
  confidence: DONNAConfidence
  isLive: boolean
}

// ── Demo fallback ─────────────────────────────────────────────────────────────

// Exported (Sprint 3211–3240) so the executive-experience certification can reuse
// the canonical demo context instead of hand-rolling a fixture. No behavior change.
export function buildDemoContext(): DirectorDonnaContext {
  return {
    pendingReviews: 3,
    missingWrapUps: 2,
    templateDrafts: 1,
    attendanceExceptions: 2,
    evidenceDrafts: 4,
    todaySessions: 5,
    playerCount: 8,
    coachCount: 3,
    isFirstTimeSetup: false,
    attentionItems: [
      {
        playerId: null,
        playerName: 'Demo Player A',
        reason: '3 concern observations in last 30 days',
        risk: 'high',
        source: 'observation',
      },
      {
        playerId: null,
        playerName: 'Demo Player B',
        reason: '2 absences in last 7 days',
        risk: 'medium',
        source: 'attendance',
      },
    ],
    curriculumGaps: [
      'Level 2 — forehand consistency (3 players stalled)',
      'Level 3 — serve mechanics (bottleneck, 2 sessions flagged)',
    ],
    academyRisks: [
      {
        signal: 'Wrap-up gap',
        detail: '2 coaches have not submitted wrap-ups for today',
        urgency: 'medium',
        actionHref: '/director/review',
      },
      {
        signal: 'Pending reviews',
        detail: '3 items awaiting director decision',
        urgency: 'high',
        actionHref: '/director/review',
      },
    ],
    recommendedActions: [
      {
        id: 'review_pending',
        label: 'Review pending items',
        reason: '3 items need director decision',
        href: '/director/review',
        category: 'review',
      },
      {
        id: 'chase_wrapups',
        label: 'Follow up on missing wrap-ups',
        reason: '2 coaches still outstanding',
        href: '/director/sessions',
        category: 'investigate',
      },
    ],
    // Extended context — empty in demo mode
    playerCurriculumStateCount: 0,
    advancementEligibleCount: 0,
    groupCount: 0,
    templateCount: 0,
    assessmentCount: 0,
    recentAssessmentCount: 0,
    playerProgressContextAvailable: false,
    assessmentContextAvailable: false,
    groupContextAvailable: false,
    templateContextAvailable: false,
    playerCurriculumStateSummaries: [],
    groupSummaries: [],
    templateSummaries: [],
    assessmentSummaries: [],
    // Coverage gaps — empty in demo mode
    curriculumTemplateCoverageGaps: [],
    curriculumTemplateCoverageGapCount: 0,
    templateCoverageContextAvailable: false,
    assessmentCoverageGaps: [],
    assessmentCoverageGapCount: 0,
    eligibleWithoutAssessmentEvidence: 0,
    // Recent decisions — empty in demo mode
    recentDecisions: [],
    recentDecisionContextAvailable: false,
    // Player progress stalls — empty in demo mode
    playerProgressStalls: [],
    playerProgressStallCount: 0,
    playerProgressStallContextAvailable: false,
    // Curriculum bottleneck — empty in demo mode
    mostBlockedLevelName: null,
    mostBlockedLevelKey: null,
    mostBlockedLevelStalledCount: 0,
    mostBlockedLevelAvgCompletion: 0,
    topTaggedConcern: null,
    topTaggedConcernCount: 0,
    // Sprint 913.1 — Operating Intelligence (demo values)
    curriculumDraftCount: 2,
    oldestPendingReviewAgeDays: 3,
    highRiskPlayerCount: 1,
    mediumRiskPlayerCount: 1,
    hasPlayers: true,
    hasCoaches: true,
    hasTemplates: false,
    hasCurriculumGaps: true,
    onboardingReadinessLevel: 'partial',
    sourceLabels: [
      { field: 'Review queue', status: 'insufficient_data', label: 'Demo data' },
      { field: 'Sessions', status: 'insufficient_data', label: 'Demo data' },
      { field: 'Attention flags', status: 'insufficient_data', label: 'Demo data' },
    ],
    confidence: 'insufficient',
    isLive: false,
  }
}

// ── Aggregator ────────────────────────────────────────────────────────────────

export async function loadDirectorDonnaContext(
  db: DB,
  academyId: string,
): Promise<DirectorDonnaContext> {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const fieldStatuses: Record<string, COOFieldStatus> = {}

  // ── 1. Today's sessions ───────────────────────────────────────────────────

  let todaySessions = 0
  let sessionIds: string[] = []

  try {
    const { data: sessRows } = await db
      .from('sessions')
      .select('id')
      .eq('academy_id', academyId)
      .eq('scheduled_date', today)

    sessionIds = (sessRows ?? []).map(s => s.id)
    todaySessions = sessionIds.length
    fieldStatuses.sessions = todaySessions > 0 ? 'live' : 'insufficient_data'
  } catch {
    fieldStatuses.sessions = 'insufficient_data'
  }

  // ── 2. Pending reviews ────────────────────────────────────────────────────

  let pendingReviews = 0

  try {
    const { count } = await db
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')

    pendingReviews = count ?? 0
    fieldStatuses.reviewQueue = 'live'
  } catch {
    fieldStatuses.reviewQueue = 'insufficient_data'
  }

  // ── 2.5 Oldest pending review age (Sprint 913.1) ─────────────────────────
  // Finds the oldest proposed_action in pending_review status to detect stale queues.
  // Non-fatal: null when queue is empty or query fails.

  let oldestPendingReviewAgeDays: number | null = null

  try {
    const { data: oldestRows } = await db
      .from('proposed_actions')
      .select('created_at')
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true })
      .limit(1)

    const oldestCreatedAt = oldestRows?.[0]?.created_at
    if (oldestCreatedAt) {
      const ageMs = Date.now() - new Date(oldestCreatedAt).getTime()
      oldestPendingReviewAgeDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))
    }
  } catch {
    // non-fatal — null means age unknown
  }

  // ── 2b. Player count (Sprint 723) ─────────────────────────────────────────

  let playerCount = 0

  try {
    const { count: pCount } = await db
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
    playerCount = pCount ?? 0
    fieldStatuses.players = 'live'
  } catch {
    fieldStatuses.players = 'insufficient_data'
  }

  // ── 2c. Coach count (Sprint 723) ───────────────────────────────────────────

  let coachCount = 0

  try {
    const rawDbMemberships = db as any
    const { count: cCount } = await rawDbMemberships
      .from('academy_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .in('role', ['coach', 'head_coach'])
      .eq('is_active', true)
    coachCount = cCount ?? 0
    fieldStatuses.coaches = 'live'
  } catch {
    fieldStatuses.coaches = 'insufficient_data'
  }

  // ── 3. Missing wrap-ups (sessions today without a wrap-up proposed action) ─

  let missingWrapUps = 0

  try {
    if (sessionIds.length > 0) {
      const { data: wrapUpRows } = await db
        .from('proposed_actions')
        .select('target_object_id')
        .eq('academy_id', academyId)
        .eq('target_module', 'session_wrap_up_v1')
        .in('status', ['pending_review', 'approved'])
        .in('target_object_id', sessionIds)

      const wrappedSessionIds = new Set<string>()
      for (const row of wrapUpRows ?? []) {
        if (row.target_object_id) wrappedSessionIds.add(row.target_object_id)
      }

      missingWrapUps = sessionIds.filter(id => !wrappedSessionIds.has(id)).length
    }
    fieldStatuses.wrapUps = 'live'
  } catch {
    fieldStatuses.wrapUps = 'insufficient_data'
  }

  // ── 4. Attendance exceptions ───────────────────────────────────────────────

  let attendanceExceptions = 0

  try {
    const { count } = await db
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('target_module', 'attendance')
      .eq('status', 'pending_review')

    attendanceExceptions = count ?? 0
    fieldStatuses.attendance = 'live'
  } catch {
    fieldStatuses.attendance = 'insufficient_data'
  }

  // ── 5. Evidence and template drafts ───────────────────────────────────────

  let evidenceDrafts = 0
  let templateDrafts = 0

  try {
    const { data: draftRows } = await db
      .from('proposed_actions')
      .select('target_module')
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')

    for (const row of draftRows ?? []) {
      const tm = row.target_module ?? ''
      if (tm.includes('curriculum_evidence') || tm.includes('evidence')) evidenceDrafts++
      if (tm.includes('template')) templateDrafts++
    }

    fieldStatuses.drafts = 'live'
  } catch {
    fieldStatuses.drafts = 'insufficient_data'
  }

  // ── 5b. Curriculum override drafts (Sprint 913.1) ────────────────────────
  // Counts pending/draft rows in academy_curriculum_overrides — the separate
  // curriculum change queue written by DONNA voice commands.
  // Uses (db as any) because academy_curriculum_overrides is not in generated types.
  // Non-fatal: 0 when table unavailable or query fails.

  let curriculumDraftCount = 0

  try {
    const { count: cdCount } = await (db as any)
      .from('academy_curriculum_overrides')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .in('status', ['pending_review', 'draft'])
    if (typeof cdCount === 'number') curriculumDraftCount = cdCount
    fieldStatuses.curriculumDrafts = 'live'
  } catch {
    fieldStatuses.curriculumDrafts = 'insufficient_data'
  }

  // ── 6. Attention items (concern observations + absences) ───────────────────

  const attentionItems: DirectorAttentionItem[] = []
  const concernsByPlayer = new Map<string, number>()
  const absencesByPlayer = new Map<string, number>()

  try {
    const { data: concernObs } = await db
      .from('coach_observations')
      .select('player_id')
      .eq('academy_id', academyId)
      .eq('observation_type', 'concern')
      .gte('created_at', thirtyDaysAgo)

    for (const obs of concernObs ?? []) {
      concernsByPlayer.set(obs.player_id, (concernsByPlayer.get(obs.player_id) ?? 0) + 1)
    }

    const { data: recentSessionRows } = await db
      .from('sessions')
      .select('id')
      .eq('academy_id', academyId)
      .gte('scheduled_date', sevenDaysAgoDate)

    const recentIds = (recentSessionRows ?? []).map(s => s.id)

    if (recentIds.length > 0) {
      const { data: absenceRows } = await db
        .from('session_attendance')
        .select('player_id')
        .in('session_id', recentIds)
        .neq('status', 'present')

      for (const row of absenceRows ?? []) {
        absencesByPlayer.set(row.player_id, (absencesByPlayer.get(row.player_id) ?? 0) + 1)
      }
    }

    const concernIds = Array.from(concernsByPlayer.keys())
    const absenceIds = Array.from(absencesByPlayer.keys())
    const flaggedIds = Array.from(new Set([...concernIds, ...absenceIds]))

    if (flaggedIds.length > 0) {
      const { data: playerRows } = await db
        .from('players')
        .select('id, first_name, last_name')
        .in('id', flaggedIds)

      const nameMap = new Map<string, string>()
      for (const p of playerRows ?? []) {
        nameMap.set(p.id, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Player')
      }

      for (const pid of flaggedIds) {
        const concerns = concernsByPlayer.get(pid) ?? 0
        const absences = absencesByPlayer.get(pid) ?? 0
        const risk: AttentionRisk =
          concerns > 2 || absences > 3 ? 'high' : concerns > 0 || absences > 1 ? 'medium' : 'low'

        if (concerns > 0) {
          attentionItems.push({
            playerId: pid,
            playerName: nameMap.get(pid) ?? null,
            reason: `${concerns} concern observation${concerns !== 1 ? 's' : ''} in last 30 days`,
            risk,
            source: 'observation',
          })
        } else {
          attentionItems.push({
            playerId: pid,
            playerName: nameMap.get(pid) ?? null,
            reason: `${absences} absence${absences !== 1 ? 's' : ''} in last 7 days`,
            risk,
            source: 'attendance',
          })
        }
      }

      const RISK_ORDER: Record<AttentionRisk, number> = { high: 0, medium: 1, low: 2 }
      attentionItems.sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk])
    }

    fieldStatuses.attentionItems = attentionItems.length > 0 ? 'live' : 'insufficient_data'
  } catch {
    fieldStatuses.attentionItems = 'insufficient_data'
  }

  // ── 7. Curriculum gaps (structural gap query — Sprint 741) ───────────────────
  // loadCurriculumStructuralGaps queries curriculum_levels + curriculum_gates +
  // curriculum_drills (global and academy-scoped). Returns gap strings such as
  // "Orange 2 — no drills defined (3 gates exist)". Fails safely with [] on
  // any RLS block or schema error. Player-progress gaps remain blocked pending
  // migrations 041-044 (documented in DONNA_CURRICULUM_GAP_WIREUP_LIMITATION_741.md).

  let curriculumGaps: string[] = []

  try {
    curriculumGaps = await loadCurriculumStructuralGaps(db, academyId)
    fieldStatuses.curriculum = curriculumGaps.length > 0 ? 'live' : 'partial'
  } catch {
    fieldStatuses.curriculum = 'insufficient_data'
  }

  // ── 7b. Player curriculum states (Sprint 742B) ────────────────────────────
  // Loads player_curriculum_states: level distribution, advancement-eligible count.
  // Academy-scoped. Capped at 30. Fails safely.

  let playerCurriculumStateCount = 0
  let advancementEligibleCount = 0
  let playerCurriculumStateSummaries: PlayerCurriculumStateSummary[] = []

  const pcsResult = await loadPlayerCurriculumStates(db, academyId)
  playerCurriculumStateCount = pcsResult.totalCount
  advancementEligibleCount = pcsResult.advancementEligibleCount
  playerCurriculumStateSummaries = pcsResult.summaries
  fieldStatuses.playerCurriculumStates = pcsResult.fieldStatus

  // ── 7c. Assessments (Sprint 742B) ─────────────────────────────────────────
  // Loads assessments: total count, recent (last 30 days) count, promotion_ready signals.
  // Academy-scoped. Capped at 30. Fails safely.
  // Note: assessments table has no status column — recency used as pipeline health proxy.

  let assessmentCount = 0
  let recentAssessmentCount = 0
  let assessmentSummaries: AssessmentSummary[] = []

  const assessmentResult = await loadAssessmentsSummary(db, academyId)
  assessmentCount = assessmentResult.totalCount
  recentAssessmentCount = assessmentResult.recentCount
  assessmentSummaries = assessmentResult.summaries
  fieldStatuses.assessments = assessmentResult.fieldStatus

  // ── 7d. Groups (Sprint 742B) ──────────────────────────────────────────────
  // Loads active groups: name, level_id, track, max_players.
  // Academy-scoped. Capped at 30. Fails safely.

  let groupCount = 0
  let groupSummaries: GroupSummary[] = []

  const groupResult = await loadGroupsSummary(db, academyId)
  groupCount = groupResult.totalCount
  groupSummaries = groupResult.summaries
  fieldStatuses.groups = groupResult.fieldStatus

  // ── 7e. Templates (Sprint 742B) ───────────────────────────────────────────
  // Loads active templates: name, type, curriculum_level_key, curriculum_stage_key.
  // Academy-scoped. Capped at 30. Fails safely.
  // curriculum_level_key surfaces template-to-curriculum coverage for DONNA gap reasoning.

  let templateCount = 0
  let templateSummaries: TemplateSummary[] = []

  const templateResult = await loadTemplatesSummary(db, academyId)
  templateCount = templateResult.totalCount
  templateSummaries = templateResult.summaries
  fieldStatuses.templates = templateResult.fieldStatus

  // ── 7f-1. Assessment coverage gaps (Sprint 742D) ──────────────────────────
  // Pure logic: cross-references playerCurriculumStateSummaries with assessmentSummaries.
  // Detects overdue assessments (>90 days) and advancement-eligible players without promotion evidence.

  const assessmentGapResult = detectAssessmentCoverageGaps({
    playerCurriculumStateSummaries,
    assessmentSummaries,
    playerProgressContextAvailable: pcsResult.fieldStatus === 'live',
    assessmentContextAvailable: assessmentResult.fieldStatus === 'live',
  })

  const assessmentCoverageGaps = assessmentGapResult.gaps
  const assessmentCoverageGapCount = assessmentGapResult.gaps.length
  const eligibleWithoutAssessmentEvidence = assessmentGapResult.eligibleWithoutEvidence

  // ── 7f. Curriculum-to-template coverage gaps (Sprint 742C) ───────────────
  // Pure logic: no new DB call. Runs on already-loaded summaries from 7b and 7e.
  // Detects levels with active players but no active class template assigned by UUID.

  const coverageResult = detectCurriculumTemplateCoverageGaps({
    playerCurriculumStateSummaries,
    templateSummaries,
    playerProgressContextAvailable: pcsResult.fieldStatus === 'live',
    templateContextAvailable: templateResult.fieldStatus === 'live',
  })

  const curriculumTemplateCoverageGaps = coverageResult.gaps
  const curriculumTemplateCoverageGapCount = coverageResult.gaps.length
  const templateCoverageContextAvailable = coverageResult.coverageAvailable

  // ── 7g. Recent decisions (Sprint 742F) ───────────────────────────────────
  // Loads last 15 approved/executed/rejected/modified proposed_actions.
  // Director-scoped read. Used for "what happened last?" / audit trail answers.

  let recentDecisions: RecentDecisionSummary[] = []
  let recentDecisionContextAvailable = false

  const recentDecisionsResult = await loadRecentDecisions(db, academyId)
  recentDecisions = recentDecisionsResult.decisions
  recentDecisionContextAvailable = recentDecisionsResult.fieldStatus === 'live'
  fieldStatuses.recentDecisions = recentDecisionsResult.fieldStatus

  // ── 7h. Player progress stalls (Sprint 742G) ──────────────────────────────
  // Pure logic: no new DB call. Runs on already-loaded playerCurriculumStateSummaries.
  // Detects players stalled at a level for >90 days without advancing.
  // Does not overlap with advancementEligible — stalled players are NOT yet eligible.

  const stallResult = detectPlayerProgressStalls({
    playerProgressContextAvailable: pcsResult.fieldStatus === 'live',
    playerCurriculumStateSummaries,
  })

  const playerProgressStalls = stallResult.stalls
  const playerProgressStallCount = stallResult.stalls.length
  const playerProgressStallContextAvailable = stallResult.stallContextAvailable

  // ── Curriculum bottleneck (Mega Sprint 1996–2005) ────────────────────────
  // Reads player_requirement_progress to surface the most blocked curriculum level.
  // Non-fatal — all fields zero-default when unavailable.

  let mostBlockedLevelName: string | null = null
  let mostBlockedLevelKey: string | null = null
  let mostBlockedLevelStalledCount = 0
  let mostBlockedLevelAvgCompletion = 0
  let topTaggedConcern: string | null = null
  let topTaggedConcernCount = 0

  try {
    const bottleneckResult = await loadCurriculumBottleneck(db, academyId)
    if (bottleneckResult.levelBottlenecks.length > 0) {
      const top = bottleneckResult.levelBottlenecks[0]
      mostBlockedLevelName         = top.levelName
      mostBlockedLevelKey          = deriveLevelKeyFromSignal(top.stage, top.levelName)
      mostBlockedLevelStalledCount = top.stalled
      mostBlockedLevelAvgCompletion = top.avgCompletionPct
    }
    if (bottleneckResult.topTaggedConcerns.length > 0) {
      topTaggedConcern      = bottleneckResult.topTaggedConcerns[0].tag
      topTaggedConcernCount = bottleneckResult.topTaggedConcerns[0].count
    }
    fieldStatuses.curriculumBottleneck = bottleneckResult.fieldStatus
  } catch {
    fieldStatuses.curriculumBottleneck = 'insufficient_data'
  }

  // ── Sprint 913.1: Derived operating intelligence fields ──────────────────
  // Computed from already-loaded context — no new DB queries.

  const highRiskPlayerCount  = attentionItems.filter(a => a.risk === 'high').length
  const mediumRiskPlayerCount = attentionItems.filter(a => a.risk === 'medium').length
  const hasPlayers     = playerCount > 0
  const hasCoaches     = coachCount > 0
  const hasTemplates   = templateCount > 0
  const hasCurriculumGaps = curriculumGaps.length > 0

  // Inferred onboarding readiness from count signals.
  // APPROXIMATE — not the formal academy.settings step-completion flags.
  const onboardingReadinessLevel: DirectorDonnaContext['onboardingReadinessLevel'] =
    !hasPlayers && !hasCoaches ? 'not_started' :
    hasPlayers && hasCoaches && hasTemplates && !hasCurriculumGaps ? 'ready_signal' :
    hasPlayers && hasCoaches && !hasCurriculumGaps ? 'nearly_ready' :
    hasPlayers || hasCoaches ? 'partial' : 'unknown'

  // ── 8. Academy risks ───────────────────────────────────────────────────────

  const academyRisks: DirectorAcademyRisk[] = []

  if (pendingReviews > 0) {
    academyRisks.push({
      signal: 'Pending reviews',
      detail: `${pendingReviews} item${pendingReviews !== 1 ? 's' : ''} awaiting director decision`,
      urgency: pendingReviews >= 5 ? 'high' : 'medium',
      actionHref: '/director/review',
    })
  }

  if (missingWrapUps > 0) {
    academyRisks.push({
      signal: 'Missing wrap-ups',
      detail: `${missingWrapUps} session${missingWrapUps !== 1 ? 's' : ''} without a coach wrap-up`,
      urgency: missingWrapUps >= 3 ? 'high' : 'medium',
      actionHref: '/director/sessions',
    })
  }

  if (attendanceExceptions > 0) {
    academyRisks.push({
      signal: 'Attendance exceptions',
      detail: `${attendanceExceptions} exception${attendanceExceptions !== 1 ? 's' : ''} need confirmation`,
      urgency: attendanceExceptions >= 3 ? 'high' : 'low',
      actionHref: '/director/review',
    })
  }

  const highRiskPlayers = attentionItems.filter(a => a.risk === 'high').length
  if (highRiskPlayers > 0) {
    academyRisks.push({
      signal: 'Player attention needed',
      detail: `${highRiskPlayers} player${highRiskPlayers !== 1 ? 's' : ''} flagged as high risk`,
      urgency: 'high',
      actionHref: '/director/players',
    })
  }

  if (advancementEligibleCount > 0) {
    academyRisks.push({
      signal: 'Advancement-eligible players',
      detail: `${advancementEligibleCount} player${advancementEligibleCount !== 1 ? 's' : ''} ready to advance — director action needed`,
      urgency: advancementEligibleCount >= 3 ? 'high' : 'medium',
      actionHref: '/director/players',
    })
  }

  if (curriculumTemplateCoverageGapCount > 0) {
    academyRisks.push({
      signal: 'Curriculum-template coverage gap',
      detail: `${curriculumTemplateCoverageGapCount} curriculum level${curriculumTemplateCoverageGapCount !== 1 ? 's' : ''} have active players but no class template assigned`,
      urgency: curriculumTemplateCoverageGapCount >= 3 ? 'high' : 'medium',
      actionHref: '/director/templates',
    })
  }

  if (eligibleWithoutAssessmentEvidence > 0) {
    academyRisks.push({
      signal: 'Level movement without assessment evidence',
      detail: `${eligibleWithoutAssessmentEvidence} advancement-eligible player${eligibleWithoutAssessmentEvidence !== 1 ? 's' : ''} have no promotion-ready assessment on record`,
      urgency: 'high',
      actionHref: '/director/players',
    })
  }

  // Sprint 913.1: curriculum override drafts signal
  if (curriculumDraftCount > 0) {
    academyRisks.push({
      signal: 'Curriculum drafts waiting',
      detail: `${curriculumDraftCount} curriculum draft${curriculumDraftCount !== 1 ? 's' : ''} pending review in the Curriculum Builder`,
      urgency: 'low',
      actionHref: '/director/curriculum/builder',
    })
  }

  // Sprint 913.1: stale review queue signal
  if (oldestPendingReviewAgeDays !== null && oldestPendingReviewAgeDays >= 7) {
    academyRisks.push({
      signal: 'Stale review queue',
      detail: `Oldest pending review is ${oldestPendingReviewAgeDays} day${oldestPendingReviewAgeDays !== 1 ? 's' : ''} old — coaches may be waiting on decisions`,
      urgency: oldestPendingReviewAgeDays >= 14 ? 'high' : 'medium',
      actionHref: '/director/review',
    })
  }

  const URGENCY_ORDER = { high: 0, medium: 1, low: 2 }
  academyRisks.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency])

  // ── 9. Recommended actions ─────────────────────────────────────────────────

  const recommendedActions: DirectorRecommendedAction[] = []

  if (pendingReviews > 0) {
    recommendedActions.push({
      id: 'review_pending',
      label: `Review ${pendingReviews} pending item${pendingReviews !== 1 ? 's' : ''}`,
      reason: 'Coaches and players are waiting on director decisions',
      href: '/director/review',
      category: 'review',
    })
  }

  if (missingWrapUps > 0) {
    recommendedActions.push({
      id: 'chase_wrapups',
      label: `Follow up on ${missingWrapUps} missing wrap-up${missingWrapUps !== 1 ? 's' : ''}`,
      reason: 'Sessions without wrap-ups cannot feed player records',
      href: '/director/sessions',
      category: 'investigate',
    })
  }

  if (highRiskPlayers > 0) {
    recommendedActions.push({
      id: 'check_at_risk',
      label: `Check ${highRiskPlayers} at-risk player${highRiskPlayers !== 1 ? 's' : ''}`,
      reason: 'High-risk flags require director awareness',
      href: '/director/players',
      category: 'investigate',
    })
  }

  if (evidenceDrafts > 0) {
    recommendedActions.push({
      id: 'approve_evidence',
      label: `Review ${evidenceDrafts} evidence draft${evidenceDrafts !== 1 ? 's' : ''}`,
      reason: 'Curriculum evidence links need director approval',
      href: '/director/review',
      category: 'approve',
    })
  }

  // ── 10. Source labels ──────────────────────────────────────────────────────

  const statusLabel = (s: COOFieldStatus) =>
    s === 'live' ? 'Live' : s === 'partial' ? 'Partial' : s === 'blocked_by_schema' ? 'Schema gap' : 'No data'

  const sourceLabels: DirectorSourceLabel[] = [
    { field: 'Sessions today', status: fieldStatuses.sessions as COOFieldStatus, label: statusLabel(fieldStatuses.sessions as COOFieldStatus) },
    { field: 'Review queue', status: fieldStatuses.reviewQueue as COOFieldStatus, label: statusLabel(fieldStatuses.reviewQueue as COOFieldStatus) },
    { field: 'Wrap-up coverage', status: fieldStatuses.wrapUps as COOFieldStatus, label: statusLabel(fieldStatuses.wrapUps as COOFieldStatus) },
    { field: 'Attendance exceptions', status: fieldStatuses.attendance as COOFieldStatus, label: statusLabel(fieldStatuses.attendance as COOFieldStatus) },
    { field: 'Attention flags', status: fieldStatuses.attentionItems as COOFieldStatus, label: statusLabel(fieldStatuses.attentionItems as COOFieldStatus) },
    { field: 'Curriculum gaps', status: fieldStatuses.curriculum as COOFieldStatus, label: statusLabel(fieldStatuses.curriculum as COOFieldStatus) },
    // Extended context source labels (Sprint 742B)
    { field: 'Player curriculum states', status: fieldStatuses.playerCurriculumStates as COOFieldStatus, label: statusLabel(fieldStatuses.playerCurriculumStates as COOFieldStatus) },
    { field: 'Assessments', status: fieldStatuses.assessments as COOFieldStatus, label: statusLabel(fieldStatuses.assessments as COOFieldStatus) },
    { field: 'Groups', status: fieldStatuses.groups as COOFieldStatus, label: statusLabel(fieldStatuses.groups as COOFieldStatus) },
    { field: 'Templates', status: fieldStatuses.templates as COOFieldStatus, label: statusLabel(fieldStatuses.templates as COOFieldStatus) },
    // Sprint 742F
    { field: 'Recent decisions', status: fieldStatuses.recentDecisions as COOFieldStatus, label: statusLabel(fieldStatuses.recentDecisions as COOFieldStatus) },
    // Sprint 913.1
    { field: 'Curriculum drafts', status: (fieldStatuses.curriculumDrafts ?? 'insufficient_data') as COOFieldStatus, label: statusLabel((fieldStatuses.curriculumDrafts ?? 'insufficient_data') as COOFieldStatus) },
  ]

  // ── 11. Confidence and isLive ──────────────────────────────────────────────

  const allStatuses = Object.values(fieldStatuses) as COOFieldStatus[]
  const overallStatus = deriveOverallStatus(allStatuses)
  const confidence: DONNAConfidence =
    overallStatus === 'live' ? 'high' : overallStatus === 'partial' ? 'partial' : 'insufficient'

  const isLive =
    fieldStatuses.reviewQueue === 'live' || fieldStatuses.sessions === 'live'

  if (!isLive) return buildDemoContext()

  return {
    pendingReviews,
    missingWrapUps,
    templateDrafts,
    attendanceExceptions,
    evidenceDrafts,
    todaySessions,
    playerCount,
    coachCount,
    isFirstTimeSetup: playerCount === 0,
    attentionItems,
    curriculumGaps,
    academyRisks,
    recommendedActions,
    // Extended context (Sprint 742B)
    playerCurriculumStateCount,
    advancementEligibleCount,
    groupCount,
    templateCount,
    assessmentCount,
    recentAssessmentCount,
    playerProgressContextAvailable: pcsResult.fieldStatus === 'live',
    assessmentContextAvailable: assessmentResult.fieldStatus === 'live',
    groupContextAvailable: groupResult.fieldStatus === 'live',
    templateContextAvailable: templateResult.fieldStatus === 'live',
    playerCurriculumStateSummaries,
    groupSummaries,
    templateSummaries,
    assessmentSummaries,
    // Coverage gaps (Sprint 742C)
    curriculumTemplateCoverageGaps,
    curriculumTemplateCoverageGapCount,
    templateCoverageContextAvailable,
    // Assessment coverage (Sprint 742D)
    assessmentCoverageGaps,
    assessmentCoverageGapCount,
    eligibleWithoutAssessmentEvidence,
    // Recent decisions (Sprint 742F)
    recentDecisions,
    recentDecisionContextAvailable,
    // Player progress stalls (Sprint 742G)
    playerProgressStalls,
    playerProgressStallCount,
    playerProgressStallContextAvailable,
    // Curriculum bottleneck (Mega Sprint 1996–2005)
    mostBlockedLevelName,
    mostBlockedLevelKey,
    mostBlockedLevelStalledCount,
    mostBlockedLevelAvgCompletion,
    topTaggedConcern,
    topTaggedConcernCount,
    // Sprint 913.1 — Operating Intelligence Context Expansion
    curriculumDraftCount,
    oldestPendingReviewAgeDays,
    highRiskPlayerCount,
    mediumRiskPlayerCount,
    hasPlayers,
    hasCoaches,
    hasTemplates,
    hasCurriculumGaps,
    onboardingReadinessLevel,
    sourceLabels,
    confidence,
    isLive,
  }
}
