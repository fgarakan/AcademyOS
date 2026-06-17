// Mega Sprint 3001–3030 — DONNA Strategic AI Augmentation V1
// Part 2 — Strategic Domain Detector
//
// Determines whether a message in the strategic confidence zone (0.35–0.72)
// is a candidate for OpenAI-powered strategic reasoning (strategic_ai_assist).
//
// Separate from donnaBrainConfidenceEvaluator (Sprint 2971–3000) which handles
// zero-signal fallback (live_ai_assist). This module handles partial-signal
// strategic questions where DONNA knows the domain but needs deeper reasoning.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Conservative: requires BOTH a domain signal AND a strategic modifier match.
//   - Does not trigger for navigation requests, data queries, or approval flows.
//   - Only fires for messages that are asking for strategy, planning, diagnosis,
//     recommendations, or analysis — not for simple operational lookups.

// ── Domain types ──────────────────────────────────────────────────────────────

export type StrategicAIDomain =
  | 'academy_strategy'
  | 'curriculum_design'
  | 'retention_analysis'
  | 'summer_camp_planning'
  | 'staffing_decisions'
  | 'player_development_reasoning'
  | 'parent_communication_strategy'
  | 'coach_performance_analysis'
  | 'program_growth'
  | 'academy_operations'
  | 'academy_health_analysis'

export interface StrategicAIEligibility {
  eligible: boolean
  domain: StrategicAIDomain | null
  confidence: number
  reason: string
}

export interface StrategicContext {
  strategicDomain: StrategicAIDomain
  detectedGoal: string | null
  detectedIntent: string | null
  confidence: number
  reason: string
}

// ── Confidence zone ───────────────────────────────────────────────────────────

const STRATEGIC_CONFIDENCE_MIN = 0.35
const STRATEGIC_CONFIDENCE_MAX = 0.72

// ── Disqualifiers — must not trigger strategic AI ─────────────────────────────

// Navigation-only requests — already handled by Step 14 routing.
const NAVIGATION_PATTERNS = [
  /\b(take me to|go to|navigate to|open the|where is|where can i find)\b/i,
]

// Pure data queries — COO chain and entity Q&A handle retrieval.
const DATA_QUERY_PATTERNS = [
  /\b(show me|list|who is|who are|how many|how much|what is the total|count|number of)\b/i,
  /\b(pull up|get me|find me)\b/i,
]

// Approval and action requests — must go through the proposed_actions pipeline.
const ACTION_REQUEST_PATTERNS = [
  /\b(approve|reject|move|delete|create|schedule|send|make|start)\b/i,
  /\b(let'?s do|we should do|can you|could you|please do|i need you to)\b/i,
]

// ── Domain signal definitions ─────────────────────────────────────────────────

interface DomainSignals {
  domain: StrategicAIDomain
  signals: RegExp[]
  strategicModifiers: RegExp[]
}

const DOMAIN_DEFINITIONS: DomainSignals[] = [
  {
    domain: 'retention_analysis',
    signals: [
      /\b(famil(?:y|ies)|leaving|churn|dropout|quit(?:ting)?|retention)\b/i,
      /\bwhy (are|do|would|did) (famil(?:y|ies)|parents|players|kids|families)\b/i,
      /\b(at.?risk|drop.?off|disengag(?:ed|ing)|losing families|losing players)\b/i,
    ],
    strategicModifiers: [
      /\b(why|reason(?:s)?|cause|signal|trend|pattern|analysis|diagnos(?:e|is)|understand|behind)\b/i,
    ],
  },
  {
    domain: 'curriculum_design',
    signals: [
      /\b(curriculum|program design|level design|redesign)\b/i,
      /\b(what should .{0,20} (curriculum|program|level) look like)\b/i,
      /\b(curriculum approach|teaching approach|how should we (teach|structure|design|build))\b/i,
    ],
    strategicModifiers: [
      /\b(design|redesign|look like|approach|philosophy|improve|strategy|should|how|structure|build)\b/i,
    ],
  },
  {
    domain: 'summer_camp_planning',
    signals: [
      /\b(summer camp|summer program|summer session)\b/i,
      /\b(camp (planning|design|structure|format|approach|redesign))\b/i,
      /\b(how should we (run|design|structure|plan|redesign) .{0,10}(summer|camp))\b/i,
      /\b(redesign|restructure|plan) .{0,10}summer\b/i,
    ],
    strategicModifiers: [
      /\b(plan(?:ning)?|design|structure|format|should|how|approach|run|build|redesign)\b/i,
    ],
  },
  {
    domain: 'staffing_decisions',
    signals: [
      /\b(staffing|coach (ratio|assignment|scheduling|structure|allocation|coverage))\b/i,
      /\b(should we (change|adjust|add|hire|move) .{0,15} (coach|staff))\b/i,
      /\b(how many coaches|coach coverage|staff for|coach load)\b/i,
    ],
    strategicModifiers: [
      /\b(should|how|change|adjust|restructure|decision|approach|staffing|staff)\b/i,
    ],
  },
  {
    domain: 'player_development_reasoning',
    signals: [
      /\b(player development|development (approach|philosophy|strategy|plan|model))\b/i,
      /\b(how should (we|i) develop|development reasoning|long.?term (development|plan|path))\b/i,
    ],
    strategicModifiers: [
      /\b(should|how|approach|philosophy|strategy|reason|think|long.?term|model|framework)\b/i,
    ],
  },
  {
    domain: 'parent_communication_strategy',
    signals: [
      /\b(parent (communication|strategy|approach|engagement|relation(?:ship)?))\b/i,
      /\b(how should (we|i) (communicate|talk|update) (with|to) parents)\b/i,
      /\b(parent (trust|confidence|satisfaction|experience|journey))\b/i,
    ],
    strategicModifiers: [
      /\b(strategy|approach|should|how|improve|build|manage|strengthen)\b/i,
    ],
  },
  {
    domain: 'coach_performance_analysis',
    signals: [
      /\b(coach performance|how (is|are) (my|our|the) coach(?:es)?)\b/i,
      /\b(coach (effectiveness|quality|improvement|development|feedback|assessment))\b/i,
      /\b(which coach(?:es)? (is|are) (performing|doing|struggling|strongest|weakest|best|worst))\b/i,
    ],
    strategicModifiers: [
      /\b(performance|analysis|how|quality|effectiveness|measure|evaluate|assess|improve)\b/i,
    ],
  },
  {
    domain: 'program_growth',
    signals: [
      /\b(grow(?:th|ing)?|expand(?:ing)?|scale|new (players|families|groups|programs|members))\b/i,
      /\b(how (do|can|should) (we|i) grow|how to attract|enrollment growth|grow the academy)\b/i,
    ],
    strategicModifiers: [
      /\b(how|strategy|plan|approach|should|could|attract|market|expand|grow)\b/i,
    ],
  },
  {
    domain: 'academy_operations',
    signals: [
      /\b(operations?|how should (we|the academy) (operate|run|manage))\b/i,
      /\b(academy (structure|organization|management|efficiency|workflow|process(?:es)?))\b/i,
      /\b(how (should|do) (we|the academy) handle|operational (efficiency|improvement))\b/i,
    ],
    strategicModifiers: [
      /\b(how|should|structure|manage|improve|run|operate|efficiency|streamline)\b/i,
    ],
  },
  {
    domain: 'academy_strategy',
    signals: [
      /\b(academy strategy|strategic (plan|direction|vision|priority|focus))\b/i,
      /\b(where (should|do) (we|the academy) (focus|go|head|prioritize|invest))\b/i,
      /\b(what (should|is) our (strategy|direction|priority|focus|goal|vision))\b/i,
      /\b(big picture|overall direction|academy vision|long.?term (strategy|plan|goal))\b/i,
    ],
    strategicModifiers: [
      /\b(strategy|direction|focus|priority|should|overall|big picture|vision|plan)\b/i,
    ],
  },
  {
    domain: 'academy_health_analysis',
    signals: [
      /\b(how (is|are) (the academy|things?|we) (doing|going|performing|looking))\b/i,
      /\b(academy health|overall health|health (of|of the) (academy|program))\b/i,
      /\b(how healthy (is|are)|is the academy healthy|overall status)\b/i,
    ],
    strategicModifiers: [
      /\b(health|doing|going|performing|overall|analysis|assess|evaluate|status)\b/i,
    ],
  },
]

// ── Evaluator ─────────────────────────────────────────────────────────────────

/**
 * Evaluate whether a message in the strategic confidence zone should route
 * to strategic_ai_assist rather than the deterministic Steps 14/15.
 *
 * Called from Step 13.5 in processDonnaMessage after high-confidence deterministic
 * routing (Step 13) has been checked.
 *
 * Requires BOTH:
 *   1. goalConfidence in the strategic zone (0.35–0.72)
 *   2. At least one domain signal AND one strategic modifier in the message
 */
export function evaluateStrategicAIEligibility(
  message: string,
  goalConfidence: number,
): StrategicAIEligibility {
  const lower = message.toLowerCase().trim()

  // Gate 1: Confidence zone
  if (goalConfidence < STRATEGIC_CONFIDENCE_MIN || goalConfidence >= STRATEGIC_CONFIDENCE_MAX) {
    return {
      eligible: false,
      domain: null,
      confidence: goalConfidence,
      reason: `Confidence ${goalConfidence.toFixed(2)} outside strategic zone (${STRATEGIC_CONFIDENCE_MIN}–${STRATEGIC_CONFIDENCE_MAX})`,
    }
  }

  // Gate 2: Navigation request — Step 14 handles these deterministically
  for (const pattern of NAVIGATION_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        eligible: false,
        domain: null,
        confidence: goalConfidence,
        reason: 'Navigation request — Step 14 handles this',
      }
    }
  }

  // Gate 3: Data query — COO chain + entity Q&A handle data retrieval
  for (const pattern of DATA_QUERY_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        eligible: false,
        domain: null,
        confidence: goalConfidence,
        reason: 'Data query — COO chain handles retrieval',
      }
    }
  }

  // Gate 4: Action request — approval pipeline required
  for (const pattern of ACTION_REQUEST_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        eligible: false,
        domain: null,
        confidence: goalConfidence,
        reason: 'Action request — approval pipeline required',
      }
    }
  }

  // Domain matching — requires BOTH a signal AND a modifier (conservative filter)
  let bestMatch: { domain: StrategicAIDomain; score: number } | null = null

  for (const def of DOMAIN_DEFINITIONS) {
    let signalMatches = 0
    let modifierMatches = 0

    for (const pattern of def.signals) {
      if (pattern.test(lower)) signalMatches++
    }
    for (const pattern of def.strategicModifiers) {
      if (pattern.test(lower)) modifierMatches++
    }

    // Both signal AND modifier required — prevents false positives from incidental keyword matches
    if (signalMatches > 0 && modifierMatches > 0) {
      const score = signalMatches * 2 + modifierMatches
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { domain: def.domain, score }
      }
    }
  }

  if (!bestMatch) {
    return {
      eligible: false,
      domain: null,
      confidence: goalConfidence,
      reason: 'No strategic domain detected (requires both domain signal and strategic modifier)',
    }
  }

  return {
    eligible: true,
    domain: bestMatch.domain,
    confidence: goalConfidence,
    reason: `Strategic domain detected: ${bestMatch.domain} (score ${bestMatch.score})`,
  }
}
