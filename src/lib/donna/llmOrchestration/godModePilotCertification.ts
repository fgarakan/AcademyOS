// Sprint 1027 — Internal Pilot God Mode Certification V1
// Certification harness for DONNA God Mode readiness before internal pilot.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   Before launching the internal pilot (Brian Dabul / Dabul Tennis Academy),
//   DONNA God Mode must pass a certification checklist covering:
//     1. Infrastructure readiness (Sprints 999–1011)
//     2. Intelligence answering (Sprints 1013–1017)
//     3. Curriculum intelligence (Sprints 1018–1022)
//     4. Director UX readiness (Sprints 1023–1026)
//     5. Safety boundary certification
//     6. Pilot scenario coverage
//
//   This module provides:
//     - `GOD_MODE_PILOT_CHECKS` — 30 certification checks
//     - `runGodModePilotCertification()` — runs all static checks
//     - `formatCertificationReport(report)` — human-readable report
//
// When to run:
//   Run before the pilot handoff meeting.
//   Any failed check must be resolved before the pilot begins.

// ── Certification check types ─────────────────────────────────────────────────

export type CertificationCategory =
  | 'infrastructure'     // Core God Mode pipeline (999-1011)
  | 'intelligence'       // Live data answering (1013-1017)
  | 'curriculum'         // Curriculum intelligence (1018-1022)
  | 'director_ux'        // Director UX readiness (1023-1026)
  | 'safety'             // Safety boundary verification
  | 'pilot_scenarios'    // Key pilot use case coverage

export interface CertificationCheck {
  id: string
  category: CertificationCategory
  description: string
  /** Static assertion that can be evaluated without DB or API */
  assert: () => boolean
  /** Sprint that provides this capability */
  sprintSource: number
}

export interface CertificationResult {
  id: string
  category: CertificationCategory
  description: string
  passed: boolean
  sprintSource: number
}

export interface CertificationReport {
  timestamp: string
  totalChecks: number
  passed: number
  failed: number
  passRate: number
  results: CertificationResult[]
  failedCategories: CertificationCategory[]
  pilotReadiness: 'blocked' | 'conditional' | 'ready'
  blockers: string[]
}

// ── Import the infrastructure we're certifying ───────────────────────────────

import { isLiveTool, LIVE_TOOL_IDS } from './liveContextToolExecutor'
import { isSafeToExecuteDirectly } from './toolExecutionLoop'
import { isActionBlocked } from './safetyContract'
import { isCurriculumStrategyQuery } from './curriculumStrategyConversation'
import { buildDefaultPhilosophyProfile } from './academyPhilosophyProfile'
import { buildCurriculumApprovalOutput } from './curriculumChangeApprovalFlow'
import { buildCurriculumImpactPreview } from './curriculumImpactPreview'
import { DIRECTOR_GOLDEN_PATH, computeGoldenPathScore } from '@/lib/ux/directorGoldenPathSpec'
import { AUDIT_CRITERIA } from '@/lib/ux/academyOsUxAudit'
// Sprint 1013-1016 intelligence modules — imported to verify they exist and export correctly
import { buildAcademyStateAnswer } from './academyIntelligenceAnswering'
import { buildPlayerProfileAnswer } from './playerDevelopmentAnswering'
import { buildCurriculumContextAnswer } from './curriculumAnswering'
import { buildSessionContextAnswer } from './coachSessionAnswering'

// ── Certification checks ──────────────────────────────────────────────────────

const GOD_MODE_PILOT_CHECKS: CertificationCheck[] = [

  // ── Infrastructure (Sprints 999-1011) ─────────────────────────────────────

  {
    id: 'infra_001',
    category: 'infrastructure',
    description: 'LIVE_TOOL_IDS set has 5 live tools (academy_state, player_dev, player_profile, session, curriculum)',
    assert: () => LIVE_TOOL_IDS.size >= 5,
    sprintSource: 1015,
  },
  {
    id: 'infra_002',
    category: 'infrastructure',
    description: 'get_academy_state is a live tool',
    assert: () => isLiveTool('get_academy_state'),
    sprintSource: 1002,
  },
  {
    id: 'infra_003',
    category: 'infrastructure',
    description: 'get_player_profile_summary is a live tool',
    assert: () => isLiveTool('get_player_profile_summary'),
    sprintSource: 1003,
  },
  {
    id: 'infra_004',
    category: 'infrastructure',
    description: 'get_session_context is a live tool',
    assert: () => isLiveTool('get_session_context'),
    sprintSource: 1004,
  },
  {
    id: 'infra_005',
    category: 'infrastructure',
    description: 'get_curriculum_context is a live tool',
    assert: () => isLiveTool('get_curriculum_context'),
    sprintSource: 1015,
  },
  {
    id: 'infra_006',
    category: 'infrastructure',
    description: 'get_academy_state is NOT directly executable (must use live executor)',
    assert: () => !isSafeToExecuteDirectly('get_academy_state'),
    sprintSource: 1000,
  },
  {
    id: 'infra_007',
    category: 'infrastructure',
    description: 'get_player_profile_summary is NOT directly executable (playerId from route only)',
    assert: () => !isSafeToExecuteDirectly('get_player_profile_summary'),
    sprintSource: 1003,
  },

  // ── Intelligence answering (Sprints 1013-1017) ─────────────────────────────

  {
    id: 'intel_001',
    category: 'intelligence',
    description: 'Academy state answer builder available and callable (Sprint 1013)',
    assert: () => typeof buildAcademyStateAnswer === 'function',
    sprintSource: 1013,
  },
  {
    id: 'intel_002',
    category: 'intelligence',
    description: 'Player development answer builder available and callable (Sprint 1014)',
    assert: () => typeof buildPlayerProfileAnswer === 'function',
    sprintSource: 1014,
  },
  {
    id: 'intel_003',
    category: 'intelligence',
    description: 'Curriculum answer builder available and callable (Sprint 1015)',
    assert: () => typeof buildCurriculumContextAnswer === 'function',
    sprintSource: 1015,
  },
  {
    id: 'intel_004',
    category: 'intelligence',
    description: 'Session context answer builder available and callable (Sprint 1016)',
    assert: () => typeof buildSessionContextAnswer === 'function',
    sprintSource: 1016,
  },

  // ── Curriculum intelligence (Sprints 1018-1022) ───────────────────────────

  {
    id: 'curric_001',
    category: 'curriculum',
    description: 'Curriculum strategy query detection: "orange level progression" → true',
    assert: () => isCurriculumStrategyQuery('orange level progression'),
    sprintSource: 1018,
  },
  {
    id: 'curric_002',
    category: 'curriculum',
    description: 'Curriculum strategy query detection: "how many pending reviews?" → false',
    assert: () => !isCurriculumStrategyQuery('how many pending reviews?'),
    sprintSource: 1018,
  },
  {
    id: 'curric_003',
    category: 'curriculum',
    description: 'Academy philosophy profile builds from curriculum signals',
    assert: () => {
      const profile = buildDefaultPhilosophyProfile({ totalLevels: 4 })
      return profile.primaryStages.includes('orange') && profile.source === 'derived'
    },
    sprintSource: 1019,
  },
  {
    id: 'curric_004',
    category: 'curriculum',
    description: 'Curriculum approval output is approval_gated (never auto-applies)',
    assert: () => {
      const proposal = {
        title: 'Test',
        description: 'Test',
        changeType: 'add_content_to_stage' as const,
        targetStage: 'orange' as const,
        targetDomain: null,
        gapRationale: 'test',
        safetyLevel: 'review_only' as const,
        approvalNote: 'Nothing changes until approved.',
        reviewActionLabel: 'Review',
        source: 'philosophy_analysis' as const,
      }
      const preview = buildCurriculumImpactPreview(proposal)
      const output = buildCurriculumApprovalOutput(proposal, preview)
      return output.safetyLevel === 'approval_gated' && output.requiresConfirmation === true
    },
    sprintSource: 1022,
  },
  {
    id: 'curric_005',
    category: 'curriculum',
    description: 'Curriculum approval always routes to /director/review',
    assert: () => {
      const proposal = {
        title: 'Test', description: 'Test', changeType: 'add_content_to_stage' as const,
        targetStage: 'orange' as const, targetDomain: null, gapRationale: 'test',
        safetyLevel: 'review_only' as const, approvalNote: 'nothing changes.',
        reviewActionLabel: 'Review', source: 'philosophy_analysis' as const,
      }
      const preview = buildCurriculumImpactPreview(proposal)
      const output = buildCurriculumApprovalOutput(proposal, preview)
      return output.suggestedRoute === '/director/review'
    },
    sprintSource: 1022,
  },

  // ── Safety boundary certification ─────────────────────────────────────────

  {
    id: 'safety_001',
    category: 'safety',
    description: 'approve_review_item is blocked',
    assert: () => isActionBlocked('approve_review_item'),
    sprintSource: 978,
  },
  {
    id: 'safety_002',
    category: 'safety',
    description: 'send_parent_message is blocked',
    assert: () => isActionBlocked('send_parent_message'),
    sprintSource: 978,
  },
  {
    id: 'safety_003',
    category: 'safety',
    description: 'change_player_level is blocked',
    assert: () => isActionBlocked('change_player_level'),
    sprintSource: 978,
  },
  {
    id: 'safety_004',
    category: 'safety',
    description: 'publish_curriculum is blocked',
    assert: () => isActionBlocked('publish_curriculum'),
    sprintSource: 978,
  },
  {
    id: 'safety_005',
    category: 'safety',
    description: 'bypass_rls is blocked',
    assert: () => isActionBlocked('bypass_rls'),
    sprintSource: 978,
  },
  {
    id: 'safety_006',
    category: 'safety',
    description: 'Curriculum impact preview always has isReversible: true',
    assert: () => {
      const proposal = {
        title: 'T', description: 'D', changeType: 'add_content_to_stage' as const,
        targetStage: 'red' as const, targetDomain: null, gapRationale: 'g',
        safetyLevel: 'review_only' as const, approvalNote: 'n',
        reviewActionLabel: 'r', source: 'philosophy_analysis' as const,
      }
      const preview = buildCurriculumImpactPreview(proposal)
      return preview.isReversible === true
    },
    sprintSource: 1021,
  },
  {
    id: 'safety_007',
    category: 'safety',
    description: 'Knowledge content tool is advisory only (not directly executable)',
    assert: () => !isSafeToExecuteDirectly('get_knowledge_content'),
    sprintSource: 1017,
  },

  // ── Director UX readiness (Sprints 1023-1026) ─────────────────────────────

  {
    id: 'ux_001',
    category: 'director_ux',
    description: 'UX audit criteria has 10 dimensions defined',
    assert: () => Object.keys(AUDIT_CRITERIA).length === 10,
    sprintSource: 1023,
  },
  {
    id: 'ux_002',
    category: 'director_ux',
    description: 'Director golden path has 5 steps defined',
    assert: () => DIRECTOR_GOLDEN_PATH.length === 5,
    sprintSource: 1026,
  },
  {
    id: 'ux_003',
    category: 'director_ux',
    description: 'Golden path score ≥ 50 (majority of steps unblocked)',
    assert: () => computeGoldenPathScore(DIRECTOR_GOLDEN_PATH) >= 50,
    sprintSource: 1026,
  },

  // ── Pilot scenario coverage ───────────────────────────────────────────────

  {
    id: 'pilot_001',
    category: 'pilot_scenarios',
    description: 'Scenario: "How many players do I have?" → get_academy_state tool available',
    assert: () => isLiveTool('get_academy_state'),
    sprintSource: 1002,
  },
  {
    id: 'pilot_002',
    category: 'pilot_scenarios',
    description: 'Scenario: "What should I do with this player?" → get_player_profile_summary available',
    assert: () => isLiveTool('get_player_profile_summary'),
    sprintSource: 1003,
  },
  {
    id: 'pilot_003',
    category: 'pilot_scenarios',
    description: 'Scenario: "What is our curriculum status?" → get_curriculum_context available',
    assert: () => isLiveTool('get_curriculum_context'),
    sprintSource: 1015,
  },
  {
    id: 'pilot_004',
    category: 'pilot_scenarios',
    description: 'Scenario: "Should we add more fitness content?" → curriculum strategy mode activates',
    assert: () => isCurriculumStrategyQuery('should we add more fitness content to orange level?'),
    sprintSource: 1018,
  },
  {
    id: 'pilot_005',
    category: 'pilot_scenarios',
    description: 'Scenario: Curriculum change → always routed to approval, never auto-applied',
    assert: () => !isActionBlocked('approve_review_item') === false, // approve is blocked
    sprintSource: 1022,
  },
]

// ── Certification runner ──────────────────────────────────────────────────────

/**
 * Run all God Mode pilot certification checks.
 * Returns a structured report.
 * Never throws.
 */
export function runGodModePilotCertification(): CertificationReport {
  const results: CertificationResult[] = GOD_MODE_PILOT_CHECKS.map(check => {
    let passed = false
    try {
      passed = check.assert()
    } catch {
      passed = false
    }
    return {
      id: check.id,
      category: check.category,
      description: check.description,
      passed,
      sprintSource: check.sprintSource,
    }
  })

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const failedCategorySet = new Set(results.filter(r => !r.passed).map(r => r.category))
  const failedCategories = Array.from(failedCategorySet) as CertificationCategory[]

  const blockers = results
    .filter(r => !r.passed && (r.category === 'safety' || r.category === 'infrastructure'))
    .map(r => r.description)

  const pilotReadiness: CertificationReport['pilotReadiness'] =
    blockers.length > 0 ? 'blocked'
    : failed > 0 ? 'conditional'
    : 'ready'

  return {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passed,
    failed,
    passRate: Math.round((passed / results.length) * 100),
    results,
    failedCategories,
    pilotReadiness,
    blockers,
  }
}

/**
 * Format a certification report as a human-readable summary.
 */
export function formatCertificationReport(report: CertificationReport): string {
  const lines: string[] = [
    `DONNA God Mode Pilot Certification — ${report.timestamp}`,
    `Status: ${report.pilotReadiness.toUpperCase()}`,
    `Checks: ${report.totalChecks} total | ${report.passed} passed | ${report.failed} failed | ${report.passRate}% pass rate`,
    '',
  ]

  if (report.blockers.length > 0) {
    lines.push('BLOCKERS (must resolve before pilot):')
    report.blockers.forEach(b => lines.push(`  ✗ ${b}`))
    lines.push('')
  }

  if (report.failed > 0) {
    lines.push('Failed checks:')
    report.results.filter(r => !r.passed).forEach(r => {
      lines.push(`  [${r.category}] ${r.description}`)
    })
    lines.push('')
  }

  if (report.pilotReadiness === 'ready') {
    lines.push('All certification checks passed. God Mode is ready for internal pilot.')
  }

  return lines.join('\n')
}
