// Curriculum setup state — stored in academies.settings.curriculum_setup_v2

export type SpineStatus = 'not_started' | 'approved' | 'customized' | 'skipped'
export type SourceStatus = 'not_started' | 'selected' | 'skipped'
export type DomainsStatus = 'not_started' | 'approved' | 'customized' | 'skipped'
export type DeepStatus = 'not_started' | 'in_progress' | 'complete' | 'skipped'

export interface CurriculumSetupState {
  // ── Required setup (3 steps) ──────────────────────────────────
  spine_status: SpineStatus
  approved_spine_levels: string[]
  curriculum_source_status: SourceStatus
  curriculum_source_choice: string | null
  domains_status: DomainsStatus
  selected_domains: string[]
  // ── Deeper setup (unlocked after required is complete) ────────
  level_names_status: DeepStatus
  level_goals_status: DeepStatus
  movement_gates_status: DeepStatus
  requirements_status: DeepStatus
  template_connections_status: DeepStatus
  parent_player_explanations_status: DeepStatus
  // ─────────────────────────────────────────────────────────────
  updated_at: string
}

export const DEFAULT_CURRICULUM_SETUP_STATE: CurriculumSetupState = {
  spine_status: 'not_started',
  approved_spine_levels: [],
  curriculum_source_status: 'not_started',
  curriculum_source_choice: null,
  domains_status: 'not_started',
  selected_domains: [],
  level_names_status: 'not_started',
  level_goals_status: 'not_started',
  movement_gates_status: 'not_started',
  requirements_status: 'not_started',
  template_connections_status: 'not_started',
  parent_player_explanations_status: 'not_started',
  updated_at: '',
}

export const RECOMMENDED_CURRICULUM_SPINE: string[] = [
  'Red Ball 1',    'Red Ball 2',    'Red Ball 3',
  'Orange Ball 1', 'Orange Ball 2', 'Orange Ball 3',
  'Green Ball 1',  'Green Ball 2',  'Green Ball 3',
  'Yellow Ball 1', 'Yellow Ball 2', 'Yellow Ball 3',
  'High Performance 1', 'High Performance 2', 'High Performance 3',
]

export const SPINE_STAGES = [
  { label: 'Red Ball',        levels: ['Red Ball 1', 'Red Ball 2', 'Red Ball 3'] },
  { label: 'Orange Ball',     levels: ['Orange Ball 1', 'Orange Ball 2', 'Orange Ball 3'] },
  { label: 'Green Ball',      levels: ['Green Ball 1', 'Green Ball 2', 'Green Ball 3'] },
  { label: 'Yellow Ball',     levels: ['Yellow Ball 1', 'Yellow Ball 2', 'Yellow Ball 3'] },
  { label: 'High Performance',levels: ['High Performance 1', 'High Performance 2', 'High Performance 3'] },
]

export const CURRICULUM_SOURCE_OPTIONS = [
  {
    value: 'academy_os_starter',
    label: 'Use Academy OS starter curriculum',
    description: 'Start with a complete, research-based curriculum and use it as-is.',
  },
  {
    value: 'customize_starter',
    label: 'Use starter curriculum and customize',
    description: 'Best starting point — use the Academy OS baseline, then adapt it to your academy.',
    recommended: true,
  },
  {
    value: 'import_existing',
    label: 'Import our existing curriculum',
    description: 'Bring your own curriculum structure into Academy OS.',
  },
  {
    value: 'build_from_scratch',
    label: 'Build from scratch',
    description: 'Start with a blank structure and build your curriculum manually.',
  },
  {
    value: 'decide_later',
    label: 'Decide later',
    description: 'Skip for now and return when ready.',
  },
] as const

export const CURRICULUM_DOMAINS: string[] = [
  'Technical',
  'Tactical',
  'Footwork / Movement',
  'Serve / Return',
  'Rally Tolerance',
  'Net Play',
  'Competition Behavior',
  'Fitness / Athletic Development',
  'Mental Skills',
  'Player IQ / Missions',
  'Parent Education',
]

export function isRequiredSetupComplete(state: CurriculumSetupState): boolean {
  const spineOk = state.spine_status === 'approved' || state.spine_status === 'customized'
  const sourceOk = state.curriculum_source_status === 'selected'
  const domainsOk = state.domains_status === 'approved' || state.domains_status === 'customized'
  return spineOk && sourceOk && domainsOk
}

export function getInitialStep(
  state: CurriculumSetupState,
): 'spine' | 'source' | 'domains' | 'complete' {
  const spineOk = state.spine_status === 'approved' || state.spine_status === 'customized'
  const sourceOk = state.curriculum_source_status === 'selected'
  const domainsOk = state.domains_status === 'approved' || state.domains_status === 'customized'
  if (spineOk && sourceOk && domainsOk) return 'complete'
  if (spineOk && sourceOk) return 'domains'
  if (spineOk) return 'source'
  return 'spine'
}
