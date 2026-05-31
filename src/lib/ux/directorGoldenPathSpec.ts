// Sprint 1026 — Director Golden Path UX Simplification V1
// Defines the intended director golden path and which UX components are ready to wire.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   Documents the "golden path" for a new director using AcademyOS for the first time.
//   Identifies which Sprint 1023-1025 components are ready and when to wire them.
//
// Current state:
//   The director page (/director) already has:
//   - DirectorTodayCommandCenter (Sprint 767) — attention queue + today signals
//   - DonnaDashboardOpenCard (Sprint 804) — DONNA entry with alert count
//   - Today's Pulse grid (Sprint 813) — review queue + player attention + sessions
//   - DirectorPrimaryActionHero (Sprint 1024) — built, NOT yet wired (would duplicate)
//
//   Adding DirectorPrimaryActionHero to the current page would increase cognitive load
//   because DirectorTodayCommandCenter already covers the attention queue.
//
// Golden path redesign target:
//   Phase 1 (this sprint): Spec the target state and document what blocks simplification.
//   Phase 2 (future sprint): Replace DirectorTodayCommandCenter + DonnaDashboardOpenCard
//     with DirectorPrimaryActionHero as the single primary action surface.
//   Phase 3 (V2): Implement the simplified layout with visual testing.

// ── Golden path definition ────────────────────────────────────────────────────

export interface GoldenPathStep {
  stepId: string
  label: string
  description: string
  targetPage: string
  expectedTimeSeconds: number
  successCriteria: string
  currentBlockers: string[]
}

export const DIRECTOR_GOLDEN_PATH: GoldenPathStep[] = [
  {
    stepId: 'open_dashboard',
    label: 'Open Dashboard',
    description: 'Director opens /director and immediately understands what needs attention today.',
    targetPage: '/director',
    expectedTimeSeconds: 3,
    successCriteria: 'Within 3 seconds, director identifies the single most urgent action.',
    currentBlockers: [
      'Multiple equal-weight attention surfaces compete (TodayCommandCenter + DonnaDashboardOpenCard + Pulse grid)',
      'DirectorPrimaryActionHero (Sprint 1024) built but not wired',
    ],
  },
  {
    stepId: 'act_on_review_queue',
    label: 'Act on Review Queue',
    description: 'Director goes to /director/review, reviews first pending item, approves or returns it.',
    targetPage: '/director/review',
    expectedTimeSeconds: 60,
    successCriteria: 'Director approves or returns at least one item without confusion.',
    currentBlockers: [],
  },
  {
    stepId: 'ask_donna',
    label: 'Ask DONNA',
    description: 'Director opens DONNA, asks a question about academy state, gets a grounded answer.',
    targetPage: '/director',
    expectedTimeSeconds: 30,
    successCriteria: 'DONNA answers with live data (God Mode) and highlights relevant UI element.',
    currentBlockers: [
      'God Mode wired in Sprint 1011 — but DONNA panel still has legacy commandResponse path visible',
      'DonnaPanelResponseRenderer (Sprint 1025) built but not wired',
    ],
  },
  {
    stepId: 'review_players',
    label: 'Check Player Status',
    description: 'Director goes to /director/players, identifies players needing attention.',
    targetPage: '/director/players',
    expectedTimeSeconds: 45,
    successCriteria: 'Director can identify pending placements and advancement-eligible players.',
    currentBlockers: [],
  },
  {
    stepId: 'check_curriculum',
    label: 'Check Curriculum',
    description: 'Director opens /director/curriculum, understands current coverage.',
    targetPage: '/director/curriculum',
    expectedTimeSeconds: 30,
    successCriteria: 'Director understands level count and any pending curriculum drafts.',
    currentBlockers: [],
  },
]

// ── Simplification readiness ──────────────────────────────────────────────────

export type ComponentReadinessStatus =
  | 'ready_to_wire'      // Component built and tested — safe to wire now
  | 'needs_visual_test'  // Component built but needs browser testing before wiring
  | 'needs_page_refactor' // Component ready but wiring requires page restructure
  | 'blocked'            // Component has outstanding blockers

export interface ComponentReadiness {
  componentName: string
  sprintBuilt: number
  readinessStatus: ComponentReadinessStatus
  wiringTarget: string
  blockingReason?: string
}

export const SPRINT_1024_1025_READINESS: ComponentReadiness[] = [
  {
    componentName: 'DirectorPrimaryActionHero',
    sprintBuilt: 1024,
    readinessStatus: 'needs_page_refactor',
    wiringTarget: '/director/page.tsx — replace TodayCommandCenter or DonnaDashboardOpenCard',
    blockingReason: 'DirectorTodayCommandCenter (Sprint 767) already covers the attention queue. Wiring without removing the competing component would increase cognitive load.',
  },
  {
    componentName: 'DonnaPanelResponseRenderer',
    sprintBuilt: 1025,
    readinessStatus: 'needs_visual_test',
    wiringTarget: 'DonnaAssistantButton.tsx — replace cooThread + commandResponse + godModeOutput sections',
    blockingReason: 'Requires visual testing to confirm bubble styling matches existing design. No functional blocker.',
  },
]

// ── Golden path score ─────────────────────────────────────────────────────────

/**
 * Compute a golden path completion score (0-100) based on how many steps
 * have no current blockers.
 */
export function computeGoldenPathScore(steps: GoldenPathStep[]): number {
  const unblockedSteps = steps.filter(s => s.currentBlockers.length === 0)
  return Math.round((unblockedSteps.length / steps.length) * 100)
}

/**
 * Get the single highest-priority golden path blocker.
 * Returns the first blocking reason from the highest-priority step that has blockers.
 */
export function getTopGoldenPathBlocker(steps: GoldenPathStep[]): string | null {
  const stepsWithBlockers = steps.filter(s => s.currentBlockers.length > 0)
  return stepsWithBlockers[0]?.currentBlockers[0] ?? null
}
