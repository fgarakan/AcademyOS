// Sprint 529 — Coach Wrap-Up Session Actual Draft V1
// Read-only loader: reads session block + exercise completion to produce a session actual draft.
// Used to pre-populate the wrap-up session plan step with what was actually completed.
// No writes. No migrations. RLS-scoped by academy_id.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionBlockActual {
  blockId: string
  blockName: string
  blockType: string
  durationMin: number
  orderIndex: number
  totalExercises: number
  completedExercises: number
  completionRate: number
  notes: string | null
}

export interface WrapUpSessionActualResult {
  sessionName: string
  blocks: SessionBlockActual[]
  totalBlocks: number
  fullyCompletedBlocks: number
  partiallyCompletedBlocks: number
  notStartedBlocks: number
  overallCompletionRate: number
  hasBlockData: boolean
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadWrapUpSessionActual(
  db: DB,
  sessionId: string,
  academyId: string,
): Promise<WrapUpSessionActualResult> {
  // 1 — session name
  const { data: session } = await db
    .from('sessions')
    .select('name')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()

  const sessionName = session?.name ?? 'Session'

  // 2 — session blocks ordered
  const { data: blockRows } = await db
    .from('session_blocks')
    .select('id, name, type, duration_min, order_index, notes')
    .eq('session_id', sessionId)
    .order('order_index')

  const blocks = blockRows ?? []

  if (blocks.length === 0) {
    return {
      sessionName,
      blocks: [],
      totalBlocks: 0,
      fullyCompletedBlocks: 0,
      partiallyCompletedBlocks: 0,
      notStartedBlocks: 0,
      overallCompletionRate: 0,
      hasBlockData: false,
    }
  }

  const blockIds = blocks.map(b => b.id)

  // 3 — exercise completion per block (session_block_exercises)
  const rawDb = db as unknown as SupabaseClient<Database>
  const { data: exerciseRows } = await (rawDb as any)
    .from('session_block_exercises')
    .select('block_id, completed')
    .in('block_id', blockIds)

  const exercisesByBlock = new Map<string, { total: number; completed: number }>()
  for (const row of exerciseRows ?? []) {
    const cur = exercisesByBlock.get(row.block_id) ?? { total: 0, completed: 0 }
    cur.total++
    if (row.completed) cur.completed++
    exercisesByBlock.set(row.block_id, cur)
  }

  // 4 — assemble block actuals
  const blockActuals: SessionBlockActual[] = blocks.map(b => {
    const ex = exercisesByBlock.get(b.id)
    const totalEx = ex?.total ?? 0
    const completedEx = ex?.completed ?? 0
    const completionRate = totalEx > 0 ? completedEx / totalEx : 0

    return {
      blockId: b.id,
      blockName: b.name,
      blockType: b.type,
      durationMin: b.duration_min,
      orderIndex: b.order_index,
      totalExercises: totalEx,
      completedExercises: completedEx,
      completionRate,
      notes: b.notes ?? null,
    }
  })

  const fullyCompleted = blockActuals.filter(b => b.completionRate === 1 || b.totalExercises === 0).length
  const partiallyCompleted = blockActuals.filter(b => b.completionRate > 0 && b.completionRate < 1).length
  const notStarted = blockActuals.filter(b => b.completionRate === 0 && b.totalExercises > 0).length

  const totalExAll = blockActuals.reduce((sum, b) => sum + b.totalExercises, 0)
  const completedExAll = blockActuals.reduce((sum, b) => sum + b.completedExercises, 0)
  const overallRate = totalExAll > 0 ? completedExAll / totalExAll : 0

  return {
    sessionName,
    blocks: blockActuals,
    totalBlocks: blocks.length,
    fullyCompletedBlocks: fullyCompleted,
    partiallyCompletedBlocks: partiallyCompleted,
    notStartedBlocks: notStarted,
    overallCompletionRate: overallRate,
    hasBlockData: true,
  }
}
