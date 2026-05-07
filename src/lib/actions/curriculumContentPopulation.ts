'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import {
  getActiveAcademyCurriculumVersion,
  getAcademyOverridesForContext,
  extractOverrideFocusTags,
  buildOverrideSummaryLines,
} from '@/lib/curriculum/academyCurriculumResolution'

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

interface AcademyNotesContext {
  versionName: string | null
  overrideSummaryLines: string[]
  focusTags: string[]
}

function buildCurriculumNotes(
  levelName: string,
  items: ContentItem[],
  academyCtx?: AcademyNotesContext,
): string {
  const lines: string[] = [`[Curriculum: ${levelName}]`]

  if (academyCtx?.versionName) {
    lines.push(`[Academy Version: ${academyCtx.versionName}]`)
  }

  if (academyCtx?.focusTags && academyCtx.focusTags.length > 0) {
    lines.push(`[Override Focus: ${academyCtx.focusTags.join(', ')}]`)
  }

  if (academyCtx?.overrideSummaryLines && academyCtx.overrideSummaryLines.length > 0) {
    lines.push('')
    lines.push('ACADEMY CUSTOMIZATIONS:')
    for (const s of academyCtx.overrideSummaryLines) {
      lines.push(s)
    }
  }

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

  // 5a. Resolve academy curriculum version and applicable overrides (Sprint 74)
  const activeVersion = await getActiveAcademyCurriculumVersion(supabase, academyId)
  const applicableOverrides = await getAcademyOverridesForContext({
    supabase,
    academyId,
    curriculumVersionId: activeVersion?.id ?? null,
    levelId: curriculumLevelId,
  })
  const academyCtx: AcademyNotesContext = {
    versionName: activeVersion?.name ?? null,
    overrideSummaryLines: buildOverrideSummaryLines(applicableOverrides),
    focusTags: extractOverrideFocusTags(applicableOverrides),
  }

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

    // Bias content toward override focus tags when present (deterministic: focus-tagged items first)
    let orderedItems = matchingItems
    if (academyCtx.focusTags.length > 0) {
      const focusSet = new Set(academyCtx.focusTags.map(t => t.toLowerCase()))
      const withFocus = matchingItems.filter(item =>
        item.coach_cues?.some(c => focusSet.has(c.toLowerCase())) ||
        focusSet.has(item.title.toLowerCase())
      )
      const withoutFocus = matchingItems.filter(item => !withFocus.includes(item))
      orderedItems = [...withFocus, ...withoutFocus]
    }

    // Build structured notes and write to the block
    const notes = buildCurriculumNotes(levelName, orderedItems, academyCtx)

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

// ─────────────────────────────────────────────────────────────────────────────
// Block type → session_block mapping for curriculum_drills
// curriculum_drills.session_block uses display labels ('Warm-Up', 'Train', etc.)
// ─────────────────────────────────────────────────────────────────────────────

const BLOCK_TYPE_TO_SESSION_BLOCKS: Record<string, string[]> = {
  warm_up:     ['Warm-Up'],
  technical:   ['Focus', 'Train'],
  tactical:    ['Play'],
  movement:    ['Warm-Up', 'Train'],
  fitness:     ['Train'],
  competition: ['Game'],
  mental:      ['Play', 'Game'],
  cool_down:   [],
  free:        ['Warm-Up', 'Focus', 'Train', 'Play', 'Game'],
}

interface DrillRow {
  id: string
  name: string
  session_block: string
  objective: string
  coaching_cues: unknown
  success_criteria: string | null
  duration_minutes: number | null
  players_needed: number | null
  progression_easier: string | null
  progression_harder: string | null
}

function parseDrillCues(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return (raw as unknown[]).filter(c => typeof c === 'string').map(c => c as string).slice(0, 3)
  if (typeof raw === 'object' && raw !== null) {
    const known = ['setup', 'key_point', 'coaching_focus', 'cue_1', 'cue_2', 'cue_3']
    const vals: string[] = []
    for (const k of known) {
      const v = (raw as Record<string, unknown>)[k]
      if (typeof v === 'string' && v) vals.push(v)
    }
    return vals.slice(0, 3)
  }
  if (typeof raw === 'string' && raw) return [raw]
  return []
}

function buildDrillNotes(levelName: string, drills: DrillRow[]): string {
  const lines: string[] = [`[Curriculum Drills: ${levelName}]`, '', 'CURRICULUM DRILLS:']
  for (const d of drills.slice(0, 4)) {
    const meta: string[] = []
    if (d.duration_minutes != null) meta.push(`${d.duration_minutes} min`)
    if (d.players_needed != null) meta.push(`${d.players_needed} players`)
    lines.push(`• ${d.name}${meta.length > 0 ? ` (${meta.join(', ')})` : ''}`)
    if (d.objective) lines.push(`  Objective: ${d.objective}`)
    const cues = parseDrillCues(d.coaching_cues)
    if (cues.length > 0) lines.push(`  Cues: ${cues.join(' · ')}`)
    if (d.success_criteria) lines.push(`  Success: ${d.success_criteria}`)
    if (d.progression_easier) lines.push(`  Easier: ${d.progression_easier}`)
    if (d.progression_harder) lines.push(`  Harder: ${d.progression_harder}`)
  }
  lines.push('')
  lines.push('Reference only. Does not add formal exercise records.')
  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// Server action: populate template block notes with curriculum_drills content
//
// Behaviour identical to populateTemplateBlocksFromCurriculumAction:
// - Skips blocks that already have notes (no overwrite)
// - Uses session_block → block type mapping for drill matching
// - Writes reference text into template_blocks.notes only
// - Does not add to template_block_exercises
// ─────────────────────────────────────────────────────────────────────────────

export async function populateCurriculumDrillNotesAction(
  templateId: string,
): Promise<PopulateCurriculumBlocksResult> {
  const fail = (error: string): PopulateCurriculumBlocksResult =>
    ({ ok: false, error, levelName: null, blocksProcessed: 0, blocksUpdated: 0, blockResults: [] })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!templateId) return fail('Template ID required.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail('You do not have permission to populate curriculum block notes.')
  }

  const { data: templateRow } = await rawDb
    .from('templates')
    .select('id, name, academy_id, curriculum_level_id')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!templateRow) return fail('Template not found or access denied.')

  const curriculumLevelId: string | null = templateRow.curriculum_level_id ?? null
  if (!curriculumLevelId) {
    return fail('This template has no curriculum level set. Select a curriculum level first.')
  }

  const { data: levelRow } = await rawDb
    .from('curriculum_levels')
    .select('display_name')
    .eq('id', curriculumLevelId)
    .single()
  const levelName: string = levelRow?.display_name ?? 'Unknown Level'

  const { data: drillData, error: drillError } = await rawDb
    .from('curriculum_drills')
    .select('id, name, session_block, objective, coaching_cues, success_criteria, duration_minutes, players_needed, progression_easier, progression_harder')
    .eq('level_min_id', curriculumLevelId)
    .eq('is_active', true)
    .or(`academy_id.is.null,academy_id.eq.${academyId}`)
    .order('session_block', { ascending: true })
    .order('name', { ascending: true })
    .limit(100)

  if (drillError) return fail(`Failed to load curriculum drills: ${drillError.message}`)
  const allDrills: DrillRow[] = (drillData ?? []) as DrillRow[]

  // Index drills by session_block
  const drillsByBlock = new Map<string, DrillRow[]>()
  for (const d of allDrills) {
    const arr = drillsByBlock.get(d.session_block) ?? []
    arr.push(d)
    drillsByBlock.set(d.session_block, arr)
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('template_blocks')
    .select('id, name, type, duration_min, notes, order_index')
    .eq('template_id', templateId)
    .order('order_index')

  if (blocksError) return fail(`Failed to load blocks: ${blocksError.message}`)
  const blockList = blocks ?? []
  if (blockList.length === 0) {
    return fail('This template has no blocks. Add blocks before populating from curriculum drills.')
  }

  const blockResults: BlockCurriculumResult[] = []
  let blocksUpdated = 0

  for (const block of blockList) {
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

    const sessionBlocks = BLOCK_TYPE_TO_SESSION_BLOCKS[block.type] ?? []
    if (sessionBlocks.length === 0) {
      blockResults.push({
        blockId: block.id,
        blockName: block.name,
        blockType: block.type,
        itemsFound: 0,
        notesWritten: false,
        skippedReason: `No drill session_block mapping for block type "${block.type}".`,
      })
      continue
    }

    const matchingDrills: DrillRow[] = []
    for (const sb of sessionBlocks) {
      matchingDrills.push(...(drillsByBlock.get(sb) ?? []))
    }

    if (matchingDrills.length === 0) {
      blockResults.push({
        blockId: block.id,
        blockName: block.name,
        blockType: block.type,
        itemsFound: 0,
        notesWritten: false,
        skippedReason: `No curriculum drills found for level "${levelName}" matching block type "${block.type}".`,
      })
      continue
    }

    const notes = buildDrillNotes(levelName, matchingDrills)

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
        itemsFound: matchingDrills.length,
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
      itemsFound: matchingDrills.length,
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
