'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AcademyOperatingLensInput {
  /** Academy mission / primary goals from the DNA Shell. */
  mission: string[]
  /** Program model / development philosophy (e.g. 'competition-pathway', 'recreational'). */
  playerDevelopmentPhilosophy: string
  /** Selected coaching styles (e.g. 'player-led', 'structured-progression'). */
  coachingStyle: string[]
  /** Development priorities selected in the DNA Shell. */
  developmentPriorities: string[]
  /** Curriculum starting point (e.g. 'itf-pathway', 'custom'). */
  curriculumPreference: string
  /** Parent communication style preferences (e.g. 'outcome-focused', 'process-focused'). */
  parentCommunicationStyle: string[]
  /** Coach recap expectations — optional, captured if available. */
  coachRecapExpectations?: string
  /** DONNA communication style preference — optional, captured if available. */
  donnaCommunicationStyle?: string
  /** Player mission style preference (e.g. 'challenge-based', 'progress-focused'). */
  playerMissionStyle: string
  /** The setup mode selected at the start of onboarding (e.g. 'guided-setup'). */
  setupMode: string
}

export interface SaveAcademyOperatingLensResult {
  ok: boolean
  error: string | null
}

// ── Server action ─────────────────────────────────────────────────────────────

/**
 * Persist the Academy DNA / Operating Lens from the onboarding shell
 * into `academies.settings.academyOperatingLens`.
 *
 * Non-destructive: only the `academyOperatingLens` key is written.
 * All other existing settings keys (academy_dna, logo_url, etc.) are preserved.
 *
 * Auth: director role required. academyId resolved server-side from the
 * authenticated user's profile — never trusted from client input.
 */
export async function saveAcademyOperatingLensAction(
  input: AcademyOperatingLensInput,
): Promise<SaveAcademyOperatingLensResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

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

  // Sanitize — never write raw client strings into the database
  const arr = (v: unknown, max = 20): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string').map(s => s.trim().slice(0, 100)).slice(0, max)
      : []
  const str = (v: unknown, max = 200): string =>
    typeof v === 'string' ? v.trim().slice(0, max) : ''

  const lensPayload = {
    source: 'director_onboarding_shell',
    version: 1,
    savedAt: new Date().toISOString(),
    mission: arr(input.mission, 10),
    playerDevelopmentPhilosophy: str(input.playerDevelopmentPhilosophy),
    coachingStyle: arr(input.coachingStyle, 5),
    developmentPriorities: arr(input.developmentPriorities, 8),
    curriculumPreference: str(input.curriculumPreference),
    parentCommunicationStyle: arr(input.parentCommunicationStyle, 10),
    coachRecapExpectations: str(input.coachRecapExpectations),
    donnaCommunicationStyle: str(input.donnaCommunicationStyle),
    playerMissionStyle: str(input.playerMissionStyle),
    setupMode: str(input.setupMode),
  }

  const rawDb = supabase as any

  // Read existing settings — never overwrite the full object
  const { data: current } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const existing = (current?.settings as Record<string, unknown>) ?? {}

  // Non-destructive merge — write only academyOperatingLens key
  const merged = {
    ...existing,
    academyOperatingLens: lensPayload,
  }

  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save Academy Operating Lens' }

  return { ok: true, error: null }
}
