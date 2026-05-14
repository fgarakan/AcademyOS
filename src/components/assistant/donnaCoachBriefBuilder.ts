// Donna Coach Brief Builder — Sprint 271
// Pure deterministic text builder. No DB, no API, no async, no side effects.
// Returns a formatted internal coach brief for director review only.
// The brief is NEVER sent automatically — it remains local until the director
// explicitly approves and sends it through a future communication action.

export interface CoachBriefBlock {
  name: string
  type: string
  duration_min: number
  order_index: number
  notes?: string | null
}

export interface CoachBriefInput {
  sessionName: string
  scheduledDate: string
  templateName: string
  blocks: CoachBriefBlock[]
  groupLabel?: string | null
  coachLabel?: string | null
  sessionFocus?: string | null
  coachNotes?: string | null
  modifications?: string | null
}

/**
 * Builds a plaintext internal coach brief from session + block data.
 * Safe to call server-side or client-side — pure computation only.
 */
export function buildCoachBrief(input: CoachBriefInput): string {
  const lines: string[] = []

  lines.push('[Internal Coach Brief Draft — Not Sent]')
  lines.push('─────────────────────────────────────────')
  lines.push(`Session:  ${input.sessionName}`)
  lines.push(`Date:     ${input.scheduledDate}`)
  if (input.groupLabel) lines.push(`Group:    ${input.groupLabel}`)
  if (input.coachLabel) lines.push(`Coach:    ${input.coachLabel}`)
  lines.push(`Template: ${input.templateName}`)
  lines.push('')

  if (input.blocks.length > 0) {
    lines.push('Session Plan:')
    const sorted = [...input.blocks].sort((a, b) => a.order_index - b.order_index)
    for (let i = 0; i < sorted.length; i++) {
      const b = sorted[i]
      const dur = b.duration_min > 0 ? ` · ${b.duration_min} min` : ''
      lines.push(`  ${i + 1}. ${b.name}${dur}`)
      if (b.notes) lines.push(`     → ${b.notes}`)
    }
    lines.push('')
  }

  if (input.sessionFocus) {
    lines.push(`Focus:       ${input.sessionFocus}`)
  }
  if (input.coachNotes) {
    lines.push(`Coach notes: ${input.coachNotes}`)
  }
  if (input.modifications) {
    lines.push(`Modifications: ${input.modifications}`)
  }
  if (input.sessionFocus || input.coachNotes || input.modifications) {
    lines.push('')
  }

  lines.push('─────────────────────────────────────────')
  lines.push('Internal draft only. Not sent to coach.')
  lines.push('Director approval required before sending.')

  return lines.join('\n')
}
