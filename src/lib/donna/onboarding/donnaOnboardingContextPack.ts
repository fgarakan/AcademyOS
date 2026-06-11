// Mega Sprint 1715B — Academy Onboarding V2 — DONNA Context Pack
// Pure TypeScript. No DB, no React, no side effects.
// All DONNA conversational context for the onboarding wizard.

// ── Core types ────────────────────────────────────────────────────────────────

export type PlayerMix =
  | 'competitive_juniors'
  | 'mixed'
  | 'recreational_adult'
  | 'private_small_group'

export type FamilyPriorities =
  | 'results_rankings'
  | 'development_enjoyment'
  | 'fitness_fun'
  | 'individual_attention'

export type AgeGroup =
  | 'red_ball'
  | 'orange_ball'
  | 'green_ball'
  | 'yellow_ball'
  | 'high_performance'
  | 'adult'

export type CurriculumStartingPoint = 'academyos_curriculum' | 'import_curriculum'

export type PriorityEdge = 'technical_first' | 'tactical_first' | 'coach_judgment'

export type SessionDuration = 45 | 60 | 75 | 90 | 120

export type AdvancementApproval =
  | 'director_only'
  | 'donna_flags_director_confirms'
  | 'coach_recommends_notified'
  | 'assessment_driven'

export type ParentTransparency = 'minimal' | 'standard' | 'transparent'

export type InferredModel =
  | 'high_performance'
  | 'junior_development'
  | 'recreational'
  | 'private_coaching'
  | 'dual_track'

export type StageCategory =
  | 'technique'
  | 'tactics'
  | 'games'
  | 'competition'
  | 'movement'
  | 'mental'
  | 'fun'

export type SetupContext = 'fresh_setup' | 'migrating'

export type DirectorChallenge =
  | 'player_advancement'
  | 'coach_accountability'
  | 'parent_communication'
  | 'curriculum_structure'
  | 'not_sure_yet'

// ── Stage priorities state ────────────────────────────────────────────────────

export interface StagePriorityState {
  ranking: StageCategory[]
  weights: Record<StageCategory, number>
  manuallyAdjusted: boolean
  confirmed: boolean
}

// ── Rank → weight conversion ──────────────────────────────────────────────────

export const RANK_WEIGHTS: number[] = [24, 20, 17, 14, 11, 8, 6]
// Sum: 24+20+17+14+11+8+6 = 100 ✓

export const STAGE_CATEGORIES: StageCategory[] = [
  'technique', 'tactics', 'games', 'competition', 'movement', 'mental', 'fun',
]

export function rankingToWeights(ranking: StageCategory[]): Record<StageCategory, number> {
  const weights = {} as Record<StageCategory, number>
  ranking.forEach((cat, i) => {
    weights[cat] = RANK_WEIGHTS[i] ?? 6
  })
  return weights
}

// ── Labels ────────────────────────────────────────────────────────────────────

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  red_ball:        'Red Ball (5–8)',
  orange_ball:     'Orange Ball (8–10)',
  green_ball:      'Green Ball (9–11)',
  yellow_ball:     'Yellow Ball (10+)',
  high_performance: 'High Performance',
  adult:           'Adult',
}

export const STAGE_LABELS: Record<string, string> = {
  red_ball:        'Red Ball',
  orange_ball:     'Orange Ball',
  green_ball:      'Green Ball',
  yellow_ball:     'Yellow Ball',
  high_performance: 'High Performance',
}

export const CATEGORY_LABELS: Record<StageCategory, string> = {
  technique:   'Technique',
  tactics:     'Tactics',
  games:       'Games',
  competition: 'Competition',
  movement:    'Movement',
  mental:      'Mental',
  fun:         'Fun',
}

export const CATEGORY_SHORT: Record<StageCategory, string> = {
  technique:   'Tech',
  tactics:     'Tactics',
  games:       'Games',
  competition: 'Comp',
  movement:    'Move',
  mental:      'Mental',
  fun:         'Fun',
}

export const MODEL_DESCRIPTIONS: Record<InferredModel, string> = {
  high_performance:   'A competitive junior academy focused on tournament results and structured development',
  junior_development: 'A junior development academy focused on player improvement and long-term growth',
  recreational:       'A recreational academy focused on enjoyment, fitness, and player engagement',
  private_coaching:   'A private coaching program focused on individual attention and personalized development',
  dual_track:         'A dual-track academy running development and recreational programs in parallel',
}

export const MODEL_LABELS: Record<InferredModel, string> = {
  high_performance:   'High Performance Academy',
  junior_development: 'Junior Development Academy',
  recreational:       'Recreational Academy',
  private_coaching:   'Private Coaching Program',
  dual_track:         'Dual-Track Academy',
}

export const COACHING_STYLE_BY_MODEL: Record<InferredModel, { label: string; description: string }> = {
  high_performance: {
    label:       'Performance-Technical',
    description: 'Technical precision and tactical discipline — building toward competition readiness',
  },
  junior_development: {
    label:       'Fundamentals-to-Game',
    description: 'Technical fundamentals first, building toward tactical application as players develop',
  },
  recreational: {
    label:       'Joy-Retention',
    description: 'Play-first approach — keeping players engaged, active, and coming back',
  },
  private_coaching: {
    label:       'Individual-Technical',
    description: 'Highly personalized technical development — each player\'s program is unique',
  },
  dual_track: {
    label:       'Split-Track',
    description: 'Two parallel approaches: development-focused for competitive players, play-focused for recreational',
  },
}

export const DEFAULTS_BY_MODEL: Record<InferredModel, {
  assessment_cadence:    string
  coach_comm_format:     string
  parent_comm_tone:      string
  player_mission_style:  string
}> = {
  high_performance: {
    assessment_cadence:   'monthly',
    coach_comm_format:    'data_driven',
    parent_comm_tone:     'outcome_focused',
    player_mission_style: 'progress_focused',
  },
  junior_development: {
    assessment_cadence:   'every_6_weeks',
    coach_comm_format:    'structured',
    parent_comm_tone:     'progress_focused',
    player_mission_style: 'progress_focused',
  },
  recreational: {
    assessment_cadence:   'quarterly',
    coach_comm_format:    'conversational',
    parent_comm_tone:     'minimal',
    player_mission_style: 'progress_focused',
  },
  private_coaching: {
    assessment_cadence:   'director_triggered',
    coach_comm_format:    'structured',
    parent_comm_tone:     'progress_focused',
    player_mission_style: 'progress_focused',
  },
  dual_track: {
    assessment_cadence:   'every_6_weeks',
    coach_comm_format:    'structured',
    parent_comm_tone:     'progress_focused',
    player_mission_style: 'progress_focused',
  },
}

export const PORTAL_RULES_BY_TRANSPARENCY: Record<ParentTransparency, {
  domain_scores:         boolean
  competition_history:   boolean
  donna_recommendations: boolean
  raw_coach_notes:       boolean
  rankings:              boolean
}> = {
  minimal:     { domain_scores: false, competition_history: false, donna_recommendations: false, raw_coach_notes: false, rankings: false },
  standard:    { domain_scores: true,  competition_history: false, donna_recommendations: false, raw_coach_notes: false, rankings: false },
  transparent: { domain_scores: true,  competition_history: true,  donna_recommendations: true,  raw_coach_notes: false, rankings: true  },
}

export const ADVANCEMENT_APPROVAL_LABELS: Record<AdvancementApproval, string> = {
  director_only:                 'I approve every advancement personally',
  donna_flags_director_confirms: 'DONNA flags it, I confirm quickly',
  coach_recommends_notified:     'Coaches recommend, I\'m notified',
  assessment_driven:             'Automatic based on assessment data',
}

export const ADVANCEMENT_APPROVAL_GATE: Record<AdvancementApproval, string> = {
  director_only:                 'director_only',
  donna_flags_director_confirms: 'strict',
  coach_recommends_notified:     'balanced',
  assessment_driven:             'assessment_driven',
}

export const TRANSPARENCY_DESCRIPTIONS: Record<ParentTransparency, string> = {
  minimal:     'Basics only. Enrolment status, upcoming sessions, attendance. You manage communication directly.',
  standard:    'Progress updates and level milestones. Parents see development summaries — no raw scores.',
  transparent: 'Detailed progress data. Parents see domain scores, development trends, and level position.',
}

export const DIRECTOR_CHALLENGE_OPTIONS: {
  value:       DirectorChallenge
  label:       string
  description: string
}[] = [
  {
    value:       'player_advancement',
    label:       'Knowing when players are ready to move up',
    description: 'Advancement decisions, level tracking, and progression visibility',
  },
  {
    value:       'coach_accountability',
    label:       'Keeping track of what my coaches are doing',
    description: 'Session quality, wrap-up completion, and coaching consistency',
  },
  {
    value:       'parent_communication',
    label:       'Managing parent expectations and communication',
    description: 'Progress updates, parent queries, and proactive communication',
  },
  {
    value:       'curriculum_structure',
    label:       'Building a consistent curriculum across all levels',
    description: 'Curriculum coverage, session design, and development pathways',
  },
  {
    value:       'not_sure_yet',
    label:       'Not sure yet — show me what matters most',
    description: 'DONNA will surface the most important signals from your data',
  },
]

export const DIRECTOR_CHALLENGE_LABELS: Record<DirectorChallenge, string> = {
  player_advancement:   'Knowing when players are ready to move up',
  coach_accountability: 'Keeping track of what my coaches are doing',
  parent_communication: 'Managing parent expectations',
  curriculum_structure: 'Building consistent curriculum',
  not_sure_yet:         'Not sure yet',
}

export const SETUP_CONTEXT_LABELS: Record<SetupContext, string> = {
  fresh_setup: 'Setting up a new academy',
  migrating:   'Moving from another system',
}

// ── Model inference ───────────────────────────────────────────────────────────

export function inferAcademyModel(
  playerMix: PlayerMix,
  familyPriorities: FamilyPriorities,
  ageGroups: AgeGroup[],
): InferredModel {
  const hasAdult = ageGroups.includes('adult')

  if (playerMix === 'private_small_group') return 'private_coaching'
  if (playerMix === 'recreational_adult') return 'recreational'

  if (playerMix === 'competitive_juniors') {
    if (familyPriorities === 'results_rankings') return 'high_performance'
    if (familyPriorities === 'individual_attention') return 'private_coaching'
    return 'junior_development'
  }

  // mixed — adult presence in a mixed program is a stronger dual-track signal than fitness_fun alone
  if (hasAdult) return 'dual_track'
  if (familyPriorities === 'fitness_fun') return 'recreational'
  return 'junior_development'
}

// ── Free-text academy description → model inference ───────────────────────────
// Keyword scoring — no external AI. Used for the intro question inference.

export function inferModelFromText(text: string): {
  playerMix:           PlayerMix
  familyPriorities:    FamilyPriorities
  confidence:          'high' | 'medium' | 'low'
  themes:              string[]
  hasDualTrackSignals: boolean
} | null {
  const trimmed = text.trim()
  if (trimmed.length < 50) return null

  const lower = trimmed.toLowerCase()

  const mixHits: Record<PlayerMix, number> = {
    competitive_juniors: 0,
    mixed:               0,
    recreational_adult:  0,
    private_small_group: 0,
  }
  const famHits: Record<FamilyPriorities, number> = {
    results_rankings:      0,
    development_enjoyment: 0,
    fitness_fun:           0,
    individual_attention:  0,
  }
  const themes: string[] = []

  const MIX_KW: Record<PlayerMix, string[]> = {
    competitive_juniors: [
      'competitive junior', 'tournament', 'junior program', 'usta', 'itf',
      'competing junior', 'high performance junior', 'performance program',
      'ranked junior', 'national junior', 'elite junior',
      'junior players', 'athlete development', 'player development',
    ],
    mixed: [
      'mixed', 'all ages', 'all levels', 'variety of player', 'both competitive',
      'different age', 'recreational and competitive', 'junior and adult',
      'competitive and recreational', 'multiple pathways', 'different player goals',
      'community and competitive', 'tournament and recreational',
      'junior and adult programs', 'two tracks', 'split track',
    ],
    recreational_adult:  ['recreational', 'adult player', 'social tennis', 'casual tennis', 'leisure', 'fitness class', 'adult league', 'adult program', 'fun tennis'],
    private_small_group: ['private lesson', 'private coaching', 'small group', 'one-on-one', '1-on-1', '1v1', 'semi-private', 'individual coaching', 'private tuition'],
  }

  const FAM_KW: Record<FamilyPriorities, string[]> = {
    results_rankings:      ['results', 'ranking', 'win', 'tournament results', 'advance through level', 'move up', 'competition result', 'national ranking', 'competitive outcome'],
    development_enjoyment: [
      'development', 'improve', 'long-term', 'love the game', 'enjoyment',
      'pathway', 'player growth', 'get better', 'overall development',
      'enjoy the sport', 'love tennis',
      'long-term development', 'foundations', 'fundamentals',
      'development pathway', 'process over results', 'love of the game',
      'build correctly', 'character development',
    ],
    fitness_fun:           ['fun', 'fitness', 'stay active', 'healthy', 'social', 'active lifestyle', 'just play', 'keep fit', 'enjoy playing', 'have fun'],
    individual_attention:  ['individual attention', 'personal', 'tailored program', 'each player', 'specific needs', 'focused coaching', 'personalised', 'bespoke', 'one to one'],
  }

  const DUAL_TRACK_KW = [
    'competitive and recreational', 'multiple pathways', 'different player goals',
    'community and competitive', 'tournament and recreational',
    'junior and adult programs', 'two tracks', 'split track',
  ]
  const hasDualTrackSignals = DUAL_TRACK_KW.some(kw => lower.includes(kw))

  for (const [mix, keywords] of Object.entries(MIX_KW)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        mixHits[mix as PlayerMix]++
        if (!themes.includes(kw)) themes.push(kw)
      }
    }
  }
  for (const [fam, keywords] of Object.entries(FAM_KW)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        famHits[fam as FamilyPriorities]++
      }
    }
  }

  const sortedMix = (Object.entries(mixHits) as [PlayerMix, number][]).sort((a, b) => b[1] - a[1])
  const sortedFam = (Object.entries(famHits) as [FamilyPriorities, number][]).sort((a, b) => b[1] - a[1])

  const topMix  = sortedMix[0]
  const topFam  = sortedFam[0]
  const total   = topMix[1] + topFam[1]

  const confidence: 'high' | 'medium' | 'low' =
    total >= 3 ? 'high'   :
    total >= 1 ? 'medium' :
                 'low'

  return {
    playerMix:           topMix[1] > 0 ? topMix[0] : 'mixed',
    familyPriorities:    topFam[1] > 0 ? topFam[0] : 'development_enjoyment',
    confidence,
    themes:              themes.slice(0, 4),
    hasDualTrackSignals,
  }
}

// ── Onboarding contradiction detection ────────────────────────────────────────
// Detects material disagreements between intro text and selected configuration.

export function detectOnboardingContradiction(
  introText: string,
  playerMix: PlayerMix,
  familyPriorities: FamilyPriorities,
  ageGroups: AgeGroup[],
): { message: string; details: string } | null {
  const lower = introText.toLowerCase()

  const HP_TEXT = [
    'high performance', 'elite', 'future pro', 'national ranking', 'atp', 'wta',
    'world class', 'top ranked', 'performance pathway', 'elite junior',
  ]
  const REC_TEXT = [
    'recreational', 'social tennis', 'casual tennis', 'leisure', 'adult league', 'social club',
  ]

  const hasHPText  = HP_TEXT.some(kw => lower.includes(kw))
  const hasRecText = REC_TEXT.some(kw => lower.includes(kw))

  const configIsRec = playerMix === 'recreational_adult' || familyPriorities === 'fitness_fun'
  const configIsHP  = playerMix === 'competitive_juniors' && familyPriorities === 'results_rankings'

  if (hasHPText && configIsRec) {
    return {
      message: "I may be misunderstanding something.",
      details: "Your description suggests a high-performance or elite focus, but your current profile looks recreational. Which is more accurate — the description or the selections?",
    }
  }

  if (hasHPText && !ageGroups.includes('high_performance') && ageGroups.length > 0 && !configIsRec) {
    return {
      message: "I may be misunderstanding something.",
      details: "Your description mentions high-performance or elite programs, but High Performance is not in your active levels. Did you mean to include it?",
    }
  }

  if (hasRecText && configIsHP) {
    return {
      message: "I may be misunderstanding something.",
      details: "Your description mentions recreational players, but your current selections point to a high-performance competitive academy. Which is more accurate?",
    }
  }

  return null
}

// ── Default rankings by model × stage ─────────────────────────────────────────

const HP  = ['technique', 'movement', 'fun', 'games', 'mental', 'tactics', 'competition'] as StageCategory[]
const HP2 = ['technique', 'tactics', 'movement', 'mental', 'games', 'fun', 'competition'] as StageCategory[]
const HP3 = ['tactics', 'technique', 'movement', 'mental', 'games', 'competition', 'fun'] as StageCategory[]
const HP4 = ['tactics', 'competition', 'technique', 'mental', 'movement', 'games', 'fun'] as StageCategory[]
const HP5 = ['competition', 'tactics', 'technique', 'mental', 'movement', 'games', 'fun'] as StageCategory[]
const JD1 = ['games', 'fun', 'movement', 'technique', 'mental', 'tactics', 'competition'] as StageCategory[]
const JD2 = ['games', 'movement', 'technique', 'fun', 'mental', 'tactics', 'competition'] as StageCategory[]
const JD3 = ['technique', 'games', 'tactics', 'movement', 'mental', 'fun', 'competition'] as StageCategory[]
const JD4 = ['technique', 'tactics', 'movement', 'mental', 'games', 'competition', 'fun'] as StageCategory[]
const JD5 = ['tactics', 'technique', 'competition', 'mental', 'movement', 'games', 'fun'] as StageCategory[]
const RC1 = ['fun', 'games', 'movement', 'mental', 'technique', 'tactics', 'competition'] as StageCategory[]
const RC2 = ['fun', 'movement', 'games', 'mental', 'technique', 'tactics', 'competition'] as StageCategory[]
const RC3 = ['games', 'fun', 'movement', 'mental', 'technique', 'tactics', 'competition'] as StageCategory[]
const RC4 = ['games', 'fun', 'movement', 'mental', 'tactics', 'technique', 'competition'] as StageCategory[]
const PC  = ['technique', 'movement', 'tactics', 'mental', 'games', 'fun', 'competition'] as StageCategory[]

export const DONNA_DEFAULT_RANKINGS: Record<InferredModel, Record<string, StageCategory[]>> = {
  high_performance: {
    red_ball:         HP,
    orange_ball:      HP2,
    green_ball:       HP3,
    yellow_ball:      HP4,
    high_performance: HP5,
  },
  junior_development: {
    red_ball:         JD1,
    orange_ball:      JD2,
    green_ball:       JD3,
    yellow_ball:      JD4,
    high_performance: JD5,
  },
  recreational: {
    red_ball:         RC1,
    orange_ball:      RC2,
    green_ball:       RC3,
    yellow_ball:      RC4,
    high_performance: JD5,
  },
  private_coaching: {
    red_ball:         PC,
    orange_ball:      PC,
    green_ball:       PC,
    yellow_ball:      PC,
    high_performance: PC,
  },
  dual_track: {
    red_ball:         JD1,
    orange_ball:      JD2,
    green_ball:       JD3,
    yellow_ball:      JD4,
    high_performance: HP5,
  },
}

export function getDefaultRanking(model: InferredModel, stage: string): StageCategory[] {
  return DONNA_DEFAULT_RANKINGS[model]?.[stage] ?? STAGE_CATEGORIES
}

// ── Composite pathway weights ─────────────────────────────────────────────────

export function computePathwayWeights(
  stagePriorities: Record<string, StagePriorityState>,
): Record<string, number> {
  const stages = Object.values(stagePriorities).filter(s => s.confirmed)
  if (stages.length === 0) return {}

  const totals: Record<string, number> = {}
  for (const stage of stages) {
    for (const [cat, w] of Object.entries(stage.weights)) {
      totals[cat] = (totals[cat] ?? 0) + w
    }
  }

  const result: Record<string, number> = {}
  for (const [cat, total] of Object.entries(totals)) {
    result[cat] = Math.round(total / stages.length)
  }

  // Normalize to exactly 100
  const sum = Object.values(result).reduce((a, b) => a + b, 0)
  if (sum !== 100 && sum > 0) {
    const topKey = Object.keys(result).sort((a, b) => (result[b] ?? 0) - (result[a] ?? 0))[0]
    if (topKey) result[topKey] += 100 - sum
  }

  return result
}

// ── DONNA phase openers ───────────────────────────────────────────────────────

export const DONNA_PHASE_OPENERS: Record<number, string> = {
  1: "Let's start with the basics — then describe what you're building in your own words. The more naturally you describe it, the better my starting model.",
  2: "Here's what I've pre-built for your program. Confirm what's right. Change what isn't.",
  3: "Almost done. Your team structure and parent settings — then one last question.",
  4: "Here is what I know about your academy. One real-world coaching question before I finalise your model.",
}

// ── Per-question DONNA context ────────────────────────────────────────────────

export interface DonnaQuestionContext {
  whyAsking:       string
  whatChanges:     string
  canChangeLater:  string
  differentAnswer: string
}

export const DONNA_QUESTION_CONTEXT: Record<string, DonnaQuestionContext> = {
  Q_INTRO: {
    whyAsking:       'The more naturally you describe your academy, the better I can calibrate my starting model. There are no wrong answers — I\'m listening for your voice, not filling out a form.',
    whatChanges:     'Your description shapes how I understand your identity before asking structured questions. I\'ll extract themes and propose an academy type — you confirm or adjust.',
    canChangeLater:  'Academy Settings → Identity at any time.',
    differentAnswer: 'Even a brief description helps. Try: "We run [X] players from [age groups] and families care most about [what]."',
  },
  Q_SETUP_CONTEXT: {
    whyAsking:       'Fresh setup means your first brief focuses on getting started. Migrating means I know you have existing players and workflows — I\'ll prioritise data import over setup scaffolding.',
    whatChanges:     'Your first director brief. The setup steps I surface. Whether I focus on onboarding new players or verifying existing ones.',
    canChangeLater:  'This affects only the first-week experience. No long-term effect on my model.',
    differentAnswer: 'Selecting "migrating" when starting fresh just adds some import-focused prompts that won\'t apply. No harm done.',
  },
  Q1: {
    whyAsking:       'DONNA uses your academy name everywhere — in briefings, reports, and recommendations. Without it, everything is unnamed.',
    whatChanges:     'Every DONNA output, every director brief, every parent communication becomes personalised to your academy.',
    canChangeLater:  'Academy Settings → Profile at any time.',
    differentAnswer: 'A different name changes nothing about how DONNA works — only how it refers to your academy.',
  },
  Q2: {
    whyAsking:       'This is the most important signal I use to build my model of your academy. Your player mix shapes the curriculum structure, session intensity, and pathway goals I suggest.',
    whatChanges:     'My entire starting model shifts: curriculum levels, session templates, development priorities, and what "good progress" looks like for your players.',
    canChangeLater:  'Academy Settings → Classification. Changing it re-runs the model inference.',
    differentAnswer: 'Telling me recreational instead of competitive means I suggest lighter competition prep, more engagement-focused curriculum, and a completely different parent communication tone.',
  },
  Q3: {
    whyAsking:       'What families care about shapes how I communicate with them and how I frame player progress in every report.',
    whatChanges:     'Parent portal tone, progress update framing, and how DONNA describes player development in all parent-facing content.',
    canChangeLater:  'Academy Settings → Parent Communication.',
    differentAnswer: 'Families who care about results get outcome-focused reports. Families who care about enjoyment get engagement-focused ones. The underlying data is the same — the framing changes.',
  },
  Q4: {
    whyAsking:       'This tells me which curriculum stages to build and which levels will have active players from day one.',
    whatChanges:     'Your active curriculum levels, session templates, and all stage-based recommendations. Only selected levels get curriculum content built.',
    canChangeLater:  'Academy Settings → Program Structure. New levels can be activated after launch.',
    differentAnswer: 'Fewer levels means a simpler, more focused curriculum. More levels means more curriculum to maintain.',
  },
  Q5: {
    whyAsking:       'I need to know whether to build your curriculum content now or prepare the structure for your import.',
    whatChanges:     'AcademyOS Curriculum means you have working curriculum on day one. Import mode means I set up structure and wait for your content before making recommendations.',
    canChangeLater:  'Contact support to switch modes after launch.',
    differentAnswer: 'Choosing Import means slower first-week recommendations — I need your content before I can suggest what to work on.',
  },
  Q6: {
    whyAsking:       'These priorities tell me what matters most for players at each stage. They shape every curriculum recommendation, assessment emphasis, and session design.',
    whatChanges:     'Curriculum coverage priorities, assessment weighting, session template block allocation, and what I flag as gaps.',
    canChangeLater:  'Academy Settings → Stage Priorities. Each stage can be tuned independently.',
    differentAnswer: 'Putting Competition higher for younger players means I suggest more match play. Lower means more technical foundation before competition exposure.',
  },
  Q8: {
    whyAsking:       'Session duration affects how I build your session templates and how I evaluate coach time management in wrap-up reports.',
    whatChanges:     'All session template block ratios, coach time budget guidance, and session health scoring in DONNA briefings.',
    canChangeLater:  'Academy Settings → Session Defaults.',
    differentAnswer: 'Shorter sessions need tighter drill cycles and less warm-up overhead. The coaching style stays the same; the time allocation changes.',
  },
  Q9: {
    whyAsking:       'This sets who has authority to move players between levels. It\'s the most important governance decision in your academy.',
    whatChanges:     'Whether I flag, request approval, or wait for explicit confirmation before suggesting player advancement.',
    canChangeLater:  'Academy Settings → Advancement Rules.',
    differentAnswer: 'Director-only means nothing moves without you. Assessment-driven means players advance automatically when data crosses the threshold.',
  },
  Q10: {
    whyAsking:       'This sets what parents can see in their portal from day one. All five visibility flags are set from this single choice.',
    whatChanges:     'Parent portal visibility for domain scores, competition history, DONNA recommendations, and level rankings. Raw coach notes are never visible at any level.',
    canChangeLater:  'Parent Portal Settings → Visibility. Individual flags can be overridden per setting.',
    differentAnswer: 'Transparent gives parents full development data. Minimal means you manage all parent communication directly. Standard is the most common starting point.',
  },
  Q_CHALLENGE: {
    whyAsking:       'I surface different things on day one depending on what you\'re trying to solve. Without this, I\'ll default to the most common signals — which may not be your most important ones.',
    whatChanges:     'The first signals I surface in your director brief, what I highlight in the first week, and what I proactively flag vs. leave for you to discover.',
    canChangeLater:  'Director Preferences → DONNA Focus at any time.',
    differentAnswer: '"Not sure yet" means I start with the most commonly important signals and adjust based on what you actually engage with.',
  },
  Q_PRIORITY_EDGE: {
    whyAsking:       'This scenario has no right answer — it\'s how I learn your coaching philosophy. Two directors at identical academies give different answers based on their coaching school. Both are valid. I just need to know yours.',
    whatChanges:     'How I frame assessment recommendations when a player has both technical and tactical gaps. I\'ll align my language and priority signals to your philosophy.',
    canChangeLater:  'Academy Settings → Coaching Identity.',
    differentAnswer: '"Coach\'s judgment" is the safest default — I won\'t push in either direction and leave the call to whoever is on court.',
  },
}

// ── "What I still don't know" ─────────────────────────────────────────────────

export const DONNA_STILL_LEARNING: string[] = [
  'Coach execution patterns — how your coaches actually run sessions vs the template',
  'Parent engagement patterns — how families respond to communications',
  'Player progression patterns — where players advance, stall, or need support',
  'Session quality patterns — attendance trends, wrap-up completion, observation depth',
  'Assessment patterns — how frequently your academy assesses vs the cadence assumed',
]

// ── Donna quote templates ─────────────────────────────────────────────────────

const PLAYER_MIX_QUOTES: Record<PlayerMix, string> = {
  competitive_juniors: 'You told me your academy serves mostly competitive juniors aiming for tournaments.',
  mixed:               'You told me your academy serves a mixed player base — some competitive, mostly developmental.',
  recreational_adult:  'You told me your academy serves mostly recreational or adult players.',
  private_small_group: 'You told me your academy focuses primarily on private or small-group coaching.',
}

const FAMILY_PRIORITY_QUOTES: Record<FamilyPriorities, string> = {
  results_rankings:      'You told me families care most about results, rankings, and clear level progression.',
  development_enjoyment: 'You told me families care most about development, improvement, and enjoying the game.',
  fitness_fun:           'You told me families care most about fitness, fun, and staying active.',
  individual_attention:  'You told me families care most about individual attention and personalised feedback.',
}

const CURRICULUM_STARTING_QUOTES: Record<CurriculumStartingPoint, string> = {
  academyos_curriculum: 'You told me to start with the AcademyOS Curriculum — I built your curriculum content on launch.',
  import_curriculum:    'You told me you want to import your own curriculum — I set up the level structure and queued the import wizard.',
}

const PRIORITY_EDGE_QUOTES: Record<PriorityEdge, string> = {
  technical_first: 'You told me that when players struggle both technically and tactically, you address technical issues first.',
  tactical_first:  'You told me that when players struggle both technically and tactically, you focus on tactical understanding first.',
  coach_judgment:  'You told me that technical vs tactical priority should be left to the coach\'s judgment for each player.',
}

const ADVANCEMENT_QUOTES: Record<AdvancementApproval, string> = {
  director_only:                 'You told me you want to approve every player advancement personally.',
  donna_flags_director_confirms: 'You told me DONNA should flag when a player is ready to move up, and you\'ll confirm quickly.',
  coach_recommends_notified:     'You told me coaches can recommend advancement and you\'ll be notified before any level change takes effect.',
  assessment_driven:             'You told me advancement should happen automatically when assessment data crosses the threshold.',
}

const TRANSPARENCY_QUOTES: Record<ParentTransparency, string> = {
  minimal:     'You told me parents should have minimal visibility — basics only, with you managing communication directly.',
  standard:    'You told me parents should have standard visibility — progress updates and milestones, no raw scores.',
  transparent: 'You told me parents should have transparent visibility — detailed progress data including domain scores and development trends.',
}

const CHALLENGE_QUOTES: Record<DirectorChallenge, string> = {
  player_advancement:   'You told me your biggest challenge is knowing when players are ready to move up.',
  coach_accountability: 'You told me your biggest challenge is keeping track of what your coaches are doing.',
  parent_communication: 'You told me your biggest challenge is managing parent expectations and communication.',
  curriculum_structure: 'You told me your biggest challenge is building a consistent curriculum across all levels.',
  not_sure_yet:         'You told me you weren\'t sure yet which challenge to prioritise — I\'ll surface the most important signals from your data.',
}

const SETUP_CONTEXT_QUOTES: Record<SetupContext, string> = {
  fresh_setup: 'You told me you\'re setting up a new academy from scratch.',
  migrating:   'You told me you\'re moving from another system and have existing players and workflows to migrate.',
}

export function buildStagePriorityQuote(stage: string, ranking: StageCategory[]): string {
  const stageLabel = STAGE_LABELS[stage] ?? stage
  const top3 = ranking.slice(0, 3).map(c => CATEGORY_LABELS[c]).join(', ')
  const last  = CATEGORY_LABELS[ranking[ranking.length - 1]] ?? ''
  return `You told me that for ${stageLabel} players, the top priorities are ${top3} — with ${last} last.`
}

// ── Build full onboarding_conversation statements ─────────────────────────────

export interface OnboardingConversationStatement {
  key:          string
  question:     string
  answer_value: string
  answer_label: string
  donna_quote:  string
  affects:      string[]
}

export function buildOnboardingStatements(input: {
  academyName:             string
  playerMix:               PlayerMix
  familyPriorities:        FamilyPriorities
  ageGroups:               AgeGroup[]
  curriculumStartingPoint: CurriculumStartingPoint
  stagePriorities:         Record<string, StagePriorityState>
  priorityEdge:            PriorityEdge
  sessionDurationMinutes:  SessionDuration
  advancementApproval:     AdvancementApproval
  parentTransparency:      ParentTransparency
  setupContext:            SetupContext
  directorChallenge:       DirectorChallenge
  introText?:              string
}): OnboardingConversationStatement[] {
  const statements: OnboardingConversationStatement[] = []

  if (input.introText) {
    statements.push({
      key:          'intro_text',
      question:     'Tell me about your academy and what you\'re trying to build.',
      answer_value: input.introText,
      answer_label: input.introText.slice(0, 120) + (input.introText.length > 120 ? '…' : ''),
      donna_quote:  `The director described their academy as: "${input.introText.slice(0, 200)}${input.introText.length > 200 ? '…' : ''}"`,
      affects:      ['Academy identity context', 'DONNA conversational tone'],
    })
  }

  statements.push({
    key:          'setup_context',
    question:     'Are you setting up a new academy or moving from another system?',
    answer_value: input.setupContext,
    answer_label: SETUP_CONTEXT_LABELS[input.setupContext],
    donna_quote:  SETUP_CONTEXT_QUOTES[input.setupContext],
    affects:      ['First-day director brief', 'Setup step prioritisation'],
  })

  statements.push({
    key:          'academy_name',
    question:     'What is your academy called?',
    answer_value: input.academyName,
    answer_label: input.academyName,
    donna_quote:  `You told me your academy is called ${input.academyName}.`,
    affects:      ['All DONNA output labels', 'Director briefing header', 'Parent communications'],
  })

  statements.push({
    key:          'player_mix',
    question:     'What does your player mix look like?',
    answer_value: input.playerMix,
    answer_label: {
      competitive_juniors: 'Mostly competitive juniors aiming for tournaments',
      mixed:               'Mixed — some competitive, mostly developmental',
      recreational_adult:  'Mostly recreational or adult players',
      private_small_group: 'Primarily private or small-group lessons',
    }[input.playerMix],
    donna_quote:  PLAYER_MIX_QUOTES[input.playerMix],
    affects:      ['Academy model', 'Curriculum structure', 'Session intensity', 'Pathway goals'],
  })

  statements.push({
    key:          'family_priorities',
    question:     'What matters most to the families you serve?',
    answer_value: input.familyPriorities,
    answer_label: {
      results_rankings:      'Results, rankings, and clear level progression',
      development_enjoyment: 'Development, improvement, and enjoying the game',
      fitness_fun:           'Fitness, fun, and staying active',
      individual_attention:  'Individual attention and personalised feedback',
    }[input.familyPriorities],
    donna_quote:  FAMILY_PRIORITY_QUOTES[input.familyPriorities],
    affects:      ['Parent communication tone', 'Progress framing', 'Academy model weighting'],
  })

  statements.push({
    key:          'age_groups',
    question:     'Which levels are active in your program?',
    answer_value: input.ageGroups.join(','),
    answer_label: input.ageGroups.map(g => AGE_GROUP_LABELS[g]).join(', '),
    donna_quote:  `You told me your program covers: ${input.ageGroups.map(g => AGE_GROUP_LABELS[g]).join(', ')}.`,
    affects:      ['Active curriculum levels', 'Stage-based recommendations', 'Session templates'],
  })

  statements.push({
    key:          'curriculum_starting_point',
    question:     'How do you want to start your curriculum?',
    answer_value: input.curriculumStartingPoint,
    answer_label: input.curriculumStartingPoint === 'academyos_curriculum'
      ? 'Start with AcademyOS Curriculum'
      : 'Import My Curriculum',
    donna_quote:  CURRICULUM_STARTING_QUOTES[input.curriculumStartingPoint],
    affects:      ['Curriculum content availability', 'First-week recommendations'],
  })

  // Stage priorities — one statement per stage
  for (const [stage, priority] of Object.entries(input.stagePriorities)) {
    if (!priority.confirmed) continue
    statements.push({
      key:          `stage_priority_${stage}`,
      question:     `What are the priorities for ${STAGE_LABELS[stage] ?? stage} players?`,
      answer_value: priority.ranking.join(','),
      answer_label: priority.ranking.slice(0, 3).map(c => CATEGORY_LABELS[c]).join(', ') + ' (top 3)',
      donna_quote:  buildStagePriorityQuote(stage, priority.ranking),
      affects:      [
        `${STAGE_LABELS[stage] ?? stage} curriculum weighting`,
        `${STAGE_LABELS[stage] ?? stage} assessment emphasis`,
        `${STAGE_LABELS[stage] ?? stage} session design`,
      ],
    })
  }

  statements.push({
    key:          'priority_edge',
    question:     'Last 5 minutes. A player has a broken forehand loop and keeps making the wrong call at the net. What does the coach work on first?',
    answer_value: input.priorityEdge,
    answer_label: {
      technical_first: 'Technical — fix stroke mechanics first',
      tactical_first:  'Tactical — patterns and decisions first',
      coach_judgment:  'Coach\'s judgment',
    }[input.priorityEdge],
    donna_quote:  PRIORITY_EDGE_QUOTES[input.priorityEdge],
    affects:      ['Pathway weighting', 'Assessment recommendations', 'Progression suggestions'],
  })

  statements.push({
    key:          'session_duration_minutes',
    question:     'How long are your typical sessions?',
    answer_value: String(input.sessionDurationMinutes),
    answer_label: input.sessionDurationMinutes === 120 ? '2 hours' : `${input.sessionDurationMinutes} min`,
    donna_quote:  `You told me your sessions run ${input.sessionDurationMinutes === 120 ? '2 hours' : `${input.sessionDurationMinutes} minutes`}.`,
    affects:      ['Session template block ratios', 'Coach time budget', 'Session health scoring'],
  })

  statements.push({
    key:          'advancement_approval',
    question:     'When a player is ready to move up, who makes the call?',
    answer_value: input.advancementApproval,
    answer_label: ADVANCEMENT_APPROVAL_LABELS[input.advancementApproval],
    donna_quote:  ADVANCEMENT_QUOTES[input.advancementApproval],
    affects:      ['Level gate strictness', 'DONNA promotion recommendations', 'Director approval queue'],
  })

  statements.push({
    key:          'parent_transparency',
    question:     'How transparent do you want to be with parents?',
    answer_value: input.parentTransparency,
    answer_label: { minimal: 'Minimal', standard: 'Standard', transparent: 'Transparent' }[input.parentTransparency],
    donna_quote:  TRANSPARENCY_QUOTES[input.parentTransparency],
    affects:      ['Parent portal visibility', 'All 5 portal flags', 'Parent communication defaults'],
  })

  statements.push({
    key:          'director_challenge',
    question:     'What\'s the biggest challenge you want DONNA to help solve?',
    answer_value: input.directorChallenge,
    answer_label: DIRECTOR_CHALLENGE_LABELS[input.directorChallenge],
    donna_quote:  CHALLENGE_QUOTES[input.directorChallenge],
    affects:      ['First director brief focus', 'DONNA proactive surfacing priorities'],
  })

  return statements
}
