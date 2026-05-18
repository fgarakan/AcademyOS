import { getSupabaseServer } from '@/lib/supabase/server'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumGuidedReviewExperience } from '@/components/curriculum/builder/CurriculumGuidedReviewExperience'

export default async function CurriculumGuidedPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const explorerData = await getCurriculumExplorerData(supabase)

  return <CurriculumGuidedReviewExperience explorerData={explorerData} />
}
