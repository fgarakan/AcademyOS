// Evidence Curriculum Mapper — pure TypeScript, no DB calls.
// Maps assessment skill keys and observation types to curriculum requirement labels.
// Returns MappingResult with confidence. Low-confidence results are flagged
// so DONNA can say "evidence exists but is not yet mapped to a requirement."

export interface MappingResult {
  requirementLabel: string | null
  pathway: 'skill' | 'competition' | 'fitness' | 'mental_performance' | 'general'
  matchConfidence: number  // 0–100
  isMapped: boolean
  missingMappingNote: string | null
}

// ─── Skill key → requirement label mappings ───────────────────────────────────

const SKILL_TO_REQUIREMENT: Record<string, { label: string; pathway: MappingResult['pathway'] }> = {
  // Universal Foundations
  tracking:              { label: 'Ball Tracking',            pathway: 'skill' },
  movement:              { label: 'Court Movement',           pathway: 'fitness' },
  organization:          { label: 'Court Organization',       pathway: 'skill' },
  rhythm_timing:         { label: 'Rhythm and Timing',        pathway: 'skill' },
  ball_control:          { label: 'Ball Control',             pathway: 'skill' },
  adaptability:          { label: 'Adaptability',             pathway: 'mental_performance' },
  competition_readiness: { label: 'Competition Readiness',    pathway: 'competition' },
  // Forehand
  preparation:           { label: 'Stroke Preparation',       pathway: 'skill' },
  spacing:               { label: 'Contact Spacing',          pathway: 'skill' },
  contact:               { label: 'Contact Point',            pathway: 'skill' },
  rhythm:                { label: 'Stroke Rhythm',            pathway: 'skill' },
  timing:                { label: 'Stroke Timing',            pathway: 'skill' },
  direction_control:     { label: 'Direction Control',        pathway: 'skill' },
  depth_control:         { label: 'Depth Control',            pathway: 'skill' },
  spin_control:          { label: 'Spin Control',             pathway: 'skill' },
  high_ball:             { label: 'High Ball Handling',       pathway: 'skill' },
  low_ball:              { label: 'Low Ball Handling',        pathway: 'skill' },
  neutral_stance:        { label: 'Neutral Stance',           pathway: 'skill' },
  semi_open_stance:      { label: 'Semi-Open Stance',         pathway: 'skill' },
  open_stance:           { label: 'Open Stance',              pathway: 'skill' },
  stance_fluency:        { label: 'Stance Fluency',           pathway: 'skill' },
  // Serve
  grip_setup:            { label: 'Serve Grip and Setup',     pathway: 'skill' },
  toss:                  { label: 'Serve Toss',               pathway: 'skill' },
  balance:               { label: 'Balance',                  pathway: 'fitness' },
  direction:             { label: 'Serve Direction',          pathway: 'skill' },
  second_serve_confidence: { label: 'Second Serve Confidence', pathway: 'mental_performance' },
  // Return / Rally / Competition
  rally_tolerance:         { label: 'Rally Tolerance',        pathway: 'competition' },
  scoring_knowledge:       { label: 'Scoring Knowledge',      pathway: 'competition' },
  decision_making:         { label: 'Decision Making',        pathway: 'competition' },
  recovery_after_mistakes: { label: 'Recovery Under Pressure', pathway: 'mental_performance' },
  point_construction:      { label: 'Point Construction',     pathway: 'competition' },
  competitive_independence: { label: 'Competitive Independence', pathway: 'competition' },
  // Fitness / Movement
  coordination:   { label: 'Coordination',                    pathway: 'fitness' },
  agility:        { label: 'Agility',                         pathway: 'fitness' },
  mobility:       { label: 'Mobility',                        pathway: 'fitness' },
  speed_readiness: { label: 'Speed Readiness',                pathway: 'fitness' },
  endurance:      { label: 'Endurance',                       pathway: 'fitness' },
  // Mental Performance
  focus:             { label: 'Focus',                        pathway: 'mental_performance' },
  confidence:        { label: 'Confidence',                   pathway: 'mental_performance' },
  resilience:        { label: 'Resilience',                   pathway: 'mental_performance' },
  emotional_reset:   { label: 'Emotional Reset',              pathway: 'mental_performance' },
  coachability:      { label: 'Coachability',                 pathway: 'mental_performance' },
  pressure_response: { label: 'Pressure Response',            pathway: 'mental_performance' },
}

// ─── Observation type → requirement mapping ───────────────────────────────────

const OBS_TYPE_TO_PATHWAY: Record<string, MappingResult['pathway']> = {
  technical:           'skill',
  tactical:            'skill',
  movement:            'fitness',
  competition:         'competition',
  fitness:             'fitness',
  load:                'fitness',
  recovery:            'fitness',
  behavioral:          'mental_performance',
  injury_concern:      'fitness',
  positive_highlight:  'general',
  general:             'general',
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function mapSkillToRequirement(skillKey: string): MappingResult {
  const mapped = SKILL_TO_REQUIREMENT[skillKey]
  if (mapped) {
    return {
      requirementLabel: mapped.label,
      pathway:          mapped.pathway,
      matchConfidence:  90,
      isMapped:         true,
      missingMappingNote: null,
    }
  }

  // Fuzzy: try partial key match
  const fuzzy = Object.entries(SKILL_TO_REQUIREMENT).find(([k]) =>
    skillKey.includes(k) || k.includes(skillKey)
  )
  if (fuzzy) {
    return {
      requirementLabel: fuzzy[1].label,
      pathway:          fuzzy[1].pathway,
      matchConfidence:  60,
      isMapped:         true,
      missingMappingNote: `Fuzzy match — confirm mapping for "${skillKey}".`,
    }
  }

  return {
    requirementLabel: null,
    pathway:          'general',
    matchConfidence:  0,
    isMapped:         false,
    missingMappingNote: `No curriculum requirement mapped for skill "${skillKey}". Evidence exists but cannot be linked to a specific requirement yet.`,
  }
}

export function mapObservationTypeToPathway(observationType: string): MappingResult['pathway'] {
  return OBS_TYPE_TO_PATHWAY[observationType] ?? 'general'
}

// Maps a scored skill from ScoresDetail to a MappingResult.
// score is on 1–10 scale. Returns null if skill is not_assessed.
export function mapScoredSkill(
  skillKey: string,
  score: number | null,
  notAssessed: boolean,
): (MappingResult & { score: number | null }) | null {
  if (notAssessed || score === null) return null
  const mapping = mapSkillToRequirement(skillKey)
  return { ...mapping, score }
}

// Returns missing-evidence signal for skills that are mapped but have no score.
export function getMissingEvidenceSignals(
  scoredSkillKeys: string[],
  allExpectedSkillKeys: string[],
): string[] {
  const missing = allExpectedSkillKeys.filter(k => !scoredSkillKeys.includes(k))
  return missing
    .map(k => SKILL_TO_REQUIREMENT[k]?.label)
    .filter((l): l is string => !!l)
}
