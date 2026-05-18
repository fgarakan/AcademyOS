import { getSupabaseServer } from '@/lib/supabase/server'
import { CurriculumAddFitnessExperience } from '@/components/curriculum/builder/CurriculumAddFitnessExperience'

export default async function CurriculumAddFitnessPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return <CurriculumAddFitnessExperience />
}
