// Mega Sprint 1595–1624 — DONNA Academy Memory Engine V1
// Academy memory retrieval: queries proposed_actions and returns MemoryRetrievalResult.
// DB layer — uses rawDb pattern per AI_BACKEND_RULES.md.
// Also exports pure helpers for formatting retrieved memories.

import type { DB } from '@/lib/types/db'
import type {
  MemoryRetrievalResult,
  AcademyMemory,
  MemoryIntentType,
  MemoryTimelineEvent,
} from './donnaAcademyMemoryTypes'
import { buildMemoriesFromRows } from './donnaAcademyMemoryBuilder'
import type { RawMemoryRow } from './donnaAcademyMemoryBuilder'
import { buildEntityTimelines } from './donnaEntityTimelineEngine'

// ── Constants ─────────────────────────────────────────────────────────────────

const MEMORY_LIMIT = 20
const RECENT_STATUSES = ['approved', 'executed', 'rejected', 'modified', 'expired', 'failed'] as const

// ── Query ──────────────────────────────────────────────────────────────────────

async function queryMemoryRows(
  db: DB,
  academyId: string,
  entityFilter: string | null,
): Promise<RawMemoryRow[]> {
  const rawDb = db as any

  let query = rawDb
    .from('proposed_actions')
    .select(
      'id, action_label, action_type, target_module, status, risk_level, risk_notes, created_at, approved_at, rejected_at, reviewer_notes, rejection_reason, target_object_id, target_object_type, modified_payload',
    )
    .eq('academy_id', academyId)
    .in('status', RECENT_STATUSES)
    .order('updated_at', { ascending: false })
    .limit(MEMORY_LIMIT)

  if (entityFilter) {
    // Text search on action_label — case-insensitive ILIKE
    query = query.ilike('action_label', `%${entityFilter}%`)
  }

  const { data, error } = await query
  if (error || !data) return []

  return (data as any[]).map(row => ({
    id: row.id as string,
    actionLabel: (row.action_label as string) ?? 'Unnamed action',
    targetModule: (row.target_module as string) ?? 'unknown',
    actionType: (row.action_type as string) ?? 'unknown',
    status: (row.status as string) ?? 'unknown',
    riskLevel: (row.risk_level as string) ?? 'low',
    createdAt: (row.created_at as string),
    approvedAt: (row.approved_at as string | null) ?? null,
    rejectedAt: (row.rejected_at as string | null) ?? null,
    reviewerNotes: (row.reviewer_notes as string | null) ?? null,
    rejectionReason: (row.rejection_reason as string | null) ?? null,
    targetObjectId: (row.target_object_id as string | null) ?? null,
    targetObjectType: (row.target_object_type as string | null) ?? null,
    modifiedPayload: (row.modified_payload as unknown | null) ?? null,
    riskNotes: (row.risk_notes as string[] | null) ?? null,
  }))
}

// ── Main retrieval function ────────────────────────────────────────────────────

export async function loadAcademyMemory(
  db: DB,
  academyId: string,
  options: {
    entityFilter?: string | null
    intent?: MemoryIntentType | null
  } = {},
): Promise<MemoryRetrievalResult> {
  try {
    const entityFilter = options.entityFilter ?? null
    const rows = await queryMemoryRows(db, academyId, entityFilter)

    if (rows.length === 0) {
      return {
        memories: [],
        timeline: [],
        totalFound: 0,
        confidence: 'low',
        missingDataDisclosure:
          'No academy decision history found. This could mean no actions have been approved or rejected yet, or data is unavailable.',
        queryExplainer: entityFilter
          ? `Searched for decisions involving "${entityFilter}"`
          : 'Searched recent academy decisions',
        entityFilter,
      }
    }

    const memories = buildMemoriesFromRows(rows)
    const timeline = buildEntityTimelines(memories)

    const confidence = memories.some(m => m.confidence === 'high')
      ? 'high'
      : memories.some(m => m.confidence === 'medium')
        ? 'medium'
        : 'low'

    const missingDataDisclosure = buildMissingDataDisclosure(memories, options.intent ?? null)

    return {
      memories,
      timeline,
      totalFound: memories.length,
      confidence,
      missingDataDisclosure,
      queryExplainer: entityFilter
        ? `Found ${memories.length} decisions involving "${entityFilter}"`
        : `Found ${memories.length} recent academy decisions`,
      entityFilter,
    }
  } catch {
    return {
      memories: [],
      timeline: [],
      totalFound: 0,
      confidence: 'inferred',
      missingDataDisclosure: 'Memory retrieval failed — decision history is temporarily unavailable.',
      queryExplainer: 'Memory query failed',
      entityFilter: options.entityFilter ?? null,
    }
  }
}

// ── Missing data disclosure ───────────────────────────────────────────────────

function buildMissingDataDisclosure(
  memories: AcademyMemory[],
  intent: MemoryIntentType | null,
): string | null {
  const gaps: string[] = []

  const hasEvidence = memories.some(m => m.evidence.length > 0)
  if (!hasEvidence) {
    gaps.push('Evidence chains used at decision time are not stored — only outcomes are available.')
  }

  if (intent === 'recommendation_history') {
    gaps.push("DONNA's prior session recommendations are not persisted — only the resulting decisions are available.")
  }

  if (intent === 'coach_history') {
    gaps.push('Raw coach wrap-up content is not stored in this memory layer — only approval status is available.')
  }

  if (memories.some(m => m.entityLinks.length === 0)) {
    gaps.push('Some decisions do not have linked entity IDs — entity-level filtering may be incomplete.')
  }

  return gaps.length > 0 ? gaps.join(' ') : null
}

// ── Response formatter (pure) ─────────────────────────────────────────────────

export function formatMemoryResponse(
  result: MemoryRetrievalResult,
  question: string,
): string {
  if (result.totalFound === 0) {
    const disclosure = result.missingDataDisclosure
      ? `\n\n*${result.missingDataDisclosure}*`
      : ''
    return `I don't have any academy decision history${result.entityFilter ? ` involving "${result.entityFilter}"` : ''} to retrieve right now.${disclosure}`
  }

  const lines: string[] = []

  const title = result.entityFilter
    ? `**Academy memory — ${result.entityFilter}** (${result.totalFound} record${result.totalFound !== 1 ? 's' : ''})`
    : `**Academy memory — recent decisions** (${result.totalFound} record${result.totalFound !== 1 ? 's' : ''})`

  lines.push(title)
  lines.push('')

  // Show timeline events (top 5, newest first)
  const timelineItems = result.timeline.slice(0, 5)
  if (timelineItems.length > 0) {
    lines.push('**Timeline:**')
    for (const event of timelineItems) {
      const date = formatMemoryDate(event.occurredAt)
      const importanceIcon = event.importance === 'critical' ? '🔴' : event.importance === 'high' ? '🟠' : '🟡'
      lines.push(`${importanceIcon} **${date}** — ${event.headline}`)
    }
    lines.push('')
  }

  // Show top 3 memories with detail
  const topMemories = result.memories.slice(0, 3)
  if (topMemories.length > 0) {
    lines.push('**Decision detail:**')
    for (const mem of topMemories) {
      lines.push(`**${mem.headline}**`)
      lines.push(mem.summary)
      if (mem.overrideReason) {
        lines.push(`*Override reason: ${mem.overrideReason}*`)
      }
      if (mem.evidence.length > 0) {
        lines.push(`Evidence: ${mem.evidence.join(' · ')}`)
      }
      lines.push('')
    }
  }

  // Confidence disclosure
  const confidenceNote = result.confidence === 'high'
    ? 'Data sourced from live decision records.'
    : result.confidence === 'medium'
      ? 'Some details inferred from decision labels.'
      : 'Limited data available — some details may be incomplete.'
  lines.push(`*${confidenceNote}*`)

  // Missing data disclosure
  if (result.missingDataDisclosure) {
    lines.push(``)
    lines.push(`*What I can't tell you: ${result.missingDataDisclosure}*`)
  }

  // Action route
  lines.push('')
  lines.push('[View all decisions →](/director/review)')

  return lines.join('\n')
}

// ── Date formatter ────────────────────────────────────────────────────────────

function formatMemoryDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return isoDate
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return isoDate
  }
}

// ── Entity filter extraction ──────────────────────────────────────────────────
// Extracts an entity name from the user's question for targeted retrieval.
// e.g. "what happened with Jake?" → "Jake"
// e.g. "what has Coach Danny been doing?" → "Danny"

export function extractEntityFilterFromQuestion(question: string): string | null {
  const lower = question.toLowerCase()

  // "what happened with [name]" / "tell me about [name]"
  const withMatch = lower.match(/(?:happened with|about|for|involving)\s+([a-z]+(?:\s+[a-z]+)?)/i)
  if (withMatch) return titleCase(withMatch[1]!)

  // "why was [name] promoted/moved/placed"
  const whyMatch = lower.match(/why (?:was|did|is)\s+([a-z]+(?:\s+[a-z]+)?)/i)
  if (whyMatch) {
    const name = whyMatch[1]!
    // Exclude pronouns and common words
    if (!['we', 'i', 'the', 'this', 'that', 'donna'].includes(name.toLowerCase())) {
      return titleCase(name)
    }
  }

  // "what has Coach [name] been doing"
  const coachMatch = lower.match(/coach\s+([a-z]+)/i)
  if (coachMatch) return titleCase(coachMatch[1]!)

  // "what changed with [name/group]"
  const changedMatch = lower.match(/changed with\s+([a-z]+(?:\s+[a-z0-9]+)?)/i)
  if (changedMatch) return titleCase(changedMatch[1]!)

  return null
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}
