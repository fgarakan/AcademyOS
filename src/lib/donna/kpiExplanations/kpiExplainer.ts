// Sprint 466 — DONNA KPI Explanation Engine V1
// Generates human-readable explanations for KPI changes.
// Pure logic — no DB calls, no AI calls.

import type { AcademyKpiId, KpiValue, KpiStatus } from '@/lib/kpis/academyKpiModel'
import { ACADEMY_KPI_META } from '@/lib/kpis/academyKpiModel'

export interface KpiExplanation {
  kpiId: AcademyKpiId
  headline: string
  whatChanged: string
  whyItMatters: string
  evidence: string | null
  recommendedNextAction: string
  nextActionHref: string | null
  confidence: 'high' | 'partial' | 'low'
  dataLimitation: string | null
}

// ── Per-KPI explanation templates ─────────────────────────────────────────────

const KPI_EXPLANATIONS: Record<
  AcademyKpiId,
  {
    healthy: { headline: string; whyItMatters: string; action: string; href: string | null }
    warning: { headline: string; whyItMatters: string; action: string; href: string | null }
    critical: { headline: string; whyItMatters: string; action: string; href: string | null }
  }
> = {
  attendance_rate: {
    healthy: {
      headline: 'Attendance is strong',
      whyItMatters: 'High attendance means players are engaged and coaches can build on continuity.',
      action: 'Keep reviewing session notes for patterns',
      href: '/director/sessions',
    },
    warning: {
      headline: 'Attendance is below target',
      whyItMatters: 'Players missing sessions fall behind their peers and disrupt group cohesion.',
      action: 'Review attendance by group and identify patterns',
      href: '/director/sessions',
    },
    critical: {
      headline: 'Attendance is critically low',
      whyItMatters: 'Persistent low attendance signals disengagement, scheduling conflicts, or coach issues.',
      action: 'Ask DONNA to surface the affected groups and players',
      href: '/director/donna',
    },
  },
  recap_completion_rate: {
    healthy: {
      headline: 'Coaches are completing recaps consistently',
      whyItMatters: 'Recaps generate the evidence and observations that power player priorities, parent summaries, and curriculum signals.',
      action: 'Review recent recaps for curriculum ideas',
      href: '/director/sessions',
    },
    warning: {
      headline: 'Some sessions are missing recaps',
      whyItMatters: 'Missing recaps mean lost coaching observations that cannot be recovered.',
      action: 'Remind coaches to complete outstanding recaps',
      href: '/director/sessions',
    },
    critical: {
      headline: 'Recap completion is critically low',
      whyItMatters: 'Without recaps, the academy operates blind — no observations, no parent updates, no curriculum signals.',
      action: 'Identify which coaches are missing recaps and follow up',
      href: '/director/coaches',
    },
  },
  player_priority_coverage: {
    healthy: {
      headline: 'Player priorities are well-covered',
      whyItMatters: 'Active priorities mean coaches have clear development targets for every player.',
      action: 'Review priority quality — are priorities specific and trackable?',
      href: '/director/players',
    },
    warning: {
      headline: 'Some players lack active priorities',
      whyItMatters: 'Players without priorities may be drifting without a clear development focus.',
      action: 'Ask DONNA which players are missing priorities',
      href: '/director/donna',
    },
    critical: {
      headline: 'Most players have no active priorities',
      whyItMatters: 'Without priorities, coaching is reactive rather than developmental.',
      action: 'Run a priority generation sweep with DONNA',
      href: '/director/donna',
    },
  },
  parent_summary_freshness: {
    healthy: {
      headline: 'Parent summaries are up to date',
      whyItMatters: 'Fresh parent summaries build trust and keep families engaged in the development process.',
      action: 'Review pending parent summary approvals',
      href: '/director/review',
    },
    warning: {
      headline: 'Some parent summaries are stale',
      whyItMatters: 'Stale summaries create gaps in parent communication and reduce family engagement.',
      action: 'Review which players need updated parent summaries',
      href: '/director/players',
    },
    critical: {
      headline: 'Parent communication is significantly behind',
      whyItMatters: 'Parents who receive no updates disengage and may question the academy\'s care.',
      action: 'Draft parent summaries for the most overdue players',
      href: '/director/donna',
    },
  },
  curriculum_coverage: {
    healthy: {
      headline: 'Curriculum is well-covered by evidence',
      whyItMatters: 'High evidence coverage means coaches are systematically working through the curriculum.',
      action: 'Review requirements nearing completion for level advancement',
      href: '/director/curriculum/builder',
    },
    warning: {
      headline: 'Some curriculum requirements lack evidence',
      whyItMatters: 'Gaps in evidence may mean curriculum requirements are not being addressed in sessions.',
      action: 'Review curriculum coverage gaps and align templates',
      href: '/director/curriculum/builder',
    },
    critical: {
      headline: 'Curriculum is largely uncovered by evidence',
      whyItMatters: 'The academy curriculum is not being systematically tracked in session coaching.',
      action: 'Ask DONNA to identify which levels need the most attention',
      href: '/director/donna',
    },
  },
  template_usage_rate: {
    healthy: { headline: 'Templates are being used consistently', whyItMatters: 'Template usage drives curriculum alignment across coaches.', action: 'Review template coverage by level', href: '/director/templates' },
    warning: { headline: 'Template usage is below target', whyItMatters: 'Low template usage may mean sessions are unstructured or curriculum-disconnected.', action: 'Review which groups are not using templates', href: '/director/sessions' },
    critical: { headline: 'Very few sessions use templates', whyItMatters: 'Sessions without templates are difficult to align to curriculum and harder to evaluate.', action: 'Identify coaches with lowest template usage', href: '/director/coaches' },
  },
  coach_followthrough_rate: {
    healthy: { headline: 'Coach follow-through is strong', whyItMatters: 'Coaches are addressing the priorities they identify, building player trust.', action: 'Review top performers for recognition', href: '/director/coaches' },
    warning: { headline: 'Coach follow-through needs attention', whyItMatters: 'Identified priorities are not being revisited, reducing their developmental impact.', action: 'Check which coaches have open priorities older than 4 weeks', href: '/director/coaches' },
    critical: { headline: 'Coach follow-through is low', whyItMatters: 'Players may feel their priorities are not taken seriously if coaches do not revisit them.', action: 'Schedule coach brief to review outstanding priorities', href: '/director/donna' },
  },
  player_progress_velocity: {
    healthy: { headline: 'Players are progressing well', whyItMatters: 'Good velocity means the curriculum path is clear and coaches are driving achievement.', action: 'Identify top performers for level advancement review', href: '/director/players' },
    warning: { headline: 'Player progress velocity is slowing', whyItMatters: 'Slower progress may indicate curriculum gaps, low session volume, or stalled priorities.', action: 'Ask DONNA which players are stalling', href: '/director/donna' },
    critical: { headline: 'Player progress has largely stalled', whyItMatters: 'Without measurable progress, players and parents lose confidence in the development program.', action: 'Review curriculum evidence gaps and coach recap quality', href: '/director/curriculum/builder' },
  },
  level_readiness_queue_size: {
    healthy: { headline: 'No players are waiting for level review', whyItMatters: 'Players advance on time when decisions are made promptly.', action: 'Check for players approaching readiness', href: '/director/players' },
    warning: { headline: 'Some players are ready for level review', whyItMatters: 'Delayed level decisions can demotivate advanced players.', action: 'Review level readiness queue', href: '/director/players' },
    critical: { headline: 'Level readiness queue is backing up', whyItMatters: 'Multiple players waiting for advancement signals a bottleneck in the review process.', action: 'Prioritize level advancement reviews this week', href: '/director/players' },
  },
  mission_completion_rate: {
    healthy: { headline: 'Missions are being completed', whyItMatters: 'Mission completion drives player motivation and curriculum adherence.', action: 'Review mission difficulty and add new missions', href: '/director/curriculum/builder' },
    warning: { headline: 'Mission completion is below target', whyItMatters: 'Incomplete missions may signal missions are too difficult or poorly framed.', action: 'Review mission content and player feedback', href: '/director/curriculum/builder' },
    critical: { headline: 'Missions are not being completed', whyItMatters: 'Low completion undermines the mission system as a developmental tool.', action: 'Review and simplify the most overdue missions', href: '/director/curriculum/builder' },
  },
  badge_progress_rate: {
    healthy: { headline: 'Badge progress is healthy', whyItMatters: 'Badges motivate players and make curriculum achievement visible.', action: 'Review badges near completion for approval', href: '/director/review' },
    warning: { headline: 'Badge progress is below target', whyItMatters: 'Low badge progress may mean evidence collection is not connected to badge criteria.', action: 'Review badge criteria alignment with session evidence', href: '/director/curriculum/builder' },
    critical: { headline: 'Very few players are progressing on badges', whyItMatters: 'The badge system is not being used as a motivational and achievement tracking tool.', action: 'Ask DONNA to identify evidence-to-badge gaps', href: '/director/donna' },
  },
  mental_performance_coverage: {
    healthy: { headline: 'Mental performance is well-represented', whyItMatters: 'Covering mental performance creates well-rounded, competition-ready players.', action: 'Review which mental subcategories are covered', href: '/director/curriculum/builder' },
    warning: { headline: 'Mental performance coverage needs improvement', whyItMatters: 'Players without mental performance support are less equipped for competition pressure.', action: 'Ask DONNA to suggest mental performance priorities', href: '/director/donna' },
    critical: { headline: 'Mental performance is nearly absent from coaching', whyItMatters: 'No mental performance work leaves a major developmental gap in player preparation.', action: 'Add mental performance pathway to active curriculum', href: '/director/curriculum/builder' },
  },
}

// ── Main explainer function ────────────────────────────────────────────────────

export function explainKpi(kpiValue: KpiValue): KpiExplanation {
  const meta = ACADEMY_KPI_META[kpiValue.id]
  const status = kpiValue.status as 'healthy' | 'warning' | 'critical'

  if (kpiValue.status === 'no_data') {
    return {
      kpiId: kpiValue.id,
      headline: `${meta.label}: No data`,
      whatChanged: 'No data is available for this KPI yet.',
      whyItMatters: meta.description,
      evidence: null,
      recommendedNextAction: 'Ensure sessions are being completed and wrapped up with recaps.',
      nextActionHref: '/director/sessions',
      confidence: 'low',
      dataLimitation: meta.unavailableReason ?? 'Insufficient data to calculate this KPI.',
    }
  }

  const template = KPI_EXPLANATIONS[kpiValue.id][status]
  const delta = kpiValue.trendDelta
  const trendText = kpiValue.trend === 'up'
    ? ` (up ${delta !== null && delta !== undefined ? Math.abs(delta).toFixed(1) : '—'} from last week)`
    : kpiValue.trend === 'down'
    ? ` (down ${delta !== null && delta !== undefined ? Math.abs(delta).toFixed(1) : '—'} from last week)`
    : ''

  return {
    kpiId: kpiValue.id,
    headline: template.headline,
    whatChanged: `${meta.label} is ${kpiValue.formattedValue}${trendText}.`,
    whyItMatters: template.whyItMatters,
    evidence: kpiValue.formattedValue !== '—' ? `Current value: ${kpiValue.formattedValue}` : null,
    recommendedNextAction: template.action,
    nextActionHref: template.href,
    confidence: meta.availability === 'live' ? 'high' : meta.availability === 'partial' ? 'partial' : 'low',
    dataLimitation: meta.unavailableReason ?? null,
  }
}

export function explainAllKpis(values: KpiValue[]): KpiExplanation[] {
  return values.map(explainKpi)
}
