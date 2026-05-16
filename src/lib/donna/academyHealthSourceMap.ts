// Academy Health Source Map — Sprint 497
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

  // ── Player Attention Risk ──────────────────────────────────────────────────

  {
    id: 'player_attention_risk',
    label: 'Player Attention Risk',
    description: 'Players who need immediate director or coach attention based on recent observations, absences, or support flags.',
    tables: ['coach_notes', 'proposed_actions', 'session_attendance'],
    fields: ['coach_notes.status', 'proposed_actions.target_module', 'proposed_actions.status', 'session_attendance.attended'],
    queryPattern:
      'SELECT players with pending player_support proposed actions OR coach_notes with observationType=concern AND status=pending_review, filtered by academy_id',
    updateFrequency: 'on_wrap_up_submit',
    availability: 'partial',
    donnaMissingDataCopy: "I don't have enough wrap-up data yet to flag attention risks. Once coaches start submitting wrap-ups, I'll surface patterns here.",
    donnaAvailableCopy: 'Based on recent wrap-ups, here are the players who need your attention.',
    blockedBy: ['coach_notes table needs wrap-up data', 'proposed_actions player_support items'],
  },

  // ── Group Health ───────────────────────────────────────────────────────────

  {
    id: 'group_health',
    label: 'Group Health',
    description: 'Health score per group based on attendance rates, session completion, wrap-up quality, and observation patterns.',
    tables: ['daily_sessions', 'session_attendance', 'coach_notes', 'program_templates'],
    fields: ['daily_sessions.completed_as_planned', 'session_attendance.attended', 'coach_notes.observation_type'],
    queryPattern:
      'Aggregate by group_id: avg attendance rate, pct sessions completed as planned, observation sentiment, wrap-up submission rate, filtered by academy_id',
    updateFrequency: 'daily',
    availability: 'deferred',
    donnaMissingDataCopy: "I don't have enough session history to score group health yet. I'll need a few weeks of wrap-up data to establish baselines.",
    donnaAvailableCopy: "Here's how each group is trending this week.",
    blockedBy: ['session wrap-up write-back (Sprint 490+)', 'group health aggregation view'],
  },

  // ── Coach Support Needed ───────────────────────────────────────────────────

  {
    id: 'coach_support_needed',
    label: 'Coach Support Needed',
    description: 'Coaches who may need extra support based on wrap-up frequency, observation quality, and follow-up completion rate.',
    tables: ['daily_sessions', 'proposed_actions', 'coach_notes'],
    fields: ['daily_sessions.coach_id', 'proposed_actions.status', 'coach_notes.created_at'],
    queryPattern:
      'Identify coaches with: wrap-up submission gap > 3 sessions, OR high ratio of unresolved follow-ups, OR no observations in > 5 sessions, filtered by academy_id',
    updateFrequency: 'weekly',
    availability: 'deferred',
    donnaMissingDataCopy: "I can't assess coach support needs without more session and wrap-up history. Check back after a few weeks of data.",
    donnaAvailableCopy: "A few coaches may benefit from support. Here's what I'm seeing.",
    blockedBy: ['session wrap-up write-back', 'coach engagement scoring view'],
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
    blockedBy: ['parent_update adapter (Sprint 486)', 'parent message send trigger', 'parent contact history table'],
  },

  // ── Curriculum Bottleneck ─────────────────────────────────────────────────

  {
    id: 'curriculum_bottleneck',
    label: 'Curriculum Bottleneck',
    description: 'Skills, blocks, or gates where a disproportionate number of players are stuck or have been flagged in observations.',
    tables: ['coach_notes', 'player_curriculum_levels', 'curriculum_requirements'],
    fields: ['coach_notes.skill_tag', 'player_curriculum_levels.current_level', 'curriculum_requirements.gate_skill'],
    queryPattern:
      'Aggregate coach_notes by skill_tag: find tags with repeated concern observations across multiple players. Cross-reference with curriculum_requirements to identify gate blocks, filtered by academy_id',
    updateFrequency: 'weekly',
    availability: 'deferred',
    donnaMissingDataCopy: "I don't have enough skill-tagged observations to identify curriculum bottlenecks yet. More wrap-ups with skill tags will help.",
    donnaAvailableCopy: "I've spotted some recurring patterns in skill observations that might indicate curriculum bottlenecks.",
    blockedBy: ['skill_tag population from wrap-ups', 'curriculum_requirements table', 'bottleneck aggregation view'],
  },

  // ── Wrap-Up Coverage Rate ─────────────────────────────────────────────────

  {
    id: 'wrap_up_coverage_rate',
    label: 'Wrap-Up Coverage Rate',
    description: 'Percentage of sessions this week that have a coach wrap-up submitted vs. outstanding.',
    tables: ['daily_sessions', 'proposed_actions'],
    fields: ['daily_sessions.id', 'proposed_actions.source_type', 'proposed_actions.session_id'],
    queryPattern:
      'Count daily_sessions in date range grouped by academy_id. Count distinct session_ids in proposed_actions where source_type=coach_wrap_up_v2. Compute coverage rate, filtered by academy_id',
    updateFrequency: 'on_wrap_up_submit',
    availability: 'partial',
    donnaMissingDataCopy: "I can see how many sessions happened but I can't verify wrap-up submissions yet. Data will be available once the wrap-up write-back is active.",
    donnaAvailableCopy: 'Wrap-up coverage this week:',
    blockedBy: ['session wrap-up write-back (Sprint 490+)', 'proposed_actions source_type index'],
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
    blockedBy: ['proposed_actions write-back adapter', 'approved_at and applied_at timestamp fields'],
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
