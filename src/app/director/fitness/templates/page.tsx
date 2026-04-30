import Link from 'next/link'
import { Lock, Clock, Dumbbell } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import type { Tables } from '@/lib/supabase/database.types'

type Template = Tables<'templates'>

export default async function FitnessTemplatesPage() {
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

  const { data: templates, error: templatesError } = await supabase
    .from('templates')
    .select('*')
    .eq('academy_id', academyId)
    .order('name')

  if (templatesError) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader />
        <div className="flex items-center justify-center h-40">
          <p className="text-status-red text-sm">Failed to load templates: {templatesError.message}</p>
        </div>
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader />
        <Card>
          <EmptyState
            icon={<Dumbbell className="w-5 h-5" />}
            title="No templates found"
            description="No fitness templates have been imported for this academy yet."
          />
        </Card>
      </div>
    )
  }

  const templateIds = templates.map(t => t.id)

  const { data: blocks } = await supabase
    .from('template_blocks')
    .select('id, template_id')
    .in('template_id', templateIds)

  const blockIds = (blocks ?? []).map(b => b.id)

  const { data: blockExercises } = blockIds.length > 0
    ? await supabase
        .from('template_block_exercises')
        .select('block_id')
        .in('block_id', blockIds)
    : { data: [] }

  const blockCountByTemplate = new Map<string, number>()
  for (const block of blocks ?? []) {
    blockCountByTemplate.set(block.template_id, (blockCountByTemplate.get(block.template_id) ?? 0) + 1)
  }

  const blockToTemplate = new Map<string, string>()
  for (const block of blocks ?? []) {
    blockToTemplate.set(block.id, block.template_id)
  }

  const exerciseCountByTemplate = new Map<string, number>()
  for (const ex of blockExercises ?? []) {
    const templateId = blockToTemplate.get(ex.block_id)
    if (templateId) {
      exerciseCountByTemplate.set(templateId, (exerciseCountByTemplate.get(templateId) ?? 0) + 1)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader />
      <div className="space-y-3">
        {templates.map(template => (
          <TemplateRow
            key={template.id}
            template={template}
            blockCount={blockCountByTemplate.get(template.id) ?? 0}
            exerciseCount={exerciseCountByTemplate.get(template.id) ?? 0}
          />
        ))}
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Fitness Templates</h1>
        <p className="text-sm text-text-secondary mt-1">
          Imported program templates — read-only imported template viewer
        </p>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-xs text-text-muted">
        <Lock className="w-3 h-3" />
        Read-only
      </div>
    </div>
  )
}

interface TemplateRowProps {
  template: Template
  blockCount: number
  exerciseCount: number
}

function TemplateRow({ template, blockCount, exerciseCount }: TemplateRowProps) {
  const importBatchTag = template.tags?.find(t => t.startsWith('import_batch:'))
  const airtableIdTag = template.tags?.find(t => t.startsWith('airtable_id:'))

  return (
    <Link href={`/director/fitness/templates/${template.id}`} className="block">
      <Card hover>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary">{template.name}</p>
              <div className="flex flex-wrap gap-3 mt-1">
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
