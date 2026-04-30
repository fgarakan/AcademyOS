import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, Clock, ChevronRight, Dumbbell } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import type { Tables } from '@/lib/supabase/database.types'

type Template = Tables<'templates'>
type TemplateBlock = Tables<'template_blocks'>

interface BlockExercise {
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

  if (templateError || !template) {
    notFound()
  }

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

  let blockExercises: BlockExercise[] = []

  if (blockIds.length > 0) {
    // rawDb cast to avoid TS2589 on nested select
    const rawDb = supabase as any
    const { data: exData } = await rawDb
      .from('template_block_exercises')
      .select('id, block_id, order_index, duration_min, notes, exercises(id, name, category, subcategory, duration_min)')
      .in('block_id', blockIds)
      .order('order_index')

    blockExercises = (exData ?? []) as BlockExercise[]
  }

  const exercisesByBlock = new Map<string, BlockExercise[]>()
  for (const ex of blockExercises) {
    const arr = exercisesByBlock.get(ex.block_id) ?? []
    arr.push(ex)
    exercisesByBlock.set(ex.block_id, arr)
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader template={template} />
      <TemplateMeta template={template} blockCount={blockList.length} exerciseCount={blockExercises.length} />

      {blockList.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Dumbbell className="w-5 h-5" />}
            title="No blocks found"
            description="This template has no blocks yet."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {blockList.map(block => (
            <BlockCard
              key={block.id}
              block={block}
              exercises={exercisesByBlock.get(block.id) ?? []}
            />
          ))}
        </div>
      )}
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
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-xs text-text-muted shrink-0">
        <Lock className="w-3 h-3" />
        Read-only
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

function BlockCard({ block, exercises }: { block: TemplateBlock; exercises: BlockExercise[] }) {
  const blockTypeLabel = BLOCK_TYPE_LABELS[block.type] ?? block.type

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-text-muted w-5 text-right shrink-0">
              {block.order_index}
            </span>
            <div>
              <p className="font-semibold text-text-primary">{block.name}</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {blockTypeLabel}
                {block.type !== block.name.toLowerCase().replace(/\s+/g, '_') && (
                  <span className="text-text-muted/60"> · enum: {block.type}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            {block.duration_min} min
          </div>
        </div>
      </CardHeader>

      {exercises.length === 0 ? (
        <CardContent className="pt-0">
          <p className="text-xs text-text-muted italic">No exercises in this block.</p>
        </CardContent>
      ) : (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {exercises.map(ex => (
              <ExerciseRow key={ex.id} ex={ex} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function ExerciseRow({ ex }: { ex: BlockExercise }) {
  const exercise = ex.exercises

  return (
    <div className="flex items-center gap-3 py-2 border-t border-border first:border-0">
      <span className="text-[10px] font-mono text-text-muted w-5 text-right shrink-0">
        {ex.order_index}
      </span>
      <ChevronRight className="w-3 h-3 text-border shrink-0" />
      <div className="flex-1 min-w-0">
        {exercise ? (
          <>
            <p className="text-sm text-text-primary">{exercise.name}</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              {exercise.category}
              {exercise.subcategory ? ` · ${exercise.subcategory}` : ''}
            </p>
          </>
        ) : (
          <p className="text-sm text-status-red">Exercise not found</p>
        )}
      </div>
      {ex.duration_min != null && (
        <div className="flex items-center gap-1 text-xs text-text-muted shrink-0">
          <Clock className="w-3 h-3" />
          {ex.duration_min}min
        </div>
      )}
      {ex.notes && (
        <p className="text-[10px] text-text-muted shrink-0 max-w-[160px] truncate">{ex.notes}</p>
      )}
    </div>
  )
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  warm_up:     'Warm Up',
  technical:   'Technical',
  tactical:    'Tactical',
  movement:    'Movement',
  fitness:     'Fitness',
  competition: 'Competition',
  mental:      'Mental',
  cool_down:   'Cool Down',
  free:        'Free',
}
