import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, BookOpen, GraduationCap } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { ClassTemplateCurriculumSelector } from './ClassTemplateCurriculumSelector'
import type { CurriculumLevelOption } from './ClassTemplateCurriculumSelector'
import type { Tables } from '@/lib/supabase/database.types'

type Template = Tables<'templates'>

interface PageProps {
  params: { templateId: string }
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
    .select('*, curriculum_level_id')
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

  // Fetch exercises per block
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

  let totalExercises = 0
  exercisesByBlock.forEach(arr => { totalExercises += arr.length })

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
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Exercises</p>
              <p className="text-base font-mono font-bold text-lime">{totalExercises}</p>
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
          </div>
        </CardContent>
      </Card>

      {/* Curriculum level */}
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

      {/* Blocks */}
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
              const exercises = exercisesByBlock.get(block.id) ?? []
              return (
                <Card key={block.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-text-muted w-5 shrink-0">{i + 1}</span>
                          <p className="text-sm font-semibold text-text-primary">{block.name}</p>
                          {block.type && (
                            <span className="text-[10px] uppercase tracking-widest text-text-muted px-1.5 py-0.5 rounded border border-border">
                              {block.type}
                            </span>
                          )}
                        </div>
                        {block.notes && (
                          <p className="text-xs text-text-muted mt-1 pl-7">{block.notes}</p>
                        )}
                        {exercises.length > 0 && (
                          <ul className="mt-2 pl-7 space-y-0.5">
                            {exercises.map((ex, j) => (
                              <li key={j} className="text-xs text-text-secondary flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-text-muted w-4 text-right">{j + 1}.</span>
                                <span>{ex.name}</span>
                                <span className="text-[10px] text-text-muted">{ex.category}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {exercises.length === 0 && (
                          <p className="text-[11px] text-text-muted mt-1 pl-7 italic">No exercises assigned.</p>
                        )}
                      </div>
                      {block.duration_min != null && (
                        <div className="shrink-0 flex items-center gap-1 text-xs text-text-muted">
                          <Clock className="w-3 h-3" />
                          {block.duration_min}min
                        </div>
                      )}
                    </div>
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
