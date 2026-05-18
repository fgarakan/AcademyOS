import { getSupabaseServer } from '@/lib/supabase/server'
import { CurriculumSetupBuilder } from './CurriculumSetupBuilder'
import type { CurriculumSetupState } from '@/lib/curriculum/curriculumSetupTypes'
import { DEFAULT_CURRICULUM_SETUP_STATE } from '@/lib/curriculum/curriculumSetupTypes'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'

export default async function CurriculumBuilderPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in to access the Curriculum Builder.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">
          Curriculum setup is only available to academy directors.
        </p>
      </div>
    )
  }

  const rawDb = supabase as any
  const { data: academy } = await rawDb
    .from('academies')
    .select('id, name, settings')
    .eq('id', academyId)
    .single()

  const settings = (academy?.settings as Record<string, unknown>) ?? {}
  const rawV2 = (settings.curriculum_setup_v2 as Record<string, unknown>) ?? {}

  const initialState: CurriculumSetupState = {
    ...DEFAULT_CURRICULUM_SETUP_STATE,
    ...rawV2,
  }

  const explorerData = await getCurriculumExplorerData(supabase)

  return (
    <CurriculumSetupBuilder initialState={initialState} origin="builder" levels={explorerData.levels} />
  )
}
