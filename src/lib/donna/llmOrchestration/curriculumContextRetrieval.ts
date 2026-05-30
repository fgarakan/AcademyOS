// Sprint 992 — DONNA Curriculum Context Retrieval V1
// Safe read-only retrieval of curriculum state for DONNA context.
// Server-side only. RLS enforced. No raw content returned — structure and counts only.

import type { SupabaseClient } from '@supabase/supabase-js'

export interface CurriculumContextSummary {
  totalLevels: number
  levelsWithContent: number
  levelsWithoutContent: number
  pendingCurriculumDrafts: number
  hasCurriculumDraft: boolean
}

export interface CurriculumContextRetrievalResult {
  summary: CurriculumContextSummary
  retrievedAt: string
  errors: string[]
}

export async function retrieveCurriculumContext(
  supabase: SupabaseClient,
  academyId: string,
): Promise<CurriculumContextRetrievalResult> {
  const errors: string[] = []
  let totalLevels = 0
  let pendingDrafts = 0

  try {
    const rawDb = supabase as any
    const { count } = await rawDb
      .from('curriculum_levels')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
    totalLevels = count ?? 0
  } catch { errors.push('curriculum_levels: failed') }

  try {
    const { count } = await supabase
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')
      .eq('action_type', 'curriculum_override')
    pendingDrafts = count ?? 0
  } catch { errors.push('curriculum_drafts: failed') }

  return {
    summary: {
      totalLevels,
      levelsWithContent: 0, // V2: requires content item join
      levelsWithoutContent: 0, // V2
      pendingCurriculumDrafts: pendingDrafts,
      hasCurriculumDraft: pendingDrafts > 0,
    },
    retrievedAt: new Date().toISOString(),
    errors,
  }
}
