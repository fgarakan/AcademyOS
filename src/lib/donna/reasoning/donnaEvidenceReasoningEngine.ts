// Mega Sprint 1235–1264 — DONNA Evidence & Reasoning Engine V1
//
// Canonical evidence-backed recommendation model for DONNA.
// Composes existing engines — never replaces them:
//   donnaReasoningEngine     → ReasoningBlock (why / whyNow / riskReduced / whatItUnlocks)
//   donnaConfidence          → ConfidenceResult (data availability + label + isAnswerable)
//   donnaCOOIntelligenceEngine → COOInsight adapter (evidence: string[] → EvidenceItem[])
//   dailyBriefingEngine      → BriefingItem adapter
//
// Every EvidencedRecommendation answers all 9 follow-up question types
// without an LLM call — answers are built deterministically from input fields.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same input → same output.
//   - No invented data — claims derived from provided evidence or flagged 'inferred'.
//   - Never rewrites donnaReasoningEngine.ts or any COO engine.

import type { ReasoningBlock } from '@/lib/donna/reasoning/donnaReasoningEngine'
import type { ConfidenceResult } from '@/lib/donna/donnaConfidence'
import type {
  COOInsight,
  COOCategory,
  COOConfidence,
} from '@/lib/donna/coo/donnaCOOIntelligenceEngine'
import type {
  BriefingItem,
  BriefingCategory,
} from '@/lib/donna/briefing/dailyBriefingEngine'

// ── Evidence categories (8) ───────────────────────────────────────────────────

export type EvidenceCategory =
  | 'assessment'    // assessment scores, reassessment changes
  | 'observation'   // coach notes, behavioral flags
  | 'attendance'    // session attendance records
  | 'curriculum'    // curriculum gaps, level gate status
  | 'approval'      // pending approvals, review queue
  | 'session'       // session data, wrap-up completion
  | 'placement'     // placement decisions, level assignments
  | 'parent'        // parent communications, update cadence

// ── Evidence item ─────────────────────────────────────────────────────────────

export interface EvidenceItem {
  /** Which data category this evidence comes from */
  category: EvidenceCategory
  /** The specific claim this evidence makes */
  claim: string
  /** Original text preserved from the source (COOInsight.evidence or BriefingItem.evidence) */
  sourceText: string
  /** How strongly this evidence supports the recommendation */
  strength: 'strong' | 'moderate' | 'weak' | 'inferred'
  /** Whether live academy data backs this (false = inferred from structure only) */
  dataAvailable: boolean
}

// ── Follow-up question types (9) ─────────────────────────────────────────────

export type FollowUpQuestionType =
  | 'why'             // Why does this matter?
  | 'how_confident'   // How confident are you?
  | 'what_evidence'   // How do you know? / What evidence?
  | 'what_if_ignore'  // What if I ignore this?
  | 'alternatives'    // What are the alternatives?
  | 'risks'           // What are the risks?
  | 'assumptions'     // What are you assuming?
  | 'missing'         // What data is missing?
  | 'tell_me_more'    // Tell me more / elaborate

// ── COO question categories (8) ──────────────────────────────────────────────

export type COOQuestionCategory =
  | 'attention_today'    // What needs my attention today?
  | 'player_health'      // How are my players doing?
  | 'coach_health'       // How are my coaches doing?
  | 'curriculum_gaps'    // What curriculum gaps exist?
  | 'parent_confidence'  // How are parents feeling?
  | 'priority_action'    // What should I do first?
  | 'academy_health'     // How healthy is the academy?
  | 'risk_assessment'    // What's the risk if I ignore X?

// ── Canonical recommendation (9 fields) ─────────────────────────────────────

export interface EvidencedRecommendation {
  /** 1. The recommendation text */
  recommendation: string
  /** 2. Typed evidence items backing the recommendation */
  evidence: EvidenceItem[]
  /** 3. Data confidence (from donnaConfidence ConfidenceResult) */
  confidence: ConfidenceResult
  /** 4. Assumptions DONNA is making to reach this conclusion */
  assumptions: string[]
  /** 5. Alternative actions the director could take */
  alternatives: string[]
  /** 6. What happens if this is not acted on */
  riskIfIgnored: string
  /** 7. Data gaps that would improve confidence in this recommendation */
  missingInfo: string[]
  /** 8. Specific next action */
  nextAction: string
  /** 9. Pre-computed answers for all 9 follow-up question types */
  followUpAnswers: Record<FollowUpQuestionType, string>
  /** Which of the 8 COO question categories this addresses */
  category: COOQuestionCategory
  generatedAt: string
}

// ── Builder input ─────────────────────────────────────────────────────────────

export interface EvidencedRecommendationInput {
  recommendation: string
  evidence: EvidenceItem[]
  confidence: ConfidenceResult
  assumptions?: string[]
  alternatives?: string[]
  riskIfIgnored?: string
  missingInfo?: string[]
  nextAction?: string
  category?: COOQuestionCategory
  /** Optional: ReasoningBlock from donnaReasoningEngine to enrich why/risk answers */
  reasoningBlock?: ReasoningBlock | null
}

// ── Per-category default assumptions ─────────────────────────────────────────

const CATEGORY_ASSUMPTIONS: Record<COOQuestionCategory, string[]> = {
  attention_today: [
    'Coach wrap-ups are being submitted consistently.',
    'Attendance data is current as of the last session.',
    'Review queue visibility is based on your current role.',
  ],
  player_health: [
    'Assessment data reflects recent performance.',
    'Stall detection uses a 30-day rolling window.',
    'Players without recent assessments are flagged as low-confidence.',
  ],
  coach_health: [
    'Wrap-up completion rate is the primary proxy for coach engagement.',
    'Session data is attributed to the coach of record.',
  ],
  curriculum_gaps: [
    'Gaps are identified against the published curriculum structure.',
    'Academy-specific overrides are factored in where applied.',
  ],
  parent_confidence: [
    'Parent update cadence is measured over the last 30 days.',
    'Portal access is used as a proxy for parent engagement.',
  ],
  priority_action: [
    'Priority is derived from pending review count, risk flags, and data freshness.',
    'Actions are ranked by expected director time-to-impact.',
  ],
  academy_health: [
    'Health score combines attendance rate, session completion, and assessment coverage.',
    'Partial data sources contribute proportionally to the score.',
  ],
  risk_assessment: [
    'Risk is assessed against the last known state — not real-time.',
    'Risk flags are advisory: director judgment is required before acting.',
  ],
}

// ── Per-category default alternatives ────────────────────────────────────────

const CATEGORY_ALTERNATIVES: Record<COOQuestionCategory, string[]> = {
  attention_today: [
    'Open the Review Queue and clear approvals before anything else.',
    'Check the daily brief for a full summary before acting on individual items.',
  ],
  player_health: [
    'Request an assessment for players with insufficient data before making decisions.',
    'Assign a follow-up task to the coach for low-confidence players.',
  ],
  coach_health: [
    'Review session logs manually for coaches with missing wrap-ups.',
    'Schedule a direct check-in before the next session cycle.',
  ],
  curriculum_gaps: [
    'Use the Curriculum Builder to draft missing items via DONNA.',
    'Review the global curriculum first to confirm what already exists.',
  ],
  parent_confidence: [
    'Draft parent updates via DONNA for director approval.',
    'Prioritize players with no parent contact in the last 30 days.',
  ],
  priority_action: [
    'Start with the Review Queue if the approval backlog is the largest item.',
    'Delegate session reviews to the head coach to free up strategic decision time.',
  ],
  academy_health: [
    'Review individual category scores to identify the weakest signal area.',
    'Focus on the area with the largest gap between current and target state.',
  ],
  risk_assessment: [
    'Accept the risk and set a review checkpoint for the next session cycle.',
    'Escalate to the head coach for on-ground verification before deciding.',
  ],
}

// ── Per-category default risk-if-ignored ─────────────────────────────────────

const CATEGORY_RISK_DEFAULTS: Record<COOQuestionCategory, string> = {
  attention_today:   'Pending items will age, reducing their accuracy and making follow-up harder.',
  player_health:     'Development issues that are not caught early tend to compound over weeks.',
  coach_health:      'Missed wrap-ups create data gaps that affect DONNA\'s ability to flag issues.',
  curriculum_gaps:   'Curriculum gaps leave coaches without a shared reference, leading to inconsistent sessions.',
  parent_confidence: 'Parents without recent updates are more likely to disengage or raise concerns directly.',
  priority_action:   'The highest-leverage window may close — other priorities will crowd it out.',
  academy_health:    'Health signal deterioration is easier to reverse early than after it compounds.',
  risk_assessment:   'Unacknowledged risks tend to surface at the worst possible moment.',
}

// ── Follow-up answer builder ──────────────────────────────────────────────────

function buildFollowUpAnswers(
  recommendation: string,
  evidence: EvidenceItem[],
  confidence: ConfidenceResult,
  assumptions: string[],
  alternatives: string[],
  riskIfIgnored: string,
  missingInfo: string[],
  nextAction: string,
  reasoningBlock: ReasoningBlock | null | undefined,
): Record<FollowUpQuestionType, string> {

  const why: string = reasoningBlock
    ? `${reasoningBlock.why} ${reasoningBlock.whyNow}`
    : `This needs attention because it directly affects academy operations. ${riskIfIgnored}`

  const how_confident: string = (() => {
    let text = `My confidence is ${confidence.label.toLowerCase()}.`
    if (confidence.detail) text += ` ${confidence.detail}`
    if (missingInfo.length > 0) {
      text += ` More data would help: ${missingInfo.slice(0, 2).join('; ')}.`
    }
    return text
  })()

  const what_evidence: string = (() => {
    const available = evidence.filter(e => e.dataAvailable)
    const inferred  = evidence.filter(e => !e.dataAvailable)
    const parts: string[] = []
    if (available.length > 0) {
      parts.push(`Live data: ${available.map(e => e.claim).slice(0, 3).join('; ')}.`)
    }
    if (inferred.length > 0) {
      parts.push(`Inferred from structure: ${inferred.map(e => e.claim).slice(0, 2).join('; ')}.`)
    }
    return parts.length > 0
      ? `Here's what I'm basing this on: ${parts.join(' ')}`
      : "I'm working from the current state of the academy data. No specific evidence points are available at this level of detail."
  })()

  const what_if_ignore: string = (() => {
    let text = `If this is not acted on: ${riskIfIgnored}`
    if (reasoningBlock) text += ` What it would have unlocked: ${reasoningBlock.whatItUnlocks}.`
    return text
  })()

  const alternativesAnswer: string = alternatives.length > 0
    ? `Other options you could take: ${alternatives.join(' Or: ')}`
    : 'There are no clear alternative paths with the same outcome — this is the most direct route.'

  const risks: string = (() => {
    const parts = [riskIfIgnored]
    if (reasoningBlock) parts.push(`Risk reduced by acting: ${reasoningBlock.riskReduced}.`)
    const weakSignals = evidence
      .filter(e => e.strength === 'weak' || e.strength === 'inferred')
      .map(e => `${e.claim} (${e.strength} signal)`)
      .slice(0, 2)
    if (weakSignals.length > 0) {
      parts.push(`Weak signals to watch: ${weakSignals.join('; ')}.`)
    }
    return parts.join(' ')
  })()

  const assumptionsAnswer: string = assumptions.length > 0
    ? `I'm assuming: ${assumptions.join(' And: ')}`
    : 'No major assumptions beyond standard data freshness and role-based access.'

  const missing: string = missingInfo.length > 0
    ? `Data that would sharpen this recommendation: ${missingInfo.join('; ')}.`
    : 'No critical data gaps identified — this recommendation is based on available live data.'

  const tell_me_more: string = [
    recommendation,
    '',
    reasoningBlock ? `Why it matters: ${reasoningBlock.why}` : null,
    evidence.length > 0
      ? `Evidence: ${evidence.slice(0, 3).map(e => e.claim).join('; ')}.`
      : null,
    `Confidence: ${confidence.label}.`,
    missingInfo.length > 0 ? `Data gaps: ${missingInfo.slice(0, 2).join('; ')}.` : null,
    `Next step: ${nextAction}`,
  ].filter(Boolean).join('\n')

  return {
    why,
    how_confident,
    what_evidence,
    what_if_ignore,
    alternatives:  alternativesAnswer,
    risks,
    assumptions:   assumptionsAnswer,
    missing,
    tell_me_more,
  }
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build a canonical EvidencedRecommendation from raw inputs.
 * Per-category defaults are applied for any field not explicitly provided.
 */
export function buildEvidencedRecommendation(
  input: EvidencedRecommendationInput,
): EvidencedRecommendation {
  const category    = input.category    ?? 'attention_today'
  const assumptions  = input.assumptions  ?? CATEGORY_ASSUMPTIONS[category]
  const alternatives = input.alternatives ?? CATEGORY_ALTERNATIVES[category]
  const riskIfIgnored = input.riskIfIgnored ?? CATEGORY_RISK_DEFAULTS[category]
  const missingInfo  = input.missingInfo  ?? []
  const nextAction   = input.nextAction   ?? 'Review this in the director dashboard.'

  const followUpAnswers = buildFollowUpAnswers(
    input.recommendation,
    input.evidence,
    input.confidence,
    assumptions,
    alternatives,
    riskIfIgnored,
    missingInfo,
    nextAction,
    input.reasoningBlock,
  )

  return {
    recommendation: input.recommendation,
    evidence:        input.evidence,
    confidence:      input.confidence,
    assumptions,
    alternatives,
    riskIfIgnored,
    missingInfo,
    nextAction,
    followUpAnswers,
    category,
    generatedAt:     new Date().toISOString(),
  }
}

// ── Follow-up question detection ──────────────────────────────────────────────

const FOLLOW_UP_PATTERNS: Array<{ type: FollowUpQuestionType; patterns: RegExp[] }> = [
  {
    type: 'why',
    patterns: [
      /^why$/,
      /^why (is that|does that matter|is this important|do you (say|think|recommend) that)/,
      /^why (is this|is it) (important|urgent|critical|a priority)/,
      /^why should i (care|act|do this)/,
    ],
  },
  {
    type: 'how_confident',
    patterns: [
      /^how (confident|sure) (are you|is that|is this)/,
      /^what('?s| is) (your |the )?confidence( level)?/,
      /^confidence (level|score|rating)/,
      /^how (reliable|accurate) is (that|this)/,
    ],
  },
  {
    type: 'what_evidence',
    patterns: [
      /^how do you know/,
      /^what('?s| is) (the )?(data|evidence|proof|basis)/,
      /^based on what/,
      /^where (did you get|does) (that|this) (come from|data)/,
      /^what (data|signals?) (support|back|show) (that|this)/,
      /^what evidence (do you have|is there|supports that)/,
    ],
  },
  {
    type: 'what_if_ignore',
    patterns: [
      /^what if i (ignore|skip|don'?t|do not) (that|this|act)/,
      /^what happens if i (don'?t|do not|ignore|skip)/,
      /^if i (ignore|skip|don'?t|do not) (that|this)/,
      /^what('?s| is) the (cost|consequence|impact) of (not acting|ignoring|skipping)/,
    ],
  },
  {
    type: 'alternatives',
    patterns: [
      /^(what are the |any )?alternatives?$/,
      /^other (options|choices|approaches|paths)/,
      /^what else (can|could|should) i (do|try)/,
      /^is there another (way|option|approach)/,
      /^what are my options/,
    ],
  },
  {
    type: 'risks',
    patterns: [
      /^what are the risks?$/,
      /^what('?s| is) the risk/,
      /^risks? (of|with|here|involved)/,
      /^what could go wrong/,
    ],
  },
  {
    type: 'assumptions',
    patterns: [
      /^what (are you |are the )?assumptions?$/,
      /^what are you assuming/,
      /^assuming what/,
      /^what are your assumptions/,
    ],
  },
  {
    type: 'missing',
    patterns: [
      /^what('?s| is) missing/,
      /^what (data|information|signals?) (are|is) (missing|unavailable|needed)/,
      /^(data |information )?gaps?$/,
      /^what would (help|improve) (this|your confidence)/,
      /^what data (is |are )?(missing|needed)/,
    ],
  },
  {
    type: 'tell_me_more',
    patterns: [
      /^tell me more/,
      /^(more |tell me )?more about that/,
      /^(can you )?(elaborate|explain|expand)/,
      /^expand on that/,
      /^(more |full |give me the )?detail/,
    ],
  },
]

function normalizeFollowUp(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/, '')
    .replace(/^(please |can you |could you )/, '')
    .replace(/( please)$/, '')
    .trim()
}

/**
 * Detect if text is one of the 9 evidence follow-up question types.
 * Returns the matched type, or null if not recognized.
 * Guards against false positives on long inputs (> 14 words).
 */
export function detectEvidenceFollowUpType(text: string): FollowUpQuestionType | null {
  if (!text.trim()) return null
  const lower = normalizeFollowUp(text)
  if (lower.split(/\s+/).length > 14) return null

  for (const { type, patterns } of FOLLOW_UP_PATTERNS) {
    if (patterns.some(p => p.test(lower))) return type
  }
  return null
}

/**
 * Resolve an evidence follow-up question against an EvidencedRecommendation.
 * Returns the pre-computed answer string, or null if not a recognized follow-up.
 *
 * Never reads DB. Never calls APIs. Never mutates state.
 */
export function resolveEvidenceFollowUp(
  text: string,
  rec: EvidencedRecommendation | null,
): string | null {
  if (!rec) return null
  const type = detectEvidenceFollowUpType(text)
  if (!type) return null
  return rec.followUpAnswers[type]
}

// ── Category inference helpers ────────────────────────────────────────────────

function cooInsightCategoryToQuestionCategory(category: COOCategory): COOQuestionCategory {
  switch (category) {
    case 'program_health':      return 'academy_health'
    case 'player_intelligence': return 'player_health'
    case 'coach_intelligence':  return 'coach_health'
    case 'parent_confidence':   return 'parent_confidence'
    case 'director_decision':   return 'priority_action'
    default:                    return 'attention_today'
  }
}

function inferEvidenceCategoryFromCOO(
  cooCategory: COOCategory,
  claimText: string,
): EvidenceCategory {
  const t = claimText.toLowerCase()
  if (t.includes('assessment'))                                         return 'assessment'
  if (t.includes('attendance') || t.includes('absent'))                return 'attendance'
  if (t.includes('curriculum') || t.includes('level gate') || t.includes('gap')) return 'curriculum'
  if (t.includes('approval') || t.includes('review queue') || t.includes('pending')) return 'approval'
  if (t.includes('wrap') || t.includes('session'))                     return 'session'
  if (t.includes('placement') || t.includes('promoted') || t.includes('level')) return 'placement'
  if (t.includes('parent'))                                            return 'parent'
  if (cooCategory === 'coach_intelligence')                            return 'session'
  if (cooCategory === 'parent_confidence')                             return 'parent'
  return 'observation'
}

function briefingCategoryToEvidenceCategory(bc: BriefingCategory): EvidenceCategory {
  switch (bc) {
    case 'assessments':    return 'assessment'
    case 'coaches':        return 'session'
    case 'curriculum':     return 'curriculum'
    case 'approvals':      return 'approval'
    case 'operations':     return 'attendance'
    case 'players':        return 'observation'
    case 'academy_health': return 'observation'
    default:               return 'observation'
  }
}

function cooConfidenceToConfidenceResult(confidence: COOConfidence): ConfidenceResult {
  switch (confidence) {
    case 'high':
      return {
        confidence: 'high',
        reason: 'all_live',
        label: 'Live data',
        detail: null,
        isAnswerable: true,
      }
    case 'medium':
      return {
        confidence: 'partial',
        reason: 'some_partial',
        label: 'Partial data',
        detail: 'Some data sources are not fully populated.',
        isAnswerable: true,
      }
    case 'low':
      return {
        confidence: 'insufficient',
        reason: 'no_data_yet',
        label: 'No data yet',
        detail: 'Insufficient data to make a high-confidence recommendation.',
        isAnswerable: false,
      }
  }
}

// ── COOInsight adapter ─────────────────────────────────────────────────────────

/**
 * Adapt a COOInsight (from donnaCOOIntelligenceEngine) into an EvidencedRecommendation.
 *
 * evidence: string[] → EvidenceItem[] with category inferred from text content.
 * missingData?: string[] → missingInfo.
 * Original evidence strings are preserved in EvidenceItem.sourceText.
 */
export function adaptCOOInsightToEvidence(insight: COOInsight): EvidencedRecommendation {
  const questionCategory = cooInsightCategoryToQuestionCategory(insight.category)
  const confidenceResult = cooConfidenceToConfidenceResult(insight.confidence)

  const evidenceItems: EvidenceItem[] = insight.evidence.map(text => ({
    category:      inferEvidenceCategoryFromCOO(insight.category, text),
    claim:         text,
    sourceText:    text,
    strength:      insight.confidence === 'high' ? 'strong'
                 : insight.confidence === 'medium' ? 'moderate'
                 : 'weak',
    dataAvailable: insight.confidence !== 'low',
  }))

  return buildEvidencedRecommendation({
    recommendation: `${insight.title}: ${insight.finding}`,
    evidence:        evidenceItems,
    confidence:      confidenceResult,
    missingInfo:     insight.missingData ?? [],
    nextAction:      insight.recommendedAction,
    category:        questionCategory,
  })
}

// ── BriefingItem adapter ───────────────────────────────────────────────────────

/**
 * Adapt a BriefingItem (from dailyBriefingEngine) into an EvidencedRecommendation.
 *
 * Uses item.evidence (string) as the primary evidence claim.
 * Urgency maps to evidence strength: critical/high → strong, medium → moderate, info → weak.
 */
export function adaptBriefingItemToEvidence(item: BriefingItem): EvidencedRecommendation {
  const evidenceCategory = briefingCategoryToEvidenceCategory(item.category)
  const strength: EvidenceItem['strength'] =
    item.urgency === 'critical' || item.urgency === 'high' ? 'strong'
    : item.urgency === 'medium' ? 'moderate'
    : 'weak'

  const evidenceItems: EvidenceItem[] = [{
    category:      evidenceCategory,
    claim:         item.evidence,
    sourceText:    item.evidence,
    strength,
    dataAvailable: true,
  }]

  const categoryMap: Partial<Record<BriefingCategory, COOQuestionCategory>> = {
    players:       'player_health',
    coaches:       'coach_health',
    curriculum:    'curriculum_gaps',
    assessments:   'player_health',
    approvals:     'attention_today',
    operations:    'attention_today',
    academy_health: 'academy_health',
  }
  const questionCategory: COOQuestionCategory = categoryMap[item.category] ?? 'attention_today'

  const confidenceResult: ConfidenceResult = {
    confidence:   'high',
    reason:       'all_live',
    label:        'Live data',
    detail:       null,
    isAnswerable: true,
  }

  const riskIfIgnored =
    item.urgency === 'critical'
      ? 'This is critical — delaying will have direct operational impact.'
      : item.urgency === 'high'
      ? 'This is high priority — delaying increases the risk of it becoming critical.'
      : CATEGORY_RISK_DEFAULTS[questionCategory]

  return buildEvidencedRecommendation({
    recommendation: `${item.headline}: ${item.issue}`,
    evidence:        evidenceItems,
    confidence:      confidenceResult,
    riskIfIgnored,
    nextAction:      item.suggestedAction,
    category:        questionCategory,
  })
}
