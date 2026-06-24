// Mega Sprint 3691–3720 — DONNA Executive Reasoning Live Wiring V1
// Part 2 — Live ResolverState adapter.
//
// Bridges the legacy live-conversation inputs into the Executive Operating Layer's
// ResolverState. Pure (no I/O, no supabase) so it is unit-testable and cannot
// introduce a second data pathway. It maps only context that is already available
// to the live action — sources not loaded in V1 live wiring are simply left null,
// and the Context Resolver records them as `unavailable` (honest, not fabricated).

import type { DonnaMessageInput, DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import type {
  ResolverState,
  ExecutiveRole,
  ActionDescriptor,
  DecisionRef,
} from './executiveTypes'

export interface LiveAcademyContext {
  academyId: string
  name: string | null
  modelLabel: string | null
}

function mapRole(role: string): ExecutiveRole {
  switch (role) {
    case 'academy_director': return 'academy_director'
    case 'head_coach': return 'head_coach'
    case 'coach': return 'coach'
    case 'parent': return 'parent'
    case 'player': return 'player'
    default: return 'academy_director'
  }
}

function permissionsForRole(role: ExecutiveRole): string[] {
  if (role === 'academy_director') return ['approve', 'create_template', 'assign_coach', 'override']
  if (role === 'head_coach') return ['create_template', 'assign_coach']
  return []
}

function actionsForRole(role: ExecutiveRole): ActionDescriptor[] {
  const all: ActionDescriptor[] = [
    { id: 'create_template', label: 'Create template', roles: ['academy_director', 'head_coach'], requiresApproval: false },
    { id: 'approve_review', label: 'Approve review item', roles: ['academy_director'], requiresApproval: true },
    { id: 'assign_coach', label: 'Assign coach', roles: ['academy_director', 'head_coach'], requiresApproval: false },
  ]
  return all.filter(a => a.roles.includes(role))
}

/**
 * Build the ResolverState for a live turn. The legacy brain result (already
 * computed) supplies cheap, trustworthy context: the last resolved entity (for
 * coreference of "it"/"that"), the page label, and any navigation target — so we
 * reuse the existing pipeline's grounding rather than recomputing it.
 */
export function buildResolverStateFromLive(
  input: DonnaMessageInput,
  role: string,
  academy: LiveAcademyContext,
  legacy: DonnaMessageResult | null,
): ResolverState {
  const execRole = mapRole(role)

  // Last salient entity for pronoun binding — prefer V2 resolution, then V1.
  const lastEntityLabel =
    (legacy?.resolvedEntityV2 as { label?: string } | null)?.label ??
    (legacy?.entity as { label?: string } | null)?.label ??
    null

  // Outstanding decisions: surface the legacy turn's recommended next action as a
  // standing decision when it implies one (kept minimal + honest for V1 live).
  const outstandingDecisions: DecisionRef[] = []
  if (legacy?.requiresApproval && legacy.nextAction?.label) {
    outstandingDecisions.push({ id: 'legacy_next', summary: legacy.nextAction.label, urgency: 'medium' })
  }

  const pageLabel =
    (legacy?.pageIntelligence as { label?: string } | null)?.label ??
    input.route ??
    null

  return {
    role: execRole,
    message: input.userMessage,
    route: input.route ?? null,
    page: pageLabel,
    conversationHistory: input.conversationHistory ?? [],
    activeWorkflowId: input.activeGuidedWorkflowId ?? null,
    activeDraft: null, // V1 live carries no structured draft; continuity uses lastEntityLabel
    academy: academy.name
      ? { academyId: academy.academyId, name: academy.name, modelLabel: academy.modelLabel }
      : null,
    academyDefaults: null,
    curriculum: null,
    developmentSpine: null,
    permissions: permissionsForRole(execRole),
    availableActions: actionsForRole(execRole),
    outstandingDecisions,
    donnaAssumptions: [],
    navigationTarget: legacy?.navigateTo ?? null,
    memories: [],
    lastEntityLabel,
  }
}
