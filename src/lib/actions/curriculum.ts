'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import {
  assignPlayerCurriculumState,
  evaluatePlayerCurriculumAdvancement,
} from '@/lib/backend/curriculum'

export async function assignCurriculumAction(
  playerId: string,
  academyId: string
): Promise<void> {
  const supabase = await getSupabaseServer()
  await assignPlayerCurriculumState(supabase, playerId, academyId)
  revalidatePath(`/director/players/${playerId}`)
}

export async function evaluateAdvancementAction(
  playerId: string,
  academyId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer()
  const result = await evaluatePlayerCurriculumAdvancement(supabase, playerId, academyId)
  revalidatePath(`/director/players/${playerId}`)
  return result
}
