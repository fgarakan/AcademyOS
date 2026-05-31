// Sprint 1033 — Director Dashboard Surface Audit V1
// Catalogues every attention surface on /director/page.tsx.
// Drives Sprint 1034 replacement decisions.
// Pure TypeScript — no DB, no API, no mutations.
//
// Audit methodology:
//   For each surface: what it shows, who it serves, whether it competes, what to do.

// ── Surface types ─────────────────────────────────────────────────────────────

export type SurfaceAction =
  | 'keep'              // Good — leave as-is
  | 'keep_simplify'     // Good purpose but needs visual simplification
  | 'replace'           // Replace with a different component
  | 'collapse'          // Collapse to a single line / secondary section
  | 'remove_when_live'  // Remove once academy is live (setup only)
  | 'move_down'         // Demote in visual hierarchy, don't remove

export type AttentionConflict =
  | 'none'              // Does not compete with other surfaces
  | 'duplicates_primary' // Shows the same information as the primary action surface
  | 'equal_weight'      // Same visual weight as other surfaces — creates choice paralysis

export interface DashboardSurface {
  name: string
  sprintAdded: number
  location: 'top' | 'mid' | 'bottom'
  purpose: string
  showsUrgency: boolean
  showsCount: boolean
  hasCTA: boolean
  attentionConflict: AttentionConflict
  visibilityCondition: string
  recommendedAction: SurfaceAction
  rationale: string
  sprint1034Impact: string
}

// ── Surface audit ─────────────────────────────────────────────────────────────

export const DIRECTOR_DASHBOARD_SURFACES: DashboardSurface[] = [
  {
    name: 'Hero Header (greeting + date)',
    sprintAdded: 1,
    location: 'top',
    purpose: 'Greeting and date context',
    showsUrgency: false,
    showsCount: false,
    hasCTA: false,
    attentionConflict: 'none',
    visibilityCondition: 'always',
    recommendedAction: 'keep_simplify',
    rationale: 'Valuable for orientation. Could be smaller — the large h1 takes vertical space. Consider reducing to a compact greeting line.',
    sprint1034Impact: 'No change needed. Simplify font size from 4xl to 2xl in a future pass.',
  },
  {
    name: 'AcademyHealthBadgeWithDrawer',
    sprintAdded: 452,
    location: 'top',
    purpose: 'Quick health signal + expandable detail drawer',
    showsUrgency: true,
    showsCount: false,
    hasCTA: true,
    attentionConflict: 'equal_weight',
    visibilityCondition: 'always',
    recommendedAction: 'keep_simplify',
    rationale: 'Useful signal. Currently sits next to the greeting at the same visual weight as other CTAs. Consider making it inline/text-only in the greeting line.',
    sprint1034Impact: 'Keep. May be repositioned inside the hero header in a future pass.',
  },
  {
    name: 'DonnaDashboardOpenCard',
    sprintAdded: 804,
    location: 'top',
    purpose: 'Opens DONNA with pre-loaded context; shows alert count',
    showsUrgency: true,
    showsCount: true,
    hasCTA: true,
    attentionConflict: 'duplicates_primary',
    visibilityCondition: 'always',
    recommendedAction: 'replace',
    rationale: 'Its purpose (one primary action + DONNA entry) is exactly what DirectorPrimaryActionHero provides. With Sprint 1028-1029, DONNA is always accessible via the floating button. This card is now redundant.',
    sprint1034Impact: 'REMOVE in Sprint 1034. Replaced by DirectorPrimaryActionHero + persistent DONNA button.',
  },
  {
    name: 'DirectorTodayCommandCenter',
    sprintAdded: 767,
    location: 'top',
    purpose: 'Attention queue — what needs the director\'s action today',
    showsUrgency: true,
    showsCount: true,
    hasCTA: true,
    attentionConflict: 'equal_weight',
    visibilityCondition: 'always — shows "all clear" state when queue is empty',
    recommendedAction: 'replace',
    rationale: 'The right concept (single attention queue) but the wrong form (full section at equal weight with everything else). DirectorPrimaryActionHero replaces this with a single-line primary action at the top.',
    sprint1034Impact: 'REPLACE with DirectorPrimaryActionHero in Sprint 1034. TodayCommandCenter removed.',
  },
  {
    name: "Today's Pulse grid (3 tiles)",
    sprintAdded: 813,
    location: 'top',
    purpose: '3 at-a-glance tiles: review queue count, player attention count, sessions this week',
    showsUrgency: true,
    showsCount: true,
    hasCTA: true,
    attentionConflict: 'equal_weight',
    visibilityCondition: 'always',
    recommendedAction: 'keep',
    rationale: 'Compact and useful. These 3 numbers (review count, alert count, session count) are the right "ambient awareness" signals. KEEP but ensure they are clearly secondary to the primary action hero.',
    sprint1034Impact: 'Keep. Visually demoted to below DirectorPrimaryActionHero.',
  },
  {
    name: 'AcademyKpiCardsSection',
    sprintAdded: 462,
    location: 'mid',
    purpose: 'KPI metric cards (recap rate, completion rate, etc.)',
    showsUrgency: false,
    showsCount: true,
    hasCTA: false,
    attentionConflict: 'none',
    visibilityCondition: 'always',
    recommendedAction: 'keep',
    rationale: 'Good secondary information. Not urgent — director checks these occasionally. Keep in mid section.',
    sprint1034Impact: 'No change.',
  },
  {
    name: 'DirectorKpiHealthSection',
    sprintAdded: 462,
    location: 'mid',
    purpose: 'KPI health indicators',
    showsUrgency: false,
    showsCount: true,
    hasCTA: false,
    attentionConflict: 'none',
    visibilityCondition: 'always',
    recommendedAction: 'keep',
    rationale: 'Supporting context for KPI interpretation. Keep.',
    sprint1034Impact: 'No change.',
  },
  {
    name: 'LiveActivityCard',
    sprintAdded: 795,
    location: 'mid',
    purpose: 'Sessions this week + pending wrap-ups + pending placements',
    showsUrgency: false,
    showsCount: true,
    hasCTA: false,
    attentionConflict: 'duplicates_primary',
    visibilityCondition: 'always',
    recommendedAction: 'collapse',
    rationale: 'Partially duplicates the Pulse grid (sessions count). The wrap-up and placement info is useful context. Consider collapsing to a single row summary.',
    sprint1034Impact: 'Leave for now. Flag for future simplification.',
  },
  {
    name: 'NextBestActionCard',
    sprintAdded: 833,
    location: 'bottom',
    purpose: 'Onboarding next steps when academy is in setup mode',
    showsUrgency: false,
    showsCount: false,
    hasCTA: true,
    attentionConflict: 'none',
    visibilityCondition: 'only during onboarding / setup incomplete',
    recommendedAction: 'remove_when_live',
    rationale: 'Correct behavior — only shown when setup is incomplete. Will disappear once academy is fully set up. No action needed.',
    sprint1034Impact: 'No change. Will auto-hide for a live academy.',
  },
  {
    name: 'DirectorDnaStatusBadge',
    sprintAdded: 859,
    location: 'bottom',
    purpose: 'Shows when the director\'s "DNA" (preferences) was last saved',
    showsUrgency: false,
    showsCount: false,
    hasCTA: false,
    attentionConflict: 'none',
    visibilityCondition: 'when DNA has been saved',
    recommendedAction: 'collapse',
    rationale: 'Meta-information. Useful to have but not on the main dashboard. Move to a settings or profile section in a future pass.',
    sprint1034Impact: 'Leave for now.',
  },
  {
    name: 'DirectorContinueSetupPanel',
    sprintAdded: 874,
    location: 'bottom',
    purpose: 'Checklist of setup tasks remaining',
    showsUrgency: false,
    showsCount: true,
    hasCTA: true,
    attentionConflict: 'none',
    visibilityCondition: 'when setup tasks are incomplete',
    recommendedAction: 'remove_when_live',
    rationale: 'Correct behavior — only shown during setup. Will be absent in a live academy.',
    sprint1034Impact: 'No change. Will auto-hide for a live academy.',
  },
]

// ── Competing surfaces analysis ───────────────────────────────────────────────

export interface CompetingPair {
  surface1: string
  surface2: string
  conflict: string
}

export const COMPETING_SURFACE_PAIRS: CompetingPair[] = [
  {
    surface1: 'DonnaDashboardOpenCard',
    surface2: 'DirectorTodayCommandCenter',
    conflict: 'Both show urgency signals and CTAs at the same visual weight at the top of the page',
  },
  {
    surface1: "Today's Pulse grid",
    surface2: 'DirectorTodayCommandCenter',
    conflict: 'Pulse grid shows review queue count AND DirectorTodayCommandCenter shows review queue items — duplication',
  },
  {
    surface1: 'LiveActivityCard',
    surface2: "Today's Pulse grid",
    conflict: 'Both show session count and pending items',
  },
]

// ── Sprint 1034 action plan ───────────────────────────────────────────────────

export const SPRINT_1034_PLAN = {
  remove: ['DonnaDashboardOpenCard', 'DirectorTodayCommandCenter'],
  add: ['DirectorPrimaryActionHero (Sprint 1024)'],
  keep: ["Today's Pulse grid", 'AcademyKpiCardsSection', 'DirectorKpiHealthSection', 'NextBestActionCard (conditional)', 'DirectorContinueSetupPanel (conditional)'],
  defer: ['LiveActivityCard simplification', 'Hero header font size reduction', 'DirectorDnaStatusBadge relocation'],
  expectedOutcome: 'Director dashboard goes from 3 competing top-of-page CTAs to 1 clear primary action + 2 ambient count tiles',
}

// ── Surface count summary ─────────────────────────────────────────────────────

export function getCompetingCount(): number {
  return DIRECTOR_DASHBOARD_SURFACES.filter(
    s => s.attentionConflict !== 'none'
  ).length
}

export function getSurfacesByAction(action: SurfaceAction): DashboardSurface[] {
  return DIRECTOR_DASHBOARD_SURFACES.filter(s => s.recommendedAction === action)
}
