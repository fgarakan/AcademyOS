// Mega Sprint 3691–3720 — DONNA Executive Reasoning Live Wiring V1
// Part 2 — Live ResolverState adapter.
//
// Bridges the legacy live-conversation inputs into the Executive Operating Layer's
// ResolverState. Pure (no I/O, no supabase) so it is unit-testable and cannot
// introduce a second data pathway. It maps only context that is already available
// to the live action — sources not loaded in V1 live wiring are simply left null,
// and the Context Resolver records them as `unavailable` (honest, not fabricated).

import type { DonnaMessageInput, DonnaMessageResult } from '@/lib/donna/brain/processDonnaMessage'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type {
  ResolverState,
  ExecutiveRole,
  ActionDescriptor,
  DecisionRef,
  CurriculumContext,
  MemoryRecord,
} from './executiveTypes'
// Mega Sprint 3961–3990 / 3991–4020 — Live Page Intelligence → Unified Context Engine.
// The Director's current screen is assembled centrally and injected into the single
// `current_page` source so every OpenAI request is grounded in what is on screen.
import { buildPageContextForResolver } from './pageContextPacketSource'

export interface LiveAcademyContext {
  academyId: string
  name: string | null
  modelLabel: string | null
}

// ── DirectorDonnaContext → executive context (Mega Sprint 3841–3870) ────────────
// Wire already-loaded, live academy truth into the Executive Context Packet so
// OpenAI reasons over real signals instead of role+permissions alone. Existing
// data only; never demo (gated on ctx.isLive by the caller). No PII — counts,
// urgency-ranked risk summaries, and curriculum gap labels only.

const RISK_TO_URGENCY: Record<'high' | 'medium' | 'low', DecisionRef['urgency']> = {
  high: 'high', medium: 'medium', low: 'low',
}

/** Urgency-ranked operating decisions from real academy risks + flagged players. */
function decisionsFromDirectorCtx(ctx: DirectorDonnaContext): DecisionRef[] {
  const decisions: DecisionRef[] = []
  const seen = new Set<string>()
  const push = (id: string, summary: string, urgency: DecisionRef['urgency']) => {
    const key = summary.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    decisions.push({ id, summary, urgency })
  }
  // 1. Academy risks are already urgency-sorted with human-readable detail.
  for (const r of ctx.academyRisks) {
    push(`risk_${r.signal.toLowerCase().replace(/\s+/g, '_')}`, r.detail, r.urgency)
  }
  // 2. Named players needing attention (top 3) — drives "who needs attention".
  for (const a of ctx.attentionItems.slice(0, 3)) {
    const who = a.playerName ?? 'A player'
    push(`attn_${a.playerId ?? who}`, `${who} — ${a.reason}`, RISK_TO_URGENCY[a.risk])
  }
  // 3. Fall back to recommended actions if no risks/attention surfaced.
  if (!decisions.length) {
    for (const ra of ctx.recommendedActions.slice(0, 3)) push(ra.id, `${ra.label} — ${ra.reason}`, 'medium')
  }
  return decisions.slice(0, 6)
}

/** Compact one-line headline snapshot (counts only) for the academy source. */
function operatingSummaryFromDirectorCtx(ctx: DirectorDonnaContext): string {
  const parts: string[] = []
  parts.push(`${ctx.playerCount} active players`)
  if (ctx.coachCount) parts.push(`${ctx.coachCount} coaches`)
  if (ctx.pendingReviews) parts.push(`${ctx.pendingReviews} pending reviews`)
  if (ctx.todaySessions) parts.push(`${ctx.todaySessions} sessions today`)
  if (ctx.missingWrapUps) parts.push(`${ctx.missingWrapUps} missing wrap-ups`)
  if (ctx.advancementEligibleCount) parts.push(`${ctx.advancementEligibleCount} advancement-eligible`)
  if (ctx.highRiskPlayerCount) parts.push(`${ctx.highRiskPlayerCount} high-risk players`)
  if (ctx.curriculumTemplateCoverageGapCount) parts.push(`${ctx.curriculumTemplateCoverageGapCount} curriculum-template coverage gaps`)
  parts.push(`onboarding ${ctx.onboardingReadinessLevel.replace(/_/g, ' ')}`)
  return parts.join(', ')
}

/** Curriculum context from real structural gaps + bottleneck (tenant-scoped). */
function curriculumFromDirectorCtx(ctx: DirectorDonnaContext, academyId: string): CurriculumContext | null {
  const bits: string[] = []
  if (ctx.curriculumGaps.length) bits.push(`${ctx.curriculumGaps.length} structural gaps: ${ctx.curriculumGaps.slice(0, 3).join('; ')}`)
  if (ctx.mostBlockedLevelName) bits.push(`most blocked level: ${ctx.mostBlockedLevelName} (${ctx.mostBlockedLevelStalledCount} stalled)`)
  if (ctx.playerProgressStallCount) bits.push(`${ctx.playerProgressStallCount} players stalled >90d`)
  if (!bits.length) return null
  return { academyId, levels: [], summary: bits.join(' · ') }
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
  // Mega Sprint 3841–3870 — already-loaded live academy truth. Optional + fail-safe:
  // when null/absent or not live, the state is exactly as before (no regression).
  directorCtx?: DirectorDonnaContext | null,
  // Mega Sprint 4231–4260 — durable learning already retrieved for this turn (relevant,
  // compressed) so the packet reuses it instead of re-sending context. Empty when none.
  durableMemories?: MemoryRecord[],
  // Mega Sprint 4261–4290 — Executive Intelligence priorities to lead the decisions
  // (proactive grounding). Empty/absent on a non-proactive turn.
  extraDecisions?: DecisionRef[],
): ResolverState {
  const execRole = mapRole(role)

  // Last salient entity for pronoun binding — prefer V2 resolution, then V1.
  const lastEntityLabel =
    (legacy?.resolvedEntityV2 as { label?: string } | null)?.label ??
    (legacy?.entity as { label?: string } | null)?.label ??
    null

  // Only real, live academy truth is injected — never demo/fabricated context.
  const live = directorCtx && directorCtx.isLive ? directorCtx : null

  // Outstanding decisions: real, urgency-ranked operating signals when live;
  // otherwise the legacy recommended next action (prior minimal/honest behavior).
  let outstandingDecisions: DecisionRef[] = []
  if (live) {
    outstandingDecisions = decisionsFromDirectorCtx(live)
  }
  if (!outstandingDecisions.length && legacy?.requiresApproval && legacy.nextAction?.label) {
    outstandingDecisions = [{ id: 'legacy_next', summary: legacy.nextAction.label, urgency: 'medium' }]
  }
  // Mega Sprint 4261–4290 — Executive Intelligence priorities lead the decisions so a
  // proactive turn ("what should I do today?") is grounded in real ranked priorities.
  if (extraDecisions?.length) {
    outstandingDecisions = [...extraDecisions, ...outstandingDecisions]
  }

  const operatingSummary = live ? operatingSummaryFromDirectorCtx(live) : null
  const curriculum = live ? curriculumFromDirectorCtx(live, academy.academyId) : null

  // Current page: the rich, structured page-context block (purpose, current step,
  // visible UI, selected values, completion status, recommended next action) built
  // from page intelligence + live page state. Falls back to the raw route only for
  // completely unknown routes, then to legacy page intelligence, then null —
  // so DONNA never has to ask the Director which screen they are on.
  const pageContextBlock =
    buildPageContextForResolver(input.route, input.livePageState ?? null) ??
    (legacy?.pageIntelligence as { pageName?: string } | null)?.pageName ??
    input.route ??
    null

  return {
    role: execRole,
    message: input.userMessage,
    route: input.route ?? null,
    page: pageContextBlock,
    conversationHistory: input.conversationHistory ?? [],
    activeWorkflowId: input.activeGuidedWorkflowId ?? null,
    activeDraft: null, // V1 live carries no structured draft; continuity uses lastEntityLabel
    academy: academy.name
      ? { academyId: academy.academyId, name: academy.name, modelLabel: academy.modelLabel, operatingSummary }
      : null,
    academyDefaults: null,
    curriculum,
    developmentSpine: null,
    permissions: permissionsForRole(execRole),
    availableActions: actionsForRole(execRole),
    outstandingDecisions,
    donnaAssumptions: [],
    navigationTarget: legacy?.navigateTo ?? null,
    memories: durableMemories ?? [],
    lastEntityLabel,
    // Mega Sprint 4111–4140 — pass through UI execution events the client observed.
    uiEvents: input.uiEvents ?? null,
  }
}
