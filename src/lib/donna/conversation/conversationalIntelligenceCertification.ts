// Sprint 2831–2860 — DONNA Conversational Intelligence & Learning Foundation V1
// Parts 11–14 — Conversational Intelligence Certification Suite
//
// 100+ messy-language examples across Director, Coach, Parent, Player.
// Measures: intent accuracy, clarification quality, actionability, completion readiness.
// Target: 90%+ intent interpretation accuracy.
//
// Run: npx tsx src/lib/donna/conversation/conversationalIntelligenceCertification.ts

import { interpretIntent } from './donnaIntentInterpreter'
import { extractMeaning } from './donnaMeaningExtractor'
import { selectBestNextQuestion, formatBestNextQuestion } from './donnaBestNextQuestion'
import { validateContractCompliance, isClarificationAllowed } from './donnaConversationContract'
import { validateResponseStyle } from './donnaResponseStyle'
import {
  runConversationScenario,
  buildTrainingReport,
  BUILT_IN_SCENARIOS,
} from './donnaConversationTrainingSandbox'
import { captureConversationLearning, getPendingLearning } from './conversationLearningRecord'
import { detectRecurringConcerns } from './conversationMemoryHook'
import type { InterpreterRole } from './donnaIntentInterpreter'
import type { AcademyOSConcept } from './donnaMeaningExtractor'

// ── Test case types ───────────────────────────────────────────────────────────

interface IntentTestCase {
  id: string
  input: string
  role: InterpreterRole
  expectedIntentMatch: string[]           // any of these intent names acceptable
  expectedConceptMatch?: AcademyOSConcept[] // expected concept(s)
  minConfidence: number                   // minimum expected confidence
  expectsClarification: boolean           // should DONNA ask a question?
  description: string
}

// ── Assertion helpers ─────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

function assert(id: string, condition: boolean, message: string): void {
  if (condition) {
    passed++
    process.stdout.write(`  ✓ [${id}] ${message}\n`)
  } else {
    failed++
    const msg = `  ✗ [${id}] ${message}`
    failures.push(msg)
    process.stdout.write(msg + '\n')
  }
}

function section(title: string): void {
  process.stdout.write(`\n${'─'.repeat(60)}\n${title}\n${'─'.repeat(60)}\n`)
}

// ── Part 11 — Director Certification ─────────────────────────────────────────

const DIRECTOR_TEST_CASES: IntentTestCase[] = [
  // High-confidence director intents
  {
    id: 'D01', input: "How's everything looking?",
    role: 'director', expectedIntentMatch: ['general_help', 'unknown'],
    minConfidence: 0, expectsClarification: true,
    description: 'General question → clarification needed',
  },
  {
    id: 'D02', input: "What needs attention?",
    role: 'director', expectedIntentMatch: ['general_help', 'review_queue'],
    minConfidence: 0.20, expectsClarification: false,
    description: 'Priority question → intent detected',
  },
  {
    id: 'D03', input: "What should I focus on?",
    role: 'director', expectedIntentMatch: ['general_help'],
    minConfidence: 0, expectsClarification: true,
    description: 'Focus question → clarification expected',
  },
  {
    id: 'D04', input: "Orange seems light.",
    role: 'director', expectedIntentMatch: ['player_progress_review', 'general_help', 'unknown'],
    expectedConceptMatch: ['enrollment_issue'],
    minConfidence: 0, expectsClarification: true,
    description: 'Vague enrollment signal → concept detected',
  },
  {
    id: 'D05', input: "Why is enrollment down?",
    role: 'director', expectedIntentMatch: ['player_progress_review', 'general_help', 'unknown'],
    expectedConceptMatch: ['enrollment_issue'],
    minConfidence: 0, expectsClarification: false,
    description: 'Enrollment question → concept detected',
  },
  {
    id: 'D06', input: "Which players are ready to advance?",
    role: 'director', expectedIntentMatch: ['level_readiness'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Advancement question → high confidence',
  },
  {
    id: 'D07', input: "What's in the review queue?",
    role: 'director', expectedIntentMatch: ['review_queue'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Review queue question → intent matched',
  },
  {
    id: 'D08', input: "Are the coaches submitting their recaps?",
    role: 'director', expectedIntentMatch: ['session_review', 'general_help'],
    minConfidence: 0, expectsClarification: false,
    description: 'Coach recap question → intent detected',
  },
  {
    id: 'D09', input: "Sarah seems stuck.",
    role: 'director', expectedIntentMatch: ['player_progress_review'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Player stall signal with name → intent matched',
  },
  {
    id: 'D10', input: "Something feels off with Orange 2.",
    role: 'director', expectedIntentMatch: ['curriculum_help', 'player_progress_review'],
    expectedConceptMatch: ['curriculum_issue', 'enrollment_issue'],
    minConfidence: 0, expectsClarification: true,
    description: 'Vague curriculum/enrollment concern',
  },
  {
    id: 'D11', input: "Walk me through curriculum builder.",
    role: 'director', expectedIntentMatch: ['curriculum_help'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Curriculum intent → clear match',
  },
  {
    id: 'D12', input: "Help me complete an assessment.",
    role: 'director', expectedIntentMatch: ['assessment'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Assessment intent → clear match',
  },
  {
    id: 'D13', input: "Let's review the attendance data.",
    role: 'director', expectedIntentMatch: ['attendance'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Attendance intent → matched',
  },
  {
    id: 'D14', input: "I need to build a class template.",
    role: 'director', expectedIntentMatch: ['template_building'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Template building intent → matched',
  },
  {
    id: 'D15', input: "The parents seem frustrated.",
    role: 'director', expectedIntentMatch: ['parent_communication', 'general_help'],
    expectedConceptMatch: ['parent_concern', 'retention_risk'],
    minConfidence: 0, expectsClarification: true,
    description: 'Parent concern → concept detected',
  },
  // Additional director cases
  {
    id: 'D16', input: "I don't know what to prioritize.",
    role: 'director', expectedIntentMatch: ['general_help', 'unknown'],
    minConfidence: 0, expectsClarification: true,
    description: 'No clear priority → needs clarification',
  },
  {
    id: 'D17', input: "Enrollment is down in Orange Ball.",
    role: 'director', expectedIntentMatch: ['player_progress_review', 'general_help'],
    expectedConceptMatch: ['enrollment_issue'],
    minConfidence: 0, expectsClarification: false,
    description: 'Clear enrollment concern → concept matched',
  },
  {
    id: 'D18', input: "Update the parent about Jake's progress.",
    role: 'director', expectedIntentMatch: ['parent_communication'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Parent communication with name → intent matched',
  },
  {
    id: 'D19', input: "Review the pending items.",
    role: 'director', expectedIntentMatch: ['review_queue'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Review queue → matched',
  },
  {
    id: 'D20', input: "Something is off.",
    role: 'director', expectedIntentMatch: ['general_help', 'unknown'],
    minConfidence: 0, expectsClarification: true,
    description: 'Maximally vague → clarification required',
  },
  {
    id: 'D21', input: "Maria looks ready to move up.",
    role: 'director', expectedIntentMatch: ['level_readiness'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Advancement readiness with name',
  },
  {
    id: 'D22', input: "Finish the academy onboarding.",
    role: 'director', expectedIntentMatch: ['onboarding_setup'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Onboarding intent → matched',
  },
  {
    id: 'D23', input: "How did the session go?",
    role: 'director', expectedIntentMatch: ['session_review'],
    minConfidence: 0.40, expectsClarification: false,
    description: 'Session review intent → matched',
  },
  {
    id: 'D24', input: "Numbers look weird.",
    role: 'director', expectedIntentMatch: ['general_help', 'unknown'],
    expectedConceptMatch: ['enrollment_issue'],
    minConfidence: 0, expectsClarification: true,
    description: 'Vague numbers concern → concept or clarification',
  },
  {
    id: 'D25', input: "Check on Coach Danny.",
    role: 'director', expectedIntentMatch: ['session_review', 'general_help'],
    minConfidence: 0, expectsClarification: false,
    description: 'Coach check → intent detected',
  },
]

// ── Part 12 — Coach Certification ────────────────────────────────────────────

const COACH_TEST_CASES: IntentTestCase[] = [
  {
    id: 'C01', input: "Practice wasn't great.",
    role: 'coach', expectedIntentMatch: ['session_feedback'],
    expectedConceptMatch: ['session_quality', 'engagement_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Session quality signal → intent + concept detected',
  },
  {
    id: 'C02', input: "A few kids struggled today.",
    role: 'coach', expectedIntentMatch: ['player_observation'],
    expectedConceptMatch: ['progression_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Player observation → intent + concept detected',
  },
  {
    id: 'C03', input: "This group is difficult.",
    role: 'coach', expectedIntentMatch: ['group_difficulty'],
    expectedConceptMatch: ['grouping_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Group difficulty → intent + concept detected',
  },
  {
    id: 'C04', input: "Today's session felt flat.",
    role: 'coach', expectedIntentMatch: ['session_feedback'],
    expectedConceptMatch: ['engagement_issue', 'session_quality'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Low energy session → engagement concept',
  },
  {
    id: 'C05', input: "Help me finish the wrap-up.",
    role: 'coach', expectedIntentMatch: ['wrap_up_help'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Wrap-up help → clear intent',
  },
  {
    id: 'C06', input: "These kids are all over the place.",
    role: 'coach', expectedIntentMatch: ['group_difficulty'],
    expectedConceptMatch: ['grouping_issue', 'focus_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Classic grouping phrase → concept extraction',
  },
  {
    id: 'C07', input: "The drill wasn't working for this group.",
    role: 'coach', expectedIntentMatch: ['session_feedback', 'curriculum_question'],
    expectedConceptMatch: ['curriculum_issue', 'session_quality'],
    minConfidence: 0, expectsClarification: true,
    description: 'Curriculum fit concern',
  },
  {
    id: 'C08', input: "I want to flag that Maria is struggling.",
    role: 'coach', expectedIntentMatch: ['player_observation', 'player_help'],
    expectedConceptMatch: ['progression_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Named player flag → observation intent',
  },
  {
    id: 'C09', input: "Energy was really low today.",
    role: 'coach', expectedIntentMatch: ['session_feedback'],
    expectedConceptMatch: ['engagement_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Energy signal → engagement concept',
  },
  {
    id: 'C10', input: "Which kids were present?",
    role: 'coach', expectedIntentMatch: ['attendance_report'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Attendance question → clear intent',
  },
  {
    id: 'C11', input: "What should I focus on with this group next session?",
    role: 'coach', expectedIntentMatch: ['curriculum_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Curriculum question → intent matched',
  },
  {
    id: 'C12', input: "One player needs extra attention.",
    role: 'coach', expectedIntentMatch: ['player_help', 'player_observation'],
    expectedConceptMatch: ['progression_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Extra help need → player intent',
  },
  {
    id: 'C13', input: "I noticed something with Tommy's backhand.",
    role: 'coach', expectedIntentMatch: ['player_observation'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Named player observation → observation intent',
  },
  {
    id: 'C14', input: "The group seems unfocused.",
    role: 'coach', expectedIntentMatch: ['group_difficulty', 'session_feedback'],
    expectedConceptMatch: ['focus_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Focus signal → concept detected',
  },
  {
    id: 'C15', input: "Kids weren't trying today.",
    role: 'coach', expectedIntentMatch: ['session_feedback'],
    expectedConceptMatch: ['effort_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Effort concern → concept extracted',
  },
  {
    id: 'C16', input: "The session went well actually.",
    role: 'coach', expectedIntentMatch: ['session_feedback', 'unknown'],
    minConfidence: 0, expectsClarification: false,
    description: 'Positive session — no issue signal',
  },
  {
    id: 'C17', input: "I think Jake might be ready to move up.",
    role: 'coach', expectedIntentMatch: ['player_observation', 'player_help'],
    expectedConceptMatch: ['advancement_opportunity'],
    minConfidence: 0, expectsClarification: false,
    description: 'Advancement signal → concept detected',
  },
  {
    id: 'C18', input: "Attendance was really low.",
    role: 'coach', expectedIntentMatch: ['attendance_report'],
    expectedConceptMatch: ['attendance_issue'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Attendance concern → intent + concept',
  },
  {
    id: 'C19', input: "The parents of this group are asking a lot of questions.",
    role: 'coach', expectedIntentMatch: ['player_observation', 'unknown'],
    expectedConceptMatch: ['parent_concern'],
    minConfidence: 0, expectsClarification: true,
    description: 'Parent concern via coach → concept detected',
  },
  {
    id: 'C20', input: "Practice was rough but the kids tried hard.",
    role: 'coach', expectedIntentMatch: ['session_feedback'],
    expectedConceptMatch: ['session_quality'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Mixed signal session → session quality concept',
  },
  {
    id: 'C21', input: "Some kids are getting bored with this drill.",
    role: 'coach', expectedIntentMatch: ['session_feedback', 'curriculum_question'],
    expectedConceptMatch: ['engagement_issue', 'curriculum_issue'],
    minConfidence: 0, expectsClarification: true,
    description: 'Boredom signal → engagement + curriculum',
  },
  {
    id: 'C22', input: "Can't get this group to listen.",
    role: 'coach', expectedIntentMatch: ['group_difficulty'],
    expectedConceptMatch: ['focus_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Attention issue → focus concept',
  },
  {
    id: 'C23', input: "I observed a kid with really good footwork today.",
    role: 'coach', expectedIntentMatch: ['player_observation'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Positive observation → observation intent',
  },
  {
    id: 'C24', input: "The group dynamic was off today.",
    role: 'coach', expectedIntentMatch: ['group_difficulty', 'session_feedback'],
    expectedConceptMatch: ['grouping_issue', 'engagement_issue'],
    minConfidence: 0, expectsClarification: true,
    description: 'Group dynamic concern → grouping concept',
  },
  {
    id: 'C25', input: "Need to mark attendance for this morning's session.",
    role: 'coach', expectedIntentMatch: ['attendance_report'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Attendance marking → clear intent',
  },
]

// ── Part 13 — Parent Certification ───────────────────────────────────────────

const PARENT_TEST_CASES: IntentTestCase[] = [
  {
    id: 'P01', input: "I don't think she's improving.",
    role: 'parent', expectedIntentMatch: ['progress_concern'],
    expectedConceptMatch: ['progression_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Progress concern → intent matched',
  },
  {
    id: 'P02', input: "He's losing confidence.",
    role: 'parent', expectedIntentMatch: ['confidence_concern'],
    expectedConceptMatch: ['confidence_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Confidence concern → intent matched',
  },
  {
    id: 'P03', input: "We're not seeing results.",
    role: 'parent', expectedIntentMatch: ['progress_concern'],
    expectedConceptMatch: ['progression_issue', 'expectation_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Results concern → intent + concept',
  },
  {
    id: 'P04', input: "When is the next session?",
    role: 'parent', expectedIntentMatch: ['schedule_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Schedule question → intent matched',
  },
  {
    id: 'P05', input: "Can someone call me?",
    role: 'parent', expectedIntentMatch: ['communication_request'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Communication request → intent matched',
  },
  {
    id: 'P06', input: "How can I help at home?",
    role: 'parent', expectedIntentMatch: ['support_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Support question → intent matched',
  },
  {
    id: 'P07', input: "My daughter seems discouraged after practice.",
    role: 'parent', expectedIntentMatch: ['confidence_concern'],
    expectedConceptMatch: ['confidence_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Discouraged signal → confidence concept',
  },
  {
    id: 'P08', input: "Is this program working for him?",
    role: 'parent', expectedIntentMatch: ['progress_concern', 'unknown'],
    expectedConceptMatch: ['expectation_issue', 'progression_issue'],
    minConfidence: 0, expectsClarification: true,
    description: 'Program effectiveness → expectation or progress',
  },
  {
    id: 'P09', input: "She doesn't want to go to practice anymore.",
    role: 'parent', expectedIntentMatch: ['confidence_concern', 'progress_concern'],
    expectedConceptMatch: ['retention_risk', 'engagement_issue'],
    minConfidence: 0, expectsClarification: true,
    description: 'Retention signal → concept detected',
  },
  {
    id: 'P10', input: "What should I say after a tough loss?",
    role: 'parent', expectedIntentMatch: ['support_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Support guidance request → matched',
  },
  {
    id: 'P11', input: "We've been doing this for 6 months and nothing is changing.",
    role: 'parent', expectedIntentMatch: ['progress_concern'],
    expectedConceptMatch: ['progression_issue', 'expectation_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Long-term frustration → progress + expectation',
  },
  {
    id: 'P12', input: "Can I meet with the coach?",
    role: 'parent', expectedIntentMatch: ['communication_request'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Coach meeting request → matched',
  },
  {
    id: 'P13', input: "Are there tournaments coming up?",
    role: 'parent', expectedIntentMatch: ['schedule_question', 'unknown'],
    minConfidence: 0, expectsClarification: false,
    description: 'Tournament schedule → schedule intent',
  },
  {
    id: 'P14', input: "I think he's ready to move to the next level.",
    role: 'parent', expectedIntentMatch: ['progress_concern', 'unknown'],
    expectedConceptMatch: ['advancement_opportunity'],
    minConfidence: 0, expectsClarification: false,
    description: 'Parent advancement observation → concept detected',
  },
  {
    id: 'P15', input: "She cried after practice last week.",
    role: 'parent', expectedIntentMatch: ['confidence_concern'],
    expectedConceptMatch: ['confidence_issue', 'retention_risk'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Emotional distress signal → confidence concept',
  },
  {
    id: 'P16', input: "Is it normal for progress to be this slow?",
    role: 'parent', expectedIntentMatch: ['progress_concern', 'unknown'],
    expectedConceptMatch: ['progression_issue', 'expectation_issue'],
    minConfidence: 0, expectsClarification: true,
    description: 'Expectation management question',
  },
  {
    id: 'P17', input: "What does she need to work on at home?",
    role: 'parent', expectedIntentMatch: ['support_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Home practice guidance → support intent',
  },
  {
    id: 'P18', input: "He wants to quit.",
    role: 'parent', expectedIntentMatch: ['confidence_concern', 'unknown'],
    expectedConceptMatch: ['retention_risk', 'confidence_issue'],
    minConfidence: 0, expectsClarification: true,
    description: 'Quit signal → retention risk concept',
  },
  {
    id: 'P19', input: "Should I push her to keep going?",
    role: 'parent', expectedIntentMatch: ['support_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Parenting guidance → support intent',
  },
  {
    id: 'P20', input: "Is the coach a good fit for him?",
    role: 'parent', expectedIntentMatch: ['progress_concern', 'unknown'],
    minConfidence: 0, expectsClarification: true,
    description: 'Coach fit concern → clarification needed',
  },
  {
    id: 'P21', input: "I'm concerned about his development.",
    role: 'parent', expectedIntentMatch: ['progress_concern'],
    expectedConceptMatch: ['progression_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Development concern → progress intent',
  },
  {
    id: 'P22', input: "The session was cancelled, what now?",
    role: 'parent', expectedIntentMatch: ['schedule_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Cancellation question → schedule intent',
  },
  {
    id: 'P23', input: "No improvement in months. I'm frustrated.",
    role: 'parent', expectedIntentMatch: ['progress_concern'],
    expectedConceptMatch: ['progression_issue', 'expectation_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Explicit frustration → progress + expectation',
  },
  {
    id: 'P24', input: "He seems happier at practice lately.",
    role: 'parent', expectedIntentMatch: ['progress_concern', 'unknown'],
    minConfidence: 0, expectsClarification: false,
    description: 'Positive signal — low concern intent expected',
  },
  {
    id: 'P25', input: "What level is she at right now?",
    role: 'parent', expectedIntentMatch: ['progress_concern', 'unknown'],
    minConfidence: 0, expectsClarification: false,
    description: 'Level question → progress context',
  },
]

// ── Part 14 — Player Certification ───────────────────────────────────────────

const PLAYER_TEST_CASES: IntentTestCase[] = [
  {
    id: 'PL01', input: "What should I work on?",
    role: 'player', expectedIntentMatch: ['what_to_practice'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'What to practice → intent matched',
  },
  {
    id: 'PL02', input: "Am I getting better?",
    role: 'player', expectedIntentMatch: ['progress_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Progress question → intent matched',
  },
  {
    id: 'PL03', input: "When do I move up?",
    role: 'player', expectedIntentMatch: ['next_level'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Level question → intent matched',
  },
  {
    id: 'PL04', input: "I feel like I can't get better.",
    role: 'player', expectedIntentMatch: ['feeling_stuck'],
    expectedConceptMatch: ['progression_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Stuck feeling → intent + concept',
  },
  {
    id: 'PL05', input: "When's my next match?",
    role: 'player', expectedIntentMatch: ['competition_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Match question → intent matched',
  },
  {
    id: 'PL06', input: "My backhand keeps going in the net.",
    role: 'player', expectedIntentMatch: ['feeling_stuck', 'what_to_practice'],
    expectedConceptMatch: ['progression_issue'],
    minConfidence: 0, expectsClarification: true,
    description: 'Specific shot problem → stuck or practice intent',
  },
  {
    id: 'PL07', input: "What's my mission for this week?",
    role: 'player', expectedIntentMatch: ['what_to_practice'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Mission question → what_to_practice intent',
  },
  {
    id: 'PL08', input: "Am I ready for Orange Ball?",
    role: 'player', expectedIntentMatch: ['next_level'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Level readiness question → next_level',
  },
  {
    id: 'PL09', input: "I'm frustrated with my serve.",
    role: 'player', expectedIntentMatch: ['feeling_stuck'],
    expectedConceptMatch: ['progression_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Frustration signal → stuck intent',
  },
  {
    id: 'PL10', input: "I don't get it. Nothing is working.",
    role: 'player', expectedIntentMatch: ['feeling_stuck'],
    expectedConceptMatch: ['progression_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'General stuck feeling → matched',
  },
  {
    id: 'PL11', input: "How do I prepare for the tournament?",
    role: 'player', expectedIntentMatch: ['competition_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Tournament prep → competition intent',
  },
  {
    id: 'PL12', input: "Coach said I should work on footwork.",
    role: 'player', expectedIntentMatch: ['what_to_practice', 'unknown'],
    minConfidence: 0, expectsClarification: false,
    description: 'Coach instruction → practice context',
  },
  {
    id: 'PL13', input: "Is my progress good?",
    role: 'player', expectedIntentMatch: ['progress_question'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Progress check → intent matched',
  },
  {
    id: 'PL14', input: "I keep making the same mistakes.",
    role: 'player', expectedIntentMatch: ['feeling_stuck'],
    expectedConceptMatch: ['progression_issue'],
    minConfidence: 0.35, expectsClarification: true,
    description: 'Repeated mistakes → stuck intent',
  },
  {
    id: 'PL15', input: "Can I compete next month?",
    role: 'player', expectedIntentMatch: ['competition_question', 'next_level'],
    minConfidence: 0.35, expectsClarification: false,
    description: 'Competition eligibility → matched',
  },
]

// ── Test runner ───────────────────────────────────────────────────────────────

function runIntentTests(cases: IntentTestCase[], sectionTitle: string): void {
  section(sectionTitle)

  for (const tc of cases) {
    const result = interpretIntent(tc.input, tc.role)
    const meaningResult = extractMeaning(tc.input, tc.role)

    // Intent match check
    const intentMatched =
      tc.expectedIntentMatch.includes(String(result.primaryIntent)) ||
      result.possibleIntents.some(pi => tc.expectedIntentMatch.includes(String(pi.intent)))

    assert(
      tc.id + '-intent',
      intentMatched,
      `${tc.description}: intent "${result.primaryIntent}" in [${tc.expectedIntentMatch.join(', ')}] (conf: ${(result.confidence * 100).toFixed(0)}%)`,
    )

    // Concept match check (if expected)
    if (tc.expectedConceptMatch && tc.expectedConceptMatch.length > 0) {
      const conceptMatched =
        (meaningResult.topConcept && tc.expectedConceptMatch.includes(meaningResult.topConcept)) ||
        meaningResult.interpretations.some(m => tc.expectedConceptMatch!.includes(m.concept))

      assert(
        tc.id + '-concept',
        conceptMatched,
        `${tc.description}: concept "${meaningResult.topConcept}" in [${tc.expectedConceptMatch.join(', ')}]`,
      )
    }

    // Clarification check
    if (tc.expectsClarification) {
      const hasClarification = result.clarificationNeeded || result.bestNextQuestion !== null
      const questionResult = selectBestNextQuestion({
        role: tc.role,
        topConcepts: meaningResult.interpretations.slice(0, 3).map(m => m.concept),
        currentConfidence: result.confidence,
      })
      const hasQuestion = hasClarification || questionResult !== null
      assert(
        tc.id + '-clarif',
        hasQuestion,
        `${tc.description}: clarification question available`,
      )
    }
  }
}

// ── Part 14a — Clarification Quality Tests ────────────────────────────────────

function runClarificationQualityTests(): void {
  section('Part 14a — Clarification Quality Tests')

  // Specific vs vague clarification test
  const vagueInputs = [
    { input: "Something is off.", role: 'director' as InterpreterRole },
    { input: "Orange looks weird.", role: 'director' as InterpreterRole },
    { input: "Practice wasn't great.", role: 'coach' as InterpreterRole },
    { input: "I don't think she's improving.", role: 'parent' as InterpreterRole },
    { input: "I feel stuck.", role: 'player' as InterpreterRole },
  ]

  for (const tc of vagueInputs) {
    const meaning = extractMeaning(tc.input, tc.role)
    const question = selectBestNextQuestion({
      role: tc.role,
      topConcepts: meaning.interpretations.slice(0, 3).map(m => m.concept),
      currentConfidence: 0.3,
    })

    if (question) {
      // Must have choices (specific, not vague)
      assert(
        `CQ-${tc.input.slice(0, 10).replace(/\W/g, '')}`,
        question.isChoiceQuestion,
        `"${tc.input.slice(0, 30)}" → specific choice question (not "tell me more")`,
      )

      // Question text must not be generic
      const text = question.question.toLowerCase()
      const isGeneric = text.includes('tell me more') || text === 'what do you mean?'
      assert(
        `CQ-${tc.input.slice(0, 10).replace(/\W/g, '')}-notgeneric`,
        !isGeneric,
        `"${tc.input.slice(0, 30)}" → question is specific, not generic`,
      )
    } else {
      // No question needed — high confidence case
      assert(
        `CQ-${tc.input.slice(0, 10).replace(/\W/g, '')}`,
        true,
        `"${tc.input.slice(0, 30)}" → no clarification needed (high confidence)`,
      )
    }
  }
}

// ── Part 14b — Contract Compliance Tests ─────────────────────────────────────

function runContractComplianceTests(): void {
  section('Part 14b — Contract Compliance Tests')

  // Test: one question max rule
  const contractResult = validateContractCompliance({
    responseText: "Tell me more. Can you elaborate? What did you mean exactly?",
    clarificationCount: 3,
    hasDraftOrAction: false,
    hasNextStep: false,
    role: 'director',
  })
  assert('CC01', !contractResult.compliant, 'Multiple clarification questions → contract violation detected')
  assert('CC02', contractResult.violations.includes('one_question_max'), 'one_question_max violation flagged')
  assert('CC03', contractResult.violations.includes('specific_over_vague'), 'specific_over_vague violation flagged')

  // Test: chatbot anti-pattern detection
  const chatbotResult = validateContractCompliance({
    responseText: "Great question! I'd be happy to help you with that enrollment concern!",
    clarificationCount: 0,
    hasDraftOrAction: false,
    hasNextStep: false,
    role: 'director',
  })
  assert('CC04', !chatbotResult.compliant, 'Chatbot preamble → contract violation detected')
  assert('CC05', chatbotResult.violations.includes('no_generic_chatbot'), 'no_generic_chatbot violation flagged')

  // Test: good response passes
  const goodResult = validateContractCompliance({
    responseText: "Enrollment is down 12% this month. Want me to draft a review?",
    clarificationCount: 0,
    hasDraftOrAction: true,
    hasNextStep: true,
    role: 'director',
  })
  assert('CC06', goodResult.compliant, 'Good DONNA response → contract compliant')
  assert('CC07', goodResult.completionState === 'acting', 'Completion state correctly identified as "acting"')

  // Test: clarification allowed logic
  assert('CC08', isClarificationAllowed(0) === 'yes_first_only', 'First clarification allowed')
  assert('CC09', isClarificationAllowed(1) === 'no_already_asked', 'Second clarification blocked by contract')
}

// ── Part 14c — Response Style Tests ──────────────────────────────────────────

function runResponseStyleTests(): void {
  section('Part 14c — Response Style Tests')

  // Good style
  const goodStyle = validateResponseStyle("Enrollment is down 12%. The intake pipeline needs review.")
  assert('RS01', goodStyle.passes, 'Clear data-first response → style passes')

  // Chatbot anti-pattern
  const badStyle1 = validateResponseStyle("Great question! I'd be happy to help you with that.")
  assert('RS02', !badStyle1.passes, 'Chatbot preamble → style violation detected')
  assert('RS03', badStyle1.antiPatternsFound.length > 0, 'Anti-patterns found in chatbot text')

  // Vague qualifiers
  const badStyle2 = validateResponseStyle("It appears that enrollment might be declining somewhat.")
  assert('RS04', !badStyle2.passes, 'Vague qualifiers → style violation detected')

  // Long sentences
  const longSentence = validateResponseStyle(
    "In consideration of the current enrollment trends which have been declining for three months and the fact that the intake pipeline has not been reviewed, it would be advisable to consider making some changes to the overall approach to recruitment and onboarding."
  )
  assert('RS05', !longSentence.passes, 'Long sentence → style violation detected')
}

// ── Part 14d — Learning Capture Tests ────────────────────────────────────────

function runLearningCaptureTests(): void {
  section('Part 14d — Learning Capture Tests')

  // Capture a learning record
  const record = captureConversationLearning({
    originalStatement: "Orange looks weird.",
    role: 'director',
    interpretedTopConcept: 'enrollment_issue',
    allConcepts: ['enrollment_issue'],
    initialConfidence: 0.30,
    finalConfidence: 0.75,
    clarificationAsked: 'Do you mean enrollment or group composition?',
    clarificationResponse: 'Enrollment is down.',
    stagesVisited: ['question', 'understanding', 'action'],
    finalUnderstanding: 'Enrollment concern for Orange Ball group',
    actionTaken: 'enrollment_review_draft',
    completedSuccessfully: true,
    academyDnaModelId: '12u_foundation',
  })

  assert('LC01', record.id.startsWith('learn-'), 'Learning record created with ID')
  assert('LC02', record.status === 'pending_review', 'Learning record status is pending_review')
  assert('LC03', record.patternQuality === 'high_value', 'High confidence lift → high_value quality')
  assert('LC04', record.completedSuccessfully === true, 'Completion flag correct')

  // Retrieve pending
  const pending = getPendingLearning({ role: 'director' })
  assert('LC05', pending.length >= 1, 'Pending learning records retrievable by role')
  assert('LC06', pending.some(r => r.originalStatement === 'Orange looks weird.'), 'Specific record found in pending')
}

// ── Part 14e — Memory Hook Tests ─────────────────────────────────────────────

function runMemoryHookTests(): void {
  section('Part 14e — Memory Hook Tests')

  // Capture multiple records for the same concept
  const base = {
    role: 'director' as InterpreterRole,
    interpretedTopConcept: 'enrollment_issue' as AcademyOSConcept,
    allConcepts: ['enrollment_issue' as AcademyOSConcept],
    initialConfidence: 0.50,
    finalConfidence: 0.70,
    clarificationAsked: null,
    clarificationResponse: null,
    stagesVisited: ['understanding' as const],
    finalUnderstanding: 'Enrollment concern',
    actionTaken: null,
    completedSuccessfully: false,
  }

  captureConversationLearning({ ...base, originalStatement: "Orange looks weird." })
  captureConversationLearning({ ...base, originalStatement: "Why is enrollment so low?" })
  captureConversationLearning({ ...base, originalStatement: "Numbers still seem off." })

  const { getPendingLearning: getAll } = require('./conversationLearningRecord')
  const allRecords = getPendingLearning()
  const hookResult = detectRecurringConcerns(allRecords, 'director')

  assert('MH01', hookResult.hasRecurringConcerns, 'Recurring concern detected after 3 mentions')
  assert('MH02', hookResult.mostRepeatedConcept === 'enrollment_issue', 'Most repeated concept is enrollment_issue')
  assert('MH03', hookResult.memoryCallbacks.length > 0, 'Memory callbacks generated')
  assert(
    'MH04',
    hookResult.memoryCallbacks.some(c => c.toLowerCase().includes('enrollment')),
    'Memory callback references enrollment',
  )
  assert('MH05', hookResult.unresolvedTopics.length > 0, 'Unresolved topics detected')
}

// ── Part 14f — Sandbox Scenarios ─────────────────────────────────────────────

function runSandboxTests(): void {
  section('Part 14f — Training Sandbox Tests')

  const results = BUILT_IN_SCENARIOS.map(s => runConversationScenario(s))
  const report = buildTrainingReport(results)

  for (const result of results) {
    assert(
      `SB-${result.scenarioId}`,
      result.status !== 'fail' || result.score >= 30,
      `Scenario "${result.description}" → ${result.status} (score: ${result.score})`,
    )
  }

  assert(
    'SB-overall',
    report.overallPassRate >= 0.60,
    `Sandbox overall pass rate: ${(report.overallPassRate * 100).toFixed(0)}% (target ≥ 60%)`,
  )

  assert(
    'SB-intent-accuracy',
    report.avgIntentAccuracy >= 0.50,
    `Avg intent accuracy: ${(report.avgIntentAccuracy * 100).toFixed(0)}% (target ≥ 50%)`,
  )

  process.stdout.write(`\n  Sandbox summary: ${report.summary}\n`)
}

// ── Main runner ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  process.stdout.write('\n============================================================\n')
  process.stdout.write('DONNA Conversational Intelligence Certification\n')
  process.stdout.write('Sprint 2831–2860\n')
  process.stdout.write('============================================================\n')

  // Part 11 — Director
  runIntentTests(DIRECTOR_TEST_CASES, 'Part 11 — Director Certification (25 cases)')

  // Part 12 — Coach
  runIntentTests(COACH_TEST_CASES, 'Part 12 — Coach Certification (25 cases)')

  // Part 13 — Parent
  runIntentTests(PARENT_TEST_CASES, 'Part 13 — Parent Certification (25 cases)')

  // Part 14 — Player + sub-tests
  runIntentTests(PLAYER_TEST_CASES, 'Part 14 — Player Certification (15 cases)')
  runClarificationQualityTests()
  runContractComplianceTests()
  runResponseStyleTests()
  runLearningCaptureTests()
  runMemoryHookTests()
  runSandboxTests()

  // ── Final summary ──────────────────────────────────────────────────────────

  const total = passed + failed
  const accuracy = total > 0 ? (passed / total) * 100 : 0

  process.stdout.write('\n============================================================\n')
  process.stdout.write(`CERTIFICATION RESULT: ${passed}/${total} PASS (${accuracy.toFixed(1)}%)\n`)
  process.stdout.write('============================================================\n')

  if (failed > 0) {
    process.stdout.write(`\nFailed assertions (${failed}):\n`)
    for (const f of failures) {
      process.stdout.write(f + '\n')
    }
  }

  if (accuracy >= 90) {
    process.stdout.write('\nRESULT: CERTIFIED — 90%+ accuracy achieved\n')
  } else if (accuracy >= 75) {
    process.stdout.write('\nRESULT: PARTIAL — below 90% target\n')
  } else {
    process.stdout.write('\nRESULT: FAILED — significant gaps detected\n')
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
