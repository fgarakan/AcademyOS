// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 7 — Context Resolver.
//
// Assembles the MINIMUM COMPLETE context for a reasoning goal:
//   • never sends an excluded source (minimality)
//   • never drops a required source (completeness)
//   • relevance-gates conditional sources
//   • redacts by role / permission / tenant before inclusion
//   • budgets optional sources by cost, dropping lowest-value first
//
// Each source is a Provider with a relevance gate, an assembler, and a confidence.
// Providers are pure functions over ResolverState — no I/O, no mutation, fail-open
// (an assembler that cannot produce content returns UNAVAILABLE, never throws).

import {
  CONTEXT_SOURCES,
  sourceMeta,
  type ContextSourceId,
} from './contextSources'
import type { ResolverState } from './executiveTypes'
import type { ReasoningPlan } from './executiveReasoningLayer'
import {
  type ExecutiveContextPacket,
  type ContextSlice,
  type OmittedSlice,
  type UnavailableSlice,
  EXECUTIVE_CONTEXT_PACKET_VERSION,
  estimateTokens,
} from './executiveContextPacket'

const DEFAULT_BUDGET_TOKENS = 1400

// Mega Sprint 3991–4020 — Unified Executive Context Engine. The COO-priority set:
// the context an executive standing beside the Director always has — the current
// screen, the academy, the active workflow, and the conversation. When these are
// relevant they are admitted even under a tight token budget (never dropped to make
// room for cheaper-but-less-important context). academy is already a required BASE
// source for every goal; the other three are conditionals that this exemption keeps.
export const ALWAYS_INCLUDE: ContextSourceId[] = [
  'current_page',
  'academy',
  'active_workflow',
  'conversation_history',
]
const ALWAYS_INCLUDE_SET = new Set<ContextSourceId>(ALWAYS_INCLUDE)

type AssembleResult =
  | { ok: true; content: string; confidence: number }
  | { ok: false; reason: string }

interface Provider {
  id: ContextSourceId
  /** Conditional sources only fire when relevance returns true. */
  relevance: (plan: ReasoningPlan, state: ResolverState) => boolean
  assemble: (state: ResolverState) => AssembleResult
}

const UNAVAILABLE = (reason: string): AssembleResult => ({ ok: false, reason })

// ── Providers ───────────────────────────────────────────────────────────────────

const PROVIDERS: Record<ContextSourceId, Provider> = {
  conversation_history: {
    id: 'conversation_history',
    relevance: (_p, s) => s.conversationHistory.length > 0,
    assemble: (s) => {
      if (!s.conversationHistory.length) return UNAVAILABLE('no prior turns')
      // Salience: keep the most recent 6 turns, compactly.
      const recent = s.conversationHistory.slice(-6)
        .map(t => `${t.role === 'user' ? 'Director' : 'DONNA'}: ${t.content}`)
        .join(' / ')
      return { ok: true, content: recent, confidence: 0.95 }
    },
  },
  current_page: {
    id: 'current_page',
    relevance: () => true,
    assemble: (s) => s.page ? { ok: true, content: s.page, confidence: 1 } : UNAVAILABLE('no page'),
  },
  current_route: {
    id: 'current_route',
    relevance: () => true,
    assemble: (s) => s.route ? { ok: true, content: s.route, confidence: 1 } : UNAVAILABLE('no route'),
  },
  active_workflow: {
    id: 'active_workflow',
    relevance: (_p, s) => !!s.activeWorkflowId,
    assemble: (s) => s.activeWorkflowId ? { ok: true, content: s.activeWorkflowId, confidence: 1 } : UNAVAILABLE('no active workflow'),
  },
  active_draft: {
    id: 'active_draft',
    relevance: (_p, s) => !!s.activeDraft,
    assemble: (s) => s.activeDraft
      ? { ok: true, content: `${s.activeDraft.label} :: ${JSON.stringify(s.activeDraft.fields)} :: ready=${s.activeDraft.readyForReview}`, confidence: 1 }
      : UNAVAILABLE('no active draft'),
  },
  academy: {
    id: 'academy',
    relevance: () => true,
    assemble: (s) => s.academy
      ? {
          ok: true,
          // Identity + (when live) a one-line operating snapshot, so the academy
          // source — required by every goal — always carries real headline facts.
          content: `${s.academy.name}${s.academy.modelLabel ? ` (${s.academy.modelLabel})` : ''}` +
            (s.academy.operatingSummary ? ` — ${s.academy.operatingSummary}` : ''),
          confidence: 0.9,
        }
      : UNAVAILABLE('no academy context'),
  },
  academy_defaults: {
    id: 'academy_defaults',
    relevance: () => true,
    assemble: (s) => s.academyDefaults && Object.keys(s.academyDefaults).length
      ? { ok: true, content: JSON.stringify(s.academyDefaults), confidence: 0.85 }
      : UNAVAILABLE('no academy defaults'),
  },
  curriculum: {
    id: 'curriculum',
    relevance: () => true,
    assemble: (s) => s.curriculum
      ? { ok: true, content: `levels: ${s.curriculum.levels.join(', ')} — ${s.curriculum.summary}`, confidence: 0.85 }
      : UNAVAILABLE('no curriculum context'),
  },
  development_spine: {
    id: 'development_spine',
    relevance: () => true,
    assemble: (s) => s.developmentSpine
      ? { ok: true, content: s.developmentSpine.summary, confidence: 0.8 }
      : UNAVAILABLE('no spine context'),
  },
  role: {
    id: 'role',
    relevance: () => true,
    assemble: (s) => ({ ok: true, content: s.role, confidence: 1 }),
  },
  permissions: {
    id: 'permissions',
    relevance: () => true,
    assemble: (s) => ({ ok: true, content: s.permissions.join(', ') || 'none', confidence: 1 }),
  },
  available_actions: {
    id: 'available_actions',
    relevance: () => true,
    assemble: (s) => s.availableActions.length
      ? { ok: true, content: s.availableActions.map(a => `${a.id}${a.requiresApproval ? '*' : ''}`).join(', '), confidence: 1 }
      : UNAVAILABLE('no available actions'),
  },
  outstanding_decisions: {
    id: 'outstanding_decisions',
    relevance: () => true,
    assemble: (s) => s.outstandingDecisions.length
      ? { ok: true, content: s.outstandingDecisions.map(d => `[${d.urgency}] ${d.summary}`).join(' | '), confidence: 0.95 }
      : UNAVAILABLE('no outstanding decisions'),
  },
  donna_assumptions: {
    id: 'donna_assumptions',
    relevance: () => true,
    assemble: (s) => s.donnaAssumptions.length
      ? { ok: true, content: s.donnaAssumptions.map(a => `${a.statement} (${a.basis})`).join(' | '), confidence: 0.9 }
      : UNAVAILABLE('no recorded assumptions'),
  },
  navigation_target: {
    id: 'navigation_target',
    relevance: (_p, s) => !!s.navigationTarget,
    assemble: (s) => s.navigationTarget ? { ok: true, content: s.navigationTarget, confidence: 1 } : UNAVAILABLE('no navigation target'),
  },
  relevant_memory: {
    id: 'relevant_memory',
    relevance: (_p, s) => s.memories.length > 0,
    assemble: (s) => {
      const lower = s.message.toLowerCase()
      const matched = s.memories.filter(m => m.tags.some(t => lower.includes(t.toLowerCase())))
      const chosen = (matched.length ? matched : s.memories).slice(0, 3)
      if (!chosen.length) return UNAVAILABLE('no relevant memory')
      return { ok: true, content: chosen.map(m => m.content).join(' | '), confidence: 0.8 }
    },
  },
  player_context: {
    id: 'player_context',
    relevance: (_p, s) => !!s.playerContext,
    assemble: (s) => s.playerContext
      ? { ok: true, content: `${s.playerContext.label} :: ${JSON.stringify(s.playerContext.fields)}`, confidence: 0.9 }
      : UNAVAILABLE('no player context'),
  },
  coach_context: {
    id: 'coach_context',
    relevance: (_p, s) => !!s.coachContext,
    assemble: (s) => s.coachContext
      ? { ok: true, content: `${s.coachContext.label} :: ${JSON.stringify(s.coachContext.fields)}`, confidence: 0.9 }
      : UNAVAILABLE('no coach context'),
  },
  parent_context: {
    id: 'parent_context',
    relevance: (_p, s) => !!s.parentContext,
    assemble: (s) => s.parentContext
      ? { ok: true, content: `${s.parentContext.label} :: ${JSON.stringify(s.parentContext.fields)}`, confidence: 0.9 }
      : UNAVAILABLE('no parent context'),
  },
}

// ── Redaction ─────────────────────────────────────────────────────────────────
// Returns null when the source is allowed; a reason string when it must be redacted.

function redactionBlock(id: ContextSourceId, state: ResolverState): string | null {
  const meta = sourceMeta(id)
  if (meta.redaction === 'open') return null

  if (meta.redaction === 'sensitive') {
    // Sensitive sources require an elevated role; player/parent data is never
    // exposed to player/parent roles about others.
    const elevated = state.role === 'academy_director' || state.role === 'head_coach'
    if (!elevated && id === 'available_actions') return null // actions are self-scoped
    if (!elevated) return `role ${state.role} not permitted for ${id}`
    return null
  }

  if (meta.redaction === 'tenant') {
    // Tenant sources must belong to the same academy (multi-tenant RLS alignment).
    const academyId = state.academy?.academyId
    if (!academyId) return 'no academy tenant to scope against'
    const ctxAcademy =
      id === 'curriculum' ? state.curriculum?.academyId :
      id === 'development_spine' ? state.developmentSpine?.academyId :
      academyId
    if (ctxAcademy && ctxAcademy !== academyId) return 'tenant mismatch'
    return null
  }
  return null
}

// ── Resolver ──────────────────────────────────────────────────────────────────

export interface ResolveOptions {
  budgetTokens?: number
  completionContract?: ExecutiveContextPacket['completionContract']
}

export function resolveExecutiveContext(
  plan: ReasoningPlan,
  state: ResolverState,
  opts: ResolveOptions = {},
): ExecutiveContextPacket {
  const budget = opts.budgetTokens ?? DEFAULT_BUDGET_TOKENS
  const assembled: ContextSlice[] = []
  const omitted: OmittedSlice[] = []
  const unavailable: UnavailableSlice[] = []

  const required = new Set(plan.requiredContext)
  const excluded = new Set(plan.excludedContext)

  // Candidate set: required + relevant conditionals, minus excluded.
  const candidates: ContextSourceId[] = []
  for (const id of plan.requiredContext) {
    if (excluded.has(id)) continue // excluded wins over required (goal contract is authoritative)
    candidates.push(id)
  }
  for (const id of plan.conditionalContext) {
    if (excluded.has(id)) continue
    if (required.has(id)) continue
    if (PROVIDERS[id].relevance(plan, state)) candidates.push(id)
    else omitted.push({ id, reason: 'not_relevant' })
  }

  // Record excluded sources for the audit trail.
  for (const id of plan.excludedContext) omitted.push({ id, reason: 'excluded_by_goal' })

  // Assemble each candidate through redaction + provider.
  let used = 0
  // Required first so they always claim budget; conditionals sorted cheap→costly.
  const ordered = [...candidates].sort((a, b) => {
    const ra = required.has(a) ? 0 : 1
    const rb = required.has(b) ? 0 : 1
    if (ra !== rb) return ra - rb
    return CONTEXT_SOURCES[a].costWeight - CONTEXT_SOURCES[b].costWeight
  })

  let requiredMet = true
  const usedSources: ContextSourceId[] = []

  for (const id of ordered) {
    const block = redactionBlock(id, state)
    if (block) {
      omitted.push({ id, reason: 'redacted' })
      if (required.has(id)) requiredMet = false
      continue
    }
    const res = PROVIDERS[id].assemble(state)
    if (!res.ok) {
      unavailable.push({ id, reason: res.reason })
      if (required.has(id)) requiredMet = false
      continue
    }
    const meta = sourceMeta(id)
    const tokensEst = estimateTokens(res.content)

    // Budget: required slices and the always-include COO-priority set are always
    // admitted; other conditionals only if they fit. This guarantees the Director's
    // current screen and the conversation are never dropped to fit cheaper context.
    if (!required.has(id) && !ALWAYS_INCLUDE_SET.has(id) && used + tokensEst > budget) {
      omitted.push({ id, reason: 'budget' })
      continue
    }
    used += tokensEst
    usedSources.push(id)
    assembled.push({
      id,
      label: meta.label,
      content: res.content,
      provenance: { source: meta.id, freshness: meta.freshness, confidence: res.confidence },
      tokensEst,
    })
  }

  return {
    version: EXECUTIVE_CONTEXT_PACKET_VERSION,
    reasoningGoal: plan.goal,
    confidenceTarget: plan.confidenceTarget,
    effectiveMessage: plan.effectiveMessage,
    isContinuation: plan.isContinuation,
    assembled,
    omitted,
    unavailable,
    activeWorkflow: state.activeWorkflowId,
    activeDraft: state.activeDraft,
    outstandingDecisions: state.outstandingDecisions,
    availableActions: state.availableActions.filter(a => a.roles.includes(state.role)),
    completionContract: opts.completionContract ?? null,
    provenance: { sources: usedSources, requiredMet },
    budget: { limitTokens: budget, usedTokens: used },
  }
}
