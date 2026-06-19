// Mega Sprint 3001–3030 — DONNA Strategic AI Augmentation V1
// Part 4 — Strategic Context Builder
//
// Builds minimum non-PII context packets per strategic domain for use in the
// OpenAI teacher call. Describes signals, framing, and recommended data points.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Never includes player names, parent emails, assessment scores, or raw notes.
//   - Context is framing + signal schema only — helps OpenAI understand the domain.
//   - Actual live data is fetched by the server action and passed as academyDNAContext.
//   - formatContextForTeacher() caps output at 250 chars — safe for teacher academyContext.

import type { StrategicAIDomain } from './donnaStrategicAIEligibility'
import type { LivePageState } from '@/lib/donna/operating/livePageState'
// Mega Sprint 3151–3180 — Reality Synchronization Engine V1
import type { RealitySnapshot } from '@/lib/donna/reality/realitySnapshot'
import { formatSnapshotForAI } from '@/lib/donna/reality/realityAdapter'

// ── Context packet ────────────────────────────────────────────────────────────

export interface StrategicContextPacket {
  domain: StrategicAIDomain
  domainLabel: string
  signalsToConsider: string[]
  framingContext: string
  recommendedDataPoints: string[]
  privacyNote: string
}

// ── Domain definitions ────────────────────────────────────────────────────────

type DomainBase = Omit<StrategicContextPacket, 'domain' | 'privacyNote'>

const DOMAIN_CONTEXT: Record<StrategicAIDomain, DomainBase> = {
  retention_analysis: {
    domainLabel: 'Retention Analysis',
    signalsToConsider: [
      'Enrollment trend (growing / flat / shrinking)',
      'Attendance drop-off patterns by group',
      'Progression delays (players stuck at same level)',
      'Parent communication frequency gaps',
      'Assessment gaps (overdue or missed assessments)',
    ],
    framingContext: 'Tennis academy retention is driven by visible progress, parent confidence, and coach engagement. Families disengage when progress is invisible, communication is absent, or expectations go unmet.',
    recommendedDataPoints: [
      'Groups with attendance below 70%',
      'Players without a level change in 6+ months',
      'Players with no recent assessment',
      'Parent update frequency per family',
    ],
  },

  curriculum_design: {
    domainLabel: 'Curriculum Design',
    signalsToConsider: [
      'Academy DNA model (performance / participation / pathway)',
      'Level structure and ball-stage progressions',
      'Progression criteria and standards per level',
      'Content gaps by domain (technical, tactical, physical, mental)',
      'Coach alignment to curriculum standards',
    ],
    framingContext: 'Curriculum design must align to the academy DNA model, match the age/stage of players, and provide clear progression criteria that coaches can apply consistently.',
    recommendedDataPoints: [
      'Academy DNA model label',
      'Level definitions and criteria',
      'Current curriculum coverage gaps',
      'Coach curriculum alignment rate',
    ],
  },

  summer_camp_planning: {
    domainLabel: 'Summer Camp Planning',
    signalsToConsider: [
      'Age group and level distribution of enrolled players',
      'Facility constraints and court capacity',
      'Academy DNA priorities for the summer program',
      'Heat and weather constraints',
      'Historical summer attendance and dropout patterns',
    ],
    framingContext: 'Summer camp planning requires balancing age-appropriate programming, heat management, facility capacity, and curriculum alignment to the academy DNA.',
    recommendedDataPoints: [
      'Player age and level breakdown',
      'Available courts and timing windows',
      'Academy DNA priorities for summer',
      'Previous summer participation rates',
    ],
  },

  staffing_decisions: {
    domainLabel: 'Staffing Decisions',
    signalsToConsider: [
      'Coach-to-player ratios by group',
      'Coach session coverage and availability',
      'Coach performance signals (recap completion, observation quality)',
      'Groups with coverage gaps or overloaded coaches',
      'Coach role definitions and responsibilities',
    ],
    framingContext: 'Effective staffing aligns coach expertise to player development stage, maintains healthy ratios, and ensures every group has clear coach ownership.',
    recommendedDataPoints: [
      'Coach roster and assigned groups',
      'Groups without an assigned coach',
      'Coach session load vs. capacity',
      'Groups with performance signal gaps',
    ],
  },

  player_development_reasoning: {
    domainLabel: 'Player Development Reasoning',
    signalsToConsider: [
      'Player progression timeline vs. expected pace',
      'Domain balance (technical, tactical, physical, mental)',
      'Assessment frequency and recency',
      'Long-term development pathway alignment',
      'Academy DNA development philosophy',
    ],
    framingContext: 'Player development follows a staged pathway aligned to the academy DNA. Progress is multi-dimensional — technical, tactical, physical, and mental competencies all matter.',
    recommendedDataPoints: [
      'Assessment scores by domain',
      'Time at current level vs. expected progression',
      'Development milestone completion rate',
      'Coach observation quality and recency',
    ],
  },

  parent_communication_strategy: {
    domainLabel: 'Parent Communication Strategy',
    signalsToConsider: [
      'Parent communication frequency gaps',
      'Parent-visible progress indicators',
      'At-risk families (low communication + low progression)',
      'Communication channel preferences',
      'Parent satisfaction proxy signals',
    ],
    framingContext: 'Parent confidence is built through visible progress, regular updates, clear goal-setting, and coach accessibility. Communication gaps are a leading indicator of churn.',
    recommendedDataPoints: [
      'Time since last parent update per family',
      'Parent-visible assessment completions',
      'Families with attendance concerns but no outreach',
      'Groups with coach communication gaps',
    ],
  },

  coach_performance_analysis: {
    domainLabel: 'Coach Performance Analysis',
    signalsToConsider: [
      'Recap completion rate and quality',
      'Observation frequency per player',
      'Player progression rates in coached groups',
      'Parent communication from coach',
      'Session structure and focus alignment to curriculum',
    ],
    framingContext: 'Coach performance is evaluated by execution quality (recap completion, observation depth), player outcomes (progression rates), and relationship quality (parent confidence).',
    recommendedDataPoints: [
      'Coach recap completion rates',
      'Average observations per player per month',
      'Player progression rates by coach group',
      'Parent update frequency by coach',
    ],
  },

  program_growth: {
    domainLabel: 'Program Growth',
    signalsToConsider: [
      'Current enrollment vs. capacity',
      'Enrollment trend over past 6 months',
      'Group fill rates and waitlist status',
      'Player retention rate and success stories',
      'Academy DNA differentiation vs. local alternatives',
    ],
    framingContext: 'Program growth comes from visible player outcomes, parent word-of-mouth, and a clear differentiated value proposition aligned to the academy DNA.',
    recommendedDataPoints: [
      'Total enrollment vs. capacity',
      'Enrollment trend (growing / flat / shrinking)',
      'Groups at or near capacity',
      'Player retention rate over 12 months',
    ],
  },

  academy_operations: {
    domainLabel: 'Academy Operations',
    signalsToConsider: [
      'Session scheduling efficiency',
      'Group utilization and capacity management',
      'Coach scheduling and coverage completeness',
      'Review queue backlog (pending approvals)',
      'Curriculum delivery consistency',
    ],
    framingContext: 'Operational efficiency is measured by scheduling reliability, group capacity utilization, approval queue velocity, and curriculum delivery consistency.',
    recommendedDataPoints: [
      'Pending review queue volume',
      'Groups with scheduling gaps',
      'Session completion rate',
      'Coach coverage utilization',
    ],
  },

  academy_strategy: {
    domainLabel: 'Academy Strategy',
    signalsToConsider: [
      'Academy DNA model and philosophy alignment',
      'Current enrollment and growth trajectory',
      'Key program strengths and constraints',
      'Director priority areas and goals',
      'Competitive differentiation',
    ],
    framingContext: 'Academy strategy centers on the DNA model, differentiation, and sustainable growth — balancing player development quality with enrollment health.',
    recommendedDataPoints: [
      'Academy DNA model label',
      'Enrollment trend and trajectory',
      'Key program differentiators',
      'Current priority gaps by area',
    ],
  },

  academy_health_analysis: {
    domainLabel: 'Academy Health Analysis',
    signalsToConsider: [
      'Overall enrollment vs. capacity',
      'Retention rate trends',
      'Progression velocity across all levels',
      'Coach utilization and coverage',
      'Operational queue health (pending approvals)',
    ],
    framingContext: 'Academy health is a composite signal: enrollment, retention, progression, coach quality, and operational efficiency all contribute. No single metric tells the full story.',
    recommendedDataPoints: [
      'Total enrollment and capacity',
      'Retention rate (90-day rolling)',
      'Groups with health alerts',
      'Approval queue velocity',
    ],
  },
}

// ── Builder ───────────────────────────────────────────────────────────────────

/**
 * Build a strategic context packet for the given domain.
 * Returns signals, framing, and data points — never raw PII.
 */
export function buildStrategicContextPacket(
  domain: StrategicAIDomain,
  academyDNAContext: string | null,
): StrategicContextPacket {
  const base = DOMAIN_CONTEXT[domain]

  return {
    domain,
    domainLabel: base.domainLabel,
    signalsToConsider: base.signalsToConsider,
    framingContext: academyDNAContext
      ? `${base.framingContext} Academy: ${academyDNAContext}`
      : base.framingContext,
    recommendedDataPoints: base.recommendedDataPoints,
    privacyNote: 'No player names, parent emails, assessment scores, or raw notes included.',
  }
}

/**
 * Format the context packet as a concise string for the teacher's academyContext field.
 * Capped at 250 chars — safe for the OpenAI teacher call.
 *
 * @param pageContext - Optional page context from PageIntelligence (injected by AI brain).
 * @param liveState   - Optional raw live state (legacy path, used when no snapshot available).
 * @param snapshot    - Optional reality snapshot (preferred — only fresh signals emitted).
 *                      When both liveState and snapshot are provided, snapshot takes precedence.
 */
export function formatContextForTeacher(
  packet: StrategicContextPacket,
  userQuestion: string,
  pageContext?: string,
  liveState?: LivePageState | null,
  snapshot?: RealitySnapshot | null,
): string {
  const topSignals = packet.signalsToConsider.slice(0, 3).join('; ')
  const pageStr = pageContext ? ` | Page: ${pageContext.slice(0, 80)}` : ''
  // Prefer snapshot (freshness-aware) over raw live state
  const snapshotStr = snapshot ? formatSnapshotForAI(snapshot) : ''
  const liveStr = snapshotStr ? ` | ${snapshotStr}` : formatLiveSignals(liveState)
  const raw = `Domain: ${packet.domainLabel}. Signals: ${topSignals}. Question: ${userQuestion}${pageStr}${liveStr}`
  return raw.slice(0, 250)
}

function formatLiveSignals(live: LivePageState | null | undefined): string {
  if (!live) return ''
  const parts: string[] = []
  if (live.pendingReviewCount !== null) parts.push(`pending=${live.pendingReviewCount}`)
  if (live.playersMissingCurriculumLevel !== null) parts.push(`missing-levels=${live.playersMissingCurriculumLevel}`)
  if (live.levelUpQueueCount !== null) parts.push(`level-up-queue=${live.levelUpQueueCount}`)
  if (live.placementQueueCount !== null) parts.push(`placement-queue=${live.placementQueueCount}`)
  if (live.curriculumSpineActive !== null) parts.push(`spine=${live.curriculumSpineActive ? 'active' : 'inactive'}`)
  if (parts.length === 0) return ''
  return ` | Live: ${parts.join(', ')}`
}
