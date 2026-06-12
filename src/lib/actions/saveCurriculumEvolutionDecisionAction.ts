'use server'

// DONNA Evolution Memory Persistence V1 — Mega Sprint 1931–1960
//
// Persists a director's decision about an Evolution recommendation to
// academies.settings.donna_curriculum_evolution_memory[].
//
// Same storage pattern as saveCurriculumDraftAction → donna_curriculum_memory[].
// No new table. No migration. No automatic curriculum mutation.
//
// Decision semantics:
//   approved  → director agreed with the recommendation (does NOT execute it)
//   dismissed → suppress unless material evidence change
//   deferred  → resurface after reviewDate (14-day default)
//   rejected  → suppress unless evidence strengthens significantly

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import {
  buildEvolutionMemoryEntry,
  type EvolutionDecision,
  type EvolutionMemoryEntry,
} from '@/lib/donna/curriculum/curriculumEvolutionMemory'
import type { EvidenceStrength, RecommendationType } from '@/lib/donna/curriculum/curriculumEvidenceStrength'

// ── Input / result types ──────────────────────────────────────────────────────

export interface SaveEvolutionDecisionInput {
  recommendationId:   string
  title:              string
  recommendationType: RecommendationType
  evidenceStrength:   EvidenceStrength
  decision:           EvolutionDecision
  levelId?:           string
  gateId?:            string
  evidence:           string[]
  confidence:         number
  /** Override defer window; defaults to 14 days when decision === 'deferred' */
  deferDays?:         number
}

export type SaveEvolutionDecisionResult =
  | { ok: true;  message: string }
  | { ok: false; error: string }

// ── Action ────────────────────────────────────────────────────────────────────

export async function saveCurriculumEvolutionDecisionAction(
  input: SaveEvolutionDecisionInput,
): Promise<SaveEvolutionDecisionResult> {
  try {
    await assertNotPreviewMode()
  } catch {
    return { ok: false, error: 'Writes are disabled in preview mode.' }
  }

  if (!input.recommendationId?.trim()) {
    return { ok: false, error: 'Recommendation ID is required.' }
  }

  const supabase = await getSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { ok: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
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
    return { ok: false, error: 'Only directors and head coaches can record evolution decisions.' }
  }

  const rawDb = supabase as any

  try {
    const { data: academy } = await rawDb
      .from('academies')
      .select('settings')
      .eq('id', academyId)
      .single()

    const settings = (academy?.settings as Record<string, unknown>) ?? {}
    const existing: EvolutionMemoryEntry[] = Array.isArray(settings.donna_curriculum_evolution_memory)
      ? (settings.donna_curriculum_evolution_memory as EvolutionMemoryEntry[])
      : []

    const entry = buildEvolutionMemoryEntry({
      recommendationId:   input.recommendationId,
      title:              input.title,
      recommendationType: input.recommendationType,
      evidenceStrength:   input.evidenceStrength,
      decision:           input.decision,
      levelId:            input.levelId,
      gateId:             input.gateId,
      evidence:           input.evidence,
      confidence:         input.confidence,
      deferDays:          input.deferDays ?? (input.decision === 'deferred' ? 14 : undefined),
    })

    // Deduplicate by recommendationId — only the latest decision is kept
    const withoutPrev = existing.filter(m => m.recommendationId !== input.recommendationId)
    // Cap at 100 entries (drop oldest by insertion order)
    const updated = [...withoutPrev, entry].slice(-100)

    const { error: writeError } = await rawDb
      .from('academies')
      .update({ settings: { ...settings, donna_curriculum_evolution_memory: updated } })
      .eq('id', academyId)

    if (writeError) {
      return { ok: false, error: `Failed to save decision: ${writeError.message}` }
    }

    return { ok: true, message: decisionConfirmation(input.decision) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: `Failed to save decision: ${msg}` }
  }
}

// ── Director-facing confirmation copy ─────────────────────────────────────────

function decisionConfirmation(decision: EvolutionDecision): string {
  switch (decision) {
    case 'approved':  return "Saved. I'll remember that you agreed with this."
    case 'dismissed': return "Dismissed. I won't surface this again unless evidence changes."
    case 'deferred':  return "I'll remind you in 14 days."
    case 'rejected':  return "Rejected. I'll only resurface this if evidence strengthens significantly."
  }
}
