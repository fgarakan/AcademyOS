// Sprint 654 — Parent Multi-Child Migration Packet V1
// Server-side utility: resolves all children linked to a logged-in guardian.
// Replaces the scattered `playerIds[0]` collapse point across parent pages.
// No writes. No mutations. No AI calls. Academy-scoped.
//
// USAGE:
//   const ctx = await resolveParentChildContext(supabase)
//   if (ctx.status !== 'ok') return handleError(ctx)
//   const child = ctx.state.children[0] // or use activeChildId
//
// SCHEMA NOTE (from Sprint 617 audit):
//   player_guardians has no display_order — ordering is positional.
//   guardians.relationship is global, not per-child.
//   See parentMultiChildModel.ts for full schema gap documentation.

import { getSupabaseServer } from '@/lib/supabase/server'
import {
  buildParentMultiChildState,
  buildChildLinkRecord,
  getActiveChildLink,
  type ParentMultiChildState,
  type ParentChildRelationshipKind,
} from './parentMultiChildModel'

// ── Result types ────────────────────────────────────────────────────────────

export type ParentChildContextStatus =
  | 'ok'
  | 'unauthenticated'
  | 'no_academy'
  | 'no_guardian'
  | 'no_children'

export interface ParentChildContextOk {
  status: 'ok'
  userId: string
  academyId: string
  state: ParentMultiChildState
  /** Convenience: the active child (first child if no activeChildId) */
  activeChild: {
    playerId: string
    playerName: string | null
  } | null
}

export interface ParentChildContextError {
  status: Exclude<ParentChildContextStatus, 'ok'>
  userId?: string
  academyId?: string
}

export type ParentChildContext = ParentChildContextOk | ParentChildContextError

// ── Main resolver ────────────────────────────────────────────────────────────

/**
 * Resolve all children linked to the currently authenticated guardian.
 * Call this at the top of any parent page server component.
 */
export async function resolveParentChildContext(
  activeChildId: string | null = null,
): Promise<ParentChildContext> {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'unauthenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  const academyId = profile?.academy_id ?? null
  if (!academyId) return { status: 'no_academy', userId: user.id }

  const { data: guardian } = await rawDb
    .from('guardians')
    .select('id, relationship')
    .eq('profile_id', user.id)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (!guardian) return { status: 'no_guardian', userId: user.id, academyId }

  const { data: pgRows } = await rawDb
    .from('player_guardians')
    .select('player_id')
    .eq('guardian_id', guardian.id)
    .limit(5)

  const playerIds: string[] = (pgRows ?? []).map((r: { player_id: string }) => r.player_id)
  if (playerIds.length === 0) return { status: 'no_children', userId: user.id, academyId }

  const { data: playerRows } = await supabase
    .from('players')
    .select('id, first_name, last_name, full_name')
    .in('id', playerIds)
    .eq('academy_id', academyId)
    .eq('is_active', true)

  const playerMap = new Map<string, { name: string | null }>()
  for (const p of playerRows ?? []) {
    const name = p.full_name ?? (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}`.trim() : p.first_name ?? null)
    playerMap.set(p.id, { name })
  }

  const relationshipKind: ParentChildRelationshipKind =
    guardian.relationship === 'parent' ? 'parent'
    : guardian.relationship === 'guardian' ? 'guardian'
    : 'other'

  const children = playerIds
    .filter(id => playerMap.has(id))
    .map((id, index) =>
      buildChildLinkRecord(
        id,
        playerMap.get(id)?.name ?? null,
        guardian.id,
        relationshipKind,
        'linked',
        index,
      )
    )

  if (children.length === 0) return { status: 'no_children', userId: user.id, academyId }

  const state = buildParentMultiChildState(guardian.id, academyId, children, activeChildId ?? null)
  const activeChild = getActiveChildLink(state)

  return {
    status: 'ok',
    userId: user.id,
    academyId,
    state,
    activeChild: activeChild
      ? { playerId: activeChild.playerId, playerName: activeChild.playerName }
      : null,
  }
}

// ── Guard helper ─────────────────────────────────────────────────────────────

/**
 * Returns true if the context is ok (type-narrows to ParentChildContextOk).
 */
export function isParentChildContextOk(ctx: ParentChildContext): ctx is ParentChildContextOk {
  return ctx.status === 'ok'
}
