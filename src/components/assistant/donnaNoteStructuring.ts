// Donna Note Structuring — Sprint 272
// Pure deterministic text classifier. No AI, no API, no DB, no async.
// Classifies observation text into categories, suggests tags, and determines
// visibility and director-review flags based on keyword matching.
// All notes default to internal_only — parent/player visibility requires explicit director approval.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DonnaNoteCategory =
  | 'technical'
  | 'tactical'
  | 'mental'
  | 'physical'
  | 'attendance'
  | 'behavior'
  | 'readiness'
  | 'parent_follow_up_candidate'
  | 'general'

/** All Donna-captured notes default to internal_only. Parent/player visibility requires explicit approval. */
export type DonnaNoteVisibility = 'internal_only' | 'director_only' | 'staff_only'

export type DonnaNoteConfidence = 'low' | 'medium' | 'high'

export interface DonnaStructuredNote {
  category: DonnaNoteCategory
  visibility: DonnaNoteVisibility
  /** Truncated plain-text summary from the observation — no inference. */
  summary: string
  /** Tags suitable for voice_notes.tags — category, source, and review flags. */
  suggestedTags: string[]
  /**
   * True only if the observation is clearly positive and contains no sensitive terms.
   * A parent-safe candidate is NOT parent-visible until a director explicitly approves it.
   * This flag is a hint for future review flows only.
   */
  parentSafeCandidate: boolean
  /**
   * True when sensitive terms are detected (injury, medical, behavioral escalation, etc.).
   * Flags the note for additional director review before any downstream use.
   */
  needsDirectorReview: boolean
  safetyNotes: string[]
}

export interface DonnaNoteStructureInput {
  observation: string
  player?: string | null
  session?: string | null
  priority_link?: string | null
  note_type?: string | null
  visibility_intent?: string | null
}

// ---------------------------------------------------------------------------
// Keyword maps — ordered by specificity (longer/more specific phrases first)
// ---------------------------------------------------------------------------

const TECHNICAL_KEYWORDS = [
  'approach shot', 'follow-through', 'follow through', 'split step', 'drop shot',
  'forehand', 'backhand', 'overhead', 'topspin', 'footwork', 'mechanics',
  'volley', 'return', 'serve', 'stroke', 'swing', 'slice', 'stance', 'grip',
  'contact', 'lob', 'smash',
]

const TACTICAL_KEYWORDS = [
  'point construction', 'court position', 'net approach', 'game plan',
  'cross-court', 'down the line', 'inside-out', 'percentage', 'pattern',
  'strategy', 'tactic', 'baseline', 'transition', 'offensive', 'defensive',
  'neutralize', 'approach', 'depth', 'angle', 'pressure', 'rally',
]

const MENTAL_KEYWORDS = [
  'mental toughness', 'frustration', 'confidence', 'composure', 'concentration',
  'motivation', 'resilience', 'resilient', 'competitive', 'distracted',
  'motivated', 'emotional', 'frustrated', 'attitude', 'anxious', 'anxiety',
  'nervous', 'focused', 'focus', 'mindset', 'pressure',
]

const PHYSICAL_KEYWORDS = [
  'court coverage', 'lateral movement', 'explosive', 'endurance', 'conditioning',
  'recovery', 'mobility', 'agility', 'stamina', 'fitness', 'strength',
  'movement', 'tired', 'fatigue', 'energy', 'speed',
]

const ATTENDANCE_KEYWORDS = [
  'did not attend', 'missed session', 'no-show', 'not present', 'cancelled',
  'absent', 'missing', 'cancel', 'early', 'late',
]

const BEHAVIOR_KEYWORDS = [
  'conflict with', 'spoke over', 'side talk', 'inappropriate', 'disruptive',
  'disrupted', 'behaviour', 'behavior', 'engagement', 'respectful',
  'listening', 'refused', 'argument', 'argue', 'engaged', 'peer',
]

const READINESS_KEYWORDS = [
  'next level', 'level up', 'readiness', 'demonstrated', 'demonstrate',
  'consistently', 'consistent', 'advancement', 'improvement', 'improving',
  'progress', 'evaluation', 'assessment', 'ready', 'gate',
]

const POSITIVE_KEYWORDS = [
  'strong performance', 'showing great', 'executed well', 'really good',
  'well done', 'good work', 'best session', 'breakthrough', 'progressing',
  'impressive', 'excellent', 'outstanding', 'amazing', 'improved', 'improving',
  'positive', 'solid', 'confident', 'nailed', 'great',
]

const SENSITIVE_KEYWORDS = [
  'parent complaint', 'parent concern', 'parent issue', 'parent upset',
  'safeguarding', 'suspension', 'disciplinary', 'breakdown', 'escalat',
  'emergency', 'welfare', 'expelled', 'hospital', 'therapist', 'therapy',
  'medical', 'doctor', 'injured', 'injury', 'crying', 'sore', 'pain',
  'hurt', 'sick', 'ill',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function contains(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw))
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.filter(kw => text.includes(kw)).length
}

// ---------------------------------------------------------------------------
// Main classifier
// ---------------------------------------------------------------------------

export function structureDonnaNote(input: DonnaNoteStructureInput): DonnaStructuredNote {
  const lower = (input.observation ?? '').toLowerCase()

  // Attendance is double-weighted because it is unambiguous
  const scores: Array<[DonnaNoteCategory, number]> = [
    ['attendance', countMatches(lower, ATTENDANCE_KEYWORDS) * 2],
    ['behavior',   countMatches(lower, BEHAVIOR_KEYWORDS)],
    ['technical',  countMatches(lower, TECHNICAL_KEYWORDS)],
    ['tactical',   countMatches(lower, TACTICAL_KEYWORDS)],
    ['physical',   countMatches(lower, PHYSICAL_KEYWORDS)],
    ['mental',     countMatches(lower, MENTAL_KEYWORDS)],
    ['readiness',  countMatches(lower, READINESS_KEYWORDS)],
  ]

  // Highest score wins; ties go to the first entry in priority order above
  const topCategory: DonnaNoteCategory =
    scores.reduce((best, cur) => (cur[1] > best[1] ? cur : best), ['general', 0] as [DonnaNoteCategory, number])[0]

  const visibility: DonnaNoteVisibility = 'internal_only'

  const needsDirectorReview = contains(lower, SENSITIVE_KEYWORDS)

  // Parent-safe candidate: clearly positive + no sensitive terms + not behavior
  const isPositive = contains(lower, POSITIVE_KEYWORDS)
  const parentSafeCandidate = isPositive && !needsDirectorReview && topCategory !== 'behavior'

  // Tags
  const suggestedTags: string[] = [
    `category:${topCategory}`,
    'source:donna_assistant',
    'visibility:internal_only',
  ]
  if (needsDirectorReview) suggestedTags.push('review:director_required')
  if (parentSafeCandidate) suggestedTags.push('parent_safe_candidate:true')
  if (input.player) suggestedTags.push('has_player_ref:true')
  if (input.session) suggestedTags.push('has_session_ref:true')
  if (input.priority_link) suggestedTags.push('has_priority_link:true')

  const summary =
    (input.observation ?? '').trim().slice(0, 250) ||
    'Observation captured.'

  const safetyNotes: string[] = [
    'Internal only — not visible to parents or players.',
  ]
  if (needsDirectorReview) {
    safetyNotes.push('Sensitive content detected — flagged for director review before any downstream use.')
  }
  if (parentSafeCandidate) {
    safetyNotes.push(
      'Positive observation flagged as a parent-safe candidate. Not parent-visible until a director explicitly approves it.',
    )
  }

  return {
    category: topCategory,
    visibility,
    summary,
    suggestedTags,
    parentSafeCandidate,
    needsDirectorReview,
    safetyNotes,
  }
}
