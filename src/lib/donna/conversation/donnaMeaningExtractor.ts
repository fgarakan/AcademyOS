// Sprint 2831–2860 — DONNA Conversational Intelligence & Learning Foundation V1
// Part 3 — Meaning Extractor
//
// Translates vague human language into ranked AcademyOS concepts.
// Goes beyond intent detection — finds the underlying concern.
//
// Examples:
//   "These kids are all over the place."
//     → { concept: 'grouping_issue', weight: 0.7 }
//     → { concept: 'focus_issue',    weight: 0.5 }
//     → { concept: 'readiness_issue', weight: 0.4 }
//
//   "Practice wasn't great."
//     → { concept: 'engagement_issue', weight: 0.6 }
//     → { concept: 'effort_issue',     weight: 0.4 }
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Returns ranked interpretations ordered by confidence.
//   - Domain mappings are conservative — ambiguous phrases surface multiple concepts.
//   - Each concept maps to a concrete AcademyOS action or signal.

import type { InterpreterRole } from './donnaIntentInterpreter'

// ── AcademyOS concepts ────────────────────────────────────────────────────────

export type AcademyOSConcept =
  // Player/group state
  | 'readiness_issue'        // players not ready for current level demands
  | 'grouping_issue'         // mixed skill/focus levels in a group
  | 'focus_issue'            // attention/engagement problem in session
  | 'effort_issue'           // low effort, not trying hard enough
  | 'engagement_issue'       // low enthusiasm or motivation
  | 'curriculum_issue'       // content doesn't match group's current needs
  | 'coach_execution_issue'  // coach delivery or structure problem
  | 'attendance_issue'       // low attendance, absenteeism pattern
  | 'progression_issue'      // player not advancing as expected
  | 'expectation_issue'      // stakeholder expectations don't match reality
  | 'communication_issue'    // lack of information or clarity
  | 'retention_risk'         // player or family showing disengagement signals
  | 'enrollment_issue'       // group or academy enrollment concerns
  | 'confidence_issue'       // player self-belief or mental state concern
  | 'assessment_need'        // situation requires formal assessment
  | 'parent_concern'         // parent is worried or wants information
  | 'coach_behavior_gap'     // coach missing expected behavior (recap, observations)
  | 'advancement_opportunity' // player showing readiness for next level
  | 'session_quality'        // session outcome was not as expected
  | 'scheduling_question'    // timing or session schedule concern

// ── Meaning interpretation ────────────────────────────────────────────────────

export interface MeaningInterpretation {
  concept: AcademyOSConcept
  confidence: number              // 0–1
  reasoning: string               // why this concept matches
  suggestedAction: string         // the concrete AcademyOS action this maps to
  academyosSignal: string         // signal name in DONNA's knowledge base
}

export interface ExtractedMeaning {
  originalText: string
  role: InterpreterRole
  interpretations: MeaningInterpretation[]    // ranked highest confidence first
  topConcept: AcademyOSConcept | null
  topConfidence: number
  isAmbiguous: boolean                        // true when top 2 concepts < 0.15 apart
  recommendedNextStep: string
}

// ── Phrase patterns ───────────────────────────────────────────────────────────

interface ConceptPattern {
  concept: AcademyOSConcept
  patterns: Array<{ phrase: string; weight: number }>
  suggestedAction: string
  academyosSignal: string
}

const CONCEPT_PATTERNS: ConceptPattern[] = [
  {
    concept: 'grouping_issue',
    patterns: [
      { phrase: 'all over the place',         weight: 0.80 },
      { phrase: 'mixed levels',               weight: 0.70 },
      { phrase: 'different abilities',        weight: 0.65 },
      { phrase: 'too spread out',             weight: 0.65 },
      { phrase: 'wide range',                 weight: 0.55 },
      { phrase: 'too many levels',            weight: 0.70 },
      { phrase: 'not in the right group',     weight: 0.75 },
      { phrase: 'group is difficult',         weight: 0.75 },
      { phrase: 'difficult group',            weight: 0.65 },
      { phrase: 'group dynamic',              weight: 0.65 },
      { phrase: 'is difficult',               weight: 0.55 },
    ],
    suggestedAction: 'Review group composition and assess readiness levels',
    academyosSignal: 'group_composition_mismatch',
  },
  {
    concept: 'focus_issue',
    patterns: [
      { phrase: "can't focus",                weight: 0.80 },
      { phrase: 'distracted',                 weight: 0.75 },
      { phrase: 'unfocused',                  weight: 0.80 },
      { phrase: 'not paying attention',       weight: 0.80 },
      { phrase: 'hard to manage',             weight: 0.65 },
      { phrase: 'chaotic',                    weight: 0.70 },
      { phrase: 'all over the place',         weight: 0.50 },
      { phrase: 'trouble concentrating',      weight: 0.75 },
      { phrase: 'to listen',                  weight: 0.60 },
      { phrase: "won't listen",               weight: 0.75 },
    ],
    suggestedAction: 'Log observation — may indicate curriculum mismatch or energy issue',
    academyosSignal: 'session_focus_gap',
  },
  {
    concept: 'engagement_issue',
    patterns: [
      { phrase: 'flat',                       weight: 0.75 },
      { phrase: 'low energy',                 weight: 0.80 },
      { phrase: 'energy was',                 weight: 0.75 },
      { phrase: 'not into it',                weight: 0.75 },
      { phrase: 'unengaged',                  weight: 0.80 },
      { phrase: 'bored',                      weight: 0.75 },
      { phrase: "don't seem motivated",       weight: 0.80 },
      { phrase: 'losing interest',            weight: 0.80 },
      { phrase: 'session felt flat',          weight: 0.80 },
      { phrase: 'not enjoying',               weight: 0.75 },
      { phrase: 'going through the motions',  weight: 0.75 },
    ],
    suggestedAction: 'Review curriculum variety and energy management in session plan',
    academyosSignal: 'low_engagement_signal',
  },
  {
    concept: 'effort_issue',
    patterns: [
      { phrase: "not trying",                 weight: 0.80 },
      { phrase: "weren't trying",             weight: 0.80 },
      { phrase: 'low effort',                 weight: 0.80 },
      { phrase: "not putting in",             weight: 0.70 },
      { phrase: 'giving up',                  weight: 0.80 },
      { phrase: "won't push themselves",      weight: 0.75 },
      { phrase: 'lazy',                       weight: 0.70 },
      { phrase: 'coasting',                   weight: 0.70 },
    ],
    suggestedAction: 'Coach observation → director review of goal alignment',
    academyosSignal: 'effort_deficit_signal',
  },
  {
    concept: 'session_quality',
    patterns: [
      { phrase: "wasn't great",               weight: 0.70 },
      { phrase: 'could have been better',     weight: 0.65 },
      { phrase: 'not a great session',        weight: 0.80 },
      { phrase: 'rough session',              weight: 0.75 },
      { phrase: 'practice was rough',         weight: 0.75 },
      { phrase: 'was rough',                  weight: 0.70 },
      { phrase: "didn't go well",             weight: 0.75 },
      { phrase: 'session was off',            weight: 0.70 },
      { phrase: 'today was tough',            weight: 0.55 },
    ],
    suggestedAction: 'Submit session wrap-up with notes on what did not work',
    academyosSignal: 'session_quality_flag',
  },
  {
    concept: 'curriculum_issue',
    patterns: [
      { phrase: "not getting it",             weight: 0.75 },
      { phrase: "don't understand the drill", weight: 0.80 },
      { phrase: 'too hard for them',          weight: 0.75 },
      { phrase: 'too easy',                   weight: 0.70 },
      { phrase: 'wrong level',                weight: 0.80 },
      { phrase: 'drill is wrong',             weight: 0.70 },
      { phrase: "wasn't working",             weight: 0.70 },
      { phrase: "drill wasn't",               weight: 0.65 },
      { phrase: "doesn't fit",                weight: 0.65 },
      { phrase: 'not appropriate',            weight: 0.65 },
      { phrase: 'feels off',                  weight: 0.55 },
      { phrase: 'these kids',                 weight: 0.40 },
    ],
    suggestedAction: 'Review curriculum content for the group level — flag for director if systematic',
    academyosSignal: 'curriculum_mismatch_signal',
  },
  {
    concept: 'readiness_issue',
    patterns: [
      { phrase: "not ready",                  weight: 0.80 },
      { phrase: 'behind',                     weight: 0.65 },
      { phrase: 'struggling with the basics', weight: 0.80 },
      { phrase: "can't do",                   weight: 0.60 },
      { phrase: "not there yet",              weight: 0.70 },
      { phrase: 'needs more time',            weight: 0.65 },
      { phrase: 'these kids',                 weight: 0.35 },
    ],
    suggestedAction: 'Assess readiness — may need placement review or level adjustment',
    academyosSignal: 'readiness_gap_signal',
  },
  {
    concept: 'progression_issue',
    patterns: [
      { phrase: "not improving",                   weight: 0.80 },
      { phrase: 'stuck',                           weight: 0.75 },
      { phrase: 'not progressing',                 weight: 0.80 },
      { phrase: 'no improvement',                  weight: 0.80 },
      { phrase: 'stalled',                         weight: 0.75 },
      { phrase: 'plateau',                         weight: 0.70 },
      { phrase: 'same level for months',           weight: 0.80 },
      { phrase: 'struggled',                       weight: 0.70 },
      { phrase: 'struggling',                      weight: 0.70 },
      { phrase: 'extra attention',                 weight: 0.60 },
      { phrase: "don't think she's improving",     weight: 0.80 },
      { phrase: "don't think he's improving",      weight: 0.80 },
      { phrase: 'not seeing results',              weight: 0.80 },
      { phrase: 'nothing is changing',             weight: 0.75 },
      { phrase: 'nothing is working',              weight: 0.75 },
      { phrase: 'this slow',                       weight: 0.65 },
      { phrase: 'frustrated with my',              weight: 0.70 },
      { phrase: 'making mistakes',                 weight: 0.65 },
      { phrase: 'making the same',                 weight: 0.70 },
      { phrase: 'same mistakes',                   weight: 0.70 },
      { phrase: 'in the net',                      weight: 0.65 },
      { phrase: "can't get better",                weight: 0.75 },
      { phrase: 'concerned about',                 weight: 0.50 },
      { phrase: 'his development',                 weight: 0.55 },
      { phrase: 'her development',                 weight: 0.55 },
    ],
    suggestedAction: 'Review development signals — schedule assessment if overdue',
    academyosSignal: 'stall_signal',
  },
  {
    concept: 'retention_risk',
    patterns: [
      { phrase: 'wants to quit',              weight: 0.90 },
      { phrase: "doesn't want to come",       weight: 0.85 },
      { phrase: "doesn't want to go",         weight: 0.85 },
      { phrase: 'thinking of leaving',        weight: 0.85 },
      { phrase: 'considering quitting',       weight: 0.85 },
      { phrase: 'lost interest',              weight: 0.75 },
      { phrase: "mom is not happy",           weight: 0.65 },
      { phrase: "parents are frustrated",     weight: 0.80 },
      { phrase: 'frustrated',                 weight: 0.45 },
      { phrase: 'unhappy',                    weight: 0.50 },
    ],
    suggestedAction: 'Flag for director — create parent engagement draft',
    academyosSignal: 'retention_risk_signal',
  },
  {
    concept: 'parent_concern',
    patterns: [
      { phrase: 'parent',                     weight: 0.60 },
      { phrase: 'parents seem frustrated',    weight: 0.90 },
      { phrase: 'mom asked',                  weight: 0.75 },
      { phrase: 'dad asked',                  weight: 0.75 },
      { phrase: 'family is worried',          weight: 0.80 },
      { phrase: 'parent wants to know',       weight: 0.80 },
      { phrase: 'parent concern',             weight: 0.85 },
    ],
    suggestedAction: 'Create parent update draft for director review',
    academyosSignal: 'parent_concern_signal',
  },
  {
    concept: 'communication_issue',
    patterns: [
      { phrase: 'not sure what to tell',      weight: 0.75 },
      { phrase: "don't know what's happening", weight: 0.70 },
      { phrase: "haven't heard anything",     weight: 0.65 },
      { phrase: 'no update',                  weight: 0.60 },
      { phrase: 'confused about',             weight: 0.55 },
      { phrase: 'unclear on',                 weight: 0.55 },
    ],
    suggestedAction: 'Review recent notes and create a communication summary',
    academyosSignal: 'communication_gap_signal',
  },
  {
    concept: 'confidence_issue',
    patterns: [
      { phrase: 'losing confidence',          weight: 0.90 },
      { phrase: 'seems discouraged',          weight: 0.85 },
      { phrase: 'seems down',                 weight: 0.70 },
      { phrase: 'lost belief',                weight: 0.80 },
      { phrase: 'cried',                      weight: 0.80 },
      { phrase: 'nervous',                    weight: 0.65 },
      { phrase: 'scared',                     weight: 0.60 },
      { phrase: 'afraid to try',              weight: 0.75 },
      { phrase: "won't attempt",              weight: 0.70 },
    ],
    suggestedAction: 'Log observation — director may want to review player development context',
    academyosSignal: 'confidence_signal',
  },
  {
    concept: 'enrollment_issue',
    patterns: [
      { phrase: 'light',                      weight: 0.55 },
      { phrase: 'enrollment is down',         weight: 0.90 },
      { phrase: 'enrollment down',            weight: 0.85 },
      { phrase: 'numbers are low',            weight: 0.80 },
      { phrase: 'look weird',                 weight: 0.65 },
      { phrase: 'not many players',           weight: 0.70 },
      { phrase: 'group is small',             weight: 0.65 },
      { phrase: 'spots available',            weight: 0.55 },
      { phrase: 'orange looks weird',         weight: 0.80 },
      { phrase: 'looks light',                weight: 0.70 },
    ],
    suggestedAction: 'Review group enrollment numbers — check intake pipeline',
    academyosSignal: 'enrollment_signal',
  },
  {
    concept: 'expectation_issue',
    patterns: [
      { phrase: 'not what i expected',        weight: 0.80 },
      { phrase: 'expected more',              weight: 0.75 },
      { phrase: 'thought it would be',        weight: 0.65 },
      { phrase: 'not what we promised',       weight: 0.75 },
      { phrase: 'different from what',        weight: 0.60 },
      { phrase: 'program working',            weight: 0.65 },
      { phrase: 'working for',                weight: 0.55 },
    ],
    suggestedAction: 'Review expectations vs. current outputs — may need director communication',
    academyosSignal: 'expectation_gap_signal',
  },
  {
    concept: 'advancement_opportunity',
    patterns: [
      { phrase: 'ready to move up',           weight: 0.90 },
      { phrase: 'ready to move',              weight: 0.85 },
      { phrase: 'ready for the next level',   weight: 0.90 },
      { phrase: 'should be in a higher group', weight: 0.85 },
      { phrase: 'outgrowing this level',      weight: 0.80 },
      { phrase: 'ready to advance',           weight: 0.85 },
    ],
    suggestedAction: 'Submit advancement readiness note — director will review',
    academyosSignal: 'advancement_ready_signal',
  },
  {
    concept: 'attendance_issue',
    patterns: [
      { phrase: 'attendance was',             weight: 0.80 },
      { phrase: 'low attendance',             weight: 0.80 },
      { phrase: 'poor attendance',            weight: 0.80 },
      { phrase: 'not many showed',            weight: 0.75 },
      { phrase: 'nobody came',               weight: 0.80 },
      { phrase: 'a lot of absences',          weight: 0.75 },
    ],
    suggestedAction: 'Review attendance patterns — check for scheduling or motivation issues',
    academyosSignal: 'attendance_gap_signal',
  },
  {
    concept: 'assessment_need',
    patterns: [
      { phrase: 'needs to be assessed',       weight: 0.85 },
      { phrase: 'due for assessment',         weight: 0.85 },
      { phrase: 'when was last assessment',   weight: 0.80 },
      { phrase: 'should we assess',           weight: 0.75 },
      { phrase: 'needs evaluation',           weight: 0.75 },
    ],
    suggestedAction: 'Schedule assessment — flag for director review',
    academyosSignal: 'assessment_due_signal',
  },
]

// ── Meaning extractor ─────────────────────────────────────────────────────────

/**
 * Extract ranked AcademyOS concepts from a vague human statement.
 * Returns interpretations sorted by confidence, with the top concept highlighted.
 */
export function extractMeaning(
  text: string,
  role: InterpreterRole = 'director',
): ExtractedMeaning {
  const lower = text.toLowerCase()

  const scored = CONCEPT_PATTERNS.map(pattern => {
    let maxScore = 0
    let matchedPhrase = ''
    for (const p of pattern.patterns) {
      if (lower.includes(p.phrase) && p.weight > maxScore) {
        maxScore = p.weight
        matchedPhrase = p.phrase
      }
    }
    return { pattern, score: maxScore, matchedPhrase }
  })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)

  const interpretations: MeaningInterpretation[] = scored.map(r => ({
    concept: r.pattern.concept,
    confidence: r.score,
    reasoning: `Matched phrase: "${r.matchedPhrase}"`,
    suggestedAction: r.pattern.suggestedAction,
    academyosSignal: r.pattern.academyosSignal,
  }))

  const topConcept = interpretations[0]?.concept ?? null
  const topConfidence = interpretations[0]?.confidence ?? 0

  const isAmbiguous =
    interpretations.length >= 2 &&
    interpretations[0].confidence - interpretations[1].confidence < 0.15

  const recommendedNextStep = buildRecommendedNextStep(topConcept, role, isAmbiguous, interpretations)

  return {
    originalText: text,
    role,
    interpretations: interpretations.slice(0, 5),
    topConcept,
    topConfidence,
    isAmbiguous,
    recommendedNextStep,
  }
}

// ── Recommended next step ─────────────────────────────────────────────────────

function buildRecommendedNextStep(
  topConcept: AcademyOSConcept | null,
  role: InterpreterRole,
  isAmbiguous: boolean,
  interpretations: MeaningInterpretation[],
): string {
  if (!topConcept) {
    return "I didn't catch a specific concern. Can you describe what happened in the session, or which player you're thinking about?"
  }

  if (isAmbiguous && interpretations.length >= 2) {
    const top2 = interpretations.slice(0, 2)
    const options = top2.map(i => CONCEPT_LABELS[i.concept]).join(' or ')
    return `Is this about ${options}?`
  }

  return interpretations[0]?.suggestedAction ?? 'Review the situation and flag for director.'
}

// ── Concept labels ────────────────────────────────────────────────────────────

export const CONCEPT_LABELS: Record<AcademyOSConcept, string> = {
  readiness_issue:          'player readiness for this level',
  grouping_issue:           'group composition or skill mix',
  focus_issue:              'focus and attention during session',
  effort_issue:             'effort and player motivation',
  engagement_issue:         'engagement and enthusiasm',
  curriculum_issue:         'curriculum fit for this group',
  coach_execution_issue:    'session delivery or structure',
  attendance_issue:         'attendance pattern',
  progression_issue:        'player progression and development',
  expectation_issue:        'expectation gap',
  communication_issue:      'information or communication gap',
  retention_risk:           'retention risk',
  enrollment_issue:         'enrollment or group size',
  confidence_issue:         'player confidence or motivation',
  assessment_need:          'assessment timing',
  parent_concern:           'parent concern or frustration',
  coach_behavior_gap:       'coach behavior or compliance gap',
  advancement_opportunity:  'advancement readiness',
  session_quality:          'session outcome quality',
  scheduling_question:      'schedule or timing',
}
