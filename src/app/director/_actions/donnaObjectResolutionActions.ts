'use server'

// Donna Object Resolution Server Action — Sprint 269 / Mega Sprint 694
// Read-only: resolves user-typed names/descriptions into real Academy OS objects.
// Never mutates. Scoped to the current director's academy.
// Returns structured candidates — director must confirm before any write.

import { getSupabaseServer } from '@/lib/supabase/server'
import { resolveDatePhrase } from '@/lib/donna/resolveDatePhrase'
import type {
  DonnaResolvableObjectType,
  DonnaResolvedObjectCandidate,
  DonnaObjectResolutionResult,
} from '@/components/assistant/donnaObjectResolutionTypes'

// ---------------------------------------------------------------------------
// Auth + academy_id helper — read-only context
// ---------------------------------------------------------------------------

async function getReadContext(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof getSupabaseServer>>; academyId: string }
  | { ok: false; error: string }
> {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }

  return { ok: true, supabase, academyId: profile.academy_id }
}

// ---------------------------------------------------------------------------
// Confidence scoring
// Single-word query against a multi-word label is always capped at medium —
// a first name alone does not uniquely identify a person.
// ---------------------------------------------------------------------------

function scoreCandidate(label: string, query: string): 'low' | 'medium' | 'high' {
  const lLabel = label.toLowerCase()
  const lQuery = query.toLowerCase().trim()
  const labelIsMultiWord = lLabel.includes(' ')
  const queryIsSingleWord = !lQuery.includes(' ')

  if (lLabel === lQuery) return 'high'

  // Cap single-word queries against multi-word labels at medium
  if (queryIsSingleWord && labelIsMultiWord) {
    if (lLabel.startsWith(lQuery) || lLabel.includes(` ${lQuery}`) || lLabel.includes(lQuery)) {
      return 'medium'
    }
    return 'low'
  }

  if (lLabel.startsWith(lQuery) || lLabel.includes(` ${lQuery}`)) return 'high'
  if (lLabel.includes(lQuery)) return 'medium'
  return 'low'
}

// ---------------------------------------------------------------------------
// Token overlap scorer — used for group fuzzy matching fallback
// Returns ratio of query tokens found in label (0.0 – 1.0)
// ---------------------------------------------------------------------------

function tokenOverlapRatio(label: string, query: string): number {
  const labelTokens = label.toLowerCase().split(/\s+/).filter((t) => t.length >= 1)
  const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 1)
  if (queryTokens.length === 0) return 0
  const matchCount = queryTokens.filter((t) => labelTokens.includes(t)).length
  return matchCount / queryTokens.length
}

// ---------------------------------------------------------------------------
// Safe result builder
// ---------------------------------------------------------------------------

function buildResult(
  objectType: DonnaResolvableObjectType,
  query: string,
  candidates: DonnaResolvedObjectCandidate[],
): DonnaObjectResolutionResult {
  if (candidates.length === 0) {
    return {
      ok: true,
      objectType,
      query,
      status: 'no_match',
      candidates: [],
      message: `No ${objectType.replace('_', ' ')} found matching "${query}". Try a full name or check the spelling.`,
      safetyNotes: ['Nothing will be saved until you clarify who or what you mean.'],
    }
  }

  if (candidates.length === 1) {
    return {
      ok: true,
      objectType,
      query,
      status: 'resolved_single',
      candidates,
      selectedId: candidates[0].id,
      message: `I found one match for "${query}". Confirm this is correct before I attach anything.`,
      safetyNotes: ['I will not save until you confirm this is the right record.'],
    }
  }

  return {
    ok: true,
    objectType,
    query,
    status: 'multiple_matches',
    candidates,
    message: `I found ${candidates.length} possible matches for "${query}". Choose the correct one.`,
    safetyNotes: [
      'I will not guess between these.',
      'Choose the correct record — I will not save until you confirm.',
    ],
  }
}

// ---------------------------------------------------------------------------
// Player resolution — queries v_player_summary
// Returns: player_id, full_name, level_label, group_name
// ---------------------------------------------------------------------------

async function resolvePlayers(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  query: string,
): Promise<DonnaResolvedObjectCandidate[]> {
  const rawDb = supabase as any
  const { data, error } = await rawDb
    .from('v_player_summary')
    .select('player_id, full_name, level_label, group_name')
    .eq('academy_id', academyId)
    .ilike('full_name', `%${query}%`)
    .limit(5)

  if (error || !data) return []

  return data
    .filter((row: any) => row.player_id && row.full_name)
    .map((row: any): DonnaResolvedObjectCandidate => {
      const parts: string[] = []
      if (row.level_label) parts.push(row.level_label)
      if (row.group_name) parts.push(row.group_name)
      return {
        id: row.player_id,
        type: 'player',
        label: row.full_name,
        subtitle: parts.join(' · ') || undefined,
        confidence: scoreCandidate(row.full_name, query),
      }
    })
}

// ---------------------------------------------------------------------------
// Group resolution — ilike primary, token-overlap fallback
// "Orange 2" → no ilike hit on "Orange Ball 2" → token overlap finds it
// ---------------------------------------------------------------------------

async function resolveGroups(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  query: string,
): Promise<DonnaResolvedObjectCandidate[]> {
  const rawDb = supabase as any

  function mapGroupRow(row: any, confidence: DonnaResolvedObjectCandidate['confidence']): DonnaResolvedObjectCandidate {
    const parts: string[] = []
    if (row.level_label) parts.push(row.level_label)
    if (row.lead_coach_name) parts.push(`Coach: ${row.lead_coach_name}`)
    if (row.player_count != null) parts.push(`${row.player_count} players`)
    return {
      id: row.group_id,
      type: 'group',
      label: row.group_name,
      subtitle: parts.join(' · ') || undefined,
      confidence,
    }
  }

  // Primary: ilike substring match
  const { data: exactData, error: exactError } = await rawDb
    .from('v_group_summary')
    .select('group_id, group_name, level_label, lead_coach_name, player_count')
    .eq('academy_id', academyId)
    .ilike('group_name', `%${query}%`)
    .limit(5)

  if (!exactError && exactData && exactData.length > 0) {
    return exactData
      .filter((row: any) => row.group_id && row.group_name)
      .map((row: any) => mapGroupRow(row, scoreCandidate(row.group_name, query)))
  }

  // Token overlap fallback — multi-token queries only
  // Covers "Orange 2" → "Orange Ball 2" (tokens: ["orange","2"] both present)
  const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 1)
  if (queryTokens.length < 2) return []

  const { data: allGroups, error: allError } = await rawDb
    .from('v_group_summary')
    .select('group_id, group_name, level_label, lead_coach_name, player_count')
    .eq('academy_id', academyId)
    .limit(100)

  if (allError || !allGroups) return []

  const fuzzyMatches = (allGroups as any[])
    .filter((row: any) => {
      if (!row.group_id || !row.group_name) return false
      return tokenOverlapRatio(row.group_name, query) >= 0.6
    })
    .slice(0, 5)

  // Token-overlap candidates are always medium confidence
  return fuzzyMatches.map((row: any) => mapGroupRow(row, 'medium'))
}

// ---------------------------------------------------------------------------
// Coach resolution — academy_memberships + profiles (sequential per rule #5)
// Returns: profile_id, display_name, role
// ---------------------------------------------------------------------------

async function resolveCoaches(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  query: string,
): Promise<DonnaResolvedObjectCandidate[]> {
  const { data: memberships, error: mErr } = await supabase
    .from('academy_memberships')
    .select('profile_id, role')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .in('role', ['coach', 'head_coach', 'academy_director'])

  if (mErr || !memberships || memberships.length === 0) return []

  const profileIds = memberships.map((m) => m.profile_id)

  const rawDb = supabase as any
  const { data: profiles, error: pErr } = await rawDb
    .from('profiles')
    .select('id, display_name')
    .in('id', profileIds)
    .ilike('display_name', `%${query}%`)
    .limit(5)

  if (pErr || !profiles) return []

  return profiles
    .filter((p: any) => p.id && p.display_name)
    .map((p: any): DonnaResolvedObjectCandidate => {
      const membership = memberships.find((m) => m.profile_id === p.id)
      const roleLabel = membership?.role?.replace('_', ' ') ?? 'staff'
      return {
        id: p.id,
        type: 'coach',
        label: p.display_name,
        subtitle: roleLabel,
        confidence: scoreCandidate(p.display_name, query),
      }
    })
}

// ---------------------------------------------------------------------------
// Session resolution
// Supports: name search, ISO date, NLP date, group_id filter, coach_id filter
// ---------------------------------------------------------------------------

async function resolveSessions(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  query: string,
  context?: { groupId?: string; coachId?: string },
): Promise<DonnaResolvedObjectCandidate[]> {
  const rawDb = supabase as any

  // Resolve NLP date before querying — "today" → "2026-06-07"
  const resolvedDate = resolveDatePhrase(query)

  function mapSessionRow(
    s: any,
    confidence: DonnaResolvedObjectCandidate['confidence'],
  ): DonnaResolvedObjectCandidate {
    return {
      id: s.id,
      type: 'session',
      label: s.name ?? `Session on ${s.scheduled_date}`,
      subtitle: `${s.scheduled_date ?? ''}${s.status ? ` · ${s.status}` : ''}`,
      confidence,
    }
  }

  // Group-scoped path — "How did Green Ball do today?"
  if (context?.groupId) {
    let q = rawDb
      .from('sessions')
      .select('id, name, scheduled_date, status')
      .eq('academy_id', academyId)
      .eq('group_id', context.groupId)
      .order('scheduled_date', { ascending: false })
      .limit(5)

    if (resolvedDate) {
      q = q.eq('scheduled_date', resolvedDate)
    }

    const { data } = await q
    if (data && data.length > 0) {
      const conf = resolvedDate ? 'high' : 'medium'
      return (data as any[]).filter((s: any) => s.id).map((s: any) => mapSessionRow(s, conf))
    }
    return []
  }

  // Coach-scoped path — "How did Danny's group do today?"
  if (context?.coachId) {
    let q = rawDb
      .from('sessions')
      .select('id, name, scheduled_date, status')
      .eq('academy_id', academyId)
      .eq('coach_id', context.coachId)
      .order('scheduled_date', { ascending: false })
      .limit(5)

    if (resolvedDate) {
      q = q.eq('scheduled_date', resolvedDate)
    }

    const { data } = await q
    if (data && data.length > 0) {
      const conf = resolvedDate ? 'high' : 'medium'
      return (data as any[]).filter((s: any) => s.id).map((s: any) => mapSessionRow(s, conf))
    }
    return []
  }

  // Name match — with resolved date as search term if applicable
  const nameQuery = resolvedDate ?? query
  const { data: byName } = await rawDb
    .from('sessions')
    .select('id, name, scheduled_date, status')
    .eq('academy_id', academyId)
    .ilike('name', `%${nameQuery}%`)
    .order('scheduled_date', { ascending: false })
    .limit(5)

  if (byName && byName.length > 0) {
    return (byName as any[])
      .filter((s: any) => s.id)
      .map((s: any) => mapSessionRow(s, scoreCandidate(s.name ?? '', nameQuery)))
  }

  // Date match — exact match on scheduled_date (works for both ISO and resolved NLP)
  const dateToMatch = resolvedDate ?? query
  const { data: byDate } = await rawDb
    .from('sessions')
    .select('id, name, scheduled_date, status')
    .eq('academy_id', academyId)
    .eq('scheduled_date', dateToMatch)
    .order('scheduled_date', { ascending: false })
    .limit(5)

  if (byDate && byDate.length > 0) {
    return (byDate as any[])
      .filter((s: any) => s.id)
      .map((s: any) => mapSessionRow(s, 'medium'))
  }

  return []
}

// ---------------------------------------------------------------------------
// Guardian resolution — player_guardians + guardians
// Primary path: playerId context → fetch all guardians for that player
// Fallback: name search within academy
// ---------------------------------------------------------------------------

async function resolveGuardians(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  query: string,
  context?: { playerId?: string },
): Promise<DonnaResolvedObjectCandidate[]> {
  const rawDb = supabase as any

  function mapGuardianRow(g: any, confidence: DonnaResolvedObjectCandidate['confidence']): DonnaResolvedObjectCandidate {
    const label = `${g.first_name} ${g.last_name}`.trim()
    const parts: string[] = []
    if (g.relationship) parts.push(g.relationship)
    if (g.is_primary) parts.push('Primary')
    if (g.email) parts.push(g.email)
    return {
      id: g.id,
      type: 'parent_guardian',
      label,
      subtitle: parts.join(' · ') || undefined,
      confidence,
    }
  }

  // Player-scoped path — "Noah's parent" after Noah is resolved
  if (context?.playerId) {
    const { data: links, error: linkErr } = await supabase
      .from('player_guardians')
      .select('guardian_id')
      .eq('player_id', context.playerId)

    if (linkErr || !links || links.length === 0) return []

    const guardianIds = links.map((l) => l.guardian_id)

    const { data: guardians, error: gErr } = await rawDb
      .from('guardians')
      .select('id, first_name, last_name, relationship, is_primary, email')
      .in('id', guardianIds)
      .eq('academy_id', academyId)

    if (gErr || !guardians) return []

    return (guardians as any[])
      .filter((g: any) => g.id && g.first_name)
      .map((g: any) => mapGuardianRow(g, g.is_primary ? 'high' : 'medium'))
  }

  // Name search fallback — search by first_name or last_name
  const { data: guardians, error } = await rawDb
    .from('guardians')
    .select('id, first_name, last_name, relationship, is_primary, email')
    .eq('academy_id', academyId)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(5)

  if (error || !guardians) return []

  return (guardians as any[])
    .filter((g: any) => g.id && g.first_name)
    .map((g: any) => {
      const fullName = `${g.first_name} ${g.last_name}`.toLowerCase()
      return mapGuardianRow(g, scoreCandidate(fullName, query))
    })
}

// ---------------------------------------------------------------------------
// Class template resolution — templates without fitness_template:true tag
// ---------------------------------------------------------------------------

async function resolveClassTemplates(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  query: string,
): Promise<DonnaResolvedObjectCandidate[]> {
  const rawDb = supabase as any
  const { data, error } = await rawDb
    .from('templates')
    .select('id, name, description, tags, total_duration_min')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .limit(10)

  if (error || !data) return []

  return (data as any[])
    .filter((t: any) => {
      const tags: string[] = t.tags ?? []
      return !tags.includes('fitness_template:true')
    })
    .slice(0, 5)
    .map((t: any): DonnaResolvedObjectCandidate => {
      const parts: string[] = []
      if (t.total_duration_min) parts.push(`${t.total_duration_min} min`)
      if (t.description) parts.push(t.description.slice(0, 40))
      return {
        id: t.id,
        type: 'class_template',
        label: t.name,
        subtitle: parts.join(' · ') || undefined,
        confidence: scoreCandidate(t.name, query),
      }
    })
}

// ---------------------------------------------------------------------------
// Fitness template resolution — templates with fitness_template:true tag
// ---------------------------------------------------------------------------

async function resolveFitnessTemplates(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  query: string,
): Promise<DonnaResolvedObjectCandidate[]> {
  const rawDb = supabase as any
  const { data, error } = await rawDb
    .from('templates')
    .select('id, name, description, tags, total_duration_min')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .limit(10)

  if (error || !data) return []

  return (data as any[])
    .filter((t: any) => {
      const tags: string[] = t.tags ?? []
      return tags.includes('fitness_template:true')
    })
    .slice(0, 5)
    .map((t: any): DonnaResolvedObjectCandidate => {
      const intensityTag = (t.tags ?? []).find((tag: string) => tag.startsWith('intensity:'))
      const parts: string[] = []
      if (t.total_duration_min) parts.push(`${t.total_duration_min} min`)
      if (intensityTag) parts.push(intensityTag.replace('intensity:', ''))
      return {
        id: t.id,
        type: 'fitness_template',
        label: t.name,
        subtitle: parts.join(' · ') || undefined,
        confidence: scoreCandidate(t.name, query),
      }
    })
}

// ---------------------------------------------------------------------------
// Main resolution entry point — called from DonnaAssistantButton
//
// context (optional):
//   groupId  — scope session lookups to a specific group
//   coachId  — scope session lookups to a specific coach
//   playerId — scope guardian lookups to a specific player's guardians
// ---------------------------------------------------------------------------

export async function resolveDonnaObjectAction(
  objectType: DonnaResolvableObjectType,
  query: string,
  context?: { groupId?: string; coachId?: string; playerId?: string },
): Promise<DonnaObjectResolutionResult> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return {
      ok: false,
      objectType,
      query,
      status: 'error',
      candidates: [],
      message: 'Search query cannot be empty.',
      safetyNotes: [],
    }
  }

  const ctx = await getReadContext()
  if (!ctx.ok) {
    return {
      ok: false,
      objectType,
      query,
      status: 'error',
      candidates: [],
      message: ctx.error,
      safetyNotes: [],
    }
  }

  const { supabase, academyId } = ctx

  try {
    let candidates: DonnaResolvedObjectCandidate[] = []

    switch (objectType) {
      case 'player':
        candidates = await resolvePlayers(supabase, academyId, trimmedQuery)
        break
      case 'group':
        candidates = await resolveGroups(supabase, academyId, trimmedQuery)
        break
      case 'coach':
        candidates = await resolveCoaches(supabase, academyId, trimmedQuery)
        break
      case 'session':
        candidates = await resolveSessions(supabase, academyId, trimmedQuery, context)
        break
      case 'class_template':
        candidates = await resolveClassTemplates(supabase, academyId, trimmedQuery)
        break
      case 'fitness_template':
        candidates = await resolveFitnessTemplates(supabase, academyId, trimmedQuery)
        break
      case 'parent_guardian':
        candidates = await resolveGuardians(supabase, academyId, trimmedQuery, context)
        break
    }

    return buildResult(objectType, trimmedQuery, candidates)
  } catch {
    return {
      ok: false,
      objectType,
      query,
      status: 'error',
      candidates: [],
      message: 'An error occurred while searching. Please try again.',
      safetyNotes: [],
    }
  }
}
