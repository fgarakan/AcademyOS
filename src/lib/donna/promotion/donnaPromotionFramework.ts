// Mega Sprint 1445–1474 — DONNA Evidence-Based Promotion Engine V1
// Core promotion types: PromotionStatus, PromotionDecision, PromotionEvidenceItem, PromotionConfidence.
// Shared by all promotion engines.
// Pure TypeScript — no DB, no React, no side effects.

// ── Status ────────────────────────────────────────────────────────────────────

export type PromotionStatus =
  | 'READY'            // Advancement-eligible flag + assessment-backed
  | 'REVIEW_REQUIRED'  // Advancement-eligible but no corroborating assessment
  | 'NOT_READY'        // Recent evidence present but criteria not met
  | 'MISSING_EVIDENCE' // Cannot evaluate — key evidence absent or stale (>90 days)
  | 'BLOCKED'          // Heuristic stall: long-duration non-eligibility + repeated failed assessments

export type PromotionConfidence = 'high' | 'medium' | 'low'

// ── Evidence item ─────────────────────────────────────────────────────────────

export interface PromotionEvidenceItem {
  source:     string   // 'advancement_eligible_flag' | 'assessment' | 'enrollment_duration' | etc.
  claim:      string   // human-readable signal
  strength:   'supports' | 'contradicts' | 'neutral'
  confidence: PromotionConfidence
}

// ── Decision ──────────────────────────────────────────────────────────────────

export interface PromotionDecision {
  status:             PromotionStatus
  confidence:         PromotionConfidence
  reason:             string            // one-line DONNA answer
  detail:             string            // full markdown explanation
  evidence:           PromotionEvidenceItem[]
  contradictions:     string[]          // signals contradicting promotion
  missingEvidence:    string[]          // gaps DONNA cannot evaluate from current context
  recommendedActions: string[]          // what director should do next
  dataQualityNote:    string | null     // honest disclosure of data limitations
}
