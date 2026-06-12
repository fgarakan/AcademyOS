import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Map, BookOpen, Wrench, Sparkles } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'
import { getCurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { buildCurriculumCoverageReport, type LevelCoverageInput } from '@/lib/curriculum/coverageModel'
import type { CurriculumStage } from '@/lib/curriculum/visualMapModel'
import { CurriculumHealthPanel, type DimensionSummary } from './_components/CurriculumHealthPanel'
import { CurriculumLevelTree } from './_components/CurriculumLevelTree'
import { CurriculumStageInsightCard, type StageInsightData } from './_components/CurriculumStageInsightCard'
import { getLevelInsight } from '@/lib/curriculum/levelInsightMap'
import { DonnaCurriculumContextPanel } from './_components/DonnaCurriculumContextPanel'
import { CurriculumDonnaRegistrar } from './_components/CurriculumDonnaRegistrar'
import { loadCurriculumBottleneck } from '@/lib/donna/curriculumBottleneckLoader'
import { rankCurriculumAttention } from '@/lib/curriculum/curriculumAttentionRanking'
import { CurriculumIntelligenceCard } from './_components/CurriculumIntelligenceCard'
import type { ExcludableScoreDimension } from '@/lib/curriculum/coverageModel'
import { DonnaCurriculumBrief } from './_components/DonnaCurriculumBrief'
import { CurriculumHealthStrip } from './_components/CurriculumHealthStrip'

// ─── Stage display config ─────────────────────────────────────────────────────

const SPINE_STAGES: Array<{
  stageKey: string
  label: string
  dotClass: string
  textClass: string
  fallbackPurpose: string
}> = [
  {
    stageKey: 'red_foundation',
    label: 'Red Ball',
    dotClass: 'bg-status-red',
    textClass: 'text-status-red',
    fallbackPurpose: 'Movement fundamentals, hand-eye coordination, and first contact with the game.',
  },
  {
    stageKey: 'orange_development',
    label: 'Orange Ball',
    dotClass: 'bg-status-orange',
    textClass: 'text-status-orange',
    fallbackPurpose: 'Technical building, consistent rallying, and introduction to tactical patterns.',
  },
  {
    stageKey: 'green_performance',
    label: 'Green Ball',
    dotClass: 'bg-status-green',
    textClass: 'text-status-green',
    fallbackPurpose: 'Tactical awareness, point construction, and first competitive match play.',
  },
  {
    stageKey: 'yellow_competitive',
    label: 'Yellow Ball',
    dotClass: 'bg-yellow-400',
    textClass: 'text-yellow-400',
    fallbackPurpose: 'Full-court development, match consistency, and competitive preparation.',
  },
  {
    stageKey: 'high_performance',
    label: 'High Performance',
    dotClass: 'bg-lime',
    textClass: 'text-lime',
    fallbackPurpose: 'Advanced competition, elite technical refinement, and performance coaching.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

interface CurriculumPageProps {
  searchParams: { improve?: string }
}

export default async function DirectorCurriculumPage({ searchParams }: CurriculumPageProps) {
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

  // ─── Sprint 1095B: query curriculum_stages for live stage_goal ───────────
  interface StageRow {
    id: string
    stage: string
    display_name: string
    stage_goal: string
    age_range_min: number | null
    age_range_max: number | null
    sort_order: number
  }
  const stagesDb = supabase as any
  const { data: stagesRaw } = await stagesDb
    .from('curriculum_stages')
    .select('id,stage,display_name,stage_goal,age_range_min,age_range_max,sort_order')
    .order('sort_order', { ascending: true })
  const stageGoalMap: Record<string, string> = {}
  const ageRangeMap: Record<string, string | null> = {}
  if (stagesRaw) {
    for (const s of stagesRaw as StageRow[]) {
      stageGoalMap[s.stage] = s.stage_goal
      ageRangeMap[s.stage] = (s.age_range_min != null && s.age_range_max != null)
        ? `Ages ${s.age_range_min}–${s.age_range_max}`
        : null
    }
  }

  // ─── Sprint 1095B: build stage insight data for CurriculumStageInsightCard ─
  const stageInsights: StageInsightData[] = SPINE_STAGES.map(stageDef => {
    const levels = explorerData.levels
      .filter(l => l.stage === stageDef.stageKey)
      .map(level => {
        const insight = getLevelInsight(level.stage, level.level_number)
        const gates = explorerData.gates
          .filter(g => g.from_level_id === level.id)
          .map(g => ({
            domain: g.domain,
            criterion: g.criterion,
            threshold: g.threshold,
          }))
        return {
          id: level.id,
          displayName: level.display_name,
          levelNumber: level.level_number,
          insight: insight ?? {
            levelKey: `${stageDef.stageKey.split('_')[0]}${level.level_number}` as import('@/lib/curriculum/levelInsightMap').LevelKey,
            stage: level.stage,
            levelNumber: level.level_number,
            directorGoal: `Develop ${level.display_name} competencies.`,
            exitPlayerProfile: 'Player meets all advancement criteria for this level.',
            focusAreas: [],
            readinessSignals: [],
            commonBlockers: [],
            parentSafeSummary: 'Your child is developing tennis skills at this level.',
            donnaPrompt: `What are the ${level.display_name} gates and readiness criteria?`,
          },
          gates,
        }
      })

    return {
      stageKey: stageDef.stageKey,
      stageLabel: stageDef.label,
      stageGoal: stageGoalMap[stageDef.stageKey] ?? stageDef.fallbackPurpose,
      ageRange: ageRangeMap[stageDef.stageKey] ?? null,
      dotClass: stageDef.dotClass,
      textClass: stageDef.textClass,
      levels,
    }
  })

  // ─── Curriculum coverage snapshot ────────────────────────────────────────
  const DB_STAGE_TO_CURRICULUM_STAGE: Record<string, CurriculumStage> = {
    red_foundation:     'Red Ball',
    orange_development: 'Orange Ball',
    green_performance:  'Green Ball',
    yellow_competitive: 'Yellow Ball',
    high_performance:   'High Performance',
  }

  // ── Phase 5: requirement counts per level (Mega Sprint 1996–2005) ──────────
  const requirementCountByLevel: Record<string, number> = {}
  try {
    const { data: reqRows } = await (supabase as any)
      .from('curriculum_track_requirements')
      .select('curriculum_level_id')
      .eq('is_active', true)
    for (const row of reqRows ?? []) {
      if (row.curriculum_level_id) {
        requirementCountByLevel[row.curriculum_level_id] =
          (requirementCountByLevel[row.curriculum_level_id] ?? 0) + 1
      }
    }
  } catch { /* non-fatal — coverage model falls back to 3-dimension scoring */ }

  const levelCoverageInputs: LevelCoverageInput[] = explorerData.levels.map(level => {
    const skillCount = requirementCountByLevel[level.id] ?? 0
    const excludeFromScoring: ExcludableScoreDimension[] = [
      ...(skillCount === 0 ? ['skills' as ExcludableScoreDimension] : []),
      'assessment', 'missions', 'parentGuidance', 'badges',
    ]
    return {
      levelId:                   level.id,
      levelName:                 level.display_name,
      stage:                     DB_STAGE_TO_CURRICULUM_STAGE[level.stage] ?? 'Red Ball',
      gateCount:                 explorerData.gates.filter(g => g.from_level_id === level.id).length,
      drillCount:                explorerData.drills.filter(d => d.level_min_id === level.id).length,
      coachCueCount:             explorerData.coachLanguage.filter(c => c.level_id === level.id).length,
      skillCount,
      assessmentCriteriaCount:   0,
      evidenceRequirementCount:  0,
      missionCount:              0,
      badgeCount:                0,
      parentGuidanceCount:       0,
      learningModuleCount:       0,
      excludeFromScoring,
    }
  })

  const coverageReport = buildCurriculumCoverageReport(levelCoverageInputs)

  // ── Curriculum bottleneck + intelligence ranking (Mega Sprint 1996–2005) ───
  let curriculumRanking: import('@/lib/curriculum/curriculumAttentionRanking').CurriculumRankingResult = {
    priorities: [], attentionScore: 'healthy', topConcern: null, topConcernCount: 0, allTopConcerns: [], hasData: false,
  }
  try {
    const bottleneckResult = await loadCurriculumBottleneck(supabase as import('@/lib/types/db').DB, academyId)
    curriculumRanking = rankCurriculumAttention(bottleneckResult, coverageReport)
  } catch { /* non-fatal */ }

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

  const versionStatus: 'none' | 'draft' | 'active' = !versionData
    ? 'none'
    : versionData.status === 'active'
    ? 'active'
    : 'draft'

  return (
    <div className="animate-fade-in p-6 space-y-6">

      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="page-title">Curriculum Command Center</h1>
      </div>

      {/* ── 1b. Create / Improve / Review action bar ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/director/curriculum/builder"
          className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 hover:border-lime/30 hover:bg-lime/5 transition-all group"
        >
          <Wrench className="w-4 h-4 text-lime shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-text-primary">Create</p>
            <p className="text-[11px] text-text-muted">Add levels, gates, and content</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime ml-auto transition-colors" />
        </Link>
        <Link
          href="/director/curriculum/builder"
          className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 hover:border-lime/30 hover:bg-lime/5 transition-all group"
        >
          <Sparkles className="w-4 h-4 text-lime shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-text-primary">Improve</p>
            <p className="text-[11px] text-text-muted">DONNA evolution recommendations</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime ml-auto transition-colors" />
        </Link>
        <Link
          href="/director/review"
          className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 hover:border-lime/30 hover:bg-lime/5 transition-all group"
        >
          <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-text-primary">Review</p>
            <p className="text-[11px] text-text-muted">Pending approvals and changes</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime ml-auto transition-colors" />
        </Link>
      </div>

      {/* ── 2. Nav tabs — Health is the active (current) tab ─────────────── */}
      <div className="flex border-b border-border -mt-2">
        <Link
          href="/director/curriculum"
          className="px-4 py-2 text-[13px] font-semibold text-text-primary border-b-2 border-lime -mb-px"
        >
          Health
        </Link>
        <Link
          href="/director/curriculum/builder"
          className="px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          Builder
        </Link>
        <Link
          href="/director/curriculum/map"
          className="px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          Map
        </Link>
      </div>

      {/* ── 3. DONNA brief — above fold, before data ──────────────────────── */}
      <DonnaCurriculumBrief ranking={curriculumRanking} versionStatus={versionStatus} />

      {/* ── 4. DONNA context panel — shown when ?improve=[levelKey] ──────── */}
      {searchParams.improve && academyId && (
        <>
          {/* Sprint 1681 — Register curriculum level into DonnaSessionContext */}
          <CurriculumDonnaRegistrar
            levelKey={searchParams.improve}
            levelLabel={searchParams.improve.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          />
          <DonnaCurriculumContextPanel
            levelKey={searchParams.improve}
            academyId={academyId}
          />
        </>
      )}

      {/* ── 5. Most Blocked Level hero ────────────────────────────────────── */}
      <CurriculumIntelligenceCard ranking={curriculumRanking} />

      {/* ── 6. Health strip — compact 4-slot metrics ─────────────────────── */}
      {explorerData.levels.length > 0 && (
        <CurriculumHealthStrip report={coverageReport} dimensionSummary={dimensionSummary} />
      )}

      {/* ── 7. Setup checklist — only rendered when items are incomplete ──── */}
      {setupItems.some(i => !i.done) && (
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
                  <span className="shrink-0 text-[10px] uppercase tracking-widest text-status-green font-medium">Done</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 8. Collapsed drilldowns ──────────────────────────────────────── */}

      {/* Curriculum Levels */}
      {explorerData.levels.length > 0 && (
        <details className="group rounded-2xl border border-border bg-surface overflow-hidden">
          <summary className="list-none flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-surface-raised transition-colors">
            <p className="label-xs">Curriculum Levels</p>
            <ChevronDown className="w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="border-t border-border">
            <CurriculumLevelTree explorerData={explorerData} />
          </div>
        </details>
      )}

      {/* Curriculum Spine */}
      <details className="group rounded-2xl border border-border bg-surface overflow-hidden">
        <summary className="list-none flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-surface-raised transition-colors">
          <p className="label-xs">Curriculum Spine</p>
          <ChevronDown className="w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="border-t border-border p-4 space-y-3">
          {stageInsights.some(s => s.levels.length > 0) ? (
            <div className="space-y-3">
              {stageInsights.map(stage => (
                <CurriculumStageInsightCard key={stage.stageKey} stage={stage} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {SPINE_STAGES.map(stage => (
                <div key={stage.label} className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dotClass}`} />
                    <p className={`text-[11px] font-semibold ${stage.textClass}`}>{stage.label}</p>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">{stage.fallbackPurpose}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      {/* Health Detail + Tools */}
      <details className="group rounded-2xl border border-border bg-surface overflow-hidden">
        <summary className="list-none flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-surface-raised transition-colors">
          <p className="label-xs">Health Detail &amp; Tools</p>
          <ChevronDown className="w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="border-t border-border p-4 space-y-6">
          {explorerData.levels.length > 0 && (
            <CurriculumHealthPanel report={coverageReport} dimensionSummary={dimensionSummary} />
          )}
          <div>
            <p className="label-xs mb-3">Curriculum Tools</p>
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
          </div>
        </div>
      </details>

    </div>
  )
}
