import Link from 'next/link'
import { BookOpen, Layers, Dumbbell, ChevronRight } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { AcademyCurriculumVersionCard } from './AcademyCurriculumVersionCard'
import { VoiceOverrideInputPanel } from './VoiceOverrideInputPanel'

const UNAVAILABLE_MSG = 'Not available until curriculum migrations are applied.'

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

  // curriculum_levels — typed table, safe direct query
  const { count: levelsCount } = await supabase
    .from('curriculum_levels')
    .select('*', { count: 'exact', head: true })

  const rawDb = supabase as any

  // curriculum_track_requirements — migration 041, not yet in database.types.ts
  const { count: requirementsCount, error: reqError } = await rawDb
    .from('curriculum_track_requirements')
    .select('*', { count: 'exact', head: true })
  const requirementsUnavailable = !!reqError

  // curriculum_content_items — migration 045, may not be applied
  const { count: contentItemsCount, error: contentError } = await rawDb
    .from('curriculum_content_items')
    .select('*', { count: 'exact', head: true })
  const contentUnavailable = !!contentError

  // curriculum_content_requirement_mappings — migration 045, may not be applied
  const { count: mappingsCount, error: mappingsError } = await rawDb
    .from('curriculum_content_requirement_mappings')
    .select('*', { count: 'exact', head: true })
  const mappingsUnavailable = !!mappingsError

  // templates with curriculum_level_id — column added by migration 045, may not be applied
  const { count: templatesWithCurriculumCount, error: templatesError } = await rawDb
    .from('templates')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .not('curriculum_level_id', 'is', null)
  const templatesUnavailable = !!templatesError

  // academy_curriculum_versions — migration 048, may not be applied
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

  // academy_curriculum_overrides count for the active version
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
    <div className="animate-fade-in p-6 space-y-8">

      {/* Page header */}
      <div>
        <p className="label-xs mb-1">DIRECTOR</p>
        <h1 className="text-2xl font-bold text-text-primary">Curriculum</h1>
        <p className="text-text-secondary text-sm mt-1 max-w-lg">
          Your academy&rsquo;s curriculum version and voice customization live here.
          The global spine is shared and protected — your overrides stay in your version.
        </p>
      </div>

      {/* Primary section — Academy Curriculum Version + Voice */}
      <div className="space-y-4">
        <p className="label-xs">Your Academy Curriculum</p>
        <AcademyCurriculumVersionCard version={versionData} />
        <VoiceOverrideInputPanel hasActiveVersion={!!activeVersion} />
      </div>

      {/* How it works */}
      <div className="px-5 py-4 rounded-2xl border border-border bg-surface-raised">
        <p className="label-xs mb-3">How It Works</p>
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
          <Link href="/director/sessions" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors">
            Sessions <ChevronRight className="w-3 h-3" />
          </Link>
          <Link href="/director/curriculum/academy-version" className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors">
            Academy Version <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Curriculum Foundation */}
      <div className="space-y-4">
        <p className="label-xs">Global Curriculum Foundation</p>
        <p className="text-[11px] text-text-muted -mt-2">
          Read-only for directors. Your academy version extends this — it is never modified by your customizations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Curriculum Spine */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-text-muted" />
                <p className="text-[11px] font-semibold text-text-secondary">Curriculum Spine</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[10px] text-text-muted mb-0.5">Levels</p>
                  <p className="text-xl font-mono font-bold text-lime">{levelsCount ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted mb-0.5">Requirements</p>
                  {requirementsUnavailable ? (
                    <p className="text-[10px] text-text-muted">—</p>
                  ) : (
                    <p className="text-xl font-mono font-bold text-lime">{requirementsCount ?? '—'}</p>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-text-muted">Red Ball → Yellow Advanced</p>
            </CardContent>
          </Card>

          {/* Content Library */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-text-muted" />
                <p className="text-[11px] font-semibold text-text-secondary">Content Library</p>
              </div>
              {contentUnavailable || mappingsUnavailable ? (
                <p className="text-[10px] text-text-muted">Pending migration</p>
              ) : (
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] text-text-muted mb-0.5">Items</p>
                    <p className="text-xl font-mono font-bold text-lime">{contentItemsCount ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted mb-0.5">Mappings</p>
                    <p className="text-xl font-mono font-bold text-lime">{mappingsCount ?? '—'}</p>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-text-muted">Drills, games, skills, assessments</p>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-3.5 h-3.5 text-text-muted" />
                <p className="text-[11px] font-semibold text-text-secondary">Curriculum Templates</p>
              </div>
              {templatesUnavailable ? (
                <p className="text-[10px] text-text-muted">Pending migration</p>
              ) : (
                <div>
                  <p className="text-[10px] text-text-muted mb-0.5">With curriculum level</p>
                  <p className="text-xl font-mono font-bold text-lime">{templatesWithCurriculumCount ?? '—'}</p>
                </div>
              )}
              <Link href="/director/fitness/templates" className="inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-lime transition-colors">
                Open templates <ChevronRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>

    </div>
  )
}
