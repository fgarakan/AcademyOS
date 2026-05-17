import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelMap } from '@/components/curriculum/builder/CurriculumLevelMap'

export default async function CurriculumMapPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const explorerData = await getCurriculumExplorerData(supabase)

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/director/curriculum" className="text-text-muted hover:text-lime transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="page-eyebrow">Curriculum</p>
          <h1 className="page-title">Curriculum Map</h1>
        </div>
      </div>
      <p className="page-subtitle max-w-xl">
        All 15 levels at a glance. Click any level to explore its drills, gates, and coaching language.
      </p>
      <CurriculumLevelMap data={explorerData} />
    </div>
  )
}
