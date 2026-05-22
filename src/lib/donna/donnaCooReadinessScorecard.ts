// Sprint 620 — DONNA COO Readiness Scorecard V1
// Pure TypeScript. No DB calls. No AI calls. No mutations. No side effects. No UI imports.
// Derives audit scores from the director action registry and coverage registry.
// These scores reflect the verified architectural state as of Sprint 620.
// Update this file when scores change in a future sprint.

import { getDirectorDonnaActionCoverageScore } from './directorActionPolicy'
import { DIRECTOR_DONNA_COVERAGE_REGISTRY, getAverageScore } from './directorCoverageRegistry'

// ── Score scale ───────────────────────────────────────────────────────────────
//  0–3 = not ready
//  4–6 = partially ready
//  7–8 = pilot usable
//    9 = premium V1
//   10 = category-defining

export type DonnaCooScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type GapPriority = 'P0' | 'P1' | 'P2' | 'P3'

// ── Scorecard shape ───────────────────────────────────────────────────────────

export interface DonnaCooReadinessScorecard {
  sprint: number
  date: string
  // Overall COO readiness — weighted average across all dimensions
  overallCooReadiness: DonnaCooScore
  // Dimension scores
  routeConnectivity: DonnaCooScore
  kpiFluency: DonnaCooScore
  conversationalQuality: DonnaCooScore
  reviewApprovalSafety: DonnaCooScore
  parentPlayerSafety: DonnaCooScore
  voiceReadiness: DonnaCooScore
  mobileUsability: DonnaCooScore
  // Derived registry stats
  actionRegistryCoveragePct: number
  routeAverageScore: number
  routesFullyConnected: number   // score >= 8
  routesWellConnected: number    // score 6-7
  routesPartiallyConnected: number // score 3-5
  routesNotConnected: number     // score <= 2
  totalRoutes: number
  totalActions: number
  wiredActions: number
  implementedNotWiredActions: number
  registryOnlyActions: number
}

// ── Gap shape ─────────────────────────────────────────────────────────────────

export interface DonnaCooGap {
  id: string
  title: string
  priority: GapPriority
  dimension: string
  blocksWhat: string
  plannedSprint: string | null
}

// ── Sprint 620 scorecard computation ─────────────────────────────────────────

function computeRouteBreakdown() {
  const total = DIRECTOR_DONNA_COVERAGE_REGISTRY.length
  const fullyConnected = DIRECTOR_DONNA_COVERAGE_REGISTRY.filter(r => r.score >= 8).length
  const wellConnected = DIRECTOR_DONNA_COVERAGE_REGISTRY.filter(r => r.score >= 6 && r.score < 8).length
  const partiallyConnected = DIRECTOR_DONNA_COVERAGE_REGISTRY.filter(r => r.score >= 3 && r.score < 6).length
  const notConnected = DIRECTOR_DONNA_COVERAGE_REGISTRY.filter(r => r.score <= 2).length
  return { total, fullyConnected, wellConnected, partiallyConnected, notConnected }
}

export function computeDonnaCooReadinessScorecard(): DonnaCooReadinessScorecard {
  const actionCoverage = getDirectorDonnaActionCoverageScore()
  const routeAvg = getAverageScore()
  const routeBreakdown = computeRouteBreakdown()

  const implementedNotWiredActions = DIRECTOR_DONNA_COVERAGE_REGISTRY.length // proxy via action registry below
  const registryOnlyActions = actionCoverage.missing

  return {
    sprint: 630,
    date: '2026-05-22',

    // ── Dimension scoring rationale (Sprint 630 re-audit) ─────────────────────
    //
    // overallCooReadiness: 5 (up from 4)
    //   KPI explainer wired (Sprints 621-622), dashboard priority answered (623),
    //   roster intelligence answered with named players (624), cross-page session
    //   context (625), intent classifier upgraded 9→13 families (626), clarification
    //   layer (627), action preview (628), 2 new route contexts (629).
    //   DONNA is pilot-approaching but NOT voice-ready or mobile-ready.
    //
    // routeConnectivity: 4 (unchanged)
    //   Route average score ~4.3/10 (26 routes). Chat improvements are scoped to
    //   /director/donna — floating button always existed everywhere. 2 new route
    //   context entries (placement, curriculum/builder) help orientation but do not
    //   raise functional DONNA capability on those routes. 4/26 routes score ≥8.
    //
    // kpiFluency: 4 (up from 2)
    //   kpiExplainer.ts now wired into DONNA chat (Sprints 621-622). Director can
    //   ask: "Explain attendance rate", "Which KPI is most urgent?", "Why is recap
    //   completion low?". Gaps: KPI page has no per-metric chip; trend attribution
    //   not wired ("why did attendance drop?" gets honest limitation response).
    //
    // conversationalQuality: 5 (up from 3)
    //   DONNA now handles: KPI explanation, dashboard priority, roster attention,
    //   one clarifying question, action preview with willHappen/willNotHappen,
    //   cross-page memory. Cannot handle: strategic questions, curriculum health,
    //   multi-step conversations, entity resolution across sessions.
    //
    // reviewApprovalSafety: 7 (unchanged)
    //   proposed_actions pipeline is the architectural foundation. approve/reject wired.
    //   Action preview (Sprint 628) adds clarity before any draft. Remaining gaps:
    //   DonnaLevelMovementApplyControls not wired, fitness template bypasses pipeline,
    //   4 action types lack apply paths. Target: Sprint 631-640 block.
    //
    // parentPlayerSafety: 8 (unchanged)
    //   parentSafeResponseRules.ts, observationVisibilityGuardrails.ts,
    //   donnaTrustBoundaryValidator.ts, donnaBoundaryResponses.ts all exist.
    //   Sprint 627 blocking fires for raw notes to parents in chat.
    //   Gap: no formal end-to-end test suite.
    //
    // voiceReadiness: 3 (unchanged)
    //   Browser SpeechRecognition (Chrome/Edge only). continuous=false — ends on
    //   silence. No auto-restart. No transcript editing. No name disambiguation.
    //   Target: Sprint 641-650 voice reliability block.
    //
    // mobileUsability: 3 (unchanged)
    //   Director portal uses fixed sidebar (w-60) — not mobile-optimized.
    //   DONNA shell on /director/donna is 560px fixed height.
    //   Target: Sprint 661-664 mobile polish block.

    overallCooReadiness: 5,
    routeConnectivity: 4,
    kpiFluency: 4,
    conversationalQuality: 5,
    reviewApprovalSafety: 7,
    parentPlayerSafety: 8,
    voiceReadiness: 3,
    mobileUsability: 3,

    actionRegistryCoveragePct: actionCoverage.coveragePct,
    routeAverageScore: routeAvg,
    routesFullyConnected: routeBreakdown.fullyConnected,
    routesWellConnected: routeBreakdown.wellConnected,
    routesPartiallyConnected: routeBreakdown.partiallyConnected,
    routesNotConnected: routeBreakdown.notConnected,
    totalRoutes: routeBreakdown.total,
    totalActions: actionCoverage.total,
    wiredActions: actionCoverage.wired,
    implementedNotWiredActions: actionCoverage.implemented - actionCoverage.wired,
    registryOnlyActions,
  }
}

// ── Gap registry ──────────────────────────────────────────────────────────────

export const DONNA_COO_GAPS: DonnaCooGap[] = [

  // ── P0 — Must fix before any director pilot ───────────────────────────────

  {
    id: 'kpi_page_no_donna',
    title: '/director/kpi has zero DONNA presence — kpiExplainer.ts not wired to any page',
    priority: 'P0',
    dimension: 'KPI Fluency',
    blocksWhat: 'Director cannot ask DONNA "why is attendance low?" or "what does this KPI mean?" from any screen',
    plannedSprint: '621',
  },
  {
    id: 'players_directory_no_donna',
    title: '/director/players has no DONNA — cannot surface at-risk players or answer "who needs attention today?"',
    priority: 'P0',
    dimension: 'Route Connectivity',
    blocksWhat: 'Director cannot get roster intelligence from the most-visited player-facing page',
    plannedSprint: '621',
  },
  {
    id: 'main_dashboard_no_donna',
    title: '/director main dashboard scores 4 — no DONNA explain or recommend capability on the home page',
    priority: 'P0',
    dimension: 'Route Connectivity',
    blocksWhat: '"What should I do first?" from the main dashboard gets no DONNA response',
    plannedSprint: '621',
  },
  {
    id: 'intent_classifier_keyword_only',
    title: 'Intent classifier is keyword-only (9 categories, ~40 signals) — no NLU, no natural language understanding',
    priority: 'P0',
    dimension: 'Conversational Quality',
    blocksWhat: 'Director cannot ask any question that does not match a keyword signal — "which curriculum areas are weak?" returns unknown',
    plannedSprint: '624',
  },
  {
    id: 'no_cross_page_context',
    title: 'DONNA has no cross-page session memory — context resets on every page navigation',
    priority: 'P0',
    dimension: 'Conversational Quality',
    blocksWhat: 'Multi-step director workflows are broken — DONNA loses player/session context on navigation',
    plannedSprint: '625',
  },

  // ── P1 — Must fix before premium V1 ──────────────────────────────────────

  {
    id: 'kpi_explain_not_wired',
    title: 'explain_kpi and summarize_kpi actions exist in registry (implemented_not_wired) — no chip on /director/kpi',
    priority: 'P1',
    dimension: 'KPI Fluency',
    blocksWhat: 'kpiExplainer.ts has been ready since Sprint 466 — director cannot access it without a UI entry point',
    plannedSprint: '621',
  },
  {
    id: 'signals_page_no_donna',
    title: '/director/signals has no DONNA — development signals appear without any DONNA explanation or next-action recommendation',
    priority: 'P1',
    dimension: 'Route Connectivity',
    blocksWhat: 'Director sees signal numbers but DONNA cannot narrate what they mean or what to do next',
    plannedSprint: '622',
  },
  {
    id: 'player_profile_no_chat_shell',
    title: '/director/players/[playerId] has draft buttons but no inline DONNA Q&A — director cannot ask "what should I do for this player?"',
    priority: 'P1',
    dimension: 'Route Connectivity',
    blocksWhat: 'The most data-rich page in the director portal has no conversational DONNA access',
    plannedSprint: '622',
  },
  {
    id: 'level_up_apply_gap',
    title: 'DonnaLevelMovementApplyControls not wired to DonnaDraftCard in /director/review — level movement draft cannot be applied from review queue',
    priority: 'P1',
    dimension: 'Review/Approval Safety',
    blocksWhat: 'Director must manually navigate away from review queue to apply approved level movement',
    plannedSprint: '622',
  },
  {
    id: 'fitness_template_bypasses_review',
    title: 'Fitness template session generation bypasses proposed_actions pipeline — creates session directly without director review',
    priority: 'P1',
    dimension: 'Review/Approval Safety',
    blocksWhat: 'Architecture safety invariant violated — all AI-generated outputs must pass through proposed_actions before effect',
    plannedSprint: '622',
  },
  {
    id: 'execute_approved_gaps',
    title: 'execute_approved_action() covers 11/15 action types — 4 types have no apply path after director approval',
    priority: 'P1',
    dimension: 'Review/Approval Safety',
    blocksWhat: 'Director approvals for uncovered types are stuck — approved but never applied',
    plannedSprint: '622',
  },
  {
    id: 'coach_profile_donna_missing',
    title: 'donnaCoachIntelligenceAction.ts exists but /director/coaches/[coachId] has no DONNA entry point',
    priority: 'P1',
    dimension: 'Route Connectivity',
    blocksWhat: 'Director cannot ask DONNA "how is this coach doing?" or "summarize their session history" from the coach profile',
    plannedSprint: '623',
  },
  {
    id: 'voice_no_persist',
    title: 'Voice session ends on silence (continuous=false, no auto-restart) — DONNA voice does not stay active until explicitly stopped',
    priority: 'P1',
    dimension: 'Voice Readiness',
    blocksWhat: 'Voice-first director workflows break on natural pauses — must re-tap mic for every phrase',
    plannedSprint: '626',
  },
  {
    id: 'voice_no_transcript_edit',
    title: 'No transcript editing UI — name misrecognitions (player names, coach names) silently corrupt commands',
    priority: 'P1',
    dimension: 'Voice Readiness',
    blocksWhat: 'Voice commands with player names are unreliable — "Marcus" becomes "Markus" with no correction path',
    plannedSprint: '626',
  },
  {
    id: 'curriculum_builder_zero_donna',
    title: '/director/curriculum/builder scores 1 — DONNA has zero visibility into the builder flow',
    priority: 'P1',
    dimension: 'Route Connectivity',
    blocksWhat: 'Director setting up curriculum for the first time gets no DONNA guidance on any step',
    plannedSprint: '624',
  },
  {
    id: 'no_kpi_why_changed',
    title: 'DONNA cannot answer "why did this KPI change?" for any metric — no trend attribution logic exists',
    priority: 'P1',
    dimension: 'KPI Fluency',
    blocksWhat: 'Director sees a drop in attendance rate but DONNA cannot identify which groups, coaches, or dates drove it',
    plannedSprint: '621',
  },
  {
    id: 'placement_engine_no_donna',
    title: '/director/placement scores 2 — placementDraftAction.ts exists but DONNA cannot suggest a placement level from assessment answers',
    priority: 'P1',
    dimension: 'Route Connectivity',
    blocksWhat: 'New player intake requires director to make placement judgment without DONNA input',
    plannedSprint: '623',
  },

  // ── P2 — After pilot launch ───────────────────────────────────────────────

  {
    id: 'sessions_list_no_donna',
    title: '/director/sessions scores 1 — DONNA cannot surface sessions with missing wrap-ups or flag completion issues',
    priority: 'P2',
    dimension: 'Route Connectivity',
    blocksWhat: 'Director must manually scan the sessions list for compliance gaps — DONNA cannot surface them',
    plannedSprint: '627',
  },
  {
    id: 'donna_inline_qa_review',
    title: '/director/review/[actionId] has no inline DONNA Q&A — director cannot ask "why did DONNA draft this?" from the review item',
    priority: 'P2',
    dimension: 'Review/Approval Safety',
    blocksWhat: 'Director must remember or navigate to context to understand why a draft was created',
    plannedSprint: '627',
  },
  {
    id: 'curriculum_level_context',
    title: 'Curriculum explorer missing level context pass-through — DONNA does not know which level the director is viewing',
    priority: 'P2',
    dimension: 'Route Connectivity',
    blocksWhat: '"What is weak in Orange 2?" requires DONNA to know the selected level — currently blind',
    plannedSprint: '628',
  },
  {
    id: 'no_strategic_questions',
    title: 'DONNA cannot answer strategic questions: bottlenecks, curriculum health, misplaced players, weekly report',
    priority: 'P2',
    dimension: 'Conversational Quality',
    blocksWhat: 'Director cannot use DONNA for strategic planning — only operational triage is possible today',
    plannedSprint: '629',
  },
  {
    id: 'no_coo_weekly_report',
    title: 'DONNA cannot draft a weekly COO-style report covering all academy signals, risks, and priorities',
    priority: 'P2',
    dimension: 'Conversational Quality',
    blocksWhat: 'Director must manually compile the weekly academy report — a high-value DONNA draft action that does not exist',
    plannedSprint: '629',
  },
  {
    id: 'mobile_director_portal',
    title: 'Director portal not mobile-optimized — fixed sidebar layout and 560px DONNA shell unusable on phone',
    priority: 'P2',
    dimension: 'Mobile Usability',
    blocksWhat: 'A director on their phone cannot effectively use DONNA — entire value prop breaks on mobile',
    plannedSprint: '630',
  },

  // ── P3 — Future expansion ─────────────────────────────────────────────────

  {
    id: 'badge_award_missing_backend',
    title: 'propose_badge_award has no backend — badge_award proposed_action type not defined',
    priority: 'P3',
    dimension: 'Action Coverage',
    blocksWhat: 'Director cannot ask DONNA to propose a badge award for a player achievement',
    plannedSprint: null,
  },
  {
    id: 'mission_draft_missing_backend',
    title: 'draft_curriculum_mission has no backend server action',
    priority: 'P3',
    dimension: 'Action Coverage',
    blocksWhat: 'DONNA cannot draft player missions from the curriculum page',
    plannedSprint: null,
  },
  {
    id: 'drill_draft_missing_backend',
    title: 'draft_drill has no backend server action — registry only',
    priority: 'P3',
    dimension: 'Action Coverage',
    blocksWhat: 'DONNA cannot draft training drills despite being the most requested curriculum action',
    plannedSprint: null,
  },
  {
    id: 'video_visibility_missing_backend',
    title: 'propose_video_visibility_change has no backend action or media model',
    priority: 'P3',
    dimension: 'Action Coverage',
    blocksWhat: 'Director cannot use DONNA to propose changing who can see a curriculum video',
    plannedSprint: null,
  },
  {
    id: 'licensing_health_missing',
    title: 'Licensing health backend model does not exist — explain_licensing_health is registry_only',
    priority: 'P3',
    dimension: 'KPI Fluency',
    blocksWhat: 'DONNA cannot answer any licensing health question — no data source exists',
    plannedSprint: null,
  },
  {
    id: 'group_adjustment_missing',
    title: 'recommend_group_adjustment has no backend — move_player_group proposed_action type not defined',
    priority: 'P3',
    dimension: 'Action Coverage',
    blocksWhat: 'DONNA cannot recommend roster adjustments or propose group moves',
    plannedSprint: null,
  },
]

export function getGapsByPriority(priority: GapPriority): DonnaCooGap[] {
  return DONNA_COO_GAPS.filter(g => g.priority === priority)
}

export function getGapsByDimension(dimension: string): DonnaCooGap[] {
  return DONNA_COO_GAPS.filter(g => g.dimension === dimension)
}
