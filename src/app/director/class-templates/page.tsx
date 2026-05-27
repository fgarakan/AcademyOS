import Link from 'next/link'
import { BookOpen, Clock, Dumbbell, GraduationCap, Plus } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import type { Tables } from '@/lib/supabase/database.types'
import { PageExplainerCard } from '@/components/onboarding/PageExplainerCard'
import { NextBestActionCard } from '@/components/onboarding/NextBestActionCard'

type Template = Tables<'templates'>
type TemplateWithLevel = Template & { curriculum_level_id: string | null }

export default async function ClassTemplatesPage() {
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
  const { data: templatesRaw, error } = await rawDb
    .from('templates')
    .select('*')
    .eq('academy_id', academyId)
    .order('name')

  const templates = (templatesRaw ?? []) as TemplateWithLevel[]

  // Class templates: all templates that do NOT have the fitness_template:true tag
  const classTemplates = templates.filter(t => {
    const tags = t.tags ?? []
    return !tags.includes('fitness_template:true')
  })

  // Build curriculum level name map for templates that have one assigned
  const curriculumLevelNameMap: Record<string, string> = {}
  const levelIds = Array.from(new Set(classTemplates.map(t => t.curriculum_level_id).filter(Boolean) as string[]))
  if (levelIds.length > 0) {
    const { data: levelRows } = await rawDb
      .from('curriculum_levels')
      .select('id, display_name')
      .in('id', levelIds)
    for (const l of (levelRows ?? [])) {
      curriculumLevelNameMap[l.id] = l.display_name
    }
  }

  const blockCountByTemplate = new Map<string, number>()
  const exerciseCountByTemplate = new Map<string, number>()
  const curriculumItemCountByTemplate = new Map<string, number>()

  if (classTemplates.length > 0) {
    const ids = classTemplates.map(t => t.id)

    const { data: blocks } = await supabase
      .from('template_blocks')
      .select('id, template_id')
      .in('template_id', ids)

    const blockList = blocks ?? []
    for (const b of blockList) {
      blockCountByTemplate.set(b.template_id, (blockCountByTemplate.get(b.template_id) ?? 0) + 1)
    }

    const blockIds = blockList.map(b => b.id)
    if (blockIds.length > 0) {
      const { data: blockExercises } = await supabase
        .from('template_block_exercises')
        .select('block_id')
        .in('block_id', blockIds)

      const blockToTemplate = new Map<string, string>()
      for (const b of blockList) blockToTemplate.set(b.id, b.template_id)

      for (const ex of (blockExercises ?? [])) {
        const tid = blockToTemplate.get(ex.block_id)
        if (tid) exerciseCountByTemplate.set(tid, (exerciseCountByTemplate.get(tid) ?? 0) + 1)
      }

      // Curriculum content counts per template (Sprint 137 — loop status)
      // rawDb required — curriculum_class_template_blocks not in database.types.ts
      const { data: cctbRows } = await rawDb
        .from('curriculum_class_template_blocks')
        .select('block_id')
        .in('block_id', blockIds)

      for (const row of (cctbRows ?? [])) {
        const tid = blockToTemplate.get(row.block_id)
        if (tid) curriculumItemCountByTemplate.set(tid, (curriculumItemCountByTemplate.get(tid) ?? 0) + 1)
      }
    }
  }

  // Sprint 137 — Curriculum loop summary stats
  const templatesWithLessonPlan = classTemplates.filter(t => (curriculumItemCountByTemplate.get(t.id) ?? 0) > 0)
  const templatesWithLevel = classTemplates.filter(t => !!t.curriculum_level_id)

  // Sessions generated from curriculum-linked templates in the last 30 days
  let recentCurriculumSessionCount = 0
  const curriculumLinkedTemplateIds = templatesWithLessonPlan.map(t => t.id)
  if (curriculumLinkedTemplateIds.length > 0) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data: recentSessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('academy_id', academyId)
      .in('template_id', curriculumLinkedTemplateIds)
      .gte('scheduled_date', thirtyDaysAgo)
    recentCurriculumSessionCount = (recentSessions ?? []).length
  }

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader />
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/director/fitness/templates"
            className="inline-flex items-center gap-1.5 btn-ghost text-xs px-3 py-2"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Fitness Templates
          </Link>
          {/* Sprint 819: data-donna-focus-id for DONNA navigate+highlight */}
          <Link
            href="/director/class-templates/new"
            className="inline-flex items-center gap-1.5 btn-lime text-xs px-3 py-2"
            data-donna-focus-id="create-template-button"
          >
            <Plus className="w-3.5 h-3.5" />
            New Class Template
          </Link>
        </div>
      </div>

      <PageExplainerCard
        title="Turn curriculum into coach-ready lesson plans"
        body="Class templates are reusable teaching structures. Assign a curriculum level, generate a lesson plan, apply it to the template, then create sessions your coaches can run."
        qa={[
          {
            q: 'What is a class template?',
            a: 'A named, reusable session structure with blocks. Think of it as the blueprint your coaches execute on court.',
          },
          {
            q: 'Why assign a curriculum level?',
            a: 'The level tells the OS which goals, gates, drills, and coach language apply to this class — making the lesson plan relevant to the players in it.',
          },
          {
            q: 'What does "lesson plan applied" mean?',
            a: 'The lesson plan has been written to this template. Every session created from it will carry the curriculum content automatically.',
          },
          {
            q: 'What should I do first?',
            a: 'Open a template, assign a curriculum level, then use the lesson plan generator to create and apply a draft.',
          },
          {
            q: 'What happens after a session is created?',
            a: 'Coaches see the lesson plan during the session. After, they submit a wrap-up you can review in the Review Queue.',
          },
        ]}
      />

      {error && (
        <p className="text-status-red text-sm">Failed to load templates: {error.message}</p>
      )}

      {/* Sprint 137 — Curriculum loop summary strip */}
      {classTemplates.length > 0 && (
        <div className="flex flex-wrap gap-5 px-4 py-3 rounded-xl bg-surface-raised border border-border">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Lesson Plans Applied</p>
            <p className="text-sm font-mono font-bold text-lime">
              {templatesWithLessonPlan.length}
              <span className="text-text-muted font-normal text-xs"> / {classTemplates.length}</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Curriculum Level Set</p>
            <p className="text-sm font-mono font-bold text-lime">
              {templatesWithLevel.length}
              <span className="text-text-muted font-normal text-xs"> / {classTemplates.length}</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Sessions w/ Curriculum (30d)</p>
            <p className="text-sm font-mono font-bold text-lime">{recentCurriculumSessionCount}</p>
          </div>
        </div>
      )}

      {/* Sprint 819: data-donna-focus-id for DONNA template-list highlight */}
      {classTemplates.length === 0 ? (
        <div className="space-y-3" data-donna-focus-id="template-list">
          <NextBestActionCard
            variant="guide"
            title="Create your first class template"
            body="A class template is your reusable blueprint. Assign a curriculum level, generate a lesson plan, and coaches can run it on court."
            actionLabel="New Class Template"
            actionHref="/director/class-templates/new"
          />
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={<BookOpen className="w-5 h-5" />}
                title="No class templates yet"
                description="Templates you create will appear here. Each template is a curriculum-aligned session plan coaches can run on court."
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-3" data-donna-focus-id="template-list">
          {classTemplates.map(template => (
            <TemplateRow
              key={template.id}
              template={template}
              blockCount={blockCountByTemplate.get(template.id) ?? 0}
              exerciseCount={exerciseCountByTemplate.get(template.id) ?? 0}
              curriculumItemCount={curriculumItemCountByTemplate.get(template.id) ?? 0}
              curriculumLevelName={template.curriculum_level_id ? (curriculumLevelNameMap[template.curriculum_level_id] ?? null) : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PageHeader() {
  return (
    <div>
      <p className="page-eyebrow">Curriculum</p>
      <h1 className="page-title">Class Templates</h1>
      <p className="page-subtitle">
        Reusable class blueprints that help coaches run consistent, curriculum-aligned sessions on court.
      </p>
    </div>
  )
}

function TemplateRow({
  template,
  blockCount,
  exerciseCount,
  curriculumItemCount,
  curriculumLevelName,
}: {
  template: TemplateWithLevel
  blockCount: number
  exerciseCount: number
  curriculumItemCount: number
  curriculumLevelName: string | null
}) {
  const importBatchTag = template.tags?.find(t => t.startsWith('import_batch:'))
  const airtableIdTag = template.tags?.find(t => t.startsWith('airtable_id:'))
  const isDraft = (template.tags ?? []).includes('status:draft')

  return (
    <Link href={`/director/class-templates/${template.id}`} className="block">
      <Card hover>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-text-primary text-sm">{template.name}</p>
                {curriculumLevelName && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-lime/20 bg-lime/5 text-lime">
                    <GraduationCap className="w-2.5 h-2.5" />
                    {curriculumLevelName}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-1">
                {template.track && (
                  <span className="text-[10px] uppercase tracking-widest text-text-muted">{template.track}</span>
                )}
                {airtableIdTag && (
                  <span className="text-[10px] font-mono text-text-muted">{airtableIdTag}</span>
                )}
                {importBatchTag && (
                  <span className="text-[10px] font-mono text-text-muted">{importBatchTag}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5 shrink-0 flex-wrap justify-end">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Blocks</p>
                <p className="text-base font-mono font-bold text-lime">{blockCount}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Exercises</p>
                <p className="text-base font-mono font-bold text-lime">{exerciseCount}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Curriculum</p>
                <p className={`text-base font-mono font-bold ${curriculumItemCount > 0 ? 'text-lime' : 'text-text-muted'}`}>
                  {curriculumItemCount}
                </p>
              </div>
              {template.total_duration_min != null && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="w-3.5 h-3.5" />
                  {template.total_duration_min}min
                </div>
              )}
              {isDraft ? (
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-border text-text-secondary">
                  Draft
                </span>
              ) : (
                <span className={[
                  'text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border',
                  template.is_active
                    ? 'border-status-green/50 text-status-green'
                    : 'border-border text-text-muted',
                ].join(' ')}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
