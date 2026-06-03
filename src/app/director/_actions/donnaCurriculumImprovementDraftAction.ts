'use server'

// DONNA Curriculum Improvement Draft Action
// Creates a proposed_action for a curriculum improvement suggestion.
// Director must approve in the Review Center before anything is applied.
// No automatic curriculum changes — draft only.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface CurriculumImprovementDraftInput {
  recommendation:  string
  changeType:      string
  targetDomain:    string
  draftStarter:    string
  confidenceScore: number
  evidenceCount:   number
  affectedPlayers: number
  reasoning:       string
  levelKey?:       string
  levelLabel?:     string
}

export interface CurriculumImprovementDraftResult {
  ok:      boolean
  draftId: string | null
  error:   string | null
}

export async function donnaCurriculumImprovementDraftAction(
  input: CurriculumImprovementDraftInput,
): Promise<CurriculumImprovementDraftResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, draftId: null, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, draftId: null, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, draftId: null, error: 'Director or Head Coach required.' }
  }

  const rawDb = supabase as any

  const actionLabel = input.levelLabel
    ? `Curriculum Improvement — ${input.levelLabel}: ${input.recommendation}`
    : `Curriculum Improvement: ${input.recommendation}`

  const { data: draft, error } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id:    profile.academy_id,
      target_module: 'curriculum_improvement_draft',
      action_label:  actionLabel,
      status:        'pending_review',
      proposed_payload: {
        recommendation:   input.recommendation,
        change_type:      input.changeType,
        target_domain:    input.targetDomain,
        draft_starter:    input.draftStarter,
        confidence_score: input.confidenceScore,
        evidence_count:   input.evidenceCount,
        affected_players: input.affectedPlayers,
        reasoning:        input.reasoning,
        level_key:        input.levelKey ?? null,
        level_label:      input.levelLabel ?? null,
        created_by_role:  role,
        source:           'donna_curriculum_improvement_engine',
        // Safety: no automatic application
        requires_director_approval: true,
        will_not_happen: [
          'No players will be automatically moved or reassessed.',
          'No curriculum content is applied until director approves.',
          'No parent or player communications will be sent.',
          'Coach session plans will not be automatically updated.',
        ],
      },
    })
    .select('id')
    .single()

  if (error) return { ok: false, draftId: null, error: error.message }

  try {
    await rawDb.from('audit_logs').insert({
      academy_id: profile.academy_id,
      actor_id:   user.id,
      action:     'curriculum_improvement.draft_created',
      target_id:  draft?.id ?? '',
      payload: {
        recommendation:   input.recommendation,
        confidence_score: input.confidenceScore,
        evidence_count:   input.evidenceCount,
        level_key:        input.levelKey,
        role,
      },
    })
  } catch { /* non-blocking */ }

  revalidatePath('/director/curriculum')
  revalidatePath('/director/review')
  return { ok: true, draftId: draft?.id ?? null, error: null }
}
