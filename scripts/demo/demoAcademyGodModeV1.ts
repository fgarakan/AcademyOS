// Mega Sprint 4291–4320 (+ enrichment) — Demo Academy God Mode Test Harness V1
//
// The single source of truth for the demo academy. ONE typed model used by the
// certification (offline God-Mode proof), the seed/reset runners (live DB), and the
// operating-scenario layer that proves DONNA can OPERATE the academy as a COO — not
// just read records. No new DONNA architecture: this only produces realistic, richly
// INTERCONNECTED data so the existing signals + Executive Intelligence have real,
// competing, tradeoff-laden decisions to reason over.
//
// Isolation + deletability: every record belongs to ONE demo academy. The academy row
// is tagged is_demo_data + seed_batch_id; children cascade via academy_id ON DELETE
// CASCADE, so deleting the academy removes the whole dataset and can never touch real data.

export const SEED_BATCH_ID = 'demo_academy_godmode_v1' as const
export const DEMO_ACADEMY_ID = '0d3a0000-0000-4000-8000-000000000001'

export function isDemoResettable(row: { is_demo_data?: boolean | null; seed_batch_id?: string | null }): boolean {
  return row.is_demo_data === true && row.seed_batch_id === SEED_BATCH_ID
}

// ── Coaches — personalities, load, and capacity (assignment tradeoffs) ──────────

export interface DemoCoach {
  key: 'c1' | 'c2' | 'c3'
  id: string
  firstName: string
  lastName: string
  specialty: string
  /** How they coach — shapes who they should and shouldn't take. */
  style: string
  capacityPerWeek: number
  currentLoad: number
  strengths: string[]
  /** A real coaching gap the Director must manage around. */
  developmentGap: string
}

const C1: DemoCoach = { key: 'c1', id: 'c1a00000-0000-4000-8000-000000000001', firstName: 'Diego', lastName: 'Marín', specialty: 'Red/Orange development', style: 'High-energy, patient with beginners; runs big groups well', capacityPerWeek: 8, currentLoad: 9, strengths: ['beginner engagement', 'group control'], developmentGap: 'Stretched thin — overloaded this week, quality slipping on late sessions' }
const C2: DemoCoach = { key: 'c2', id: 'c1a00000-0000-4000-8000-000000000002', firstName: 'Sara', lastName: 'Ortega', specialty: 'Green/Yellow technical', style: 'Precise, technical, calm; excellent 1:1 development', capacityPerWeek: 8, currentLoad: 3, strengths: ['technique', 'assessment accuracy'], developmentGap: 'Underused this week; not a natural fit for Red beginners' }
const C3: DemoCoach = { key: 'c3', id: 'c1a00000-0000-4000-8000-000000000003', firstName: 'Tom', lastName: 'Becker', specialty: 'HP / competition', style: 'Demanding, competition-focused; best with motivated players', capacityPerWeek: 5, currentLoad: 4, strengths: ['competition prep', 'high performers'], developmentGap: 'Low patience for disengaged or beginner players' }

// ── Players — journeys, trajectories, and goals (decisions need a trend) ─────────

export type PlayerArchetype =
  | 'ready_to_promote' | 'almost_ready' | 'stagnating' | 'missing_assessment' | 'declining_attendance'
  | 'parent_concern' | 'strong_progress' | 'no_curriculum_level' | 'overdue_coach_note' | 'new_onboarding'

export type DemoPlayerStatus = 'active' | 'pending_placement'
export type Trajectory = 'improving' | 'plateau' | 'declining'

export interface DemoPlayer {
  id: string
  firstName: string
  lastName: string
  archetype: PlayerArchetype
  status: DemoPlayerStatus
  levelStage: 'Red' | 'Orange' | 'Green' | 'Yellow' | 'HP' | null
  hasCurriculumState: boolean
  advancementEligible: boolean
  lastAssessedDaysAgo: number | null
  activeSignals: Array<{ type: 'stagnation' | 'attendance_decline' | 'parent_concern'; severity: 'low' | 'medium' | 'high'; title: string }>
  coachKey: 'c1' | 'c2' | 'c3'
  parentKey: string
  note: string
  // Enrichment — the player's journey, so promotion/retention decisions have evidence.
  trajectory: Trajectory
  /** A short metric trend (most recent last). e.g. assessment score over the term. */
  journey: number[]
  goal: string
}

function pid(n: number): string { return `b1a00000-0000-4000-8000-00000000000${n.toString(16)}` }
function gid(n: number): string { return `c2a00000-0000-4000-8000-00000000000${n.toString(16)}` }

const PLAYERS: DemoPlayer[] = [
  { id: pid(1), firstName: 'Maya', lastName: 'Lopez', archetype: 'ready_to_promote', status: 'active', levelStage: 'Green', hasCurriculumState: true, advancementEligible: true, lastAssessedDaysAgo: 14, activeSignals: [], coachKey: 'c2', parentKey: 'p1', note: 'Hit every advancement gate for Green 1 — ready for Green 2.', trajectory: 'improving', journey: [62, 68, 74, 81], goal: 'Promote to Green 2 and keep momentum' },
  { id: pid(2), firstName: 'Leo', lastName: 'Haddad', archetype: 'almost_ready', status: 'active', levelStage: 'Orange', hasCurriculumState: true, advancementEligible: false, lastAssessedDaysAgo: 21, activeSignals: [], coachKey: 'c1', parentKey: 'p2', note: 'One outcome short of Orange 3 — blocked at the Orange 2→3 gate.', trajectory: 'improving', journey: [55, 60, 64, 67], goal: 'Close the last Orange 3 outcome' },
  { id: pid(3), firstName: 'Sofia', lastName: 'Nilsson', archetype: 'stagnating', status: 'active', levelStage: 'Orange', hasCurriculumState: true, advancementEligible: false, lastAssessedDaysAgo: 35, activeSignals: [{ type: 'stagnation', severity: 'medium', title: 'No outcome progress in 60+ days' }], coachKey: 'c1', parentKey: 'p3', note: 'Plateaued at Orange 2 — same gate as Leo, but not progressing.', trajectory: 'plateau', journey: [58, 59, 58, 59], goal: 'Break the Orange 2 plateau' },
  { id: pid(4), firstName: 'Ben', lastName: 'Okafor', archetype: 'missing_assessment', status: 'active', levelStage: 'Green', hasCurriculumState: true, advancementEligible: false, lastAssessedDaysAgo: 120, activeSignals: [], coachKey: 'c2', parentKey: 'p4', note: 'Last assessed 120 days ago — decisions are flying blind.', trajectory: 'plateau', journey: [70, 71], goal: 'Reassess to unblock planning' },
  { id: pid(5), firstName: 'Ava', lastName: 'Rossi', archetype: 'declining_attendance', status: 'active', levelStage: 'Red', hasCurriculumState: true, advancementEligible: false, lastAssessedDaysAgo: 28, activeSignals: [{ type: 'attendance_decline', severity: 'high', title: 'Attendance down 40% over 3 weeks' }], coachKey: 'c1', parentKey: 'p5', note: 'Attendance dropping; parent is considering leaving — retention risk.', trajectory: 'declining', journey: [64, 61, 57, 52], goal: 'Re-engage before she churns' },
  { id: pid(6), firstName: 'Noah', lastName: 'Yilmaz', archetype: 'parent_concern', status: 'active', levelStage: 'Orange', hasCurriculumState: true, advancementEligible: false, lastAssessedDaysAgo: 40, activeSignals: [{ type: 'parent_concern', severity: 'medium', title: 'Parent asked about progress and group fit' }], coachKey: 'c1', parentKey: 'p6', note: 'Parent raised a concern; reply drafted, pending approval.', trajectory: 'plateau', journey: [60, 61, 60], goal: 'Reassure the parent with a clear plan' },
  { id: pid(7), firstName: 'Emma', lastName: 'Schmidt', archetype: 'strong_progress', status: 'active', levelStage: 'Yellow', hasCurriculumState: true, advancementEligible: false, lastAssessedDaysAgo: 10, activeSignals: [], coachKey: 'c3', parentKey: 'p7', note: 'Strong, steady progress at Yellow 1; a future HP candidate.', trajectory: 'improving', journey: [72, 76, 79, 83], goal: 'Stretch toward HP track' },
  { id: pid(8), firstName: 'Liam', lastName: 'Walsh', archetype: 'no_curriculum_level', status: 'active', levelStage: null, hasCurriculumState: false, advancementEligible: false, lastAssessedDaysAgo: null, activeSignals: [], coachKey: 'c2', parentKey: 'p8', note: 'Active for 3 weeks but never assigned a level — invisible to the spine.', trajectory: 'plateau', journey: [], goal: 'Assess and place on the curriculum' },
  { id: pid(9), firstName: 'Zoe', lastName: 'Kovač', archetype: 'overdue_coach_note', status: 'active', levelStage: 'Green', hasCurriculumState: true, advancementEligible: false, lastAssessedDaysAgo: 24, activeSignals: [], coachKey: 'c2', parentKey: 'p9', note: 'Session done; coach wrap-up still pending approval — record is stale.', trajectory: 'improving', journey: [66, 69, 72], goal: 'Capture the session outcome' },
  { id: pid(10), firstName: 'Kai', lastName: 'Andersson', archetype: 'new_onboarding', status: 'pending_placement', levelStage: null, hasCurriculumState: false, advancementEligible: false, lastAssessedDaysAgo: null, activeSignals: [], coachKey: 'c3', parentKey: 'p10', note: 'Just enrolled — awaiting placement assessment.', trajectory: 'plateau', journey: [], goal: 'Run placement and assign a group' },
]

// ── Parents — situations and sentiment (real relationship management) ────────────

export type ParentSituation = 'pushing_for_promotion' | 'considering_leaving' | 'happy' | 'concern_raised' | 'wants_more_contact' | 'new'
export type ParentSentiment = 'positive' | 'neutral' | 'at_risk'

export interface DemoParent {
  key: string
  id: string
  firstName: string
  lastName: string
  childPlayerId: string
  situation: ParentSituation
  sentiment: ParentSentiment
  note: string
}

const PARENT_META: Array<{ situation: ParentSituation; sentiment: ParentSentiment; note: string }> = [
  { situation: 'pushing_for_promotion', sentiment: 'positive', note: 'Keen for Maya to move up — wants to know the timeline.' },
  { situation: 'happy', sentiment: 'positive', note: 'Pleased with Leo; trusts the plan.' },
  { situation: 'wants_more_contact', sentiment: 'neutral', note: "Wants more updates on Sofia's plateau." },
  { situation: 'happy', sentiment: 'neutral', note: 'Quiet; unaware Ben is overdue for assessment.' },
  { situation: 'considering_leaving', sentiment: 'at_risk', note: "Frustrated by Ava's attendance friction; weighing other academies." },
  { situation: 'concern_raised', sentiment: 'at_risk', note: 'Raised a concern about Noah; awaiting DONNA-drafted reply.' },
  { situation: 'happy', sentiment: 'positive', note: 'Delighted with Emma; open to the HP pathway.' },
  { situation: 'wants_more_contact', sentiment: 'neutral', note: "Asked why Liam hasn't been placed yet." },
  { situation: 'happy', sentiment: 'positive', note: 'Happy with Zoe; expects the session recap.' },
  { situation: 'new', sentiment: 'neutral', note: 'New family; first impression rides on a smooth placement.' },
]

const PARENTS: DemoParent[] = PLAYERS.map((p, i) => ({
  key: p.parentKey,
  id: gid(i + 1),
  firstName: ['Carmen', 'Rana', 'Erik', 'Grace', 'Marco', 'Aylin', 'Klaus', 'Niamh', 'Petra', 'Sven'][i],
  lastName: p.lastName,
  childPlayerId: p.id,
  situation: PARENT_META[i].situation,
  sentiment: PARENT_META[i].sentiment,
  note: PARENT_META[i].note,
}))

export interface DemoApproval {
  id: string
  targetModule: 'parent_communication' | 'session_wrap_up_v1'
  label: string
  playerId: string
  riskLevel: 'low' | 'medium' | 'high'
}

const APPROVALS: DemoApproval[] = [
  { id: 'd1a00000-0000-4000-8000-000000000001', targetModule: 'parent_communication', label: "Reply to Noah's parent about progress", playerId: pid(6), riskLevel: 'medium' },
  { id: 'd1a00000-0000-4000-8000-000000000002', targetModule: 'session_wrap_up_v1', label: "Approve Zoe's session wrap-up", playerId: pid(9), riskLevel: 'low' },
]

export interface DemoSession {
  id: string
  name: string
  coachKey: 'c1' | 'c2' | 'c3'
  scheduledInDays: number
  status: 'planned' | 'completed'
  wrapUpFiled: boolean
  /** A real scheduling pressure on this slot, if any. */
  conflict?: 'coach_overloaded' | 'needs_coverage' | 'wrap_up_overdue'
}

const SESSIONS: DemoSession[] = [
  { id: 'e1a00000-0000-4000-8000-000000000001', name: 'Red foundations', coachKey: 'c1', scheduledInDays: 1, status: 'planned', wrapUpFiled: true, conflict: 'coach_overloaded' },
  { id: 'e1a00000-0000-4000-8000-000000000002', name: 'Orange rally control', coachKey: 'c1', scheduledInDays: 2, status: 'planned', wrapUpFiled: true, conflict: 'coach_overloaded' },
  { id: 'e1a00000-0000-4000-8000-000000000003', name: 'Green transition', coachKey: 'c2', scheduledInDays: 2, status: 'planned', wrapUpFiled: true },
  { id: 'e1a00000-0000-4000-8000-000000000004', name: 'Yellow tactics', coachKey: 'c3', scheduledInDays: 3, status: 'planned', wrapUpFiled: true },
  { id: 'e1a00000-0000-4000-8000-000000000005', name: 'Saturday Red clinic (extra)', coachKey: 'c1', scheduledInDays: 4, status: 'planned', wrapUpFiled: true, conflict: 'needs_coverage' },
  { id: 'e1a00000-0000-4000-8000-000000000006', name: 'Green clinic (wrap-up overdue)', coachKey: 'c2', scheduledInDays: -1, status: 'completed', wrapUpFiled: false, conflict: 'wrap_up_overdue' },
]

// ── Curriculum bottleneck — a real gate jamming progression ──────────────────────

export interface CurriculumBottleneck {
  gate: string
  stuckPlayerIds: string[]
  missingContent: string[]
  note: string
}

const BOTTLENECKS: CurriculumBottleneck[] = [
  {
    gate: 'Orange 2 → Orange 3',
    stuckPlayerIds: [pid(2), pid(3)], // Leo (almost), Sofia (stagnating)
    missingContent: ['Transition-to-attack activity', 'Serve-consistency outcome rubric'],
    note: 'Two players sit at the Orange 2→3 gate; one is ready bar a missing-content outcome, one has plateaued. Fixing the gate content unblocks both.',
  },
]

// ── Scheduling conflicts — competing operational pressures ───────────────────────

export interface SchedulingConflict {
  id: string
  kind: 'overload' | 'coverage_gap' | 'wrap_up_overdue'
  description: string
  involvedCoachKeys: Array<'c1' | 'c2' | 'c3'>
  involvedSessionIds: string[]
  tradeoff: string
}

const SCHEDULING_CONFLICTS: SchedulingConflict[] = [
  { id: 'sc1', kind: 'overload', description: 'Diego is at 9 sessions against an 8 capacity; late-week quality is slipping.', involvedCoachKeys: ['c1', 'c2'], involvedSessionIds: ['e1a00000-0000-4000-8000-000000000005'], tradeoff: 'Move the extra Red clinic to Sara to protect quality — but Sara is a technical/Green specialist, weaker with Red beginners.' },
  { id: 'sc2', kind: 'wrap_up_overdue', description: 'A completed Green clinic has no wrap-up filed, so its outcomes are missing from the record.', involvedCoachKeys: ['c2'], involvedSessionIds: ['e1a00000-0000-4000-8000-000000000006'], tradeoff: 'Approving the (pending) wrap-up updates progress data, but it is waiting in the review queue behind a parent reply.' },
]

// ── Operating scenarios — the interconnected stories DONNA must navigate ─────────

export interface OperatingScenario {
  id: string
  title: string
  /** A Director utterance or situation that triggers it. */
  trigger: string
  /** Two or more things that genuinely compete for the Director's attention. */
  competingPriorities: string[]
  entities: { players?: string[]; coaches?: Array<'c1' | 'c2' | 'c3'>; parents?: string[] }
  tradeoff: string
  recommendedDecision: string
  nextSteps: string[]
}

const OPERATING_SCENARIOS: OperatingScenario[] = [
  {
    id: 's1_morning_triage',
    title: 'Morning triage — what comes first?',
    trigger: 'What should I do today?',
    competingPriorities: ['Clear two pending approvals (parent reply + coach wrap-up)', 'Finish the last onboarding step', 'Place Liam (active but no level) and Kai (intake)', "Act on Ava's retention risk"],
    entities: { players: [pid(5), pid(8), pid(10), pid(6), pid(9)], coaches: ['c2'] },
    tradeoff: 'The approvals are fast wins that unblock parent + coach trust; the retention risk (Ava) is slower but higher stakes. Sequencing matters — do the 2-minute approvals first, then protect Ava before she churns.',
    recommendedDecision: 'Clear the parent reply + wrap-up first (low effort, unblocks others), then open the retention play on Ava, then finish onboarding.',
    nextSteps: ['Open the review queue and approve both items', 'Draft a re-engagement plan for Ava', 'Complete the final onboarding step'],
  },
  {
    id: 's2_promote_maya',
    title: 'Promote Maya — but Green has pressure',
    trigger: 'Should I promote this player?',
    competingPriorities: ['Maya is advancement-eligible and her parent is pushing', 'Sara (Green coach) has capacity but Ben in Green is overdue for assessment'],
    entities: { players: [pid(1), pid(4)], coaches: ['c2'], parents: ['p1'] },
    tradeoff: "Promoting Maya is clearly earned (improving 62→81) and pleases an eager parent — but it adds to Sara's Green group where Ben is already flying blind without a recent assessment. Promote, and pair it with reassessing Ben so Green stays healthy.",
    recommendedDecision: 'Promote Maya to Green 2 now; in the same move, schedule Ben’s overdue reassessment so the Green group is not carrying blind spots.',
    nextSteps: ['Approve Maya’s promotion in the level-up queue', 'Book Ben’s reassessment with Sara', 'Tell Maya’s parent the timeline'],
  },
  {
    id: 's3_orange_bottleneck',
    title: 'Unjam the Orange 2→3 gate',
    trigger: 'Why are players stuck at Orange?',
    competingPriorities: ['Leo is one outcome from promotion', 'Sofia has plateaued at the same gate', 'The gate is missing curriculum content'],
    entities: { players: [pid(2), pid(3)], coaches: ['c1'] },
    tradeoff: 'You can push Leo through with a one-off assessment, but Sofia needs a different intervention, and the real cause is a missing-content outcome at the gate. Fixing the gate content helps every future Orange player, not just these two.',
    recommendedDecision: 'Fix the Orange 2→3 missing content first (systemic), then assess Leo for promotion and set Sofia a targeted plateau-breaker plan.',
    nextSteps: ['Add the transition-to-attack activity + serve rubric to the gate', 'Assess Leo for Orange 3', 'Give Sofia a focused 2-week plan'],
  },
  {
    id: 's4_coach_overload',
    title: 'Diego is overloaded',
    trigger: 'Which coach should take this session?',
    competingPriorities: ['Diego is over capacity (9/8) and quality is slipping', 'Sara is underused (3/8) but is a Green/Yellow specialist, weak with Red'],
    entities: { coaches: ['c1', 'c2'], players: [pid(5)] },
    tradeoff: 'Moving the extra Red clinic to Sara balances load but risks a worse session for Red beginners (including Ava, already disengaging). Either co-staff it, or move a Green session off Sara to free Diego for Red.',
    recommendedDecision: 'Keep Red with Diego but shift one of his Green-adjacent slots to Sara, lowering Diego to 8 without putting beginners on a non-specialist.',
    nextSteps: ['Reassign one Orange/Green slot from Diego to Sara', 'Confirm Diego back at capacity', 'Protect Ava’s Red session quality'],
  },
  {
    id: 's6_emma_hp_pathway',
    title: 'Stretch Emma toward the HP track',
    trigger: 'Who is ready for more?',
    competingPriorities: ['Emma is improving fast (72→83) and ready to be stretched', 'Tom (HP) has scarce capacity (4/5) and little patience for anyone not fully motivated'],
    entities: { players: [pid(7)], coaches: ['c3'], parents: ['p7'] },
    tradeoff: 'Moving Emma toward HP with Tom accelerates a strong player and delights an open parent — but it spends Tom’s scarce slot and only works if Emma is genuinely motivated; push too early and you risk her confidence.',
    recommendedDecision: 'Offer Emma a trial HP block with Tom, and confirm her motivation + parent buy-in before committing the slot.',
    nextSteps: ['Schedule an HP trial session with Tom', 'Confirm Emma’s motivation and parent buy-in', 'Reassess after the trial block'],
  },
  {
    id: 's5_retention_ava',
    title: 'Save Ava before she churns',
    trigger: 'Who needs attention?',
    competingPriorities: ["Ava's attendance is down 40% and her parent is considering leaving", 'Her Red sessions sit with an overloaded coach'],
    entities: { players: [pid(5)], coaches: ['c1'], parents: ['p5'] },
    tradeoff: 'A generic check-in is cheap but weak; a real fix means protecting her session quality (coach load) AND a direct parent conversation. The cost is Director time now versus losing a family later.',
    recommendedDecision: 'Open a retention play: a personal parent call this week + ensure her Red sessions are well-staffed, then a short re-engagement goal.',
    nextSteps: ['Director calls Ava’s parent', 'Confirm a strong coach on her Red sessions', 'Set a 2-week re-engagement goal'],
  },
]

// ── Dataset ─────────────────────────────────────────────────────────────────────

export interface DemoAcademyDataset {
  seedBatchId: string
  academy: { id: string; name: string; slug: string; isDemoData: true }
  director: { id: string; firstName: string; lastName: string; email: string }
  coaches: DemoCoach[]
  players: DemoPlayer[]
  parents: DemoParent[]
  approvals: DemoApproval[]
  sessions: DemoSession[]
  bottlenecks: CurriculumBottleneck[]
  schedulingConflicts: SchedulingConflict[]
  scenarios: OperatingScenario[]
  onboarding: { stepsComplete: number; stepsTotal: number; complete: boolean }
}

export const demoAcademyGodModeV1: DemoAcademyDataset = {
  seedBatchId: SEED_BATCH_ID,
  academy: { id: DEMO_ACADEMY_ID, name: 'God Mode Demo Academy', slug: 'godmode-demo', isDemoData: true },
  director: { id: 'a1a00000-0000-4000-8000-000000000001', firstName: 'Demo', lastName: 'Director', email: 'demo.director@godmode.test' },
  coaches: [C1, C2, C3],
  players: PLAYERS,
  parents: PARENTS,
  approvals: APPROVALS,
  sessions: SESSIONS,
  bottlenecks: BOTTLENECKS,
  schedulingConflicts: SCHEDULING_CONFLICTS,
  scenarios: OPERATING_SCENARIOS,
  onboarding: { stepsComplete: 6, stepsTotal: 7, complete: false },
}

// ── Interconnection helpers (used by the operating certification) ────────────────

/** Every entity key/id that appears in any operating scenario. */
export function entitiesInScenarios(ds: DemoAcademyDataset): { players: Set<string>; coaches: Set<string>; parents: Set<string> } {
  const players = new Set<string>(), coaches = new Set<string>(), parents = new Set<string>()
  for (const s of ds.scenarios) {
    s.entities.players?.forEach((p) => players.add(p))
    s.entities.coaches?.forEach((c) => coaches.add(c))
    s.entities.parents?.forEach((p) => parents.add(p))
  }
  return { players, coaches, parents }
}
