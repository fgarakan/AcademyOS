// Academy Health Source Map — Sprint 497
// Sprint 2016–2030 — updated to reflect activated signals
// Maps each DONNA academy health KPI to its data source, availability status,
// update frequency, and fallback copy.
// Pure TypeScript constants — no DB calls, no logic.

// ── Types ─────────────────────────────────────────────────────────────────────

export type HealthKPIAvailability = 'live' | 'partial' | 'deferred' | 'not_yet_built'

export type HealthKPIUpdateFrequency =
  | 'real_time'
  | 'on_wrap_up_submit'
  | 'daily'
  | 'weekly'
  | 'on_director_action'
  | 'manual'

export interface HealthKPISource {
  id: string
  label: string
  description: string
  tables: string[]
  fields: string[]
  queryPattern: string
  updateFrequency: HealthKPIUpdateFrequency
  availability: HealthKPIAvailability
  donnaMissingDataCopy: string
  donnaAvailableCopy: string
  blockedBy: string[]
}

// ── Source map ────────────────────────────────────────────────────────────────

export const ACADEMY_HEALTH_SOURCE_MAP: HealthKPISource[] = [

  // ── Curriculum Bottleneck ─────────────────────────────────────────────────

  {
    id: 'curriculum_bottleneck',
    label: 'Curriculum Bottleneck',
    description: 'Curriculum levels where players are stalled — lowest avg requirement completion and top tagged coach concern from the last 30 days.',
    tables: ['player_requirement_progress', 'curriculum_levels', 'coach_observations'],
    fields: ['player_requirement_progress.status', 'player_requirement_progress.curriculum_level_id', 'coach_observations.tags', 'coach_observations.observation_type'],
    queryPattern:
      'Aggregate player_requirement_progress by curriculum_level_id: compute avg completion rate and stall count. Cross-reference coach_observations.tags for concern patterns. Sorted by lowest completion first. Filtered by academy_id.',
    updateFrequency: 'weekly',
    availability: 'partial',
    donnaMissingDataCopy: "I don't have enough requirement progress data yet. Once players start working through requirements, I'll surface bottlenecks here.",
    donnaAvailableCopy: "Here's where your curriculum is creating the most friction — levels where players are stalled and requirements aren't moving.",
    blockedBy: [],
  },

  // ── Curriculum Template Coverage Gaps ────────────────────────────────────

  {
    id: 'curriculum_template_coverage_gaps',
    label: 'Curriculum Template Coverage Gaps',
    description: 'Curriculum levels that have enrolled players but no matching class template assigned.',
    tables: ['player_curriculum_states', 'templates'],
    fields: ['player_curriculum_states.current_level_id', 'templates.curriculum_level_id', 'templates.tags'],
    queryPattern:
      'Set difference: enrolled level IDs from player_curriculum_states MINUS curriculum_level_id values from non-fitness templates. Count = uncovered levels.',
    updateFrequency: 'on_director_action',
    availability: 'live',
    donnaMissingDataCopy: "No template coverage gap data available.",
    donnaAvailableCopy: "These curriculum levels have active players but no class template assigned.",
    blockedBy: [],
  },

  // ── Tagged Curriculum Concern ─────────────────────────────────────────────

  {
    id: 'tagged_curriculum_concern',
    label: 'Tagged Curriculum Concern',
    description: 'The most frequently tagged skill concern from coach observations in the last 30 days. Requires ≥2 observations for signal confidence.',
    tables: ['coach_observations'],
    fields: ['coach_observations.tags', 'coach_observations.created_at', 'coach_observations.observation_type'],
    queryPattern:
      'Aggregate coach_observations.tags for concern-type observations in last 30 days. Return top tag with count. Filtered by academy_id.',
    updateFrequency: 'on_wrap_up_submit',
    availability: 'partial',
    donnaMissingDataCopy: "No recurring concern tags detected from recent coach observations.",
    donnaAvailableCopy: "This skill area is being flagged repeatedly by coaches.",
    blockedBy: ['requires ≥2 observations for confidence threshold'],
  },

  // ── Player Progress Stalls ────────────────────────────────────────────────

  {
    id: 'player_progress_stalls',
    label: 'Player Progress Stalls',
    description: 'Players enrolled for more than 180 days without advancement eligibility — potential curriculum blockers or gate evidence gaps.',
    tables: ['player_curriculum_states'],
    fields: ['player_curriculum_states.enrolled_at', 'player_curriculum_states.advancement_eligible', 'player_curriculum_states.current_level_id'],
    queryPattern:
      'Filter player_curriculum_states where enrolled_at <= 180 days ago AND advancement_eligible != true. Join to players for names.',
    updateFrequency: 'daily',
    availability: 'live',
    donnaMissingDataCopy: "No stalled players detected.",
    donnaAvailableCopy: "These players have been at their current level for more than 180 days without meeting advancement criteria.",
    blockedBy: [],
  },

  // ── Stale Review Queue ────────────────────────────────────────────────────

  {
    id: 'stale_review_queue',
    label: 'Stale Review Queue',
    description: 'Age in days of the oldest pending proposed_action. Triggers when a review item has been waiting 7+ days.',
    tables: ['proposed_actions'],
    fields: ['proposed_actions.created_at', 'proposed_actions.status', 'proposed_actions.academy_id'],
    queryPattern:
      'SELECT created_at FROM proposed_actions WHERE status = pending_review AND academy_id = $1 ORDER BY created_at ASC LIMIT 1. Compute days since.',
    updateFrequency: 'real_time',
    availability: 'live',
    donnaMissingDataCopy: "No pending review items.",
    donnaAvailableCopy: "The review queue has items that have been waiting more than a week.",
    blockedBy: [],
  },

  // ── Advancement Eligible ──────────────────────────────────────────────────

  {
    id: 'advancement_eligible',
    label: 'Advancement Eligible Players',
    description: 'Players flagged as advancement-eligible in player_curriculum_states — ready for director review and level confirmation.',
    tables: ['player_curriculum_states'],
    fields: ['player_curriculum_states.advancement_eligible', 'player_curriculum_states.player_id'],
    queryPattern:
      'COUNT(*) FROM player_curriculum_states WHERE advancement_eligible = true AND academy_id = $1.',
    updateFrequency: 'on_director_action',
    availability: 'live',
    donnaMissingDataCopy: "No players are currently flagged as advancement-eligible.",
    donnaAvailableCopy: "These players meet advancement criteria and are waiting for director confirmation.",
    blockedBy: [],
  },

  // ── Onboarding Readiness ──────────────────────────────────────────────────

  {
    id: 'onboarding_readiness',
    label: 'Onboarding Readiness',
    description: 'Academy setup completeness — derived from active players, class templates, and session existence. Signals whether the academy is ready for full operation.',
    tables: ['players', 'templates', 'sessions'],
    fields: ['players.player_status', 'templates.tags', 'sessions.id'],
    queryPattern:
      'Derived: activePlayers > 0 AND classTemplateCount > 0 AND sessionsExist → ready_signal. Partial/not_started when missing one or more.',
    updateFrequency: 'on_director_action',
    availability: 'live',
    donnaMissingDataCopy: "Academy setup is incomplete.",
    donnaAvailableCopy: "Academy is fully operational.",
    blockedBy: [],
  },

  // ── Assessment Coverage Gaps ──────────────────────────────────────────────

  {
    id: 'assessment_coverage_gaps',
    label: 'Assessment Coverage Gaps',
    description: 'Players overdue for reassessment based on the reassessment pipeline.',
    tables: ['players', 'player_assessments'],
    fields: ['players.player_status', 'player_assessments.created_at', 'player_assessments.assessment_type'],
    queryPattern:
      'getReassessmentPipeline() — filters players where next assessment due date has passed. Urgency: overdue or due_soon.',
    updateFrequency: 'daily',
    availability: 'live',
    donnaMissingDataCopy: "No players are overdue for reassessment.",
    donnaAvailableCopy: "These players are overdue for their next scheduled reassessment.",
    blockedBy: [],
  },

  // ── Player Attention Risk ──────────────────────────────────────────────────

  {
    id: 'player_attention_risk',
    label: 'Player Attention Risk',
    description: 'Players who need immediate director or coach attention — on hold or due for reassessment.',
    tables: ['players', 'coach_observations', 'proposed_actions'],
    fields: ['players.player_status', 'proposed_actions.target_module', 'proposed_actions.status'],
    queryPattern:
      'Filter players where player_status IN (on_hold, reassessment_due). Augmented by proposed_actions with pending_review status.',
    updateFrequency: 'on_wrap_up_submit',
    availability: 'live',
    donnaMissingDataCopy: "No players currently flagged for attention.",
    donnaAvailableCopy: 'Based on current status flags, here are the players who need your attention.',
    blockedBy: [],
  },

  // ── Wrap-Up Coverage Rate ─────────────────────────────────────────────────

  {
    id: 'wrap_up_coverage_rate',
    label: 'Wrap-Up Coverage Rate',
    description: 'Percentage of completed sessions in the last 30 days that have a coach voice_note wrap-up submitted.',
    tables: ['sessions', 'voice_notes'],
    fields: ['sessions.id', 'sessions.status', 'sessions.scheduled_date', 'voice_notes.session_id'],
    queryPattern:
      'Count sessions WHERE status=completed AND scheduled_date >= 30dAgo. Cross-reference voice_notes.session_id to determine which sessions have wrap-ups. Compute coverage %.',
    updateFrequency: 'on_wrap_up_submit',
    availability: 'live',
    donnaMissingDataCopy: "Wrap-up coverage data isn't available yet.",
    donnaAvailableCopy: 'Wrap-up coverage this week:',
    blockedBy: [],
  },

  // ── Review Queue Throughput ────────────────────────────────────────────────

  {
    id: 'review_queue_throughput',
    label: 'Review Queue Throughput',
    description: 'How quickly proposed actions are moving from pending_review to approved to applied.',
    tables: ['proposed_actions'],
    fields: ['proposed_actions.status', 'proposed_actions.created_at', 'proposed_actions.approved_at', 'proposed_actions.applied_at'],
    queryPattern:
      'Compute avg(approved_at - created_at) and avg(applied_at - approved_at) grouped by target_module and week, filtered by academy_id',
    updateFrequency: 'on_director_action',
    availability: 'not_yet_built',
    donnaMissingDataCopy: "Review queue throughput tracking will be available once the proposed_actions write-back is active.",
    donnaAvailableCopy: "Here's how fast items are moving through the review queue.",
    blockedBy: ['approved_at and applied_at timestamp fields not yet populated'],
  },

  // ── Group Health ───────────────────────────────────────────────────────────

  {
    id: 'group_health',
    label: 'Group Health',
    description: 'Health score per group based on attendance rates, session completion, wrap-up quality, and observation patterns.',
    tables: ['sessions', 'session_attendance', 'coach_observations'],
    fields: ['sessions.status', 'session_attendance.attended', 'coach_observations.observation_type'],
    queryPattern:
      'Aggregate by group_id: avg attendance rate, pct sessions completed, observation sentiment, wrap-up submission rate, filtered by academy_id',
    updateFrequency: 'daily',
    availability: 'deferred',
    donnaMissingDataCopy: "I don't have enough session history to score group health yet. I'll need a few weeks of wrap-up data to establish baselines.",
    donnaAvailableCopy: "Here's how each group is trending this week.",
    blockedBy: ['group health aggregation view not built'],
  },

  // ── Parent Trust Coverage ──────────────────────────────────────────────────

  {
    id: 'parent_trust_coverage',
    label: 'Parent Trust Coverage',
    description: 'Which player families have had recent director-approved parent communication vs. those with no recent contact.',
    tables: ['proposed_actions', 'players'],
    fields: ['proposed_actions.target_module', 'proposed_actions.status', 'proposed_actions.applied_at', 'players.parent_id'],
    queryPattern:
      'For each active player: find most recent parent_update proposed action with status=applied. Flag players where last contact > 30 days or no contact ever, filtered by academy_id',
    updateFrequency: 'on_director_action',
    availability: 'not_yet_built',
    donnaMissingDataCopy: "Parent communication tracking isn't set up yet. Once parent message approvals are live, I'll track coverage here.",
    donnaAvailableCopy: "Here's the parent communication coverage across your academy.",
    blockedBy: ['parent_update adapter', 'parent message send trigger', 'parent contact history table'],
  },

  // ── Coach Support Needed ───────────────────────────────────────────────────

  {
    id: 'coach_support_needed',
    label: 'Coach Support Needed',
    description: 'Coaches who may need extra support based on wrap-up frequency, observation quality, and follow-up completion rate.',
    tables: ['sessions', 'proposed_actions', 'coach_observations'],
    fields: ['sessions.coach_id', 'proposed_actions.status', 'coach_observations.created_at'],
    queryPattern:
      'Identify coaches with: wrap-up submission gap > 3 sessions, OR high ratio of unresolved follow-ups, OR no observations in > 5 sessions, filtered by academy_id',
    updateFrequency: 'weekly',
    availability: 'deferred',
    donnaMissingDataCopy: "I can't assess coach support needs without more session and wrap-up history. Check back after a few weeks of data.",
    donnaAvailableCopy: "A few coaches may benefit from support. Here's what I'm seeing.",
    blockedBy: ['coach engagement scoring view not built'],
  },

]

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getHealthKPISource(id: string): HealthKPISource | undefined {
  return ACADEMY_HEALTH_SOURCE_MAP.find(s => s.id === id)
}

export function getLiveHealthKPIs(): HealthKPISource[] {
  return ACADEMY_HEALTH_SOURCE_MAP.filter(s => s.availability === 'live' || s.availability === 'partial')
}

export function getDeferredHealthKPIs(): HealthKPISource[] {
  return ACADEMY_HEALTH_SOURCE_MAP.filter(s => s.availability === 'deferred' || s.availability === 'not_yet_built')
}

export function getHealthKPIsByAvailability(availability: HealthKPIAvailability): HealthKPISource[] {
  return ACADEMY_HEALTH_SOURCE_MAP.filter(s => s.availability === availability)
}
