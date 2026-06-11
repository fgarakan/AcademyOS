// Sprint 1775A — DONNA Operating Partner Architecture Audit V1
// Combined Input Contract: the single object Sprint 1776–1805 receives.
//
// This combines the philosophy contract and the operational contract
// into one typed payload. Sprint 1776–1805 must accept this as its
// primary input — never build parallel input structures.
//
// Input completeness score (0–100):
//   - 0 = completely blind; no data loaded
//   - 50 = half of critical domains available
//   - 100 = all domains loaded with reliable confidence
//   Philosophy layer counts as ~40% of total score.
//   Operational layer counts as ~60% of total score.

import type { OperatingPartnerPhilosophyInputs } from './operatingPartnerPhilosophyContract'
import type { OperatingPartnerOperationalInputs } from './operatingPartnerOperationalContract'

// ── Combined input ────────────────────────────────────────────────────────────

export interface OperatingPartnerInputs {
  academyId:    string
  generatedAt:  string   // ISO timestamp — when this payload was assembled

  philosophy:   OperatingPartnerPhilosophyInputs
  operations:   OperatingPartnerOperationalInputs

  /** Days of history that contributed to both layers. */
  dataWindowDays: number

  /**
   * 0–100. Higher = more data available with reliable confidence.
   * Computed by buildOperatingPartnerInputs().
   *
   * Suggested thresholds:
   *   80–100: Full brief — all domains available, confidence reliable
   *   50–79:  Partial brief — some domains missing; flag gaps
   *   20–49:  Minimal brief — major domains absent; brief is speculative
   *   0–19:   Cannot brief — insufficient data to produce any recommendation
   */
  inputCompletenessScore: number

  /**
   * List of data domains that are critical and currently missing.
   * When non-empty, the Operating Partner must hedge all outputs
   * and surface these gaps to the director.
   */
  missingCriticalInputs: string[]
}
