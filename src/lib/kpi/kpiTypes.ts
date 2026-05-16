// KPI type definitions — Sprint 421
// Used by all Block 2 KPI engines (attendance, coach ops, development, retention).
// No DB imports. No Supabase. Pure TypeScript only.

/**
 * Four-tier KPI data sufficiency label.
 *
 * live              — Direct DB query, data reliably populated by normal system
 *                     operation, computation is exact. No disclaimer needed.
 *
 * partial           — Schema complete but computation uses a proxy, approximation,
 *                     or has a meaningful caveat that reduces precision. DONNA must
 *                     surface the caveat alongside the value.
 *
 * demo              — Schema correct, formula correct, but meaningful only when
 *                     sufficient real data exists. Data-density dependent. DONNA
 *                     must show raw counts (e.g. "8 of 10") not just percentages.
 *
 * insufficient_data — Critical schema element or infrastructure missing. Cannot be
 *                     honestly computed. DONNA must explain what is missing instead
 *                     of showing a value.
 */
export type KpiStatus = 'live' | 'partial' | 'demo' | 'insufficient_data'

export interface KpiResult {
  kpiId: number
  name: string
  status: KpiStatus
  /** Computed value. null when status is insufficient_data or data is absent. */
  value: number | null
  /** For rate KPIs: the denominator (e.g. total scheduled sessions). Always show
   *  "value of denominator" rather than percentage alone. */
  denominator?: number
  /** DONNA-readable sentence. Must be honest about status. */
  displayText: string
  /** Required when status is 'partial' or 'demo'. Explains the limitation. */
  caveat?: string
}

/** Convenience helper — build a clean display string for a rate KPI. */
export function formatRateDisplay(
  numerator: number,
  denominator: number,
  unit: string,
  windowLabel: string,
): string {
  if (denominator === 0) return `No ${unit} recorded in ${windowLabel}.`
  const pct = Math.round((numerator / denominator) * 100)
  return `${numerator} of ${denominator} ${unit} (${pct}%) in ${windowLabel}.`
}
