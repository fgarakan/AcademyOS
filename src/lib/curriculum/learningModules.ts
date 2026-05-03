// Curriculum Learning Modules — Sprint 219
// Pure deterministic helper. No DB calls. No AI. No side effects. No writes.
// Generates learning module previews from existing seeded curriculum data.
// Player-facing language: mission-based, encouraging, no ranking or shaming.
// Parent-facing tips: safe tone, no deficit language, no comparisons.

export type LearningModuleDomain =
  | 'Technical'
  | 'Tactical'
  | 'Movement'
  | 'Competition'
  | 'Mentality'
  | 'Fitness'
  | 'Recovery'
  | 'Lifestyle'

export const ALL_LEARNING_DOMAINS: LearningModuleDomain[] = [
  'Technical', 'Tactical', 'Movement', 'Competition',
  'Mentality', 'Fitness', 'Recovery', 'Lifestyle',
]

export interface CurriculumLearningModule {
  module_id: string
  level_id: string
  level_name: string
  level_stage: string
  domain: LearningModuleDomain
  title: string
  player_goal: string
  why_it_matters: string
  key_idea: string
  watch_for: string
  try_this: string
  mini_challenge: string
  reflection_question: string
  parent_support_tip: string
  related_gate_ids: string[]
  related_drill_ids: string[]
  source_labels: string[]
  safety_note: string | null
}

// ── Input types ────────────────────────────────────────────────────────────────

interface LevelInput {
  id: string
  display_name: string
  stage: string
}

interface GateInput {
  id: string
  from_level_id: string
  domain: string
  criterion: string
  threshold: string
}

interface DrillInput {
  id: string
  level_min_id: string | null
  domain: string
  name: string
  objective: string
}

interface CoachLangInput {
  level_id: string
  domain: string
  doing_well: string
  working_on: string
  current_focus: string
  next_step: string
}

export interface LearningModulePreviewInput {
  levels: LevelInput[]
  gates: GateInput[]
  drills: DrillInput[]
  coachLanguage: CoachLangInput[]
}

export interface LearningModuleSingleInput {
  levelId: string
  levelName: string
  levelStage: string
  domain: LearningModuleDomain
  gates: GateInput[]
  drills: DrillInput[]
  coachLang: CoachLangInput | null
}

// ── Reflection questions by domain ────────────────────────────────────────────

const REFLECTION_QUESTIONS: Record<string, string> = {
  Technical:   'When did your technique feel the most natural today? What were you doing differently?',
  Tactical:    'Was there a moment where you made a great decision? What led to that choice?',
  Movement:    'Did you feel balanced and ready after each shot? What helped you recover quickly?',
  Competition: 'How did you respond when things did not go your way? What will you try differently next time?',
  Mentality:   'What is one thing you can celebrate from today, even if the result was not perfect?',
  Fitness:     'Did you feel strong throughout the whole session, or did your energy drop? What might help?',
  Recovery:    'Are you giving your body what it needs to come back strong? What is one recovery habit you can add?',
  Lifestyle:   'Are you sleeping, eating, and taking care of yourself in a way that supports your tennis goals?',
}

// ── Parent support tips by domain ─────────────────────────────────────────────

const PARENT_SUPPORT_TIPS: Record<string, string> = {
  Technical:
    'After practice, ask your child what skill they focused on — let them explain it to you in their own words. That conversation reinforces what they learned.',
  Tactical:
    'Encourage your child to describe a moment when they made a smart decision on court. Focus on the thinking process, not just the result.',
  Movement:
    'Notice and comment on how your child moves and recovers on court. Energy and balance matter just as much as shots.',
  Competition:
    'After a tough match, focus on effort and resilience: "I noticed you kept trying." Avoid focusing only on wins and losses.',
  Mentality:
    'Help your child see each session as progress, not performance. Ask: what did you try today that was hard for you?',
  Fitness:
    "Support your child's energy by encouraging good sleep and balanced food choices — these make a real difference on court.",
  Recovery:
    'Remind your child that rest is part of training. Rest days are not lazy — they are how the body and mind get stronger.',
  Lifestyle:
    'A consistent routine around sleep, food, and downtime helps your child show up ready to focus and learn.',
}

// ── Core builders ──────────────────────────────────────────────────────────────

export function buildModuleForLevelDomain(
  input: LearningModuleSingleInput,
): CurriculumLearningModule {
  const { levelId, levelName, levelStage, domain, gates, drills, coachLang } = input

  const module_id = `${levelId}_${domain.toLowerCase()}`

  const domainGates = gates.filter(
    (g) => g.from_level_id === levelId && g.domain === domain,
  )
  const domainDrills = drills.filter(
    (d) => d.level_min_id === levelId && d.domain === domain,
  )

  const firstGate = domainGates[0] ?? null
  const firstDrill = domainDrills[0] ?? null

  const title = coachLang
    ? `${levelName} — ${domain}: ${coachLang.current_focus}`
    : `${levelName} — ${domain}`

  const player_goal =
    coachLang?.current_focus ||
    `Build your ${domain.toLowerCase()} skills in ${levelName}`

  const why_it_matters = coachLang
    ? `You are building: ${coachLang.doing_well}. This creates the foundation for everything that comes next in your game.`
    : `Strong ${domain.toLowerCase()} skills at this stage make every other part of your game easier to develop.`

  const key_idea =
    coachLang?.working_on ||
    `Focus on consistency and building good habits with your ${domain.toLowerCase()}.`

  const watch_for = firstGate
    ? `Show that you can: ${firstGate.criterion}${firstGate.threshold ? ` (target: ${firstGate.threshold})` : ''}`
    : `Talk with your coach about what they are watching for in your ${domain.toLowerCase()} at this stage.`

  const try_this = firstDrill
    ? `${firstDrill.name} — ${firstDrill.objective}`
    : `Ask your coach to show you a ${domain.toLowerCase()} drill that fits your current level.`

  const mini_challenge =
    coachLang?.next_step ||
    `This week, pick one moment per session to apply your ${domain.toLowerCase()} skill with full focus.`

  const reflection_question =
    REFLECTION_QUESTIONS[domain] ??
    `What is one thing you learned about your ${domain.toLowerCase()} today?`

  const parent_support_tip =
    PARENT_SUPPORT_TIPS[domain] ??
    `Support your child by showing interest in what they are working on — without adding pressure.`

  const sourceLabels = ['curriculum coach language']
  if (domainGates.length > 0) sourceLabels.push('curriculum gates')
  if (domainDrills.length > 0) sourceLabels.push('curriculum drills')

  return {
    module_id,
    level_id: levelId,
    level_name: levelName,
    level_stage: levelStage,
    domain,
    title,
    player_goal,
    why_it_matters,
    key_idea,
    watch_for,
    try_this,
    mini_challenge,
    reflection_question,
    parent_support_tip,
    related_gate_ids: domainGates.map((g) => g.id),
    related_drill_ids: domainDrills.map((d) => d.id),
    source_labels: sourceLabels,
    safety_note: null,
  }
}

export function buildLearningModulePreviews(
  input: LearningModulePreviewInput,
): CurriculumLearningModule[] {
  const modules: CurriculumLearningModule[] = []

  for (const level of input.levels) {
    for (const domain of ALL_LEARNING_DOMAINS) {
      const coachLang =
        input.coachLanguage.find(
          (cl) => cl.level_id === level.id && cl.domain === domain,
        ) ?? null

      if (!coachLang) continue

      modules.push(
        buildModuleForLevelDomain({
          levelId: level.id,
          levelName: level.display_name,
          levelStage: level.stage,
          domain,
          gates: input.gates,
          drills: input.drills,
          coachLang,
        }),
      )
    }
  }

  return modules
}

// ── Safety note by role ────────────────────────────────────────────────────────

export function getLearningModuleSafetyNote(role: string): string {
  switch (role) {
    case 'platform_owner':
    case 'academy_director':
      return 'Director view — all curriculum learning module content. Review before sharing with players or parents.'
    case 'head_coach':
    case 'coach':
      return 'Coach reference — curriculum-level guidance only. Do not share internal coaching notes with players.'
    case 'player':
      return 'Your academy uses this content to support your growth. Your coach may update this guidance over time.'
    case 'parent':
      return "This guidance is designed to support your child's tennis journey. No personal assessment data is included."
    default:
      return 'Read-only curriculum preview. No personal data included.'
  }
}
