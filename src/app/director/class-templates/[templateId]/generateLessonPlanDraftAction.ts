'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import type { Enums } from '@/lib/supabase/database.types'

// Content types appropriate for a lesson plan draft (excludes coach-internal / supplementary items)
const LESSON_PLAN_CONTENT_TYPES = [
  'warmup', 'cooldown', 'drill', 'game', 'skill', 'tactical', 'fitness',
  'competition', 'assessment', 'tactical_game', 'situational',
  'match_play_theme', 'mental_skill', 'competition_behavior',
]

const MAX_ITEMS_PER_BLOCK = 3

// Maps block_type enum values → session_block_hint priority list
function hintsForBlockType(type: Enums<'block_type'>): string[] {
  switch (type) {
    case 'warm_up':     return ['Warm-Up']
    case 'cool_down':   return ['Cool-Down']
    case 'technical':   return ['Focus', 'Train']
    case 'tactical':    return ['Game', 'Play', 'Situational']
    case 'movement':    return ['Train', 'Focus']
    case 'fitness':     return ['Train', 'Focus']
    case 'competition': return ['Match-Play', 'Situational', 'Game']
    case 'mental':      return ['Mental']
    case 'free':        return ['Focus', 'Train', 'Game', 'Play']
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported types (consumed by LessonPlanDraftPanel and applyLessonPlanDraftAction)
// ─────────────────────────────────────────────────────────────────────────────

export interface DraftContentItem {
  contentItemId: string
  title: string
  contentType: string
  domain: string | null
  sessionBlockHint: string | null
  description: string | null
  durationMin: number | null
}

export interface DraftBlock {
  blockId: string
  blockName: string
  blockType: string
  orderIndex: number
  durationMin: number
  contentItems: DraftContentItem[]
}

export interface LessonPlanDraft {
  templateId: string
  levelId: string
  levelName: string
  blocks: DraftBlock[]
  totalItems: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Action
// ─────────────────────────────────────────────────────────────────────────────

export async function generateLessonPlanDraftAction(
  templateId: string,
): Promise<{ data?: LessonPlanDraft; error?: string }> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  const academyId = profile?.academy_id
  if (!academyId) return { error: 'Academy context unavailable' }

  const rawDb = supabase as any

  // Read template — curriculum_level_id is not in database.types.ts (migration 045 pending regen)
  const { data: template } = await rawDb
    .from('templates')
    .select('id, curriculum_level_id')
    .eq('id', templateId)
    .eq('academy_id', academyId)
    .single()
  if (!template) return { error: 'Template not found' }
  if (!template.curriculum_level_id) {
    return { error: 'No curriculum level assigned. Assign a curriculum level to this template first.' }
  }

  // Read curriculum level name (curriculum_levels IS in database.types.ts)
  const { data: level } = await supabase
    .from('curriculum_levels')
    .select('id, display_name')
    .eq('id', template.curriculum_level_id)
    .single()
  if (!level) return { error: 'Curriculum level not found' }

  // Read template blocks (template_blocks IS in database.types.ts)
  const { data: blocksData } = await supabase
    .from('template_blocks')
    .select('id, name, type, order_index, duration_min')
    .eq('template_id', templateId)
    .order('order_index')
  const blocks = blocksData ?? []
  if (blocks.length === 0) return { error: 'This template has no blocks' }

  // Read curriculum_content_items for this level
  // rawDb required — curriculum_content_items and its 061 columns (domain, session_block_hint)
  // are not present in database.types.ts (migrations 045 and 061 not regenerated yet)
  const { data: itemsData } = await rawDb
    .from('curriculum_content_items')
    .select('id, title, content_type, domain, session_block_hint, description, duration_min')
    .eq('level_id', template.curriculum_level_id)
    .eq('is_active', true)
    .in('content_type', LESSON_PLAN_CONTENT_TYPES)
    .or(`academy_id.is.null,academy_id.eq.${academyId}`)
    .order('content_type', { ascending: true })
    .order('title', { ascending: true })

  const items = (itemsData ?? []) as Array<{
    id: string
    title: string
    content_type: string
    domain: string | null
    session_block_hint: string | null
    description: string | null
    duration_min: number | null
  }>

  // Match content items to blocks, consuming each item at most once
  const usedIds = new Set<string>()
  const draftBlocks: DraftBlock[] = []

  for (const block of blocks) {
    const hints = hintsForBlockType(block.type as Enums<'block_type'>)

    // Primary: items whose session_block_hint is in this block's hint list
    const hintMatched = items
      .filter(item => !usedIds.has(item.id) && item.session_block_hint !== null && hints.includes(item.session_block_hint))
      .slice(0, MAX_ITEMS_PER_BLOCK)

    // Fallback: pick any unused item when no hint match exists
    const toUse = hintMatched.length > 0
      ? hintMatched
      : items.filter(item => !usedIds.has(item.id)).slice(0, 1)

    for (const item of toUse) usedIds.add(item.id)

    draftBlocks.push({
      blockId: block.id,
      blockName: block.name,
      blockType: block.type,
      orderIndex: block.order_index,
      durationMin: block.duration_min,
      contentItems: toUse.map(item => ({
        contentItemId: item.id,
        title: item.title,
        contentType: item.content_type,
        domain: item.domain,
        sessionBlockHint: item.session_block_hint,
        description: item.description,
        durationMin: item.duration_min,
      })),
    })
  }

  const totalItems = draftBlocks.reduce((sum, b) => sum + b.contentItems.length, 0)

  return {
    data: {
      templateId,
      levelId: level.id,
      levelName: level.display_name,
      blocks: draftBlocks,
      totalItems,
    },
  }
}
