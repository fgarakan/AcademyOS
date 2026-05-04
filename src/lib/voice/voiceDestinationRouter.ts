// Sprint 245 — Voice Destination Router V1
// Pure helper. No DB calls. No AI. No side effects.
// Determines where a voice intake draft can be routed and why.

import type { VoiceIntakeDraft, VoiceIntakeRole, VoiceDestinationModule } from './voiceIntakeTypes'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DestinationRiskLevel = 'low' | 'medium' | 'high'

export interface VoiceDestinationDefinition {
  module: VoiceDestinationModule
  label: string
  description: string
  why_useful: string
  risk_level: DestinationRiskLevel
  requires_approval: boolean
  what_would_change: string
  what_would_not_change: string
  allowed_roles: VoiceIntakeRole[]
}

export interface VoiceDestinationRecommendation {
  module: VoiceDestinationModule
  label: string
  description: string
  why_useful: string
  risk_level: DestinationRiskLevel
  requires_approval: boolean
  what_would_change: string
  what_would_not_change: string
  is_primary: boolean
}

// ── Destination catalogue ─────────────────────────────────────────────────────

const DESTINATION_CATALOGUE: VoiceDestinationDefinition[] = [
  {
    module: 'attendance',
    label: 'Attendance',
    description: 'Records attendance exceptions for the current session.',
    why_useful: 'Keeps accurate attendance records without manual data entry during sessions.',
    risk_level: 'medium',
    requires_approval: true,
    what_would_change: 'An attendance exception draft is created in the review queue.',
    what_would_not_change: 'No attendance record is written until director or head coach confirms.',
    allowed_roles: ['academy_director', 'head_coach', 'coach'],
  },
  {
    module: 'unrostered_attendee_review',
    label: 'Unrostered Attendee Review',
    description: 'Flags a player who attended but is not on the session roster.',
    why_useful: 'Helps directors identify roster gaps and prevents missed billing or placement.',
    risk_level: 'low',
    requires_approval: true,
    what_would_change: 'An unrostered attendee flag is created for director review.',
    what_would_not_change: 'No player is added to the roster automatically. No billing change.',
    allowed_roles: ['academy_director', 'head_coach', 'coach'],
  },
  {
    module: 'session_actual',
    label: 'Session Actual',
    description: 'Updates what actually happened in the session vs the plan.',
    why_useful: 'Builds accurate training history and helps the director see plan vs execution divergence.',
    risk_level: 'low',
    requires_approval: true,
    what_would_change: 'A session actual focus update is created in the review queue.',
    what_would_not_change: 'No session template is modified. No session plan is overwritten.',
    allowed_roles: ['academy_director', 'head_coach', 'coach'],
  },
  {
    module: 'player_observation',
    label: 'Player Observation',
    description: 'Creates a coaching observation draft for one or more players.',
    why_useful: 'Captures in-session coaching insights before they fade. Builds development history.',
    risk_level: 'low',
    requires_approval: true,
    what_would_change: 'Player observation drafts are created in the review queue.',
    what_would_not_change: 'No observation is published or shown to players without director approval.',
    allowed_roles: ['academy_director', 'head_coach', 'coach'],
  },
  {
    module: 'curriculum_evidence',
    label: 'Curriculum Evidence',
    description: 'Creates a gate evidence candidate draft for a player.',
    why_useful: 'Links observed performance to curriculum gate criteria for advancement decisions.',
    risk_level: 'medium',
    requires_approval: true,
    what_would_change: 'A gate evidence candidate is created for director review.',
    what_would_not_change: 'No player level is changed. No gate is marked complete automatically.',
    allowed_roles: ['academy_director', 'head_coach', 'coach'],
  },
  {
    module: 'gap_engine',
    label: 'Gap Engine',
    description: 'Adds a training gap signal for the gap detection engine.',
    why_useful: 'Enriches the gap detection model with coach observations for better director guidance.',
    risk_level: 'low',
    requires_approval: true,
    what_would_change: 'A gap signal draft is created for director attention.',
    what_would_not_change: 'No player curriculum is changed. No automatic gap-based level adjustment.',
    allowed_roles: ['academy_director', 'head_coach', 'coach'],
  },
  {
    module: 'parent_safe_draft',
    label: 'Parent Safe Draft',
    description: 'Generates a parent-facing progress summary candidate.',
    why_useful: 'Gives directors a head start on parent communication with coach-observed content.',
    risk_level: 'medium',
    requires_approval: true,
    what_would_change: 'A parent-safe draft candidate is created in the review queue.',
    what_would_not_change: 'No message is sent to the parent. Director must approve before any send.',
    allowed_roles: ['academy_director', 'head_coach'],
  },
  {
    module: 'player_mission',
    label: 'Player Mission',
    description: 'Creates or updates a player mission draft.',
    why_useful: 'Translates coach insight into player-facing language for the player portal.',
    risk_level: 'medium',
    requires_approval: true,
    what_would_change: 'A player mission update draft is created for director review.',
    what_would_not_change: 'No mission is shown to the player until director approves.',
    allowed_roles: ['academy_director', 'head_coach'],
  },
  {
    module: 'director_review_queue',
    label: 'Director Review Queue',
    description: 'Routes the draft to the director review queue for any approval action.',
    why_useful: 'All voice intake drafts route here so the director has a single review surface.',
    risk_level: 'low',
    requires_approval: true,
    what_would_change: 'The draft appears in the director review queue with pending_review status.',
    what_would_not_change: 'Nothing is applied until the director explicitly approves.',
    allowed_roles: ['academy_director', 'head_coach', 'coach'],
  },
  {
    module: 'session_planning',
    label: 'Session Planning',
    description: 'Creates a session plan draft.',
    why_useful: 'Turns spoken intent into a structured session template candidate for the planning calendar.',
    risk_level: 'low',
    requires_approval: true,
    what_would_change: 'A session plan draft is created in the review queue.',
    what_would_not_change: 'No session is scheduled or published without director approval.',
    allowed_roles: ['academy_director', 'head_coach'],
  },
  {
    module: 'group_planning',
    label: 'Group Planning',
    description: 'Creates a group change or group focus draft.',
    why_useful: 'Allows directors to capture group-level decisions without switching to a form.',
    risk_level: 'medium',
    requires_approval: true,
    what_would_change: 'A group change or focus draft is created in the review queue.',
    what_would_not_change: 'No player is moved between groups automatically.',
    allowed_roles: ['academy_director', 'head_coach'],
  },
  {
    module: 'coach_briefing',
    label: 'Coach Briefing',
    description: 'Creates a coaching team briefing draft.',
    why_useful: 'Converts director intent into a structured briefing for coaching staff.',
    risk_level: 'low',
    requires_approval: true,
    what_would_change: 'A coach briefing draft is created in the review queue.',
    what_would_not_change: 'No briefing is sent or published without director approval.',
    allowed_roles: ['academy_director', 'head_coach'],
  },
  {
    module: 'curriculum_note',
    label: 'Curriculum Note',
    description: 'Records a curriculum-linked internal note.',
    why_useful: 'Preserves coaching insights linked to specific curriculum levels or domains.',
    risk_level: 'low',
    requires_approval: true,
    what_would_change: 'A curriculum note draft is created in the review queue.',
    what_would_not_change: 'No curriculum content or player level is changed.',
    allowed_roles: ['academy_director', 'head_coach', 'coach'],
  },
  {
    module: 'director_note',
    label: 'Director Note',
    description: 'Records an internal director note.',
    why_useful: 'Captures director-level observations or reminders without needing a form.',
    risk_level: 'low',
    requires_approval: true,
    what_would_change: 'A director note draft is created in the review queue.',
    what_would_not_change: 'Note is internal only — not visible to coaches, players, or parents.',
    allowed_roles: ['academy_director', 'head_coach'],
  },
]

const CATALOGUE_MAP = new Map<VoiceDestinationModule, VoiceDestinationDefinition>(
  DESTINATION_CATALOGUE.map(d => [d.module, d])
)

// ── Exported functions ────────────────────────────────────────────────────────

export function getDestinationDefinition(module: VoiceDestinationModule): VoiceDestinationDefinition | null {
  return CATALOGUE_MAP.get(module) ?? null
}

export function getDestinationRiskLevel(module: VoiceDestinationModule): DestinationRiskLevel {
  return CATALOGUE_MAP.get(module)?.risk_level ?? 'medium'
}

export function destinationRequiresApproval(module: VoiceDestinationModule): boolean {
  return CATALOGUE_MAP.get(module)?.requires_approval ?? true
}

export function explainDestination(module: VoiceDestinationModule, role: VoiceIntakeRole): string {
  const def = CATALOGUE_MAP.get(module)
  if (!def) return `Unknown destination: ${module}`
  if (!def.allowed_roles.includes(role)) {
    return `${def.label} is not available to the ${role} role.`
  }
  return `${def.label}: ${def.why_useful} ${def.what_would_not_change}`
}

export function canRoleRouteToDestination(role: VoiceIntakeRole, module: VoiceDestinationModule): boolean {
  const def = CATALOGUE_MAP.get(module)
  if (!def) return false
  return def.allowed_roles.includes(role)
}

export function routeVoiceIntakeDraft(draft: VoiceIntakeDraft): VoiceDestinationRecommendation[] {
  const recommendations: VoiceDestinationRecommendation[] = []
  const allowedDestinations = draft.suggested_destinations.filter(dest =>
    canRoleRouteToDestination(draft.role, dest)
  )

  if (allowedDestinations.length === 0) return []

  for (let i = 0; i < allowedDestinations.length; i++) {
    const dest = allowedDestinations[i]
    const def = CATALOGUE_MAP.get(dest)
    if (!def) continue

    recommendations.push({
      module: dest,
      label: def.label,
      description: def.description,
      why_useful: def.why_useful,
      risk_level: def.risk_level,
      requires_approval: def.requires_approval,
      what_would_change: def.what_would_change,
      what_would_not_change: def.what_would_not_change,
      is_primary: i === 0,
    })
  }

  return recommendations
}
