import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelBuilderExperience } from '@/components/curriculum/builder/CurriculumLevelBuilderExperience'

interface Props {
  params: { levelId: string }
}

export default async function CurriculumLevelPage({ params }: Props) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const explorerData = await getCurriculumExplorerData(supabase)
  const level = explorerData.levels.find(l => l.id === params.levelId)

  if (!level) notFound()

  return <CurriculumLevelBuilderExperience level={level} explorerData={explorerData} />
}
