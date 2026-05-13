import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumExplorer } from '@/components/curriculum/CurriculumExplorer'
import { CurriculumDemoFlowPanel } from '@/components/curriculum/CurriculumDemoFlowPanel'
import { AcademyCurriculumVersionCard } from './AcademyCurriculumVersionCard'
import { VoiceOverrideInputPanel } from './VoiceOverrideInputPanel'
import { PageExplainerCard } from '@/components/onboarding/PageExplainerCard'
import { CurriculumCustomizationAssistant } from '@/components/curriculum/CurriculumCustomizationAssistant'
import { CurriculumLoopDiagram } from '@/components/onboarding/CurriculumLoopDiagram'

export default async function DirectorCurriculumPage() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single<Pick<Tables<'profiles'>, 'academy_id'>>()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  // Load all curriculum explorer data (migration 052 tables)
  const explorerData = await getCurriculumExplorerData(supabase)

  const rawDb = supabase as any

  // Academy curriculum version (migration 048, may not be applied)
  interface VersionRow {
    id: string
    name: string
    status: string
    version_number: number
    cloned_from_global_at: string | null
    activated_at: string | null
  }
  const { data: versionRow, error: versionError } = await rawDb
    .from('academy_curriculum_versions')
    .select('id, name, status, version_number, cloned_from_global_at, activated_at')
    .eq('academy_id', academyId)
    .in('status', ['active', 'draft'])
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const activeVersion: VersionRow | null = versionError ? null : (versionRow ?? null)

  let overrideCount = 0
  if (activeVersion?.id) {
    const { count } = await rawDb
      .from('academy_curriculum_overrides')
      .select('*', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('curriculum_version_id', activeVersion.id)
      .eq('status', 'applied')
    overrideCount = count ?? 0
  }

  const versionData = activeVersion
    ? {
        id: activeVersion.id,
        name: activeVersion.name,
        status: activeVersion.status,
        version_number: activeVersion.version_number,
        cloned_from_global_at: activeVersion.cloned_from_global_at,
        activated_at: activeVersion.activated_at,
        override_count: overrideCount,
      }
    : null

  return (
    <div className="animate-fade-in p-6 space-y-10">

      {/* Page header */}
      <div>
        <p className="page-eyebrow">Director</p>
        <h1 className="page-title">Curriculum</h1>
        <p className="page-subtitle max-w-xl">
          The global curriculum spine — 15 levels, evidence-based gates, 152 drills,
          and coaching language. Read-only. Your academy customizations stay in your version.
        </p>
      </div>

      {/* Page context card */}
      <PageExplainerCard
        title="Customize your academy curriculum"
        body="Academy OS starts with a global development spine. You can review each level, understand the gates, and later create academy-specific adjustments without changing the global default."
        qa={[
          {
            q: 'What is this page?',
            a: 'A read-only view of the Academy OS global curriculum — 15 levels, evidence-based gates, drills, and coach language.',
          },
          {
            q: 'Why does it matter?',
            a: 'The curriculum defines what players learn, in what order, and what evidence shows they are ready to advance.',
          },
          {
            q: 'What should I do first?',
            a: 'Explore one level — try Orange 1. Read the gates, browse the drills, and check the coach language.',
          },
          {
            q: 'What happens after customization?',
            a: 'Academy adjustments live in your version. They flow into templates and sessions without touching the global spine.',
          },
          {
            q: 'Safe to ignore for now?',
            a: 'Academy overrides and the voice customization input. Review the curriculum first, then customize later.',
          },
        ]}
      />

      {/* Curriculum execution loop diagram */}
      <div className="px-5 py-4 rounded-2xl border border-border bg-surface-raised">
        <CurriculumLoopDiagram />
      </div>

      {/* Customization assistant — 5-step guide, three-layer distinction, glossary */}
      <CurriculumCustomizationAssistant />

      {/* Premium Curriculum Explorer */}
      <section id="curriculum-explorer" className="space-y-4">
        <p className="label-xs">Global Curriculum Explorer</p>
        <CurriculumExplorer data={explorerData} />
      </section>

      {/* Academy Curriculum Version + Voice */}
      <section className="space-y-4">
        <p className="label-xs">Your Academy Curriculum</p>
        <AcademyCurriculumVersionCard version={versionData} />
        {process.env.NODE_ENV !== 'production' && (
          <VoiceOverrideInputPanel hasActiveVersion={!!activeVersion} />
        )}
      </section>

      {/* Demo flow — dev/staging only */}
      {process.env.NODE_ENV !== 'production' && (
        <CurriculumDemoFlowPanel />
      )}

      {/* How it works */}
      <div className="px-5 py-4 rounded-2xl border border-border bg-surface-raised">
        <p className="label-xs mb-3">How Customization Works</p>
        <ol className="space-y-2">
          {[
            'Create your academy curriculum version.',
            'Type a customization and submit it.',
            'Approve it in the Review Queue.',
            'Populate templates — sessions carry the academy context automatically.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-[12px] text-text-secondary">
              <span className="shrink-0 w-5 h-5 rounded-full border border-border flex items-center justify-center text-[10px] font-mono text-text-muted">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4">
          <Link href="/director/fitness/templates" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors">
            Templates <ChevronRight className="w-3 h-3" />
          </Link>
          <Link href="/director/review" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors">
            Review Queue <ChevronRight className="w-3 h-3" />
          </Link>
          <Link href="/director/curriculum/academy-version" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors">
            Academy Version <ChevronRight className="w-3 h-3" />
          </Link>
          <Link href="/director/curriculum/learning" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors">
            Learning Modules <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

    </div>
  )
}
