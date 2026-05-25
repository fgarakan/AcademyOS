import Link from 'next/link'
import { CheckCircle2, Circle, ChevronRight, Users, CalendarDays, MessageSquare, TrendingUp, GitBranch, Map, BookOpen, Wrench, Sparkles } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumBuilderWelcome } from '@/components/curriculum/builder/CurriculumBuilderWelcome'
import { buildCurriculumCoverageReport, type LevelCoverageInput } from '@/lib/curriculum/coverageModel'
import type { CurriculumStage } from '@/lib/curriculum/visualMapModel'
import { CurriculumHealthPanel, type DimensionSummary } from './_components/CurriculumHealthPanel'
import { CurriculumLevelTree } from './_components/CurriculumLevelTree'

// ─── Static spine data ────────────────────────────────────────────────────────

const SPINE_STAGES = [
  {
    label: 'Red Ball',
    dotClass: 'bg-status-red',
    textClass: 'text-status-red',
    purpose: 'Movement fundamentals, hand-eye coordination, and first contact with the game.',
  },
  {
    label: 'Orange Ball',
    dotClass: 'bg-status-orange',
    textClass: 'text-status-orange',
    purpose: 'Technical building, consistent rallying, and introduction to tactical patterns.',
  },
  {
    label: 'Green Ball',
    dotClass: 'bg-status-green',
    textClass: 'text-status-green',
    purpose: 'Tactical awareness, point construction, and first competitive match play.',
  },
  {
    label: 'Yellow Ball',
    dotClass: 'bg-yellow-400',
    textClass: 'text-yellow-400',
    purpose: 'Full-court development, match consistency, and competitive preparation.',
  },
  {
    label: 'High Performance',
    dotClass: 'bg-lime',
    textClass: 'text-lime',
    purpose: 'Advanced competition, elite technical refinement, and performance coaching.',
  },
]

const CONNECTIONS = [
  {
    title: 'Player Profiles',
    Icon: Users,
    unlocks:
      'Curriculum level connects to every player profile, showing where each player sits in the development spine.',
  },
  {
    title: 'Session Planning',
    Icon: CalendarDays,
    unlocks:
      'Templates link to curriculum levels so coaches always train to the right stage requirements.',
  },
  {
    title: 'Coach Notes',
    Icon: MessageSquare,
    unlocks:
      'Observations and gate evidence connect to level requirements, building the advancement case.',
  },
  {
    title: 'Parent / Player Progress',
    Icon: TrendingUp,
    unlocks:
      'Players and parents see their level, what they are working on, and what comes next.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const explorerData = await getCurriculumExplorerData(supabase)

  // ─── Curriculum coverage snapshot ────────────────────────────────────────
  // Maps DB curriculum_stage enum (snake_case) to the CurriculumStage union used by coverageModel.
  const DB_STAGE_TO_CURRICULUM_STAGE: Record<string, CurriculumStage> = {
    red_foundation:     'Red Ball',
    orange_development: 'Orange Ball',
    green_performance:  'Green Ball',
    yellow_competitive: 'Yellow Ball',
    high_performance:   'High Performance',
  }

  const levelCoverageInputs: LevelCoverageInput[] = explorerData.levels.map(level => ({
    levelId:                   level.id,
    levelName:                 level.display_name,
    stage:                     DB_STAGE_TO_CURRICULUM_STAGE[level.stage] ?? 'Red Ball',
    gateCount:                 explorerData.gates.filter(g => g.from_level_id === level.id).length,
    drillCount:                explorerData.drills.filter(d => d.level_min_id === level.id).length,
    coachCueCount:             explorerData.coachLanguage.filter(c => c.level_id === level.id).length,
    skillCount:                0,
    assessmentCriteriaCount:   0,
    evidenceRequirementCount:  0,
    missionCount:              0,
    badgeCount:                0,
    parentGuidanceCount:       0,
    learningModuleCount:       0,
  }))

  const coverageReport = buildCurriculumCoverageReport(levelCoverageInputs)

  const dimensionSummary: DimensionSummary = {
    gates:           explorerData.gates.length,
    drills:          explorerData.drills.length,
    coachCues:       explorerData.coachLanguage.length,
    competitionTrack: explorerData.competitionTrack.length,
    fitnessGuidance:  explorerData.fitnessGuidance.length,
    volumeGuidance:   explorerData.volumeGuidance.length,
  }

  const rawDb = supabase as any

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

  // ─── Setup checklist live counts ─────────────────────────────────────────
  // QW-1: Replace hardcoded false on checklist items 4-5 with live queries.
  // templates.curriculum_level_id may be pending migration 045 on live DB —
  // guard with error check and fall back to honest "Not connected yet" state.
  const { count: templatesWithLevelCount, error: templatesCheckError } = await rawDb
    .from('templates')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .not('curriculum_level_id', 'is', null)

  const { count: playersWithLevelCount, error: playersCheckError } = await rawDb
    .from('player_curriculum_states')
    .select('*', { count: 'exact', head: true })
    .eq('academy_id', academyId)

  // ─── Status derivation ────────────────────────────────────────────────────

  let statusLabel: string
  let statusDotClass: string
  let statusTextClass: string
  let statusDescription: string
  let primaryCtaLabel: string
  let primaryCtaHref: string

  if (!versionData) {
    statusLabel = 'Setup in progress'
    statusDotClass = 'bg-status-orange'
    statusTextClass = 'text-status-orange'
    statusDescription = 'No curriculum version active. Start setup to activate the Academy OS starter spine.'
    primaryCtaLabel = 'Start Curriculum Setup'
    primaryCtaHref = '/director/onboarding/curriculum'
  } else if (versionData.status === 'active') {
    statusLabel = 'Starter spine active'
    statusDotClass = 'bg-status-green'
    statusTextClass = 'text-status-green'
    statusDescription = `${versionData.name} — Version ${versionData.version_number}${versionData.override_count > 0 ? ` · ${versionData.override_count} override${versionData.override_count > 1 ? 's' : ''}` : ''}`
    primaryCtaLabel = 'Open Curriculum Builder'
    primaryCtaHref = '/director/curriculum/builder'
  } else {
    statusLabel = 'Draft in progress'
    statusDotClass = 'bg-status-orange'
    statusTextClass = 'text-status-orange'
    statusDescription = `${versionData.name} — Version ${versionData.version_number} (draft)`
    primaryCtaLabel = 'Continue Curriculum Setup'
    primaryCtaHref = '/director/onboarding/curriculum'
  }

  const nextActionText = !versionData
    ? 'Start curriculum setup to create your academy development spine.'
    : versionData.status !== 'active'
    ? 'Approve your curriculum spine to activate it for your academy.'
    : 'Review level gates and connect templates to give coaches curriculum context.'

  // ─── Setup checklist ──────────────────────────────────────────────────────

  const setupItems = [
    {
      label: 'Curriculum starter selected',
      done: !!versionData,
      hint: 'Start setup to create your curriculum version.',
    },
    {
      label: 'Level structure approved',
      done: versionData?.status === 'active',
      hint: 'Continue setup to approve your spine.',
    },
    {
      label: 'Academy customizations added',
      done: (versionData?.override_count ?? 0) > 0,
      hint: 'Not connected yet.',
    },
    {
      label: 'Templates connected',
      done: !templatesCheckError && (templatesWithLevelCount ?? 0) > 0,
      hint: templatesCheckError ? 'Data source not available yet.' : 'Not connected yet.',
    },
    {
      label: 'Players connected to levels',
      done: !playersCheckError && (playersWithLevelCount ?? 0) > 0,
      hint: playersCheckError ? 'Data source not available yet.' : 'Not connected yet.',
    },
  ]

  // ─── Next actions ─────────────────────────────────────────────────────────

  const nextActions = !versionData
    ? [
        'Start curriculum setup to create your academy development spine.',
        'Review the starter spine — Academy OS provides Red Ball through High Performance.',
        'Approve the spine so players, sessions, and templates can connect to it.',
      ]
    : versionData.status !== 'active'
    ? [
        'Approve your curriculum spine to activate it for your academy.',
        'Review starter spine levels and adjust any gates that do not match your approach.',
        'Connect templates once your spine is approved.',
      ]
    : [
        'Review level gates — confirm evidence requirements match your academy standards.',
        'Connect templates to curriculum levels to give coaches the right context.',
        'Assign players to levels so curriculum powers their development profiles.',
      ]

  return (
    <div className="animate-fade-in p-6 space-y-8">

      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <div>
        <p className="page-eyebrow">Curriculum</p>
        <h1 className="page-title">Curriculum Command Center</h1>
        <p className="page-subtitle max-w-xl">
          Your academy's development spine — levels, gates, templates, and player progress
          all connect here. Use the tools below to review, customize, and manage your curriculum.
        </p>
      </div>

      {/* ── 1b. DONNA Welcome ─────────────────────────────────────────────── */}
      <CurriculumBuilderWelcome hasActiveVersion={!!versionData} />

      {/* ── 2. Curriculum Status hero card ───────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="label-xs">Curriculum Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass}`} />
              <p className={`text-sm font-semibold ${statusTextClass}`}>{statusLabel}</p>
            </div>
            <p className="text-[12px] text-text-secondary leading-relaxed">{statusDescription}</p>
          </div>
          <Link href={primaryCtaHref} className="btn-lime shrink-0">
            {primaryCtaLabel}
          </Link>
        </div>

        <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Active Spine</p>
            <p className="text-[13px] font-medium text-text-primary">
              {versionData ? versionData.name : 'Academy OS Starter Spine'}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Red Ball · Orange Ball · Green Ball · Yellow Ball · High Performance
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
              Next Recommended Action
            </p>
            <p className="text-[12px] text-text-secondary leading-relaxed">{nextActionText}</p>
          </div>
        </div>
      </div>

      {/* ── 3. Current Spine ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="label-xs">Current Spine</p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {SPINE_STAGES.map(stage => (
            <div
              key={stage.label}
              className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dotClass}`} />
                <p className={`text-[11px] font-semibold ${stage.textClass}`}>{stage.label}</p>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">{stage.purpose}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Empty state — shown when no curriculum version exists */}
      {!versionData && (
        <div className="rounded-2xl border border-border bg-surface-raised p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-text-primary">
            No curriculum spine active yet.
          </p>
          <p className="text-[12px] text-text-secondary">
            Start with the starter curriculum spine, then customize it for your academy.
          </p>
          <Link href="/director/onboarding/curriculum" className="btn-lime inline-flex">
            Start Curriculum Setup
          </Link>
        </div>
      )}

      {/* ── 4. Setup Status ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="label-xs">Setup Status</p>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {setupItems.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-4 py-3${i < setupItems.length - 1 ? ' border-b border-border' : ''}`}
            >
              {item.done
                ? <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
                : <Circle className="w-4 h-4 text-text-muted shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-medium ${item.done ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {item.label}
                </p>
                {!item.done && (
                  <p className="text-[11px] text-text-muted">{item.hint}</p>
                )}
              </div>
              {item.done && (
                <span className="shrink-0 text-[10px] uppercase tracking-widest text-status-green font-medium">
                  Done
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 4b. Coverage snapshot ────────────────────────────────────────── */}
      {explorerData.levels.length > 0 && (
        <section className="space-y-3">
          <CurriculumHealthPanel report={coverageReport} dimensionSummary={dimensionSummary} />
        </section>
      )}

      {/* ── 4c. Level tree — Sprint 556 ───────────────────────────────────── */}
      {explorerData.levels.length > 0 && (
        <section className="space-y-3">
          <p className="label-xs">Curriculum Levels</p>
          <CurriculumLevelTree explorerData={explorerData} />
        </section>
      )}

      {/* ── 6. Connected System ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="label-xs">Connected System</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONNECTIONS.map(({ title, Icon, unlocks }) => (
            <div key={title} className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <p className="text-[12px] font-semibold text-text-primary">{title}</p>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">{unlocks}</p>
            </div>
          ))}
          {/* QW-2: Academy Version chip — visible without opening advanced tools */}
          {versionData && (
            <Link
              href="/director/curriculum/academy-version"
              className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-1.5 hover:border-lime/30 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-lime shrink-0" />
                <p className="text-[12px] font-semibold text-text-primary">Academy Version</p>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                View your overrides, customizations, and curriculum version history.
              </p>
              <p className="text-[11px] text-lime flex items-center gap-1 group-hover:underline">
                View Academy Version <ChevronRight className="w-3 h-3" />
              </p>
            </Link>
          )}
        </div>
      </section>

      {/* ── 7. Next Recommended Actions ──────────────────────────────────── */}
      <section className="space-y-3">
        <p className="label-xs">Next Recommended Actions</p>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {nextActions.map((action, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3${i < nextActions.length - 1 ? ' border-b border-border' : ''}`}
            >
              <span className="shrink-0 w-5 h-5 rounded-full border border-border flex items-center justify-center text-[9px] font-mono text-lime mt-0.5">
                {i + 1}
              </span>
              <p className="text-[12px] text-text-secondary leading-relaxed">{action}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. Curriculum Tools ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="label-xs">Curriculum Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <Link
            href="/director/curriculum/builder"
            className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-1.5 hover:border-lime/30 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-[12px] font-semibold text-text-primary">Curriculum Builder</p>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Review and customize each level. DONNA guides you one stage at a time.
            </p>
            <p className="text-[11px] text-lime flex items-center gap-1 group-hover:underline">
              Open Builder <ChevronRight className="w-3 h-3" />
            </p>
          </Link>

          <Link
            href="/director/curriculum/map"
            className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-1.5 hover:border-lime/30 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Map className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <p className="text-[12px] font-semibold text-text-primary">Curriculum Map</p>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Visual overview of all levels, gates, and connections across your academy spine.
            </p>
            <p className="text-[11px] text-lime flex items-center gap-1 group-hover:underline">
              View Map <ChevronRight className="w-3 h-3" />
            </p>
          </Link>

          <Link
            href="/director/curriculum/guided"
            className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-1.5 hover:border-lime/30 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <p className="text-[12px] font-semibold text-text-primary">Guided Review</p>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Let DONNA walk you through incomplete levels and customization priorities.
            </p>
            <p className="text-[11px] text-lime flex items-center gap-1 group-hover:underline">
              Start Guided Review <ChevronRight className="w-3 h-3" />
            </p>
          </Link>

          <Link
            href="/director/curriculum/learning"
            className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-1.5 hover:border-lime/30 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <p className="text-[12px] font-semibold text-text-primary">Learning Modules</p>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Player-facing learning content connected to each curriculum level and stage.
            </p>
            <p className="text-[11px] text-lime flex items-center gap-1 group-hover:underline">
              View Modules <ChevronRight className="w-3 h-3" />
            </p>
          </Link>

        </div>
      </section>

    </div>
  )
}
