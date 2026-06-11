'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import {
  inferAcademyModel,
  computePathwayWeights,
  buildOnboardingStatements,
  COACHING_STYLE_BY_MODEL,
  DEFAULTS_BY_MODEL,
  PORTAL_RULES_BY_TRANSPARENCY,
  ADVANCEMENT_APPROVAL_GATE,
  type PlayerMix,
  type FamilyPriorities,
  type AgeGroup,
  type CurriculumStartingPoint,
  type PriorityEdge,
  type SessionDuration,
  type AdvancementApproval,
  type ParentTransparency,
  type StagePriorityState,
  type SetupContext,
  type DirectorChallenge,
} from '@/lib/donna/onboarding/donnaOnboardingContextPack'

// ── Input type ────────────────────────────────────────────────────────────────

export interface OnboardingV2Input {
  // Phase 1
  introText?:           string
  setupContext:         SetupContext
  academyName:          string
  playerMix:            PlayerMix
  familyPriorities:     FamilyPriorities
  ageGroups:            AgeGroup[]

  // Phase 2
  curriculumStartingPoint:  CurriculumStartingPoint
  stagePriorities:          Record<string, StagePriorityState>
  sessionDurationMinutes:   SessionDuration
  advancementApproval:      AdvancementApproval

  // Phase 3
  parentTransparency:  ParentTransparency
  groups:              { name: string; track: string }[]
  coachesInvited:      boolean
  directorChallenge:   DirectorChallenge

  // Phase 4
  priorityEdge:        PriorityEdge
}

export interface SaveOnboardingResult {
  ok:    boolean
  error: string | null
}

// ── Server action ─────────────────────────────────────────────────────────────

export async function saveAcademyOnboarding(
  input: OnboardingV2Input,
): Promise<SaveOnboardingResult> {
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
    return { ok: false, error: 'Only academy directors can complete onboarding' }
  }

  // ── Compute derived values ────────────────────────────────────────────────

  const inferredModel = inferAcademyModel(
    input.playerMix,
    input.familyPriorities,
    input.ageGroups,
  )

  const coachingStyle = COACHING_STYLE_BY_MODEL[inferredModel]
  const pathwayWeights = computePathwayWeights(input.stagePriorities)
  const portalRules = PORTAL_RULES_BY_TRANSPARENCY[input.parentTransparency]
  const defaults = {
    ...DEFAULTS_BY_MODEL[inferredModel],
    level_gate_strictness: ADVANCEMENT_APPROVAL_GATE[input.advancementApproval],
  }

  // ── Build conversational memory ───────────────────────────────────────────

  const statements = buildOnboardingStatements({
    introText:              input.introText,
    setupContext:           input.setupContext,
    academyName:            input.academyName,
    playerMix:              input.playerMix,
    familyPriorities:       input.familyPriorities,
    ageGroups:              input.ageGroups,
    curriculumStartingPoint: input.curriculumStartingPoint,
    stagePriorities:        input.stagePriorities,
    priorityEdge:           input.priorityEdge,
    sessionDurationMinutes: input.sessionDurationMinutes,
    advancementApproval:    input.advancementApproval,
    parentTransparency:     input.parentTransparency,
    directorChallenge:      input.directorChallenge,
  })

  const onboardingCompletedAt = new Date().toISOString()

  // ── Build academy_dna ─────────────────────────────────────────────────────

  // Sanitise stage_priorities for storage — strip confirmed/manuallyAdjusted booleans to keep payload clean
  const sanitisedStagePriorities: Record<string, {
    ranking: string[]
    weights: Record<string, number>
    weights_manually_adjusted: boolean
    confirmed_by_director: boolean
  }> = {}
  for (const [stage, state] of Object.entries(input.stagePriorities)) {
    sanitisedStagePriorities[stage] = {
      ranking:                   state.ranking,
      weights:                   state.weights,
      weights_manually_adjusted: state.manuallyAdjusted,
      confirmed_by_director:     state.confirmed,
    }
  }

  const academyDna = {
    onboarding_version: 'v2' as const,

    // Phase 1 — director answers
    intro_text:         input.introText?.trim().slice(0, 2000),
    setup_context:      input.setupContext,
    academy_name:       input.academyName.trim().slice(0, 200),
    player_mix:         input.playerMix,
    family_priorities:  input.familyPriorities,
    age_groups:         input.ageGroups,

    // Phase 2 — director answers (active_levels derived from age_groups)
    active_levels:              input.ageGroups.filter(g => g !== 'adult'),
    curriculum_starting_point:  input.curriculumStartingPoint,
    stage_priorities:           sanitisedStagePriorities,
    session_duration_minutes:   input.sessionDurationMinutes,
    advancement_approval:       input.advancementApproval,

    // Phase 3 — director answers
    parent_transparency: input.parentTransparency,
    groups:              input.groups.map(g => ({
      name:  g.name.trim().slice(0, 100),
      track: g.track,
    })),
    coaches_invited:   input.coachesInvited,
    director_challenge: input.directorChallenge,

    // Phase 4 — director answers
    priority_edge: input.priorityEdge,

    // DONNA computed on save
    inferred_model:         inferredModel,
    inferred_coaching_style: coachingStyle.label,
    pathway_weights:        pathwayWeights,
    portal_rules: {
      parent: {
        domain_scores:         portalRules.domain_scores,
        competition_history:   portalRules.competition_history,
        donna_recommendations: portalRules.donna_recommendations,
        raw_coach_notes:       false, // always false — never exposed
        rankings:              portalRules.rankings,
      },
    },
    defaults,

    // Launch metadata
    classification_shown_at_launch: inferredModel,

    // Conversational memory — DONNA retrieves these to quote back in conversation
    onboarding_conversation: {
      version:    'v2' as const,
      saved_at:   onboardingCompletedAt,
      statements,
    },
  }

  // ── Read-then-merge-then-write (non-destructive) ───────────────────────────

  const rawDb = supabase as any

  const { data: current } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const existing = (current?.settings as Record<string, unknown>) ?? {}

  const merged = {
    ...existing,
    academy_dna: academyDna,
    onboarding: {
      onboarding_completed_at: onboardingCompletedAt,
      onboarding_version:      'v2',
    },
  }

  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save onboarding' }

  return { ok: true, error: null }
}
