import Link from 'next/link'
import { BookOpen, Clock } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import type { Tables } from '@/lib/supabase/database.types'

type Template = Tables<'templates'>

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

  const { data: templates, error } = await supabase
    .from('templates')
    .select('*')
    .eq('academy_id', academyId)
    .order('name')

  // Class templates: all templates that do NOT have the fitness_template:true tag
  const classTemplates = (templates ?? []).filter(t => {
    const tags = t.tags ?? []
    return !tags.includes('fitness_template:true')
  })

  const blockCountByTemplate = new Map<string, number>()
  const exerciseCountByTemplate = new Map<string, number>()

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
    }
  }

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <PageHeader />

      {error && (
        <p className="text-status-red text-sm">Failed to load templates: {error.message}</p>
      )}

      {classTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<BookOpen className="w-5 h-5" />}
              title="No class templates found"
              description="Class and session templates will appear here. Fitness templates are managed under Fitness OS."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {classTemplates.map(template => (
            <TemplateRow
              key={template.id}
              template={template}
              blockCount={blockCountByTemplate.get(template.id) ?? 0}
              exerciseCount={exerciseCountByTemplate.get(template.id) ?? 0}
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
        Session and class templates used for program planning. Fitness training protocols are under Fitness OS.
      </p>
    </div>
  )
}

function TemplateRow({
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

  return (
    <Link href={`/director/fitness/templates/${template.id}`} className="block">
      <Card hover>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary text-sm">{template.name}</p>
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

            <div className="flex items-center gap-5 shrink-0">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Blocks</p>
                <p className="text-base font-mono font-bold text-lime">{blockCount}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Exercises</p>
                <p className="text-base font-mono font-bold text-lime">{exerciseCount}</p>
              </div>
              {template.total_duration_min != null && (
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="w-3.5 h-3.5" />
                  {template.total_duration_min}min
                </div>
              )}
              <span className={[
                'text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border',
                template.is_active
                  ? 'border-status-green/50 text-status-green'
                  : 'border-border text-text-muted',
              ].join(' ')}>
                {template.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
