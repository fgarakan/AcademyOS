// Mega Sprint 2441–2470 — DONNA Recommendation Reasoning + Follow-Up V1
// Generates the DONNA system prompt sections for recommendation reasoning.
// Injected into contextPacket.ts when typed recommendations are present.
//
// DONNA must answer 7 reasoning questions using pre-loaded evidence:
//   "Why are you recommending this?"  → riskIfIgnored + description
//   "What evidence supports it?"      → description + urgency
//   "How confident are you?"          → confidenceLabel + confidenceScore
//   "What happens if we do nothing?"  → riskIfIgnored
//   "Who should handle this?"         → owner
//   "When should we review this?"     → reviewDate
//   "What would you do if you were me?" → urgency + followUpRequired
//
// Design rules:
//   - Pure TypeScript. No DB, no React, no side effects.
//   - Accepts EntityRecommendation[] (the compact type from donnaMemoryContextTypes).
//   - DONNA must NOT hallucinate evidence not listed here.

import type { EntityRecommendation } from '@/lib/donna/memory/donnaMemoryContextTypes'

// ── Static reasoning instruction ─────────────────────────────────────────────

export const RECOMMENDATION_REASONING_INSTRUCTION = `## Recommendation Reasoning (DONNA COO Mode)
When the director asks "why?", "how confident are you?", "what happens if we ignore this?", "who should handle this?", "when should we review?", or "what would you do?" — answer ONLY from the evidence in this context packet. Do NOT add reasoning or evidence not listed here.

Reasoning answer format (under 80 words):
- Why: state the risk + what the evidence shows
- Confidence: state the level and what it is based on
- If ignored: state the specific risk from the recommendation data
- Owner: state who should act and why
- Review date: use the date listed, or say "no date set"
- What I would do: give the single clearest action, no hedging`

// ── Dynamic section: typed recommendations for current entity ─────────────────

export function buildRecommendationContextSection(
  recommendations: EntityRecommendation[],
  entityLabel: string,
): string {
  if (recommendations.length === 0) return ''

  const lines: string[] = []
  const hasOverdue = recommendations.some(r => r.isOverdue)
  lines.push(`\n## Active Recommendations — ${entityLabel}`)
  lines.push(`(${recommendations.length} active${hasOverdue ? ', one or more overdue' : ''})`)

  for (const rec of recommendations.slice(0, 3)) {
    lines.push(`\n### ${rec.title}`)
    lines.push(`Type: ${rec.recommendationType.replace(/_/g, ' ')}`)
    lines.push(`Status: ${rec.lifecycleStatus}`)
    lines.push(`Confidence: ${rec.confidenceLabel} (score: ${Math.round(rec.confidenceScore * 10)}/10)`)
    lines.push(`Urgency: ${rec.urgency}`)
    if (rec.description) lines.push(`Evidence: ${rec.description.slice(0, 120)}`)
    lines.push(`Risk if ignored: ${rec.riskIfIgnored}`)
    lines.push(`Expected impact: ${rec.expectedImpact}`)
    lines.push(`Owner: ${rec.owner}`)
    if (rec.reviewDate) lines.push(`Review date: ${rec.reviewDate.slice(0, 10)}${rec.isOverdue ? ' (OVERDUE)' : ''}`)
    lines.push(`Follow-up required: ${rec.followUpRequired ? 'Yes' : 'No'}`)
  }

  return lines.join('\n')
}

// ── Academy-level stale summary section ──────────────────────────────────────

export function buildStaleRecommendationSection(
  pendingCount: number,
  approvedNotActed: number,
  overdueCount: number,
  staleSummary: string | null,
): string {
  if (pendingCount === 0 && approvedNotActed === 0 && overdueCount === 0) return ''

  const lines: string[] = ['\n## Recommendation Health']
  if (pendingCount > 0)     lines.push(`Pending review: ${pendingCount}`)
  if (approvedNotActed > 0) lines.push(`Approved but not acted on: ${approvedNotActed}`)
  if (overdueCount > 0)     lines.push(`Overdue (past review date): ${overdueCount}`)
  if (staleSummary)         lines.push(`Status: ${staleSummary}`)
  return lines.join('\n')
}
