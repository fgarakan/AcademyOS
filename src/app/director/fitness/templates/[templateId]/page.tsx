import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { TemplateEditor } from './TemplateEditor'
import type { EditableBlock, EditableExercise } from './TemplateEditor'
import { GenerateSessionPanel } from './GenerateSessionPanel'
import type { CoachOption } from './GenerateSessionPanel'
import { PopulateFitnessBlocksButton } from './PopulateFitnessBlocksButton'
import { PopulateCurriculumBlocksButton } from './PopulateCurriculumBlocksButton'
import { CurriculumLevelSelector } from './CurriculumLevelSelector'
import type { CurriculumLevelOption } from './CurriculumLevelSelector'
import type { Tables } from '@/lib/supabase/database.types'

type Template = Tables<'templates'>

interface RawBlockExercise {
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

interface PageProps {
  params: { templateId: string }
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  let currentUserName = 'Director'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id, display_name')
      .eq('id', user.id)
      .single()
    academyId = profile?.academy_id ?? null
    currentUserName = profile?.display_name ?? 'Director'
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

  if (templateError || !template) {
    notFound()
  }

  // Fetch curriculum_level_id — new column not in database.types.ts
  const rawDbOuter = supabase as any
  const { data: templateCurriculumRow } = await rawDbOuter
    .from('templates')
    .select('curriculum_level_id')
    .eq('id', params.templateId)
    .single()
  const curriculumLevelId: string | null = templateCurriculumRow?.curriculum_level_id ?? null

  // Fetch all curriculum levels for the selector
  const { data: curriculumLevelsRaw } = await rawDbOuter
    .from('curriculum_levels')
    .select('id, display_name, stage')
    .order('sort_order')
  const curriculumLevels: CurriculumLevelOption[] = (curriculumLevelsRaw ?? []) as CurriculumLevelOption[]

  const { data: blocks, error: blocksError } = await supabase
    .from('template_blocks')
    .select('*')
    .eq('template_id', params.templateId)
    .order('order_index')

  if (blocksError) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader template={template} />
        <div className="flex items-center justify-center h-40">
          <p className="text-status-red text-sm">Failed to load blocks: {blocksError.message}</p>
        </div>
      </div>
    )
  }

  const blockList = blocks ?? []
  const blockIds = blockList.map(b => b.id)

  let rawExercises: RawBlockExercise[] = []

  if (blockIds.length > 0) {
    // rawDb cast to avoid TS2589 on nested select
    const rawDb = supabase as any
    const { data: exData } = await rawDb
      .from('template_block_exercises')
      .select('id, block_id, order_index, duration_min, notes, exercises(id, name, category, subcategory, duration_min)')
      .in('block_id', blockIds)
      .order('order_index')

    rawExercises = (exData ?? []) as RawBlockExercise[]
  }

  // Group exercises by block_id
  const exercisesByBlock = new Map<string, EditableExercise[]>()
  for (const row of rawExercises) {
    const ex = row.exercises
    const editable: EditableExercise = {
      id: row.id,
      exercise_id: ex?.id ?? '',
      name: ex?.name ?? '(unknown)',
      category: ex?.category ?? '',
      subcategory: ex?.subcategory ?? null,
      duration_min: row.duration_min,
      order_index: row.order_index,
      notes: row.notes,
    }
    const arr = exercisesByBlock.get(row.block_id) ?? []
    arr.push(editable)
    exercisesByBlock.set(row.block_id, arr)
  }

  // Build the editable block shape passed to the client component
  const editableBlocks: EditableBlock[] = blockList.map(b => ({
    id: b.id,
    name: b.name,
    type: b.type,
    duration_min: b.duration_min,
    order_index: b.order_index,
    exercises: exercisesByBlock.get(b.id) ?? [],
  }))

  const totalExercises = rawExercises.length

  // Fetch active coaches for this academy (two sequential queries per AI_BACKEND_RULES #5)
  const { data: coachMemberships } = await supabase
    .from('academy_memberships')
    .select('profile_id')
    .eq('academy_id', academyId)
    .in('role', ['coach', 'head_coach'])
    .eq('is_active', true)

  const coachProfileIds = (coachMemberships ?? []).map(m => m.profile_id)
  let coaches: CoachOption[] = []
  if (coachProfileIds.length > 0) {
    const { data: coachProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', coachProfileIds)
    coaches = (coachProfiles ?? []).map(p => ({ id: p.id, display_name: p.display_name }))
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader template={template} />
      <GenerateSessionPanel
        templateId={params.templateId}
        templateName={template.name}
        hasBlocks={blockList.length > 0}
        coaches={coaches}
        fallbackCoachId={user!.id}
        fallbackCoachName={currentUserName}
      />
      <TemplateMeta
        template={template}
        blockCount={blockList.length}
        exerciseCount={totalExercises}
      />
      {/* Curriculum level selector and curriculum-aware population */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <CurriculumLevelSelector
            templateId={params.templateId}
            currentLevelId={curriculumLevelId}
            levels={curriculumLevels}
          />
          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Curriculum Population</p>
            <p className="text-xs text-text-muted">
              Writes curriculum-appropriate drills, games, and coaching cues into block notes based on the selected level.
              Only populates blocks with empty notes.
            </p>
            <PopulateCurriculumBlocksButton
              templateId={params.templateId}
              hasBlocks={blockList.length > 0}
              hasCurriculumLevel={!!curriculumLevelId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Populate blocks with exercises from the exercise library */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Exercise Population</p>
        <PopulateFitnessBlocksButton
          templateId={params.templateId}
          hasBlocks={blockList.length > 0}
        />
      </div>

      <TemplateEditor
        templateId={params.templateId}
        initialBlocks={editableBlocks}
      />
    </div>
  )
}

function PageHeader({ template }: { template: Template }) {
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
        <h1 className="text-2xl font-bold text-text-primary">{template.name}</h1>
        {template.description && (
          <p className="text-sm text-text-secondary mt-1">{template.description}</p>
        )}
      </div>
    </div>
  )
}

function TemplateMeta({
  template,
  blockCount,
  exerciseCount,
}: {
  template: Template
  blockCount: number
  exerciseCount: number
}) {
  const importBatchTag = template.tags?.find(t => t.startsWith('import_batch:'))
  const airtableIdTag = template.tags?.find(t => t.startsWith('airtable_id:'))
  const sourceTag = template.tags?.find(t => t.startsWith('source:'))

  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Status</p>
            <span className={[
              'text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border',
              template.is_active
                ? 'border-status-green/50 text-status-green'
                : 'border-border text-text-muted',
            ].join(' ')}>
              {template.is_active ? 'Active' : 'Inactive'}
            </span>
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

        {(airtableIdTag || importBatchTag || sourceTag) && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
            {[sourceTag, airtableIdTag, importBatchTag].filter(Boolean).map(tag => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-raised text-text-muted border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
