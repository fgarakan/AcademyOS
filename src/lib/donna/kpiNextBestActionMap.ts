// KPI to Next Best Action Mapping — Sprint 498
// Maps academy health KPI readings to DONNA's next-best-action recommendations.
// Pure TypeScript — no DB calls, no logic beyond lookup.

// ── Types ─────────────────────────────────────────────────────────────────────

export type KPISeverity = 'critical' | 'warning' | 'healthy' | 'no_data'

export type ActionRoutingDestination =
  | 'director_review_queue'
  | 'player_profile'
  | 'session_plan'
  | 'coach_brief'
  | 'parent_message_draft'
  | 'curriculum_panel'
  | 'wrap_up_reminder'
  | 'donna_ask'
  | 'none'

export interface KPINextBestAction {
  kpiId: string
  severity: KPISeverity
  donnaSummary: string
  recommendedAction: string
  actionCta: string
  routingDestination: ActionRoutingDestination
  requiresDirectorApproval: boolean
  isExecutable: boolean
  executionNote: string | null
}

// ── Map ───────────────────────────────────────────────────────────────────────

export const KPI_NEXT_BEST_ACTION_MAP: KPINextBestAction[] = [

  // ── Player Attention Risk ──────────────────────────────────────────────────
  {
    kpiId: 'player_attention_risk',
    severity: 'critical',
    donnaSummary: 'Several players need immediate attention.',
    recommendedAction: 'Review the flagged players and approve any pending support actions.',
    actionCta: 'Review flagged players',
    routingDestination: 'director_review_queue',
    requiresDirectorApproval: true,
    isExecutable: false,
    executionNote: 'Director must review and approve player_support proposed actions before any outreach.',
  },
  {
    kpiId: 'player_attention_risk',
    severity: 'warning',
    donnaSummary: 'One or two players may need a check-in.',
    recommendedAction: 'Check the pending observations for these players.',
    actionCta: 'View observations',
    routingDestination: 'director_review_queue',
    requiresDirectorApproval: true,
    isExecutable: false,
    executionNote: 'Observations must be approved before adding to player profiles.',
  },
  {
    kpiId: 'player_attention_risk',
    severity: 'healthy',
    donnaSummary: 'No attention flags this week. All players on track.',
    recommendedAction: 'No action needed.',
    actionCta: '',
    routingDestination: 'none',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'player_attention_risk',
    severity: 'no_data',
    donnaSummary: "Not enough wrap-up data yet to assess player attention risk.",
    recommendedAction: 'Remind coaches to submit wrap-ups so I can surface patterns.',
    actionCta: 'Send wrap-up reminder',
    routingDestination: 'wrap_up_reminder',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: 'Wrap-up reminders are draft-only. Director approves before any coach is notified.',
  },

  // ── Group Health ───────────────────────────────────────────────────────────
  {
    kpiId: 'group_health',
    severity: 'critical',
    donnaSummary: 'A group is showing a significant drop in health indicators.',
    recommendedAction: 'Review session logs and observations for this group. Consider a coach debrief.',
    actionCta: 'View group details',
    routingDestination: 'session_plan',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'group_health',
    severity: 'warning',
    donnaSummary: 'Group health is dipping — attendance or completion rate has slipped.',
    recommendedAction: 'Check recent sessions for this group.',
    actionCta: 'View sessions',
    routingDestination: 'session_plan',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'group_health',
    severity: 'healthy',
    donnaSummary: 'All groups are performing well this week.',
    recommendedAction: 'No action needed.',
    actionCta: '',
    routingDestination: 'none',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'group_health',
    severity: 'no_data',
    donnaSummary: "Not enough session history to score group health.",
    recommendedAction: 'Group health baselines need a few more weeks of data.',
    actionCta: 'Ask DONNA',
    routingDestination: 'donna_ask',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },

  // ── Coach Support Needed ───────────────────────────────────────────────────
  {
    kpiId: 'coach_support_needed',
    severity: 'critical',
    donnaSummary: 'A coach has had a significant gap in wrap-up submissions.',
    recommendedAction: 'Check in with the coach directly or flag for head coach follow-up.',
    actionCta: 'Review coach activity',
    routingDestination: 'coach_brief',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'coach_support_needed',
    severity: 'warning',
    donnaSummary: 'One or more coaches may benefit from a check-in.',
    recommendedAction: 'Review their recent sessions and observations.',
    actionCta: 'View coach briefs',
    routingDestination: 'coach_brief',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'coach_support_needed',
    severity: 'healthy',
    donnaSummary: 'All coaches are submitting wrap-ups consistently.',
    recommendedAction: 'No action needed.',
    actionCta: '',
    routingDestination: 'none',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'coach_support_needed',
    severity: 'no_data',
    donnaSummary: "Not enough data to assess coach support needs yet.",
    recommendedAction: 'Check back after a few weeks of wrap-up history.',
    actionCta: '',
    routingDestination: 'none',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },

  // ── Parent Trust Coverage ─────────────────────────────────────────────────
  {
    kpiId: 'parent_trust_coverage',
    severity: 'critical',
    donnaSummary: 'Several families have had no recent contact from the academy.',
    recommendedAction: 'Draft parent updates for the most overdue families.',
    actionCta: 'Draft parent updates',
    routingDestination: 'parent_message_draft',
    requiresDirectorApproval: true,
    isExecutable: false,
    executionNote: 'Parent messages are draft-only. Director must approve before any message is sent.',
  },
  {
    kpiId: 'parent_trust_coverage',
    severity: 'warning',
    donnaSummary: 'A few families are approaching 30 days without contact.',
    recommendedAction: 'Consider sending an update to the families at risk.',
    actionCta: 'View parent coverage',
    routingDestination: 'parent_message_draft',
    requiresDirectorApproval: true,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'parent_trust_coverage',
    severity: 'healthy',
    donnaSummary: 'All families have received recent communication.',
    recommendedAction: 'No action needed.',
    actionCta: '',
    routingDestination: 'none',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'parent_trust_coverage',
    severity: 'no_data',
    donnaSummary: "Parent communication tracking isn't active yet.",
    recommendedAction: 'This will be available once parent message approvals are live.',
    actionCta: '',
    routingDestination: 'none',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },

  // ── Curriculum Bottleneck ─────────────────────────────────────────────────
  {
    kpiId: 'curriculum_bottleneck',
    severity: 'critical',
    donnaSummary: 'A skill is consistently flagged as a concern across multiple players.',
    recommendedAction: 'Review curriculum design for this skill area.',
    actionCta: 'View curriculum panel',
    routingDestination: 'curriculum_panel',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: 'Any curriculum change goes through the curriculum ripple approval flow (Sprint 462+).',
  },
  {
    kpiId: 'curriculum_bottleneck',
    severity: 'warning',
    donnaSummary: 'A few players are repeatedly flagged on the same skill.',
    recommendedAction: 'Consider a targeted drill or group session for this skill.',
    actionCta: 'View skill patterns',
    routingDestination: 'curriculum_panel',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'curriculum_bottleneck',
    severity: 'healthy',
    donnaSummary: 'No recurring skill bottlenecks detected this week.',
    recommendedAction: 'No action needed.',
    actionCta: '',
    routingDestination: 'none',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'curriculum_bottleneck',
    severity: 'no_data',
    donnaSummary: "Not enough skill-tagged observations to identify bottlenecks.",
    recommendedAction: 'Encourage coaches to tag skill areas in their wrap-up observations.',
    actionCta: '',
    routingDestination: 'none',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },

  // ── Wrap-Up Coverage Rate ─────────────────────────────────────────────────
  {
    kpiId: 'wrap_up_coverage_rate',
    severity: 'critical',
    donnaSummary: 'Less than half of this week\'s sessions have a wrap-up submitted.',
    recommendedAction: 'Send a reminder to coaches with outstanding wrap-ups.',
    actionCta: 'View outstanding wrap-ups',
    routingDestination: 'wrap_up_reminder',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'wrap_up_coverage_rate',
    severity: 'warning',
    donnaSummary: 'A few sessions are missing wrap-ups.',
    recommendedAction: 'Check which coaches haven\'t submitted yet.',
    actionCta: 'View missing wrap-ups',
    routingDestination: 'wrap_up_reminder',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'wrap_up_coverage_rate',
    severity: 'healthy',
    donnaSummary: 'All sessions this week have a coach wrap-up.',
    recommendedAction: 'No action needed.',
    actionCta: '',
    routingDestination: 'none',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
  {
    kpiId: 'wrap_up_coverage_rate',
    severity: 'no_data',
    donnaSummary: "Wrap-up coverage data isn't available yet.",
    recommendedAction: 'Check back after the first wrap-ups are submitted.',
    actionCta: '',
    routingDestination: 'none',
    requiresDirectorApproval: false,
    isExecutable: false,
    executionNote: null,
  },
]

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getNextBestAction(kpiId: string, severity: KPISeverity): KPINextBestAction | undefined {
  return KPI_NEXT_BEST_ACTION_MAP.find(m => m.kpiId === kpiId && m.severity === severity)
}

export function getActionsByDestination(destination: ActionRoutingDestination): KPINextBestAction[] {
  return KPI_NEXT_BEST_ACTION_MAP.filter(m => m.routingDestination === destination)
}

export function getActionsRequiringDirectorApproval(): KPINextBestAction[] {
  return KPI_NEXT_BEST_ACTION_MAP.filter(m => m.requiresDirectorApproval)
}
