// Mega Sprint 1625–1654 — DONNA Academy Learning Engine V1
// Lesson extraction engine: converts detected patterns + trends into director-facing lessons.
// Builds concrete recommendations from those lessons.
//
// The goal is not merely detecting patterns.
// The goal is helping a director learn from those patterns.
//
// Design rules:
//   - Pure TypeScript. No DB, no React, no side effects.
//   - No causation claims. No outcome assertions.
//   - Every lesson has: headline, insight, monitor suggestion.
//   - Every recommendation has: action, rationale, destination.
//   - Confidence is disclosed and never inflated.
//   - Lessons and recommendations below 'low' confidence are suppressed.

import type {
  PatternDetectionResult,
  TrendDetectionResult,
  ExtractedLesson,
  DirectorRecommendation,
  LearningConfidence,
  PatternType,
  TrendType,
} from './donnaAcademyLearningTypes'

// ── Lesson builder ────────────────────────────────────────────────────────────

function makeLesson(
  sourcePatternId:   string | null,
  sourceTrendId:     string | null,
  headline:          string,
  insight:           string,
  monitorSuggestion: string | null,
  confidence:        LearningConfidence,
  limitations:       string[],
): ExtractedLesson {
  const sourceKey = sourcePatternId ?? sourceTrendId ?? 'x'
  return {
    id:                `lesson-${sourceKey.slice(0, 16)}-${Date.now()}`,
    sourcePatternId,
    sourceTrendId,
    headline,
    insight,
    monitorSuggestion,
    confidence,
    limitations,
  }
}

// ── Pattern → lesson ──────────────────────────────────────────────────────────

function lessonFromPattern(pattern: PatternDetectionResult): ExtractedLesson | null {
  if (pattern.confidence === 'insufficient') return null

  switch (pattern.patternType as PatternType) {

    case 'promotion_cluster':
      return makeLesson(
        pattern.id, null,
        'Active advancement period',
        `Your academy shows a cluster of ${pattern.frequency} promotions in a short window. ` +
        `This suggests the academy may be in an active advancement phase — or that a batch review recently occurred.`,
        'Watch for assessment coverage: are players being formally assessed before promotions, ' +
        'or are promotions running ahead of assessments?',
        pattern.confidence,
        ['Cluster detection is frequency-based. No outcome quality is implied.'],
      )

    case 'rejection_repeat':
      return makeLesson(
        pattern.id, null,
        'Repeated action rejections',
        `${pattern.frequency} proposed actions in memory show rejection. ` +
        `This may indicate DONNA is proposing actions that don't match your priorities — ` +
        `or that its context window doesn't fully capture your reasoning.`,
        'If the same type of action keeps getting rejected, consider adding reviewer notes ' +
        'so DONNA can calibrate to your preferences over time.',
        pattern.confidence,
        ['Rejection count does not imply the proposals were wrong — only that they were declined.'],
      )

    case 'override_frequency':
      return makeLesson(
        pattern.id, null,
        'Frequent DONNA overrides',
        `${pattern.frequency} of DONNA's proposals were modified before approval. ` +
        `This is normal — it means DONNA's proposals are being used as a starting point. ` +
        `However, high override frequency may indicate DONNA needs more context to match your approach.`,
        'Review the overridden proposals to see if a shared pattern exists in what gets changed.',
        pattern.confidence,
        ['Override frequency does not mean DONNA is wrong — context is often added at override time.'],
      )

    case 'assessment_gap':
      return makeLesson(
        pattern.id, null,
        'Low assessment volume',
        `Assessment records make up a small fraction of loaded memory. Formal assessments anchor promotion ` +
        `decisions and should appear regularly for active players. A low count may reflect actual ` +
        `infrequency or records outside the loaded window.`,
        'Review which players have not had a recent assessment and whether any are approaching promotion eligibility.',
        pattern.confidence,
        ['Assessment gap detection is based on a count ratio — not on individual player assessment status.'],
      )

    case 'curriculum_change_burst':
      return makeLesson(
        pattern.id, null,
        'Curriculum change burst',
        `${pattern.frequency} curriculum changes occurred in a short window. This may reflect a structured ` +
        `review cycle, a response to coach feedback, or reactive adjustments. ` +
        `The reason for the burst is not determinable from records alone.`,
        'Check whether the changes were planned (scheduled curriculum review) or reactive (responding to performance gaps).',
        pattern.confidence,
        ['Burst detection is time-window based. Quality or intentionality of changes cannot be inferred.'],
      )

    case 'coach_assignment_churn':
      return makeLesson(
        pattern.id, null,
        'Multiple coach assignment changes',
        `${pattern.frequency} coach assignment records appear in memory. Frequent re-assignments may reflect ` +
        `roster changes, coach departures, or deliberate group restructuring. ` +
        `Context is not available from counts alone.`,
        'If coach assignments are changing frequently, verify that each player has a clear primary coach relationship in the system.',
        pattern.confidence,
        ['Coach assignment churn detection does not distinguish between planned and reactive changes.'],
      )

    case 'parent_update_gap':
      return makeLesson(
        pattern.id, null,
        'Low parent communication volume',
        `Parent update records are a small fraction of the loaded memory. Whether this reflects a genuine ` +
        `communication gap or simply low parent update activity in this period cannot be confirmed from frequency alone.`,
        'Review which families have not received a formal update recently, ' +
        'particularly families of players with recent curriculum or progression changes.',
        pattern.confidence,
        ['Parent communication gap detection is a count ratio — not a measure of family satisfaction or clarity.'],
      )

    case 'placement_velocity':
      return makeLesson(
        pattern.id, null,
        'Active onboarding period',
        `${pattern.frequency} player placements occurred in a short window. This indicates an active intake ` +
        `or enrollment phase. High placement velocity may increase load on coaches and assessment capacity.`,
        'Verify that each recently placed player has a coach assignment and an initial assessment scheduled.',
        pattern.confidence,
        ['Placement velocity does not indicate placement quality. Each placement still requires formal review.'],
      )
  }
}

// ── Trend → lesson ────────────────────────────────────────────────────────────

function lessonFromTrend(trend: TrendDetectionResult): ExtractedLesson | null {
  if (trend.confidence === 'insufficient') return null
  if (trend.direction === 'insufficient_data') return null

  switch (trend.trendType as TrendType) {

    case 'decision_velocity':
      if (trend.direction === 'stable') return null
      return makeLesson(
        null, trend.id,
        `Decision pace is ${trend.direction}`,
        trend.direction === 'increasing'
          ? 'The rate of decisions is increasing. This may indicate a busy period, an active cohort, ' +
            'or accumulated backlog being cleared.'
          : 'The rate of decisions is decreasing. This may reflect a quieter period, an approaching plateau, ' +
            'or pending decisions not yet entered.',
        trend.direction === 'increasing'
          ? 'Monitor for review queue backlog — fast decision pacing can outpace review capacity.'
          : 'Check for pending items in the review queue that may not be progressing.',
        trend.confidence,
        ['Decision velocity is an observation of count over time — not a measure of quality or urgency.'],
      )

    case 'override_rate':
      if (trend.direction === 'stable') return null
      return makeLesson(
        null, trend.id,
        `Override rate is ${trend.direction}`,
        trend.direction === 'increasing'
          ? 'You are overriding DONNA\'s proposals more frequently in the recent window. This may reflect ' +
            'evolving priorities, changes in the academy\'s direction, or DONNA\'s context becoming less aligned ' +
            'with your current approach.'
          : 'Override frequency is decreasing — DONNA\'s proposals are being accepted with fewer modifications ' +
            'in the recent window.',
        trend.direction === 'increasing'
          ? 'Consider adding reviewer notes when overriding so DONNA can better calibrate to your preferences over time.'
          : null,
        trend.confidence,
        ['Override rate trend does not indicate whether DONNA\'s original proposals were correct or incorrect.'],
      )

    case 'parent_update_cadence':
      if (trend.direction === 'stable') return null
      return makeLesson(
        null, trend.id,
        `Parent communication is ${trend.direction}`,
        trend.direction === 'decreasing'
          ? 'Parent update frequency has decreased in the more recent window. Whether this reflects intentional ' +
            'pacing or a communication gap requires manual review.'
          : 'Parent update frequency has increased recently. This may reflect a proactive communication push or ' +
            'an increase in events requiring parent notification.',
        trend.direction === 'decreasing'
          ? 'Review which families may be overdue for an update, particularly those with recent player activity.'
          : null,
        trend.confidence,
        ['Communication cadence trend is frequency-based — not a measure of quality or parent satisfaction.'],
      )

    case 'curriculum_change_rate':
      if (trend.direction === 'stable') return null
      return makeLesson(
        null, trend.id,
        `Curriculum change pace is ${trend.direction}`,
        trend.direction === 'increasing'
          ? 'Curriculum changes are occurring more frequently in the recent window. This may indicate a planned ' +
            'evolution cycle or reactive adjustments.'
          : 'Curriculum change frequency has decreased. Whether this reflects curriculum stability or reduced ' +
            'engagement is not determinable from counts.',
        trend.direction === 'increasing'
          ? 'Ensure curriculum changes are being communicated to affected coaches and that player assignments ' +
            'reflect current content.'
          : null,
        trend.confidence,
        ['Curriculum change rate trend is frequency-based — not a quality or appropriateness measure.'],
      )

    case 'promotion_rate':
      if (trend.direction === 'stable') return null
      return makeLesson(
        null, trend.id,
        `Promotion pace is ${trend.direction}`,
        trend.direction === 'increasing'
          ? 'Player promotions are occurring more frequently in the recent window. This may indicate a cohort ' +
            'reaching readiness or an active advancement review cycle.'
          : 'Promotion frequency has decreased in the recent window. This is not inherently concerning — it ' +
            'may reflect appropriate pacing.',
        trend.direction === 'increasing'
          ? 'Verify that each recent promotion was preceded by a formal assessment and meets your promotion criteria.'
          : 'If eligible players exist but promotions are not occurring, check whether assessments are current.',
        trend.confidence,
        ['Promotion rate trend is frequency-based — not a confirmation that promotion decisions were correct.'],
      )
  }
}

// ── Recommendation builder ────────────────────────────────────────────────────

// Maps lesson headlines to concrete director actions and destinations.
// Headline matching is intentional — lessons use fixed headlines by design.
const LESSON_ACTION_MAP: Array<{
  match:       (headline: string) => boolean
  action:      string
  destination: string
  priority:    DirectorRecommendation['priority']
}> = [
  {
    match:       h => h === 'Active advancement period',
    action:      'Review player assessments for advancement-eligible players',
    destination: '/director/players',
    priority:    'high',
  },
  {
    match:       h => h === 'Active onboarding period',
    action:      'Confirm each recently placed player has a coach assignment and initial assessment',
    destination: '/director/players',
    priority:    'high',
  },
  {
    match:       h => h === 'Repeated action rejections',
    action:      'Review recent rejections in the approval queue and add reviewer notes',
    destination: '/director/review',
    priority:    'medium',
  },
  {
    match:       h => h === 'Low assessment volume',
    action:      'Check player assessment records and schedule any outstanding assessments',
    destination: '/director/players',
    priority:    'medium',
  },
  {
    match:       h => h === 'Multiple coach assignment changes',
    action:      'Verify each player has a confirmed primary coach in the system',
    destination: '/director/coaches',
    priority:    'medium',
  },
  {
    match:       h => h === 'Low parent communication volume',
    action:      'Identify families overdue for a progress update',
    destination: '/director/players',
    priority:    'medium',
  },
  {
    match:       h => h.startsWith('Promotion pace'),
    action:      'Review promotion pipeline for assessment coverage',
    destination: '/director/players',
    priority:    'medium',
  },
  {
    match:       h => h === 'Frequent DONNA overrides',
    action:      'Review overridden proposals for shared patterns',
    destination: '/director/review',
    priority:    'low',
  },
  {
    match:       h => h === 'Curriculum change burst',
    action:      'Verify recent curriculum changes are documented and communicated to coaches',
    destination: '/director/curriculum',
    priority:    'low',
  },
  {
    match:       h => h.startsWith('Override rate'),
    action:      'Add reviewer notes to recent overrides to guide future DONNA proposals',
    destination: '/director/review',
    priority:    'low',
  },
  {
    match:       h => h.startsWith('Decision pace'),
    action:      'Review pending items in the approval queue',
    destination: '/director/review',
    priority:    'low',
  },
  {
    match:       h => h.startsWith('Parent communication'),
    action:      'Review family communication history and identify any overdue updates',
    destination: '/director/players',
    priority:    'medium',
  },
  {
    match:       h => h.startsWith('Curriculum change pace'),
    action:      'Review recent curriculum changes for coach notification and player assignment alignment',
    destination: '/director/curriculum',
    priority:    'low',
  },
]

function recommendationFromLesson(lesson: ExtractedLesson): DirectorRecommendation | null {
  if (lesson.confidence === 'insufficient') return null

  const entry = LESSON_ACTION_MAP.find(e => e.match(lesson.headline))
  if (!entry) return null

  return {
    id:               `rec-${lesson.id.slice(0, 16)}-${Date.now()}`,
    sourceLessonId:   lesson.id,
    action:           entry.action,
    rationale:        lesson.insight,
    destination:      entry.destination,
    priority:         entry.priority,
    requiresApproval: false,
  }
}

// ── Main extraction ───────────────────────────────────────────────────────────

export function extractLessons(
  patterns: PatternDetectionResult[],
  trends:   TrendDetectionResult[],
): ExtractedLesson[] {
  const lessons: ExtractedLesson[] = []

  for (const pattern of patterns) {
    const lesson = lessonFromPattern(pattern)
    if (lesson) lessons.push(lesson)
  }

  for (const trend of trends) {
    const lesson = lessonFromTrend(trend)
    if (lesson) lessons.push(lesson)
  }

  return lessons
}

export function buildRecommendations(lessons: ExtractedLesson[]): DirectorRecommendation[] {
  const recommendations: DirectorRecommendation[] = []

  for (const lesson of lessons) {
    const rec = recommendationFromLesson(lesson)
    if (rec) recommendations.push(rec)
  }

  const order: Record<DirectorRecommendation['priority'], number> = { high: 0, medium: 1, low: 2 }
  return recommendations.sort((a, b) => order[a.priority] - order[b.priority])
}
