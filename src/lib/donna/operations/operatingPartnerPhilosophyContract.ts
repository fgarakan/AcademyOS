// Sprint 1775A — DONNA Operating Partner Architecture Audit V1
// Philosophy Input Contract: the only philosophy-layer surface Sprint 1776–1805 may consume.
//
// BOUNDARY RULE: Sprint 1776–1805 must NOT import directly from the philosophy/ directory
// except via the buildOperatingPartnerPhilosophyInputs() builder in buildOperatingPartnerInputs.ts.
//
// Forbidden direct imports in Sprint 1776–1805:
//   ✗ PhilosophyMemoryEntry[]           — raw signals, use PreferenceInput instead
//   ✗ DecisionPatternRecord[]           — raw records, use DecisionPatternInput instead
//   ✗ EvolutionAnswer[]                 — 10 questions collapsed to 3-field synthesis
//   ✗ PreferenceSignal (full shape)     — filtered/normalised form only
//   ✗ AcademyEvolutionTimeline.phases[] — recent 90-day slice only
//   ✗ 'curriculum_expansion' signal     — noise; excluded from all OP inputs
//   ✗ direction === 'unknown'           — stripped; null passed instead
//   ✗ confidence 'low'|'insufficient'  — collapsed to 'provisional'

// ── Confidence: binary at the Operating Partner boundary ─────────────────────

export type OperatingPartnerConfidence =
  | 'reliable'    // philosophy layer: high | medium — sufficient to act on
  | 'provisional' // philosophy layer: low | insufficient — present but act with hedging

// ── Identity dimension input ──────────────────────────────────────────────────

export type IdentityDimensionKey =
  | 'technique_focus'
  | 'tactical_focus'
  | 'game_based_learning'
  | 'competition_emphasis'
  | 'assessment_rigor'
  | 'coach_autonomy'
  | 'parent_transparency'
  | 'long_term_development'
  | 'retention_focus'
  | 'player_wellbeing'

export type IdentityPrimarySource =
  | 'player_evidence'     // backed by real player development data — highest authority
  | 'behavior'            // backed by observed director decision patterns
  | 'stated_philosophy'   // from onboarding DNA only — not yet confirmed by decisions
  | 'default'             // no data; inference only — lowest authority

export interface IdentityDimensionInput {
  key:           IdentityDimensionKey
  label:         string
  finalScore:    number   // 0–100; hierarchy-weighted across all available sources
  primarySource: IdentityPrimarySource
  confidence:    OperatingPartnerConfidence
  driftWarning:  string | null  // non-null when stated vs. observed scores diverge ≥20 pts
}

export interface AcademyIdentityInput {
  dimensions:        IdentityDimensionInput[]   // always exactly 10
  overallConfidence: OperatingPartnerConfidence
  narrative:         string         // one-paragraph character statement
  dataLimitations:   string[]       // what the profile cannot currently see
}

// ── Drift input ───────────────────────────────────────────────────────────────
// First-class trigger for Operating Partner proactive action.
// driftSeverity=HIGH requires the Operating Partner to surface this to the director.

export interface DriftedDimensionSummary {
  dimension:    string   // e.g. 'Coach Autonomy'
  gap:          number   // 0–100; higher = more diverged between stated and observed
  description:  string   // human-readable drift summary, ready to display
}

export interface DriftInput {
  driftDetected:     boolean
  driftSeverity:     'LOW' | 'MEDIUM' | 'HIGH'
  confidence:        OperatingPartnerConfidence
  driftedDimensions: DriftedDimensionSummary[]  // top 2 only; empty when not detected
  donnaMessage:      string   // ready-to-display drift message for director
  suggestedAction:   string   // what to do about this drift
}

// ── Preference signals input ──────────────────────────────────────────────────
// Filtered from the full PreferenceSignal[]:
//   - confidence=insufficient signals excluded
//   - curriculum_expansion key excluded (not discriminative across academies)
//   - direction stripped when original is 'unknown' (passed as null here)
//   - top 3 positive (score ≥65) + top 3 avoidance (score ≤35) only

export type PreferenceDirectionInput = 'rising' | 'falling' | 'stable'

export interface PreferenceInput {
  label:           string                      // e.g. 'Game-Based Learning'
  score:           number                      // 0–100; >65 preferred, <35 avoided
  direction:       PreferenceDirectionInput | null  // null = insufficient history for trend
  confidence:      OperatingPartnerConfidence
  positiveSignals: number   // accepted decisions of this type
  negativeSignals: number   // removed or avoided decisions of this type
}

export interface AcademyPreferencesInput {
  topPreferences: PreferenceInput[]  // score ≥65; max 3; sorted desc by score
  topAvoidances:  PreferenceInput[]  // score ≤35; max 3; sorted asc by score
  // NOTE: curriculum_expansion is excluded from both lists — it fires on every
  // curriculum action and provides zero discrimination between academies.
}

// ── Decision pattern input ────────────────────────────────────────────────────
// Summarised form only. Raw DecisionPatternRecord[] is not exposed.
// High override rate is an execution signal, not a philosophy signal.

export interface DecisionPatternInput {
  totalDecisions:  number
  overrideCount:   number   // director_override entries — elevated = execution problem
  overrideRate:    number   // 0–1; overrides / total; > 0.4 = notable
  topContentTypes: Array<{
    contentType: string
    count:       number
  }>                        // top 3 most accepted content types
  dataLimitation:  string | null  // always present in V1: rejection history not tracked
}

// ── Evolution input ───────────────────────────────────────────────────────────
// Recent 90-day window only. Full phase history is internal to the philosophy layer.

export type EvolutionActivityLevel = 'high' | 'moderate' | 'low'

export interface RecentEvolutionPhaseInput {
  periodLabel:       string               // e.g. 'March 2026'
  activityLevel:     EvolutionActivityLevel
  dominantTheme:     string              // e.g. 'game_based_shift', 'structural_changes'
  curriculumAdded:   number
  curriculumRemoved: number
  playersAdvanced:   number
}

export interface AcademyEvolutionInput {
  recentPhases:    RecentEvolutionPhaseInput[]  // last 90 days only; may be empty
  overallTheme:    string          // dominant theme across all recorded history
  summaryLine:     string          // e.g. '3 active months — 8 items added'
  dataLimitations: string[]        // honest gaps in the timeline
}

// ── Reality override input ────────────────────────────────────────────────────
// Highest-priority signals — player evidence contradicting stated philosophy.
// NOTE: In V1, this array is typically empty because it requires populated
// improvementSuggestions from analyzeCurriculumImprovements().
// The Operating Partner must handle an empty array gracefully — never assume overrides exist.

export interface RealityOverrideInput {
  observedReality:        string   // what player evidence actually shows
  contradictedPhilosophy: string   // what stated philosophy claims
  evidenceStrength:       'STRONG' | 'MODERATE' | 'WEAK'
  recommendedAction:      string
}

// ── Combined philosophy inputs — the full contract ────────────────────────────

export interface OperatingPartnerPhilosophyInputs {
  identity:     AcademyIdentityInput
  drift:        DriftInput
  preferences:  AcademyPreferencesInput
  decisions:    DecisionPatternInput
  evolution:    AcademyEvolutionInput
  overrides:    RealityOverrideInput[]   // empty = no confirmed reality conflicts

  // Metadata
  generatedAt:    string   // ISO timestamp
  academyId:      string
  dataWindowDays: number   // how many days of history contributed
}
