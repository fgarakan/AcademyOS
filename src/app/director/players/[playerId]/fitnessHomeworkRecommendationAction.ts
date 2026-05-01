'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { computeFitnessGaps } from '@/lib/fitness/gapLogic'
import type { GapInputs, FitnessGapAssessment } from '@/lib/fitness/gapLogic'
import type { Json } from '@/lib/supabase/database.types'

// ─────────────────────────────────────────────────────────────
// At-home exercise suggestions per gap category
// (No equipment or bodyweight only — safe for home context)
// ─────────────────────────────────────────────────────────────

const CATEGORY_EXERCISES: Record<string, Array<{ name: string; description: string; durationMin: number }>> = {
  mobility: [
    { name: 'Hip Flexor Stretch', description: 'Hold each side 30 seconds, repeat 3×.', durationMin: 3 },
    { name: 'Shoulder Rotation Circles', description: 'Arm circles forward and backward, 15 reps each direction.', durationMin: 2 },
    { name: 'Spinal Twist Stretch', description: 'Seated twist, hold 20 seconds each side.', durationMin: 3 },
  ],
  balance: [
    { name: 'Single-Leg Balance', description: 'Stand on one foot 30 seconds each side. Progress to eyes closed.', durationMin: 3 },
    { name: 'Tandem Walk', description: 'Heel-to-toe walk in a straight line, 10 meters × 3.', durationMin: 3 },
  ],
  agility: [
    { name: 'Lateral Shuffle', description: 'Quick shuffle side-to-side over 3 meters, 10 reps.', durationMin: 4 },
    { name: 'Star Jumps', description: 'Explosive jump touching 4 corners, 10 reps × 3.', durationMin: 4 },
  ],
  sprint_mechanics: [
    { name: 'High Knee March', description: 'Exaggerated marching focusing on knee lift, 20 meters × 4.', durationMin: 4 },
    { name: 'Arm Drive Drills', description: 'Stand and drive arms at sprint speed, 15 seconds × 4.', durationMin: 3 },
  ],
  strength_basics: [
    { name: 'Bodyweight Squats', description: '3 sets of 10 slow squats. Focus on full range and control.', durationMin: 5 },
    { name: 'Push-Up Progressions', description: 'Wall, incline, or floor push-ups — choose level. 3 × 8.', durationMin: 4 },
    { name: 'Glute Bridges', description: 'Lie on back, lift hips, hold 2 seconds. 3 × 12.', durationMin: 4 },
  ],
  coordination: [
    { name: 'Juggling with Racket', description: 'Tap a ball on the racket strings, goal: 20 consecutive taps.', durationMin: 5 },
    { name: 'Ladder Pattern (Shadow)', description: 'Mimic ladder footwork on any flat surface, 5 pattern × 4.', durationMin: 5 },
  ],
  recovery: [
    { name: 'Foam Roll / Self-Massage', description: 'Roll calves, quads, and back — 60 seconds per area.', durationMin: 5 },
    { name: 'Diaphragmatic Breathing', description: '5 min slow breathing: 4 in, 4 hold, 6 out.', durationMin: 5 },
  ],
  readiness: [
    { name: 'Gentle Walking', description: '10–15 min easy walk. No intensity.', durationMin: 12 },
    { name: 'Sleep and Hydration Check', description: 'Ensure 8+ hours sleep and 2L water today.', durationMin: 0 },
  ],
}

function buildExerciseSuggestions(
  topGaps: string[],
  intensity: 'normal' | 'reduced' | 'recovery_only',
): Array<{ category: string; exercises: typeof CATEGORY_EXERCISES[string] }> {
  const categories = intensity === 'recovery_only'
    ? ['recovery', 'readiness', 'mobility'].filter(c => topGaps.includes(c) || c === 'recovery')
    : topGaps.slice(0, 3)

  return categories.map(cat => ({
    category: cat,
    exercises: (CATEGORY_EXERCISES[cat] ?? []).slice(0, 2),
  }))
}

function dosageFromIntensity(intensity: 'normal' | 'reduced' | 'recovery_only'): string {
  if (intensity === 'recovery_only') return '2× per week, 15 min gentle session only'
  if (intensity === 'reduced') return '2–3× per week, 20 min sessions'
  return '3× per week, 20–25 min sessions'
}

// ─────────────────────────────────────────────────────────────
// Payload shape
// ─────────────────────────────────────────────────────────────

export interface FitnessHomeworkRecommendationPayload {
  draft_type: 'fitness_homework_recommendation_v1'
  source: 'director_generated_internal'
  player_id: string
  generated_at: string
  gap_assessment: FitnessGapAssessment
  recommended_focus_categories: string[]
  suggested_exercises: Array<{
    category: string
    exercises: Array<{ name: string; description: string; durationMin: number }>
  }>
  weekly_dosage: string
  safety_notes: string[]
  warnings: string[]
}

// ─────────────────────────────────────────────────────────────
// Server action
// ─────────────────────────────────────────────────────────────

export interface FitnessHomeworkRecommendationResult {
  ok: boolean
  error: string | null
  draftId: string | null
}

export async function createFitnessHomeworkRecommendationDraftAction(
  playerId: string,
): Promise<FitnessHomeworkRecommendationResult> {
  const fail = (error: string): FitnessHomeworkRecommendationResult =>
    ({ ok: false, error, draftId: null })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!playerId) return fail('Player ID required.')

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
    return fail('You do not have permission to generate fitness homework recommendations.')
  }

  // 4. Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id, date_of_birth')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  const rawDb = supabase as any

  // 5. Fetch most recent assessments (read dimensions for gap scoring)
  interface AssessmentRow { dimensions: unknown; created_at: string }
  const { data: assessments } = await rawDb
    .from('player_assessments')
    .select('dimensions, created_at')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(3)
  const assessmentRows: AssessmentRow[] = assessments ?? []

  // Extract dimension scores from most recent assessment
  interface DimEntry { name: string; score: number }
  const assessmentDimensions: DimEntry[] = []
  if (assessmentRows.length > 0) {
    const dims = assessmentRows[0].dimensions as Record<string, unknown> | null
    if (dims && typeof dims === 'object') {
      for (const [name, val] of Object.entries(dims)) {
        if (typeof val === 'number') {
          assessmentDimensions.push({ name, score: val })
        } else if (typeof val === 'object' && val !== null && typeof (val as Record<string, unknown>).score === 'number') {
          assessmentDimensions.push({ name, score: (val as Record<string, unknown>).score as number })
        }
      }
    }
  }

  // 6. Fetch session attendance for this player (all recorded)
  const { data: attendanceRows } = await rawDb
    .from('session_attendance')
    .select('session_id, status')
    .eq('player_id', playerId)
    .in('status', ['present', 'absent', 'late'])

  type AttRow = { session_id: string; status: string }
  const attendedSessionIds = new Set<string>()
  const absentSessionIds = new Set<string>()

  for (const a of (attendanceRows ?? []) as AttRow[]) {
    if (a.status === 'present' || a.status === 'late') attendedSessionIds.add(a.session_id)
    if (a.status === 'absent') absentSessionIds.add(a.session_id)
  }

  // 7. Fetch exercises from sessions the player attended (last 60 days)
  //    to compute completed exercise categories
  const completedExerciseCategories: string[] = []
  const missedExerciseCategories: string[] = []

  if (attendedSessionIds.size > 0) {
    const { data: completedBlocks } = await rawDb
      .from('session_blocks')
      .select('id, type, session_id')
      .in('session_id', Array.from(attendedSessionIds))

    for (const block of (completedBlocks ?? []) as Array<{ id: string; type: string; session_id: string }>) {
      if (!completedExerciseCategories.includes(block.type)) {
        completedExerciseCategories.push(block.type)
      }
    }
  }

  if (absentSessionIds.size > 0) {
    const { data: missedBlocks } = await rawDb
      .from('session_blocks')
      .select('id, type, session_id')
      .in('session_id', Array.from(absentSessionIds))

    for (const block of (missedBlocks ?? []) as Array<{ id: string; type: string; session_id: string }>) {
      if (!missedExerciseCategories.includes(block.type)) {
        missedExerciseCategories.push(block.type)
      }
    }
  }

  // 8. Fetch coach note tags (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: coachNotes } = await rawDb
    .from('coach_observations')
    .select('tags')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .gte('created_at', thirtyDaysAgo)
    .limit(20)

  const coachNoteTags: string[] = []
  for (const note of (coachNotes ?? []) as Array<{ tags: string[] | null }>) {
    for (const tag of (note.tags ?? [])) {
      if (!coachNoteTags.includes(tag)) coachNoteTags.push(tag)
    }
  }

  // 9. Check for active signals (overtraining / injury)
  const { data: activeSignals } = await rawDb
    .from('player_development_signals')
    .select('signal_type')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .eq('is_resolved', false)
    .in('signal_type', ['load_overload_detected', 'overtraining_risk'])
    .limit(5)
  const overtainingSignalActive = ((activeSignals ?? []) as Array<{ signal_type: string }>).length > 0

  // 10. Check for active injury constraints
  const { data: activeConstraints } = await rawDb
    .from('player_constraints')
    .select('constraint_type')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .eq('is_active', true)
    .in('constraint_type', ['injury', 'medical_hold'])
    .limit(3)
  const injuryConstraintActive = ((activeConstraints ?? []) as Array<{ constraint_type: string }>).length > 0

  // 11. Compute player age
  let playerAgeYears: number | null = null
  if (player.date_of_birth) {
    const dob = new Date(player.date_of_birth)
    const today = new Date()
    playerAgeYears = today.getFullYear() - dob.getFullYear()
  }

  // 12. Compute fitness gaps — pure function, no DB access
  const gapInputs: GapInputs = {
    assessmentDimensions,
    missedSessionCount: absentSessionIds.size,
    totalSessionCount: attendedSessionIds.size + absentSessionIds.size,
    missedExerciseCategories,
    completedExerciseCategories,
    coachNoteTags,
    overtainingSignalActive,
    injuryConstraintActive,
    playerAgeYears,
  }

  const gapAssessment: FitnessGapAssessment = computeFitnessGaps(gapInputs)

  // 13. Build recommendation payload
  const exerciseSuggestions = buildExerciseSuggestions(gapAssessment.topGaps, gapAssessment.recommendedIntensity)
  const weeklyDosage = dosageFromIntensity(gapAssessment.recommendedIntensity)

  const payload: FitnessHomeworkRecommendationPayload = {
    draft_type: 'fitness_homework_recommendation_v1',
    source: 'director_generated_internal',
    player_id: playerId,
    generated_at: new Date().toISOString(),
    gap_assessment: gapAssessment,
    recommended_focus_categories: gapAssessment.topGaps,
    suggested_exercises: exerciseSuggestions,
    weekly_dosage: weeklyDosage,
    safety_notes: gapAssessment.safetyFlags,
    warnings: [
      'Internal draft only. Not visible to player or parent until explicitly approved and published.',
      'This is a deterministic recommendation — no AI was used.',
      'Always apply professional judgment before sharing fitness advice with players.',
    ],
  }

  // 14. Create voice_commands record (required FK)
  const issuerRole: 'academy_director' | 'head_coach' =
    role === 'academy_director' ? 'academy_director' : 'head_coach'

  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole as any,
      input_method: 'typed',
      raw_input: `Generate fitness homework recommendation for player ${playerId}`,
      transcript: `Generate fitness homework recommendation for player ${playerId}`,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return fail(`Failed to create command record: ${vcError?.message ?? 'unknown'}`)
  }

  // 15. Create proposed_actions draft
  //     Internal only — never published to player/parent without director explicit action
  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Fitness Homework Recommendation Draft`,
      target_module: 'fitness_homework_recommendation',
      target_object_id: playerId,
      target_object_type: 'player',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Internal draft only. Not visible to player or parent.',
        'No player data was mutated.',
        'Recommendation uses deterministic gap logic — no AI API calls.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return fail(`Failed to save draft: ${paError?.message ?? 'unknown'}`)
  }

  // 16. Write audit log
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'fitness_homework_recommendation.draft.created',
      target_type: 'player',
      target_id: playerId,
      payload: {
        proposed_action_id: proposedAction.id,
        player_id: playerId,
        top_gaps: gapAssessment.topGaps,
        recommended_intensity: gapAssessment.recommendedIntensity,
        source: 'fitness_homework_recommendation_v1',
      },
      source_type: 'ui',
      voice_command_id: voiceCommand.id,
    })

  return { ok: true, error: null, draftId: proposedAction.id as string }
}
