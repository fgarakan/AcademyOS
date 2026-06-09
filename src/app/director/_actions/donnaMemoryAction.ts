'use server'

// Mega Sprint 1595–1624 — DONNA Academy Memory Engine V1
// Server action: loads academy memory from proposed_actions and returns a formatted response.
// Rules:
//   - RLS-scoped: all queries include academy_id
//   - Director and head_coach roles only
//   - Read-only: no mutations
//   - No LLM: all calculations are deterministic
//   - Discloses data gaps — never invents memory

import { getSupabaseServer } from '@/lib/supabase/server'
import {
  loadAcademyMemory,
  formatMemoryResponse,
  extractEntityFilterFromQuestion,
} from '@/lib/donna/memory/donnaAcademyMemoryRetrieval'
import { detectMemoryIntent } from '@/lib/donna/memory/donnaMemoryIntentDetector'

// ── Result type ───────────────────────────────────────────────────────────────

export interface MemoryActionResult {
  ok: boolean
  formatted: string
  totalFound: number
  entityFilter: string | null
  confidence: string
  error?: string
}

// ── Server action ──────────────────────────────────────────────────────────────

export async function runDonnaMemoryAction(question: string): Promise<MemoryActionResult> {
  try {
    const supabase = await getSupabaseServer()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { ok: false, formatted: '', totalFound: 0, entityFilter: null, confidence: 'low', error: 'unauthorized' }
    }

    // Resolve academy_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id
    if (!academyId) {
      return { ok: false, formatted: '', totalFound: 0, entityFilter: null, confidence: 'low', error: 'no_academy' }
    }

    // Role check via academy_memberships
    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('academy_id', academyId)
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .single()

    const role = membership?.role as string | undefined
    if (role !== 'academy_director' && role !== 'head_coach') {
      return {
        ok: false,
        formatted: 'Academy memory is available to directors and head coaches only.',
        totalFound: 0,
        entityFilter: null,
        confidence: 'low',
        error: 'role_denied',
      }
    }

    // Detect intent and entity filter from the question
    const intent = detectMemoryIntent(question.toLowerCase())
    const entityFilter = extractEntityFilterFromQuestion(question)

    // Load memory
    const result = await loadAcademyMemory(supabase, academyId, {
      entityFilter,
      intent: intent?.intent ?? null,
    })

    const formatted = formatMemoryResponse(result, question)

    return {
      ok: true,
      formatted,
      totalFound: result.totalFound,
      entityFilter: result.entityFilter,
      confidence: result.confidence,
    }
  } catch (err) {
    return {
      ok: false,
      formatted: 'Memory retrieval failed — please try again.',
      totalFound: 0,
      entityFilter: null,
      confidence: 'low',
      error: err instanceof Error ? err.message : 'unknown',
    }
  }
}
