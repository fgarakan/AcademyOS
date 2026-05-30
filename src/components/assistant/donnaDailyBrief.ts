// Sprint 369 — Donna Daily Brief V1
// Types and utilities for the daily director brief.
// Pure utility. No React, no DB, no API.

// ── Types ──────────────────────────────────────────────────────────────────────

export type BriefPriority = 'high' | 'normal' | 'low'

export interface DailyBriefSection {
  title: string
  items: string[]
  priority: BriefPriority
}

export interface DailyBrief {
  date: string    // YYYY-MM-DD
  sections: DailyBriefSection[]
  generatedAt: string  // ISO timestamp
  /** Sprint 967 — COO-style headline from buildDirectorDailyBriefing. Optional; shown below date. */
  headline?: string
}

// ── Utilities ──────────────────────────────────────────────────────────────────

/** Create an empty brief for the given date. */
export function createEmptyBrief(date: string): DailyBrief {
  return {
    date,
    sections: [],
    generatedAt: new Date().toISOString(),
  }
}

/** Format a brief as plain text. */
export function formatBriefAsText(brief: DailyBrief): string {
  const lines: string[] = [`Daily Brief — ${brief.date}`, '']
  for (const section of brief.sections) {
    const priority = section.priority === 'high' ? ' [URGENT]' : ''
    lines.push(`${section.title}${priority}`)
    for (const item of section.items) {
      lines.push(`  · ${item}`)
    }
    lines.push('')
  }
  return lines.join('\n').trim()
}
