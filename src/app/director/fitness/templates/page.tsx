import Link from 'next/link'
import { Clock, Dumbbell, Plus, Activity } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import type { Tables } from '@/lib/supabase/database.types'
import { PageExplainerCard } from '@/components/onboarding/PageExplainerCard'

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
  return 'Standard'
}

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

  const { data: allTemplates, error } = await supabase
    .from('templates')
    .select('*')
    .eq('academy_id', academyId)
    .order('name')

  if (error) {
    return (
      <div className="p-6 animate-fade-in space-y-6">
        <PageHeader />
        <p className="text-status-red text-sm">Failed to load templates: {error.message}</p>
      </div>
    )
  }

  // Only show fitness templates (track = fitness AND has fitness_template:true tag)
  const fitnessTemplates = (allTemplates ?? []).filter(t => {
    const tags = t.tags ?? []
    return tags.includes('fitness_template:true')
  })

  const blockCountByTemplate = new Map<string, number>()
  const exerciseCountByTemplate = new Map<string, number>()

  if (fitnessTemplates.length > 0) {
    const ids = fitnessTemplates.map(t => t.id)
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

      <PageExplainerCard
        title="Reusable physical training plans"
        body="Fitness templates are structured training blueprints — not today's completed workout, and not yet a player-specific recommendation. Each template defines the blocks coaches will run: warm-up, mobility, coordination, speed, strength, and recovery. They support the physical pathway alongside class templates."
        qa={[
          {
            q: 'What is a fitness template?',
            a: 'A named, reusable training structure with blocks. Think of it as the physical protocol blueprint your coaches follow on court.',
          },
          {
            q: 'What is it not?',
            a: "It's not a log of today's completed workout and not a player-specific plan. It's a reusable structure that coaches adapt per session.",
          },
          {
            q: 'What are the block categories?',
            a: 'Warm-up, Mobility, Coordination, Speed, Strength, Recovery, and Tennis-transfer.',
          },
          {
            q: 'What should I do first?',
            a: 'Create a template, add blocks for each training phase, then generate sessions from it.',
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Templates" value={fitnessTemplates.length} />
        <StatCard
          label="Active"
          value={fitnessTemplates.filter(t => t.is_active).length}
          accent
        />
        <StatCard
          label="Total Blocks"
          value={Array.from(blockCountByTemplate.values()).reduce((s, v) => s + v, 0)}
        />
      </div>

      {fitnessTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<Dumbbell className="w-5 h-5" />}
              title="No fitness templates yet"
              description="Create a fitness template to start building structured training protocols with movement, agility, speed, strength, coordination, and recovery blocks."
            />
            <div className="flex justify-center mt-6">
              <CreateTemplateButton />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">
              {fitnessTemplates.length} fitness template{fitnessTemplates.length !== 1 ? 's' : ''}
            </p>
            <CreateTemplateButton />
          </div>
          <div className="space-y-3">
            {fitnessTemplates.map(template => (
              <FitnessTemplateCard
                key={template.id}
                template={template}
                blockCount={blockCountByTemplate.get(template.id) ?? 0}
                exerciseCount={exerciseCountByTemplate.get(template.id) ?? 0}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="page-eyebrow">Physical Pathway</p>
        <h1 className="page-title">Fitness Templates</h1>
        <p className="page-subtitle">
          Reusable physical training blueprints that help coaches run structured, age-appropriate conditioning on court.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/director/class-templates"
          className="inline-flex items-center gap-1.5 btn-ghost text-xs px-3 py-2"
        >
          Class Templates
        </Link>
        <CreateTemplateButton />
      </div>
    </div>
  )
}


function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{label}</p>
      <p className={`text-2xl font-mono font-bold ${accent ? 'text-lime' : 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  )
}

function CreateTemplateButton() {
  return (
    <Link
      href="/director/fitness/templates/new"
      className="inline-flex items-center gap-1.5 btn-lime text-xs px-3 py-2"
    >
      <Plus className="w-3.5 h-3.5" />
      New Fitness Template
    </Link>
  )
}

function FitnessTemplateCard({
  template,
  blockCount,
  exerciseCount,
}: {
  template: Template
  blockCount: number
  exerciseCount: number
}) {
  const tags = template.tags ?? []
  const typeLabel = getTemplateTypeLabel(tags)

  return (
    <Link href={`/director/fitness/templates/${template.id}`} className="block group">
      <Card hover>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-text-primary text-sm truncate">{template.name}</p>
                <span className="shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-lime/20 text-lime/80">
                  {typeLabel}
                </span>
              </div>
              {template.description && (
                <p className="text-xs text-text-muted truncate">{template.description}</p>
              )}
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
              {template.total_duration_min != null && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-text-muted">
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
