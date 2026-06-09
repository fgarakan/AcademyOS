// Mega Sprint 1595–1624 — DONNA Academy Memory Engine V1
// Entity timeline builder: generates MemoryTimelineEvent[] from AcademyMemory[].
// DISTINCT from src/lib/donna/entities/donnaEntityTimelineEngine.ts which builds
// timelines from in-memory AcademyEntityContext.
// This engine builds timelines from DB-backed AcademyMemory records (persistent history).
// Pure TypeScript — no DB, no React, no side effects.

import type { AcademyMemory, MemoryTimelineEvent, MemoryEntityLink } from './donnaAcademyMemoryTypes'
import { compareByImportance } from './donnaMemoryImportanceScorer'

// ── Entity type ───────────────────────────────────────────────────────────────

export type MemoryEntityType = MemoryEntityLink['entityType'] | 'academy'

// ── Build timeline for all memories ──────────────────────────────────────────

export function buildEntityTimelines(memories: AcademyMemory[]): MemoryTimelineEvent[] {
  return memories
    .map(mem => ({
      memoryId: mem.id,
      sourceType: mem.sourceType,
      headline: mem.headline,
      occurredAt: mem.occurredAt,
      importance: mem.importance,
      entityLinks: mem.entityLinks,
    }))
    .sort((a, b) => {
      // Sort: newest first, then by importance within same date
      const dateDiff = new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      if (dateDiff !== 0) return dateDiff
      return compareByImportance(a.importance, b.importance)
    })
}

// ── Build timeline for a specific entity ──────────────────────────────────────

export function buildEntityTimelineFor(
  memories: AcademyMemory[],
  entityLabel: string,
): MemoryTimelineEvent[] {
  const lowerLabel = entityLabel.toLowerCase()

  const relevant = memories.filter(mem =>
    mem.entityLinks.some(link => link.entityLabel.toLowerCase().includes(lowerLabel)) ||
    mem.headline.toLowerCase().includes(lowerLabel)
  )

  return buildEntityTimelines(relevant)
}

// ── Build timeline for a specific entity type ─────────────────────────────────

export function buildEntityTypeTimeline(
  memories: AcademyMemory[],
  entityType: MemoryEntityType,
): MemoryTimelineEvent[] {
  const relevant = memories.filter(mem =>
    mem.entityLinks.some(link => link.entityType === entityType)
  )
  return buildEntityTimelines(relevant)
}

// ── Specialty timelines ───────────────────────────────────────────────────────

export function buildPlayerTimeline(memories: AcademyMemory[]): MemoryTimelineEvent[] {
  return buildEntityTypeTimeline(memories, 'player')
}

export function buildCoachTimeline(memories: AcademyMemory[]): MemoryTimelineEvent[] {
  return buildEntityTypeTimeline(memories, 'coach')
}

export function buildCurriculumTimeline(memories: AcademyMemory[]): MemoryTimelineEvent[] {
  return buildEntityTypeTimeline(memories, 'curriculum_level')
}

export function buildAcademyTimeline(memories: AcademyMemory[]): MemoryTimelineEvent[] {
  // Academy timeline = all memories sorted newest-first
  return buildEntityTimelines(memories)
}

// ── Format timeline for display ───────────────────────────────────────────────

export function formatTimelineForDisplay(
  timeline: MemoryTimelineEvent[],
  maxItems: number = 8,
): string {
  if (timeline.length === 0) return 'No timeline events found.'

  const items = timeline.slice(0, maxItems)
  const lines: string[] = []

  for (const event of items) {
    const date = formatDate(event.occurredAt)
    const importance = event.importance === 'critical' ? '[CRITICAL] '
      : event.importance === 'high' ? '[HIGH] '
      : ''
    lines.push(`**${date}** — ${importance}${event.headline}`)
  }

  if (timeline.length > maxItems) {
    lines.push(`_...and ${timeline.length - maxItems} more events_`)
  }

  return lines.join('\n')
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return isoDate
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return isoDate
  }
}
