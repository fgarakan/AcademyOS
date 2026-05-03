// Individual Development Plan — Sprint 229
// Pure deterministic helper. No DB calls. No AI. No side effects. No writes.
// Builds the living IDP object for a player and filters it by role.
// Player language: mission-based, encouraging.
// Parent language: empathetic, parent-safe, no deficit framing.
// Coach language: direct, cue-based.
// Director language: complete picture, operational.

// ── Role types ──────────────────────────────────────────────────────────────────

export type IdpRole = 'director' | 'head_coach' | 'coach' | 'player' | 'parent'

// ── Sub-types ───────────────────────────────────────────────────────────────────

export interface IdpPriority {
  title: string
  description: string | null
  category: string | null
}

export interface IdpOpenGate {
  id: string
  domain: string
  criterion: string
  threshold: string
}

export type IdpGapSeverity = 'low' | 'medium' | 'high' | 'insufficient_data'

export interface IdpTrainingGap {
  gap_type: string
  domain: string | null
  description: string
  severity: IdpGapSeverity
  role_note: string
}

export interface IdpKnowledgeGap {
  gap_type: string
  domain: string | null
  description: string
  severity: IdpGapSeverity
  suggested_module_domain: string | null
}

// ── Role-specific view types ────────────────────────────────────────────────────

export interface IdpDirectorView {
  role: 'director'
  player_id: string
  player_name: string
  current_level: string | null
  current_stage: string | null
  next_target_level: string | null
  active_priorities: IdpPriority[]
  open_gates: IdpOpenGate[]
  training_gaps: IdpTrainingGap[]
  knowledge_gaps: IdpKnowledgeGap[]
  approved_evidence_summary: string | null
  attendance_exposure_summary: string | null
  coach_watch_fors: string[]
  parent_support_guidance: string | null
  reassessment_timing: string | null
  safety_note: string
}

export interface IdpCoachView {
  role: 'coach'
  player_id: string
  player_name: string
  current_level: string | null
  current_stage: string | null
  next_target_level: string | null
  open_gates: IdpOpenGate[]
  training_gaps: IdpTrainingGap[]
  coach_watch_fors: string[]
  recommended_next_mission: string | null
  safety_note: string
}

export interface IdpPlayerView {
  role: 'player'
  player_id: string
  current_level: string | null
  recommended_next_mission: string | null
  what_to_practice: string[]
  what_to_understand: string[]
  requirements_to_move_up: string[]
  mini_challenge: string | null
  reflection_question: string | null
  safety_note: string
}

export interface IdpParentView {
  role: 'parent'
  player_first_name: string
  what_child_is_working_on: string | null
  why_it_matters: string | null
  how_to_support_this_week: string | null
  what_to_say_after_practice: string | null
  what_not_to_over_focus_on: string | null
  next_development_step: string | null
  current_level: string | null
  approved_data_note: string
  safety_note: string
}

export type IdpRoleView =
  | IdpDirectorView
  | IdpCoachView
  | IdpPlayerView
  | IdpParentView

// ── Full IDP type ───────────────────────────────────────────────────────────────

export interface IndividualDevelopmentPlan {
  player_id: string
  player_name: string
  player_first_name: string
  current_level: string | null
  current_stage: string | null
  next_target_level: string | null
  active_priorities: IdpPriority[]
  open_gates: IdpOpenGate[]
  training_gaps: IdpTrainingGap[]
  knowledge_gaps: IdpKnowledgeGap[]
  approved_evidence_summary: string | null
  attendance_exposure_summary: string | null
  recommended_next_mission: string | null
  what_to_practice: string[]
  what_to_understand: string[]
  requirements_to_move_up: string[]
  coach_watch_fors: string[]
  parent_support_guidance: string | null
  mini_challenge: string | null
  reflection_question: string | null
  reassessment_timing: string | null
}

// ── Build input type ────────────────────────────────────────────────────────────

export interface BuildIdpInput {
  player_id: string
  player_name: string
  player_first_name: string
  current_level: string | null
  current_stage: string | null
  next_target_level: string | null
  active_priorities?: IdpPriority[]
  open_gates?: IdpOpenGate[]
  training_gaps?: IdpTrainingGap[]
  knowledge_gaps?: IdpKnowledgeGap[]
  approved_evidence_summary?: string | null
  attendance_exposure_summary?: string | null
  coach_language_current_focus?: string | null
  coach_language_next_step?: string | null
  coach_language_doing_well?: string | null
  coach_language_working_on?: string | null
  top_drills?: Array<{ name: string; objective: string }>
  mini_challenge?: string | null
  reflection_question?: string | null
  reassessment_timing?: string | null
}

// ── Core builder ────────────────────────────────────────────────────────────────

export function buildIndividualDevelopmentPlan(
  input: BuildIdpInput,
): IndividualDevelopmentPlan {
  const {
    player_id,
    player_name,
    player_first_name,
    current_level,
    current_stage,
    next_target_level,
    active_priorities = [],
    open_gates = [],
    training_gaps = [],
    knowledge_gaps = [],
    approved_evidence_summary = null,
    attendance_exposure_summary = null,
    coach_language_current_focus = null,
    coach_language_next_step = null,
    coach_language_doing_well = null,
    coach_language_working_on = null,
    top_drills = [],
    mini_challenge = null,
    reflection_question = null,
    reassessment_timing = null,
  } = input

  // Derive player-facing mission from coach language or gates
  const recommended_next_mission: string | null =
    coach_language_next_step
    ?? (open_gates[0] ? `Show: ${open_gates[0].criterion}` : null)
    ?? (active_priorities[0] ? active_priorities[0].title : null)
    ?? (current_level ? `Keep building your skills in ${current_level}` : null)

  // What to practice — drill names + objectives
  const what_to_practice: string[] = top_drills
    .slice(0, 4)
    .map(d => `${d.name} — ${d.objective}`)

  // What to understand — coach language working_on + current_focus
  const what_to_understand: string[] = [
    coach_language_working_on,
    coach_language_current_focus,
  ].filter((s): s is string => Boolean(s))

  // Requirements to move up — open gate criteria (player-safe wording)
  const requirements_to_move_up: string[] = open_gates
    .slice(0, 5)
    .map(g => g.criterion)

  // Coach watch-fors — from open gates and training gaps
  const coach_watch_fors: string[] = [
    ...open_gates.slice(0, 3).map(g => `${g.domain}: ${g.criterion}`),
    ...training_gaps
      .filter(g => g.severity === 'high' || g.severity === 'medium')
      .slice(0, 2)
      .map(g => g.role_note),
  ].filter(Boolean)

  // Parent support — from coach language doing_well + next_step
  const parent_support_guidance: string | null =
    coach_language_doing_well
      ? `${player_first_name} is developing: ${coach_language_doing_well}. A great way to support this week is to ask what they practiced today and let them explain it to you.`
      : null

  return {
    player_id,
    player_name,
    player_first_name,
    current_level,
    current_stage,
    next_target_level,
    active_priorities,
    open_gates,
    training_gaps,
    knowledge_gaps,
    approved_evidence_summary,
    attendance_exposure_summary,
    recommended_next_mission,
    what_to_practice,
    what_to_understand,
    requirements_to_move_up,
    coach_watch_fors,
    parent_support_guidance,
    mini_challenge,
    reflection_question,
    reassessment_timing,
  }
}

// ── Role-specific view builder ──────────────────────────────────────────────────

export function buildRoleSpecificIdpView(
  plan: IndividualDevelopmentPlan,
  role: IdpRole,
): IdpRoleView {
  switch (role) {
    case 'director':
    case 'head_coach':
      return buildDirectorIdpView(plan)

    case 'coach':
      return buildCoachIdpView(plan)

    case 'player':
      return buildPlayerIdpView(plan)

    case 'parent':
      return buildParentIdpView(plan)
  }
}

function buildDirectorIdpView(plan: IndividualDevelopmentPlan): IdpDirectorView {
  return {
    role: 'director',
    player_id: plan.player_id,
    player_name: plan.player_name,
    current_level: plan.current_level,
    current_stage: plan.current_stage,
    next_target_level: plan.next_target_level,
    active_priorities: plan.active_priorities,
    open_gates: plan.open_gates,
    training_gaps: plan.training_gaps,
    knowledge_gaps: plan.knowledge_gaps,
    approved_evidence_summary: plan.approved_evidence_summary,
    attendance_exposure_summary: plan.attendance_exposure_summary,
    coach_watch_fors: plan.coach_watch_fors,
    parent_support_guidance: plan.parent_support_guidance,
    reassessment_timing: plan.reassessment_timing,
    safety_note:
      'Director view — full development context. Review all content before sharing with players or parents.',
  }
}

function buildCoachIdpView(plan: IndividualDevelopmentPlan): IdpCoachView {
  return {
    role: 'coach',
    player_id: plan.player_id,
    player_name: plan.player_name,
    current_level: plan.current_level,
    current_stage: plan.current_stage,
    next_target_level: plan.next_target_level,
    open_gates: plan.open_gates,
    training_gaps: plan.training_gaps,
    coach_watch_fors: plan.coach_watch_fors,
    recommended_next_mission: plan.recommended_next_mission,
    safety_note:
      'Coach view — curriculum and gap context only. Internal notes are not included here.',
  }
}

function buildPlayerIdpView(plan: IndividualDevelopmentPlan): IdpPlayerView {
  // Player view: mission-based language only, no internal data
  return {
    role: 'player',
    player_id: plan.player_id,
    current_level: plan.current_level,
    recommended_next_mission: plan.recommended_next_mission,
    what_to_practice: plan.what_to_practice,
    what_to_understand: plan.what_to_understand,
    requirements_to_move_up: plan.requirements_to_move_up,
    mini_challenge: plan.mini_challenge,
    reflection_question: plan.reflection_question,
    safety_note:
      'Your academy uses this to support your growth. Your coach may update this guidance over time.',
  }
}

function buildParentIdpView(plan: IndividualDevelopmentPlan): IdpParentView {
  // Parent view: empathetic, forward-looking, parent-safe only
  const firstName = plan.player_first_name

  const what_child_is_working_on: string | null =
    plan.what_to_understand[0] ?? plan.recommended_next_mission ?? null

  const why_it_matters: string | null =
    plan.current_level
      ? `Building strong foundations at this stage creates the skills that matter later in ${firstName}'s game.`
      : null

  const how_to_support_this_week: string | null =
    plan.parent_support_guidance

  const what_to_say_after_practice: string | null =
    `"What did you work on today?" — let ${firstName} tell you what they practiced.`

  const what_not_to_over_focus_on: string | null =
    `Results and wins matter less than the skills ${firstName} is building right now. Focus on effort and showing up.`

  const next_development_step: string | null =
    plan.next_target_level
      ? `${firstName} is building toward ${plan.next_target_level}.`
      : null

  return {
    role: 'parent',
    player_first_name: firstName,
    what_child_is_working_on,
    why_it_matters,
    how_to_support_this_week,
    what_to_say_after_practice,
    what_not_to_over_focus_on,
    next_development_step,
    current_level: plan.current_level,
    approved_data_note:
      'This view uses approved development information only.',
    safety_note:
      "This guidance supports your child's tennis journey. No personal assessment data is included.",
  }
}

// ── Safety note by role ─────────────────────────────────────────────────────────

export function getIdpSafetyNote(role: IdpRole): string {
  switch (role) {
    case 'director':
    case 'head_coach':
      return 'Director view — full development context. Review before sharing with players or parents.'
    case 'coach':
      return 'Coach view — curriculum and gap context only. Internal director notes are not shown.'
    case 'player':
      return 'Your development plan is updated by your coaching team. Keep showing up and building.'
    case 'parent':
      return "This view shows approved development guidance for your child's academy journey."
  }
}
