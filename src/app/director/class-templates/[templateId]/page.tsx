import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { CurriculumLevelOption } from './ClassTemplateCurriculumSelector'
import type { AvailableContentItem } from './BlockContentPickerCard'
import type { PreviewBlock } from './TemplateSessionPreviewCard'
import type { CoachOption, GateOption } from './GenerateSessionFromTemplateButton'
import { ClassTemplateBuilderStepper } from './ClassTemplateBuilderStepper'
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
    is_coach_only: boolean | null
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

// Maps block_type enum values to tennis-session display names — display only.
// Does not mutate template_blocks.name in the database.
// typeIndex = how many blocks of this type have appeared before this one (for fitness block disambiguation).
function classTemplateBlockDisplayName(type: string, typeIndex: number): string {
  switch (type) {
    case 'warm_up':     return 'Welcome + Warm-Up'
    case 'movement':    return 'Welcome + Warm-Up'
    case 'technical':   return 'Skill Foundation'
    case 'tactical':    return 'Tactical Decisions'
    case 'competition': return 'Competitive Games'
    case 'mental':      return 'Mental Focus'
    case 'cool_down':   return 'Wrap-Up'
    case 'fitness':
      if (typeIndex === 0) return 'Skill Foundation'
      if (typeIndex === 1) return 'Rally Development'
      return ''
    default:            return ''
  }
}

export default async function ClassTemplateDetailPage({ params }: PageProps) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  let userDisplayName = 'You'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id, display_name')
      .eq('id', user.id)
      .single()
    academyId = profile?.academy_id ?? null
    userDisplayName = (profile as { academy_id: string | null; display_name: string | null } | null)?.display_name ?? 'You'
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  const rawDb = supabase as any

  // Fetch coaches active in this academy — for Generate Session coach selector
  const { data: memberRows } = await rawDb
    .from('academy_memberships')
    .select('profile_id, profiles(id, display_name)')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .in('role', ['coach', 'head_coach', 'academy_director'])

  const coaches: CoachOption[] = ((memberRows ?? []) as Array<{
    profile_id: string
    profiles: { id: string; display_name: string } | null
  }>)
    .filter(m => m.profiles)
    .map(m => ({ id: m.profiles!.id, display_name: m.profiles!.display_name }))

  // Count sessions already generated from this template — used to light up Step 4 in setup guide
  const { count: sessionCount } = await rawDb
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', params.templateId)
    .eq('academy_id', academyId)

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

  // Pre-compute tennis display names — display layer only, no DB writes.
  // Preserves underlying block.id for all mutations and server actions.
  const _blockTypeCount: Record<string, number> = {}
  const blockDisplayNames = new Map<string, string>()
  for (const block of blockList) {
    const t = block.type ?? ''
    const idx = _blockTypeCount[t] ?? 0
    _blockTypeCount[t] = idx + 1
    const mapped = classTemplateBlockDisplayName(t, idx)
    blockDisplayNames.set(block.id, mapped || block.name)
  }

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
          title, description, content_type, domain, session_block_hint, is_coach_only,
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

  // Fetch focus gates for this curriculum level — shown as optional coaching context when generating a session
  let focusGates: GateOption[] = []
  if (curriculumLevelId) {
    const { data: gateRows } = await rawDb
      .from('curriculum_gates')
      .select('id, domain, criterion, threshold')
      .eq('level_id', curriculumLevelId)
      .order('domain')
      .limit(20)
    focusGates = (gateRows ?? []).map((g: { id: string; domain: string; criterion: string; threshold: string | null }) => ({
      id: g.id,
      domain: g.domain ?? '',
      criterion: g.criterion ?? '',
      threshold: g.threshold ?? '',
    }))
  }

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

  // Build preview blocks for TemplateSessionPreviewCard
  const previewBlocks: PreviewBlock[] = blockList.map(block => ({
    id: block.id,
    name: blockDisplayNames.get(block.id) ?? block.name,
    blockType: block.type ?? '',
    durationMin: block.duration_min ?? null,
    orderIndex: block.order_index,
    curriculumItems: (curriculumByBlock.get(block.id) ?? []).map(row => ({
      title: row.content_item?.title ?? row.drill?.name ?? 'Untitled',
      contentType: row.content_item?.content_type ?? 'drill',
      domain: row.content_item?.domain ?? row.drill?.domain ?? null,
      sessionBlockHint: row.content_item?.session_block_hint ?? null,
      durationMin: row.duration_min ?? row.content_item?.duration_min ?? row.drill?.duration_min ?? null,
      isCoachOnly: row.content_item?.is_coach_only ?? false,
    })),
  }))

  // Counts
  let totalCurriculumItems = 0
  curriculumByBlock.forEach(arr => { totalCurriculumItems += arr.length })
  const hasCurriculumContent = totalCurriculumItems > 0

  // Convert Maps to Records for client component serialization
  const blockDisplayNamesRecord: Record<string, string> = {}
  blockDisplayNames.forEach((v, k) => { blockDisplayNamesRecord[k] = v })

  const curriculumByBlockRecord: Record<string, CurriculumBlockRow[]> = {}
  curriculumByBlock.forEach((v, k) => { curriculumByBlockRecord[k] = v })

  return (
    <div className="p-6 animate-fade-in space-y-6">
      {/* Page header — server-rendered, no state needed */}
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

      {/* Guided builder stepper */}
      <ClassTemplateBuilderStepper
        templateId={params.templateId}
        templateName={template.name}
        templateDescription={template.description ?? null}
        templateTrack={template.track ?? null}
        templateDurationMin={template.total_duration_min ?? null}
        templateIsActive={template.is_active}
        curriculumLevelId={curriculumLevelId}
        currentLevelName={currentLevelName}
        curriculumLevels={curriculumLevels}
        blockList={blockList}
        blockDisplayNames={blockDisplayNamesRecord}
        curriculumByBlock={curriculumByBlockRecord}
        availableContent={availableContent}
        previewBlocks={previewBlocks}
        focusGates={focusGates}
        coaches={coaches}
        sessionCount={sessionCount ?? 0}
        userId={user?.id ?? ''}
        userDisplayName={userDisplayName}
        hasCurriculumContent={hasCurriculumContent}
      />
    </div>
  )
}
