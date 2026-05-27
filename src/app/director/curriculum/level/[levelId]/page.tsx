import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelBuilderExperience } from '@/components/curriculum/builder/CurriculumLevelBuilderExperience'
import { CurriculumBuilderChangeQueue } from '@/app/director/curriculum/builder/CurriculumBuilderChangeQueue'

interface Props {
  params: { levelId: string }
}

/** Skeleton shown while CurriculumBuilderChangeQueue streams in. */
function ChangeQueueSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-3 w-24 rounded bg-surface-raised" />
      <div className="rounded-xl border border-border bg-surface-raised px-3 py-2.5 space-y-2">
        <div className="h-2.5 w-3/4 rounded bg-surface" />
        <div className="h-2 w-1/2 rounded bg-surface" />
      </div>
      <div className="rounded-xl border border-border bg-surface-raised px-3 py-2.5 space-y-2">
        <div className="h-2.5 w-full rounded bg-surface" />
        <div className="h-2 w-2/3 rounded bg-surface" />
      </div>
    </div>
  )
}

export default async function CurriculumLevelPage({ params }: Props) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const explorerData = await getCurriculumExplorerData(supabase)
  const level = explorerData.levels.find(l => l.id === params.levelId)

  if (!level) notFound()

  /**
   * RSC slot: CurriculumBuilderChangeQueue is a server component passed
   * as a React.ReactNode prop into the CurriculumLevelBuilderExperience
   * client component. Next.js App Router supports this pattern — the RSC
   * is rendered on the server, then passed as an already-resolved node.
   *
   * Wrapped in Suspense so the main level builder renders immediately
   * while the change queue streams in separately.
   *
   * Read-only — no mutations, no approve/reject, no execute_curriculum_override().
   */
  const changeQueue = (
    <Suspense fallback={<ChangeQueueSkeleton />}>
      <CurriculumBuilderChangeQueue />
    </Suspense>
  )

  return (
    <CurriculumLevelBuilderExperience
      level={level}
      explorerData={explorerData}
      changeQueue={changeQueue}
    />
  )
}
