// Mega Sprint 1565–1594 — DONNA Decision Execution Engine V1
// Maps attention items and director decisions to structured execution plans.
// Also handles conversational execution intent detection and response.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Plans are recommendation-only. DONNA never mutates through this layer.
//   - approvalRequired = true on all mutation-linked plans.
//   - All execution paths route through existing /director/review flows.

import type { DirectorAttentionItem } from '@/lib/donna/today/directorAttentionEngine'
import type {
  DecisionExecutionPlan,
  DecisionExecutionType,
  DecisionLike,
  ExecutionAction,
  ExecutionIntentType,
} from './donnaDecisionExecutionTypes'

// ── Helpers ────────────────────────────────────────────────────────────────────

function reviewAction(label = 'Open review queue'): ExecutionAction {
  return { label, href: '/director/review', isPrimary: true, requiresApproval: true }
}

function navAction(label: string, href: string): ExecutionAction {
  return { label, href, isPrimary: false, requiresApproval: false }
}

function askDonnaAction(prompt: string): ExecutionAction {
  return { label: `Ask DONNA: "${prompt}"`, href: `donna:${prompt}`, isPrimary: false, requiresApproval: false }
}

// ── Attention item → execution plan ───────────────────────────────────────────

// Maps each attention item id to a DecisionExecutionPlan.
// The item already carries headline, synthesis, actionHref, and domain.
// The plan enriches with recommendation, confidence, evidence, risks, and actions.
export function buildExecutionPlanForAttentionItem(
  item: DirectorAttentionItem,
): DecisionExecutionPlan {
  switch (item.id) {

    // ── Approval domain ──────────────────────────────────────────────────────────
    case 'stale-review-queue':
      return {
        id:                item.id,
        type:              'assessment_review',
        headline:          'Clear the oldest pending approvals first',
        recommendation:    'Open the review queue sorted by age. Work through the oldest items — even approving or rejecting 2–3 unblocks downstream workflows.',
        confidence:        'high',
        evidence:          [
          'Items in the review queue are dated by creation time',
          'Stale queue items (7+ days) block coach recaps, placement finalisation, and parent updates',
        ],
        risks:             [
          'Coaches stop submitting recaps if reviews are never processed',
          'Parents receive no updates while parent communication drafts sit unapproved',
        ],
        actions:           [reviewAction('Open review queue'), askDonnaAction('What is oldest in the review queue?')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'All proposed actions require director review before execution.',
      }

    case 'assessments-review':
      return {
        id:                item.id,
        type:              'assessment_review',
        headline:          'Review and approve pending assessment drafts',
        recommendation:    'Open the Assessments tab in the review queue. Approve results that are accurate; reject or request clarification for anything unclear.',
        confidence:        'high',
        evidence:          [
          'Assessment drafts exist in proposed_actions with status pending_review',
          'Assessments are required before advancement decisions can be confirmed',
        ],
        risks:             [
          'Unapproved assessment results cannot be recorded against player curriculum states',
          'Advancement decisions made without recent assessments increase wrong-level placement risk',
        ],
        actions:           [reviewAction('Review assessments'), askDonnaAction('Which players need assessment review?')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'Assessment results are only recorded after director approval — DONNA never auto-approves.',
      }

    case 'placements-review':
      return {
        id:                item.id,
        type:              'placement_review',
        headline:          'Confirm group placement for new players',
        recommendation:    'Review placement recommendations in the review queue. Approve players into the recommended group or reassign them if the recommendation is wrong.',
        confidence:        'high',
        evidence:          [
          'Placement review records exist in proposed_actions with status pending_review',
          'Players in pending placement status cannot attend sessions or receive curriculum',
        ],
        risks:             [
          'Players in pending_placement cannot be assigned to groups or receive structured curriculum',
          'Delayed placement decisions create a poor first impression for new players and their families',
        ],
        actions:           [reviewAction('Review placements'), askDonnaAction('Which players are waiting for placement?')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'Player placement requires director confirmation — finalize_player_placement() is the only activation path.',
      }

    case 'wrap-ups-review':
      return {
        id:                item.id,
        type:              'assessment_review',
        headline:          'Review coach session recaps',
        recommendation:    'Open the Wrap-ups tab. Focus on recaps flagged with attendance exceptions or observations — approve to confirm, reject or request clarification if concerns exist.',
        confidence:        'high',
        evidence:          [
          'Session wrap-up proposed_actions are in pending_review status',
          'Wrap-ups may contain attendance exceptions requiring director confirmation',
        ],
        risks:             [
          'Unreviewed recaps leave attendance exceptions unresolved',
          'Coaches lose motivation to submit recaps if they are never reviewed',
        ],
        actions:           [reviewAction('Review recaps'), navAction('View sessions', '/director/sessions')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'Wrap-up approval records the official session outcome — changes require director sign-off.',
      }

    case 'parent-updates-review':
      return {
        id:                item.id,
        type:              'parent_update_review',
        headline:          'Approve parent communication drafts',
        recommendation:    'Review parent update drafts in the review queue. Check accuracy before approving — these will be sent directly to parents.',
        confidence:        'high',
        evidence:          [
          'Parent communication proposed_actions are in pending_review status',
          'Parent updates are time-sensitive — delayed updates reduce parent confidence',
        ],
        risks:             [
          'Parents waiting for progress updates may contact the academy directly, increasing admin load',
          'Approval delays mean parents have outdated information about their child\'s progress',
        ],
        actions:           [reviewAction('Approve updates'), askDonnaAction('What parent updates are pending?')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'Parent communications are only sent after explicit director approval — DONNA never sends directly.',
      }

    case 'lesson-requests':
      return {
        id:                item.id,
        type:              'placement_review',
        headline:          'Respond to private lesson requests',
        recommendation:    'Review lesson requests in the queue. Approve, reject, or schedule a follow-up for each request within 24 hours.',
        confidence:        'high',
        evidence:          [
          'Private lesson requests with status=new are waiting for director response',
        ],
        risks:             [
          'Unanswered lesson requests create a negative parent and player experience',
          'Delayed responses can lead to families seeking private coaching elsewhere',
        ],
        actions:           [reviewAction('Review requests'), askDonnaAction('Which lesson requests are pending?')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'Lesson requests require director decision before scheduling or confirming.',
      }

    // ── Player domain ────────────────────────────────────────────────────────────
    case 'players-attention':
      return {
        id:                item.id,
        type:              'assessment_review',
        headline:          'Review players on hold or overdue for reassessment',
        recommendation:    'Open the player list filtered to on-hold and reassessment-due players. Take action on each: schedule a reassessment, clear the hold, or escalate to coach.',
        confidence:        'high',
        evidence:          [
          'Players with status on_hold or reassessment_due are blocked from progressing',
          'These statuses indicate either a director decision is needed or a scheduled assessment is overdue',
        ],
        risks:             [
          'Players on hold for extended periods disengage from the program',
          'Overdue reassessments mean advancement decisions are made without evidence',
        ],
        actions:           [navAction('View players', '/director/players'), askDonnaAction('Who is on hold right now?')],
        approvalRequired:  false,
        targetHref:        '/director/players',
        approvalGuardrail: 'Holding and releasing a player requires director action — DONNA cannot change player status.',
      }

    case 'players-stalled':
      return {
        id:                item.id,
        type:              'assessment_review',
        headline:          'Investigate players stalled at the same level for 180+ days',
        recommendation:    'Open the player list and filter by "stalled". For each stalled player, check gate evidence — a targeted assessment or coach check-in usually resolves the stall.',
        confidence:        'medium',
        evidence:          [
          'Players enrolled at the same curriculum level for 180+ days without advancement eligibility',
          'Stall detection uses enrollment time — gate completion data is not yet tracked per-gate',
        ],
        risks:             [
          'Long stalls increase dropout risk and reduce parent confidence',
          'Stalls may indicate missing evidence, an unclear gate criterion, or a misplaced player',
        ],
        actions:           [navAction('Review progression', '/director/players'), askDonnaAction('Which players are stalled?')],
        approvalRequired:  false,
        targetHref:        '/director/players',
        approvalGuardrail: 'Advancement requires director confirmation — DONNA identifies stalls but cannot resolve them.',
      }

    case 'players-no-level':
      return {
        id:                item.id,
        type:              'placement_review',
        headline:          'Assign curriculum levels to unlevelled players',
        recommendation:    'Open the player list and find players with no curriculum level. Assign them via the Skill Path tab on each player\'s profile.',
        confidence:        'high',
        evidence:          [
          'Active players with no player_curriculum_states row cannot receive tracking or advancement scoring',
        ],
        risks:             [
          'Without a level, DONNA cannot track progression or identify stalls for these players',
          'These players appear as "invisible" in academy health scoring',
        ],
        actions:           [navAction('Assign levels', '/director/players'), askDonnaAction('Which players have no level?')],
        approvalRequired:  false,
        targetHref:        '/director/players',
        approvalGuardrail: 'Level assignment is a director decision — DONNA cannot assign levels automatically.',
      }

    // ── Promotion domain ─────────────────────────────────────────────────────────
    case 'promotion-ready':
      return {
        id:                item.id,
        type:              'promotion_review',
        headline:          'Confirm advancement for players who meet all criteria',
        recommendation:    'Open each advancement-ready player\'s profile. Review the Skill Path tab to confirm gate evidence. If satisfied, approve advancement — this moves them to the next curriculum level.',
        confidence:        'high',
        evidence:          [
          'player_curriculum_states.advancement_eligible = true — set by curriculum evaluation',
          'All tracked gate criteria are met per DONNA\'s assessment data',
        ],
        risks:             [
          'Delayed advancement reduces player motivation and can cause stagnation',
          'Keeping advancement-ready players at their current level slows academy throughput',
        ],
        actions:           [
          { label: 'Review advancement', href: '/director/players', isPrimary: true, requiresApproval: true },
          askDonnaAction('Who is ready for promotion?'),
        ],
        approvalRequired:  true,
        targetHref:        '/director/players',
        approvalGuardrail: 'Promotion requires explicit director confirmation — DONNA never auto-promotes a player.',
      }

    case 'reassessment-due':
      return {
        id:                item.id,
        type:              'assessment_review',
        headline:          'Schedule reassessments for overdue players',
        recommendation:    'Review the reassessment pipeline. Schedule a formal assessment for each overdue player — even a brief session observation can reset the evidence clock.',
        confidence:        'medium',
        evidence:          [
          'Players flagged overdue or due_soon in the reassessment pipeline',
          'Last assessment date exceeds the academy-configured cadence',
        ],
        risks:             [
          'Missed assessments mean advancement and stall decisions are made without evidence',
          'Assessment gaps are a leading cause of wrong-level placements',
        ],
        actions:           [reviewAction('Schedule assessments'), askDonnaAction('Who is overdue for reassessment?')],
        approvalRequired:  false,
        targetHref:        '/director/review',
        approvalGuardrail: 'Assessment scheduling is a director decision — DONNA flags overdue players but cannot schedule sessions.',
      }

    // ── Coach domain ─────────────────────────────────────────────────────────────
    case 'coach-recaps-missing':
      return {
        id:                item.id,
        type:              'coach_load_review',
        headline:          'Follow up with coaches who have not submitted session recaps',
        recommendation:    'Open the Sessions list and identify sessions missing recaps. Message the relevant coach to submit before end of week.',
        confidence:        'medium',
        evidence:          [
          'Completed sessions in the last 30 days with no linked voice_notes record',
        ],
        risks:             [
          'Missing recaps leave attendance and observations unrecorded',
          'DONNA\'s data picture degrades as recap gaps accumulate — stall and progression signals become less reliable',
        ],
        actions:           [navAction('View sessions', '/director/sessions'), askDonnaAction('Which coaches have missing recaps?')],
        approvalRequired:  false,
        targetHref:        '/director/sessions',
        approvalGuardrail: 'Coach recap submission is a coach responsibility — the director can follow up but cannot submit on their behalf.',
      }

    case 'coach-unassigned-players':
      return {
        id:                item.id,
        type:              'coach_assignment',
        headline:          'Assign a primary coach to each unassigned player',
        recommendation:    'Open the player list and filter for players with no coach. Assign each player a primary coach via their profile — this enables coach accountability and DONNA\'s coach intelligence.',
        confidence:        'high',
        evidence:          [
          'Active players with primary_coach_id = NULL in the players table',
          'Without a primary coach, coach intelligence and accountability tracking are unavailable for these players',
        ],
        risks:             [
          'Unassigned players have no coach following their development — gaps may go unnoticed',
          'DONNA cannot produce coach load or stall signals for players without a coach assignment',
        ],
        actions:           [navAction('Assign coaches', '/director/players'), askDonnaAction('Which players have no coach?')],
        approvalRequired:  false,
        targetHref:        '/director/players',
        approvalGuardrail: 'Coach assignment is a director decision — DONNA cannot assign coaches automatically.',
      }

    // ── Curriculum domain ────────────────────────────────────────────────────────
    case 'curriculum-gaps':
      return {
        id:                item.id,
        type:              'curriculum_review',
        headline:          'Address curriculum gaps flagged by DONNA',
        recommendation:    'Open the Curriculum section and review pending suggestions. For each gap, either create a new template or note that it is intentionally uncovered.',
        confidence:        'medium',
        evidence:          [
          'academy_suggestions rows with suggestion_type = curriculum_gap and status = pending',
        ],
        risks:             [
          'Curriculum gaps mean coaches improvise for players at those levels — reducing session consistency and measurability',
        ],
        actions:           [navAction('Review curriculum', '/director/curriculum'), askDonnaAction('What curriculum gaps exist?')],
        approvalRequired:  false,
        targetHref:        '/director/curriculum',
        approvalGuardrail: 'Curriculum changes require director confirmation before taking effect.',
      }

    case 'over-capacity-groups':
      return {
        id:                item.id,
        type:              'coach_assignment',
        headline:          'Redistribute players in over-capacity groups',
        recommendation:    'Review the over-capacity groups. Consider splitting the group, moving players to a different group, or adjusting the max_players threshold if sessions can handle more.',
        confidence:        'medium',
        evidence:          [
          'v_group_summary shows player_count > max_players for one or more groups',
        ],
        risks:             [
          'Over-capacity groups reduce coaching quality and player development outcomes',
          'Coaches in over-capacity groups may burn out from the higher workload',
        ],
        actions:           [navAction('Review groups', '/director/players'), askDonnaAction('Which groups are over capacity?')],
        approvalRequired:  false,
        targetHref:        '/director/players',
        approvalGuardrail: 'Group redistribution requires director decision — DONNA cannot move players between groups.',
      }

    // ── Default fallback ─────────────────────────────────────────────────────────
    default:
      return {
        id:                item.id,
        type:              'assessment_review',
        headline:          item.headline,
        recommendation:    item.synthesis,
        confidence:        'low',
        evidence:          [],
        risks:             [],
        actions:           [
          { label: item.actionLabel, href: item.actionHref, isPrimary: true, requiresApproval: false },
        ],
        approvalRequired:  false,
        targetHref:        item.actionHref,
        approvalGuardrail: '',
      }
  }
}

// ── Decision → execution plan ──────────────────────────────────────────────────

// Maps a director decision (from directorDecisionEngine) to an execution plan.
// Uses DecisionLike to avoid circular dependency with directorDecisionEngine.ts.
export function buildExecutionPlanForDecision(d: DecisionLike): DecisionExecutionPlan {
  const count = d.count

  switch (d.id) {
    case 'assessments-decision':
      return {
        id:                d.id,
        type:              'assessment_review',
        headline:          `Approve ${count} pending assessment${count > 1 ? 's' : ''}`,
        recommendation:    'Open the Assessments tab in the review queue. For each draft, confirm the results are accurate and approve — or reject with a note requesting corrections.',
        confidence:        'high',
        evidence:          [
          `${count} assessment draft${count > 1 ? 's' : ''} in proposed_actions with status pending_review`,
          'Assessment approval is required before results are recorded against player curriculum states',
        ],
        risks:             [
          'Unapproved assessments block advancement decisions',
          'Assessment results cannot be shared with parents until approved',
        ],
        actions:           [reviewAction('Review assessments'), askDonnaAction('Which players need assessment review?')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'Assessment results are only recorded after director approval.',
      }

    case 'placements-decision':
      return {
        id:                d.id,
        type:              'placement_review',
        headline:          `Confirm placement for ${count} pending player${count > 1 ? 's' : ''}`,
        recommendation:    'Review placement recommendations. For each player, confirm the suggested group or manually select an alternative before approving.',
        confidence:        'high',
        evidence:          [
          `${count} player${count > 1 ? 's' : ''} in pending_placement status`,
          'Players cannot be assigned to groups or receive curriculum until placement is confirmed',
        ],
        risks:             [
          'Players in pending placement cannot attend sessions or receive structured curriculum',
          'Delayed placement decisions create a poor first impression for new families',
        ],
        actions:           [reviewAction('Review placements'), askDonnaAction('Who is waiting for placement?')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'finalize_player_placement() is the only path to activate a player — DONNA never activates directly.',
      }

    case 'advancement-decision':
      return {
        id:                d.id,
        type:              'promotion_review',
        headline:          `Confirm advancement for ${count} player${count > 1 ? 's' : ''}`,
        recommendation:    'Review each advancement-ready player\'s gate evidence on their Skill Path tab. Confirm advancement when satisfied — this is an irreversible level change.',
        confidence:        'high',
        evidence:          [
          `${count} player${count > 1 ? 's' : ''} with advancement_eligible = true in curriculum states`,
          'All tracked gate criteria are met per DONNA\'s curriculum intelligence',
        ],
        risks:             [
          'Delaying advancement for eligible players reduces motivation and academy throughput',
          'Other pending items should be resolved first if there is a risk of wrong-level advancement',
        ],
        actions:           [
          { label: 'Review advancement', href: '/director/players', isPrimary: true, requiresApproval: true },
          askDonnaAction('Who is ready for promotion?'),
        ],
        approvalRequired:  true,
        targetHref:        '/director/players',
        approvalGuardrail: 'Promotion requires explicit director confirmation — DONNA never auto-promotes.',
      }

    case 'wrapups-decision':
      return {
        id:                d.id,
        type:              'coach_load_review',
        headline:          `Review ${count} coach recap${count > 1 ? 's' : ''}`,
        recommendation:    'Open the Wrap-ups tab. Focus on recaps with attendance exceptions or observations — approve to confirm, request clarification if anything is unclear.',
        confidence:        'high',
        evidence:          [
          `${count} session wrap-up${count > 1 ? 's' : ''} with status pending_review`,
        ],
        risks:             [
          'Unreviewed recaps leave attendance and observations unconfirmed',
          'Coaches submit fewer recaps over time when they are not reviewed',
        ],
        actions:           [reviewAction('Review recaps'), navAction('View sessions', '/director/sessions')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'Wrap-up approval records the official session outcome.',
      }

    case 'parent-updates-decision':
      return {
        id:                d.id,
        type:              'parent_update_review',
        headline:          `Approve ${count} parent communication draft${count > 1 ? 's' : ''}`,
        recommendation:    'Review each parent update for accuracy and tone. Approve updates that are ready to send — parents are waiting for progress information.',
        confidence:        'high',
        evidence:          [
          `${count} parent_communication proposed_action${count > 1 ? 's' : ''} in pending_review`,
          'Parent updates are time-sensitive — delayed updates reduce parent engagement',
        ],
        risks:             [
          'Parents may contact the academy directly if updates are not sent',
          'Parent confidence in the program decreases with poor communication cadence',
        ],
        actions:           [reviewAction('Approve updates'), askDonnaAction('What parent updates are waiting?')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'Parent communications are only sent after explicit director approval.',
      }

    case 'lesson-requests-decision':
      return {
        id:                d.id,
        type:              'placement_review',
        headline:          `Respond to ${count} lesson request${count > 1 ? 's' : ''}`,
        recommendation:    'Review each lesson request and approve, reject, or follow up within 24 hours.',
        confidence:        'high',
        evidence:          [
          `${count} private lesson request${count > 1 ? 's' : ''} with status=new`,
        ],
        risks:             [
          'Unanswered requests create a negative family experience',
          'Delayed responses may lead families to seek private coaching elsewhere',
        ],
        actions:           [reviewAction('Review requests'), askDonnaAction('Which lesson requests are pending?')],
        approvalRequired:  true,
        targetHref:        '/director/review',
        approvalGuardrail: 'Lesson requests require a director decision before scheduling.',
      }

    default:
      return {
        id:                d.id,
        type:              'assessment_review',
        headline:          d.headline,
        recommendation:    d.synthesis,
        confidence:        'low',
        evidence:          [],
        risks:             [],
        actions:           [{ label: 'Open queue', href: d.actionHref, isPrimary: true, requiresApproval: false }],
        approvalRequired:  false,
        targetHref:        d.actionHref,
        approvalGuardrail: '',
      }
  }
}

// ── Conversational execution intent ───────────────────────────────────────────

const EXECUTION_PATTERNS: Array<{ patterns: RegExp[]; intent: ExecutionIntentType }> = [
  {
    intent:   'fix_it',
    patterns: [/\bfix (it|this)\b/, /\bfix the (issue|problem)\b/, /\blet'?s fix\b/],
  },
  {
    intent:   'take_me_there',
    patterns: [/\btake me there\b/, /\bgo there\b/, /\bnavigate (me )?there\b/, /\bopen (it|this|the page)\b/, /\bshow me (the )?page\b/],
  },
  {
    intent:   'review_this',
    patterns: [/\breview (this|it)\b/, /\blet me review\b/, /\bi('ll| will) review\b/],
  },
  {
    intent:   'what_should_i_do',
    patterns: [/\bwhat should i do\b/, /\bwhat do i do\b/, /\bwhat now\b/, /\bwhat's? (the )?next step\b/, /\bnext step\b/],
  },
  {
    intent:   'approve_this',
    patterns: [/\bapprove (this|it)\b/, /\bi approve\b/, /\bapprove now\b/, /\bmark (as )?approved\b/],
  },
  {
    intent:   'defer_this',
    patterns: [/\bdefer (this|it)\b/, /\bskip (this|it)\b/, /\bdo (this|it) later\b/, /\bnot (now|today)\b/],
  },
  {
    intent:   'show_evidence',
    patterns: [/\bshow (me )?evidence\b/, /\bwhat('s|is) (the )?evidence\b/, /\bprove (it|this)\b/, /\bshow (me )?proof\b/],
  },
  {
    intent:   'why_does_this_matter',
    patterns: [/\bwhy does (this|it) matter\b/, /\bwhy this\b/, /\bwhy (is this|it) important\b/, /\bdoes (this|it) matter\b/, /\bwhy (should|do) i care\b/],
  },
]

export function detectExecutionIntent(lower: string): ExecutionIntentType | null {
  for (const { patterns, intent } of EXECUTION_PATTERNS) {
    if (patterns.some(r => r.test(lower))) return intent
  }
  return null
}

// ── Execution intent → conversational response ────────────────────────────────

export interface ExecutionIntentContext {
  topPriorityHref:    string | null   // href from the top attention item
  topPriorityLabel:   string | null   // actionLabel from the top attention item
  hasPendingReviews:  boolean
  topEvidenceBullets: string[]        // from the top execution plan
  topRiskBullets:     string[]        // from the top execution plan
}

export function buildExecutionIntentResponse(
  intent: ExecutionIntentType,
  ctx: ExecutionIntentContext,
): string {
  switch (intent) {

    case 'fix_it': {
      if (ctx.hasPendingReviews) {
        return [
          '**Safest path:** Open the review queue and work through the oldest pending items first.',
          '',
          ctx.topPriorityLabel
            ? `Your most urgent action: **${ctx.topPriorityLabel}**`
            : 'Your approval queue has items waiting.',
          '',
          'DONNA cannot take action directly — your review and approval is required for every change.',
          '',
          ctx.topPriorityHref ? `→ [Open queue](/director/review)` : '',
        ].filter(Boolean).join('\n')
      }
      return [
        'No items are currently in the pending review queue.',
        '',
        ctx.topPriorityHref
          ? `Your top priority right now: **${ctx.topPriorityLabel ?? 'Review players'}** → [Go there](${ctx.topPriorityHref})`
          : 'Your academy is clear of pending approvals.',
      ].join('\n')
    }

    case 'take_me_there': {
      const href = ctx.topPriorityHref ?? '/director/review'
      const label = ctx.topPriorityLabel ?? 'Review queue'
      return `Taking you to **${label}** → [${href}](${href})\n\nIf you meant a specific item, tell me which one and I will direct you there.`
    }

    case 'review_this': {
      return [
        'To review, open the **Review queue** — all items requiring director approval are there.',
        '',
        ctx.hasPendingReviews
          ? '→ [Open review queue](/director/review)'
          : 'Your review queue is currently empty.',
      ].join('\n')
    }

    case 'what_should_i_do': {
      const lines = [
        'Here is what I would recommend you do first:',
        '',
      ]
      if (ctx.topPriorityLabel && ctx.topPriorityHref) {
        lines.push(`1. **${ctx.topPriorityLabel}** → [Go there](${ctx.topPriorityHref})`)
      }
      if (ctx.hasPendingReviews) {
        lines.push('2. **Clear the review queue** → [Open queue](/director/review)')
      }
      lines.push('', 'For a full breakdown, ask: "What should I focus on today?"')
      return lines.join('\n')
    }

    case 'approve_this': {
      return [
        'To approve, open the **Review queue** and find the item you want to approve.',
        '',
        'DONNA cannot approve on your behalf — your explicit confirmation is required for every approval.',
        '',
        ctx.hasPendingReviews
          ? '→ [Open review queue](/director/review)'
          : 'Your review queue is currently empty.',
      ].join('\n')
    }

    case 'defer_this': {
      return [
        'To defer an item, open the **Review queue**, find the item, and reject it with a reviewer note explaining you want to revisit it later.',
        '',
        'Alternatively, items with status `clarification_needed` stay in the queue for follow-up.',
        '',
        '→ [Open review queue](/director/review)',
      ].join('\n')
    }

    case 'show_evidence': {
      if (ctx.topEvidenceBullets.length > 0) {
        return [
          '**Evidence supporting this priority:**',
          '',
          ...ctx.topEvidenceBullets.map(e => `• ${e}`),
        ].join('\n')
      }
      return 'No specific evidence signals are available for the current context. Ask about a specific player or coach for detailed evidence.'
    }

    case 'why_does_this_matter': {
      if (ctx.topRiskBullets.length > 0) {
        return [
          '**Why this matters:**',
          '',
          ...ctx.topRiskBullets.map(r => `• ${r}`),
        ].join('\n')
      }
      return 'Tell me which item you are asking about and I can explain why it matters and what the risk is if left unaddressed.'
    }
  }
}
