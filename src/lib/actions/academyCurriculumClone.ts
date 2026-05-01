'use server'

import { getSupabaseServer } from '@/lib/supabase/server'

export interface CreateAcademyCurriculumCloneResult {
  ok: boolean
  error: string | null
  versionId: string | null
  alreadyExists: boolean
}

export async function createAcademyCurriculumCloneAction(): Promise<CreateAcademyCurriculumCloneResult> {
  const fail = (error: string): CreateAcademyCurriculumCloneResult =>
    ({ ok: false, error, versionId: null, alreadyExists: false })

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')

  // 2. Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  // 3. Verify active academy membership — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail('You do not have permission to create an academy curriculum version.')
  }

  const rawDb = supabase as any

  // 4. Check if academy already has an active version
  const { data: existingActive } = await rawDb
    .from('academy_curriculum_versions')
    .select('id, name, status, version_number')
    .eq('academy_id', academyId)
    .eq('status', 'active')
    .limit(1)
    .single()

  if (existingActive) {
    return { ok: true, error: null, versionId: existingActive.id, alreadyExists: true }
  }

  // 5. Also check for any draft version (safeguard)
  const { data: existingDraft } = await rawDb
    .from('academy_curriculum_versions')
    .select('id')
    .eq('academy_id', academyId)
    .in('status', ['draft', 'active'])
    .limit(1)
    .single()

  if (existingDraft) {
    return { ok: true, error: null, versionId: existingDraft.id, alreadyExists: true }
  }

  // 6. Fetch academy name for version label
  const { data: academy } = await supabase
    .from('academies')
    .select('name')
    .eq('id', academyId)
    .single()
  const academyName = academy?.name ?? 'Academy'

  // 7. Create the academy curriculum version
  const now = new Date().toISOString()
  const { data: created, error: insertError } = await rawDb
    .from('academy_curriculum_versions')
    .insert({
      academy_id: academyId,
      base_curriculum_version_id: null,
      name: `${academyName} Curriculum V1`,
      description: 'Academy-specific curriculum version. Customizations are stored as overrides on top of the global curriculum spine.',
      status: 'active',
      version_number: 1,
      cloned_from_global_at: now,
      activated_at: now,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (insertError || !created) {
    return fail(`Failed to create curriculum version: ${insertError?.message ?? 'unknown error'}`)
  }

  // 8. Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'curriculum_clone.version.created',
      target_type: 'academy_curriculum_version',
      target_id: created.id,
      payload: {
        version_id: created.id,
        version_name: `${academyName} Curriculum V1`,
        version_number: 1,
        cloned_from_global_at: now,
        created_by: user.id,
        source: 'manual_create',
      },
      source_type: 'ui',
    })

  return { ok: true, error: null, versionId: created.id, alreadyExists: false }
}
