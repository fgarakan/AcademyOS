import { getSupabaseServer } from '@/lib/supabase/server'
import { CurriculumImpactPreviewExperience } from '@/components/curriculum/builder/CurriculumImpactPreviewExperience'

export default async function CurriculumImpactPreviewPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return <CurriculumImpactPreviewExperience />
}
