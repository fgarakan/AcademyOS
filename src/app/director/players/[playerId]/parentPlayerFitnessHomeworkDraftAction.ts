'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { Json } from '@/lib/supabase/database.types'
import type { FitnessHomeworkRecommendationPayload } from './fitnessHomeworkRecommendationAction'

// ─────────────────────────────────────────────────────────────
// Safe language templates by gap category
// ─────────────────────────────────────────────────────────────

const CATEGORY_SAFE_DESCRIPTIONS: Record<string, { what: string; why: string }> = {
  mobility: {
    what: 'Gentle stretching and flexibility exercises',
    why: 'Helps keep muscles and joints healthy and reduces injury risk.',
  },
  balance: {
    what: 'Balance and stability exercises',
    why: 'Builds better body control on and off the court.',
  },
  agility: {
    what: 'Quick movement and direction-change exercises',
    why: 'Improves court coverage and reaction speed.',
  },
  sprint_mechanics: {
    what: 'Running form and acceleration drills',
    why: 'Helps move faster and more efficiently during matches.',
  },
  strength_basics: {
    what: 'Bodyweight strength exercises',
    why: 'Builds the physical foundation for safe, powerful tennis movement.',
  },
  coordination: {
    what: 'Hand-eye coordination and footwork exercises',
    why: 'Sharpens timing and movement patterns for better on-court feel.',
  },
  recovery: {
    what: 'Gentle recovery and relaxation exercises',
    why: 'Helps the body repair and stay ready for the next training session.',
  },
  readiness: {
    what: 'Light movement and recovery activities',
    why: 'Keeps the body active and fresh between sessions.',
  },
}

const DEFAULT_SAFE_DESCRIPTION = {
  what: 'General fitness and movement exercises',
  why: 'Supports overall athletic development.',
}

// ─────────────────────────────────────────────────────────────
// Payload shape
// ─────────────────────────────────────────────────────────────

export interface ParentPlayerFitnessHomeworkSummaryPayload {
  draft_type: 'parent_player_fitness_homework_summary_v1'
  source: 'internal_recommendation_conversion'
  source_proposed_action_id: string
  player_id: string
  generated_at: string
  focus_areas: Array<{
    category: string
    what_to_do: string
    why_it_helps: string
    how_often: string
    exercises: Array<{ name: string; description: string }>
  }>
  safety_note: string
  weekly_dosage: string
  encouragement: string
  warnings: string[]
}

// ─────────────────────────────────────────────────────────────
// Server action
// ─────────────────────────────────────────────────────────────

export interface ParentPlayerFitnessHomeworkDraftResult {
  ok: boolean
  error: string | null
  draftId: string | null
}

export async function createParentPlayerFitnessHomeworkDraftAction(
  playerId: string,
  sourceProposedActionId: string,
): Promise<ParentPlayerFitnessHomeworkDraftResult> {
  const fail = (error: string): ParentPlayerFitnessHomeworkDraftResult =>
    ({ ok: false, error, draftId: null })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!playerId || !sourceProposedActionId) return fail('Player ID and source draft ID required.')

  // 2. Resolve academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  // 3. Verify role — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail('You do not have permission to create parent/player fitness homework drafts.')
  }

  const rawDb = supabase as any

  // 4. Fetch the source internal recommendation draft — verify academy + module + status
  const { data: sourceAction } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, target_module, target_object_id, proposed_payload, voice_command_id, status')
    .eq('id', sourceProposedActionId)
    .single()

  if (!sourceAction) return fail('Source recommendation draft not found.')
  if (sourceAction.academy_id !== academyId) return fail('Access denied.')
  if (sourceAction.target_module !== 'fitness_homework_recommendation') {
    return fail('Source draft is not a fitness homework recommendation.')
  }
  if (sourceAction.target_object_id !== playerId) {
    return fail('Source draft does not match the specified player.')
  }
  if (sourceAction.status !== 'approved') {
    return fail('Only approved internal recommendation drafts can be converted to parent/player summaries.')
  }

  // 5. Parse source payload
  const sourcePayload = sourceAction.proposed_payload as FitnessHomeworkRecommendationPayload
  if (sourcePayload?.draft_type !== 'fitness_homework_recommendation_v1') {
    return fail('Unsupported source draft type.')
  }

  // 6. Build parent/player-safe content — simple, encouraging, non-medical, non-shaming
  const focusAreas = sourcePayload.recommended_focus_categories.slice(0, 3).map(cat => {
    const safe = CATEGORY_SAFE_DESCRIPTIONS[cat] ?? DEFAULT_SAFE_DESCRIPTION
    const intensity = sourcePayload.gap_assessment.recommendedIntensity

    const howOften = intensity === 'recovery_only'
      ? '2 times per week, gently'
      : intensity === 'reduced'
      ? '2–3 times per week'
      : '3 times per week'

    const exercises = (
      sourcePayload.suggested_exercises.find(s => s.category === cat)?.exercises ?? []
    ).map(ex => ({
      name: ex.name,
      description: ex.description,
    }))

    return {
      category: cat,
      what_to_do: safe.what,
      why_it_helps: safe.why,
      how_often: howOften,
      exercises,
    }
  })

  const safetyNote = [
    'Always listen to your body.',
    'Stop immediately if you feel pain or discomfort.',
    'Drink water before, during, and after exercise.',
    ...(sourcePayload.gap_assessment.recommendedIntensity === 'recovery_only'
      ? ['Focus on rest and gentle movement this week — no high-intensity exercise.']
      : []),
  ].join(' ')

  const encouragement = sourcePayload.gap_assessment.topGaps.length > 0
    ? `Great work in your sessions! Working on ${sourcePayload.gap_assessment.topGaps[0].replace('_', ' ')} at home will help you make even more progress.`
    : 'Keep up the great work in your sessions! Staying active between training days will help you improve faster.'

  const payload: ParentPlayerFitnessHomeworkSummaryPayload = {
    draft_type: 'parent_player_fitness_homework_summary_v1',
    source: 'internal_recommendation_conversion',
    source_proposed_action_id: sourceProposedActionId,
    player_id: playerId,
    generated_at: new Date().toISOString(),
    focus_areas: focusAreas,
    safety_note: safetyNote,
    weekly_dosage: sourcePayload.weekly_dosage,
    encouragement,
    warnings: [
      'Draft only. Not visible to player or parent until explicitly published by the director.',
      'No parent or player communication has been sent.',
      'This draft has not been medically reviewed — do not share with players who have active injury constraints without professional clearance.',
    ],
  }

  // 7. Create voice_commands record (required FK)
  const issuerRole: 'academy_director' | 'head_coach' =
    role === 'academy_director' ? 'academy_director' : 'head_coach'

  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole as any,
      input_method: 'typed',
      raw_input: `Convert fitness recommendation to parent/player summary for player ${playerId}`,
      transcript: `Convert fitness recommendation to parent/player summary for player ${playerId}`,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return fail(`Failed to create command record: ${vcError?.message ?? 'unknown'}`)
  }

  // 8. Create proposed_actions draft — pending_review, never auto-published
  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: 'Parent/Player Fitness Homework Summary Draft',
      target_module: 'parent_player_fitness_homework_summary',
      target_object_id: playerId,
      target_object_type: 'player',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Draft only. No parent or player communication sent.',
        'Not yet visible to player or parent.',
        'Requires explicit director approval and publication action before any sharing occurs.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return fail(`Failed to save draft: ${paError?.message ?? 'unknown'}`)
  }

  return { ok: true, error: null, draftId: proposedAction.id as string }
}
