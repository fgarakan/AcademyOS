'use server'

// Mega Sprint 2321–2340 — DONNA Entity Execution Integration V1
// Server action: loads the lightweight entity context slice used by the V2
// entity resolver in the DONNA brain. Loads player curriculum states, groups,
// templates, and assessments — all with academy_id scoping and RLS enforcement.

import { getSupabaseServer } from '@/lib/supabase/server'
import {
  loadPlayerCurriculumStates,
  loadGroupsSummary,
  loadTemplatesSummary,
  loadAssessmentsSummary,
} from '@/lib/donna/extendedContextLoaders'
import { buildEntityContext } from '@/lib/donna/entity/donnaEntityContextLoader'
import type { AcademyEntityContext } from '@/lib/donna/entity/donnaEntityResolver'

// ── Server action ──────────────────────────────────────────────────────────────

/**
 * Loads the entity context slice needed by the V2 DONNA entity resolver.
 * Returns null if the user is not authenticated or has no academy_id.
 * All queries are RLS-scoped — no service role, no bypass.
 */
export async function fetchEntityContextAction(): Promise<AcademyEntityContext | null> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id
    if (!academyId) return null

    // Load all entity kinds in parallel — all RLS-scoped to academyId
    const [playersResult, groupsResult, templatesResult, assessmentsResult] =
      await Promise.all([
        loadPlayerCurriculumStates(supabase, academyId),
        loadGroupsSummary(supabase, academyId),
        loadTemplatesSummary(supabase, academyId),
        loadAssessmentsSummary(supabase, academyId),
      ])

    return buildEntityContext({
      players:     playersResult.summaries,
      groups:      groupsResult.summaries,
      templates:   templatesResult.summaries,
      assessments: assessmentsResult.summaries,
    })
  } catch {
    return null
  }
}
