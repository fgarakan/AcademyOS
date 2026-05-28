import Link from 'next/link'
import { Sparkles } from 'lucide-react'
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
    <>
      {/* Sprint 912.16: DONNA entry chip — links to the God Mode conversation hub */}
      <div className="flex justify-end px-4 pt-3 pb-1">
        <Link
          href="/director/donna"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-lime/20 bg-lime/5 text-lime text-[11px] font-medium hover:bg-lime/10 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Ask DONNA
        </Link>
      </div>
      <CurriculumSetupBuilder initialState={initialState} origin="builder" levels={explorerData.levels} />
    </>
  )
}
