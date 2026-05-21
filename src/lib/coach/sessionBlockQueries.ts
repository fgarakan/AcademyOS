// Sprint 441 — Session Block Data Layer V1
// Typed query helpers for session_blocks table.
// No select('*'). Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type BlockType = Database['public']['Enums']['block_type']

export interface SessionBlock {
  id: string
  sessionId: string
  name: string
  type: BlockType
  durationMin: number
  intensity: number | null
  orderIndex: number
  actualStatus: string
  notes: string | null
  isOverride: boolean
  templateBlockId: string | null
  updatedAt: string
}

// Fetch all blocks for a session, ordered by index.
export async function fetchSessionBlocks(
  db: SupabaseClient<Database>,
  sessionId: string,
): Promise<SessionBlock[]> {
  const { data, error } = await db
    .from('session_blocks')
    .select('id, session_id, name, type, duration_min, intensity, order_index, actual_status, notes, is_override, template_block_id, updated_at')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })

  if (error) return []
  return (data ?? []).map(b => ({
    id: b.id,
    sessionId: b.session_id,
    name: b.name,
    type: b.type,
    durationMin: b.duration_min,
    intensity: b.intensity,
    orderIndex: b.order_index,
    actualStatus: b.actual_status,
    notes: b.notes,
    isOverride: b.is_override,
    templateBlockId: b.template_block_id,
    updatedAt: b.updated_at,
  }))
}

// Compute total planned duration for a set of blocks.
export function computePlannedDuration(blocks: SessionBlock[]): number {
  return blocks.reduce((sum, b) => sum + b.durationMin, 0)
}

// Returns blocks that were not completed or skipped (gaps in execution).
export function findIncompleteBlocks(blocks: SessionBlock[]): SessionBlock[] {
  return blocks.filter(b => b.actualStatus !== 'completed' && b.actualStatus !== 'skipped')
}

// Returns a block execution summary for the recap.
export interface BlockExecutionSummary {
  totalBlocks: number
  completedBlocks: number
  skippedBlocks: number
  incompleteBlocks: number
  completionRate: number
  totalPlannedMinutes: number
}

export function computeBlockExecutionSummary(blocks: SessionBlock[]): BlockExecutionSummary {
  const completed = blocks.filter(b => b.actualStatus === 'completed').length
  const skipped = blocks.filter(b => b.actualStatus === 'skipped').length
  const total = blocks.length

  return {
    totalBlocks: total,
    completedBlocks: completed,
    skippedBlocks: skipped,
    incompleteBlocks: total - completed - skipped,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    totalPlannedMinutes: computePlannedDuration(blocks),
  }
}
