import type { SupabaseClient } from '@supabase/supabase-js'

export interface AcademyVersionRow {
  id: string
  name: string
  description: string | null
  status: string
  version_number: number
  cloned_from_global_at: string | null
  activated_at: string | null
  created_at: string
}

export interface AcademyOverrideRow {
  id: string
  target_type: string
  override_type: string
  scope: string
  pathway: string | null
  proposed_change: Record<string, unknown>
  applied_change: Record<string, unknown> | null
  override_reason: string | null
  raw_input: string | null
  status: string
  created_at: string
  applied_at: string | null
}

export interface AcademyCurriculumContext {
  academyId: string
  curriculumVersionId: string | null
  curriculumVersionName: string | null
  usingAcademyVersion: boolean
  fallbackReason: string | null
  levelId: string | null
  levelName: string | null
  applicableOverrides: AcademyOverrideRow[]
  warnings: string[]
}

// Returns the active academy_curriculum_versions row for an academy, or null if none.
export async function getActiveAcademyCurriculumVersion(
  supabase: SupabaseClient<any>,
  academyId: string,
): Promise<AcademyVersionRow | null> {
  const rawDb = supabase as any
  const { data } = await rawDb
    .from('academy_curriculum_versions')
    .select('id, name, description, status, version_number, cloned_from_global_at, activated_at, created_at')
    .eq('academy_id', academyId)
    .eq('status', 'active')
    .order('version_number', { ascending: false })
    .limit(1)
    .single()
  return (data as AcademyVersionRow | null) ?? null
}

export interface ResolveContextInput {
  supabase: SupabaseClient<any>
  academyId: string
  templateId?: string | null
  groupId?: string | null
  playerId?: string | null
  sessionId?: string | null
}

// Resolves which curriculum version and level applies for a given context.
// Falls back to global defaults when no academy version exists.
// Returns applicable applied overrides — read-only, never destructive.
export async function resolveAcademyCurriculumContext(
  input: ResolveContextInput,
): Promise<AcademyCurriculumContext> {
  const { supabase, academyId, templateId, playerId } = input
  const rawDb = supabase as any
  const warnings: string[] = []

  const activeVersion = await getActiveAcademyCurriculumVersion(supabase, academyId)

  const usingAcademyVersion = !!activeVersion
  const fallbackReason = activeVersion
    ? null
    : 'No active academy curriculum version — using global defaults.'

  let levelId: string | null = null
  let levelName: string | null = null

  // Prefer template curriculum_level_id as primary context
  if (templateId) {
    const { data: template } = await rawDb
      .from('templates')
      .select('curriculum_level_id')
      .eq('id', templateId)
      .eq('academy_id', academyId)
      .single()
    levelId = (template?.curriculum_level_id as string | null) ?? null
  }

  // Fall back to player's current curriculum state
  if (!levelId && playerId) {
    const { data: pcs } = await rawDb
      .from('player_curriculum_states')
      .select('current_level_id')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .limit(1)
      .maybeSingle()
    levelId = (pcs?.current_level_id as string | null) ?? null
  }

  if (levelId) {
    const { data: level } = await rawDb
      .from('curriculum_levels')
      .select('display_name')
      .eq('id', levelId)
      .single()
    levelName = (level?.display_name as string | null) ?? null
  } else {
    warnings.push('No curriculum level resolved for this context.')
  }

  const applicableOverrides = await getAcademyOverridesForContext({
    supabase,
    academyId,
    curriculumVersionId: activeVersion?.id ?? null,
    levelId,
    pathway: null,
    scope: null,
  })

  return {
    academyId,
    curriculumVersionId: activeVersion?.id ?? null,
    curriculumVersionName: activeVersion?.name ?? null,
    usingAcademyVersion,
    fallbackReason,
    levelId,
    levelName,
    applicableOverrides,
    warnings,
  }
}

export interface GetOverridesInput {
  supabase: SupabaseClient<any>
  academyId: string
  curriculumVersionId: string | null
  levelId?: string | null
  pathway?: string | null
  scope?: string | null
}

// Returns all applied overrides for the given academy version.
// Optional levelId/pathway/scope filters are not yet enforced in V1 — returns all applied overrides.
// Callers should filter further if needed.
export async function getAcademyOverridesForContext(
  input: GetOverridesInput,
): Promise<AcademyOverrideRow[]> {
  const { supabase, academyId, curriculumVersionId } = input
  if (!curriculumVersionId) return []

  const rawDb = supabase as any
  const { data } = await rawDb
    .from('academy_curriculum_overrides')
    .select(
      'id, target_type, override_type, scope, pathway, proposed_change, applied_change, override_reason, raw_input, status, created_at, applied_at',
    )
    .eq('academy_id', academyId)
    .eq('curriculum_version_id', curriculumVersionId)
    .eq('status', 'applied')
    .order('created_at', { ascending: false })
    .limit(50)

  return ((data ?? []) as AcademyOverrideRow[])
}

// Extracts focus tags from applicable overrides.
// Used to bias content selection in template block population.
export function extractOverrideFocusTags(overrides: AcademyOverrideRow[]): string[] {
  const tags: string[] = []
  for (const ov of overrides) {
    const change = ov.applied_change ?? ov.proposed_change
    const focus = (change as any)?.parsed_focus
    if (Array.isArray(focus)) {
      tags.push(...(focus as string[]))
    }
  }
  return Array.from(new Set(tags))
}

// Builds a short human-readable summary of applicable overrides for notes headers.
export function buildOverrideSummaryLines(overrides: AcademyOverrideRow[]): string[] {
  if (overrides.length === 0) return []
  return overrides.slice(0, 3).map(ov => {
    const change = ov.applied_change ?? ov.proposed_change
    const summary = (change as any)?.proposed_change_summary ?? (change as any)?.summary ?? null
    return summary ? `• ${summary}` : `• Override: ${ov.override_type} (${ov.scope})`
  })
}
