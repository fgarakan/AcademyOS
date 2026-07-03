// Mega Sprint 3031–3060 — DONNA Page-Aware Operating Layer V1
// Part 1 — Page Context Resolver
//
// Converts route → PageIntelligence.
// Single source of truth for what DONNA knows about any page.
//
// Architecture:
//   - Primary source: existing DonnaContextPack registry (8 routes)
//   - Extended with completion intelligence for all 8 existing routes
//   - Full definitions for 6 new priority routes (curriculum, player profile,
//     placement, level-up, groups, onboarding)
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Returns null for unknown routes — caller falls through gracefully.
//   - completionGoals and recommendedNextAction are static per route.
//   - Live counts (player numbers, queue depths) are never fabricated here.
//   - formatPageIntelligenceForTeacher() caps at 300 chars for AI teacher safety.

import { getDonnaContextPackForRoute } from '@/lib/donna/donnaContextPackRegistry'
import type { LivePageState } from './livePageState'

// ── Output type ───────────────────────────────────────────────────────────────

export interface PageIntelligence {
  /** Canonical route this intelligence covers */
  route: string
  /** Human-readable page name */
  pageName: string
  /** One-sentence purpose of this page */
  pagePurpose: string
  /** Data actually visible on this page */
  visibleData: string[]
  /** Key metrics on this page */
  keyMetrics: Array<{ id: string; label: string; description: string }>
  /** Safe actions DONNA can assist with */
  availableActions: string[]
  /** Actions that require explicit director approval */
  approvalActions: string[]
  /** What DONNA says when page data is not yet loaded */
  missingData: string
  /** Active warnings for this page type */
  warnings: string[]
  /** What completion looks like for this page */
  completionGoals: string[]
  /** Single highest-priority next action */
  recommendedNextAction: string
}

// ── Completion intelligence registry ─────────────────────────────────────────
// Augments existing context packs with completion intelligence.
// Also provides full definitions for new routes without context pack entries.

interface CompletionIntelligence {
  completionGoals: string[]
  recommendedNextAction: string
  warnings: string[]
}

const COMPLETION_INTELLIGENCE: Record<string, CompletionIntelligence> = {
  // ── Existing context pack routes (augmented) ──────────────────────────────
  '/director': {
    completionGoals: [
      'Review queue cleared or triaged',
      'Attention signals reviewed and actioned',
      'Daily brief acknowledged',
    ],
    recommendedNextAction: 'Open your review queue — pending items affect players and coaches once approved.',
    warnings: [],
  },

  '/director/review': {
    completionGoals: [
      'All pending items reviewed',
      'No items older than 7 days remaining',
      'Parent-visible items approved or deferred',
    ],
    recommendedNextAction: 'Start with parent-visible items — they affect what families see once approved.',
    warnings: [],
  },

  '/director/kpi': {
    completionGoals: [
      'All attention-signal players have a follow-up plan',
      'Advancement-ready players sent to Level Up queue',
    ],
    recommendedNextAction: 'Act on attention signals — open each flagged player profile to decide next step.',
    warnings: [],
  },

  '/director/players': {
    completionGoals: [
      'No players with missing curriculum levels',
      'No players with unresolved attention flags',
      'Placement queue empty',
    ],
    recommendedNextAction: 'Filter by attention flags first — those players need a follow-up action today.',
    warnings: [],
  },

  '/director/sessions': {
    completionGoals: [
      'All completed sessions have coach wrap-ups submitted',
      'No sessions missing template alignment',
    ],
    recommendedNextAction: 'Chase completed sessions without submitted wrap-ups — coaches need a follow-up.',
    warnings: [],
  },

  '/director/sessions/new': {
    completionGoals: [
      'Template selected',
      'Coach assigned',
      'Group confirmed',
      'Session scheduled and published',
    ],
    recommendedNextAction: 'Pick the published template you are delivering next, then assign the coach and group before scheduling.',
    warnings: [
      'A session needs a published template for its level before it can be created',
    ],
  },

  '/director/parents': {
    completionGoals: [
      'No players with overdue parent updates',
      'All approved drafts dispatched',
    ],
    recommendedNextAction: 'Review pending parent update drafts and approve or edit before dispatching.',
    warnings: [],
  },

  '/director/fitness/templates/[templateId]': {
    completionGoals: [
      'All blocks have exercises assigned',
      'No load flags remaining',
      'Template published and available for sessions',
    ],
    recommendedNextAction: 'Check for load flags — orange or red flags need resolution before publishing.',
    warnings: [],
  },

  '/director/class-templates/[templateId]': {
    completionGoals: [
      'All blocks have activities and coaching cues',
      'Curriculum level assigned to template',
      'Template published and available for sessions',
    ],
    recommendedNextAction: 'Complete the session flow check — empty blocks or missing cues block publishing.',
    warnings: [],
  },

  // ── New priority routes (full definitions) ─────────────────────────────────

  '/director/curriculum': {
    completionGoals: [
      'Curriculum spine active — all levels defined',
      'All active players assigned a curriculum level',
      'Assessment criteria defined per level',
      'Coach-curriculum alignment reviewed',
    ],
    recommendedNextAction: 'Activate the curriculum spine — define your levels and assign all active players to enable progression tracking.',
    warnings: [
      'Players without curriculum levels cannot have progression tracked',
      'Curriculum spine must be active before assessment evidence becomes meaningful',
    ],
  },

  '/director/level-up': {
    completionGoals: [
      'All advancement-eligible players reviewed',
      'Level movement decisions recorded',
      'No candidates waiting longer than 14 days',
    ],
    recommendedNextAction: 'Review the first advancement candidate — check the evidence, then approve or defer the level movement.',
    warnings: [],
  },

  '/director/placement': {
    completionGoals: [
      'All intake players placed in a curriculum level',
      'Level and group assigned for each intake player',
      'finalize_player_placement() called to activate each player',
      'No players in intake longer than 7 days',
    ],
    recommendedNextAction: 'Complete placement for each intake player — assign level and group, then finalize to activate.',
    warnings: [
      'Players in intake cannot be tracked for curriculum progress or attendance until placed',
    ],
  },

  '/director/onboarding': {
    completionGoals: [
      'All 7 onboarding steps completed',
      'Academy DNA model selected',
      'First curriculum level defined',
      'First group created',
      'First player enrolled',
    ],
    recommendedNextAction: 'Complete onboarding steps in order — Academy DNA must be set before curriculum and groups can be configured.',
    warnings: [
      'DONNA cannot give academy-specific guidance until the DNA model is selected',
      'Groups and curriculum depend on onboarding completion',
    ],
  },

  // ── Templates workspace, Today, Settings (Mega Sprint 3961–3990) ────────────

  '/director/templates': {
    completionGoals: [
      'Each curriculum level has at least one class template',
      'Templates have activities and coaching cues in every block',
      'Templates published and available for sessions',
    ],
    recommendedNextAction: 'Open or create the template for the level you are delivering next — fill every block with an activity and a coaching cue before publishing.',
    warnings: [
      'Sessions cannot align to a level without a published template for that level',
    ],
  },

  '/director/today': {
    completionGoals: [
      'Review queue cleared or triaged',
      'Attention signals reviewed and actioned',
      'Daily brief acknowledged',
    ],
    recommendedNextAction: 'Start with what needs your decision today — open the review queue, then act on flagged players.',
    warnings: [],
  },

  '/director/settings': {
    completionGoals: [
      'Academy identity and branding confirmed',
      'Academy DNA model selected',
      'Operating preferences reviewed',
    ],
    recommendedNextAction: 'Confirm your Academy DNA model and identity — these drive how DONNA reasons about your academy everywhere else.',
    warnings: [],
  },

  // ── Coaches management page (Mega Sprint 3181–3210) ─────────────────────────

  '/director/coaches': {
    completionGoals: [
      'All active coaches have an assigned group or session',
      'No coaches without a role assignment',
      'Coach profile information complete',
    ],
    recommendedNextAction: 'Review active coaches and verify each has at least one assigned group or session.',
    warnings: [],
  },

  // ── Coach routes (Mega Sprint 3121–3150) ──────────────────────────────────────

  '/coach/': {
    completionGoals: [
      'All sessions have submitted wrap-ups',
      'Observations recorded for active players',
      'No attention flags unaddressed',
    ],
    recommendedNextAction: 'Check pending wrap-ups — each unsubmitted wrap-up leaves a session without a development record.',
    warnings: [],
  },

  '/coach/sessions/[sessionId]/wrap-up': {
    completionGoals: [
      'Attendance marked for all players',
      'At least one observation submitted per player',
      'Wrap-up submitted to director review queue',
    ],
    recommendedNextAction: 'Complete attendance marking, then add observations, then submit the wrap-up.',
    warnings: [
      'Wrap-up cannot be submitted until attendance is marked for all players',
    ],
  },
}

// ── Dynamic route completion intelligence ─────────────────────────────────────
// Matches routes by prefix for dynamic segments ([playerId], [id], etc.)

interface DynamicCompletionEntry {
  prefix: string
  pageName: string
  pagePurpose: string
  visibleData: string[]
  keyMetrics: Array<{ id: string; label: string; description: string }>
  availableActions: string[]
  approvalActions: string[]
  missingData: string
  completionGoals: string[]
  recommendedNextAction: string
  warnings: string[]
}

const DYNAMIC_PAGE_REGISTRY: DynamicCompletionEntry[] = [
  {
    prefix: '/director/players/',
    pageName: 'Player Profile',
    pagePurpose: 'Individual player development record. Shows skill path, competition history, fitness, notes, and assessment evidence. The primary record for all director decisions about this player.',
    visibleData: [
      'Current curriculum level',
      'Skill path progress and milestones',
      'Assessment evidence by domain',
      'Competition record',
      'Attendance history',
      'Coach observations',
      'Parent update status',
    ],
    keyMetrics: [
      { id: 'time_in_level', label: 'Time in Level', description: 'Days at current curriculum level. 180+ days triggers an advancement flag.' },
      { id: 'last_assessment', label: 'Last Assessment', description: 'Days since last formal assessment. 90+ days suggests a reassessment is due.' },
      { id: 'attendance_rate', label: 'Attendance Rate', description: 'Session attendance in last 30 days. Below 70% is an attention signal.' },
    ],
    availableActions: [
      'Review skill path and assessment evidence',
      'Draft a coach observation note',
      'Propose a parent-safe update',
      'Identify advancement readiness',
      'Check attendance and flag patterns',
    ],
    approvalActions: [
      'Level movement (goes through proposed_actions pipeline)',
      'Parent update (requires director approval before dispatch)',
      'Assessment record update (requires coach evidence)',
    ],
    missingData: 'Player profile data may still be loading. I can explain what each section means while it loads.',
    completionGoals: [
      'Curriculum level current and accurate',
      'Assessment evidence on file (within 90 days)',
      'Coach assigned',
      'No overdue flags without a response plan',
    ],
    recommendedNextAction: "Review the player's current level and last assessment date — flag if over 90 days since last assessment.",
    warnings: [],
  },
  {
    prefix: '/director/groups/',
    pageName: 'Group',
    pagePurpose: 'Group detail view. Shows group membership, coach assignment, curriculum level, sessions, and performance signals. The primary unit of session delivery and curriculum tracking.',
    visibleData: [
      'Group members and their levels',
      'Coach assignment',
      'Curriculum level target',
      'Recent session history',
      'Attendance signals',
      'Progression signals',
    ],
    keyMetrics: [
      { id: 'enrollment', label: 'Enrollment', description: 'Number of active players in this group.' },
      { id: 'wrap_up_coverage', label: 'Wrap-Up Coverage', description: 'Recent sessions with submitted coach wrap-ups.' },
      { id: 'advancement_flags', label: 'Advancement Flags', description: 'Players in this group with advancement eligibility set.' },
    ],
    availableActions: [
      'Review group membership and level alignment',
      'Check coach assignment',
      'Verify curriculum level connection',
      'Review recent session wrap-ups',
    ],
    approvalActions: [
      'Coach reassignment',
      'Curriculum level change for group',
      'Player group move',
    ],
    missingData: 'Group data may still be loading. I can explain what each section means while it loads.',
    completionGoals: [
      'Coach assigned to group',
      'Curriculum level defined for group',
      'All players in group have assigned levels',
      'No scheduling gaps in recent sessions',
    ],
    recommendedNextAction: 'Verify the coach assignment and curriculum alignment before scheduling sessions for this group.',
    warnings: [],
  },

  // ── Coach routes (Mega Sprint 3121–3150) ─────────────────────────────────────
  // IMPORTANT: '/coach/sessions/' must appear BEFORE '/coach/' so the more specific
  // prefix matches first (array iteration is first-match).
  {
    prefix: '/coach/sessions/',
    pageName: 'Coach Session',
    pagePurpose: "Session execution and wrap-up. Coach manages attendance, records observations, and submits the wrap-up to close the session loop.",
    visibleData: [
      'Assigned players',
      'Session plan and template blocks',
      'Attendance status',
      'Observation drafts',
      'Wrap-up status',
    ],
    keyMetrics: [
      { id: 'attendance_marked', label: 'Attendance Marked', description: 'Whether attendance has been recorded for this session.' },
      { id: 'observations_added', label: 'Observations Added', description: 'Number of player observations recorded in this session.' },
      { id: 'wrap_up_submitted', label: 'Wrap-Up Submitted', description: 'Whether the session wrap-up has been submitted for director review.' },
    ],
    availableActions: [
      'Mark attendance for each player',
      'Add player observations',
      'Review session plan',
      'Submit wrap-up',
    ],
    approvalActions: [
      'Wrap-up submission goes to director review queue',
      'Level-up observations require director approval',
    ],
    missingData: 'Session data may still be loading. I can explain each section while it loads.',
    completionGoals: [
      'Attendance marked for all players',
      'At least one observation per player',
      'Wrap-up submitted',
    ],
    recommendedNextAction: 'Mark attendance first, then add observations for each player, then submit the wrap-up.',
    warnings: [],
  },
  {
    prefix: '/coach/',
    pageName: 'Coach Home',
    pagePurpose: "Coach operating home. Shows today's sessions, player attention signals, wrap-ups pending, and DONNA-assisted session preparation.",
    visibleData: [
      "Today's sessions",
      'Players needing attention',
      'Pending wrap-ups',
      'Recent observations',
    ],
    keyMetrics: [
      { id: 'sessions_today', label: 'Sessions Today', description: 'Number of sessions scheduled for today.' },
      { id: 'wrap_ups_pending', label: 'Wrap-Ups Pending', description: 'Sessions completed but not yet wrapped up.' },
      { id: 'players_flagged', label: 'Players Flagged', description: 'Players with attention signals this week.' },
    ],
    availableActions: [
      "Review today's sessions",
      'Check players needing attention',
      'Submit pending wrap-ups',
      'Prepare for next session',
    ],
    approvalActions: [
      'Wrap-up submissions require director review',
      'Level recommendations require director approval',
    ],
    missingData: 'Session and player data may still be loading.',
    completionGoals: [
      'All sessions have submitted wrap-ups',
      'No players with unaddressed attention flags',
      'Observations recorded for active players',
    ],
    recommendedNextAction: 'Check your pending wrap-ups — each unsubmitted wrap-up leaves a session without a development record.',
    warnings: [],
  },
]

// ── Lookup helpers ────────────────────────────────────────────────────────────

function getCompletionIntelligence(pathname: string): CompletionIntelligence | null {
  if (COMPLETION_INTELLIGENCE[pathname]) return COMPLETION_INTELLIGENCE[pathname]
  // Try dynamic segment normalization (e.g. /director/fitness/templates/<uuid>)
  // Strip trailing UUID-like segments and check
  const stripped = pathname.replace(/\/[a-f0-9-]{32,}$/i, '/[templateId]')
    .replace(/\/[a-f0-9-]{32,}$/i, '/[id]')
  if (COMPLETION_INTELLIGENCE[stripped]) return COMPLETION_INTELLIGENCE[stripped]
  // Coach session wrap-up normalization: /coach/sessions/<id>/wrap-up → canonical key
  if (pathname.startsWith('/coach/sessions/') && pathname.endsWith('/wrap-up')) {
    const canonical = COMPLETION_INTELLIGENCE['/coach/sessions/[sessionId]/wrap-up']
    if (canonical) return canonical
  }
  // Coach home prefix: /coach/* (non-session) → /coach/
  if (pathname.startsWith('/coach/') && !pathname.startsWith('/coach/sessions/')) {
    const coachBase = COMPLETION_INTELLIGENCE['/coach/']
    if (coachBase) return coachBase
  }
  // Exact coach home
  if (pathname === '/coach') {
    const coachBase = COMPLETION_INTELLIGENCE['/coach/']
    if (coachBase) return coachBase
  }
  return null
}

function getDynamicEntry(pathname: string): DynamicCompletionEntry | null {
  return DYNAMIC_PAGE_REGISTRY.find(e => pathname.startsWith(e.prefix)) ?? null
}

// ── Main export ───────────────────────────────────────────────────────────────

// ── Live state overrides ──────────────────────────────────────────────────────
// When LivePageState is available, overlay state-aware values onto the static
// completion intelligence for key pages. Falls back gracefully to static when null.

function applyLiveStateOverrides(
  intel: PageIntelligence,
  liveState: LivePageState,
): PageIntelligence {
  const route = intel.route

  // Curriculum page — most state-sensitive
  if (route === '/director/curriculum') {
    const spineActive  = liveState.curriculumSpineActive
    const missing      = liveState.playersMissingCurriculumLevel

    if (spineActive === false) {
      return {
        ...intel,
        recommendedNextAction: 'The curriculum spine is not active. Define and activate your curriculum levels first.',
        warnings: [
          'Curriculum spine is not active — player progression cannot be tracked until levels are defined.',
          ...intel.warnings,
        ].slice(0, 3),
      }
    }

    if (spineActive === true && missing !== null && missing > 0) {
      return {
        ...intel,
        recommendedNextAction: `The curriculum spine is active. The next incomplete task is assigning ${missing} player${missing > 1 ? 's' : ''} to curriculum levels.`,
        warnings: [
          `${missing} active player${missing > 1 ? 's' : ''} have no curriculum level assigned.`,
          ...intel.warnings,
        ].slice(0, 3),
      }
    }

    if (spineActive === true && (missing === 0 || missing === null)) {
      return {
        ...intel,
        recommendedNextAction: 'The curriculum spine is active and all players are assigned. Review assessment criteria and coach-curriculum alignment.',
        warnings: [],
      }
    }
  }

  // Level-up page
  if (route === '/director/level-up') {
    const count = liveState.levelUpQueueCount
    if (count !== null && count === 0) {
      return {
        ...intel,
        recommendedNextAction: 'No advancement candidates at this time. Check back after the next assessment cycle.',
        warnings: [],
      }
    }
    if (count !== null && count > 0) {
      return {
        ...intel,
        recommendedNextAction: `Review ${count} advancement candidate${count > 1 ? 's' : ''} — check evidence, then approve or defer.`,
      }
    }
  }

  // Onboarding page
  if (route === '/director/onboarding') {
    const complete  = liveState.onboardingComplete
    const progress  = liveState.onboardingProgress

    if (complete === true) {
      return {
        ...intel,
        recommendedNextAction: 'Academy setup is complete. Visit Academy Settings to adjust configuration or branding.',
        warnings: [],
      }
    }

    if (progress !== null && progress > 0) {
      const remaining = 7 - progress
      return {
        ...intel,
        recommendedNextAction: `${progress} of 7 setup steps complete. ${remaining} remaining — continue from where you left off.`,
      }
    }
  }

  // Placement page
  if (route === '/director/placement') {
    const count = liveState.placementQueueCount
    if (count !== null && count === 0) {
      return {
        ...intel,
        recommendedNextAction: 'No players currently in intake. Placement queue is clear.',
        warnings: [],
      }
    }
    if (count !== null && count > 0) {
      return {
        ...intel,
        recommendedNextAction: `Complete placement for ${count} intake player${count > 1 ? 's' : ''} — assign level and group, then finalize to activate.`,
        warnings: [
          `${count} player${count > 1 ? 's' : ''} in intake cannot track progression until placed.`,
          ...intel.warnings,
        ].slice(0, 3),
      }
    }
  }

  // Players list page — live attention and assessment signals
  if (route === '/director/players') {
    const attention = liveState.playersNeedingAttention ?? null
    const noAssessment = liveState.playersWithoutAssessment ?? null
    let updatedAction = intel.recommendedNextAction
    const updatedWarnings = [...intel.warnings]

    if (attention !== null && attention > 0) {
      updatedAction = `Review ${attention} player${attention > 1 ? 's' : ''} with attention flags — each has a specific signal that needs a follow-up action.`
      updatedWarnings.unshift(`${attention} player${attention > 1 ? 's' : ''} have active attention flags.`)
    }
    if (noAssessment !== null && noAssessment > 0) {
      updatedWarnings.push(`${noAssessment} player${noAssessment > 1 ? 's' : ''} have not been assessed in the last 90 days.`)
    }

    if (attention !== null || noAssessment !== null) {
      return {
        ...intel,
        recommendedNextAction: updatedAction,
        warnings: updatedWarnings.slice(0, 3),
      }
    }
  }

  // Director home — surface player attention signals in warnings
  if (route === '/director') {
    const attention = liveState.playersNeedingAttention ?? null
    if (attention !== null && attention > 0) {
      return {
        ...intel,
        warnings: [
          `${attention} player${attention > 1 ? 's' : ''} have active attention flags requiring follow-up.`,
          ...intel.warnings,
        ].slice(0, 3),
      }
    }
  }

  // Director review page — surface parent/coach approval breakdown
  if (route === '/director/review') {
    const parentApprovals = liveState.pendingParentApprovals ?? null
    const coachApprovals = liveState.pendingCoachApprovals ?? null
    const updatedWarnings = [...intel.warnings]

    if (parentApprovals !== null && parentApprovals > 0) {
      updatedWarnings.unshift(`${parentApprovals} parent-visible item${parentApprovals > 1 ? 's' : ''} need review first — these affect what families see.`)
    }

    let updatedAction = intel.recommendedNextAction
    if (parentApprovals !== null && parentApprovals > 0 && coachApprovals !== null && coachApprovals > 0) {
      updatedAction = `Review ${parentApprovals} parent-visible item${parentApprovals > 1 ? 's' : ''} first, then ${coachApprovals} coach-facing item${coachApprovals > 1 ? 's' : ''}.`
    } else if (parentApprovals !== null && parentApprovals > 0) {
      updatedAction = `Start with ${parentApprovals} parent-visible item${parentApprovals > 1 ? 's' : ''} — they affect what families see once approved.`
    }

    if (updatedWarnings.length !== intel.warnings.length || updatedAction !== intel.recommendedNextAction) {
      return {
        ...intel,
        recommendedNextAction: updatedAction,
        warnings: updatedWarnings.slice(0, 3),
      }
    }
  }

  return intel
}

/**
 * Converts a route pathname to PageIntelligence.
 *
 * Resolution order:
 *   1. Existing DonnaContextPack (8 routes) → augmented with completion intelligence
 *   2. Dynamic route registry (player profiles, groups)
 *   3. New static routes (curriculum, placement, level-up, onboarding)
 *   4. null for completely unknown routes
 *
 * When livePageState is provided, static intelligence is overlaid with state-aware
 * values so DONNA guides from reality rather than a static checklist.
 */
export function resolvePageIntelligence(pathname: string, livePageState?: LivePageState | null): PageIntelligence | null {
  const pack = getDonnaContextPackForRoute(pathname)
  const completion = getCompletionIntelligence(pathname)

  if (pack) {
    const intel: PageIntelligence = {
      route:               pack.route,
      pageName:            pack.pageName,
      pagePurpose:         pack.pagePurpose,
      visibleData:         pack.availableData,
      keyMetrics:          pack.keyMetrics,
      availableActions:    pack.safeActions,
      approvalActions:     pack.approvalRequiredActions,
      missingData:         pack.missingDataFallback,
      warnings:            completion?.warnings ?? [],
      completionGoals:     completion?.completionGoals ?? [],
      recommendedNextAction: completion?.recommendedNextAction
        ?? (pack.commonCommands[0]?.phrase ?? 'Review the items on this page.'),
    }
    return livePageState ? applyLiveStateOverrides(intel, livePageState) : intel
  }

  // Dynamic route registry (player profiles, groups)
  const dynamic = getDynamicEntry(pathname)
  if (dynamic) {
    const dynCompletion = getCompletionIntelligence(pathname)
    const intel: PageIntelligence = {
      route:               pathname,
      pageName:            dynamic.pageName,
      pagePurpose:         dynamic.pagePurpose,
      visibleData:         dynamic.visibleData,
      keyMetrics:          dynamic.keyMetrics,
      availableActions:    dynamic.availableActions,
      approvalActions:     dynamic.approvalActions,
      missingData:         dynamic.missingData,
      warnings:            dynCompletion?.warnings ?? dynamic.warnings,
      completionGoals:     dynCompletion?.completionGoals ?? dynamic.completionGoals,
      recommendedNextAction: dynCompletion?.recommendedNextAction ?? dynamic.recommendedNextAction,
    }
    return livePageState ? applyLiveStateOverrides(intel, livePageState) : intel
  }

  // Static new routes (curriculum, placement, level-up, onboarding)
  if (completion) {
    const segments = pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1] ?? 'page'
    const pageName = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')

    const pageDefaults = STATIC_PAGE_DEFAULTS[pathname] ?? null

    const intel: PageIntelligence = {
      route:               pathname,
      pageName:            pageDefaults?.pageName ?? pageName,
      pagePurpose:         pageDefaults?.pagePurpose ?? `${pageName} management area.`,
      visibleData:         pageDefaults?.visibleData ?? [],
      keyMetrics:          pageDefaults?.keyMetrics ?? [],
      availableActions:    pageDefaults?.availableActions ?? [],
      approvalActions:     pageDefaults?.approvalActions ?? [],
      missingData:         pageDefaults?.missingData ?? 'Data may not be loaded yet.',
      warnings:            completion.warnings,
      completionGoals:     completion.completionGoals,
      recommendedNextAction: completion.recommendedNextAction,
    }
    return livePageState ? applyLiveStateOverrides(intel, livePageState) : intel
  }

  return null
}

// ── Static page defaults for new routes ───────────────────────────────────────

interface StaticPageDefault {
  pageName: string
  pagePurpose: string
  visibleData: string[]
  keyMetrics: Array<{ id: string; label: string; description: string }>
  availableActions: string[]
  approvalActions: string[]
  missingData: string
}

const STATIC_PAGE_DEFAULTS: Record<string, StaticPageDefault> = {
  '/director/curriculum': {
    pageName: 'Curriculum',
    pagePurpose: 'Curriculum architecture center. Define curriculum levels, progression criteria, content types, and the academy development spine. All player progression tracking depends on an active curriculum spine.',
    visibleData: [
      'Curriculum levels by stage (Red Ball, Orange Ball, Green Ball, Yellow Ball)',
      'Content coverage by domain (technical, tactical, physical, mental)',
      'Player-level assignment status',
      'Coverage gaps by domain and level',
      'Coach curriculum alignment rate',
    ],
    keyMetrics: [
      { id: 'active_levels', label: 'Active Levels', description: 'Curriculum levels currently active in the spine.' },
      { id: 'players_assigned', label: 'Players Assigned', description: 'Players with a curriculum level assigned — unassigned players cannot track progression.' },
      { id: 'coverage_gaps', label: 'Coverage Gaps', description: 'Domain areas with missing content at one or more levels.' },
    ],
    availableActions: [
      'Define curriculum levels and progression criteria',
      'Assign curriculum levels to active players',
      'Review content coverage by domain',
      'Check coach-curriculum alignment',
      'Identify coverage gaps',
    ],
    approvalActions: [
      'Curriculum level changes affect all players at that level — review queue required',
      'Content archival or deletion requires director confirmation',
    ],
    missingData: 'Curriculum data may not be loaded yet. I can explain what each section does while it loads.',
  },

  '/director/level-up': {
    pageName: 'Level Up Review',
    pagePurpose: 'Review and approve player level advancement proposals. Candidates have met curriculum advancement criteria. Director reviews evidence and approves or defers before any level change takes effect.',
    visibleData: [
      'Advancement-eligible players',
      'Evidence per player (assessment scores, coach observations)',
      'Current and proposed curriculum levels',
      'Days since advancement flag was set',
    ],
    keyMetrics: [
      { id: 'candidates', label: 'Candidates', description: 'Players with advancement eligibility flag set.' },
      { id: 'oldest_pending', label: 'Oldest Pending', description: 'Days since oldest candidate was flagged. Beyond 14 days needs action.' },
    ],
    availableActions: [
      'Review advancement evidence per player',
      'Approve or defer level movements',
      'Navigate to player profiles for more context',
    ],
    approvalActions: [
      'Level movement approval (creates proposed_action, requires explicit director decision)',
    ],
    missingData: 'Level up candidates may not be loaded yet. I can explain the advancement criteria while data loads.',
  },

  '/director/placement': {
    pageName: 'Placement Engine',
    pagePurpose: 'New player intake and placement. Guide intake players through the assessment process to assign a curriculum level and group. An unplaced player cannot participate in tracked sessions.',
    visibleData: [
      'Players in intake (awaiting placement)',
      'Placement recommendations per player',
      'Curriculum level assignment options',
      'Group assignment options',
    ],
    keyMetrics: [
      { id: 'intake_count', label: 'In Intake', description: 'Players awaiting placement. Each unplaced player is a blocked development record.' },
      { id: 'oldest_intake', label: 'Oldest Intake', description: 'Days since oldest intake player arrived. Beyond 7 days is delayed.' },
    ],
    availableActions: [
      'Review intake players and their assessment notes',
      'Assign curriculum level and group',
      'Finalize placement to activate player',
    ],
    approvalActions: [
      'finalize_player_placement() is the only function that activates a player — must be run after placement decisions',
    ],
    missingData: 'Intake queue may not be loaded yet. I can explain the placement process while data loads.',
  },

  '/director/onboarding': {
    pageName: 'Academy Setup',
    pagePurpose: 'Academy onboarding flow. Complete 7 setup steps to activate the full operating system. Academy DNA must be set before curriculum, groups, or coach assignments can be configured.',
    visibleData: [
      'Setup step progress (up to 7 steps)',
      'Academy DNA model selection',
      'First curriculum level configuration',
      'First group configuration',
      'Academy name and branding',
    ],
    keyMetrics: [
      { id: 'steps_complete', label: 'Steps Complete', description: 'Onboarding steps marked done. 7/7 unlocks full operating mode.' },
      { id: 'dna_selected', label: 'DNA Selected', description: 'Whether Academy DNA model has been chosen. Required before curriculum and groups.' },
    ],
    availableActions: [
      'Walk through each onboarding step in order',
      'Select Academy DNA model',
      'Define first curriculum level',
      'Create first group',
    ],
    approvalActions: [
      'All setup changes are director decisions — nothing is automatic',
    ],
    missingData: 'Setup progress may not be loaded yet. I can explain what each step does while it loads.',
  },

  // Mega Sprint 3961–3990 — Templates workspace, Today, Settings
  '/director/templates': {
    pageName: 'Templates',
    pagePurpose: 'Templates workspace. Create, edit, and publish the class and fitness templates that structure every session. A level without a published template cannot have aligned sessions.',
    visibleData: [
      'Class templates by curriculum level',
      'Fitness templates and load profiles',
      'Block structure (warm-up, main, cool-down) per template',
      'Publish status per template',
      'Coverage gaps — levels with no template',
    ],
    keyMetrics: [
      { id: 'published_templates', label: 'Published Templates', description: 'Templates available for sessions to align to.' },
      { id: 'levels_covered', label: 'Levels Covered', description: 'Curriculum levels that have at least one published template.' },
      { id: 'empty_blocks', label: 'Empty Blocks', description: 'Template blocks with no activity or coaching cue assigned — these block publishing.' },
    ],
    availableActions: [
      'Create a class or fitness template',
      'Fill blocks with activities and coaching cues',
      'Assign a curriculum level to a template',
      'Preview the session flow',
      'Publish a template',
    ],
    approvalActions: [
      'Publishing a template makes it available to coaches for live sessions',
    ],
    missingData: 'Template data may not be loaded yet. I can explain what each template section does while it loads.',
  },

  '/director/today': {
    pageName: 'Today',
    pagePurpose: "The Director command center for today. Shows what needs your decision now — the review queue, attention signals, today's sessions, and the daily brief.",
    visibleData: [
      'Daily brief',
      'Review queue depth',
      'Players needing attention',
      "Today's sessions",
      'Academy vital signs',
    ],
    keyMetrics: [
      { id: 'pending_reviews', label: 'Pending Reviews', description: 'Items waiting for your approval.' },
      { id: 'attention_signals', label: 'Attention Signals', description: 'Players flagged for follow-up today.' },
      { id: 'sessions_today', label: 'Sessions Today', description: 'Sessions scheduled for today.' },
    ],
    availableActions: [
      'Open the review queue',
      'Act on attention signals',
      'Review today’s sessions',
      'Acknowledge the daily brief',
    ],
    approvalActions: [
      'Review queue items require explicit director approval before they take effect',
    ],
    missingData: 'Today’s data may not be loaded yet. I can explain each section while it loads.',
  },

  '/director/settings': {
    pageName: 'Academy Settings',
    pagePurpose: 'Academy configuration. Set identity, branding, the Academy DNA model, and operating preferences. The DNA model drives how DONNA reasons about your academy everywhere else.',
    visibleData: [
      'Academy name and branding',
      'Academy DNA model selection',
      'Operating preferences and terminology',
      'Role and membership configuration',
    ],
    keyMetrics: [
      { id: 'dna_selected', label: 'DNA Model', description: 'The development model that grounds DONNA’s academy-specific reasoning.' },
      { id: 'identity_complete', label: 'Identity', description: 'Whether academy name and branding are set.' },
    ],
    availableActions: [
      'Confirm academy identity and branding',
      'Select or change the Academy DNA model',
      'Review operating preferences',
    ],
    approvalActions: [
      'Settings changes are director decisions — nothing is automatic',
    ],
    missingData: 'Settings may not be loaded yet. I can explain what each option controls while it loads.',
  },

  '/director/sessions/new': {
    pageName: 'New Session',
    pagePurpose: 'Create a live session by instantiating a published template for a group, coach, date, and time. The session is what a coach delivers and later wraps up.',
    visibleData: [
      'Available published templates',
      'Assignable coaches',
      'Player groups',
      'Date and time picker',
      'Publish status',
    ],
    keyMetrics: [
      { id: 'template_selected', label: 'Template', description: 'Whether a published template is selected for this session.' },
      { id: 'coach_assigned', label: 'Coach', description: 'Whether a coach is assigned to deliver the session.' },
      { id: 'group_confirmed', label: 'Group', description: 'Whether the player group is confirmed.' },
    ],
    availableActions: [
      'Select a published template',
      'Assign a coach',
      'Confirm the player group',
      'Set the date and time',
      'Create and publish the session',
    ],
    approvalActions: [
      'Creating a session is a director-direct write recorded in the audit log',
    ],
    missingData: 'Session builder data may not be loaded yet. I can explain what each field does while it loads.',
  },

  // Mega Sprint 3181–3210
  '/director/coaches': {
    pageName: 'Coaches',
    pagePurpose: 'Coach roster management. View, invite, and manage coaches. Verify group assignments, role definitions, and session coverage. A coach without a group assignment creates a scheduling gap.',
    visibleData: [
      'Active coach roster',
      'Coach role (head_coach / coach)',
      'Assigned groups and sessions',
      'Coach invitation status',
    ],
    keyMetrics: [
      { id: 'active_coaches', label: 'Active Coaches', description: 'Coaches with active academy membership.' },
      { id: 'unassigned_coaches', label: 'Unassigned Coaches', description: 'Active coaches not linked to any group or session.' },
    ],
    availableActions: [
      'Review active coach roster',
      'Invite a new coach by email',
      'Verify group assignments per coach',
      'Check coverage gaps',
    ],
    approvalActions: [
      'Coach role changes require director confirmation',
      'Removing a coach requires reassigning their groups and sessions first',
    ],
    missingData: 'Coach roster may not be loaded yet. I can explain how coach management works while it loads.',
  },
}

// ── AI context formatter ──────────────────────────────────────────────────────

/**
 * Format PageIntelligence as a concise string for AI teacher prompts.
 * Capped at 300 chars — safe for teacher academyContext field.
 */
export function formatPageIntelligenceForTeacher(intel: PageIntelligence): string {
  const goals = intel.completionGoals.slice(0, 1).join('; ')
  const raw = [
    `Page: ${intel.pageName}.`,
    `Purpose: ${intel.pagePurpose}`,
    `Next action: ${intel.recommendedNextAction}`,
    goals ? `Completion goal: ${goals}` : '',
  ].filter(Boolean).join(' ')
  return raw.slice(0, 300)
}
