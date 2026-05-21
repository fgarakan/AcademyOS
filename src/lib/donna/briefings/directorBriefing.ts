// Sprint 464 — DONNA Director COO Briefing V1
// Assembles the director's daily briefing from pre-fetched data.
// Pure assembly — no DB calls, no AI calls. Server-side only.

// ── Briefing types ────────────────────────────────────────────────────────────

export interface BriefingSection {
  id: string
  label: string
  value: string | number | null
  status: 'ok' | 'attention' | 'urgent' | 'no_data'
  action?: string      // suggested next action label
  href?: string        // link to relevant page
}

export interface DirectorDailyBriefing {
  generatedAt: string
  headline: string
  urgentCount: number
  sections: BriefingSection[]
  suggestedFirstAction: string | null
  suggestedFirstActionHref: string | null
}

// ── Briefing assembler ────────────────────────────────────────────────────────

export function buildDirectorDailyBriefing(params: {
  todaySessionCount: number
  missingRecapCount: number
  pendingApprovalCount: number
  highRiskSignalCount: number
  missingParentDraftCount: number
  curriculumGapCount: number
  playersPendingPlacement: number
  coachesWithNoRecentRecap: number
  lastUpdatedAt?: string
}): DirectorDailyBriefing {
  const sections: BriefingSection[] = [
    {
      id: 'sessions_today',
      label: "Today's sessions",
      value: params.todaySessionCount,
      status: params.todaySessionCount === 0 ? 'no_data' : 'ok',
      href: '/director/today',
    },
    {
      id: 'missing_recaps',
      label: 'Missing recaps',
      value: params.missingRecapCount,
      status: params.missingRecapCount === 0 ? 'ok' : params.missingRecapCount >= 3 ? 'urgent' : 'attention',
      action: params.missingRecapCount > 0 ? 'View session list' : undefined,
      href: params.missingRecapCount > 0 ? '/director/sessions' : undefined,
    },
    {
      id: 'pending_approvals',
      label: 'Pending approvals',
      value: params.pendingApprovalCount,
      status: params.pendingApprovalCount === 0 ? 'ok' : params.pendingApprovalCount >= 5 ? 'urgent' : 'attention',
      action: params.pendingApprovalCount > 0 ? 'Open review queue' : undefined,
      href: params.pendingApprovalCount > 0 ? '/director/review' : undefined,
    },
    {
      id: 'high_risk_signals',
      label: 'High-risk player signals',
      value: params.highRiskSignalCount,
      status: params.highRiskSignalCount === 0 ? 'ok' : 'urgent',
      action: params.highRiskSignalCount > 0 ? 'View signals' : undefined,
      href: params.highRiskSignalCount > 0 ? '/director/signals' : undefined,
    },
    {
      id: 'parent_drafts',
      label: 'Parent drafts awaiting review',
      value: params.missingParentDraftCount,
      status: params.missingParentDraftCount === 0 ? 'ok' : 'attention',
      action: params.missingParentDraftCount > 0 ? 'Review parent queue' : undefined,
      href: params.missingParentDraftCount > 0 ? '/director/review' : undefined,
    },
    {
      id: 'curriculum_gaps',
      label: 'Curriculum gaps detected',
      value: params.curriculumGapCount,
      status: params.curriculumGapCount === 0 ? 'ok' : 'attention',
      action: params.curriculumGapCount > 0 ? 'View curriculum' : undefined,
      href: params.curriculumGapCount > 0 ? '/director/curriculum/builder' : undefined,
    },
    {
      id: 'pending_placement',
      label: 'Players pending placement',
      value: params.playersPendingPlacement,
      status: params.playersPendingPlacement === 0 ? 'ok' : 'attention',
      action: params.playersPendingPlacement > 0 ? 'View placement queue' : undefined,
      href: params.playersPendingPlacement > 0 ? '/director/players' : undefined,
    },
  ]

  const urgentSections = sections.filter(s => s.status === 'urgent')
  const attentionSections = sections.filter(s => s.status === 'attention')
  const urgentCount = urgentSections.length

  const headline = buildBriefingHeadline({
    urgentCount,
    attentionCount: attentionSections.length,
    pendingApprovalCount: params.pendingApprovalCount,
    todaySessionCount: params.todaySessionCount,
  })

  // Suggested first action: most urgent unfilled item
  const firstSection = urgentSections[0] ?? attentionSections[0]

  return {
    generatedAt: new Date().toISOString(),
    headline,
    urgentCount,
    sections,
    suggestedFirstAction: firstSection?.action ?? null,
    suggestedFirstActionHref: firstSection?.href ?? null,
  }
}

function buildBriefingHeadline(params: {
  urgentCount: number
  attentionCount: number
  pendingApprovalCount: number
  todaySessionCount: number
}): string {
  if (params.urgentCount > 0) {
    return `${params.urgentCount} urgent item${params.urgentCount > 1 ? 's' : ''} need your attention.`
  }
  if (params.attentionCount > 0) {
    return `${params.attentionCount} item${params.attentionCount > 1 ? 's' : ''} worth reviewing today.`
  }
  if (params.pendingApprovalCount === 0 && params.todaySessionCount > 0) {
    return `${params.todaySessionCount} session${params.todaySessionCount > 1 ? 's' : ''} today and everything is on track.`
  }
  return "Academy looks good today."
}

// ── Briefing summary line ─────────────────────────────────────────────────────

export function getBriefingSummaryLine(briefing: DirectorDailyBriefing): string {
  const urgent = briefing.sections.filter(s => s.status === 'urgent')
  const attention = briefing.sections.filter(s => s.status === 'attention')
  if (urgent.length > 0) return urgent.map(s => s.label).join(', ') + ' need urgent attention.'
  if (attention.length > 0) return attention.map(s => s.label).join(', ') + ' are worth reviewing.'
  return 'Everything looks healthy.'
}
