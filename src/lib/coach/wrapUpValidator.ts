// Sprint 442 — Session Wrap-Up Validator V1
// Validates a coach's wrap-up submission before creating a proposed_action.
// Pure validation — no DB calls. Server-side only.

export interface WrapUpInput {
  sessionId: string
  coachId: string
  academyId: string
  transcript?: string | null
  voiceNoteId?: string | null
  attendanceMarked: boolean
  playerObservations: Array<{
    playerId: string
    observationText: string
  }>
  sessionRating?: number | null
  energyLevel?: string | null
  coachNotes?: string | null
}

export interface WrapUpValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  qualityScore: number
}

// Validate a wrap-up submission. Returns validation result with quality score (0-100).
export function validateWrapUpInput(input: Partial<WrapUpInput>): WrapUpValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let qualityScore = 0

  // Required fields
  if (!input.sessionId) errors.push('sessionId is required.')
  if (!input.coachId) errors.push('coachId is required.')
  if (!input.academyId) errors.push('academyId is required.')

  if (errors.length > 0) {
    return { valid: false, errors, warnings, qualityScore: 0 }
  }

  // Quality scoring (cumulative, max 100)

  // Transcript or voice note (40 points)
  const hasTranscript = (input.transcript?.trim().length ?? 0) >= 30
  const hasVoiceNote = Boolean(input.voiceNoteId)
  if (hasTranscript || hasVoiceNote) {
    qualityScore += 40
  } else {
    warnings.push('Add a recap note or voice recording for best results.')
  }

  // Attendance (20 points)
  if (input.attendanceMarked) {
    qualityScore += 20
  } else {
    warnings.push('Mark attendance before submitting the wrap-up.')
  }

  // Player observations (30 points — partial credit)
  const observationCount = input.playerObservations?.length ?? 0
  if (observationCount >= 3) {
    qualityScore += 30
  } else if (observationCount >= 1) {
    qualityScore += 15
    warnings.push('Add observations for more players to improve the development record.')
  } else {
    warnings.push('Add at least one player observation.')
  }

  // Session rating (10 points)
  if (input.sessionRating != null) {
    qualityScore += 10
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    qualityScore,
  }
}

// Returns a user-facing message for the quality score.
export function wrapUpQualityMessage(qualityScore: number): string {
  if (qualityScore >= 80) return 'Great wrap-up — this will generate a high-quality development record.'
  if (qualityScore >= 50) return 'Good wrap-up — consider adding more detail for a richer record.'
  return 'Basic wrap-up — add a recap note and player observations for a more complete record.'
}
