// Mega Sprint 934–963C — DONNA Page State Synchronization V1
//
// PageStatePatch contract and workflow field maps.
//
// Design rules:
//   - Pure TypeScript. No browser APIs, no React, no DB, no LLM.
//   - The runtime computes patches and returns them. It never dispatches events.
//   - Pages own their form state. DONNA emits patches; pages apply them.
//   - One answer → one field patch. No batch mutations.
//
// Architecture: docs/architecture/DONNA_PAGE_STATE_SYNC_934.md
// Certification: docs/qa/DONNA_PAGE_STATE_SYNC_CERTIFICATION_934.md

// ── Patch types ────────────────────────────────────────────────────────────────

export type ValidationStatus = 'valid' | 'invalid' | 'pending'

/**
 * A single field update emitted by the DONNA goal session runtime.
 * The page receives this via the `donna:page-state-patch` browser event
 * and applies it to its own form state.
 *
 * Source is always 'donna_goal_session' — patches only come from guided sessions.
 */
export interface PageStatePatch {
  /** Unique ID for deduplication on the page */
  patchId: string
  /** Workflow that produced this patch */
  workflowId: string
  /** The page route this patch targets */
  route: string
  /** Page-native field ID (what the page's state and form understands) */
  fieldId: string
  /** Registry step fieldId that produced this patch */
  registryFieldId: string
  /** The director's raw answer */
  value: string
  /** Human-readable field label for display ("Template Name") */
  displayLabel: string
  /** Validation state — always 'pending' from runtime; page sets 'valid'/'invalid' */
  validationStatus: ValidationStatus
  /** Always 'donna_goal_session' — distinguishes from user-direct edits */
  source: 'donna_goal_session'
  timestamp: number
}

// ── Field map entry ────────────────────────────────────────────────────────────

interface FieldMapEntry {
  pageFieldId: string
  displayLabel: string
}

// ── Workflow → page field maps ─────────────────────────────────────────────────
//
// Maps: workflowId → registryFieldId → { pageFieldId, displayLabel }
//
// registryFieldId: the fieldId used in guidedCompletionRegistry steps
// pageFieldId:     the field identifier the receiving page understands

const WORKFLOW_FIELD_MAPS: Record<string, Record<string, FieldMapEntry>> = {

  template_builder_completion: {
    template_purpose: { pageFieldId: 'template_name',  displayLabel: 'Template Name' },
    target_level:     { pageFieldId: 'level',           displayLabel: 'Curriculum Level' },
    session_duration: { pageFieldId: 'duration',        displayLabel: 'Session Duration' },
    session_focus:    { pageFieldId: 'objective',       displayLabel: 'Session Focus' },
    block_structure:  { pageFieldId: 'skill_block',     displayLabel: 'Block Structure' },
    key_drills:       { pageFieldId: 'coach_notes',     displayLabel: 'Key Drills' },
  },

  player_onboarding_completion: {
    player_name:       { pageFieldId: 'player_name',    displayLabel: 'Player Name' },
    player_age:        { pageFieldId: 'player_age',     displayLabel: 'Player Age' },
    recommended_level: { pageFieldId: 'level',          displayLabel: 'Curriculum Level' },
    assigned_coach:    { pageFieldId: 'coach',          displayLabel: 'Assigned Coach' },
    assigned_group:    { pageFieldId: 'group',          displayLabel: 'Assigned Group' },
    parent_contact:    { pageFieldId: 'parent_email',   displayLabel: 'Parent Contact' },
  },

  assessment_completion: {
    player_name:        { pageFieldId: 'player_name',   displayLabel: 'Player' },
    assessment_domain:  { pageFieldId: 'domain',        displayLabel: 'Assessment Domain' },
    observation:        { pageFieldId: 'observation',   displayLabel: 'Observation' },
    performance_rating: { pageFieldId: 'rating',        displayLabel: 'Performance Rating' },
    recommendation:     { pageFieldId: 'recommendation',displayLabel: 'Recommendation' },
    parent_visibility:  { pageFieldId: 'parent_safe',   displayLabel: 'Parent Visibility' },
  },

  parent_update_completion: {
    player_name:      { pageFieldId: 'player_name',     displayLabel: 'Player' },
    main_message:     { pageFieldId: 'main_message',    displayLabel: 'Main Message' },
    positive_progress:{ pageFieldId: 'progress',        displayLabel: 'Positive Progress' },
    home_support:     { pageFieldId: 'home_support',    displayLabel: 'Home Support' },
    internal_flag:    { pageFieldId: 'internal_note',   displayLabel: 'Internal Flag' },
  },

  curriculum_builder_completion: {
    level_name:               { pageFieldId: 'level_name',      displayLabel: 'Level Name' },
    level_goal:               { pageFieldId: 'level_goal',      displayLabel: 'Level Goal' },
    required_skills:          { pageFieldId: 'required_skills', displayLabel: 'Required Skills' },
    supporting_drills:        { pageFieldId: 'drills',          displayLabel: 'Supporting Drills' },
    assessment_method:        { pageFieldId: 'assessment',      displayLabel: 'Assessment Method' },
    parent_player_description:{ pageFieldId: 'description',     displayLabel: 'Description' },
  },

  academy_setup_completion: {
    academy_name:           { pageFieldId: 'academy_name',    displayLabel: 'Academy Name' },
    development_philosophy: { pageFieldId: 'philosophy',      displayLabel: 'Development Philosophy' },
    curriculum_structure:   { pageFieldId: 'curriculum',      displayLabel: 'Curriculum Structure' },
    level_count:            { pageFieldId: 'level_count',     displayLabel: 'Number of Levels' },
    parent_portal_enabled:  { pageFieldId: 'parent_portal',   displayLabel: 'Parent Portal' },
    first_coach:            { pageFieldId: 'first_coach',     displayLabel: 'First Coach' },
  },

  coach_creation_completion: {
    coach_email: { pageFieldId: 'email', displayLabel: 'Coach Email' },
    coach_role:  { pageFieldId: 'role',  displayLabel: 'Coach Role' },
  },

  fitness_template_builder_completion: {
    fitness_level:    { pageFieldId: 'level',    displayLabel: 'Curriculum Level' },
    fitness_goal:     { pageFieldId: 'goal',     displayLabel: 'Fitness Goal' },
    fitness_load:     { pageFieldId: 'load',     displayLabel: 'Load Level' },
    fitness_duration: { pageFieldId: 'duration', displayLabel: 'Session Duration' },
  },

}

// ── Factory ────────────────────────────────────────────────────────────────────

let _patchCounter = 0

/**
 * Build a PageStatePatch from a registry step answer.
 * Returns null if the workflowId or registryFieldId has no page mapping.
 */
export function buildPageStatePatch(params: {
  workflowId: string
  route: string
  registryFieldId: string
  value: string
}): PageStatePatch | null {
  const fieldMap = WORKFLOW_FIELD_MAPS[params.workflowId]
  if (!fieldMap) return null

  const entry = fieldMap[params.registryFieldId]
  if (!entry) return null

  _patchCounter++
  return {
    patchId:          `donna_patch_${Date.now()}_${_patchCounter}`,
    workflowId:       params.workflowId,
    route:            params.route,
    fieldId:          entry.pageFieldId,
    registryFieldId:  params.registryFieldId,
    value:            params.value,
    displayLabel:     entry.displayLabel,
    validationStatus: 'pending',
    source:           'donna_goal_session',
    timestamp:        Date.now(),
  }
}

/**
 * Returns true if the given workflow + registry field has a page mapping.
 */
export function isFieldSynced(workflowId: string, registryFieldId: string): boolean {
  return !!WORKFLOW_FIELD_MAPS[workflowId]?.[registryFieldId]
}

/**
 * Returns all page field IDs that a workflow can patch.
 */
export function getSyncedFieldIds(workflowId: string): string[] {
  const fieldMap = WORKFLOW_FIELD_MAPS[workflowId]
  if (!fieldMap) return []
  return Object.values(fieldMap).map(e => e.pageFieldId)
}
