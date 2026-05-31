// Sprint 1023 — AcademyOS 10/10 UX Audit Skill Pack V1
// Defines the AcademyOS interface quality criteria and programmatic audit tools.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   Provides a structured audit framework for evaluating AcademyOS screens before
//   the Director Dashboard One-Primary-Action Redesign (Sprint 1024) and
//   DONNA Panel Simplification (Sprint 1025).
//
//   The "10/10" standard is defined by these 10 quality dimensions:
//     1. One primary action per screen (cognitive load)
//     2. Clear visual hierarchy (what to look at first)
//     3. DONNA integration visible (AI assistant accessible)
//     4. Trust / data provenance visible (where data comes from)
//     5. Role-appropriate content (director vs. coach vs. player)
//     6. Mobile usability (coach-friendly touch targets)
//     7. Loading / empty states (never blank screen)
//     8. Approval gate visibility (proposed_actions clearly marked)
//     9. Navigation clarity (where am I, how do I go back)
//    10. Accessibility (contrast, size, keyboard navigable)

// ── Audit dimension types ─────────────────────────────────────────────────────

export type AuditDimensionId =
  | 'primary_action_focus'     // 1. One clear primary action
  | 'visual_hierarchy'         // 2. Clear visual hierarchy
  | 'donna_integration'        // 3. DONNA accessible
  | 'data_provenance'          // 4. Data source visible
  | 'role_appropriate'         // 5. Role-appropriate content
  | 'mobile_usability'         // 6. Mobile-friendly
  | 'loading_empty_states'     // 7. Graceful loading/empty
  | 'approval_gate_visibility' // 8. Approval gates clear
  | 'navigation_clarity'       // 9. Navigation clear
  | 'accessibility'            // 10. Accessible

export type AuditSeverity = 'critical' | 'major' | 'minor' | 'pass'

export interface AuditCriteria {
  id: AuditDimensionId
  dimension: string
  description: string
  /** What a 10/10 looks like for this dimension */
  tenOutOfTen: string
  /** What a 0/10 looks like for this dimension */
  zeroOutOfTen: string
  /** Questions to ask during a screen audit */
  auditQuestions: string[]
  /** Weight for overall score calculation (all equal in V1) */
  weight: number
}

// ── 10/10 audit criteria definitions ─────────────────────────────────────────

export const AUDIT_CRITERIA: Record<AuditDimensionId, AuditCriteria> = {
  primary_action_focus: {
    id: 'primary_action_focus',
    dimension: 'Primary Action Focus',
    description: 'Each screen has one clear primary action that a director can take.',
    tenOutOfTen: 'One lime-colored action button is immediately visible. All other actions are secondary or require a menu.',
    zeroOutOfTen: 'Multiple equal-weight actions compete for attention. Director is paralyzed by choice.',
    auditQuestions: [
      'Is there exactly one primary (lime) action button visible?',
      'Are secondary actions visually de-emphasized?',
      'Can a new director identify what to do first within 3 seconds?',
    ],
    weight: 1,
  },
  visual_hierarchy: {
    id: 'visual_hierarchy',
    dimension: 'Visual Hierarchy',
    description: 'Screen communicates what is most important at a glance.',
    tenOutOfTen: 'Key numbers/signals are large. Section headers are clear. White space separates focus areas. Color is meaningful.',
    zeroOutOfTen: 'All elements are the same size and color. Nothing stands out. Director must read every item to find what matters.',
    auditQuestions: [
      'Does the most important signal appear largest/brightest?',
      'Are section headers clearly distinguishable from body text?',
      'Is color used consistently (lime = action, orange = warning, red = urgent)?',
    ],
    weight: 1,
  },
  donna_integration: {
    id: 'donna_integration',
    dimension: 'DONNA Integration',
    description: 'DONNA assistant is accessible and contextually aware on this screen.',
    tenOutOfTen: 'DONNA button visible at all times. DONNA knows what page the director is on. Page-relevant chips available.',
    zeroOutOfTen: 'No DONNA button visible or DONNA gives generic answers with no page context.',
    auditQuestions: [
      'Is the DONNA button always visible?',
      'Does DONNA know what page the director is on?',
      'Are page-relevant prompt chips available in the DONNA panel?',
      'Can DONNA highlight relevant elements on this page?',
    ],
    weight: 1,
  },
  data_provenance: {
    id: 'data_provenance',
    dimension: 'Data Provenance',
    description: 'Director can tell where data comes from (live DB, AI-inferred, demo/seed).',
    tenOutOfTen: 'Data sources are labeled. AI-inferred data has confidence badge. Demo data is clearly marked. Nothing pretends to be real if it is not.',
    zeroOutOfTen: 'Seed data looks identical to live data. AI inference looks like fact. Director cannot tell what to trust.',
    auditQuestions: [
      'Are AI-inferred values labeled with confidence level?',
      'Is demo/seed data visually distinct from real data?',
      'Are data sources cited for key metrics?',
    ],
    weight: 1,
  },
  role_appropriate: {
    id: 'role_appropriate',
    dimension: 'Role-Appropriate Content',
    description: 'Only shows content appropriate for the current role.',
    tenOutOfTen: 'Director sees director-level signals only. Coach sees coach-level content only. Parent/player cannot access director data.',
    zeroOutOfTen: 'Director sees raw coach notes. Coach sees parent financial data. Role boundaries are blurred.',
    auditQuestions: [
      'Does this screen show only role-appropriate content?',
      'Are there any content leaks across role boundaries?',
      'Would a coach or parent see something they should not on this page?',
    ],
    weight: 1,
  },
  mobile_usability: {
    id: 'mobile_usability',
    dimension: 'Mobile Usability',
    description: 'Coach-facing screens are usable on a phone. Director screens work on tablet.',
    tenOutOfTen: 'Touch targets ≥ 44px. Content not cramped. Key actions reachable with thumb. No horizontal scroll.',
    zeroOutOfTen: 'Tiny touch targets. Cramped text. Requires desktop to use core features.',
    auditQuestions: [
      'Are all touch targets at least 44px?',
      'Is there any horizontal scroll on mobile?',
      'Can the primary action be completed without a keyboard on mobile?',
    ],
    weight: 1,
  },
  loading_empty_states: {
    id: 'loading_empty_states',
    dimension: 'Loading & Empty States',
    description: 'Screen never shows a blank or broken state.',
    tenOutOfTen: 'Loading states use skeleton UI or spinner with context. Empty states explain why empty and what to do. Error states have recovery action.',
    zeroOutOfTen: 'Blank white screen on load. Empty list with no explanation. Error with no recovery path.',
    auditQuestions: [
      'Is there a visible loading indicator when data is fetching?',
      'Does the empty state explain what is missing and how to fix it?',
      'Are error states handled with a recovery path?',
    ],
    weight: 1,
  },
  approval_gate_visibility: {
    id: 'approval_gate_visibility',
    dimension: 'Approval Gate Visibility',
    description: 'Proposed actions requiring approval are clearly marked before execution.',
    tenOutOfTen: 'All proposed_actions show "requires approval" badge. Draft actions are visually distinct from completed ones. Nothing executes silently.',
    zeroOutOfTen: 'Proposed actions look identical to applied actions. Director cannot tell what requires review.',
    auditQuestions: [
      'Are all proposed/draft actions clearly labeled as such?',
      'Is it clear which actions require director approval before executing?',
      'Is the review queue prominently linked from any approval-gated action?',
    ],
    weight: 1,
  },
  navigation_clarity: {
    id: 'navigation_clarity',
    dimension: 'Navigation Clarity',
    description: 'Director always knows where they are and how to go back.',
    tenOutOfTen: 'Breadcrumb or page title visible. Back navigation is clear. Active sidebar item is highlighted. Deep pages show context trail.',
    zeroOutOfTen: 'No page title. No breadcrumb. Back button leads to unexpected page. Director is lost.',
    auditQuestions: [
      'Is the current page clearly identified (title or breadcrumb)?',
      'Is the active navigation item highlighted in the sidebar?',
      'Is there a clear way to navigate back from deep pages?',
    ],
    weight: 1,
  },
  accessibility: {
    id: 'accessibility',
    dimension: 'Accessibility',
    description: 'Screen is usable with keyboard and meets minimum contrast requirements.',
    tenOutOfTen: 'All interactive elements keyboard-navigable. Text contrast ≥ 4.5:1. Focus indicators visible. ARIA labels on icon-only buttons.',
    zeroOutOfTen: 'Icon-only buttons with no labels. Low contrast text. No keyboard navigation. Screen reader unfriendly.',
    auditQuestions: [
      'Are all interactive elements reachable via keyboard?',
      'Does text meet WCAG 4.5:1 contrast ratio?',
      'Do icon-only buttons have ARIA labels?',
      'Are focus indicators visible when tabbing?',
    ],
    weight: 1,
  },
}

// ── Audit result types ────────────────────────────────────────────────────────

export interface AuditDimensionResult {
  id: AuditDimensionId
  dimension: string
  score: number  // 0-10
  severity: AuditSeverity
  findings: string[]
  recommendations: string[]
}

export interface ScreenAuditReport {
  screenPath: string
  screenLabel: string
  auditedAt: string
  totalScore: number  // 0-100
  dimensionResults: AuditDimensionResult[]
  criticalFindings: string[]
  topRecommendations: string[]  // Top 3 by priority
  sprintReadiness: 'blocked' | 'needs_work' | 'good' | 'excellent'
}

// ── Score calculator ──────────────────────────────────────────────────────────

/**
 * Calculate sprint readiness from total score.
 */
export function scoreToSprintReadiness(score: number): ScreenAuditReport['sprintReadiness'] {
  if (score < 40) return 'blocked'
  if (score < 65) return 'needs_work'
  if (score < 85) return 'good'
  return 'excellent'
}

/**
 * Calculate severity from dimension score.
 */
export function scoreToSeverity(score: number): AuditSeverity {
  if (score >= 8) return 'pass'
  if (score >= 6) return 'minor'
  if (score >= 4) return 'major'
  return 'critical'
}

/**
 * Build a lightweight audit report from manual dimension scores.
 * Score each dimension 0-10, provide findings and recommendations.
 */
export function buildAuditReport(
  screenPath: string,
  screenLabel: string,
  dimensionScores: Array<{
    id: AuditDimensionId
    score: number
    findings: string[]
    recommendations: string[]
  }>,
): ScreenAuditReport {
  const totalScore = Math.round(
    dimensionScores.reduce((sum, d) => sum + d.score, 0) / dimensionScores.length * 10,
  )

  const dimensionResults: AuditDimensionResult[] = dimensionScores.map(d => ({
    id: d.id,
    dimension: AUDIT_CRITERIA[d.id].dimension,
    score: d.score,
    severity: scoreToSeverity(d.score),
    findings: d.findings,
    recommendations: d.recommendations,
  }))

  const criticalFindings = dimensionResults
    .filter(d => d.severity === 'critical')
    .flatMap(d => d.findings)

  const topRecommendations = dimensionResults
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .flatMap(d => d.recommendations.slice(0, 1))

  return {
    screenPath,
    screenLabel,
    auditedAt: new Date().toISOString(),
    totalScore,
    dimensionResults,
    criticalFindings,
    topRecommendations,
    sprintReadiness: scoreToSprintReadiness(totalScore),
  }
}

// ── Director dashboard pre-sprint audit ──────────────────────────────────────

/**
 * Known audit findings for the Director Dashboard before Sprint 1024 redesign.
 * These are the issues Sprint 1024 (One-Primary-Action Redesign) will address.
 */
export const DIRECTOR_DASHBOARD_PRE_1024_AUDIT: ScreenAuditReport = buildAuditReport(
  '/director',
  'Director Dashboard',
  [
    {
      id: 'primary_action_focus',
      score: 4,
      findings: ['Multiple sections compete equally — review queue, KPI summary, sessions, players all similar weight'],
      recommendations: ['Elevate review queue as the single primary action; everything else secondary'],
    },
    {
      id: 'visual_hierarchy',
      score: 6,
      findings: ['KPI numbers visible but not clearly prioritized by urgency'],
      recommendations: ['Surface highest-urgency signal first; use size + color to rank signals'],
    },
    {
      id: 'donna_integration',
      score: 7,
      findings: ['DONNA button present; page-aware chips available; God Mode now wired (Sprint 1011)'],
      recommendations: ['Add DONNA greeting on first open; pre-load daily brief'],
    },
    {
      id: 'data_provenance',
      score: 6,
      findings: ['Some values labeled but not all; no explicit "live" vs "estimated" distinction'],
      recommendations: ['Add live data badge to all DB-backed KPIs; label AI-estimated values'],
    },
    {
      id: 'role_appropriate',
      score: 8,
      findings: ['Director content correctly scoped'],
      recommendations: ['Verify no coach-only metrics are surfaced to directors'],
    },
    {
      id: 'mobile_usability',
      score: 5,
      findings: ['Dashboard designed for desktop; touch targets adequate but layout is dense on mobile'],
      recommendations: ['Add responsive mobile layout for director dashboard'],
    },
    {
      id: 'loading_empty_states',
      score: 7,
      findings: ['Loading states present; empty states for review queue and sessions good'],
      recommendations: ['Add skeleton loading to KPI cards'],
    },
    {
      id: 'approval_gate_visibility',
      score: 8,
      findings: ['Review queue shows pending count; approval gates in Review Center are clear'],
      recommendations: ['Add pending count badge to sidebar nav item'],
    },
    {
      id: 'navigation_clarity',
      score: 8,
      findings: ['Sidebar navigation clear; active item highlighted'],
      recommendations: ['Add breadcrumb for deep nested pages'],
    },
    {
      id: 'accessibility',
      score: 6,
      findings: ['Keyboard navigation partial; some icon buttons lack ARIA labels'],
      recommendations: ['Audit all icon-only buttons for ARIA labels; verify contrast ratios'],
    },
  ],
)
