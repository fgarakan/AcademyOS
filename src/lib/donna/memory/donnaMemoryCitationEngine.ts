// Mega Sprint 1595–1624 — DONNA Academy Memory Engine V1
// Memory citation engine: formats AcademyMemory records as numbered, dated,
// confidence-disclosed citation blocks for DONNA responses.
//
// Design rules:
//   - Pure TypeScript. No DB, no React, no side effects.
//   - Deterministic: same input → same output.
//   - Never fabricates — only cites actual AcademyMemory records.
//   - Confidence must be disclosed on every citation block.
//   - Missing memory must be disclosed explicitly when no citations exist.

import type { AcademyMemory, MemoryConfidence, MemoryImportance } from './donnaAcademyMemoryTypes'

// ── Citation types ─────────────────────────────────────────────────────────────

export interface MemoryCitation {
  index: number             // 1-based citation number
  memoryId: string
  headline: string
  summary: string
  occurredAt: string
  confidence: MemoryConfidence
  importance: MemoryImportance
}

export interface CitationBlock {
  citations: MemoryCitation[]
  confidenceDisclosure: string
  formattedText: string     // Markdown-formatted citation block ready for display
  hasCitations: boolean
}

// ── Citation builder ───────────────────────────────────────────────────────────

/**
 * Build a citation block from a list of memories and a context statement.
 *
 * Example:
 *   buildCitationBlock(memories, "I recommended promotion because:")
 *
 * Returns a CitationBlock with up to 5 citations, a confidence disclosure,
 * and a pre-formatted markdown string.
 */
export function buildCitationBlock(
  memories: AcademyMemory[],
  context: string,
): CitationBlock {
  const relevant = memories.slice(0, 5)  // cap at 5 citations per response

  const citations: MemoryCitation[] = relevant.map((mem, i) => ({
    index: i + 1,
    memoryId: mem.id,
    headline: mem.headline,
    summary: mem.summary,
    occurredAt: mem.occurredAt,
    confidence: mem.confidence,
    importance: mem.importance,
  }))

  const confidenceDisclosure = buildConfidenceDisclosure(citations)
  const formattedText = formatCitationBlock(context, citations, confidenceDisclosure)

  return {
    citations,
    confidenceDisclosure,
    formattedText,
    hasCitations: citations.length > 0,
  }
}

// ── No-citation disclosure ─────────────────────────────────────────────────────

/**
 * Returns a disclosure string when no memory records exist to cite.
 * DONNA must explicitly state this rather than omitting citations silently.
 */
export function buildNoCitationDisclosure(reason?: string): string {
  const base = 'No memory records are available to cite for this response.'
  return reason ? `${base} ${reason}` : base
}

// ── Single citation formatter ──────────────────────────────────────────────────

/** Formats a single memory as an inline citation: [N] Headline (Date) */
export function formatSingleCitation(memory: AcademyMemory, index: number): string {
  const date = formatCitationDate(memory.occurredAt)
  return `**[${index}]** ${memory.headline} *(${date})*`
}

// ── Inline citation list ───────────────────────────────────────────────────────

/** Formats a flat list of citations for inline embedding in a DONNA response. */
export function formatInlineCitations(citations: MemoryCitation[]): string {
  if (citations.length === 0) return buildNoCitationDisclosure()
  return citations
    .map(c => `**[${c.index}]** ${c.headline} *(${formatCitationDate(c.occurredAt)})*`)
    .join('\n')
}

// ── Confidence disclosure ──────────────────────────────────────────────────────

function buildConfidenceDisclosure(citations: MemoryCitation[]): string {
  if (citations.length === 0) {
    return 'No memory records available to cite.'
  }

  const allHigh = citations.every(c => c.confidence === 'high')
  const anyInferred = citations.some(c => c.confidence === 'inferred')
  const anyLow = citations.some(c => c.confidence === 'low')

  if (allHigh)    return 'All citations sourced from verified decision records.'
  if (anyInferred) return 'Some citations are inferred from patterns — treat with caution.'
  if (anyLow)     return 'Some citations have limited data — details may be incomplete.'
  return 'Citations sourced from decision records; some details may be inferred from labels.'
}

// ── Citation block formatter ───────────────────────────────────────────────────

function formatCitationBlock(
  context: string,
  citations: MemoryCitation[],
  confidenceDisclosure: string,
): string {
  if (citations.length === 0) {
    return [
      context,
      '',
      `*${buildNoCitationDisclosure()}*`,
    ].join('\n')
  }

  const lines: string[] = [context, '']

  for (const c of citations) {
    const date = formatCitationDate(c.occurredAt)
    lines.push(`**[${c.index}]** ${c.headline} *(${date})*`)
    // Include summary when it differs meaningfully from the headline
    if (c.summary && c.summary.trim() !== c.headline.trim()) {
      lines.push(`  ${c.summary}`)
    }
  }

  lines.push('')
  lines.push(`*${confidenceDisclosure}*`)

  return lines.join('\n')
}

// ── Date formatter ─────────────────────────────────────────────────────────────

function formatCitationDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return isoDate
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return isoDate
  }
}

// ── Override citation builder ──────────────────────────────────────────────────

/**
 * Builds a dedicated citation block for director override memories.
 * Used when DONNA explains "The original recommendation was modified."
 */
export function buildOverrideCitationBlock(memories: AcademyMemory[]): CitationBlock {
  const overrides = memories.filter(m => m.sourceType === 'director_override')
  return buildCitationBlock(
    overrides,
    'Director override memory:',
  )
}

// ── Promotion citation builder ─────────────────────────────────────────────────

/**
 * Builds a promotion-specific citation block.
 * Used when DONNA explains why a player was promoted.
 */
export function buildPromotionCitationBlock(
  memories: AcademyMemory[],
  playerLabel: string,
): CitationBlock {
  const promotionMemories = memories.filter(m =>
    m.sourceType === 'promotion_decision' ||
    m.entityLinks.some(l => l.entityLabel.toLowerCase().includes(playerLabel.toLowerCase()))
  )
  return buildCitationBlock(
    promotionMemories,
    `I recommended promotion for ${playerLabel} because:`,
  )
}
