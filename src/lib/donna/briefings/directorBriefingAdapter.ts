// Sprint 967 — Director Briefing Adapter
// Converts DirectorDailyBriefing (library layer) to DailyBrief (UI layer).
// Pure utility — no DB, no AI, no React.
//
// Why an adapter exists:
//   buildDirectorDailyBriefing returns DirectorDailyBriefing (BriefingSection[]).
//   DonnaDailyBriefCard renders DailyBrief (DailyBriefSection[]).
//   The two shapes are structurally different — the adapter bridges them safely.

import type { DirectorDailyBriefing, BriefingSection } from './directorBriefing'
import type { DailyBrief, DailyBriefSection, BriefPriority } from '@/components/assistant/donnaDailyBrief'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function statusToPriority(status: BriefingSection['status']): BriefPriority | null {
  if (status === 'urgent') return 'high'
  if (status === 'attention') return 'normal'
  // 'ok' and 'no_data' produce no actionable section — skip
  return null
}

function buildItemText(section: BriefingSection): string {
  const count = typeof section.value === 'number' ? section.value : null
  const label = section.label

  if (count === null) return `${label} needs your attention.`
  if (count === 0) return `No ${label.toLowerCase()} right now.`

  const plural = count !== 1
  const verb = plural ? 'need' : 'needs'
  const actionSuffix = section.action
    ? ` — ${section.action.toLowerCase()}.`
    : '.'
  return `${count} ${label.toLowerCase()} ${verb} your attention${actionSuffix}`
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

/**
 * Converts a DirectorDailyBriefing (from buildDirectorDailyBriefing) to the
 * DailyBrief shape consumed by DonnaDailyBriefCard.
 *
 * Sections with status 'ok' or 'no_data' are omitted — they add no directive value.
 * 'urgent' → priority 'high'; 'attention' → priority 'normal'.
 *
 * Does NOT add an 'All clear' fallback — the calling API route owns that.
 * Does NOT add a 'Recommended first action' section — the calling API route
 * appends it at the end after any extra non-library sections.
 */
export function adaptBriefingToDailyBrief(
  briefing: DirectorDailyBriefing,
  date: string,
): DailyBrief {
  const sections: DailyBriefSection[] = []

  for (const s of briefing.sections) {
    const priority = statusToPriority(s.status)
    if (priority === null) continue
    sections.push({
      title: s.label,
      items: [buildItemText(s)],
      priority,
    })
  }

  return {
    date,
    sections,
    generatedAt: briefing.generatedAt,
    headline: briefing.headline,
  }
}
