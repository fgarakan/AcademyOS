import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelBuilderShell } from '@/components/curriculum/builder/CurriculumLevelBuilderShell'

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

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/director/curriculum/map" className="text-text-muted hover:text-lime transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="page-eyebrow">Curriculum · {level.stage?.replace(/_/g, ' ')}</p>
          <h1 className="page-title">{level.display_name}</h1>
        </div>
      </div>
      <p className="page-subtitle max-w-xl">
  Review and customize this level&apos;s drills, gates, and coaching language.
      </p>
      <div className="rounded-2xl border border-lime/10 bg-lime/[0.02] px-4 py-3">
        <p className="text-[11px] text-text-muted">
          <span className="text-lime font-semibold">Draft mode — </span>
          All changes create a draft in the Review Queue. Nothing is applied until you approve it there.
        </p>
      </div>
      <CurriculumLevelBuilderShell level={level} data={explorerData} />
    </div>
  )
}
