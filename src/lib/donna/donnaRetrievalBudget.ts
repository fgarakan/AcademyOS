// Sprint 1089 — DONNA Retrieval Budget Caps V1
//
// Hard retrieval budget caps for every DONNA context source.
// As the intelligence layer becomes more connected (product memory, curriculum,
// knowledge, player evidence, coach notes, session data, parent comms), these
// caps prevent silent over-retrieval that increases token cost, latency, and noise.
//
// Usage rules:
//   1. All future DONNA retrieval systems MUST pass items through clampRetrievedItems
//      before injecting into any LLM context or orchestrator prompt.
//   2. Default mode is CONSERVATIVE — retrieve only the smallest useful amount.
//   3. Deep Mode caps apply only AFTER the director has confirmed via the Sprint 1086
//      Deep Mode gate or Sprint 1090 Alpha Sandbox disclosure.
//   4. Product memory is retrieved by category/relevance, never injected wholesale.
//   5. Curriculum nodes prioritize current level, active pathway, current page.
//   6. Player evidence prioritizes recent, approved, relevant evidence.
//   7. Coach notes must be summarized — never raw text dumped to LLM.
//   8. Knowledge items must be platform-owner-approved (enforced by knowledgeBuilderBridge).
//   9. Missing or over-budget items should be summarized, not silently dropped.
//  10. assertWithinRetrievalBudget is advisory — never throws, always returns boolean.
//
// Pure TypeScript — no DB, no API, no mutations, no side effects.

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Retrieval mode — determines which budget caps apply.
 * 'default' is ALWAYS the starting mode.
 * 'deep' only applies after explicit director confirmation via Deep Mode gate or
 * Alpha Sandbox disclosure. Never set 'deep' automatically.
 */
export type DonnaRetrievalMode = 'default' | 'deep'

/**
 * The seven retrieval source categories DONNA manages.
 * Each category has its own cap in both default and deep mode.
 */
export type DonnaRetrievalSource =
  | 'productMemoryRules'
  | 'curriculumNodes'
  | 'knowledgeItems'
  | 'playerEvidenceItems'
  | 'coachNotes'
  | 'sessionSummaries'
  | 'parentCommunicationRules'

/**
 * Budget caps per source category plus a total cross-source limit.
 * totalContextItems guards against the sum of all sources exceeding the budget.
 */
export interface DonnaRetrievalBudget {
  /** Approved product memory rules (from donnaProductMemory.ts) — retrieved by category */
  productMemoryRules: number
  /** Curriculum nodes/drills relevant to the current page or query */
  curriculumNodes: number
  /** Platform-owner-approved knowledge entries from Knowledge Builder */
  knowledgeItems: number
  /** Player gate evidence items (from player_gate_status / evidence records) */
  playerEvidenceItems: number
  /** Coach notes — summarized, director-safe, never raw */
  coachNotes: number
  /** Session summaries across recent sessions */
  sessionSummaries: number
  /** Parent communication rules from approved product memory */
  parentCommunicationRules: number
  /** Hard cap on total items across ALL sources in one context assembly */
  totalContextItems: number
}

/**
 * Tracks how many items were actually retrieved from each source in one request.
 * Used by assertWithinRetrievalBudget and summarizeRetrievalBudgetUsage.
 */
export interface DonnaRetrievalBudgetUsage {
  productMemoryRules: number
  curriculumNodes: number
  knowledgeItems: number
  playerEvidenceItems: number
  coachNotes: number
  sessionSummaries: number
  parentCommunicationRules: number
  /** Computed total across all sources */
  totalContextItems: number
  /** The mode that was active when these items were retrieved */
  mode: DonnaRetrievalMode
  /** Whether all source counts are within their budget caps */
  withinBudget: boolean
  /** Sources that exceeded their cap (should be empty if clampRetrievedItems was used) */
  overBudgetSources: DonnaRetrievalSource[]
}

// ── Budget constants ──────────────────────────────────────────────────────────

/**
 * Default retrieval budget — conservative.
 * Applied to all DONNA requests unless the director has explicitly confirmed
 * Deep Mode via Sprint 1086 gate or Sprint 1090 Alpha Sandbox disclosure.
 *
 * Design rationale:
 *   - productMemoryRules: 3 — DONNA behavior + safety rules are sufficient; never inject all
 *   - curriculumNodes: 5 — current level + 4 related nodes covers 95% of questions
 *   - knowledgeItems: 3 — three platform-approved entries are enough for advisory context
 *   - playerEvidenceItems: 5 — recent evidence is most relevant; older items add noise
 *   - coachNotes: 3 — three recent summarized notes provide sufficient coach context
 *   - sessionSummaries: 3 — last 3 sessions cover recent history
 *   - parentCommunicationRules: 2 — parent-safe + approval-gated rules are stable
 *   - totalContextItems: 12 — ~300–400 chars of injected context, well within token budget
 */
export const DONNA_DEFAULT_RETRIEVAL_BUDGET: DonnaRetrievalBudget = {
  productMemoryRules: 3,
  curriculumNodes: 5,
  knowledgeItems: 3,
  playerEvidenceItems: 5,
  coachNotes: 3,
  sessionSummaries: 3,
  parentCommunicationRules: 2,
  totalContextItems: 12,
}

/**
 * Deep Mode retrieval budget — expanded.
 * Used only when the director has explicitly confirmed deeper analysis.
 * Never applied automatically. Always requires prior disclosure + confirmation.
 */
export const DONNA_DEEP_RETRIEVAL_BUDGET: DonnaRetrievalBudget = {
  productMemoryRules: 6,
  curriculumNodes: 12,
  knowledgeItems: 8,
  playerEvidenceItems: 15,
  coachNotes: 10,
  sessionSummaries: 8,
  parentCommunicationRules: 4,
  totalContextItems: 40,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the appropriate budget object for the given mode.
 *
 * @example
 * const budget = getDonnaRetrievalBudget('default')
 * // budget.knowledgeItems === 3
 */
export function getDonnaRetrievalBudget(mode: DonnaRetrievalMode): DonnaRetrievalBudget {
  return mode === 'deep' ? DONNA_DEEP_RETRIEVAL_BUDGET : DONNA_DEFAULT_RETRIEVAL_BUDGET
}

/**
 * Clamp a retrieved items array to the budget cap for the given source and mode.
 * Returns the first N items where N is the budget cap for that source.
 *
 * Call this at the point where retrieved items are about to be injected into
 * an LLM context or orchestrator prompt — never in the DB query layer.
 *
 * @example
 * const capped = clampRetrievedItems(knowledgeEntries, 'knowledgeItems', 'default')
 * // capped.length <= DONNA_DEFAULT_RETRIEVAL_BUDGET.knowledgeItems (3)
 */
export function clampRetrievedItems<T>(
  items: T[],
  source: DonnaRetrievalSource,
  mode: DonnaRetrievalMode,
): T[] {
  const budget = getDonnaRetrievalBudget(mode)
  const cap = budget[source]
  if (items.length <= cap) return items
  return items.slice(0, cap)
}

/**
 * Build a DonnaRetrievalBudgetUsage object from source counts.
 * Computes totalContextItems, withinBudget, and overBudgetSources automatically.
 *
 * @example
 * const usage = buildRetrievalBudgetUsage({
 *   knowledgeItems: 3,
 *   productMemoryRules: 2,
 * }, 'default')
 */
export function buildRetrievalBudgetUsage(
  counts: Partial<Record<DonnaRetrievalSource, number>>,
  mode: DonnaRetrievalMode,
): DonnaRetrievalBudgetUsage {
  const budget = getDonnaRetrievalBudget(mode)
  const resolved: Record<DonnaRetrievalSource, number> = {
    productMemoryRules: counts.productMemoryRules ?? 0,
    curriculumNodes: counts.curriculumNodes ?? 0,
    knowledgeItems: counts.knowledgeItems ?? 0,
    playerEvidenceItems: counts.playerEvidenceItems ?? 0,
    coachNotes: counts.coachNotes ?? 0,
    sessionSummaries: counts.sessionSummaries ?? 0,
    parentCommunicationRules: counts.parentCommunicationRules ?? 0,
  }

  const totalContextItems = Object.values(resolved).reduce((sum, n) => sum + n, 0)

  const overBudgetSources = (Object.keys(resolved) as DonnaRetrievalSource[]).filter(
    source => resolved[source] > budget[source],
  )

  const withinBudget =
    overBudgetSources.length === 0 && totalContextItems <= budget.totalContextItems

  return { ...resolved, totalContextItems, mode, withinBudget, overBudgetSources }
}

/**
 * Produce a concise human-readable summary of retrieval budget usage.
 * Safe to include in audit logs and dev traces — no raw content, counts only.
 *
 * @example
 * const summary = summarizeRetrievalBudgetUsage(usage)
 * // "mode:default | knowledge:3/3 curriculum:0/5 ... total:3/12 withinBudget:true"
 */
export function summarizeRetrievalBudgetUsage(usage: DonnaRetrievalBudgetUsage): string {
  const budget = getDonnaRetrievalBudget(usage.mode)
  const parts = [
    `mode:${usage.mode}`,
    `knowledge:${usage.knowledgeItems}/${budget.knowledgeItems}`,
    `curriculum:${usage.curriculumNodes}/${budget.curriculumNodes}`,
    `productMemory:${usage.productMemoryRules}/${budget.productMemoryRules}`,
    `playerEvidence:${usage.playerEvidenceItems}/${budget.playerEvidenceItems}`,
    `coachNotes:${usage.coachNotes}/${budget.coachNotes}`,
    `sessions:${usage.sessionSummaries}/${budget.sessionSummaries}`,
    `parentRules:${usage.parentCommunicationRules}/${budget.parentCommunicationRules}`,
    `total:${usage.totalContextItems}/${budget.totalContextItems}`,
    `withinBudget:${usage.withinBudget}`,
  ]
  if (usage.overBudgetSources.length > 0) {
    parts.push(`OVER_BUDGET:${usage.overBudgetSources.join(',')}`)
  }
  return parts.join(' | ')
}

/**
 * Check whether retrieval budget usage is within the caps for the given mode.
 * Returns true if within budget, false if any source exceeded its cap.
 * NEVER throws — advisory check only.
 *
 * @example
 * if (!assertWithinRetrievalBudget(usage, 'default')) {
 *   // Log warning — clampRetrievedItems should have prevented this
 * }
 */
export function assertWithinRetrievalBudget(
  usage: DonnaRetrievalBudgetUsage,
  mode: DonnaRetrievalMode,
): boolean {
  if (usage.mode !== mode) {
    // Usage was built with a different mode — cannot validate
    return false
  }
  return usage.withinBudget
}
