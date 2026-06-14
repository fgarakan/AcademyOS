// Mega Sprint 2591–2620 — DONNA Proactive COO + Overnight Intelligence V1
// Morning Brief Engine: instant answer to "What do I need to do today?"
//
// Pure TypeScript — no DB, no API, no side effects.
// Input:  AcademyDailySnapshot (already built from existing engine outputs)
// Output: MorningBrief — structured greeting + "if only one thing" + top 3
//
// Design: DONNA speaks first, not in response to a question.

import type { AcademyDailySnapshot } from './academyDailySnapshot'

// ── Output type ────────────────────────────────────────────────────────────────

export interface MorningBrief {
  greeting:       string
  headline:       string
  ifOnlyOneThing: string
  top3: Array<{
    rank:    number
    title:   string
    urgency: string
    route:   string | null
  }>
  whatChanged:    string
  healthLabel:    string
  navigationHint: string | null
}

// ── Health label ───────────────────────────────────────────────────────────────

function buildHealthLabel(snapshot: AcademyDailySnapshot): string {
  if (snapshot.healthSignal === 'healthy')         return 'Healthy'
  if (snapshot.healthSignal === 'stable')          return 'Stable'
  if (snapshot.healthSignal === 'needs_attention') return 'Needs Attention'
  if (snapshot.healthSignal === 'critical')        return 'Critical'
  return 'No Data'
}

// ── Greeting ───────────────────────────────────────────────────────────────────

function buildGreeting(firstName: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${firstName}.`
  if (hour < 17) return `Good afternoon, ${firstName}.`
  return `Good evening, ${firstName}.`
}

// ── Headline ──────────────────────────────────────────────────────────────────

function buildHeadline(snapshot: AcademyDailySnapshot): string {
  const { attentionCount, advancementCount, pendingActionsCount, healthSignal } = snapshot

  if (healthSignal === 'critical') {
    return `The academy needs immediate attention — ${attentionCount} player${attentionCount !== 1 ? 's' : ''} flagged.`
  }
  if (healthSignal === 'needs_attention') {
    const parts: string[] = []
    if (attentionCount > 0)      parts.push(`${attentionCount} player${attentionCount !== 1 ? 's' : ''} need your attention`)
    if (pendingActionsCount > 0) parts.push(`${pendingActionsCount} action${pendingActionsCount !== 1 ? 's' : ''} pending`)
    return parts.length > 0 ? `${parts.join(' · ')}.` : 'A few things need your review today.'
  }
  if (healthSignal === 'healthy') {
    const parts: string[] = []
    if (advancementCount > 0) parts.push(`${advancementCount} ready to advance`)
    return parts.length > 0
      ? `Academy momentum is strong — ${parts.join(', ')}.`
      : 'Academy is running well — no urgent flags today.'
  }
  if (healthSignal === 'stable') {
    if (pendingActionsCount > 0) return `Academy is stable — ${pendingActionsCount} action${pendingActionsCount !== 1 ? 's' : ''} waiting for your review.`
    return 'Academy is stable — no urgent flags today.'
  }
  return 'Academy data loading — check back shortly.'
}

// ── If only one thing ─────────────────────────────────────────────────────────

function buildIfOnlyOneThing(snapshot: AcademyDailySnapshot): string {
  const top = snapshot.topPriorities[0]
  if (!top) {
    if (snapshot.topOpportunity) {
      return `If you only do one thing: review ${snapshot.topOpportunity.label}.`
    }
    return 'Everything is clear — use this time for a proactive coach check-in.'
  }

  const urgencyWord = top.urgency === 'critical' ? 'urgently' : top.urgency === 'high' ? 'today' : 'this week'
  return `If you only do one thing: ${top.title} — needs your review ${urgencyWord}.`
}

// ── What changed ───────────────────────────────────────────────────────────────

function buildWhatChangedText(snapshot: AcademyDailySnapshot): string {
  const changes = snapshot.whatChanged?.changes ?? []
  if (changes.length === 0) return 'No significant changes since your last visit.'

  const lines = changes.slice(0, 3).map(c => `• ${c.headline}`)
  const suffix = changes.length > 3 ? `\n  +${changes.length - 3} more` : ''
  return lines.join('\n') + suffix
}

// ── Navigation hint ────────────────────────────────────────────────────────────

function buildNavigationHint(snapshot: AcademyDailySnapshot): string | null {
  if (snapshot.pendingActionsCount > 0) return '/director/review'
  if (snapshot.topPriorities[0]?.route)  return snapshot.topPriorities[0].route
  if (snapshot.topRisk?.route)           return snapshot.topRisk.route
  return null
}

// ── Main export ────────────────────────────────────────────────────────────────

export function buildMorningBrief(snapshot: AcademyDailySnapshot): MorningBrief {
  const firstName = snapshot.directorFirstName || 'Director'

  return {
    greeting:       buildGreeting(firstName),
    headline:       buildHeadline(snapshot),
    ifOnlyOneThing: buildIfOnlyOneThing(snapshot),
    top3: snapshot.topPriorities.map((p, i) => ({
      rank:    i + 1,
      title:   p.title,
      urgency: p.urgency,
      route:   p.route,
    })),
    whatChanged:    buildWhatChangedText(snapshot),
    healthLabel:    buildHealthLabel(snapshot),
    navigationHint: buildNavigationHint(snapshot),
  }
}

// ── DONNA conversational answer ────────────────────────────────────────────────

export function buildMorningBriefAnswer(brief: MorningBrief): string {
  const lines: string[] = [
    brief.greeting,
    '',
    `**Academy Health:** ${brief.healthLabel}`,
    brief.headline,
    '',
    `**${brief.ifOnlyOneThing}**`,
  ]

  if (brief.top3.length > 0) {
    lines.push('')
    lines.push('**Top priorities today:**')
    for (const p of brief.top3) {
      const badge = p.urgency === 'critical' ? '[CRITICAL]' : p.urgency === 'high' ? '[URGENT]' : p.urgency === 'medium' ? '[IMPORTANT]' : '[LOW]'
      lines.push(`${p.rank}. ${badge} ${p.title}`)
    }
  }

  if (brief.whatChanged && brief.whatChanged !== 'No significant changes since your last visit.') {
    lines.push('')
    lines.push('**What changed:**')
    lines.push(brief.whatChanged)
  }

  return lines.join('\n')
}
