import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumGuidedReviewShell } from '@/components/curriculum/builder/CurriculumGuidedReviewShell'

export default async function CurriculumGuidedPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const explorerData = await getCurriculumExplorerData(supabase)

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/director/curriculum/builder" className="text-text-muted hover:text-lime transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="page-eyebrow">Curriculum</p>
          <h1 className="page-title">Guided Level Review</h1>
        </div>
      </div>
      <p className="page-subtitle max-w-xl">
        Step through each level with DONNA. Review gates, drills, and coaching language at your own pace.
      </p>
      <CurriculumGuidedReviewShell data={explorerData} />
    </div>
  )
}
