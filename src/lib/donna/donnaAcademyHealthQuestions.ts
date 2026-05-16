// DONNA Academy Health Question Templates — Sprint 504
// Defines question sets DONNA can handle about academy health.
// Maps intent triggers → KPI source → response templates.
// Pure TypeScript constants — no DB calls, no logic.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DonnaHealthQuestion {
  id: string
  category: 'player_attention' | 'group_health' | 'coach_support' | 'parent_coverage' | 'curriculum'
  kpiSourceId: string
  /** Natural language triggers that match this question */
  intentTriggers: string[]
  /** DONNA's phrasing when asking this question proactively */
  proactivePrompt: string
  /** DONNA's response template when data is available */
  responseTemplateDataAvailable: string
  /** DONNA's response template when data is not available */
  responseTemplateNoData: string
  /** Whether this question requires director action before answering */
  requiresDirectorApproval: boolean
  /** Follow-up questions DONNA might ask after this one */
  followUpQuestionIds: string[]
}

// ── Academy health questions ──────────────────────────────────────────────────

export const DONNA_ACADEMY_HEALTH_QUESTIONS: DonnaHealthQuestion[] = [

  // ── Player attention ───────────────────────────────────────────────────────

  {
    id: 'who_needs_attention',
    category: 'player_attention',
    kpiSourceId: 'player_attention_risk',
    intentTriggers: [
      'who needs attention',
      'any players to flag',
      'any players at risk',
      'player concerns',
      'who should I focus on',
      'any flags',
      'priority players',
    ],
    proactivePrompt: "A few players may need your attention. Want me to run through them?",
    responseTemplateDataAvailable: "Based on recent wrap-ups, {{count}} player(s) have been flagged: {{playerList}}. The highest priority is {{topPlayer}} — {{topReason}}.",
    responseTemplateNoData: "I don't have enough wrap-up data yet to flag specific players. Once coaches submit more wrap-ups, I'll surface patterns here.",
    requiresDirectorApproval: false,
    followUpQuestionIds: ['what_flag_for_player', 'how_many_sessions_flagged'],
  },

  {
    id: 'what_flag_for_player',
    category: 'player_attention',
    kpiSourceId: 'player_attention_risk',
    intentTriggers: [
      'what happened with',
      'tell me more about',
      'what was flagged for',
      'why is {{playerName}} flagged',
    ],
    proactivePrompt: "Want me to tell you more about why {{playerName}} was flagged?",
    responseTemplateDataAvailable: "{{playerName}} was flagged {{count}} time(s) in the last {{sessions}} sessions. The primary concern: {{reason}}. Coach note: {{coachNote}}.",
    responseTemplateNoData: "I don't have detailed flag data for {{playerName}} yet.",
    requiresDirectorApproval: false,
    followUpQuestionIds: ['what_is_next_step_for_player'],
  },

  {
    id: 'what_is_next_step_for_player',
    category: 'player_attention',
    kpiSourceId: 'player_attention_risk',
    intentTriggers: [
      'what should we do about',
      'next step for',
      'what action for',
      'how should we help',
    ],
    proactivePrompt: "I can suggest a next step for {{playerName}} — want to hear it?",
    responseTemplateDataAvailable: "Based on the flags, I'd suggest: {{suggestedAction}}. This would go into the review queue for your approval before anything changes.",
    responseTemplateNoData: "I don't have enough detail to suggest a specific next step yet.",
    requiresDirectorApproval: true,
    followUpQuestionIds: [],
  },

  {
    id: 'how_many_sessions_flagged',
    category: 'player_attention',
    kpiSourceId: 'player_attention_risk',
    intentTriggers: [
      'how many times',
      'how often',
      'how long has this been going on',
      'is this a pattern',
    ],
    proactivePrompt: "This seems like a pattern. Want me to look at how many sessions this covers?",
    responseTemplateDataAvailable: "{{playerName}} has been flagged in {{count}} of the last {{total}} sessions — that's {{pct}}% of recent sessions.",
    responseTemplateNoData: "Not enough session history to show a trend yet.",
    requiresDirectorApproval: false,
    followUpQuestionIds: [],
  },

  // ── Group health ───────────────────────────────────────────────────────────

  {
    id: 'how_are_groups_doing',
    category: 'group_health',
    kpiSourceId: 'group_health',
    intentTriggers: [
      'how are the groups doing',
      'group health',
      'which groups are struggling',
      'any groups at risk',
      'group performance',
      'how is the academy performing',
    ],
    proactivePrompt: "Want a quick rundown of how each group is trending this week?",
    responseTemplateDataAvailable: "{{strongCount}} group(s) are strong, {{stableCount}} are stable, and {{atRiskCount}} need attention. {{atRiskGroup}} is the most at-risk — attendance has dropped to {{attendanceRate}}%.",
    responseTemplateNoData: "I need a few more weeks of session data to score group health reliably. Check back after more wrap-ups are submitted.",
    requiresDirectorApproval: false,
    followUpQuestionIds: ['what_is_wrong_with_group'],
  },

  {
    id: 'what_is_wrong_with_group',
    category: 'group_health',
    kpiSourceId: 'group_health',
    intentTriggers: [
      'what is wrong with',
      'tell me about',
      'what is happening with',
      'why is {{groupName}} at risk',
    ],
    proactivePrompt: "{{groupName}} is showing some warning signs. Want to dig in?",
    responseTemplateDataAvailable: "{{groupName}}'s attendance is {{attendanceRate}}%, wrap-up submission rate is {{wrapUpRate}}%, and the coach has noted {{observationType}} patterns. I'd suggest reviewing the last few sessions.",
    responseTemplateNoData: "I don't have enough session data for {{groupName}} yet.",
    requiresDirectorApproval: false,
    followUpQuestionIds: [],
  },

  // ── Coach support ──────────────────────────────────────────────────────────

  {
    id: 'which_coaches_need_support',
    category: 'coach_support',
    kpiSourceId: 'coach_support_needed',
    intentTriggers: [
      'which coaches need support',
      'any coach concerns',
      'coach activity',
      'how are the coaches doing',
      'coaches behind on wrap-ups',
    ],
    proactivePrompt: "A few coaches may benefit from a check-in. Want me to flag them?",
    responseTemplateDataAvailable: "{{count}} coach(es) may need support: {{coachList}}. The primary flag for {{topCoach}} is {{primaryFlag}}.",
    responseTemplateNoData: "I don't have enough coaching activity data yet to assess support needs.",
    requiresDirectorApproval: false,
    followUpQuestionIds: [],
  },

  // ── Parent coverage ────────────────────────────────────────────────────────

  {
    id: 'parent_communication_status',
    category: 'parent_coverage',
    kpiSourceId: 'parent_trust_coverage',
    intentTriggers: [
      'parent communication',
      'which families haven\'t heard from us',
      'parent outreach',
      'any families overdue',
      'parent coverage',
    ],
    proactivePrompt: "Some families haven't had contact recently. Want me to flag them?",
    responseTemplateDataAvailable: "{{coveredCount}} families have had recent contact. {{atRiskCount}} are approaching 30 days. {{notStartedCount}} have never been contacted.",
    responseTemplateNoData: "Parent communication tracking isn't active yet. This will be available once parent message approvals are live.",
    requiresDirectorApproval: false,
    followUpQuestionIds: ['draft_parent_update'],
  },

  {
    id: 'draft_parent_update',
    category: 'parent_coverage',
    kpiSourceId: 'parent_trust_coverage',
    intentTriggers: [
      'draft a message',
      'send an update to',
      'write to',
      'contact the parent of',
    ],
    proactivePrompt: "I can draft a parent update for {{playerName}}. Want me to start one?",
    responseTemplateDataAvailable: "I'll draft a parent update for {{playerName}}'s family — it will go into the review queue for your approval before anything is sent.",
    responseTemplateNoData: "I need the player name and a note about what to include before I can draft a message.",
    requiresDirectorApproval: true,
    followUpQuestionIds: [],
  },

  // ── Curriculum ─────────────────────────────────────────────────────────────

  {
    id: 'curriculum_bottleneck_check',
    category: 'curriculum',
    kpiSourceId: 'curriculum_bottleneck',
    intentTriggers: [
      'curriculum concerns',
      'any skill bottlenecks',
      'what skills are players struggling with',
      'recurring skill issues',
      'curriculum problems',
    ],
    proactivePrompt: "I've spotted some recurring patterns in skill observations. Want me to run through them?",
    responseTemplateDataAvailable: "{{count}} skill area(s) are showing repeated concern flags: {{skillList}}. The most flagged is {{topSkill}} — {{playerCount}} players have been flagged for this.",
    responseTemplateNoData: "I need more skill-tagged observations from coaches to identify bottlenecks. Encourage coaches to tag skill areas in their wrap-ups.",
    requiresDirectorApproval: false,
    followUpQuestionIds: ['what_should_we_do_about_skill'],
  },

  {
    id: 'what_should_we_do_about_skill',
    category: 'curriculum',
    kpiSourceId: 'curriculum_bottleneck',
    intentTriggers: [
      'what should we do about',
      'how do we address',
      'curriculum change for',
    ],
    proactivePrompt: "I can suggest a curriculum adjustment for {{skillTag}}. Want to see what that might look like?",
    responseTemplateDataAvailable: "For {{skillTag}}, I'd suggest reviewing the related curriculum block. Any changes would go through the ripple approval flow for director sign-off before taking effect.",
    responseTemplateNoData: "I don't have enough data to suggest a specific change yet.",
    requiresDirectorApproval: true,
    followUpQuestionIds: [],
  },
]

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getDonnaHealthQuestion(id: string): DonnaHealthQuestion | undefined {
  return DONNA_ACADEMY_HEALTH_QUESTIONS.find(q => q.id === id)
}

export function getHealthQuestionsByCategory(
  category: DonnaHealthQuestion['category'],
): DonnaHealthQuestion[] {
  return DONNA_ACADEMY_HEALTH_QUESTIONS.filter(q => q.category === category)
}

export function matchHealthQuestionByTrigger(input: string): DonnaHealthQuestion | undefined {
  const normalized = input.toLowerCase().trim()
  return DONNA_ACADEMY_HEALTH_QUESTIONS.find(q =>
    q.intentTriggers.some(trigger => normalized.includes(trigger.toLowerCase())),
  )
}
