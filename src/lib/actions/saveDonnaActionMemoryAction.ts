'use server'

// DONNA Action Memory Persistence — Mega Sprint 1991–2020
// Persists a director's action decision to academies.settings.donna_action_memory[].
// Same storage pattern as donna_curriculum_evolution_memory[].
// No new table. No migration. No new intelligence.

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import {
  buildActionMemoryEntry,
  upsertActionMemoryEntry,
  type DonnaActionMemoryEntry,
} from '@/lib/donna/actions/donnaActionMemory'
import type { DonnaActionDraft, DonnaActionStatus } from '@/lib/donna/actions/donnaActionContract'

// ── Input / result ────────────────────────────────────────────────────────────

export interface SaveActionMemoryInput {
  draft:   DonnaActionDraft
  status:  DonnaActionStatus
  outcome?: string
}

export type SaveActionMemoryResult =
  | { ok: true;  message: string }
  | { ok: false; error: string }

// ── Action ────────────────────────────────────────────────────────────────────

export async function saveDonnaActionMemoryAction(
  input: SaveActionMemoryInput,
): Promise<SaveActionMemoryResult> {
  assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const rawDb = supabase as any

  const { data: profile } = await rawDb
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId: string = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director') {
    return { ok: false, error: 'Director role required.' }
  }

  const { data: academy } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const settings = (academy?.settings as Record<string, unknown>) ?? {}
  const existing: DonnaActionMemoryEntry[] = Array.isArray(settings.donna_action_memory)
    ? (settings.donna_action_memory as DonnaActionMemoryEntry[])
    : []

  const entry   = buildActionMemoryEntry(input.draft, input.status, input.outcome)
  const updated = upsertActionMemoryEntry(existing, entry, 200)

  const { error } = await rawDb
    .from('academies')
    .update({ settings: { ...settings, donna_action_memory: updated } })
    .eq('id', academyId)

  if (error) return { ok: false, error: 'Failed to save action memory.' }

  const statusLabel: Record<DonnaActionStatus, string> = {
    draft:       'Draft saved.',
    pending:     'Queued for review.',
    in_progress: 'Action in progress.',
    completed:   'Action completed.',
    dismissed:   'Dismissed.',
    expired:     'Expired.',
  }

  return { ok: true, message: statusLabel[input.status] ?? 'Saved.' }
}
