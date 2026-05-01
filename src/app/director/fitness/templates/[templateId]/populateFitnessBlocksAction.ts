'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

// ─────────────────────────────────────────────────────────────
// Block type → exercise category mapping
// ─────────────────────────────────────────────────────────────

const BLOCK_TO_EXERCISE_CATEGORY: Record<string, string[]> = {
  warm_up:     ['warm_up'],
  technical:   ['technical'],
  tactical:    ['tactical'],
  movement:    ['movement'],
  fitness:     ['fitness'],
  competition: ['competition'],
  mental:      ['mental'],
  cool_down:   ['cool_down'],
  free:        ['technical', 'tactical', 'movement', 'fitness', 'competition', 'mental', 'warm_up', 'cool_down'],
}

// ─────────────────────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────────────────────

export interface BlockPopulationResult {
  blockId: string
  blockName: string
  blockType: string
  exercisesAdded: number
  skippedExisting: number
  durationBudgetMin: number
  durationUsedMin: number
}

export interface PopulateFitnessBlocksResult {
  ok: boolean
  error: string | null
  blocksProcessed: number
  totalExercisesAdded: number
  blockResults: BlockPopulationResult[]
}

// ─────────────────────────────────────────────────────────────
// Server action
// ─────────────────────────────────────────────────────────────

export async function populateFitnessTemplateBlocksAction(
  templateId: string,
): Promise<PopulateFitnessBlocksResult> {
  const fail = (error: string): PopulateFitnessBlocksResult =>
    ({ ok: false, error, blocksProcessed: 0, totalExercisesAdded: 0, blockResults: [] })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!templateId) return fail('Template ID required.')

  // 2. Resolve academy_id — never trust client input
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
    return fail('You do not have permission to populate fitness blocks.')
  }

  // 4. Verify template belongs to this academy
  const { data: template } = await supabase
    .from('templates')
    .select('id, name, academy_id')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return fail('Template not found or access denied.')

  // 5. Fetch template blocks
  const { data: blocks, error: blocksError } = await supabase
    .from('template_blocks')
    .select('id, name, type, duration_min, order_index')
    .eq('template_id', templateId)
    .order('order_index')

  if (blocksError) return fail(`Failed to load blocks: ${blocksError.message}`)
  const blockList = blocks ?? []
  if (blockList.length === 0) {
    return fail('This template has no blocks. Add blocks before populating exercises.')
  }

  const blockIds = blockList.map(b => b.id)

  // 6. Fetch existing template_block_exercises to avoid duplicates
  const rawDb = supabase as any
  const { data: existingExercises } = await rawDb
    .from('template_block_exercises')
    .select('block_id, exercise_id')
    .in('block_id', blockIds)

  // Map of block_id → Set of existing exercise_ids
  const existingByBlock = new Map<string, Set<string>>()
  for (const ex of (existingExercises ?? []) as Array<{ block_id: string; exercise_id: string }>) {
    if (!existingByBlock.has(ex.block_id)) existingByBlock.set(ex.block_id, new Set())
    existingByBlock.get(ex.block_id)!.add(ex.exercise_id)
  }

  // 7. Fetch all active exercises for this academy
  interface ExerciseRow {
    id: string
    name: string
    category: string
    duration_min: number | null
    min_duration_min: number | null
    max_duration_min: number | null
    subcategory: string | null
    tags: string[] | null
  }

  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select('id, name, category, duration_min, min_duration_min, max_duration_min, subcategory, tags')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('name')

  if (exError) return fail(`Failed to load exercise library: ${exError.message}`)
  const exerciseList = (exercises ?? []) as ExerciseRow[]

  // Index exercises by category for fast lookup
  const exercisesByCategory = new Map<string, ExerciseRow[]>()
  for (const ex of exerciseList) {
    const arr = exercisesByCategory.get(ex.category) ?? []
    arr.push(ex)
    exercisesByCategory.set(ex.category, arr)
  }

  // 8. For each block, select and insert matching exercises
  const blockResults: BlockPopulationResult[] = []
  let totalExercisesAdded = 0

  for (const block of blockList) {
    const categories = BLOCK_TO_EXERCISE_CATEGORY[block.type] ?? []
    if (categories.length === 0) continue

    const existingForBlock = existingByBlock.get(block.id) ?? new Set()
    const skippedExisting = existingForBlock.size

    // Collect candidates from all matching categories
    const candidates: ExerciseRow[] = []
    for (const cat of categories) {
      const catExercises = exercisesByCategory.get(cat) ?? []
      candidates.push(...catExercises)
    }

    // Exclude already-assigned exercises
    const fresh = candidates.filter(ex => !existingForBlock.has(ex.id))
    if (fresh.length === 0) {
      blockResults.push({
        blockId: block.id,
        blockName: block.name,
        blockType: block.type,
        exercisesAdded: 0,
        skippedExisting,
        durationBudgetMin: block.duration_min,
        durationUsedMin: 0,
      })
      continue
    }

    // Deterministic selection: fill up to block duration_min budget
    // Use exercise.duration_min (typical); default to 5 min if unknown
    const DEFAULT_EXERCISE_DURATION = 5
    let budgetRemaining = block.duration_min
    const toInsert: Array<{ exercise: ExerciseRow; duration: number }> = []

    for (const ex of fresh) {
      const exDuration = ex.duration_min ?? DEFAULT_EXERCISE_DURATION
      if (exDuration > budgetRemaining) continue
      toInsert.push({ exercise: ex, duration: exDuration })
      budgetRemaining -= exDuration
      if (budgetRemaining <= 0) break
    }

    if (toInsert.length === 0 && fresh.length > 0) {
      // If nothing fits within budget (all exercises are longer than remaining time),
      // add at least one exercise as a fallback — let director adjust duration
      const fallback = fresh[0]
      toInsert.push({ exercise: fallback, duration: fallback.duration_min ?? DEFAULT_EXERCISE_DURATION })
    }

    // Insert template_block_exercises
    let exercisesAdded = 0
    const currentMaxOrder: number = existingForBlock.size

    for (let i = 0; i < toInsert.length; i++) {
      const { exercise, duration } = toInsert[i]
      const { error: insertError } = await rawDb
        .from('template_block_exercises')
        .insert({
          block_id: block.id,
          exercise_id: exercise.id,
          order_index: currentMaxOrder + i,
          duration_min: duration,
        })
      if (!insertError) exercisesAdded++
    }

    const durationUsed = toInsert.reduce((sum, t) => sum + t.duration, 0)
    totalExercisesAdded += exercisesAdded

    blockResults.push({
      blockId: block.id,
      blockName: block.name,
      blockType: block.type,
      exercisesAdded,
      skippedExisting,
      durationBudgetMin: block.duration_min,
      durationUsedMin: durationUsed,
    })
  }

  return {
    ok: true,
    error: null,
    blocksProcessed: blockList.length,
    totalExercisesAdded,
    blockResults,
  }
}
