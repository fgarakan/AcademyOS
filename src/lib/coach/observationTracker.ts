// Sprint 443 — Coach Observation Tracker V1
// Helpers for tracking and validating player observations in a session.
// Pure logic — no DB calls. Server-side only.

export interface PlayerObservation {
  playerId: string
  observationText: string
  dimension?: string | null
  sentimentHint?: 'positive' | 'neutral' | 'concern' | null
}

export interface ObservationValidation {
  valid: boolean
  errors: string[]
}

// Validate a single player observation.
export function validateObservation(obs: Partial<PlayerObservation>): ObservationValidation {
  const errors: string[] = []

  if (!obs.playerId?.trim()) errors.push('playerId is required.')
  if (!obs.observationText?.trim()) errors.push('observationText is required.')
  if (obs.observationText && obs.observationText.trim().length < 10) {
    errors.push('observationText must be at least 10 characters.')
  }
  if (obs.observationText && obs.observationText.trim().length > 2000) {
    errors.push('observationText must be under 2,000 characters.')
  }

  return { valid: errors.length === 0, errors }
}

// Validate a batch of observations and return only valid ones.
export function filterValidObservations(
  observations: Array<Partial<PlayerObservation>>,
): PlayerObservation[] {
  return observations
    .filter(obs => validateObservation(obs).valid)
    .map(obs => ({
      playerId: obs.playerId!,
      observationText: obs.observationText!,
      dimension: obs.dimension ?? null,
      sentimentHint: obs.sentimentHint ?? null,
    }))
}

// Returns true if the coach has observed a specific player.
export function hasObservationForPlayer(
  observations: PlayerObservation[],
  playerId: string,
): boolean {
  return observations.some(obs => obs.playerId === playerId)
}

// Returns a list of player IDs who are in the session but have no observation.
export function findUnobservedPlayers(
  sessionPlayerIds: string[],
  observations: PlayerObservation[],
): string[] {
  const observedIds = new Set(observations.map(obs => obs.playerId))
  return sessionPlayerIds.filter(id => !observedIds.has(id))
}

// Infer sentiment from observation text (lightweight heuristic — no AI call).
// This is a best-effort classification, not authoritative.
export function inferSentimentHint(
  text: string,
): 'positive' | 'neutral' | 'concern' {
  const lower = text.toLowerCase()

  const positiveKeywords = ['great', 'improved', 'excellent', 'breakthrough', 'strong', 'confident', 'consistent', 'good', 'progress', 'ready']
  const concernKeywords = ['struggling', 'missed', 'absent', 'concern', 'issue', 'difficult', 'below', 'inconsistent', 'needs work', 'flagging']

  const positiveScore = positiveKeywords.filter(kw => lower.includes(kw)).length
  const concernScore = concernKeywords.filter(kw => lower.includes(kw)).length

  if (concernScore > positiveScore) return 'concern'
  if (positiveScore > 0) return 'positive'
  return 'neutral'
}
