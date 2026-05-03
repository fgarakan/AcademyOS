// Player Progress Q&A — Sprint 218
// Pure deterministic helper. No DB calls. No AI. No side effects. No writes.
// Used by PlayerQaPreviewPanel (director preview only — player portal not yet built).

export type PlayerProgressQuestionIntent =
  | 'current_level'
  | 'next_level'
  | 'level_requirements'
  | 'what_to_practice'
  | 'level_meaning'
  | 'unknown'

export interface QaGateRow {
  id: string
  domain: string
  criterion: string
  threshold: string
  evaluator: string
  cadence: string
  evidence_window: string | null
}

export interface QaDrillRow {
  id: string
  name: string
  domain: string
  session_block: string
  objective: string
}

export interface QaCoachLanguageRow {
  domain: string
  doing_well: string
  working_on: string
  current_focus: string
  next_step: string
}

export interface PlayerProgressQaInput {
  currentLevelName: string | null
  currentLevelStage: string | null
  nextLevelName: string | null
  hasCurriculumState: boolean
  gates: QaGateRow[]
  drills: QaDrillRow[]
  coachLanguage: QaCoachLanguageRow[]
}

export interface PlayerProgressQaAnswer {
  question_intent: PlayerProgressQuestionIntent
  title: string
  answer: string
  bullets: string[]
  next_mission: string | null
  safety_note: string | null
  source_labels: string[]
  blocked_reason: string | null
}

export function parsePlayerProgressQuestion(question: string): PlayerProgressQuestionIntent {
  const q = question.toLowerCase().trim()
  if (q.length === 0) return 'unknown'
  if (/\b(what level|my level|which level|am i|current level)\b/.test(q)) return 'current_level'
  if (/\b(what do i need|need to do|do next|next mission|what next|what.*next)\b/.test(q)) return 'next_level'
  if (/\b(move up|level up|advance|advancement|promotion|how do i|progress|get to next)\b/.test(q)) return 'level_requirements'
  if (/\b(practice|drills?|work on|improve|exercise|train|should i do|what should)\b/.test(q)) return 'what_to_practice'
  if (/\b(mean|meaning|what is|about this|tell me|explain|describe|what does)\b/.test(q)) return 'level_meaning'
  return 'unknown'
}

export function buildPlayerProgressAnswer(
  intent: PlayerProgressQuestionIntent,
  input: PlayerProgressQaInput,
): PlayerProgressQaAnswer {
  if (!input.hasCurriculumState) {
    return {
      question_intent: intent,
      title: 'No level assigned yet',
      answer:
        'Your academy has not assigned a curriculum level yet. A coach or director can set your starting point.',
      bullets: [],
      next_mission: null,
      safety_note: null,
      source_labels: [],
      blocked_reason: null,
    }
  }

  const levelName = input.currentLevelName ?? 'your current level'
  const nextName = input.nextLevelName ?? null
  const stage = input.currentLevelStage
    ? input.currentLevelStage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null

  switch (intent) {
    case 'current_level': {
      return {
        question_intent: 'current_level',
        title: `You're working in ${levelName}`,
        answer: `You are currently in ${levelName}${stage ? ` — ${stage} stage` : ''}.${nextName ? ` Your next target is ${nextName}.` : ''}`,
        bullets: nextName ? [`Next target: ${nextName}`] : [],
        next_mission: nextName ? `Keep building toward ${nextName}` : null,
        safety_note: null,
        source_labels: ['curriculum level', 'player curriculum state'],
        blocked_reason: null,
      }
    }

    case 'next_level': {
      const focusPhrases = input.coachLanguage
        .slice(0, 3)
        .map((cl) => cl.current_focus)
        .filter(Boolean)
      return {
        question_intent: 'next_level',
        title: nextName ? `Your next target is ${nextName}` : 'Keep building in your current level',
        answer: nextName
          ? `Your next target is ${nextName}. Here are the key areas to build to get there.`
          : `You are in ${levelName}. Focus on the skill areas your coach has outlined and keep showing up.`,
        bullets: focusPhrases,
        next_mission: focusPhrases[0] ?? null,
        safety_note: null,
        source_labels: ['curriculum level', 'coach language'],
        blocked_reason: null,
      }
    }

    case 'level_requirements': {
      const gateTexts = input.gates.slice(0, 5).map((g) => g.criterion)
      return {
        question_intent: 'level_requirements',
        title: 'What it takes to move up',
        answer:
          gateTexts.length > 0
            ? `To move from ${levelName}${nextName ? ` to ${nextName}` : ' to the next level'}, show progress in these areas:`
            : `Talk with your coach — they will walk you through exactly what to focus on for your next step.`,
        bullets: gateTexts,
        next_mission: gateTexts[0] ?? null,
        safety_note: null,
        source_labels: ['curriculum gates', 'curriculum level'],
        blocked_reason: null,
      }
    }

    case 'what_to_practice': {
      const drillLines = input.drills
        .slice(0, 5)
        .map((d) => `${d.name} — ${d.objective}`)
      const topFocus = input.coachLanguage[0]?.current_focus ?? null
      return {
        question_intent: 'what_to_practice',
        title: 'What to work on right now',
        answer: topFocus
          ? `Your current focus area is: ${topFocus}. These drills will help you build that skill.`
          : `Here are some drills your coach uses at your level.`,
        bullets:
          drillLines.length > 0
            ? drillLines
            : ['Ask your coach to walk you through your current drill set.'],
        next_mission: topFocus,
        safety_note: null,
        source_labels: ['curriculum drills', 'coach language'],
        blocked_reason: null,
      }
    }

    case 'level_meaning': {
      const doingWell = input.coachLanguage
        .slice(0, 3)
        .map((cl) => cl.doing_well)
        .filter(Boolean)
      const workingOn = input.coachLanguage
        .slice(0, 3)
        .map((cl) => cl.working_on)
        .filter(Boolean)
      return {
        question_intent: 'level_meaning',
        title: `About ${levelName}`,
        answer: `${levelName} is a stage where you build the core skills that create the foundation for everything that comes next in your tennis journey.`,
        bullets: [
          ...doingWell.slice(0, 2).map((s) => `Building: ${s}`),
          ...workingOn.slice(0, 2).map((s) => `Working on: ${s}`),
        ],
        next_mission: null,
        safety_note: null,
        source_labels: ['curriculum level', 'coach language'],
        blocked_reason: null,
      }
    }

    default: {
      return {
        question_intent: 'unknown',
        title: 'Try one of these questions',
        answer:
          'Ask about your level, what to practice, how to move up, or what your level means.',
        bullets: [
          'What level am I?',
          'What should I practice?',
          'How do I move up?',
          'What does this level mean?',
        ],
        next_mission: null,
        safety_note: null,
        source_labels: [],
        blocked_reason: null,
      }
    }
  }
}
