// Sprint 649 — DONNA Unsafe Request Test Harness V1
// Pure TypeScript QA utility. No DB, no React, no side effects.
// Run manually via ts-node or import into a test file.
//
// Validates that DONNA's safety rules correctly classify input phrases
// as blocked (protected), allowed, or flagged for routing.

import {
  isProtectedVoicePhrase,
  isOnboardingRoutingPhrase,
  detectWakePhrase,
  extractCommandAfterWake,
} from './donnaVoiceRuntime'

import { detectNameCorrectionPhrase } from './donnaNameCorrections'

// ── Test case types ────────────────────────────────────────────────────────────

export interface SafetyTestCase {
  id: string
  description: string
  input: string
  rule: 'protected_voice_phrase' | 'onboarding_routing' | 'wake_phrase' | 'name_correction' | 'safe_pass'
  expectedBlocked: boolean
  expectedExtraction?: string
}

export interface SafetyTestResult {
  id: string
  description: string
  passed: boolean
  actual: boolean | string | null
  expected: boolean | string | undefined
  note?: string
}

// ── Test cases ─────────────────────────────────────────────────────────────────

export const DONNA_SAFETY_TEST_CASES: SafetyTestCase[] = [
  // Protected voice phrases — must always be blocked from voice-only execution
  {
    id: 'pvp-001',
    description: 'Direct save command blocked',
    input: 'save it',
    rule: 'protected_voice_phrase',
    expectedBlocked: true,
  },
  {
    id: 'pvp-002',
    description: 'Level move command blocked',
    input: 'move her up',
    rule: 'protected_voice_phrase',
    expectedBlocked: true,
  },
  {
    id: 'pvp-003',
    description: 'Approval command blocked',
    input: 'approve it',
    rule: 'protected_voice_phrase',
    expectedBlocked: true,
  },
  {
    id: 'pvp-004',
    description: 'Apply command blocked',
    input: 'go ahead and apply',
    rule: 'protected_voice_phrase',
    expectedBlocked: true,
  },
  {
    id: 'pvp-005',
    description: 'Execute command blocked',
    input: 'execute it',
    rule: 'protected_voice_phrase',
    expectedBlocked: true,
  },
  {
    id: 'pvp-006',
    description: 'Embedded save command blocked',
    input: "that's great, save this draft",
    rule: 'protected_voice_phrase',
    expectedBlocked: true,
  },
  {
    id: 'pvp-007',
    description: 'Safe question not blocked',
    input: 'What does Alex need to work on?',
    rule: 'protected_voice_phrase',
    expectedBlocked: false,
  },
  {
    id: 'pvp-008',
    description: 'Observation note not blocked',
    input: 'Alex showed great footwork today',
    rule: 'protected_voice_phrase',
    expectedBlocked: false,
  },

  // Onboarding routing phrases — must be routed, never auto-started
  {
    id: 'onb-001',
    description: 'Academy setup phrase detected',
    input: 'help me set up the academy',
    rule: 'onboarding_routing',
    expectedBlocked: true,
  },
  {
    id: 'onb-002',
    description: 'Onboarding wizard phrase detected',
    input: 'onboarding wizard',
    rule: 'onboarding_routing',
    expectedBlocked: true,
  },
  {
    id: 'onb-003',
    description: 'Normal coach question not caught as onboarding',
    input: 'How do I add a player?',
    rule: 'onboarding_routing',
    expectedBlocked: false,
  },

  // Wake phrase detection
  {
    id: 'wake-001',
    description: 'hey donna detected',
    input: 'hey donna what needs attention',
    rule: 'wake_phrase',
    expectedBlocked: true,
    expectedExtraction: 'what needs attention',
  },
  {
    id: 'wake-002',
    description: 'donna alone detected',
    input: 'donna',
    rule: 'wake_phrase',
    expectedBlocked: true,
    expectedExtraction: '',
  },
  {
    id: 'wake-003',
    description: 'unrelated phrase not caught as wake',
    input: 'please review this session',
    rule: 'wake_phrase',
    expectedBlocked: false,
  },
  {
    id: 'wake-004',
    description: 'command extracted after hi donna',
    input: 'hi donna, show me the review queue',
    rule: 'wake_phrase',
    expectedBlocked: true,
    expectedExtraction: 'show me the review queue',
  },

  // Name correction detection
  {
    id: 'name-001',
    description: 'name correction detected — that\'s X not Y',
    input: "that's Alex not Alix",
    rule: 'name_correction',
    expectedBlocked: true,
  },
  {
    id: 'name-002',
    description: 'name correction detected — I said X not Y',
    input: 'I said Marcus not Marco',
    rule: 'name_correction',
    expectedBlocked: true,
  },
  {
    id: 'name-003',
    description: 'normal sentence not detected as correction',
    input: 'Alex played great today',
    rule: 'name_correction',
    expectedBlocked: false,
  },

  // Safe pass-through
  {
    id: 'safe-001',
    description: 'Observation input passes through',
    input: 'Alex hit 8 of 10 cross-court forehands cleanly',
    rule: 'safe_pass',
    expectedBlocked: false,
  },
  {
    id: 'safe-002',
    description: 'Review queue request passes through',
    input: 'What is in the review queue?',
    rule: 'safe_pass',
    expectedBlocked: false,
  },
]

// ── Runner ─────────────────────────────────────────────────────────────────────

export function runDonnaSafetyTests(
  cases: SafetyTestCase[] = DONNA_SAFETY_TEST_CASES,
): SafetyTestResult[] {
  return cases.map(tc => {
    const lower = tc.input.toLowerCase().trim()

    switch (tc.rule) {
      case 'protected_voice_phrase': {
        const blocked = isProtectedVoicePhrase(lower)
        return {
          id: tc.id,
          description: tc.description,
          passed: blocked === tc.expectedBlocked,
          actual: blocked,
          expected: tc.expectedBlocked,
        }
      }

      case 'onboarding_routing': {
        const blocked = isOnboardingRoutingPhrase(lower)
        return {
          id: tc.id,
          description: tc.description,
          passed: blocked === tc.expectedBlocked,
          actual: blocked,
          expected: tc.expectedBlocked,
        }
      }

      case 'wake_phrase': {
        const detected = detectWakePhrase(tc.input)
        if (!detected) {
          return {
            id: tc.id,
            description: tc.description,
            passed: !tc.expectedBlocked,
            actual: false,
            expected: tc.expectedBlocked,
          }
        }
        const extraction = extractCommandAfterWake(tc.input)
        const extractionMatch =
          tc.expectedExtraction === undefined || extraction === tc.expectedExtraction
        return {
          id: tc.id,
          description: tc.description,
          passed: tc.expectedBlocked && extractionMatch,
          actual: extraction,
          expected: tc.expectedExtraction,
          note: !tc.expectedBlocked ? 'Expected no detection, got detection' : undefined,
        }
      }

      case 'name_correction': {
        const result = detectNameCorrectionPhrase(tc.input)
        const detected = result !== null
        return {
          id: tc.id,
          description: tc.description,
          passed: detected === tc.expectedBlocked,
          actual: detected,
          expected: tc.expectedBlocked,
        }
      }

      case 'safe_pass': {
        const blocked = isProtectedVoicePhrase(lower) || isOnboardingRoutingPhrase(lower)
        return {
          id: tc.id,
          description: tc.description,
          passed: !blocked,
          actual: blocked,
          expected: false,
        }
      }
    }
  })
}

// ── Summary formatter ──────────────────────────────────────────────────────────

export function formatSafetyTestSummary(results: SafetyTestResult[]): string {
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed)
  const lines: string[] = [
    `DONNA Safety Test Results: ${passed}/${results.length} passed`,
    '',
  ]
  if (failed.length > 0) {
    lines.push('FAILURES:')
    for (const f of failed) {
      lines.push(`  [${f.id}] ${f.description}`)
      lines.push(`    expected: ${JSON.stringify(f.expected)}  actual: ${JSON.stringify(f.actual)}`)
      if (f.note) lines.push(`    note: ${f.note}`)
    }
  } else {
    lines.push('All safety tests passed.')
  }
  return lines.join('\n')
}
