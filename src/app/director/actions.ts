'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

// ── Input type ──────────────────────────────────────────────────
// Only Academy DNA fields — no templates, no players, no coaches,
// no curriculum objects, no parent contact data.
export interface AcademyDnaInput {
  academyName: string
  academyModel: string
  locationCount: number
  ageGroups: string[]
  coachingStyles: string[]
  primaryCommunication: string
  secondaryCommunication: string
  sessionBlocks: string[]
  developmentPriorities: string[]
  parentStyles: string[]
  // Individual visibility rules — typed explicitly to prevent generic Record injection
  hideRawCoachNotes: boolean
  hideInternalDirectorNotes: boolean
  hideRankings: boolean
  hideComparisons: boolean
  hideUnapprovedAI: boolean
}

export interface SaveAcademyDnaResult {
  ok: boolean
  error: string | null
}

// ── Action ──────────────────────────────────────────────────────

export async function saveAcademyDnaSettings(
  input: AcademyDnaInput,
): Promise<SaveAcademyDnaResult> {
  await assertNotPreviewMode()

  // 1. Auth
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  // 2. Resolve academy from authenticated profile — never trust client-supplied academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  // 3. Role check — director only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  if (membership?.role !== 'academy_director') {
    return { ok: false, error: 'Only academy directors can save Academy DNA settings' }
  }

  // 4. Sanitize — never write raw client strings into the database
  const str  = (v: unknown, max = 200) =>
    typeof v === 'string' ? v.trim().slice(0, max) : ''
  const arr  = (v: unknown, max = 20) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string').map(s => s.trim().slice(0, 100)).slice(0, max)
      : []
  const num  = (v: unknown, min = 0, max = 100) =>
    typeof v === 'number' && isFinite(v)
      ? Math.max(min, Math.min(max, Math.floor(v)))
      : 1
  const bool = (v: unknown) => v === true

  const dnaPayload = {
    source: 'director_onboarding',
    version: 1,
    completed_at: new Date().toISOString(),
    academy_basics: {
      academy_name:    str(input.academyName),
      academy_model:   str(input.academyModel),
      locations_count: num(input.locationCount, 1, 50),
      age_groups:      arr(input.ageGroups, 10),
    },
    coaching_philosophy: {
      coaching_styles: arr(input.coachingStyles, 3),
    },
    coach_communication: {
      primary_communication:   str(input.primaryCommunication),
      secondary_communication: str(input.secondaryCommunication),
    },
    session_design: {
      session_blocks: arr(input.sessionBlocks, 10),
    },
    player_development: {
      development_priorities: arr(input.developmentPriorities, 5),
    },
    parent_communication: {
      parent_styles: arr(input.parentStyles, 10),
      parent_visibility_rules: {
        hideRawCoachNotes:        bool(input.hideRawCoachNotes),
        hideInternalDirectorNotes: bool(input.hideInternalDirectorNotes),
        hideRankings:             bool(input.hideRankings),
        hideComparisons:          bool(input.hideComparisons),
        hideUnapprovedAI:         bool(input.hideUnapprovedAI),
      },
    },
    donna_behavior_rules: {
      draft_first:            true,
      parent_safe_only:       true,
      no_auto_sends:          true,
      no_auto_level_movement: true,
    },
  }

  const rawDb = supabase as any

  // 5. Read existing settings — never overwrite the full object
  const { data: current } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const existing = (current?.settings as Record<string, unknown>) ?? {}

  // 6. Merge under the academy_dna key only
  const merged = {
    ...existing,
    academy_dna:              dnaPayload,
    academy_dna_completed_at: new Date().toISOString(),
  }

  // 7. Update settings only — no other columns touched
  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save Academy DNA' }

  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: membership.role as UserRole,
    action: 'academy_dna_saved',
    targetType: 'academies',
    targetId: academyId,
    targetLabel: input.academyName,
    payload: {
      coaching_styles: dnaPayload.coaching_philosophy.coaching_styles,
      development_priorities: dnaPayload.player_development.development_priorities,
      parent_styles: dnaPayload.parent_communication.parent_styles,
    },
    sourceType: 'ui',
  })

  revalidatePath('/director')
  return { ok: true, error: null }
}
