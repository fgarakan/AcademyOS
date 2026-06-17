// Mega Sprint 3031–3060 — DONNA Page-Aware Operating Layer V1
// Part 2 — Page Operating Context
//
// Merges PageIntelligence with higher-level operational framing.
// Answers: What am I looking at? What matters? What should happen next?
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Derives operational framing from static page intelligence.
//   - Live counts (player numbers, queue depths) are not injected here — those
//     come from DonnaMessageInput fields (pendingReviews, etc.) passed separately.

import type { PageIntelligence } from './pageContextResolver'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PageOperatingContext {
  /** Human description of the page's current purpose in the operating model */
  pagePurpose: string
  /** What the page is currently configured to do */
  currentState: string
  /** What is preventing completion of this page's goals */
  blockers: string[]
  /** What could be improved or actioned */
  opportunities: string[]
  /** Ordered list of next actions DONNA recommends */
  nextActions: string[]
  /** Description of how to reach completion */
  completionPath: string
  /** Whether this page has meaningful completion criteria defined */
  hasCompletionCriteria: boolean
}

// ── Operating context builders per page category ──────────────────────────────

type PageCategory =
  | 'queue'          // review queue, level-up, placement
  | 'directory'      // players list, sessions list
  | 'health'         // KPI, academy health
  | 'builder'        // class template, fitness template
  | 'curriculum'     // curriculum architecture
  | 'profile'        // player profile, group detail
  | 'communications' // parent updates
  | 'setup'          // onboarding
  | 'dashboard'      // today / director home
  | 'unknown'

function classifyPage(intel: PageIntelligence): PageCategory {
  const r = intel.route
  if (r === '/director' || r.endsWith('/dashboard')) return 'dashboard'
  if (r === '/director/kpi') return 'health'
  if (r === '/director/review' || r === '/director/level-up') return 'queue'
  if (r === '/director/players' || r === '/director/sessions') return 'directory'
  if (r.includes('/fitness/templates') || r.includes('/class-templates')) return 'builder'
  if (r === '/director/curriculum') return 'curriculum'
  if (r.startsWith('/director/players/') || r.startsWith('/director/groups/')) return 'profile'
  if (r === '/director/parents') return 'communications'
  if (r === '/director/placement') return 'queue'
  if (r === '/director/onboarding') return 'setup'
  return 'unknown'
}

function buildCurrentState(intel: PageIntelligence, category: PageCategory): string {
  switch (category) {
    case 'dashboard':
      return 'Command center showing pending review items, session activity, and attention signals.'
    case 'health':
      return 'Academy health dashboard showing enrollment, advancement readiness, and attention signals.'
    case 'queue':
      return `Review queue holding items pending director decision. Nothing takes effect until you act.`
    case 'directory':
      return `Directory view showing all ${intel.pageName.toLowerCase()} with status, flags, and filters.`
    case 'builder':
      return `Template builder — structure and content defined here, then published for session use.`
    case 'curriculum':
      return 'Curriculum architecture view — levels, criteria, and content coverage across all stages.'
    case 'profile':
      return `Individual ${intel.pageName.toLowerCase()} record — development data, signals, and action history.`
    case 'communications':
      return 'Parent communication center — drafts pending approval, nothing sent without explicit director sign-off.'
    case 'setup':
      return 'Academy onboarding flow — each step unlocks more of the operating system.'
    default:
      return intel.pagePurpose
  }
}

function buildBlockers(intel: PageIntelligence, category: PageCategory): string[] {
  const blockers: string[] = []
  if (intel.warnings.length > 0) {
    blockers.push(...intel.warnings.slice(0, 2))
  }
  switch (category) {
    case 'curriculum':
      blockers.push('Player progression tracking is inactive until curriculum spine is defined')
      break
    case 'setup':
      blockers.push('Full operating mode requires all 7 onboarding steps complete')
      break
    case 'queue':
      blockers.push('Items in queue have no effect until director explicitly approves, rejects, or defers each one')
      break
    default:
      break
  }
  return Array.from(new Set(blockers)).slice(0, 3)
}

function buildOpportunities(intel: PageIntelligence, category: PageCategory): string[] {
  const opps: string[] = []
  if (intel.completionGoals.length > 0) {
    opps.push(`Completing all goals unlocks: ${intel.completionGoals[0]}`)
  }
  switch (category) {
    case 'curriculum':
      opps.push('Active curriculum spine enables DONNA to track player progression automatically')
      opps.push('Assessment criteria per level enables evidence-based level movement decisions')
      break
    case 'setup':
      opps.push('Completing Academy DNA selection unlocks academy-specific DONNA guidance')
      break
    case 'queue':
      opps.push('Clearing the queue unlocks the next round of coach and player actions')
      break
    case 'profile':
      opps.push('Up-to-date assessment evidence enables accurate advancement decisions')
      break
    default:
      if (intel.availableActions.length > 0) {
        opps.push(`Available: ${intel.availableActions[0]}`)
      }
      break
  }
  return Array.from(new Set(opps)).slice(0, 3)
}

function buildCompletionPath(intel: PageIntelligence): string {
  if (intel.completionGoals.length === 0) {
    return `Review the items on this page and take action where signals indicate.`
  }
  const steps = intel.completionGoals.slice(0, 3).map((g, i) => `${i + 1}. ${g}`).join(' → ')
  return `Complete in order: ${steps}`
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build a PageOperatingContext from PageIntelligence.
 * Returns higher-level framing DONNA uses to guide the director.
 */
export function buildPageOperatingContext(intel: PageIntelligence): PageOperatingContext {
  const category = classifyPage(intel)
  return {
    pagePurpose:         intel.pagePurpose,
    currentState:        buildCurrentState(intel, category),
    blockers:            buildBlockers(intel, category),
    opportunities:       buildOpportunities(intel, category),
    nextActions:         [intel.recommendedNextAction, ...intel.availableActions.slice(0, 2)],
    completionPath:      buildCompletionPath(intel),
    hasCompletionCriteria: intel.completionGoals.length > 0,
  }
}

/**
 * Format PageOperatingContext as a concise AI context string.
 * Capped at 250 chars for teacher prompt safety.
 */
export function formatOperatingContextForAI(ctx: PageOperatingContext): string {
  const blocker = ctx.blockers[0] ?? ''
  const raw = [
    ctx.pagePurpose,
    `Recommended: ${ctx.nextActions[0]}`,
    blocker ? `Blocker: ${blocker}` : '',
  ].filter(Boolean).join(' | ')
  return raw.slice(0, 250)
}
