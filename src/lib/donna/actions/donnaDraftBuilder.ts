// DONNA Draft Builder — Mega Sprint 1991–2020
// Pure functions that create DonnaActionDraft objects from existing engine outputs.
// No new intelligence. No DB calls. Reuses Operating Partner, Decision Engine,
// Evolution Engine, and Attention Engine outputs.

import type { DonnaActionDraft, DonnaActionSourceEngine } from './donnaActionContract'
import { newDraftId } from './donnaActionContract'
import { getDonnaAction, buildActionTarget } from './donnaActionRegistry'
import type { DirectorDecision } from '../operations/directorDecisionEngine'
import type { OperatingAttentionSignal } from '../operations/academyAttentionEngine'
import type { EvolutionRecommendation } from '../curriculum/curriculumEvolutionEngine'

// ── From DirectorDecision (Operating Partner / Decision Engine) ───────────────

export function buildDraftFromDecision(decision: DirectorDecision): DonnaActionDraft {
  const actionId = decisionToActionId(decision)
  const action   = getDonnaAction(actionId)
  const target   = buildActionTarget(action, null, null)

  return {
    id:               newDraftId(),
    actionId,
    label:            decision.title,
    description:      decision.firstStep,
    entityId:         null,
    entityLabel:      null,
    entityType:       action.entityType,
    actionTarget:     { ...target, route: decision.actionHref || target.route },
    proposedPayload:  { evidenceUsed: decision.evidenceUsed },
    approvalRequired: decision.approvalRequired,
    sourceEngine:     'decision_engine',
    sourceSignal:     decision.evidenceUsed[0] ?? decision.title,
    domain:           decision.domain,
    status:           'draft',
    createdAt:        new Date().toISOString(),
  }
}

function decisionToActionId(
  decision: DirectorDecision,
): import('./donnaActionContract').DonnaActionId {
  const { domain, approvalRequired } = decision
  if (domain === 'players') {
    return approvalRequired ? 'schedule_reassessment' : 'review_advancement'
  }
  if (domain === 'curriculum') return 'review_curriculum_recommendation'
  if (domain === 'coaches')   return 'create_coach_note'
  if (domain === 'parents')   return 'draft_parent_message'
  if (domain === 'system')    return 'open_approval'
  return 'open_approval'
}

// ── From OperatingAttentionSignal (Attention Engine) ─────────────────────────

export function buildDraftFromAttentionSignal(
  signal:       OperatingAttentionSignal,
  entityId?:    string,
  entityLabel?: string,
): DonnaActionDraft {
  const actionId = signalToActionId(signal)
  const action   = getDonnaAction(actionId)
  const target   = buildActionTarget(action, entityId, entityLabel)

  return {
    id:               newDraftId(),
    actionId,
    label:            signal.headline,
    description:      signal.recommendedDirection,
    entityId:         entityId ?? null,
    entityLabel:      entityLabel ?? null,
    entityType:       action.entityType,
    actionTarget:     target,
    proposedPayload:  { evidence: signal.evidence, source: signal.source },
    approvalRequired: action.approvalRequired,
    sourceEngine:     'attention_engine',
    sourceSignal:     signal.source,
    domain:           signal.domain,
    status:           'draft',
    createdAt:        new Date().toISOString(),
  }
}

function signalToActionId(
  signal: OperatingAttentionSignal,
): import('./donnaActionContract').DonnaActionId {
  const { domain, severity } = signal
  if (domain === 'players' && severity === 'critical') return 'schedule_reassessment'
  if (domain === 'players')   return 'open_player'
  if (domain === 'curriculum') return 'review_curriculum_recommendation'
  if (domain === 'coaches')   return 'create_coach_note'
  if (domain === 'parents')   return 'draft_parent_message'
  return 'open_approval'
}

// ── From EvolutionRecommendation (Curriculum Evolution Engine) ────────────────

export function buildDraftFromEvolutionRecommendation(
  rec: EvolutionRecommendation,
): DonnaActionDraft {
  const action = getDonnaAction('review_curriculum_recommendation')
  const target = buildActionTarget(action, rec.affectedLevels[0] ?? null, rec.title)

  return {
    id:               newDraftId(),
    actionId:         'review_curriculum_recommendation',
    label:            rec.title,
    description:      rec.recommendedAction,
    entityId:         rec.affectedLevels[0] ?? null,
    entityLabel:      rec.title,
    entityType:       'curriculum',
    actionTarget:     target,
    proposedPayload:  {
      recommendationType: rec.recommendationType,
      evidenceStrength:   rec.evidenceStrength,
      confidence:         rec.confidence,
      affectedLevels:     rec.affectedLevels,
    },
    approvalRequired: true,
    sourceEngine:     'evolution_engine',
    sourceSignal:     `evolution_${rec.recommendationType.toLowerCase()}`,
    domain:           'curriculum',
    status:           'draft',
    createdAt:        new Date().toISOString(),
  }
}

// ── Batch builders ────────────────────────────────────────────────────────────

export function buildDraftsFromDecisions(decisions: DirectorDecision[]): DonnaActionDraft[] {
  return decisions.map(buildDraftFromDecision)
}

// ── Player domain drafts (in-context: surfaces on players page) ───────────────
// Generated from data already available on the players page — no new queries.

export function buildPlayerDomainDrafts(params: {
  assessmentDueCount:     number
  advancementReadyCount:  number
  needsAttentionCount:    number
  onHoldCount:            number
}): DonnaActionDraft[] {
  const { assessmentDueCount, advancementReadyCount, needsAttentionCount, onHoldCount } = params
  const drafts: DonnaActionDraft[] = []

  if (assessmentDueCount > 0) {
    const action = getDonnaAction('schedule_reassessment')
    drafts.push({
      id:               newDraftId(),
      actionId:         'schedule_reassessment',
      label:            `Schedule reassessment for ${assessmentDueCount} player${assessmentDueCount !== 1 ? 's' : ''}`,
      description:      `${assessmentDueCount} player${assessmentDueCount !== 1 ? 's have' : ' has'} overdue assessments. Review their skill-path to confirm readiness.`,
      entityId:         null,
      entityLabel:      `${assessmentDueCount} players`,
      entityType:       'assessment',
      actionTarget:     {
        label:       `Review ${assessmentDueCount} overdue assessment${assessmentDueCount !== 1 ? 's' : ''}`,
        route:       '/director/players',
        routeContext: 'Players with overdue assessments',
        entityType:  'assessment',
      },
      proposedPayload:  { assessmentDueCount },
      approvalRequired: true,
      sourceEngine:     'attention_engine',
      sourceSignal:     'assessment_overdue',
      domain:           'players',
      status:           'draft',
      createdAt:        new Date().toISOString(),
    })
  }

  if (advancementReadyCount > 0) {
    const action = getDonnaAction('review_advancement')
    const target = buildActionTarget(action, null, `${advancementReadyCount} players`)
    drafts.push({
      id:               newDraftId(),
      actionId:         'review_advancement',
      label:            `Review advancement eligibility — ${advancementReadyCount} player${advancementReadyCount !== 1 ? 's' : ''} ready`,
      description:      `${advancementReadyCount} player${advancementReadyCount !== 1 ? 's are' : ' is'} advancement-eligible. Review their readiness before the next session.`,
      entityId:         null,
      entityLabel:      `${advancementReadyCount} players`,
      entityType:       'players',
      actionTarget:     { ...target, route: '/director/players' },
      proposedPayload:  { advancementReadyCount },
      approvalRequired: false,
      sourceEngine:     'operating_partner',
      sourceSignal:     'advancement_eligible',
      domain:           'players',
      status:           'draft',
      createdAt:        new Date().toISOString(),
    })
  }

  if (onHoldCount > 0) {
    drafts.push({
      id:               newDraftId(),
      actionId:         'open_player',
      label:            `Review ${onHoldCount} player${onHoldCount !== 1 ? 's' : ''} on hold`,
      description:      `${onHoldCount} player${onHoldCount !== 1 ? 's are' : ' is'} on hold. Follow up to determine next steps.`,
      entityId:         null,
      entityLabel:      `${onHoldCount} players`,
      entityType:       'players',
      actionTarget:     {
        label:       `Review players on hold`,
        route:       '/director/players',
        routeContext: 'Players currently on hold',
        entityType:  'players',
      },
      proposedPayload:  { onHoldCount },
      approvalRequired: false,
      sourceEngine:     'attention_engine',
      sourceSignal:     'player_on_hold',
      domain:           'players',
      status:           'draft',
      createdAt:        new Date().toISOString(),
    })
  }

  return drafts
}

// ── Curriculum domain drafts (in-context: surfaces on curriculum page) ─────────

export function buildCurriculumDomainDrafts(params: {
  hasEvolutionRecommendations: boolean
  versionStatus:               'none' | 'draft' | 'active'
  incompleteSetupCount:        number
}): DonnaActionDraft[] {
  const { hasEvolutionRecommendations, versionStatus, incompleteSetupCount } = params
  const drafts: DonnaActionDraft[] = []

  if (hasEvolutionRecommendations) {
    const action = getDonnaAction('review_curriculum_recommendation')
    const target = buildActionTarget(action, null, null)
    drafts.push({
      id:               newDraftId(),
      actionId:         'review_curriculum_recommendation',
      label:            'Review DONNA curriculum evolution recommendations',
      description:      'DONNA has identified improvement opportunities for your curriculum. Review and act on each recommendation.',
      entityId:         null,
      entityLabel:      null,
      entityType:       'curriculum',
      actionTarget:     target,
      proposedPayload:  {},
      approvalRequired: true,
      sourceEngine:     'evolution_engine',
      sourceSignal:     'evolution_recommendations_available',
      domain:           'curriculum',
      status:           'draft',
      createdAt:        new Date().toISOString(),
    })
  }

  if (versionStatus === 'draft') {
    drafts.push({
      id:               newDraftId(),
      actionId:         'open_curriculum',
      label:            'Approve your curriculum version',
      description:      'Your curriculum is in draft. Approve it to unlock player-level tracking and template connections.',
      entityId:         null,
      entityLabel:      null,
      entityType:       'curriculum',
      actionTarget:     {
        label:       'Approve curriculum version',
        route:       '/director/curriculum/builder',
        routeContext: 'Curriculum version approval',
        entityType:  'curriculum',
      },
      proposedPayload:  { versionStatus },
      approvalRequired: true,
      sourceEngine:     'curriculum_engine',
      sourceSignal:     'version_in_draft',
      domain:           'curriculum',
      status:           'draft',
      createdAt:        new Date().toISOString(),
    })
  }

  if (incompleteSetupCount > 0) {
    drafts.push({
      id:               newDraftId(),
      actionId:         'open_curriculum',
      label:            `Complete ${incompleteSetupCount} curriculum setup step${incompleteSetupCount !== 1 ? 's' : ''}`,
      description:      `${incompleteSetupCount} setup step${incompleteSetupCount !== 1 ? 's are' : ' is'} incomplete. Complete them to unlock full curriculum intelligence.`,
      entityId:         null,
      entityLabel:      null,
      entityType:       'curriculum',
      actionTarget:     {
        label:       'Continue curriculum setup',
        route:       '/director/curriculum/builder',
        routeContext: 'Curriculum setup completion',
        entityType:  'curriculum',
      },
      proposedPayload:  { incompleteSetupCount },
      approvalRequired: false,
      sourceEngine:     'curriculum_engine',
      sourceSignal:     'setup_incomplete',
      domain:           'curriculum',
      status:           'draft',
      createdAt:        new Date().toISOString(),
    })
  }

  return drafts
}

// ── Work queue aggregation ────────────────────────────────────────────────────

export function buildWorkQueueSummary(
  allDrafts: DonnaActionDraft[],
): import('./donnaActionContract').DonnaWorkQueueSummary {
  const pending = allDrafts.filter(d => d.status === 'draft' || d.status === 'pending')

  const domainMap = new Map<string, { count: number; route: string; topLabel: string }>()
  for (const draft of pending) {
    const existing = domainMap.get(draft.domain)
    if (!existing) {
      domainMap.set(draft.domain, {
        count:    1,
        route:    draft.actionTarget.route,
        topLabel: draft.label,
      })
    } else {
      existing.count++
    }
  }

  return {
    totalPending: pending.length,
    byDomain:     Array.from(domainMap.entries()).map(([domain, v]) => ({
      domain,
      count:         v.count,
      route:         v.route,
      topDraftLabel: v.topLabel,
    })),
    generatedAt:  new Date().toISOString(),
  }
}
