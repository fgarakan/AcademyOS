import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Activity } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { CurriculumLevelSelector, type CurriculumLevelOption } from './CurriculumLevelSelector'
import { GenerateSessionPanel, type CoachOption, type GateOption, type LessonPlanBlock } from './GenerateSessionPanel'
import { inferFitnessBlockType } from '@/lib/fitness/fitnessBlockTypes'
import { getCurriculumDrillsForLevel, type CurriculumDrillRow } from '@/lib/templates/curriculumTemplateLinks'
import { FitnessBuilderStepper } from './FitnessBuilderStepper'
import type { FitnessBlock, FitnessExercise, ExerciseLibraryItem } from './fitnessBuilderTypes'
import type { Tables } from '@/lib/supabase/database.types'

type Template = Tables<'templates'>

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  'template_type:standard':        'Standard',
  'template_type:pre_tournament':  'Pre-Tournament',
  'template_type:post_tournament': 'Post-Tournament',
  'template_type:high_intensity':  'High-Intensity',
  'template_type:low_load':        'Low-Load',
  'template_type:assessment':      'Assessment',
  'template_type:recovery':        'Recovery',
}

function getTemplateTypeLabel(tags: string[]): string {
  for (const tag of tags) {
    if (TEMPLATE_TYPE_LABELS[tag]) return TEMPLATE_TYPE_LABELS[tag]
  }
  return 'Fitness'
}

interface PageProps {
  params: { templateId: string }
}

export default async function FitnessTemplateDetailPage({ params }: PageProps) {
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

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', params.templateId)
    .eq('academy_id', academyId)
    .single()

  if (templateError || !template) notFound()

  const tags = template.tags ?? []
  const isFitnessTemplate = tags.includes('fitness_template:true')

  const { data: blocks, error: blocksError } = await supabase
    .from('template_blocks')
    .select('*')
    .eq('template_id', params.templateId)
    .order('order_index')

  if (blocksError) {
    return (
      <div className="p-6 animate-fade-in space-y-6">
        <PageHeader template={template} typeLabel={getTemplateTypeLabel(tags)} isFitnessTemplate={isFitnessTemplate} />
        <p className="text-status-red text-sm">Failed to load blocks: {blocksError.message}</p>
      </div>
    )
  }

  const blockList = blocks ?? []
  const blockIds = blockList.map(b => b.id)

  interface RawTBE {
    id: string
    block_id: string
    order_index: number
    duration_min: number | null
    notes: string | null
    exercises: {
      id: string
      name: string
      category: string
      subcategory: string | null
      duration_min: number | null
    } | null
  }

  const rawDb = supabase as any

  let rawExercises: RawTBE[] = []
  let blockExercisesQueryError: string | null = null
  if (blockIds.length > 0) {
    const { data: exData, error: tbeError } = await rawDb
      .from('template_block_exercises')
      .select('id, block_id, order_index, duration_min, notes, exercises(id, name, category, subcategory, duration_min)')
      .in('block_id', blockIds)
      .order('order_index')
    if (tbeError) blockExercisesQueryError = tbeError.message
    rawExercises = (exData ?? []) as RawTBE[]
  }

  const exercisesByBlock = new Map<string, FitnessExercise[]>()
  for (const row of rawExercises) {
    const ex = row.exercises
    const item: FitnessExercise = {
      id: row.id,
      exercise_id: ex?.id ?? '',
      name: ex?.name ?? '(unknown)',
      category: ex?.category ?? '',
      subcategory: ex?.subcategory ?? null,
      duration_min: row.duration_min,
      notes: row.notes,
    }
    const arr = exercisesByBlock.get(row.block_id) ?? []
    arr.push(item)
    exercisesByBlock.set(row.block_id, arr)
  }

  const fitnessBlocks: FitnessBlock[] = blockList.map(b => ({
    id: b.id,
    name: b.name,
    type: b.type,
    fitnessBlockType: inferFitnessBlockType(b.name),
    duration_min: b.duration_min,
    order_index: b.order_index,
    notes: b.notes,
    exercises: exercisesByBlock.get(b.id) ?? [],
  }))

  // Fetch exercise library for switcher
  const { data: libraryData, error: libraryError } = await supabase
    .from('exercises')
    .select('id, name, category, subcategory, duration_min, tags')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('name')

  const exerciseLibrary: ExerciseLibraryItem[] = (libraryData ?? []).map(ex => ({
    id: ex.id,
    name: ex.name,
    category: ex.category,
    subcategory: ex.subcategory,
    duration_min: ex.duration_min,
    tags: ex.tags,
  }))

  // Diagnostic: count all exercises for this academy regardless of is_active.
  // Distinguishes "no exercises imported" from "exercises exist but marked inactive".
  const { count: totalExercisesInAcademy } = await supabase
    .from('exercises')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)

  const typeLabel = getTemplateTypeLabel(tags)
  const totalExercises = rawExercises.length

  // Curriculum level for this template — curriculum_level_id not in generated types, use rawDb
  const curriculumLevelId: string | null = (template as any).curriculum_level_id ?? null

  const { data: curriculumLevelsData } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name, stage, sort_order')
    .order('sort_order', { ascending: true })

  const curriculumLevels: CurriculumLevelOption[] = (curriculumLevelsData ?? []).map(
    (l: { id: string; display_name: string; stage: string }) => ({
      id: l.id,
      display_name: l.display_name,
      stage: l.stage,
    })
  )

  const currentLevelName = curriculumLevelId
    ? (curriculumLevels.find(l => l.id === curriculumLevelId)?.display_name ?? null)
    : null

  // Curriculum drills for the reference panel — read-only, rawDb inside helper
  const curriculumDrills: CurriculumDrillRow[] = curriculumLevelId
    ? await getCurriculumDrillsForLevel(curriculumLevelId, academyId, supabase)
    : []

  // Curriculum gates for the focus gates selector in session generation
  let focusGatesForSession: GateOption[] = []
  if (curriculumLevelId) {
    const { data: gateData } = await rawDb
      .from('curriculum_gates')
      .select('id, domain, criterion, threshold, sort_order')
      .eq('level_id', curriculumLevelId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(15)
    focusGatesForSession = (gateData ?? []).map((g: { id: string; domain: string; criterion: string; threshold: string }) => ({
      id: g.id,
      domain: g.domain,
      criterion: g.criterion,
      threshold: g.threshold ?? '',
    }))
  }

  // Fetch coaches for the Generate Session panel
  const { data: coachMemberships } = await supabase
    .from('academy_memberships')
    .select('profile_id, role')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .in('role', ['coach', 'head_coach', 'academy_director'])

  const coachProfileIds = (coachMemberships ?? []).map(m => m.profile_id)
  const coaches: CoachOption[] = []
  if (coachProfileIds.length > 0) {
    const { data: coachProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', coachProfileIds)
      .order('display_name')
    for (const p of coachProfiles ?? []) {
      coaches.push({ id: p.id, display_name: p.display_name })
    }
  }

  const fallbackCoachId = user?.id ?? ''
  const { data: currentProfile } = user
    ? await supabase.from('profiles').select('display_name').eq('id', user.id).single()
    : { data: null }
  const fallbackCoachName = currentProfile?.display_name ?? 'You'

  // Map fitness blocks to lesson plan block shape for the preview panel
  const lessonPlanBlocks: LessonPlanBlock[] = fitnessBlocks.map(b => ({
    id: b.id,
    name: b.name,
    duration_min: b.duration_min,
    notes: b.notes,
    exerciseNames: b.exercises.map(e => e.name),
  }))

  // Fitness templates: guided builder stepper
  if (isFitnessTemplate) {
    return (
      <div className="p-6 animate-fade-in space-y-6">
        <PageHeader template={template} typeLabel={typeLabel} isFitnessTemplate={true} />
        <FitnessBuilderStepper
          templateId={params.templateId}
          templateName={template.name}
          templateDescription={template.description ?? null}
          templateDurationMin={template.total_duration_min ?? null}
          templateIsActive={template.is_active}
          templateCreatedAt={template.created_at}
          templateUpdatedAt={(template as any).updated_at ?? null}
          typeLabel={typeLabel}
          curriculumLevelId={curriculumLevelId}
          currentLevelName={currentLevelName}
          curriculumLevels={curriculumLevels}
          curriculumDrills={curriculumDrills}
          focusGatesForSession={focusGatesForSession}
          coaches={coaches}
          fallbackCoachId={fallbackCoachId}
          fallbackCoachName={fallbackCoachName}
          fitnessBlocks={fitnessBlocks}
          exerciseLibrary={exerciseLibrary}
          libraryQueryError={libraryError?.message ?? null}
          totalExercisesInAcademy={totalExercisesInAcademy ?? 0}
          blockExercisesQueryError={blockExercisesQueryError}
          lessonPlanBlocks={lessonPlanBlocks}
        />
      </div>
    )
  }

  // Non-fitness template: keep existing warning path unchanged
  return (
    <div className="p-6 animate-fade-in space-y-6">
      <PageHeader template={template} typeLabel={typeLabel} isFitnessTemplate={false} />
      <TemplateMeta
        template={template}
        typeLabel={typeLabel}
        blockCount={fitnessBlocks.length}
        exerciseCount={totalExercises}
        isFitnessTemplate={false}
      />
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-status-orange/20 bg-status-orange/5 text-sm text-status-orange">
        <Activity className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">This is a class/session template</p>
          <p className="text-xs mt-0.5 text-status-orange/80">
            Class templates are managed under Class Templates. The Fitness OS block builder is available for Fitness Templates only.
            <Link href="/director/class-templates" className="ml-1 underline underline-offset-2">
              View class templates →
            </Link>
          </p>
        </div>
      </div>
      <div className="px-4 py-3 rounded-xl border border-border text-xs text-text-muted">
        Legacy class template editor is available at{' '}
        <span className="font-mono text-text-secondary">/director/fitness/templates/{params.templateId}</span>
        . Use the Class Templates section to manage session templates.
      </div>
    </div>
  )
}

function PageHeader({
  template,
  typeLabel,
  isFitnessTemplate,
}: {
  template: Template
  typeLabel: string
  isFitnessTemplate: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <Link
          href="/director/fitness/templates"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Fitness Templates
        </Link>
        <p className="page-eyebrow">{isFitnessTemplate ? 'FITNESS OS' : 'Template'}</p>
        <h1 className="page-title">{template.name}</h1>
        {template.description && (
          <p className="page-subtitle">{template.description}</p>
        )}
      </div>
      {isFitnessTemplate && (
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-lime/20 bg-lime/5 text-xs text-lime">
          <Activity className="w-3 h-3" />
          {typeLabel}
        </div>
      )}
    </div>
  )
}

function TemplateMeta({
  template,
  typeLabel,
  blockCount,
  exerciseCount,
  isFitnessTemplate,
}: {
  template: Template
  typeLabel: string
  blockCount: number
  exerciseCount: number
  isFitnessTemplate: boolean
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
              {isFitnessTemplate ? 'Template Type' : 'Track'}
            </p>
            <p className="text-sm text-text-primary">
              {isFitnessTemplate ? typeLabel : (template.track ?? '—')}
            </p>
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
            <p className="text-base font-mono font-bold text-lime">{blockCount}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Exercises</p>
            <p className="text-base font-mono font-bold text-lime">{exerciseCount}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
          <span className={[
            'text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border',
            template.is_active
              ? 'border-status-green/50 text-status-green'
              : 'border-border text-text-muted',
          ].join(' ')}>
            {template.is_active ? 'Active' : 'Inactive'}
          </span>
          {isFitnessTemplate && (
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-lime/20 text-lime/60">
              Fitness OS
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
