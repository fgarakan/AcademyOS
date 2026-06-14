// Mega Sprint 2591–2620 — DONNA Proactive COO + Overnight Intelligence V1
// Daily Reflection Engine — end-of-day COO review.
//
// Pure TypeScript — no DB, no side effects.
// Generates a structured end-of-day review for the director:
//   - What DONNA flags were addressed
//   - What remains unresolved
//   - One question to prompt overnight preparation
//
// Triggered when: user opens director dashboard after 4 PM.

import type { AcademyDailySnapshot } from './academyDailySnapshot'
import type { ProactiveAlert } from './donnaProactiveAlerts'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DailyReflection {
  isEndOfDay:            boolean
  resolvedCount:         number
  unresolvedCount:       number
  unresolvedAlerts:      ProactiveAlert[]
  closingStatement:      string
  overnightFocusPrompt:  string
  suggestedTomorrowItem: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isEndOfDay(): boolean {
  return new Date().getHours() >= 16
}

function buildClosingStatement(
  unresolvedCount: number,
  snapshot: AcademyDailySnapshot,
): string {
  if (unresolvedCount === 0) {
    return `Clear slate, ${snapshot.directorFirstName || 'Director'} — all flagged items were addressed today.`
  }
  if (unresolvedCount === 1) {
    return `One item still open from today. DONNA will surface it again first thing tomorrow.`
  }
  return `${unresolvedCount} items still open. DONNA will prioritise these at the top of tomorrow's brief.`
}

function buildOvernightFocusPrompt(snapshot: AcademyDailySnapshot): string {
  const top = snapshot.topPriorities[0]
  if (!top) {
    return 'What would you want DONNA to watch for overnight?'
  }

  if (top.urgency === 'critical') {
    return `${top.title} is still unresolved — do you want DONNA to draft a proposed action before tomorrow?`
  }
  if (top.urgency === 'high') {
    return `If you could clear one thing before you close out: ${top.title}.`
  }
  return `Heading into tomorrow: anything you want to adjust about DONNA's top priorities?`
}

function buildSuggestedTomorrowItem(
  snapshot: AcademyDailySnapshot,
  unresolvedAlerts: ProactiveAlert[],
): string | null {
  const topAlert = unresolvedAlerts[0]
  if (topAlert) return topAlert.title
  if (snapshot.topOpportunity) return `Advance ${snapshot.topOpportunity.label}`
  return null
}

// ── Main export ────────────────────────────────────────────────────────────────

export function buildDailyReflection(
  snapshot: AcademyDailySnapshot,
  alerts: ProactiveAlert[],
  resolvedCount = 0,
): DailyReflection {
  const endOfDay       = isEndOfDay()
  const unresolvedAlerts = alerts.slice(resolvedCount)
  const unresolvedCount  = unresolvedAlerts.length

  return {
    isEndOfDay:            endOfDay,
    resolvedCount,
    unresolvedCount,
    unresolvedAlerts,
    closingStatement:      buildClosingStatement(unresolvedCount, snapshot),
    overnightFocusPrompt:  buildOvernightFocusPrompt(snapshot),
    suggestedTomorrowItem: buildSuggestedTomorrowItem(snapshot, unresolvedAlerts),
  }
}

// ── DONNA conversational answer ────────────────────────────────────────────────

export function buildDailyReflectionAnswer(reflection: DailyReflection): string {
  const lines: string[] = [reflection.closingStatement]

  if (reflection.unresolvedCount > 0) {
    lines.push('')
    lines.push('**Still open:**')
    for (const a of reflection.unresolvedAlerts.slice(0, 3)) {
      lines.push(`• ${a.title}`)
    }
  }

  lines.push('')
  lines.push(reflection.overnightFocusPrompt)

  return lines.join('\n')
}
