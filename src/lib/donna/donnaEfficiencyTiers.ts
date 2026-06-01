// Sprint 1079/1084 — DONNA Efficiency Tiers + Classification V1
//
// Classifies each DONNA request into a cost/latency tier before routing.
// Pure TypeScript — no DB, no mutations, no side effects.
//
// Efficiency tiers (from cheapest to most expensive):
//   Tier 0 — Deterministic UI/action    (zero LLM, zero DB)
//   Tier 1 — Context-pack answer        (zero LLM, zero DB)
//   Tier 2 — Action-registry response   (zero LLM, zero DB)
//   Tier 3 — routeDonnaPrompt compose   (zero LLM, template-based)
//   Tier 4 — God Mode light             (LLM, minimal context, no tools)
//   Tier 5 — God Mode + one tool        (LLM + 1 DB retrieval)
//   Tier 6 — Deep Mode multi-tool       (LLM + multi-tool + full context)
//
// Usage (future wiring in handleDonnaCooPrompt):
//   const tier = classifyDonnaEfficiencyPath({ userInput: text, pathname, role })
//   appendAuditEvent({ type: 'efficiency_tier', tier: tier.tier, label: tier.label })

// ── Types ─────────────────────────────────────────────────────────────────────

export type DonnaEfficiencyTier = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface DonnaEfficiencyClassification {
  tier: DonnaEfficiencyTier
  label: string
  usesLlm: boolean
  usesDbQuery: boolean
  estimatedInputTokens: number    // rough estimate for cost modelling
  estimatedOutputTokens: number
  expectedLatencyMs: number       // order-of-magnitude expectation
  handlerPath: string             // which handler is expected to resolve this
  rationale: string               // why this tier was chosen
}

export interface DonnaEfficiencyInput {
  userInput: string
  pathname: string
  role?: string
  /** Whether a context-pack answer is available for this route (pass-through from caller) */
  hasContextPackAnswer?: boolean
  /** Whether an action-registry match was found */
  hasActionRegistryMatch?: boolean
  /** Number of prior turns in the current session */
  conversationTurnCount?: number
}

// ── Tier metadata ──────────────────────────────────────────────────────────────

export const DONNA_EFFICIENCY_TIERS: Record<DonnaEfficiencyTier, {
  label: string
  usesLlm: boolean
  usesDbQuery: boolean
  estimatedInputTokens: number
  estimatedOutputTokens: number
  expectedLatencyMs: number
}> = {
  0: {
    label: 'Deterministic UI/Action',
    usesLlm: false,
    usesDbQuery: false,
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0,
    expectedLatencyMs: 1,
  },
  1: {
    label: 'Context-Pack Answer',
    usesLlm: false,
    usesDbQuery: false,
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0,
    expectedLatencyMs: 5,
  },
  2: {
    label: 'Action-Registry Response',
    usesLlm: false,
    usesDbQuery: false,
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0,
    expectedLatencyMs: 5,
  },
  3: {
    label: 'Template-Composed Answer',
    usesLlm: false,
    usesDbQuery: false,
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0,
    expectedLatencyMs: 10,
  },
  4: {
    label: 'God Mode Light (LLM, no tools)',
    usesLlm: true,
    usesDbQuery: false,
    estimatedInputTokens: 700,
    estimatedOutputTokens: 150,
    expectedLatencyMs: 1500,
  },
  5: {
    label: 'God Mode + One Tool',
    usesLlm: true,
    usesDbQuery: true,
    estimatedInputTokens: 900,
    estimatedOutputTokens: 200,
    expectedLatencyMs: 2500,
  },
  6: {
    label: 'Deep Mode Multi-Tool',
    usesLlm: true,
    usesDbQuery: true,
    estimatedInputTokens: 1400,
    estimatedOutputTokens: 300,
    expectedLatencyMs: 4000,
  },
}

// ── Navigation pattern detector ────────────────────────────────────────────────

const NAV_PREFIXES = /^(open|go to|take me to|show me|navigate to|approvals?|players?|sessions?|curriculum|academy health|settings|coaches?|today|templates?)\b/i

function isNavigationCommand(input: string): boolean {
  const lower = input.toLowerCase().trim()
  if (lower.length > 60) return false  // long inputs are never pure nav
  return NAV_PREFIXES.test(lower)
}

// ── Complexity heuristics ──────────────────────────────────────────────────────

/**
 * Estimate whether a query likely requires multi-tool retrieval.
 * Signals: references to specific players, sessions, or multiple subjects.
 */
function likelyRequiresMultiTool(input: string): boolean {
  const lower = input.toLowerCase()
  const toolKeywords = [
    'player', 'session', 'curriculum', 'attendance', 'level', 'assessment',
    'coach', 'group', 'template', 'evidence', 'observation',
  ]
  const matchCount = toolKeywords.filter(k => lower.includes(k)).length
  return matchCount >= 2 || lower.length > 150
}

/**
 * Estimate whether a query likely needs a single DB tool call.
 * Signals: single-subject questions about live data.
 */
function likelyRequiresOneTool(input: string): boolean {
  const lower = input.toLowerCase()
  const liveDataKeywords = [
    'attendance', 'how many', 'pending', 'sessions today', 'last session',
    'player count', 'curriculum status', 'what happened', 'show me the',
  ]
  return liveDataKeywords.some(k => lower.includes(k))
}

// ── Main classifier ────────────────────────────────────────────────────────────

/**
 * Classify a DONNA input into an efficiency tier before routing.
 *
 * This is a pre-classification helper — the actual tier a request reaches
 * depends on which handler claims it. This function estimates the expected
 * tier based on detectable signals in the input.
 *
 * Not wired into runtime in Sprint 1084. Future: call from handleDonnaCooPrompt
 * or the orchestrator action to populate the efficiency trace.
 */
export function classifyDonnaEfficiencyPath(
  input: DonnaEfficiencyInput,
): DonnaEfficiencyClassification {
  const { userInput, pathname, hasContextPackAnswer, hasActionRegistryMatch, conversationTurnCount = 0 } = input
  const lower = userInput.toLowerCase().trim()

  // Tier 0 — Navigation is claimed by handleUIDispatch before anything else
  if (isNavigationCommand(userInput)) {
    return {
      tier: 0,
      ...DONNA_EFFICIENCY_TIERS[0],
      handlerPath: 'handleUIDispatch → dispatchUIIntent → navigation',
      rationale: 'Input matches navigation pattern. Resolved deterministically by the UI dispatcher.',
    }
  }

  // Tier 1 — Context-pack page-specific answer
  if (hasContextPackAnswer) {
    return {
      tier: 1,
      ...DONNA_EFFICIENCY_TIERS[1],
      handlerPath: 'handleDonnaCooPrompt → getDonnaContextPackForRoute → lookupAnswerInContextPack',
      rationale: 'Context pack has a matching exampleAnswer for this route and prompt.',
    }
  }

  // Tier 2 — Action-registry match (non-navigation)
  if (hasActionRegistryMatch) {
    return {
      tier: 2,
      ...DONNA_EFFICIENCY_TIERS[2],
      handlerPath: 'handleDonnaCooPrompt → matchDonnaActionIntent → confirmationMessage / blockedMessage',
      rationale: 'Action registry matched a known non-navigation intent. Returns structured safety response.',
    }
  }

  // Tier 3 — routeDonnaPrompt known intents (KPI, page context, roster, review queue, curriculum)
  const tier3Signals = [
    /\bkpi\b|\bmetric\b|attendance rate|recap completion|curriculum coverage/i,
    /what can (you|donna) help|what should i do|what is this page/i,
    /who needs attention|who is at risk|advancement.ready/i,
    /what needs (my )?review|pending approval|review queue/i,
    /how does (the |this )?curriculum|curriculum (structure|levels?|builder)/i,
  ]
  if (tier3Signals.some(p => p.test(lower))) {
    return {
      tier: 3,
      ...DONNA_EFFICIENCY_TIERS[3],
      handlerPath: 'handleDonnaCooPrompt → routeDonnaPrompt → composeKpiAnswer / composePageContextAnswer / etc.',
      rationale: 'Input matches a known intent handled by the conversational router with template composition.',
    }
  }

  // Tier 4 vs 5 vs 6 — God Mode paths
  if (likelyRequiresMultiTool(lower) || conversationTurnCount >= 3) {
    return {
      tier: 6,
      ...DONNA_EFFICIENCY_TIERS[6],
      handlerPath: 'handleGodModeQuery → orchestrate → callDonnaLlm → runLiveToolExecutionLoop (×2)',
      rationale: 'Input references multiple data domains or is a multi-turn conversation. Full context + multi-tool path expected.',
    }
  }

  if (likelyRequiresOneTool(lower)) {
    return {
      tier: 5,
      ...DONNA_EFFICIENCY_TIERS[5],
      handlerPath: 'handleGodModeQuery → orchestrate → callDonnaLlm → runLiveToolExecutionLoop (×1)',
      rationale: 'Input likely needs one DB tool call for live data retrieval.',
    }
  }

  // Default: God Mode light — LLM call, minimal context, no tool expected
  return {
    tier: 4,
    ...DONNA_EFFICIENCY_TIERS[4],
    handlerPath: 'handleGodModeQuery → orchestrate → callDonnaLlm (no tool)',
    rationale: 'Input did not match deterministic handlers. LLM call expected with page-filtered tool manifest.',
  }
}

// ── Label helper ───────────────────────────────────────────────────────────────

/**
 * Returns the human-readable label for a tier number.
 * Useful for audit logs, dev traces, and efficiency reports.
 */
export function getDonnaEfficiencyTierLabel(tier: DonnaEfficiencyTier): string {
  return DONNA_EFFICIENCY_TIERS[tier].label
}

// ── Dev trace builder ──────────────────────────────────────────────────────────

export interface DonnaEfficiencyTrace {
  tier: DonnaEfficiencyTier
  label: string
  usesLlm: boolean
  usesDbQuery: boolean
  estimatedInputTokens: number
  estimatedOutputTokens: number
  handlerPath: string
  rationale: string
  pathname: string
  inputLength: number
  conversationTurnCount: number
  tracedAt: string   // ISO timestamp
}

/**
 * Build a dev-only efficiency trace for a DONNA request.
 * Safe to log — never includes user input content, only its length.
 * Can be included in safetyAudit or console logs for debugging.
 */
export function buildEfficiencyTrace(
  input: DonnaEfficiencyInput,
  classification: DonnaEfficiencyClassification,
): DonnaEfficiencyTrace {
  return {
    tier: classification.tier,
    label: classification.label,
    usesLlm: classification.usesLlm,
    usesDbQuery: classification.usesDbQuery,
    estimatedInputTokens: classification.estimatedInputTokens,
    estimatedOutputTokens: classification.estimatedOutputTokens,
    handlerPath: classification.handlerPath,
    rationale: classification.rationale,
    pathname: input.pathname,
    inputLength: input.userInput.length,
    conversationTurnCount: input.conversationTurnCount ?? 0,
    tracedAt: new Date().toISOString(),
  }
}
