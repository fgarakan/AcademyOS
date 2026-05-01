'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

// ─────────────────────────────────────────────────────────────────────────────
// Block type → content types that can populate it
// Determines which curriculum_content_items content_type values are candidates
// for each block_type in template_blocks.
// ─────────────────────────────────────────────────────────────────────────────

const BLOCK_TO_CONTENT_TYPES: Record<string, string[]> = {
  warm_up:     ['warmup', 'drill', 'fitness'],
  technical:   ['drill', 'skill'],
  tactical:    ['drill', 'game', 'tactical'],
  movement:    ['drill', 'fitness', 'warmup'],
  fitness:     ['fitness', 'drill'],
  competition: ['game', 'competition', 'assessment'],
  mental:      ['game', 'drill'],
  cool_down:   ['cooldown', 'drill'],
  free:        ['drill', 'game', 'skill', 'assessment', 'warmup', 'cooldown', 'fitness', 'tactical', 'competition'],
}

// ─────────────────────────────────────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────────────────────────────────────

export interface BlockCurriculumResult {
  blockId: string
  blockName: string
  blockType: string
  itemsFound: number
  notesWritten: boolean
  skippedReason: string | null
}

export interface PopulateCurriculumBlocksResult {
  ok: boolean
  error: string | null
  levelName: string | null
  blocksProcessed: number
  blocksUpdated: number
  blockResults: BlockCurriculumResult[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build structured notes text from a set of content items
// Written into template_blocks.notes so curriculum context flows into sessions.
// ─────────────────────────────────────────────────────────────────────────────

interface ContentItem {
  title: string
  content_type: string
  duration_min: number | null
  duration_max: number | null
  success_criteria: string[] | null
  coach_cues: string[] | null
  progressions: string[] | null
  regressions: string[] | null
}

function buildCurriculumNotes(levelName: string, items: ContentItem[]): string {
  const lines: string[] = [`[Curriculum: ${levelName}]`]

  const drillsAndSkills = items.filter(i =>
    ['drill', 'skill', 'warmup', 'cooldown', 'fitness', 'tactical'].includes(i.content_type)
  )
  const games = items.filter(i => ['game', 'competition'].includes(i.content_type))
  const assessments = items.filter(i => i.content_type === 'assessment')

  if (drillsAndSkills.length > 0) {
    lines.push('')
    lines.push('DRILLS / SKILLS:')
    for (const item of drillsAndSkills.slice(0, 3)) {
      const dur = item.duration_min != null ? ` (${item.duration_min}${item.duration_max ? '–' + item.duration_max : ''} min)` : ''
      lines.push(`• ${item.title}${dur}`)
    }
  }

  if (games.length > 0) {
    lines.push('')
    lines.push('GAMES:')
    for (const item of games.slice(0, 2)) {
      const dur = item.duration_min != null ? ` (${item.duration_min}${item.duration_max ? '–' + item.duration_max : ''} min)` : ''
      lines.push(`• ${item.title}${dur}`)
    }
  }

  if (assessments.length > 0) {
    lines.push('')
    lines.push('ASSESSMENT MOMENTS:')
    for (const item of assessments.slice(0, 2)) {
      lines.push(`• ${item.title}`)
    }
  }

  // Collect unique cues from all items (up to 4)
  const allCues = items
    .flatMap(i => i.coach_cues ?? [])
    .filter(Boolean)
    .slice(0, 4)
  if (allCues.length > 0) {
    lines.push('')
    lines.push('KEY CUES:')
    for (const cue of allCues) {
      lines.push(`• ${cue}`)
    }
  }

  // Collect unique success criteria (up to 3)
  const allCriteria = items
    .flatMap(i => i.success_criteria ?? [])
    .filter(Boolean)
    .slice(0, 3)
  if (allCriteria.length > 0) {
    lines.push('')
    lines.push('SUCCESS LOOKS LIKE:')
    for (const c of allCriteria) {
      lines.push(`• ${c}`)
    }
  }

  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// Server action: populate template blocks with curriculum content notes
//
// Behaviour:
// - Requires the template to have curriculum_level_id set (Sprint 57 sets this)
// - For each block without existing notes, finds matching content items for
//   the level and block type, writes structured notes into template_blocks.notes
// - Blocks with existing notes are skipped (no overwrite)
// - Returns per-block results so the UI can show what was populated
// ─────────────────────────────────────────────────────────────────────────────

export async function populateTemplateBlocksFromCurriculumAction(
  templateId: string,
): Promise<PopulateCurriculumBlocksResult> {
  const fail = (error: string): PopulateCurriculumBlocksResult =>
    ({ ok: false, error, levelName: null, blocksProcessed: 0, blocksUpdated: 0, blockResults: [] })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!templateId) return fail('Template ID required.')

  // 2. Resolve academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  // 3. Verify role — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail('You do not have permission to populate curriculum blocks.')
  }

  // 4. Verify template + fetch curriculum_level_id (new column, must use rawDb)
  const { data: templateRow } = await rawDb
    .from('templates')
    .select('id, name, academy_id, curriculum_level_id')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!templateRow) return fail('Template not found or access denied.')

  const curriculumLevelId: string | null = templateRow.curriculum_level_id ?? null
  if (!curriculumLevelId) {
    return fail('This template has no curriculum level set. Select a curriculum level first using the Curriculum Focus selector.')
  }

  // 5. Fetch the curriculum level name for display
  const { data: levelRow } = await rawDb
    .from('curriculum_levels')
    .select('display_name')
    .eq('id', curriculumLevelId)
    .single()
  const levelName: string = levelRow?.display_name ?? 'Unknown Level'

  // 6. Fetch template blocks
  const { data: blocks, error: blocksError } = await supabase
    .from('template_blocks')
    .select('id, name, type, duration_min, notes, order_index')
    .eq('template_id', templateId)
    .order('order_index')

  if (blocksError) return fail(`Failed to load blocks: ${blocksError.message}`)
  const blockList = blocks ?? []
  if (blockList.length === 0) {
    return fail('This template has no blocks. Add blocks before populating from curriculum.')
  }

  // 7. Fetch curriculum content items for this level (global defaults + academy-specific)
  const { data: contentItems, error: contentError } = await rawDb
    .from('curriculum_content_items')
    .select('id, content_type, title, duration_min, duration_max, success_criteria, coach_cues, progressions, regressions')
    .eq('level_id', curriculumLevelId)
    .eq('is_active', true)
    .or(`academy_id.is.null,academy_id.eq.${academyId}`)
    .order('content_type')

  if (contentError) return fail(`Failed to load curriculum content: ${contentError.message}`)
  const allContent: ContentItem[] = (contentItems ?? []) as ContentItem[]

  // Index content by content_type for fast lookup
  const contentByType = new Map<string, ContentItem[]>()
  for (const item of allContent) {
    const arr = contentByType.get(item.content_type) ?? []
    arr.push(item)
    contentByType.set(item.content_type, arr)
  }

  // 8. Process each block
  const blockResults: BlockCurriculumResult[] = []
  let blocksUpdated = 0

  for (const block of blockList) {
    // Skip blocks that already have notes (no overwrite policy)
    if (block.notes && block.notes.trim().length > 0) {
      blockResults.push({
        blockId: block.id,
        blockName: block.name,
        blockType: block.type,
        itemsFound: 0,
        notesWritten: false,
        skippedReason: 'Block already has notes — skipped to preserve existing content.',
      })
      continue
    }

    const contentTypes = BLOCK_TO_CONTENT_TYPES[block.type] ?? []
    if (contentTypes.length === 0) {
      blockResults.push({
        blockId: block.id,
        blockName: block.name,
        blockType: block.type,
        itemsFound: 0,
        notesWritten: false,
        skippedReason: `Unknown block type "${block.type}" — no content type mapping.`,
      })
      continue
    }

    // Collect matching content items (ordered by priority of content type)
    const matchingItems: ContentItem[] = []
    for (const ct of contentTypes) {
      const items = contentByType.get(ct) ?? []
      matchingItems.push(...items)
    }

    if (matchingItems.length === 0) {
      blockResults.push({
        blockId: block.id,
        blockName: block.name,
        blockType: block.type,
        itemsFound: 0,
        notesWritten: false,
        skippedReason: `No curriculum content found for level "${levelName}" and block type "${block.type}".`,
      })
      continue
    }

    // Build structured notes and write to the block
    const notes = buildCurriculumNotes(levelName, matchingItems)

    const { error: updateError } = await supabase
      .from('template_blocks')
      .update({ notes })
      .eq('id', block.id)
      .eq('template_id', templateId)

    if (updateError) {
      blockResults.push({
        blockId: block.id,
        blockName: block.name,
        blockType: block.type,
        itemsFound: matchingItems.length,
        notesWritten: false,
        skippedReason: `Failed to write notes: ${updateError.message}`,
      })
      continue
    }

    blocksUpdated++
    blockResults.push({
      blockId: block.id,
      blockName: block.name,
      blockType: block.type,
      itemsFound: matchingItems.length,
      notesWritten: true,
      skippedReason: null,
    })
  }

  revalidatePath(`/director/fitness/templates/${templateId}`)

  return {
    ok: true,
    error: null,
    levelName,
    blocksProcessed: blockList.length,
    blocksUpdated,
    blockResults,
  }
}
