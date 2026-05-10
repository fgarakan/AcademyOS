import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, BookOpen, GraduationCap, Layers, CheckCircle, ArrowRight, ArrowUpRight } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { ClassTemplateCurriculumSelector } from './ClassTemplateCurriculumSelector'
import type { CurriculumLevelOption } from './ClassTemplateCurriculumSelector'
import { LessonPlanDraftPanel } from './LessonPlanDraftPanel'
import { ClassTemplateSetupGuide } from '@/components/onboarding/ClassTemplateSetupGuide'
import { BlockContentPickerCard } from './BlockContentPickerCard'
import type { AssignedItem, AvailableContentItem } from './BlockContentPickerCard'
import type { Tables } from '@/lib/supabase/database.types'

type Template = Tables<'templates'>

interface PageProps {
  params: { templateId: string }
}

// Shape returned by the curriculum_class_template_blocks join
interface CurriculumBlockRow {
  id: string
  block_id: string
  content_item_id: string | null
  drill_id: string | null
  order_index: number
  notes: string | null
  duration_min: number | null
  content_item: {
    title: string
    description: string | null
    content_type: string
    domain: string | null
    session_block_hint: string | null
    coach_cues: string[] | null
    success_criteria: string[] | null
    progressions: string[] | null
    regressions: string[] | null
    duration_min: number | null
  } | null
  drill: {
    name: string
    description: string | null
    domain: string | null
    cues: string[] | null
    success_criteria: string[] | null
    progressions: string[] | null
    regressions: string[] | null
    duration_min: number | null
  } | null
}

function contentTypeBadge(type: string): string {
  const map: Record<string, string> = {
    drill: 'bg-lime/10 text-lime border-lime/20',
    tactical_game: 'bg-status-blue/10 text-status-blue border-status-blue/20',
    situational: 'bg-status-orange/10 text-status-orange border-status-orange/20',
    match_play_theme: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    mental_skill: 'bg-status-green/10 text-status-green border-status-green/20',
    competition_behavior: 'bg-status-orange/10 text-status-orange border-status-orange/20',
    warmup: 'bg-border text-text-secondary border-border',
    cooldown: 'bg-border text-text-secondary border-border',
    coach_cue: 'bg-lime/5 text-lime border-lime/10',
    success_criteria: 'bg-status-green/5 text-status-green border-status-green/10',
    progression: 'bg-lime/10 text-lime border-lime/20',
    regression: 'bg-border text-text-muted border-border',
    player_mission: 'bg-status-blue/5 text-status-blue border-status-blue/10',
    parent_guidance: 'bg-border text-text-muted border-border',
  }
  return map[type] ?? 'bg-border text-text-muted border-border'
}

function contentTypeLabel(type: string): string {
  const map: Record<string, string> = {
    drill: 'Drill',
    tactical_game: 'Tactical Game',
    situational: 'Situational',
    match_play_theme: 'Match-Play Theme',
    mental_skill: 'Mental Skill',
    competition_behavior: 'Competition',
    warmup: 'Warm-Up',
    cooldown: 'Cool-Down',
    coach_cue: 'Coach Cue',
    success_criteria: 'Success Criteria',
    progression: 'Progression',
    regression: 'Regression',
    player_mission: 'Player Mission',
    parent_guidance: 'Parent Guidance',
  }
  return map[type] ?? type.replace(/_/g, ' ')
}

export default async function ClassTemplateDetailPage({ params }: PageProps) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const rawDb = supabase as any

  const { data: templateRaw, error: templateError } = await rawDb
    .from('templates')
    .select('*')
    .eq('id', params.templateId)
    .eq('academy_id', academyId)
    .single()

  if (templateError || !templateRaw) notFound()

  const template = templateRaw as Template & { curriculum_level_id: string | null }

  // Fetch blocks
  const { data: blocks } = await supabase
    .from('template_blocks')
    .select('id, name, type, duration_min, order_index, notes')
    .eq('template_id', params.templateId)
    .order('order_index')

  const blockList = blocks ?? []
  const blockIds = blockList.map(b => b.id)

  // Fetch curriculum class template blocks (new curriculum content path)
  const curriculumByBlock = new Map<string, CurriculumBlockRow[]>()
  if (blockIds.length > 0) {
    const { data: cctbData } = await rawDb
      .from('curriculum_class_template_blocks')
      .select(`
        id,
        block_id,
        content_item_id,
        drill_id,
        order_index,
        notes,
        duration_min,
        content_item:curriculum_content_items(
          title, description, content_type, domain, session_block_hint,
          coach_cues, success_criteria, progressions, regressions, duration_min
        ),
        drill:curriculum_drills(
          name, description, domain, cues, success_criteria, progressions, regressions, duration_min
        )
      `)
      .in('block_id', blockIds)
      .order('order_index')

    for (const row of (cctbData ?? [])) {
      const arr = curriculumByBlock.get(row.block_id) ?? []
      arr.push(row as CurriculumBlockRow)
      curriculumByBlock.set(row.block_id, arr)
    }
  }

  // Fetch legacy exercises per block (preserved — not removed)
  const exercisesByBlock = new Map<string, { name: string; category: string }[]>()
  if (blockIds.length > 0) {
    const { data: exData } = await rawDb
      .from('template_block_exercises')
      .select('block_id, exercises(name, category)')
      .in('block_id', blockIds)
      .order('order_index')

    for (const row of (exData ?? [])) {
      const ex = row.exercises
      if (!ex) continue
      const arr = exercisesByBlock.get(row.block_id) ?? []
      arr.push({ name: ex.name, category: ex.category })
      exercisesByBlock.set(row.block_id, arr)
    }
  }

  // Fetch curriculum levels for picker
  const { data: levelsData } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name, stage, sort_order')
    .order('sort_order', { ascending: true })

  const curriculumLevels: CurriculumLevelOption[] = (levelsData ?? []).map(
    (l: { id: string; display_name: string; stage: string }) => ({
      id: l.id,
      display_name: l.display_name,
      stage: l.stage,
    })
  )

  const curriculumLevelId: string | null = template.curriculum_level_id ?? null
  const currentLevelName = curriculumLevelId
    ? (curriculumLevels.find(l => l.id === curriculumLevelId)?.display_name ?? null)
    : null

  // Fetch all global active curriculum content items for the picker
  const { data: availableRaw } = await rawDb
    .from('curriculum_content_items')
    .select('id, title, content_type, domain, session_block_hint, duration_min, is_coach_only')
    .eq('is_active', true)
    .is('academy_id', null)
    .order('content_type', { ascending: true })
    .order('title', { ascending: true })

  const availableContent: AvailableContentItem[] = (availableRaw ?? []).map(
    (row: {
      id: string
      title: string
      content_type: string
      domain: string | null
      session_block_hint: string | null
      duration_min: number | null
      is_coach_only: boolean
    }) => ({
      id: row.id,
      title: row.title,
      contentType: row.content_type,
      domain: row.domain,
      sessionBlockHint: row.session_block_hint,
      durationMin: row.duration_min,
      isCoachOnly: row.is_coach_only,
    })
  )

  // Counts
  let totalCurriculumItems = 0
  curriculumByBlock.forEach(arr => { totalCurriculumItems += arr.length })
  let totalLegacyExercises = 0
  exercisesByBlock.forEach(arr => { totalLegacyExercises += arr.length })
  const hasCurriculumContent = totalCurriculumItems > 0

  return (
    <div className="p-6 animate-fade-in space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href="/director/class-templates"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Class Templates
          </Link>
          <p className="page-eyebrow">Class Template</p>
          <h1 className="page-title">{template.name}</h1>
          {template.description && (
            <p className="page-subtitle">{template.description}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-muted">
          <BookOpen className="w-3 h-3" />
          {template.track ?? 'Class'}
        </div>
      </div>

      {/* Meta card */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Track</p>
              <p className="text-sm text-text-primary">{template.track ?? '—'}</p>
            </div>
            {template.total_duration_min != null && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Duration</p>
                <p className="text-sm text-text-primary flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  {template.total_duration_min} min
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Blocks</p>
              <p className="text-base font-mono font-bold text-lime">{blockList.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Curriculum Items</p>
              <p className="text-base font-mono font-bold text-lime">{totalCurriculumItems}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center gap-3 flex-wrap">
            <span className={[
              'text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border',
              template.is_active
                ? 'border-status-green/50 text-status-green'
                : 'border-border text-text-muted',
            ].join(' ')}>
              {template.is_active ? 'Active' : 'Inactive'}
            </span>
            {currentLevelName && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-lime/20 bg-lime/5 text-lime">
                <GraduationCap className="w-2.5 h-2.5" />
                {currentLevelName}
              </span>
            )}
            {hasCurriculumContent && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-status-green/20 bg-status-green/5 text-status-green">
                <Layers className="w-2.5 h-2.5" />
                Curriculum Lesson Plan Applied
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template setup guide — state-aware 4-step flow */}
      <div>
        <p className="label-xs mb-3">Template Workflow</p>
        <ClassTemplateSetupGuide
          hasCurriculumLevel={!!curriculumLevelId}
          hasCurriculumContent={hasCurriculumContent}
        />
      </div>

      {/* Curriculum level selector */}
      <Card>
        <CardHeader>
          <p className="label-xs">Curriculum Context</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {curriculumLevels.length > 0 ? (
            <>
              <ClassTemplateCurriculumSelector
                templateId={params.templateId}
                currentLevelId={curriculumLevelId}
                levels={curriculumLevels}
              />
              {currentLevelName && (
                <p className="text-[10px] text-text-muted">
                  Sessions generated from this template will include curriculum context for{' '}
                  <span className="text-lime">{currentLevelName}</span>.
                </p>
              )}
            </>
          ) : (
            <p className="text-[11px] text-text-muted">
              No curriculum levels available. Seed the curriculum to enable this feature.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lesson plan draft generator */}
      <LessonPlanDraftPanel
        templateId={params.templateId}
        hasCurriculumContent={hasCurriculumContent}
        curriculumLevelName={currentLevelName}
      />

      {/* ================================================================
          CURRICULUM LESSON PLAN — primary content path
          ================================================================ */}
      <div>
        <p className="label-xs mb-3">Curriculum Lesson Plan</p>

        {!hasCurriculumContent ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center space-y-2">
                <Layers className="w-8 h-8 text-text-muted mx-auto" />
                <p className="text-sm text-text-primary">No curriculum content applied yet</p>
                <p className="text-xs text-text-muted max-w-xs mx-auto">
                  Generate a lesson plan draft to populate this template with curriculum content.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {blockList.map((block, i) => {
              const curriculumItems = curriculumByBlock.get(block.id) ?? []
              if (curriculumItems.length === 0) return null
              return (
                <Card key={block.id}>
                  <CardContent className="py-4">
                    {/* Block header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-mono text-text-muted w-5">{i + 1}</span>
                      <p className="text-sm font-semibold text-text-primary">{block.name}</p>
                      {block.type && (
                        <span className="text-[10px] uppercase tracking-widest text-text-muted px-1.5 py-0.5 rounded border border-border">
                          {block.type}
                        </span>
                      )}
                      {block.duration_min != null && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-text-muted">
                          <Clock className="w-3 h-3" />
                          {block.duration_min}min
                        </span>
                      )}
                    </div>

                    {/* Curriculum content items */}
                    <div className="space-y-3 pl-7">
                      {curriculumItems.map((row, j) => {
                        const ci = row.content_item
                        const dr = row.drill
                        const title = ci?.title ?? dr?.name ?? 'Untitled'
                        const description = ci?.description ?? dr?.description ?? null
                        const domain = ci?.domain ?? dr?.domain ?? null
                        const cues = ci?.coach_cues ?? dr?.cues ?? null
                        const criteria = ci?.success_criteria ?? dr?.success_criteria ?? null
                        const progs = ci?.progressions ?? dr?.progressions ?? null
                        const regs = ci?.regressions ?? dr?.regressions ?? null
                        const duration = row.duration_min ?? ci?.duration_min ?? dr?.duration_min ?? null
                        const contentType = ci?.content_type ?? 'drill'

                        return (
                          <div key={row.id} className="border border-border rounded-lg p-3 space-y-2">
                            {/* Content item header */}
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-mono text-text-muted mt-0.5 w-4 text-right shrink-0">{j + 1}.</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-text-primary">{title}</p>
                                  <span className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${contentTypeBadge(contentType)}`}>
                                    {contentTypeLabel(contentType)}
                                  </span>
                                  {domain && (
                                    <span className="text-[10px] text-text-muted">{domain}</span>
                                  )}
                                  {duration != null && (
                                    <span className="ml-auto flex items-center gap-1 text-[10px] text-text-muted shrink-0">
                                      <Clock className="w-3 h-3" />
                                      {duration}min
                                    </span>
                                  )}
                                </div>
                                {description && (
                                  <p className="text-xs text-text-secondary mt-1">{description}</p>
                                )}
                                {row.notes && (
                                  <p className="text-xs text-text-muted mt-1 italic">{row.notes}</p>
                                )}
                              </div>
                            </div>

                            {/* Coach cues */}
                            {cues && cues.length > 0 && (
                              <div className="pl-6 space-y-0.5">
                                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Coach Cues</p>
                                {cues.map((cue, k) => (
                                  <p key={k} className="text-xs text-text-secondary flex items-start gap-1.5">
                                    <span className="text-lime mt-0.5 shrink-0">›</span>
                                    {cue}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Success criteria */}
                            {criteria && criteria.length > 0 && (
                              <div className="pl-6 space-y-0.5">
                                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Success Criteria</p>
                                {criteria.map((c, k) => (
                                  <p key={k} className="text-xs text-text-secondary flex items-start gap-1.5">
                                    <CheckCircle className="w-3 h-3 text-status-green mt-0.5 shrink-0" />
                                    {c}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Progressions / regressions */}
                            {(progs && progs.length > 0) || (regs && regs.length > 0) ? (
                              <div className="pl-6 flex gap-6 flex-wrap">
                                {progs && progs.length > 0 && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Progressions</p>
                                    {progs.map((p, k) => (
                                      <p key={k} className="text-xs text-text-muted flex items-start gap-1">
                                        <ArrowUpRight className="w-3 h-3 text-lime mt-0.5 shrink-0" />
                                        {p}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {regs && regs.length > 0 && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Regressions</p>
                                    {regs.map((r, k) => (
                                      <p key={k} className="text-xs text-text-muted flex items-start gap-1">
                                        <ArrowRight className="w-3 h-3 text-text-muted mt-0.5 shrink-0 rotate-180" />
                                        {r}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* ================================================================
          TEMPLATE BLOCKS — shows all blocks including those without
          curriculum content. Legacy exercises shown below curriculum.
          ================================================================ */}
      <div>
        <p className="label-xs mb-3">Template Blocks</p>
        {blockList.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <p className="text-xs text-text-muted text-center">No blocks in this template.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {blockList.map((block, i) => {
              const curriculumItems = curriculumByBlock.get(block.id) ?? []
              const exercises = exercisesByBlock.get(block.id) ?? []
              const hasCurriculum = curriculumItems.length > 0
              const hasLegacy = exercises.length > 0

              // Shape assigned items for BlockContentPickerCard
              const assignedItems: AssignedItem[] = curriculumItems.map(row => ({
                cctbId: row.id,
                contentItemId: row.content_item_id,
                drillId: row.drill_id,
                title: row.content_item?.title ?? row.drill?.name ?? 'Untitled',
                contentType: row.content_item?.content_type ?? 'drill',
                domain: row.content_item?.domain ?? row.drill?.domain ?? null,
                sessionBlockHint: row.content_item?.session_block_hint ?? null,
                durationMin: row.duration_min ?? row.content_item?.duration_min ?? row.drill?.duration_min ?? null,
                orderIndex: row.order_index,
              }))

              return (
                <Card key={block.id}>
                  <CardContent className="py-4 space-y-3">
                    {/* Block header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-text-muted w-5 shrink-0">{i + 1}</span>
                        <p className="text-sm font-semibold text-text-primary">{block.name}</p>
                        {block.type && (
                          <span className="text-[10px] uppercase tracking-widest text-text-muted px-1.5 py-0.5 rounded border border-border">
                            {block.type}
                          </span>
                        )}
                        {hasCurriculum && (
                          <span className="text-[10px] text-status-green flex items-center gap-0.5">
                            <Layers className="w-2.5 h-2.5" />
                            {curriculumItems.length} item{curriculumItems.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {block.duration_min != null && (
                        <div className="shrink-0 flex items-center gap-1 text-xs text-text-muted">
                          <Clock className="w-3 h-3" />
                          {block.duration_min}min
                        </div>
                      )}
                    </div>

                    {block.notes && (
                      <p className="text-xs text-text-muted pl-7">{block.notes}</p>
                    )}

                    {/* Interactive curriculum content picker */}
                    <BlockContentPickerCard
                      blockId={block.id}
                      blockName={block.name}
                      templateId={params.templateId}
                      initialAssigned={assignedItems}
                      available={availableContent}
                    />

                    {/* Legacy exercises — de-emphasized */}
                    {hasLegacy && (
                      <div className="pl-7 pt-2 border-t border-border/50">
                        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
                          Attached exercise records
                          <span className="ml-1 normal-case text-[9px] text-text-muted/60">(legacy / fitness)</span>
                        </p>
                        <ul className="space-y-0.5">
                          {exercises.map((ex, j) => (
                            <li key={j} className="text-xs text-text-muted/70 flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-text-muted/50 w-4 text-right">{j + 1}.</span>
                              <span>{ex.name}</span>
                              <span className="text-[10px] text-text-muted/50">{ex.category}</span>
                            </li>
                          ))}
                        </ul>
                        {hasCurriculum && (
                          <p className="text-[10px] text-text-muted/60 mt-1 italic">
                            Curriculum lesson-plan content appears above.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
