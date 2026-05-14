'use server'

// Donna Object Resolution Server Action — Sprint 269
// Read-only: resolves user-typed names/descriptions into real Academy OS objects.
// Never mutates. Scoped to the current director's academy.
// Returns structured candidates — director must confirm before any write.

import { getSupabaseServer } from '@/lib/supabase/server'
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
// Confidence scoring helper
// ---------------------------------------------------------------------------

function scoreCandidate(label: string, query: string): 'low' | 'medium' | 'high' {
  const lLabel = label.toLowerCase()
  const lQuery = query.toLowerCase().trim()
  if (lLabel === lQuery) return 'high'
  if (lLabel.startsWith(lQuery) || lLabel.includes(` ${lQuery}`)) return 'high'
  if (lLabel.includes(lQuery)) return 'medium'
  return 'low'
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
// Group resolution — queries v_group_summary
// Returns: group_id, group_name, level_label, lead_coach_name, player_count
// ---------------------------------------------------------------------------

async function resolveGroups(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  query: string,
): Promise<DonnaResolvedObjectCandidate[]> {
  const rawDb = supabase as any
  const { data, error } = await rawDb
    .from('v_group_summary')
    .select('group_id, group_name, level_label, lead_coach_name, player_count')
    .eq('academy_id', academyId)
    .ilike('group_name', `%${query}%`)
    .limit(5)

  if (error || !data) return []

  return data
    .filter((row: any) => row.group_id && row.group_name)
    .map((row: any): DonnaResolvedObjectCandidate => {
      const parts: string[] = []
      if (row.level_label) parts.push(row.level_label)
      if (row.lead_coach_name) parts.push(`Coach: ${row.lead_coach_name}`)
      if (row.player_count != null) parts.push(`${row.player_count} players`)
      return {
        id: row.group_id,
        type: 'group',
        label: row.group_name,
        subtitle: parts.join(' · ') || undefined,
        confidence: scoreCandidate(row.group_name, query),
      }
    })
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
  // Step 1: get active coach/director memberships for this academy
  const { data: memberships, error: mErr } = await supabase
    .from('academy_memberships')
    .select('profile_id, role')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .in('role', ['coach', 'head_coach', 'academy_director'])

  if (mErr || !memberships || memberships.length === 0) return []

  const profileIds = memberships.map((m) => m.profile_id)

  // Step 2: get profiles matching the query
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
// Session resolution — queries sessions table
// Returns: id, name, scheduled_date, status
// ---------------------------------------------------------------------------

async function resolveSessions(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  academyId: string,
  query: string,
): Promise<DonnaResolvedObjectCandidate[]> {
  const rawDb = supabase as any

  // Try name match first
  const { data: byName } = await rawDb
    .from('sessions')
    .select('id, name, scheduled_date, status')
    .eq('academy_id', academyId)
    .ilike('name', `%${query}%`)
    .order('scheduled_date', { ascending: false })
    .limit(5)

  if (byName && byName.length > 0) {
    return byName
      .filter((s: any) => s.id)
      .map((s: any): DonnaResolvedObjectCandidate => ({
        id: s.id,
        type: 'session',
        label: s.name ?? `Session on ${s.scheduled_date}`,
        subtitle: `${s.scheduled_date ?? ''}${s.status ? ` · ${s.status}` : ''}`,
        confidence: scoreCandidate(s.name ?? '', query),
      }))
  }

  // Try date match — if query looks like a date fragment
  const { data: byDate } = await rawDb
    .from('sessions')
    .select('id, name, scheduled_date, status')
    .eq('academy_id', academyId)
    .ilike('scheduled_date', `%${query}%`)
    .order('scheduled_date', { ascending: false })
    .limit(5)

  if (byDate && byDate.length > 0) {
    return byDate
      .filter((s: any) => s.id)
      .map((s: any): DonnaResolvedObjectCandidate => ({
        id: s.id,
        type: 'session',
        label: s.name ?? `Session on ${s.scheduled_date}`,
        subtitle: `${s.scheduled_date ?? ''}${s.status ? ` · ${s.status}` : ''}`,
        confidence: 'medium',
      }))
  }

  return []
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

  return data
    .filter((t: any) => {
      // Exclude fitness templates
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

  return data
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
// ---------------------------------------------------------------------------

export async function resolveDonnaObjectAction(
  objectType: DonnaResolvableObjectType,
  query: string,
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
        candidates = await resolveSessions(supabase, academyId, trimmedQuery)
        break
      case 'class_template':
        candidates = await resolveClassTemplates(supabase, academyId, trimmedQuery)
        break
      case 'fitness_template':
        candidates = await resolveFitnessTemplates(supabase, academyId, trimmedQuery)
        break
      case 'parent_guardian':
        return {
          ok: true,
          objectType,
          query,
          status: 'not_supported',
          candidates: [],
          message:
            'Parent/guardian resolution is not yet available. This feature is coming in a future sprint.',
          safetyNotes: ['No parent communication will be sent from here.'],
        }
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
