// Sprint 1661 — DONNA Daily COO Briefing Engine V2
// Produces a personalized start-of-day briefing in the COO operating style.
// Inputs: DirectorDonnaContext + optional director name.
// Output: DailyCOOBriefing — per-category priorities with evidence, why, and suggested action.
//
// COO briefing philosophy:
//   - Always context-first. Never "How can I help?"
//   - Each item: issue + evidence + why it matters + suggested next action.
//   - Categories: players, coaches, curriculum, assessments, approvals, operations.
//   - Personalized if director name is provided.
//   - Safe: no parent/player-visible data, no raw coach notes, no PII.
//
// Pure TypeScript — no DB calls, no React, no API calls, no mutations.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BriefingCategory =
  | 'players'
  | 'coaches'
  | 'curriculum'
  | 'assessments'
  | 'approvals'
  | 'operations'
  | 'academy_health'

export type BriefingItemUrgency = 'critical' | 'high' | 'medium' | 'informational'

export interface BriefingItem {
  id:              string
  category:        BriefingCategory
  urgency:         BriefingItemUrgency
  headline:        string           // e.g., "Jamie is close to promotion"
  issue:           string           // what the situation is
  evidence:        string           // what data supports this
  whyItMatters:    string           // director-facing reason this deserves attention
  suggestedAction: string           // DONNA's suggested next action (text only)
  actionHref:      string           // route to navigate to
  /** Available DONNA voice commands for this item */
  donnaCommands:   string[]
  /** Whether this item requires director approval to act on */
  requiresApproval: boolean
}

export interface DailyCOOBriefing {
  generatedAt:     string
  /** Personalized opening: "Good morning Brian." or "Good morning." */
  openingLine:     string
  /** Whether any critical item exists */
  hasCritical:     boolean
  /** Top 3–6 items ranked by urgency */
  items:           BriefingItem[]
  /** Closing offer */
  closingQuestion: string
  /** Formatted as a single conversational string for DONNA to speak */
  asText:          () => string
}

// ─── Urgency from count ─────────────────────────────────────────────────────────

function urgencyFromCount(count: number, criticalThreshold: number, highThreshold: number): BriefingItemUrgency {
  if (count >= criticalThreshold) return 'critical'
  if (count >= highThreshold)     return 'high'
  if (count > 0)                  return 'medium'
  return 'informational'
}

// ─── Time-of-day greeting ───────────────────────────────────────────────────────

function timeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Item builders ──────────────────────────────────────────────────────────────

function buildApprovalItem(count: number): BriefingItem | null {
  if (count === 0) return null
  return {
    id:              'approvals',
    category:        'approvals',
    urgency:         urgencyFromCount(count, 5, 2),
    headline:        `${count} item${count !== 1 ? 's' : ''} need${count === 1 ? 's' : ''} your approval`,
    issue:           `${count} proposed action${count !== 1 ? 's' : ''} ${count === 1 ? 'is' : 'are'} waiting in your Review Center.`,
    evidence:        `Live count from proposed_actions where status = 'pending_review'.`,
    whyItMatters:    'Nothing executes until you review it. Pending items block coach and curriculum workflows.',
    suggestedAction: 'Open the Review Center and work through the queue.',
    actionHref:      '/director/review',
    donnaCommands:   ['Take me to the Review Center', 'Show me what needs approval', 'Open review queue'],
    requiresApproval: false,
  }
}

function buildHighRiskPlayersItem(count: number): BriefingItem | null {
  if (count === 0) return null
  return {
    id:              'high_risk_players',
    category:        'players',
    urgency:         urgencyFromCount(count, 3, 1),
    headline:        `${count} player${count !== 1 ? 's' : ''} ${count === 1 ? 'has' : 'have'} high-risk signals`,
    issue:           `${count} player${count !== 1 ? 's' : ''} showing risk signals — missed sessions, stalled development, or overdue assessments.`,
    evidence:        'Derived from attendance, development signal patterns, and assessment cadence.',
    whyItMatters:    'Early intervention prevents dropout and keeps development on track.',
    suggestedAction: 'Review high-risk players and decide on follow-up.',
    actionHref:      '/director/attention',
    donnaCommands:   ['Who needs attention?', 'Show me high-risk players', 'Take me to the attention queue'],
    requiresApproval: false,
  }
}

function buildAdvancementItem(count: number): BriefingItem | null {
  if (count === 0) return null
  return {
    id:              'advancement_eligible',
    category:        'players',
    urgency:         urgencyFromCount(count, 5, 2),
    headline:        `${count} player${count !== 1 ? 's' : ''} eligible for advancement`,
    issue:           `${count} player${count !== 1 ? 's' : ''} ${count === 1 ? 'has' : 'have'} met advancement criteria and ${count === 1 ? 'is' : 'are'} ready for your review.`,
    evidence:        'Level readiness engine: gate evidence thresholds met, assessment scores in range.',
    whyItMatters:    "Keeping eligible players in the same level without advancement review can stall their development and affect parent trust.",
    suggestedAction: 'Review each player, confirm readiness, and draft advancement proposals.',
    actionHref:      '/director/players',
    donnaCommands:   ['Show me advancement-eligible players', 'Who is ready to advance?'],
    requiresApproval: true,
  }
}

function buildAttendanceItem(count: number): BriefingItem | null {
  if (count === 0) return null
  return {
    id:              'attendance_exceptions',
    category:        'operations',
    urgency:         urgencyFromCount(count, 5, 2),
    headline:        `${count} attendance exception${count !== 1 ? 's' : ''} pending`,
    issue:           `${count} attendance exception${count !== 1 ? 's' : ''} submitted by coaches — unrostered attendees or absences that need your review.`,
    evidence:        'Submitted via coach wrap-up drafts.',
    whyItMatters:    'Unresolved exceptions create record gaps and can affect billing and parent reporting.',
    suggestedAction: 'Review and approve or reject each attendance exception.',
    actionHref:      '/director/review',
    donnaCommands:   ['Show attendance exceptions', 'Open review queue'],
    requiresApproval: true,
  }
}

function buildProgressStallItem(count: number): BriefingItem | null {
  if (count === 0) return null
  return {
    id:              'progress_stalls',
    category:        'players',
    urgency:         urgencyFromCount(count, 5, 2),
    headline:        `${count} player${count !== 1 ? 's' : ''} stalled in development`,
    issue:           `${count} player${count !== 1 ? 's' : ''} ${count === 1 ? 'has' : 'have'} had no development signal recorded for 21+ days.`,
    evidence:        'Development signal gap detection from player_development_signals.',
    whyItMatters:    'Stalled players are at higher risk of disengagement. Timely coaching adjustments make a difference.',
    suggestedAction: 'Review stalled players and assign a coach check-in or assessment.',
    actionHref:      '/director/attention',
    donnaCommands:   ['Who is stalled?', 'Show me development gaps'],
    requiresApproval: false,
  }
}

function buildCurriculumDraftItem(count: number): BriefingItem | null {
  if (count === 0) return null
  return {
    id:              'curriculum_drafts',
    category:        'curriculum',
    urgency:         urgencyFromCount(count, 5, 2),
    headline:        `${count} curriculum draft${count !== 1 ? 's' : ''} awaiting approval`,
    issue:           `${count} curriculum improvement proposal${count !== 1 ? 's' : ''} ${count === 1 ? 'is' : 'are'} in the Review Center.`,
    evidence:        'Drafted via DONNA curriculum operator or coach suggestion.',
    whyItMatters:    'Curriculum changes improve player development outcomes but require your approval before applying.',
    suggestedAction: 'Review curriculum drafts and approve or reject.',
    actionHref:      '/director/review',
    donnaCommands:   ['Show curriculum drafts', 'Open review queue'],
    requiresApproval: true,
  }
}

// ─── Rank by urgency ───────────────────────────────────────────────────────────

const URGENCY_ORDER: Record<BriefingItemUrgency, number> = {
  critical:      0,
  high:          1,
  medium:        2,
  informational: 3,
}

function rankItems(items: BriefingItem[]): BriefingItem[] {
  return [...items].sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency])
}

// ─── Main builder ──────────────────────────────────────────────────────────────

export function buildDailyCOOBriefing(
  ctx: DirectorDonnaContext | null,
  directorName?: string | null,
): DailyCOOBriefing {
  const greeting = timeGreeting()
  const nameStr  = directorName ? ` ${directorName}` : ''
  const openingLine = `${greeting}${nameStr}.`

  // Build item candidates (null entries filtered out)
  const candidates: Array<BriefingItem | null> = ctx ? [
    buildApprovalItem(ctx.pendingReviews),
    buildHighRiskPlayersItem(ctx.highRiskPlayerCount),
    buildAdvancementItem(ctx.advancementEligibleCount),
    buildAttendanceItem(ctx.attendanceExceptions),
    buildProgressStallItem(ctx.playerProgressStallCount ?? 0),
    buildCurriculumDraftItem(ctx.curriculumDraftCount),
  ] : []

  const items = rankItems(candidates.filter((x): x is BriefingItem => x !== null))

  const hasCritical = items.some(i => i.urgency === 'critical')

  // Closing question
  let closingQuestion: string
  if (items.length === 0) {
    closingQuestion = "Your academy is in good shape — no urgent items today. What would you like to focus on?"
  } else if (items.length === 1) {
    closingQuestion = "Would you like me to walk you through it?"
  } else {
    closingQuestion = `Would you like me to walk you through ${items.length > 3 ? 'the top priorities' : 'them'}?`
  }

  function asText(): string {
    const lines: string[] = [openingLine]
    if (items.length === 0) {
      lines.push("No urgent items today. Your academy is running smoothly.")
    } else {
      lines.push(`Today's ${items.length === 1 ? 'priority' : `top ${Math.min(items.length, 5)} priorities`}:`)
      items.slice(0, 5).forEach((item, i) => {
        lines.push(`${i + 1}. ${item.headline}.`)
      })
    }
    lines.push(closingQuestion)
    return lines.join('\n')
  }

  return {
    generatedAt:     new Date().toISOString(),
    openingLine,
    hasCritical,
    items,
    closingQuestion,
    asText,
  }
}
