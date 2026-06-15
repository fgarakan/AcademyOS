// Mega Sprint 2531–2560 — DONNA Demo Academy Simulation V1
//
// Green Valley Tennis Academy — full simulation dataset.
// All entities use the same types that live DB loaders return.
// This dataset drives scenario certification without requiring DB seeding.
//
// Design rules:
//   - Uses real EntityMemoryContext + EntityRecommendation shapes.
//   - Realistic tennis academy data. No lorem ipsum.
//   - Every entity has health score, route, recommendations, signals.
//   - Coaches + parents are included as EntityMemoryContext objects.
//   - ConversationOperatingContext snapshots for mid-thread certification.

import type {
  EntityMemoryContext,
  EntityRecommendation,
  AcademyMemoryContext,
  DecisionMemoryContext,
  PriorSessionContext,
} from '@/lib/donna/memory/donnaMemoryContextTypes'
import type { ConversationOperatingContext } from '@/lib/donna/conversation/donnaConversationOperatingContext'
import type { AcademyIntelligencePacket, PrioritizedItem } from '@/lib/donna/academy/academyIntelligenceEngine'

// ── Academy identity ──────────────────────────────────────────────────────────

export const DEMO_ACADEMY_NAME = 'Green Valley Tennis Academy'
export const DEMO_ACADEMY_ID   = 'demo-gvta-001'

// ── Shared helpers ────────────────────────────────────────────────────────────

function rec(overrides: Partial<EntityRecommendation> & { id: string; title: string; recommendationType: string }): EntityRecommendation {
  return {
    lifecycleStatus:  'Pending Review',
    confidenceLabel:  'High',
    confidenceScore:  0.82,
    urgency:          'medium',
    description:      null,
    riskIfIgnored:    'Issue compounds over time without intervention',
    expectedImpact:   'Resolved and removed from director attention queue',
    owner:            'director',
    reviewDate:       '2026-06-21',
    isOverdue:        false,
    followUpRequired: true,
    ...overrides,
  }
}

// ── Players (10) ──────────────────────────────────────────────────────────────

export const PLAYER_ALEX_RIVERA: EntityMemoryContext = {
  entityType:     'player',
  entityLabel:    'Alex Rivera',
  entityRoute:    '/director/players/player-alex-001',
  operatingSummary: 'Alex Rivera, Green Ball Level 2. Consistent improvement over 6 months. Assessment scores exceeded advancement threshold on last 2 evaluations. Advancement recommendation pending 18 days.',
  healthScore:    8,
  activePriorities: [
    'Advancement recommendation pending 18 days — needs director review',
    'Green Ball Level 2 — ready for Orange Ball',
  ],
  recentSignals: [
    'Assessment exceeded threshold (2 consecutive)',
    'Attendance 100% last 6 weeks',
    'Coach note: strong backhand development',
  ],
  activeRecommendations: ['Review advancement for Alex Rivera (urgent)'],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [
    rec({
      id:                 'rec-alex-001',
      title:              'Review advancement for Alex Rivera',
      recommendationType: 'advancement',
      urgency:            'urgent',
      confidenceLabel:    'High',
      confidenceScore:    0.91,
      lifecycleStatus:    'Pending Review',
      description:        'Alex has exceeded the Green Ball Level 2 threshold on last 2 consecutive assessments. Advancement to Orange Ball Level 1 is recommended.',
      riskIfIgnored:      'Player stagnates at an incorrect level — motivation and development suffer',
      expectedImpact:     'Alex moves to the appropriate challenge level, preventing stagnation',
      owner:              'director',
      reviewDate:         '2026-05-28',
      isOverdue:          true,
      followUpRequired:   true,
    }),
  ],
}

export const PLAYER_MAYA_CHEN: EntityMemoryContext = {
  entityType:    'player',
  entityLabel:   'Maya Chen',
  entityRoute:   '/director/players/player-maya-002',
  operatingSummary: 'Maya Chen, Red Ball Level 3. Exceptional development trajectory — 2 curriculum levels in 4 months. Formal assessment now overdue by 11 days. Coach Sarah flags her as a showcase candidate.',
  healthScore:   9,
  activePriorities: [
    'Formal assessment overdue 11 days — needs scheduling',
    'Fastest progression in academy cohort this quarter',
  ],
  recentSignals: [
    'Assessment overdue (11 days)',
    'Coach note: exceptional footwork and court awareness',
    'Parent engagement: high — Wei Chen requests monthly progress updates',
  ],
  activeRecommendations: ['Schedule formal assessment for Maya Chen (urgent)'],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [
    rec({
      id:                 'rec-maya-001',
      title:              'Schedule formal assessment for Maya Chen',
      recommendationType: 'assessment',
      urgency:            'urgent',
      confidenceLabel:    'High',
      confidenceScore:    0.95,
      lifecycleStatus:    'Pending Review',
      description:        'Maya has completed all Red Ball Level 3 curriculum objectives and is ready for formal assessment. The assessment is 11 days overdue.',
      riskIfIgnored:      'Without assessment, Maya cannot formally advance — exceptional trajectory stalls at administrative bottleneck',
      expectedImpact:     'Assessment enables formal advancement and validates exceptional progress',
      owner:              'director',
      reviewDate:         '2026-06-03',
      isOverdue:          true,
      followUpRequired:   true,
    }),
  ],
}

export const PLAYER_JAKE_THOMPSON: EntityMemoryContext = {
  entityType:    'player',
  entityLabel:   'Jake Thompson',
  entityRoute:   '/director/players/player-jake-003',
  operatingSummary: 'Jake Thompson, Orange Ball Level 1. No measurable progress in 8 weeks. Attendance showing a pattern of mid-week absences. Coach Brian has flagged motivation concerns in last 2 session notes.',
  healthScore:   4,
  activePriorities: [
    'No measurable progress in 8 weeks — approach review needed',
    'Pattern of mid-week absences — attendance concern',
    'Motivation concern flagged by Coach Brian',
  ],
  recentSignals: [
    'Assessment: no improvement across 2 evaluation cycles',
    'Attendance: missed 3 of last 8 sessions (mid-week pattern)',
    'Coach note: player appears disengaged during drills',
  ],
  activeRecommendations: ['Evaluate training approach for Jake Thompson (medium)'],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [
    rec({
      id:                 'rec-jake-001',
      title:              'Evaluate training approach for Jake Thompson',
      recommendationType: 'curriculum',
      urgency:            'medium',
      confidenceLabel:    'Medium',
      confidenceScore:    0.72,
      lifecycleStatus:    'Pending Review',
      description:        'Jake has shown no measurable skill improvement over 8 weeks at Orange Ball Level 1. Coach Brian recommends a structured review of training approach and curriculum alignment.',
      riskIfIgnored:      'Continued stagnation leads to dropout — player disengagement compounds without intervention',
      expectedImpact:     'Revised training approach restores measurable progress and re-engages player',
      owner:              'head_coach',
      reviewDate:         '2026-06-20',
      isOverdue:          false,
      followUpRequired:   true,
    }),
  ],
}

export const PLAYER_SOFIA_MARTINEZ: EntityMemoryContext = {
  entityType:    'player',
  entityLabel:   'Sofia Martinez',
  entityRoute:   '/director/players/player-sofia-004',
  operatingSummary: 'Sofia Martinez, Red Ball Level 2. At-risk: 3 missed sessions in 4 weeks, parent Ana Martinez has expressed desire to withdraw. Coach Sarah is concerned about continued participation.',
  healthScore:   3,
  activePriorities: [
    'Parent considering withdrawal — urgent director intervention needed',
    '3 missed sessions in 4 weeks — attendance critical',
    'Coach Sarah: concerned about player retention',
  ],
  recentSignals: [
    'Parent note: Ana Martinez mentioned "thinking about stopping" at last pickup',
    'Attendance: 3 absences in last 4 weeks without explanation',
    'Coach note: Sofia disengaged when present — looking distracted',
  ],
  activeRecommendations: ['Conduct parent meeting for Sofia Martinez (urgent)'],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [
    rec({
      id:                 'rec-sofia-001',
      title:              'Conduct parent meeting for Sofia Martinez',
      recommendationType: 'parent',
      urgency:            'immediate',
      confidenceLabel:    'High',
      confidenceScore:    0.88,
      lifecycleStatus:    'Pending Review',
      description:        'Ana Martinez (parent) has verbally expressed intention to withdraw Sofia. A director-level parent meeting is needed immediately to understand concerns and prevent dropout.',
      riskIfIgnored:      'Player withdraws from program — retention failure with reputational impact if parent is unsatisfied',
      expectedImpact:     'Parent concerns addressed; retention path established or managed exit handled professionally',
      owner:              'director',
      reviewDate:         '2026-06-15',
      isOverdue:          true,
      followUpRequired:   true,
    }),
  ],
}

export const PLAYER_LIAM_OKAFOR: EntityMemoryContext = {
  entityType:    'player',
  entityLabel:   'Liam Okafor',
  entityRoute:   '/director/players/player-liam-005',
  operatingSummary: 'Liam Okafor, Green Ball Level 1. Currently on modified training protocol following right wrist strain (week 4 of 6). Medical clearance expected around 2026-06-25. Cooperating well with modified programme.',
  healthScore:   6,
  activePriorities: [
    'Wrist injury: modified training week 4 of 6',
    'Medical clearance check-in needed 2026-06-25',
  ],
  recentSignals: [
    'Injury: right wrist strain, modified training since 2026-06-01',
    'Attendance: present all sessions, completing modified drills',
    'Parent note: Emeka Okafor monitoring closely, following medical advice',
  ],
  activeRecommendations: ['Review Liam Okafor return-to-full-training clearance (medium)'],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [
    rec({
      id:                 'rec-liam-001',
      title:              'Review Liam Okafor return-to-full-training clearance',
      recommendationType: 'placement',
      urgency:            'medium',
      confidenceLabel:    'High',
      confidenceScore:    0.85,
      lifecycleStatus:    'Pending Review',
      description:        'Liam is approaching the end of the 6-week modified training period. Medical clearance should be confirmed before returning to full Green Ball Level 1 programme.',
      riskIfIgnored:      'Premature return to full training risks re-injury and longer recovery',
      expectedImpact:     'Safe return to full training with injury prevention protocol in place',
      owner:              'director',
      reviewDate:         '2026-06-25',
      isOverdue:          false,
      followUpRequired:   true,
    }),
  ],
}

export const PLAYER_EMMA_WALSH: EntityMemoryContext = {
  entityType:    'player',
  entityLabel:   'Emma Walsh',
  entityRoute:   '/director/players/player-emma-006',
  operatingSummary: 'Emma Walsh, Orange Ball Level 2. Consistent performer with steady progress. No active concerns. Parent Fiona Walsh is satisfied with development. Coach Sarah notes strong serve development.',
  healthScore:   8,
  activePriorities: [
    'Orange Ball Level 2 — progressing on track',
  ],
  recentSignals: [
    'Assessment: improving consistently across skill domains',
    'Attendance: 95% over last 8 weeks',
    'Coach note: strong serve development, reliable in match play',
  ],
  activeRecommendations: [],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [],
}

export const PLAYER_KAI_NAKAMURA: EntityMemoryContext = {
  entityType:    'player',
  entityLabel:   'Kai Nakamura',
  entityRoute:   '/director/players/player-kai-007',
  operatingSummary: 'Kai Nakamura, Green Ball Level 3. Good development trajectory but formal assessment is now 22 days overdue. Parent Yuki Nakamura is competition-focused and asking about tournament eligibility.',
  healthScore:   7,
  activePriorities: [
    'Assessment overdue 22 days — urgent scheduling needed',
    'Tournament eligibility question from parent pending resolution',
  ],
  recentSignals: [
    'Assessment: overdue 22 days',
    'Parent concern: Yuki Nakamura asked about tournament eligibility at last pickup',
    'Skill signals: strong — ready for formal evaluation',
  ],
  activeRecommendations: ['Schedule overdue assessment for Kai Nakamura (urgent)'],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [
    rec({
      id:                 'rec-kai-001',
      title:              'Schedule overdue assessment for Kai Nakamura',
      recommendationType: 'assessment',
      urgency:            'urgent',
      confidenceLabel:    'High',
      confidenceScore:    0.90,
      lifecycleStatus:    'Pending Review',
      description:        'Formal assessment for Kai is 22 days overdue. Parent is asking about tournament eligibility, which depends on completing the assessment and confirming curriculum status.',
      riskIfIgnored:      'Delayed assessment blocks tournament eligibility and damages parent relationship',
      expectedImpact:     'Assessment completed — tournament eligibility confirmed, parent concern resolved',
      owner:              'director',
      reviewDate:         '2026-05-24',
      isOverdue:          true,
      followUpRequired:   true,
    }),
  ],
}

export const PLAYER_PRIYA_SHARMA: EntityMemoryContext = {
  entityType:    'player',
  entityLabel:   'Priya Sharma',
  entityRoute:   '/director/players/player-priya-008',
  operatingSummary: 'Priya Sharma, Red Ball Level 1. Progressing well. Parent Deepa Sharma has formally requested more 1-on-1 coaching time — a communication gap that needs director response before it escalates.',
  healthScore:   7,
  activePriorities: [
    'Parent request for more 1-on-1 time — director response needed',
    'Red Ball Level 1 — progressing normally',
  ],
  recentSignals: [
    'Parent note: Deepa Sharma sent written request for additional 1-on-1 sessions',
    'Assessment: progressing on trajectory',
    'Attendance: consistent 90% over 6 weeks',
  ],
  activeRecommendations: ['Address parent communication concern for Priya Sharma (medium)'],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [
    rec({
      id:                 'rec-priya-001',
      title:              'Address parent communication concern for Priya Sharma',
      recommendationType: 'parent',
      urgency:            'medium',
      confidenceLabel:    'High',
      confidenceScore:    0.80,
      lifecycleStatus:    'Pending Review',
      description:        "Deepa Sharma has sent a written request for additional 1-on-1 coaching sessions. The director should respond with programme options and pricing. No response has been sent in 6 days.",
      riskIfIgnored:      'Parent dissatisfaction escalates — risk of withdrawal and negative word-of-mouth',
      expectedImpact:     'Parent concern resolved professionally; options presented; relationship strengthened',
      owner:              'director',
      reviewDate:         '2026-06-17',
      isOverdue:          false,
      followUpRequired:   true,
    }),
  ],
}

export const PLAYER_TYLER_BROOKS: EntityMemoryContext = {
  entityType:    'player',
  entityLabel:   'Tyler Brooks',
  entityRoute:   '/director/players/player-tyler-009',
  operatingSummary: 'Tyler Brooks, Red Ball Level 1. Just placed last week via Director Assessment. Getting settled into the programme. Coach Brian has made initial contact. Parent James Brooks is satisfied.',
  healthScore:   7,
  activePriorities: [
    'New placement — first month check-in due',
  ],
  recentSignals: [
    'Placed: Red Ball Level 1 (2026-06-07)',
    'Coach Brian: initial session completed, positive first impression',
    'Parent note: James Brooks happy with placement process',
  ],
  activeRecommendations: ['Follow up on Tyler Brooks onboarding (low)'],
  recentDecisions: ['Placement approved: Red Ball Level 1 (2026-06-07)'],
  lastDiscussedAt: null,
  typedRecommendations: [
    rec({
      id:                 'rec-tyler-001',
      title:              'Follow up on Tyler Brooks onboarding',
      recommendationType: 'placement',
      urgency:            'low',
      confidenceLabel:    'High',
      confidenceScore:    0.78,
      lifecycleStatus:    'Pending Review',
      description:        'Tyler was placed last week. A 30-day onboarding check-in with Coach Brian is recommended to confirm placement accuracy and player integration.',
      riskIfIgnored:      'Early misalignment in placement goes undetected — longer recovery if wrong level',
      expectedImpact:     'Early placement validation; any adjustment can be made before habits form',
      owner:              'head_coach',
      reviewDate:         '2026-07-07',
      isOverdue:          false,
      followUpRequired:   true,
    }),
  ],
}

export const PLAYER_ZARA_AHMED: EntityMemoryContext = {
  entityType:    'player',
  entityLabel:   'Zara Ahmed',
  entityRoute:   '/director/players/player-zara-010',
  operatingSummary: 'Zara Ahmed, Red Ball Level 3. Ready for advancement to Green Ball Level 1. Advancement recommendation pending 7 days. Coach Sarah rates her court movement as exceptional for her cohort.',
  healthScore:   8,
  activePriorities: [
    'Advancement to Green Ball — recommendation pending 7 days',
  ],
  recentSignals: [
    'Assessment: met all Red Ball Level 3 advancement criteria',
    'Coach note: exceptional court movement, strong mental game',
    'Attendance: consistent 95% over 8 weeks',
  ],
  activeRecommendations: ['Review advancement for Zara Ahmed (medium)'],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [
    rec({
      id:                 'rec-zara-001',
      title:              'Review advancement for Zara Ahmed',
      recommendationType: 'advancement',
      urgency:            'medium',
      confidenceLabel:    'High',
      confidenceScore:    0.87,
      lifecycleStatus:    'Pending Review',
      description:        'Zara has met all Red Ball Level 3 advancement criteria. Coach Sarah recommends advancement to Green Ball Level 1.',
      riskIfIgnored:      'Player advances without formal director review — inconsistent progression standards',
      expectedImpact:     'Formal advancement approved; curriculum state updated; parent notified',
      owner:              'director',
      reviewDate:         '2026-06-19',
      isOverdue:          false,
      followUpRequired:   true,
    }),
  ],
}

export const ALL_PLAYERS: EntityMemoryContext[] = [
  PLAYER_ALEX_RIVERA,
  PLAYER_MAYA_CHEN,
  PLAYER_JAKE_THOMPSON,
  PLAYER_SOFIA_MARTINEZ,
  PLAYER_LIAM_OKAFOR,
  PLAYER_EMMA_WALSH,
  PLAYER_KAI_NAKAMURA,
  PLAYER_PRIYA_SHARMA,
  PLAYER_TYLER_BROOKS,
  PLAYER_ZARA_AHMED,
]

// ── Coaches (2) ───────────────────────────────────────────────────────────────

export const COACH_BRIAN_MITCHELL: EntityMemoryContext = {
  entityType:    'coach',
  entityLabel:   'Coach Brian',
  entityRoute:   '/director/players',
  operatingSummary: 'Coach Brian Mitchell. 5 primary players (Alex Rivera, Jake Thompson, Liam Okafor, Kai Nakamura, Tyler Brooks). 2 session wrap-ups pending from last 48 hours. Strong assessment completion rate (92%). One at-risk player (Jake Thompson).',
  healthScore:   8,
  activePriorities: [
    '2 session wrap-ups pending (last 48 hours)',
    'At-risk player: Jake Thompson — review approach needed',
  ],
  recentSignals: [
    'Wrap-up completion: 2 sessions pending from 12/06 and 13/06',
    'Assessment rate: 92% — above academy average',
    'Player concern: Jake Thompson flagged as stalled (8 weeks)',
  ],
  activeRecommendations: ['Review Jake Thompson training approach with Coach Brian'],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [],
}

export const COACH_SARAH_KIM: EntityMemoryContext = {
  entityType:    'coach',
  entityLabel:   'Coach Sarah',
  entityRoute:   '/director/players',
  operatingSummary: 'Coach Sarah Kim. 5 primary players (Maya Chen, Sofia Martinez, Emma Walsh, Priya Sharma, Zara Ahmed). 1 session wrap-up pending. Two attention signals: Sofia Martinez at-risk, Priya Sharma parent concern. Strong technical coaching notes.',
  healthScore:   6,
  activePriorities: [
    'At-risk player: Sofia Martinez — parent considering withdrawal',
    'Parent concern: Priya Sharma — written request for 1-on-1 sessions',
    '1 session wrap-up pending',
  ],
  recentSignals: [
    'Player signal: Sofia Martinez 3 absences, parent withdrawal risk',
    'Parent concern: Priya Sharma formal written request received',
    'Wrap-up: 1 session pending from 13/06',
  ],
  activeRecommendations: ['Support needed: Sofia Martinez parent situation requires director intervention'],
  recentDecisions: [],
  lastDiscussedAt: null,
  typedRecommendations: [],
}

export const ALL_COACHES: EntityMemoryContext[] = [
  COACH_BRIAN_MITCHELL,
  COACH_SARAH_KIM,
]

// ── Parents (10) ──────────────────────────────────────────────────────────────

export const PARENT_MARIA_RIVERA: EntityMemoryContext = {
  entityType:    'parent',
  entityLabel:   'Maria Rivera',
  entityRoute:   null,
  operatingSummary: 'Maria Rivera, parent of Alex Rivera. Highly engaged. Monthly check-in call completed 2026-06-01. Supportive of advancement recommendation. No open concerns.',
  healthScore:   9,
  activePriorities: [
    'Alex Rivera advancement pending — Maria engaged and supportive',
  ],
  recentSignals: [
    'Communication: monthly check-in 2026-06-01 — positive',
    'No outstanding concerns',
  ],
  activeRecommendations: [],
  recentDecisions: [],
  lastDiscussedAt: null,
}

export const PARENT_WEI_CHEN: EntityMemoryContext = {
  entityType:    'parent',
  entityLabel:   'Wei Chen',
  entityRoute:   null,
  operatingSummary: 'Wei Chen, parent of Maya Chen. Development-focused. Requests detailed monthly progress reports. Supportive of fast-track development. Waiting on overdue assessment results.',
  healthScore:   8,
  activePriorities: [
    'Waiting on overdue assessment — Wei Chen expects update',
  ],
  recentSignals: [
    'Communication: asked about assessment status 2026-06-10',
    'Engagement: high — attends all recaps',
  ],
  activeRecommendations: ['Update Wei Chen on Maya assessment scheduling'],
  recentDecisions: [],
  lastDiscussedAt: null,
}

export const PARENT_DAVID_THOMPSON: EntityMemoryContext = {
  entityType:    'parent',
  entityLabel:   'David Thompson',
  entityRoute:   null,
  operatingSummary: 'David Thompson, parent of Jake Thompson. Low engagement. Rarely responds to communications. Last contact was 6 weeks ago. Has not acknowledged attendance concern notifications.',
  healthScore:   3,
  activePriorities: [
    'Unreachable for 6 weeks — attendance concerns not acknowledged',
    'Jake at-risk: parent engagement needed',
  ],
  recentSignals: [
    'Communication: no response to 2 emails and 1 text (last 3 weeks)',
    'Last contact: 6 weeks ago, routine check-in',
  ],
  activeRecommendations: ['Escalate parent contact for David Thompson — Jake at-risk'],
  recentDecisions: [],
  lastDiscussedAt: null,
}

export const PARENT_ANA_MARTINEZ: EntityMemoryContext = {
  entityType:    'parent',
  entityLabel:   'Ana Martinez',
  entityRoute:   null,
  operatingSummary: 'Ana Martinez, parent of Sofia Martinez. Expressing withdrawal intent. Verbally mentioned "thinking about stopping" at last pickup. Has not formally submitted withdrawal. Urgent director engagement required.',
  healthScore:   2,
  activePriorities: [
    'Withdrawal risk — verbal intent expressed at pickup',
    'No formal withdrawal submitted yet — intervention window open',
  ],
  recentSignals: [
    'Concern: verbal withdrawal mention 2026-06-12 at pickup',
    'Attendance: correlates with Sofia absences — parent driving decision',
  ],
  activeRecommendations: ['Director-level parent meeting with Ana Martinez — urgent'],
  recentDecisions: [],
  lastDiscussedAt: null,
}

export const PARENT_EMEKA_OKAFOR: EntityMemoryContext = {
  entityType:    'parent',
  entityLabel:   'Emeka Okafor',
  entityRoute:   null,
  operatingSummary: 'Emeka Okafor, parent of Liam Okafor. Engaged and cooperative. Following medical advice closely. Has confirmed Liam is seeing a physio. Checking in weekly on return-to-training timeline.',
  healthScore:   8,
  activePriorities: [
    'Awaiting medical clearance confirmation for Liam (2026-06-25)',
  ],
  recentSignals: [
    'Communication: weekly check-in, engaged and cooperative',
    'Medical: confirmed physio treatment, following protocol',
  ],
  activeRecommendations: [],
  recentDecisions: [],
  lastDiscussedAt: null,
}

export const PARENT_FIONA_WALSH: EntityMemoryContext = {
  entityType:    'parent',
  entityLabel:   'Fiona Walsh',
  entityRoute:   null,
  operatingSummary: 'Fiona Walsh, parent of Emma Walsh. Satisfied and low-maintenance. Reads monthly reports. No concerns. Happy with Emma progress.',
  healthScore:   9,
  activePriorities: [],
  recentSignals: [
    'Communication: reads monthly reports, no queries',
    'Satisfaction: positive — mentioned "very happy" at last pickup',
  ],
  activeRecommendations: [],
  recentDecisions: [],
  lastDiscussedAt: null,
}

export const PARENT_YUKI_NAKAMURA: EntityMemoryContext = {
  entityType:    'parent',
  entityLabel:   'Yuki Nakamura',
  entityRoute:   null,
  operatingSummary: "Yuki Nakamura, parent of Kai Nakamura. Competition-focused. Impatient about the overdue assessment — has asked twice about tournament eligibility. Expects a specific answer before end of week.",
  healthScore:   5,
  activePriorities: [
    'Tournament eligibility question unanswered — follow-up due',
    'Assessment overdue affecting parent relationship',
  ],
  recentSignals: [
    'Communication: asked about tournament eligibility 2026-06-10 and 2026-06-13',
    'Expectation: wants answer before end of this week',
  ],
  activeRecommendations: ['Respond to Yuki Nakamura tournament eligibility query'],
  recentDecisions: [],
  lastDiscussedAt: null,
}

export const PARENT_DEEPA_SHARMA: EntityMemoryContext = {
  entityType:    'parent',
  entityLabel:   'Deepa Sharma',
  entityRoute:   null,
  operatingSummary: 'Deepa Sharma, parent of Priya Sharma. Engaged and articulate. Submitted formal written request for additional 1-on-1 sessions 6 days ago. No director response yet. Politely following up.',
  healthScore:   6,
  activePriorities: [
    'Written request for 1-on-1 sessions — response overdue 6 days',
  ],
  recentSignals: [
    'Communication: formal written request 2026-06-08 — no response yet',
    'Tone: polite but expectant',
  ],
  activeRecommendations: ['Respond to Deepa Sharma 1-on-1 session request'],
  recentDecisions: [],
  lastDiscussedAt: null,
}

export const PARENT_JAMES_BROOKS: EntityMemoryContext = {
  entityType:    'parent',
  entityLabel:   'James Brooks',
  entityRoute:   null,
  operatingSummary: 'James Brooks, parent of Tyler Brooks. Satisfied with placement process. No concerns. First-time tennis parent — appreciates the structured approach.',
  healthScore:   9,
  activePriorities: [],
  recentSignals: [
    'Communication: positive feedback on placement process',
    'Engagement: present at placement session',
  ],
  activeRecommendations: [],
  recentDecisions: [],
  lastDiscussedAt: null,
}

export const PARENT_AMIRA_AHMED: EntityMemoryContext = {
  entityType:    'parent',
  entityLabel:   'Amira Ahmed',
  entityRoute:   null,
  operatingSummary: 'Amira Ahmed, parent of Zara Ahmed. Development-focused and supportive. Very positive about Zara progress. Asks thoughtful questions about curriculum. Ready for advancement news.',
  healthScore:   9,
  activePriorities: [
    'Ready to hear about Zara advancement',
  ],
  recentSignals: [
    'Communication: engaged, asks about curriculum during pickups',
    'Expectation: anticipating advancement notification',
  ],
  activeRecommendations: [],
  recentDecisions: [],
  lastDiscussedAt: null,
}

export const ALL_PARENTS: EntityMemoryContext[] = [
  PARENT_MARIA_RIVERA,
  PARENT_WEI_CHEN,
  PARENT_DAVID_THOMPSON,
  PARENT_ANA_MARTINEZ,
  PARENT_EMEKA_OKAFOR,
  PARENT_FIONA_WALSH,
  PARENT_YUKI_NAKAMURA,
  PARENT_DEEPA_SHARMA,
  PARENT_JAMES_BROOKS,
  PARENT_AMIRA_AHMED,
]

// ── Academy entity ────────────────────────────────────────────────────────────

export const ACADEMY_ENTITY: EntityMemoryContext = {
  entityType:    'academy',
  entityLabel:   DEMO_ACADEMY_NAME,
  entityRoute:   '/director',
  operatingSummary: 'Green Valley Tennis Academy. 10 active players, 2 coaches. 5 recommendations pending director review (2 urgent, 3 medium). 3 parent situations requiring attention. Pulse: needs_attention.',
  healthScore:   6,
  activePriorities: [
    '2 urgent recommendations: Alex Rivera advancement (18d overdue), Sofia Martinez parent meeting (immediate)',
    '3 assessment overdue: Maya Chen (11d), Kai Nakamura (22d)',
    'Parent at-risk: Ana Martinez withdrawal risk, David Thompson unreachable',
  ],
  recentSignals: [
    'Recommendations: 5 pending (2 urgent, 1 immediate, 3 medium)',
    'Assessments: 2 overdue across academy',
    'Attendance: average 91% — Jake Thompson and Sofia Martinez pulling it down',
  ],
  activeRecommendations: [
    'Review advancement for Alex Rivera (urgent)',
    'Conduct parent meeting for Sofia Martinez (immediate)',
    'Schedule assessment for Kai Nakamura (urgent)',
    'Schedule assessment for Maya Chen (urgent)',
    'Address parent concern for Priya Sharma (medium)',
  ],
  recentDecisions: [
    'Tyler Brooks placement approved (2026-06-07)',
    'Liam Okafor modified training protocol approved (2026-06-01)',
  ],
  lastDiscussedAt: null,
  typedRecommendations: [],
}

// ── Academy memory (Tier 4) ───────────────────────────────────────────────────

export const ACADEMY_MEMORY: AcademyMemoryContext = {
  academyName: DEMO_ACADEMY_NAME,
  identityNarrative: 'A development-first tennis academy that prioritises player growth and parent communication above competition outcomes.',
  dominantDecisionPattern: 'Approves advancements within 3 days; often defers parent communication actions until escalation.',
  recentEvolutionSummary: 'Player intake growth phase — 2 new placements in last 30 days (Tyler Brooks, modified return for Liam Okafor).',
  totalApprovedDecisions: 47,
  approvalRatePercent: 89,
}

// ── Decision memory (Tier 2) ──────────────────────────────────────────────────

export const DECISION_MEMORY: DecisionMemoryContext = {
  recentDecisions: [
    { date: '7 days ago', action: 'Approved Tyler Brooks placement — Red Ball Level 1', outcome: 'approved', targetArea: 'player' },
    { date: '14 days ago', action: 'Approved Liam Okafor modified training protocol', outcome: 'approved', targetArea: 'player' },
    { date: '21 days ago', action: 'Approved new Orange Ball Level 2 curriculum objective: net approach drill', outcome: 'approved', targetArea: 'curriculum' },
    { date: '28 days ago', action: 'Rejected early advancement for Jake Thompson — evidence insufficient', outcome: 'rejected', targetArea: 'player' },
    { date: '35 days ago', action: 'Approved coach communication draft to Wei Chen re: Maya assessment timeline', outcome: 'approved', targetArea: 'coach' },
  ],
  approvalRate: 0.89,
  dominantArea: 'player',
}

// ── Prior session memory (Tier 1) ─────────────────────────────────────────────

export const PRIOR_SESSION_CONTEXT: PriorSessionContext = {
  sessions: [
    {
      startedAt: '2026-06-13T09:00:00Z',
      endedAt: '2026-06-13T09:22:00Z',
      sessionSummaryText: 'Director reviewed review queue, approved Tyler Brooks placement, discussed Sofia Martinez attendance concern with DONNA.',
      topicsDiscussed: ['review_queue', 'player', 'parent'],
      pagesVisited: ['Review Queue', 'Player: Sofia Martinez'],
      entitiesReferenced: ['Tyler Brooks', 'Sofia Martinez', 'Coach Sarah'],
      actionsCompleted: ['Tyler Brooks placement approved'],
      actionsPending: ['Sofia Martinez parent meeting'],
      openItems: ['Sofia Martinez: parent meeting not yet scheduled', 'Alex Rivera advancement still pending'],
    },
    {
      startedAt: '2026-06-11T14:30:00Z',
      endedAt: '2026-06-11T14:45:00Z',
      sessionSummaryText: 'Director checked academy health, reviewed curriculum levels, no actions taken.',
      topicsDiscussed: ['academy', 'curriculum'],
      pagesVisited: ['Director Dashboard', 'Curriculum'],
      entitiesReferenced: ['Alex Rivera', 'Kai Nakamura'],
      actionsCompleted: [],
      actionsPending: ['Alex Rivera advancement', 'Kai Nakamura assessment scheduling'],
      openItems: ['Kai Nakamura assessment still overdue'],
    },
  ],
  mostRecentAt: '2026-06-13T09:22:00Z',
}

// ── Simulation thread snapshots ───────────────────────────────────────────────
// Pre-built ConversationOperatingContext for mid-thread certification.

export const THREAD_ALEX_TURN4: ConversationOperatingContext = {
  currentEntityType:            'player',
  currentEntityLabel:           'Alex Rivera',
  currentEntityRoute:           '/director/players/player-alex-001',
  currentRecommendationTitle:   'Review advancement for Alex Rivera',
  currentRecommendationType:    'advancement',
  currentRecommendationUrgency: 'urgent',
  currentRecommendationStatus:  'Pending Review',
  currentTopic:                 'advancement',
  currentGoal:                  'Review advancement for Alex Rivera',
  currentNavigationTarget:      '/director/players/player-alex-001',
  currentNavigationLabel:       'Alex Rivera',
  threadStartedAt:              '2026-06-14T09:00:00Z',
  lastActiveAt:                 '2026-06-14T09:05:00Z',
  turnCount:                    4,
}

export const THREAD_SOFIA_TURN2: ConversationOperatingContext = {
  currentEntityType:            'player',
  currentEntityLabel:           'Sofia Martinez',
  currentEntityRoute:           '/director/players/player-sofia-004',
  currentRecommendationTitle:   'Conduct parent meeting for Sofia Martinez',
  currentRecommendationType:    'parent',
  currentRecommendationUrgency: 'immediate',
  currentRecommendationStatus:  'Pending Review',
  currentTopic:                 'parent communication',
  currentGoal:                  'Conduct parent meeting for Sofia Martinez',
  currentNavigationTarget:      '/director/players/player-sofia-004',
  currentNavigationLabel:       'Sofia Martinez',
  threadStartedAt:              '2026-06-14T09:10:00Z',
  lastActiveAt:                 '2026-06-14T09:11:00Z',
  turnCount:                    2,
}

export const THREAD_COACH_BRIAN_TURN2: ConversationOperatingContext = {
  currentEntityType:            'coach',
  currentEntityLabel:           'Coach Brian',
  currentEntityRoute:           '/director/players',
  currentRecommendationTitle:   null,
  currentRecommendationType:    null,
  currentRecommendationUrgency: null,
  currentRecommendationStatus:  null,
  currentTopic:                 'coach status',
  currentGoal:                  'Get status on Coach Brian',
  currentNavigationTarget:      '/director/players',
  currentNavigationLabel:       'Coach Brian',
  threadStartedAt:              '2026-06-14T09:20:00Z',
  lastActiveAt:                 '2026-06-14T09:21:00Z',
  turnCount:                    2,
}

export const THREAD_ACADEMY_TURN1: ConversationOperatingContext = {
  currentEntityType:            'academy',
  currentEntityLabel:           DEMO_ACADEMY_NAME,
  currentEntityRoute:           '/director',
  currentRecommendationTitle:   'Review advancement for Alex Rivera',
  currentRecommendationType:    'advancement',
  currentRecommendationUrgency: 'urgent',
  currentRecommendationStatus:  'Pending Review',
  currentTopic:                 'academy status',
  currentGoal:                  'Get status on Green Valley Tennis Academy',
  currentNavigationTarget:      '/director',
  currentNavigationLabel:       'Director Dashboard',
  threadStartedAt:              '2026-06-14T10:00:00Z',
  lastActiveAt:                 '2026-06-14T10:00:00Z',
  turnCount:                    1,
}

// ── Demo academy intelligence packet ─────────────────────────────────────────
// Mock AcademyIntelligencePacket for Green Valley Tennis Academy.
// Represents the live DB data that loadAcademyIntelligencePacket() would return.

function item(overrides: Partial<PrioritizedItem> & { playerName: string; title: string }): PrioritizedItem {
  return {
    playerRoute:        `/director/players/player-${overrides.playerName.toLowerCase().replace(/\s+/g, '-')}-001`,
    score:              70,
    urgency:            'medium',
    reason:             'pending — 7d',
    riskIfIgnored:      'Issue compounds over time.',
    recommendationType: 'assessment',
    isOverdue:          false,
    daysSince:          7,
    ...overrides,
  }
}

export const DEMO_ACADEMY_INTELLIGENCE_PACKET: AcademyIntelligencePacket = {
  academyId:                'demo-gvta-001',
  loadedAt:                 '2026-06-14T10:00:00Z',
  playerCount:              10,
  activeRecommendationCount: 7,
  attentionQueue: [
    item({ playerName: 'Sofia Martinez', title: 'Conduct parent meeting — withdrawal risk', urgency: 'immediate', score: 92, reason: 'parent_communication — 2d pending', riskIfIgnored: 'Parent withdrawal likely without director intervention.', recommendationType: 'parent_communication', isOverdue: false, daysSince: 2 }),
    item({ playerName: 'Alex Rivera',    title: 'Review advancement for Alex Rivera',       urgency: 'urgent',    score: 85, reason: 'advancement — 18d pending', riskIfIgnored: 'Advancement window may close.', recommendationType: 'advancement', isOverdue: true, daysSince: 18 }),
    item({ playerName: 'Jake Thompson',  title: 'Address at-risk training stall',           urgency: 'urgent',    score: 78, reason: 'risk_alert — 8d pending', riskIfIgnored: 'Risk escalates without intervention.', recommendationType: 'risk_alert', isOverdue: false, daysSince: 8 }),
    item({ playerName: 'Kai Nakamura',   title: 'Schedule overdue assessment',              urgency: 'urgent',    score: 74, reason: 'assessment — 22d pending', riskIfIgnored: 'Assessment data becomes stale.', recommendationType: 'assessment', isOverdue: true, daysSince: 22 }),
    item({ playerName: 'Maya Chen',      title: 'Schedule overdue assessment',              urgency: 'medium',    score: 62, reason: 'assessment — 11d pending', riskIfIgnored: 'Assessment data becomes stale.', recommendationType: 'assessment', isOverdue: false, daysSince: 11 }),
    item({ playerName: 'Priya Sharma',   title: 'Address parent concern',                   urgency: 'medium',    score: 55, reason: 'parent_communication — 5d pending', riskIfIgnored: 'Parent relationship erodes.', recommendationType: 'parent_communication', isOverdue: false, daysSince: 5 }),
    item({ playerName: 'Emma Walsh',     title: 'Review commitment level pattern',          urgency: 'low',       score: 38, reason: 'curriculum — 3d pending', riskIfIgnored: 'Curriculum gap widens.', recommendationType: 'curriculum', isOverdue: false, daysSince: 3 }),
  ],
  advancementCandidates: [
    { name: 'Zara Ahmed', route: '/director/players/player-zara-ahmed-001' },
    { name: 'Alex Rivera', route: '/director/players/player-alex-rivera-001' },
  ],
  parentFollowupQueue: [
    item({ playerName: 'Sofia Martinez', title: 'Conduct parent meeting — withdrawal risk', urgency: 'immediate', score: 92, recommendationType: 'parent_communication', daysSince: 2 }),
    item({ playerName: 'Priya Sharma',   title: 'Address parent concern',                   urgency: 'medium',    score: 55, recommendationType: 'parent_communication', daysSince: 5 }),
  ],
  riskQueue: [
    item({ playerName: 'Jake Thompson', title: 'Address at-risk training stall', urgency: 'urgent', score: 78, recommendationType: 'risk_alert', daysSince: 8 }),
  ],
  pendingActionsCount: 4,
  overallHealthSignal: 'attention_needed',
}

// Pre-seeded thread context for "Who?" after broad query tests.
// Represents the thread that would be seeded from DEMO_ACADEMY_INTELLIGENCE_PACKET.attentionQueue[0].
export const THREAD_SEEDED_FROM_BROAD_QUERY: ConversationOperatingContext = {
  currentEntityType:            'player',
  currentEntityLabel:           'Sofia Martinez',
  currentEntityRoute:           '/director/players/player-sofia-martinez-001',
  currentRecommendationTitle:   null,
  currentRecommendationType:    null,
  currentRecommendationUrgency: null,
  currentRecommendationStatus:  null,
  currentTopic:                 'attention',
  currentGoal:                  'Review Sofia Martinez',
  currentNavigationTarget:      '/director/players/player-sofia-martinez-001',
  currentNavigationLabel:       'Open Sofia Martinez',
  threadStartedAt:              '2026-06-14T10:01:00Z',
  lastActiveAt:                 '2026-06-14T10:01:00Z',
  turnCount:                    1,
}

// ── Scenario input catalogue ──────────────────────────────────────────────────

export interface ScenarioInput {
  label:                   string
  userInput:               string
  threadCtx:               ConversationOperatingContext | null
  entityCtx:               EntityMemoryContext | null
  description:             string
  academyIntelligencePacket?: AcademyIntelligencePacket | null
}

export const DEMO_SCENARIOS: ScenarioInput[] = [
  // Part 6 — Player scenarios
  { label: 'player-01', userInput: "How's Alex?",         threadCtx: null,               entityCtx: PLAYER_ALEX_RIVERA,   description: 'Player status — first mention' },
  { label: 'player-02', userInput: 'Why?',                threadCtx: THREAD_ALEX_TURN4,  entityCtx: PLAYER_ALEX_RIVERA,   description: 'Follow-up why — entity context active' },
  { label: 'player-03', userInput: 'Should I worry?',     threadCtx: THREAD_ALEX_TURN4,  entityCtx: PLAYER_ALEX_RIVERA,   description: 'Worry follow-up — urgent recommendation' },
  { label: 'player-04', userInput: "Let's do it.",        threadCtx: THREAD_ALEX_TURN4,  entityCtx: PLAYER_ALEX_RIVERA,   description: 'Action: draft advancement proposed_action' },
  { label: 'player-05', userInput: 'Open it.',            threadCtx: THREAD_ALEX_TURN4,  entityCtx: PLAYER_ALEX_RIVERA,   description: 'Navigate to Alex profile' },
  { label: 'player-06', userInput: 'What changed?',       threadCtx: THREAD_ALEX_TURN4,  entityCtx: PLAYER_ALEX_RIVERA,   description: 'What changed follow-up' },
  { label: 'player-07', userInput: 'What would you do?',  threadCtx: THREAD_ALEX_TURN4,  entityCtx: PLAYER_ALEX_RIVERA,   description: 'COO opinion — urgent rec active' },
  { label: 'player-08', userInput: "How's Sofia?",        threadCtx: null,               entityCtx: PLAYER_SOFIA_MARTINEZ, description: 'At-risk player status' },
  { label: 'player-09', userInput: 'Should I worry?',     threadCtx: THREAD_SOFIA_TURN2, entityCtx: PLAYER_SOFIA_MARTINEZ, description: 'Worry follow-up — immediate urgency' },
  { label: 'player-10', userInput: 'What would you do?',  threadCtx: THREAD_SOFIA_TURN2, entityCtx: PLAYER_SOFIA_MARTINEZ, description: 'COO opinion — withdrawal risk' },
  // Part 7 — Coach scenarios
  { label: 'coach-01',  userInput: "How's Brian?",        threadCtx: null,               entityCtx: COACH_BRIAN_MITCHELL,  description: 'Coach status — first mention' },
  { label: 'coach-02',  userInput: "How's Sarah?",        threadCtx: null,               entityCtx: COACH_SARAH_KIM,       description: 'Coach status — support flag' },
  { label: 'coach-03',  userInput: 'Which coach needs support?', threadCtx: null,        entityCtx: null,                  description: 'Academy-level coach comparison — no entity context' },
  { label: 'coach-04',  userInput: 'What would you do?',  threadCtx: THREAD_COACH_BRIAN_TURN2, entityCtx: COACH_BRIAN_MITCHELL, description: 'COO opinion on coach — no recommendation' },
  // Part 8 — Parent scenarios
  { label: 'parent-01', userInput: 'Which parents need follow-up?', threadCtx: null,    entityCtx: null,                  description: 'Academy-level parent scan — no entity context' },
  { label: 'parent-02', userInput: "What's the concern with Sofia's parent?", threadCtx: null, entityCtx: PARENT_ANA_MARTINEZ, description: 'Specific parent concern' },
  { label: 'parent-03', userInput: 'What should I do?',   threadCtx: THREAD_SOFIA_TURN2, entityCtx: PARENT_ANA_MARTINEZ,  description: 'Action guidance — withdrawal risk' },
  // Part 9 — Curriculum scenarios
  { label: 'curr-01',   userInput: 'Which players are ready to advance?', threadCtx: null, entityCtx: null,               description: 'Academy-level advancement scan — no entity' },
  // Part 10 — Academy COO scenarios
  { label: 'acad-01',   userInput: "How's the academy?",  threadCtx: null,               entityCtx: ACADEMY_ENTITY,        description: 'Academy health overview' },
  { label: 'acad-02',   userInput: 'What is the biggest risk?', threadCtx: THREAD_ACADEMY_TURN1, entityCtx: ACADEMY_ENTITY, description: 'Biggest risk — academy thread active' },
  { label: 'acad-03',   userInput: 'What should I focus on this week?', threadCtx: THREAD_ACADEMY_TURN1, entityCtx: ACADEMY_ENTITY, description: 'Weekly focus — academy thread active' },
  { label: 'acad-04',   userInput: 'What should I ignore?', threadCtx: THREAD_ACADEMY_TURN1, entityCtx: ACADEMY_ENTITY,   description: 'Deferral guidance — academy thread' },
  // Mega Sprint 2561–2590 — Academy Intelligence Engine: new deterministic paths
  { label: 'intel-01',  userInput: 'Who needs attention?',              threadCtx: null, entityCtx: null, academyIntelligencePacket: DEMO_ACADEMY_INTELLIGENCE_PACKET, description: 'Attention queue — deterministic from academy packet' },
  { label: 'intel-02',  userInput: 'What should I focus on?',           threadCtx: null, entityCtx: null, academyIntelligencePacket: DEMO_ACADEMY_INTELLIGENCE_PACKET, description: 'Focus engine — top item from attention queue' },
  { label: 'intel-03',  userInput: 'What can wait?',                    threadCtx: null, entityCtx: null, academyIntelligencePacket: DEMO_ACADEMY_INTELLIGENCE_PACKET, description: 'Defer engine — low/medium items' },
  { label: 'intel-04',  userInput: 'Which players are ready to advance?', threadCtx: null, entityCtx: null, academyIntelligencePacket: DEMO_ACADEMY_INTELLIGENCE_PACKET, description: 'Advancement candidates from curriculum states' },
  { label: 'intel-05',  userInput: 'What is the biggest risk?',         threadCtx: null, entityCtx: null, academyIntelligencePacket: DEMO_ACADEMY_INTELLIGENCE_PACKET, description: 'Risk queue — top risk item' },
  { label: 'intel-06',  userInput: 'How is the academy doing?',         threadCtx: null, entityCtx: null, academyIntelligencePacket: DEMO_ACADEMY_INTELLIGENCE_PACKET, description: 'Academy status — health signal + counts' },
  { label: 'intel-07',  userInput: 'Which parents need a follow-up?',   threadCtx: null, entityCtx: null, academyIntelligencePacket: DEMO_ACADEMY_INTELLIGENCE_PACKET, description: 'Parent follow-up queue' },
  { label: 'intel-08',  userInput: 'What is our biggest opportunity?',  threadCtx: null, entityCtx: null, academyIntelligencePacket: DEMO_ACADEMY_INTELLIGENCE_PACKET, description: 'Opportunity engine — advancement candidates' },
  // Thread seeding: "Who?" after broad query — seeded thread from broad answer
  { label: 'seed-01',   userInput: 'Who?',   threadCtx: THREAD_SEEDED_FROM_BROAD_QUERY, entityCtx: PLAYER_SOFIA_MARTINEZ, description: 'Follow-up "Who?" with seeded thread from broad query' },
  { label: 'seed-02',   userInput: 'Open it.', threadCtx: THREAD_SEEDED_FROM_BROAD_QUERY, entityCtx: PLAYER_SOFIA_MARTINEZ, description: 'Navigate after seeded thread' },
  { label: 'seed-03',   userInput: 'Tell me more.', threadCtx: THREAD_SEEDED_FROM_BROAD_QUERY, entityCtx: PLAYER_SOFIA_MARTINEZ, description: 'Follow-up after seeded thread' },
]
