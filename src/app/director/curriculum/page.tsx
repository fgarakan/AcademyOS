import Link from 'next/link'
import { BookOpen, Layers, Dumbbell, Users, ChevronRight, ExternalLink } from 'lucide-react'
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
    <div className="animate-fade-in p-6 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Curriculum</h1>
        <p className="text-text-secondary text-sm mt-1">
          Curriculum spine, content, requirements, academy version, and voice customization.
        </p>
      </div>

      <p className="label-xs">Curriculum Content Engine</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 1 — Global / Academy Curriculum Spine */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-lime" />
              <p className="label-xs">Global / Academy Curriculum Spine</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-[11px] text-text-secondary leading-relaxed">
              The global curriculum defines levels, tracks, and named requirements across all
              stages (Red Ball → Yellow Advanced). Academy-specific overrides can extend or
              replace global defaults.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Curriculum levels</p>
                <p className="text-lg font-mono font-bold text-lime">{levelsCount ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted mb-0.5">Track requirements</p>
                {requirementsUnavailable ? (
                  <p className="text-[11px] text-status-orange">{UNAVAILABLE_MSG}</p>
                ) : (
                  <p className="text-lg font-mono font-bold text-lime">{requirementsCount ?? '—'}</p>
                )}
              </div>
            </div>
            <Link
              href="/director/players"
              className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors"
            >
              View players <ChevronRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* 2 — Orange Ball Starter Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-status-orange" />
              <p className="label-xs">Orange Ball Starter Content</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-[11px] text-text-secondary leading-relaxed">
              29 global-default content items across Orange Ball levels 1–3: drills, games,
              skills, and assessments. Each item includes coaching cues, success criteria,
              progressions, and regressions.
            </p>
            {contentUnavailable || mappingsUnavailable ? (
              <p className="text-[11px] text-status-orange">{UNAVAILABLE_MSG}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Content items</p>
                  <p className="text-lg font-mono font-bold text-lime">{contentItemsCount ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-text-muted mb-0.5">Req. mappings</p>
                  <p className="text-lg font-mono font-bold text-lime">{mappingsCount ?? '—'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3 — Curriculum-Aware Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-status-blue" />
              <p className="label-xs">Curriculum-Aware Templates</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Session templates can be tagged with a curriculum level. The block population
              engine fills empty block notes with matching drills, games, and coaching cues
              from the content library.
            </p>
            {templatesUnavailable ? (
              <p className="text-[11px] text-status-orange">{UNAVAILABLE_MSG}</p>
            ) : (
              <div className="pt-1">
                <p className="text-[11px] text-text-muted mb-0.5">Templates with curriculum level</p>
                <p className="text-lg font-mono font-bold text-lime">
                  {templatesWithCurriculumCount ?? '—'}
                </p>
              </div>
            )}
            <Link
              href="/director/fitness/templates"
              className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors"
            >
              Open templates <ChevronRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* 4 — Coach Session Curriculum Context */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-status-green" />
              <p className="label-xs">Coach Session Curriculum Context</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Sessions generated from curriculum-aware templates display a Curriculum Focus
              panel for the coach: level name, stage, and block notes pre-filled with drills
              and coaching cues from the content library.
            </p>
            <div className="flex gap-4 pt-1">
              <Link
                href="/director/sessions"
                className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors"
              >
                View sessions <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href="/director/review"
                className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-lime transition-colors"
              >
                Review queue <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 5 — Academy Curriculum Version (Sprint 63) */}
        <AcademyCurriculumVersionCard version={versionData} />

        {/* 6 — Voice Curriculum Customization (Sprint 64) */}
        <VoiceOverrideInputPanel hasActiveVersion={!!activeVersion} />

      </div>

      {/* Quick navigation links */}
      <div className="flex flex-wrap gap-3 pt-2">
        {[
          { href: '/director/curriculum/academy-version', label: 'Academy Version' },
          { href: '/director/fitness/templates',          label: 'Templates' },
          { href: '/director/sessions',                   label: 'Sessions' },
          { href: '/director/players',                    label: 'Players' },
          { href: '/director/review',                     label: 'Review Queue' },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] text-text-secondary hover:text-lime hover:border-lime transition-colors"
          >
            {link.label} <ExternalLink className="w-3 h-3" />
          </Link>
        ))}
      </div>

    </div>
  )
}
