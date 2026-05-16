// Curriculum Change Scope Model
// Defines the safe scope boundaries for any proposed curriculum change.
// All scopes are proposal-only — no mutation occurs without explicit director approval.

export type CurriculumChangeScopeId =
  | 'today_only'
  | 'this_session'
  | 'this_group'
  | 'this_level'
  | 'this_pathway'
  | 'academy_wide'
  | 'global_master'

export type CurriculumChangeApprover =
  | 'coach_or_director'
  | 'director'
  | 'director_or_head_coach'
  | 'director_only'
  | 'system_admin_only'

export type CurriculumChangeScopeRisk = 'low' | 'medium' | 'high' | 'critical'

export interface CurriculumChangeScopeDefinition {
  id: CurriculumChangeScopeId
  label: string
  description: string
  approver: CurriculumChangeApprover
  approverLabel: string
  risk: CurriculumChangeScopeRisk
  persisted: boolean
  affectsTemplates: boolean
  affectsPlayers: boolean
  affectsParentLanguage: boolean
  affectsCoachBriefs: boolean
  requiresRollbackNote: boolean
  safetyNote: string
}

export const CURRICULUM_CHANGE_SCOPES: CurriculumChangeScopeDefinition[] = [
  {
    id: 'today_only',
    label: 'Today only',
    description: 'Applies to this session instance only. Not saved to any template or record. Coach note only.',
    approver: 'coach_or_director',
    approverLabel: 'Coach or Director',
    risk: 'low',
    persisted: false,
    affectsTemplates: false,
    affectsPlayers: false,
    affectsParentLanguage: false,
    affectsCoachBriefs: false,
    requiresRollbackNote: false,
    safetyNote: 'Not persisted. No template or player record changes.',
  },
  {
    id: 'this_session',
    label: 'This session',
    description: 'Applies to a specific session instance. Stored in session notes only — does not modify the template.',
    approver: 'director',
    approverLabel: 'Director',
    risk: 'low',
    persisted: true,
    affectsTemplates: false,
    affectsPlayers: false,
    affectsParentLanguage: false,
    affectsCoachBriefs: false,
    requiresRollbackNote: false,
    safetyNote: 'Stored in session notes. Does not modify template or player records.',
  },
  {
    id: 'this_group',
    label: 'This group',
    description: 'Applies to all upcoming sessions for a specific group. Modifies the group-level curriculum override.',
    approver: 'director',
    approverLabel: 'Director',
    risk: 'medium',
    persisted: true,
    affectsTemplates: true,
    affectsPlayers: false,
    affectsParentLanguage: false,
    affectsCoachBriefs: true,
    requiresRollbackNote: true,
    safetyNote: 'Affects upcoming sessions for this group. Does not move any player levels.',
  },
  {
    id: 'this_level',
    label: 'This level',
    description: 'Applies to all sessions and templates linked to a specific curriculum level across the academy.',
    approver: 'director_or_head_coach',
    approverLabel: 'Director or Head Coach',
    risk: 'medium',
    persisted: true,
    affectsTemplates: true,
    affectsPlayers: true,
    affectsParentLanguage: true,
    affectsCoachBriefs: true,
    requiresRollbackNote: true,
    safetyNote: 'Affects all players at this level and all templates linked to it. Review impact preview before approving.',
  },
  {
    id: 'this_pathway',
    label: 'This pathway',
    description: 'Applies to all levels within a curriculum track or pathway (e.g., all Red Ball levels).',
    approver: 'director_or_head_coach',
    approverLabel: 'Director or Head Coach',
    risk: 'high',
    persisted: true,
    affectsTemplates: true,
    affectsPlayers: true,
    affectsParentLanguage: true,
    affectsCoachBriefs: true,
    requiresRollbackNote: true,
    safetyNote: 'Broad impact across all levels in this pathway. Impact preview required before approval.',
  },
  {
    id: 'academy_wide',
    label: 'Academy-wide',
    description: 'Creates or updates an academy curriculum version override affecting all groups and levels.',
    approver: 'director_only',
    approverLabel: 'Director only',
    risk: 'high',
    persisted: true,
    affectsTemplates: true,
    affectsPlayers: true,
    affectsParentLanguage: true,
    affectsCoachBriefs: true,
    requiresRollbackNote: true,
    safetyNote: 'Academy-wide impact. Director confirmation required. Rollback path must be documented.',
  },
  {
    id: 'global_master',
    label: 'Global / Master',
    description: 'Modifies the master curriculum — affects all academies using the default curriculum baseline.',
    approver: 'system_admin_only',
    approverLabel: 'System admin only',
    risk: 'critical',
    persisted: true,
    affectsTemplates: true,
    affectsPlayers: true,
    affectsParentLanguage: true,
    affectsCoachBriefs: true,
    requiresRollbackNote: true,
    safetyNote: 'Critical: affects all academies. System admin confirmation required. Not available from director UI.',
  },
]

export const SCOPE_BY_ID: Record<CurriculumChangeScopeId, CurriculumChangeScopeDefinition> =
  Object.fromEntries(
    CURRICULUM_CHANGE_SCOPES.map(s => [s.id, s])
  ) as Record<CurriculumChangeScopeId, CurriculumChangeScopeDefinition>

// Scopes available to director-role users (excludes global/master)
export const DIRECTOR_AVAILABLE_SCOPES: CurriculumChangeScopeId[] = [
  'today_only',
  'this_session',
  'this_group',
  'this_level',
  'this_pathway',
  'academy_wide',
]

// Scopes that require a rollback note before approval
export const SCOPES_REQUIRING_ROLLBACK_NOTE: CurriculumChangeScopeId[] = CURRICULUM_CHANGE_SCOPES
  .filter(s => s.requiresRollbackNote)
  .map(s => s.id)

// Risk color tokens for UI rendering
export const SCOPE_RISK_COLOR: Record<CurriculumChangeScopeRisk, string> = {
  low: 'text-status-green',
  medium: 'text-status-orange',
  high: 'text-status-red',
  critical: 'text-status-red',
}

export const SCOPE_RISK_LABEL: Record<CurriculumChangeScopeRisk, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
  critical: 'Critical',
}

// Proposed curriculum change — the top-level draft struct
export interface CurriculumChangeDraft {
  id: string
  scope: CurriculumChangeScopeId
  changeType: CurriculumChangeType
  targetObjectType: CurriculumChangeTargetType
  targetObjectId: string | null
  targetObjectLabel: string
  proposedChange: string
  reason: string
  rollbackNote: string | null
  status: CurriculumChangeDraftStatus
  createdAt: string
  createdBy: string
  approvedBy: string | null
  approvedAt: string | null
}

export type CurriculumChangeDraftStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'applied'

export type CurriculumChangeType =
  | 'add_drill'
  | 'remove_drill'
  | 'edit_drill'
  | 'add_gate'
  | 'remove_gate'
  | 'edit_gate'
  | 'add_content_item'
  | 'edit_content_item'
  | 'remove_content_item'
  | 'rename_level'
  | 'reorder_level'
  | 'add_level'
  | 'change_focus'
  | 'add_override'
  | 'remove_override'
  | 'other'

export type CurriculumChangeTargetType =
  | 'curriculum_level'
  | 'curriculum_drill'
  | 'curriculum_gate'
  | 'curriculum_content_item'
  | 'curriculum_track'
  | 'academy_version'
  | 'template'
  | 'group'
  | 'session'

// Guard: returns true if the scope requires a rollback note and none was provided
export function scopeRequiresRollbackNote(scopeId: CurriculumChangeScopeId): boolean {
  return SCOPE_BY_ID[scopeId]?.requiresRollbackNote ?? false
}

// Guard: returns true if director-role user can propose this scope
export function isDirectorAllowedScope(scopeId: CurriculumChangeScopeId): boolean {
  return DIRECTOR_AVAILABLE_SCOPES.includes(scopeId)
}

// Guard: returns true if scope affects parent-facing language (requires extra review)
export function scopeAffectsParentLanguage(scopeId: CurriculumChangeScopeId): boolean {
  return SCOPE_BY_ID[scopeId]?.affectsParentLanguage ?? false
}

// Guard: returns true if scope affects player readiness calculation
export function scopeAffectsPlayers(scopeId: CurriculumChangeScopeId): boolean {
  return SCOPE_BY_ID[scopeId]?.affectsPlayers ?? false
}

// Creates a blank draft shell (not saved to DB — for UI state only)
export function createCurriculumChangeDraftShell(
  scope: CurriculumChangeScopeId,
  changeType: CurriculumChangeType,
  targetObjectType: CurriculumChangeTargetType,
  targetObjectLabel: string,
  createdBy: string,
): Omit<CurriculumChangeDraft, 'id'> {
  return {
    scope,
    changeType,
    targetObjectType,
    targetObjectId: null,
    targetObjectLabel,
    proposedChange: '',
    reason: '',
    rollbackNote: null,
    status: 'draft',
    createdAt: new Date().toISOString(),
    createdBy,
    approvedBy: null,
    approvedAt: null,
  }
}
