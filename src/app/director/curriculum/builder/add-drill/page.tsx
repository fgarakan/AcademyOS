import { getSupabaseServer } from '@/lib/supabase/server'
import { CurriculumAddDrillExperience } from '@/components/curriculum/builder/CurriculumAddDrillExperience'

export default async function CurriculumAddDrillPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return <CurriculumAddDrillExperience />
}
