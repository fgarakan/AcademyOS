// Sprint 4359 — DONNA Knowledge Map for the Canonical 10 Atomic Loops
//
// Structured operating knowledge so DONNA can explain, guide, and answer questions
// for each canonical atomic loop. Answers the 8 operating questions per loop:
//   What is this? · Why do I need to do this? · What is missing? · What should I do
//   next? · What happens after this? · Who can see this? · Does this require approval?
//   · Help me complete it.
//
// Canonical loop taxonomy is the source of truth in
//   src/lib/donna/certification/atomicLoopUsabilityCertification.ts (LOOPS[]).
// Names/ids here MUST match it — loopKnowledgeCertification.ts asserts this.
//
// Design rules (same conventions as the operating layer):
//   - Pure TypeScript. No DB, no API, no OpenAI, no React, no side effects.
//   - Static data only. NO PII, no player names, no scores, no live counts.
//     Live state is resolved at runtime later via LivePageState — never fabricated here.
//   - This file is consumed ONLY by loopKnowledgeResolver.ts + the certification.
//     processDonnaMessage does NOT import this in Sprint 4359 (runtime wiring is gated).

import type { DonnaResponseRole } from '@/lib/donna/brain/donnaRoleResponsePolicy'
import type { LivePageState } from '@/lib/donna/operating/livePageState'

// ── Loop identity ─────────────────────────────────────────────────────────────

export type LoopId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

// ── Sub-shapes ──────────────────────────────────────────────────────────────────

/** A declarative "what is missing right now" check for a loop. */
export interface LoopMissingStateCheck {
  /** Stable id, e.g. 'no_template_selected'. */
  id: string
  /**
   * The real LivePageState signal that answers this check, or null when the
   * condition is UI/form-local (not derivable from academy-level live state).
   */
  liveSignal: keyof LivePageState | null
  /** What DONNA says when this condition is unmet. Static, no PII. */
  unmetMessage: string
}

/** Approval requirement for the loop's primary mutation. */
export interface LoopApprovalRequirement {
  requiresApproval: boolean
  approvalTier:
    | 'none'
    | 'confirmation'
    | 'review_queue'
    | 'director_approval'
    | 'platform_owner'
  /** Role-agnostic framing sentence. Mirrors donnaRoleResponsePolicy APPROVAL_FRAMING intent. */
  framing: string
  /** The canonical mutation path this loop writes through. */
  mutationPath: string
}

/** Who may see this loop's data, and what must never reach parent/player. */
export interface LoopVisibilityRule {
  /** Roles that legitimately see this loop's data. */
  audience: DonnaResponseRole[]
  /** Whether a parent/player-facing derivative of this loop exists at all. */
  parentPlayerSafe: boolean
  /**
   * Content categories DONNA must never surface for this loop when speaking to a
   * parent or player. MUST be a superset of ROLE_BLOCKED_CATEGORIES for any
   * parent/player audience (enforced by loopKnowledgeCertification).
   */
  blockedForParentPlayer: string[]
  note: string
}

// ── Main knowledge object ────────────────────────────────────────────────────────

export interface LoopKnowledge {
  id: LoopId
  /** Canonical cert name — must equal atomicLoopUsabilityCertification LOOPS[].name. */
  name: string
  /** Brian-facing plain-English label. */
  plainEnglishName: string
  /** "What is this?" */
  purpose: string
  /** "Why do I need to do this?" */
  whyItMatters: string
  /** "What happens after this?" — downstream loop linkage. Its own certified field. */
  whatHappensAfter: string
  primaryRole: DonnaResponseRole
  supportingRoles: DonnaResponseRole[]
  /** Canonical route(s). The resolver keys on these. */
  primaryRoutes: string[]
  /** What must be present to complete the loop. */
  requiredInputs: string[]
  /** "Done" definition — aligns with pageCompletionEngine.completionCondition. */
  completionCriteria: string[]
  /** "What is missing?" — declarative checks against live signals or UI state. */
  missingStateChecks: LoopMissingStateCheck[]
  /** "What should I do next?" — guidance/navigation only, NEVER a direct mutation. */
  safeNextActions: string[]
  /** "Does this require approval?" */
  approvalRequirements: LoopApprovalRequirement
  /** "Who can see this?" */
  parentPlayerVisibilityRules: LoopVisibilityRule
  /** FAQ DONNA should be able to answer for this loop. */
  commonQuestions: string[]
  /** Grounded canned explanation keyed by a short question key. */
  donnaExplanations: Record<string, string>
  /** Per-loop guardrails — phrasings/claims DONNA must avoid. */
  donnaDoNotSay: string[]
  /** Known failure modes for this loop. */
  failureStates: string[]
  /** Maps to the usability test plan's Expected outcomes for browser validation. */
  browserTestCriteria: string[]
}

// ── Loop knowledge registry ──────────────────────────────────────────────────────
// Loops 4 and 5 are authored first with enhanced coverage (higher cert bar).

const LOOP_4_SESSION_CREATION: LoopKnowledge = {
  id: 4,
  name: 'Session Creation',
  plainEnglishName: 'Create a session',
  purpose:
    'Create a live session by instantiating a published class or fitness template for a specific group, coach, date, and time.',
  whyItMatters:
    'A session is the unit coaches actually deliver. Without a scheduled session there is no attendance, no observations, and no development record for that day — the entire coach loop has nothing to run against.',
  whatHappensAfter:
    'The session appears on the assigned coach’s home and session list. After delivery it flows into Coach Session Execution (Loop 6), then Coach Wrap-Up (Loop 7), then Director Review & Approval (Loop 9).',
  primaryRole: 'director',
  supportingRoles: ['coach'],
  primaryRoutes: ['/director/sessions/new'],
  requiredInputs: [
    'A published template (class or fitness)',
    'A target player group',
    'An assigned coach',
    'A date and time',
  ],
  completionCriteria: [
    'Template selected',
    'Coach assigned',
    'Group confirmed',
    'Session scheduled and published (real write + audit)',
  ],
  missingStateChecks: [
    { id: 'no_template_selected', liveSignal: null, unmetMessage: 'No template is selected yet — pick the published template you want to run.' },
    { id: 'no_coach_selected', liveSignal: null, unmetMessage: 'No coach is assigned yet — choose the coach who will deliver this session.' },
    { id: 'no_group_selected', liveSignal: null, unmetMessage: 'No player group is set — confirm which group this session is for.' },
    { id: 'no_date_selected', liveSignal: null, unmetMessage: 'No date or time is set yet — schedule when this session runs.' },
    { id: 'sessions_awaiting_coach', liveSignal: 'unassignedSessions', unmetMessage: 'There are sessions without a coach assigned — assign a coach before they can be delivered.' },
    { id: 'coach_coverage_gap', liveSignal: 'coachCoverageIssues', unmetMessage: 'There are coach coverage gaps this period — some sessions may not have an available coach.' },
  ],
  safeNextActions: [
    'Explain which published template fits the level you are delivering next',
    'Point out that a coach and group must be set before the session can be published',
    'Navigate to the Templates workspace if no published template exists yet',
    'Summarise the create → assign → confirm → schedule → publish path',
  ],
  approvalRequirements: {
    requiresApproval: false,
    approvalTier: 'none',
    framing: 'Creating a session is a direct director action — it is recorded in the audit log.',
    mutationPath: 'director-direct write + audit log (generateSessionFromTemplateAction)',
  },
  parentPlayerVisibilityRules: {
    audience: ['director', 'coach'],
    parentPlayerSafe: false,
    blockedForParentPlayer: [
      'raw_coach_session_notes',
      'internal_assessment_scores',
      'coach_observations_verbatim',
      'internal_director_decisions',
    ],
    note: 'Session plans and template internals are staff-only. Parents and players never see the session builder.',
  },
  commonQuestions: [
    'How do I create a session?',
    'Which template should I use?',
    'Do I assign the coach here or later?',
    'Does the session go live immediately?',
    'Why can’t I publish this session yet?',
    'What happens to this session after I create it?',
  ],
  donnaExplanations: {
    how_to_create: 'Open New Session, pick a published template, choose the coach and group, set the date and time, then Create. The session and its blocks are written and you land on the session.',
    which_template: 'Use the published template for the curriculum level you are delivering next. If none exists for that level, create one in Templates first.',
    coach_timing: 'You can assign the coach here at creation. If you leave it unassigned, the session shows as needing a coach until you set one.',
    goes_live: 'Creating the session schedules it and makes it visible to the assigned coach. It does not notify anyone or change any player data.',
    cannot_publish: 'A session needs a template, a coach, a group, and a date before it can be published. DONNA can tell you which one is missing.',
    after_create: 'It appears on the coach’s schedule; delivery flows into execution, then wrap-up, then your review queue.',
  },
  donnaDoNotSay: [
    'Do not claim a session was created before the write is confirmed.',
    'Do not imply the session notifies parents or players — it does not.',
    'Do not promise auto-assignment of coaches or groups.',
  ],
  failureStates: [
    'No published template exists for the target level → the session cannot be created until one is published.',
    'No coach available for the slot → the session is created but flagged as needing a coach.',
    'Preview mode → the write is blocked with a friendly message (assertNotPreviewMode).',
  ],
  browserTestCriteria: [
    'Open /director/sessions/new, pick template + coach + group + date, Create.',
    'Session and blocks are created (real write + audit); the page redirects to the session.',
    'Ask DONNA "what should I do here?" — she names the missing input if any, else the next step.',
    'Confirm no parent/player surface reflects the new session.',
  ],
}

const LOOP_5_COACH_ASSIGNMENT: LoopKnowledge = {
  id: 5,
  name: 'Coach Assignment & Session Readiness',
  plainEnglishName: 'Assign a coach and confirm session readiness',
  purpose:
    'Assign coaches to groups/sessions and confirm that a session is ready to run — a coach is assigned, the template and group are set, and the schedule is in place.',
  whyItMatters:
    'A session with no coach cannot be delivered, and a group with no coach creates a coverage gap. Coach assignment and readiness are what turn a scheduled plan into a session that actually happens.',
  whatHappensAfter:
    'Once a coach is assigned and the session is ready, the coach delivers it (Loop 6 — Coach Session Execution) and closes it with a wrap-up (Loop 7).',
  primaryRole: 'director',
  supportingRoles: ['coach'],
  primaryRoutes: ['/director/coaches', '/director/onboarding/coaches-permissions'],
  requiredInputs: [
    'An active coach on the roster',
    'A group or session to assign the coach to',
    'A confirmed template and schedule for readiness',
  ],
  completionCriteria: [
    'Every active coach has at least one group or session',
    'No group is left without a coach',
    'For a given session: coach + template + group + date all present (session readiness)',
  ],
  missingStateChecks: [
    { id: 'coach_unassigned', liveSignal: 'coachCoverageIssues', unmetMessage: 'There are coach coverage gaps — one or more groups or sessions have no coach assigned.' },
    { id: 'group_underfilled', liveSignal: 'underfilledGroups', unmetMessage: 'Some groups are underfilled — check whether they still need a coach or should be merged.' },
    { id: 'group_overfilled', liveSignal: 'overfilledGroups', unmetMessage: 'Some groups are overfilled for their coach — consider a second coach or a group split.' },
    { id: 'session_unassigned', liveSignal: 'unassignedSessions', unmetMessage: 'There are sessions without a coach — assign one so they are ready to run.' },
    { id: 'no_coach_selected_readiness', liveSignal: null, unmetMessage: 'This session has no coach yet — it is not ready to run until one is assigned.' },
    { id: 'no_template_for_readiness', liveSignal: null, unmetMessage: 'This session has no template — readiness needs a template, group, coach, and date.' },
  ],
  safeNextActions: [
    'Show which coach is assigned to a given group or session',
    'Point out groups or sessions with no coach (coverage gaps)',
    'Explain the readiness checklist: coach + template + group + date',
    'Navigate to onboarding coaches-permissions to add or assign a coach',
    'Note that there is no dedicated reassignment screen — assignment happens here and at session creation',
  ],
  approvalRequirements: {
    requiresApproval: false,
    approvalTier: 'none',
    framing: 'Assigning a coach is a direct director action — it is recorded in the audit log.',
    mutationPath: 'director-direct write + audit log (updateCoachesPermissionsAction / session assignment)',
  },
  parentPlayerVisibilityRules: {
    audience: ['director', 'coach'],
    parentPlayerSafe: false,
    blockedForParentPlayer: [
      'raw_coach_session_notes',
      'internal_director_decisions',
      'other_player_data',
      'internal_assessment_scores',
    ],
    note: 'Coach staffing and assignment are staff-only. Parents and players never see coach assignment or coverage data.',
  },
  commonQuestions: [
    'Which coach is on this group?',
    'Is this coach ready for the session?',
    'How do I assign a coach?',
    'How do I reassign a coach?',
    'Are any groups without a coach?',
    'What does "session readiness" mean?',
  ],
  donnaExplanations: {
    who_is_assigned: 'DONNA can tell you which coach is currently assigned to a group or session, and flag any that have none.',
    is_ready: 'A session is "ready" when it has a coach, a template, a group, and a scheduled date/time. DONNA lists whichever of those is missing.',
    how_to_assign: 'Assign coaches in Onboarding → Coaches & Permissions, or pick the coach directly when creating a session.',
    how_to_reassign: 'There is no dedicated reassignment screen yet. Reassign by updating the coach in onboarding coaches-permissions or at session creation.',
    coverage_gaps: 'DONNA surfaces groups and sessions with no coach as coverage gaps so none go unstaffed.',
    readiness_meaning: 'Session readiness is a derived state — not its own page — meaning coach + template + group + date are all present.',
  },
  donnaDoNotSay: [
    'Do not invent a dedicated coach reassignment screen — it does not exist yet.',
    'Do not claim a session is ready when a required input is missing.',
    'Do not expose coach staffing decisions to parents or players.',
  ],
  failureStates: [
    'No dedicated reassignment screen (documented limitation) → reassignment is done via onboarding or session creation.',
    'A group has no coach → coverage gap flagged until assigned.',
    'A session is missing template/group/date → not ready even if a coach is assigned.',
  ],
  browserTestCriteria: [
    'Open /director/onboarding/coaches-permissions (or /director/coaches), assign a coach, save.',
    'Confirm the coach appears as selectable in Session Creation.',
    'Ask DONNA "is this session ready?" — she names any missing readiness input.',
    'Confirm no parent/player surface reflects coach assignment.',
  ],
}

const LOOP_1_ACADEMY_SETUP: LoopKnowledge = {
  id: 1,
  name: 'Academy Setup',
  plainEnglishName: 'Set up your academy',
  purpose:
    'Complete the onboarding steps that activate the operating system — Academy DNA, first curriculum level, first group, coaches, and first players.',
  whyItMatters:
    'DONNA cannot give academy-specific guidance until the DNA model is set, and curriculum, groups, and coaching all depend on setup being complete. Setup is the foundation every other loop stands on.',
  whatHappensAfter:
    'A configured academy unlocks Curriculum Setup (Loop 2) and everything downstream — templates, sessions, coaching, and player development.',
  primaryRole: 'director',
  supportingRoles: [],
  primaryRoutes: ['/director/onboarding'],
  requiredInputs: ['Academy DNA model', 'First curriculum level', 'First group', 'First coach', 'First player'],
  completionCriteria: [
    'Academy DNA model selected',
    'First curriculum level defined',
    'First group created',
    'All 7 onboarding steps complete',
  ],
  missingStateChecks: [
    { id: 'onboarding_incomplete', liveSignal: 'onboardingComplete', unmetMessage: 'Academy setup is not complete yet — finish the remaining onboarding steps.' },
    { id: 'onboarding_progress', liveSignal: 'onboardingProgress', unmetMessage: 'Continue onboarding from where you left off — steps must be completed in order.' },
  ],
  safeNextActions: [
    'Explain what each onboarding step configures',
    'Point to Academy DNA as the required first step',
    'Summarise how many steps remain',
  ],
  approvalRequirements: {
    requiresApproval: false,
    approvalTier: 'none',
    framing: 'Setup changes are director decisions — nothing is automatic.',
    mutationPath: 'director-direct writes + audit (onboarding step actions)',
  },
  parentPlayerVisibilityRules: {
    audience: ['director'],
    parentPlayerSafe: false,
    blockedForParentPlayer: ['internal_director_decisions', 'financial_information'],
    note: 'Academy configuration is director-only. Parents and players never see setup.',
  },
  commonQuestions: [
    'Where do I start?',
    'What is Academy DNA?',
    'How many steps are left?',
    'Why can’t I set up curriculum yet?',
  ],
  donnaExplanations: {
    where_start: 'Start with Academy DNA — it grounds how DONNA reasons about your academy everywhere else.',
    what_is_dna: 'The Academy DNA model describes your development philosophy; it must be set before curriculum and groups.',
    steps_left: 'DONNA reports how many of the 7 setup steps remain based on your progress.',
    why_blocked: 'Curriculum and groups depend on onboarding; complete the earlier steps first.',
  },
  donnaDoNotSay: [
    'Do not give academy-specific advice before the DNA model is set.',
    'Do not skip steps or imply they are optional when they are prerequisites.',
  ],
  failureStates: [
    'DNA not selected → academy-specific guidance is unavailable.',
    'Steps attempted out of order → later steps are blocked.',
  ],
  browserTestCriteria: [
    'Open /director/onboarding, pick a setup mode, Begin, complete steps.',
    'Confirm progress persists on reload.',
    'Ask DONNA "where do I start?" — she names Academy DNA first.',
  ],
}

const LOOP_2_CURRICULUM_SETUP: LoopKnowledge = {
  id: 2,
  name: 'Curriculum Setup',
  plainEnglishName: 'Build your curriculum',
  purpose:
    'Define the curriculum spine — levels, progression criteria, and content — and assign active players to levels so progression can be tracked.',
  whyItMatters:
    'Players without a curriculum level cannot have progression tracked, and assessment evidence is meaningless until the spine is active. Curriculum is what turns coaching into measurable development.',
  whatHappensAfter:
    'An active spine with assigned players enables Class Template Setup (Loop 3), assessments, and player development (Loop 8).',
  primaryRole: 'director',
  supportingRoles: ['coach'],
  primaryRoutes: ['/director/curriculum', '/director/curriculum/builder'],
  requiredInputs: ['Curriculum levels', 'Progression/assessment criteria per level', 'Player-to-level assignments'],
  completionCriteria: [
    'Curriculum spine active — all levels defined',
    'All active players assigned a curriculum level',
    'Assessment criteria defined per level',
  ],
  missingStateChecks: [
    { id: 'spine_inactive', liveSignal: 'curriculumSpineActive', unmetMessage: 'The curriculum spine is not active — define and activate your levels first.' },
    { id: 'players_missing_level', liveSignal: 'playersMissingCurriculumLevel', unmetMessage: 'Some active players have no curriculum level assigned and cannot be tracked.' },
    { id: 'setup_steps_incomplete', liveSignal: 'curriculumSetupStepsComplete', unmetMessage: 'Curriculum setup has remaining steps — continue where you left off.' },
  ],
  safeNextActions: [
    'Explain that edits become drafts pending review (approval-first)',
    'Point out players missing a curriculum level',
    'Summarise the define → assign → set-criteria path',
  ],
  approvalRequirements: {
    requiresApproval: true,
    approvalTier: 'review_queue',
    framing: 'Curriculum edits become drafts and change nothing official until you approve them.',
    mutationPath: 'proposed_actions / curriculum draft → director review',
  },
  parentPlayerVisibilityRules: {
    audience: ['director', 'coach'],
    parentPlayerSafe: false,
    blockedForParentPlayer: ['internal_director_decisions', 'internal_assessment_scores'],
    note: 'Curriculum architecture is staff-only. Player-facing views show only approved development guidance elsewhere.',
  },
  commonQuestions: [
    'How do I add a level?',
    'Why can’t players progress?',
    'Does my edit change the curriculum immediately?',
    'Which players have no level?',
  ],
  donnaExplanations: {
    add_level: 'Open the Curriculum Builder (director-only), add or customize a level, and submit — it enters the change queue as a draft.',
    why_no_progress: 'Players without an assigned level cannot have progression tracked; assign levels to enable it.',
    edit_immediate: 'No — edits are saved as drafts and only change official curriculum after you approve them.',
    players_no_level: 'DONNA can list active players missing a curriculum level once that signal is wired.',
  },
  donnaDoNotSay: [
    'Do not imply a curriculum edit is live before approval.',
    'Do not present unverified curriculum content as official.',
  ],
  failureStates: [
    'Spine inactive → progression tracking unavailable.',
    'Players unassigned → their development cannot be tracked.',
  ],
  browserTestCriteria: [
    'Open /director/curriculum/builder, add or change something small.',
    'Confirm it becomes a draft for approval, not an immediate change.',
    'Ask DONNA "does this change the curriculum now?" — she explains draft-first.',
  ],
}

const LOOP_3_CLASS_TEMPLATE_SETUP: LoopKnowledge = {
  id: 3,
  name: 'Class Template Setup',
  plainEnglishName: 'Create a class template',
  purpose:
    'Create and publish the class templates that structure sessions — blocks with activities and coaching cues, tied to a curriculum level.',
  whyItMatters:
    'A level without a published template cannot have aligned sessions. Templates are the reusable plan every session is built from.',
  whatHappensAfter:
    'A published template becomes available in Session Creation (Loop 4) for the level it targets.',
  primaryRole: 'director',
  supportingRoles: [],
  primaryRoutes: ['/director/templates/class/create', '/director/templates', '/director/class-templates'],
  requiredInputs: ['Template blocks with activities', 'Coaching cues per block', 'Assigned curriculum level'],
  completionCriteria: [
    'All blocks have activities and coaching cues',
    'Curriculum level assigned to the template',
    'Template published and available for sessions',
  ],
  missingStateChecks: [
    { id: 'template_incomplete', liveSignal: null, unmetMessage: 'This template has empty blocks or missing coaching cues — fill them before publishing.' },
    { id: 'no_level_assigned', liveSignal: null, unmetMessage: 'No curriculum level is assigned to this template — sessions cannot align without it.' },
  ],
  safeNextActions: [
    'Explain the wizard saves the template as a draft',
    'Point out empty blocks or missing cues that block publishing',
    'Summarise the fill → assign level → publish path',
  ],
  approvalRequirements: {
    requiresApproval: true,
    approvalTier: 'review_queue',
    framing: 'A new class template is saved as a draft; publishing makes it available to coaches.',
    mutationPath: 'template draft → publish (saveClassTemplateDraftFromWizardAction)',
  },
  parentPlayerVisibilityRules: {
    audience: ['director', 'coach'],
    parentPlayerSafe: false,
    blockedForParentPlayer: ['internal_director_decisions'],
    note: 'Templates are staff-only planning artifacts. Parents and players never see them.',
  },
  commonQuestions: [
    'How do I make a class template?',
    'Does it save as a draft?',
    'Why can’t I publish this template?',
    'What level does this template cover?',
  ],
  donnaExplanations: {
    how_to_make: 'Start a new class template and complete the short wizard — it saves as a draft without overwriting anything.',
    saves_draft: 'Yes — the wizard creates a draft; nothing existing is overwritten.',
    cannot_publish: 'Empty blocks or missing coaching cues block publishing; fill every block and assign a level first.',
    which_level: 'A template covers the curriculum level assigned to it; sessions align to that level.',
  },
  donnaDoNotSay: [
    'Do not claim a template is published while blocks are empty.',
    'Do not merge template_blocks and session_blocks conceptually.',
  ],
  failureStates: [
    'Empty blocks or missing cues → cannot publish.',
    'No curriculum level → sessions cannot align to the template.',
  ],
  browserTestCriteria: [
    'Open /director/templates/class/create, complete the wizard.',
    'Confirm it saves as a draft.',
    'Ask DONNA "why can’t I publish?" — she names empty blocks or missing level.',
  ],
}

const LOOP_6_COACH_SESSION_EXECUTION: LoopKnowledge = {
  id: 6,
  name: 'Coach Session Execution',
  plainEnglishName: 'Run the session on court',
  purpose:
    'Deliver a scheduled session on court, marking each block’s status (planned / in-progress / completed / skipped) as it happens.',
  whyItMatters:
    'On-court execution is the moment the plan meets reality. Recording block status captures what was actually delivered, which grounds the wrap-up and the player development record.',
  whatHappensAfter:
    'Once blocks are executed, the coach closes the session with a wrap-up (Loop 7), which flows to Director Review & Approval (Loop 9).',
  primaryRole: 'coach',
  supportingRoles: ['director'],
  primaryRoutes: ['/coach/sessions/[sessionId]'],
  requiredInputs: ['An assigned session with template blocks', 'Coach access to the session'],
  completionCriteria: [
    'Each block marked with an actual status',
    'Block status persisted to session_blocks with audit',
  ],
  missingStateChecks: [
    { id: 'blocks_not_started', liveSignal: null, unmetMessage: 'Blocks are still marked planned — update each as you work through the session.' },
    { id: 'session_pending_wrapup', liveSignal: null, unmetMessage: 'This session has been run but not wrapped up — complete the wrap-up next.' },
  ],
  safeNextActions: [
    'Explain how to mark each block as you go',
    'Give live/on-court guidance on what block is next',
    'Point to the wrap-up as the next step after the last block',
  ],
  approvalRequirements: {
    requiresApproval: false,
    approvalTier: 'none',
    framing: 'Marking block status is a direct coach action during the session — it is recorded in the audit log.',
    mutationPath: 'coach-direct write to session_blocks.actual_status + audit (updateBlockStatusAction)',
  },
  parentPlayerVisibilityRules: {
    audience: ['coach', 'director'],
    parentPlayerSafe: false,
    blockedForParentPlayer: ['raw_coach_session_notes', 'coach_observations_verbatim', 'internal_assessment_scores'],
    note: 'On-court execution detail is staff-only. Parents and players never see block status or session internals.',
  },
  commonQuestions: [
    'What’s next in this session?',
    'How do I mark a block done?',
    'Does my progress save if I leave?',
    'What do I do after the last block?',
  ],
  donnaExplanations: {
    whats_next: 'DONNA can tell you the next block in the session flow — warm-up, main, then cool-down.',
    mark_done: 'Tap the block and set its status (in-progress, completed, skipped) as you deliver it.',
    progress_saves: 'Yes — block status persists to the session, so closing and reopening keeps your place.',
    after_last: 'After the final block, start the wrap-up to capture attendance and observations.',
  },
  donnaDoNotSay: [
    'Do not expose block detail or session internals to parents or players.',
    'Do not claim status saved before the write is confirmed.',
  ],
  failureStates: [
    'Preview mode → status write is blocked with a friendly message.',
    'Coach not assigned to the session → access denied.',
  ],
  browserTestCriteria: [
    'Open /coach/sessions/[id] as the assigned coach, mark block statuses.',
    'Reload and confirm statuses persisted.',
    'Ask DONNA "what’s next in this session?" — she names the next block.',
  ],
}

const LOOP_7_COACH_WRAP_UP: LoopKnowledge = {
  id: 7,
  name: 'Coach Wrap-Up',
  plainEnglishName: 'Wrap up the session',
  purpose:
    'Capture the post-session recap — attendance, observations, and reflection — via the guided wrap-up, and submit it for director review.',
  whyItMatters:
    'The wrap-up is how a session becomes a development record. Without it, the day’s coaching leaves no evidence and nothing reaches the director’s review queue.',
  whatHappensAfter:
    'The wrap-up is submitted as a draft (proposed_actions, pending_review) and flows to Director Review & Approval (Loop 9). Nothing is applied until the director approves.',
  primaryRole: 'coach',
  supportingRoles: ['director'],
  primaryRoutes: ['/coach/sessions/[sessionId]/wrap-up'],
  requiredInputs: ['Attendance for all players', 'At least one observation per player', 'Session reflection answers'],
  completionCriteria: [
    'Attendance marked for all players',
    'At least one observation submitted per player',
    'Wrap-up submitted to the director review queue',
  ],
  missingStateChecks: [
    { id: 'attendance_unmarked', liveSignal: null, unmetMessage: 'Attendance is not marked for all players — the wrap-up can’t be submitted until it is.' },
    { id: 'no_observations', liveSignal: null, unmetMessage: 'No observations recorded yet — add at least one per player.' },
  ],
  safeNextActions: [
    'Walk the coach through the 6 guided questions',
    'Explain that nothing is sent until the director reviews it',
    'Point out attendance must be marked before submission',
  ],
  approvalRequirements: {
    requiresApproval: true,
    approvalTier: 'review_queue',
    framing: 'This will be sent to your director for review before any changes apply.',
    mutationPath: 'proposed_actions (pending_review) → director review (saveWrapUpDraftAction)',
  },
  parentPlayerVisibilityRules: {
    audience: ['coach', 'director'],
    parentPlayerSafe: false,
    blockedForParentPlayer: ['raw_coach_session_notes', 'coach_observations_verbatim', 'internal_assessment_scores', 'other_player_data'],
    note: 'Coach-internal until a director approves any parent-facing derivative. Raw recap never reaches parent/player portals.',
  },
  commonQuestions: [
    'How do I start the wrap-up?',
    'Can I talk instead of typing?',
    'Does this get sent to anyone?',
    'Why can’t I submit yet?',
  ],
  donnaExplanations: {
    how_to_start: 'Open the session as a coach and tap Start Wrap-Up, then answer the six guided questions.',
    voice_ok: 'Yes — you can speak your answers instead of typing.',
    sent_to_anyone: 'No — it is submitted for director review; nothing is sent to families until the director approves.',
    cannot_submit: 'Attendance must be marked for all players before the wrap-up can be submitted.',
  },
  donnaDoNotSay: [
    'Do not imply the wrap-up is sent to parents or players.',
    'Do not surface raw observations outside staff.',
  ],
  failureStates: [
    'Attendance unmarked → submission blocked.',
    'Partial save failure → raw recap is preserved; structured draft is best-effort.',
  ],
  browserTestCriteria: [
    'Open a session as coach, Start Wrap-Up, answer the 6 questions, Submit for Review.',
    'Confirm "submitted for review" — nothing applied.',
    'Confirm no parent/player surface shows the recap.',
  ],
}

const LOOP_8_PLAYER_DEVELOPMENT_EVIDENCE: LoopKnowledge = {
  id: 8,
  name: 'Player Development & Evidence',
  plainEnglishName: 'Assess a player, log evidence, and place them',
  purpose:
    'Maintain the player development record — placement/activation, assessments, and gate evidence — on one player-centric lifecycle.',
  whyItMatters:
    'This is the player’s development record. Placement activates a player, assessments and evidence ground their progression, and level movement is always an explicit director decision — never automatic.',
  whatHappensAfter:
    'Evidence and assessments feed gate status; a director may later approve level movement (Loop 9). Placement activates the player so they can join tracked sessions.',
  primaryRole: 'director',
  supportingRoles: ['coach', 'player'],
  primaryRoutes: ['/director/players/[playerId]', '/director/placement', '/coach/players/[playerId]'],
  requiredInputs: ['A player record', 'Assessment input or gate evidence', 'For intake: a placement decision (level + group)'],
  completionCriteria: [
    'Assessment/evidence recorded within a reasonable window',
    'Intake players placed and activated via finalize_player_placement()',
    'No auto level movement — director decisions only',
  ],
  missingStateChecks: [
    { id: 'players_without_assessment', liveSignal: 'playersWithoutAssessment', unmetMessage: 'Some players have not been assessed recently — schedule a reassessment.' },
    { id: 'players_without_placement', liveSignal: 'playersWithoutPlacement', unmetMessage: 'Some players are not placed yet and cannot join tracked sessions until activated.' },
    { id: 'placement_queue', liveSignal: 'placementQueueCount', unmetMessage: 'There are players in the placement queue awaiting a decision.' },
  ],
  safeNextActions: [
    'Explain how to run a quick assessment or log gate evidence',
    'Point out players missing a recent assessment or placement',
    'Explain that placement activation is irreversible and finalize_player_placement is the only path',
    'Emphasise no player moves levels automatically',
  ],
  approvalRequirements: {
    requiresApproval: true,
    approvalTier: 'director_approval',
    framing: 'Placement activation and level movement are explicit director decisions, recorded with evidence and audit.',
    mutationPath: 'assessment/evidence writes + finalize_player_placement() (the only activation path)',
  },
  parentPlayerVisibilityRules: {
    audience: ['director', 'coach', 'player'],
    parentPlayerSafe: true,
    blockedForParentPlayer: [
      'internal_assessment_scores',
      'coach_observations_verbatim',
      'raw_coach_session_notes',
      'other_player_data',
      'internal_director_decisions',
      'parent_guardian_communications',
      'financial_information',
    ],
    note: 'A player sees only their own approved, player-safe development guidance — never raw scores, verbatim observations, or other players’ data.',
  },
  commonQuestions: [
    'How do I assess a player?',
    'How do I log evidence?',
    'How do I place a new player?',
    'Will a player move levels automatically?',
    'Is placement reversible?',
  ],
  donnaExplanations: {
    how_to_assess: 'Open the player profile and use quick assessment or the assessment studio; it saves with audit where required.',
    how_to_log_evidence: 'Use the gate evidence controls on the player profile to record evidence against a requirement.',
    how_to_place: 'In Placement, create a recommendation for the intake player, approve it, then activate via finalize_player_placement().',
    auto_move: 'No — no player moves levels automatically. Level movement is always an explicit director decision.',
    placement_reversible: 'Activation is final; DONNA discloses irreversibility before you activate.',
  },
  donnaDoNotSay: [
    'Do not surface raw assessment scores or verbatim observations to a parent or player.',
    'Do not imply automatic level movement.',
    'Do not expose one player’s data to another player or their parent.',
  ],
  failureStates: [
    'Player unplaced → cannot join tracked sessions until activated.',
    'Assessment overdue → progression signals go stale.',
  ],
  browserTestCriteria: [
    'Open a player profile, run a quick assessment, log a piece of evidence.',
    'For an intake player: Placement → create → approve → activate; confirm the "final" disclosure.',
    'Confirm no auto level movement and no cross-player exposure.',
  ],
}

const LOOP_9_DIRECTOR_REVIEW_APPROVAL: LoopKnowledge = {
  id: 9,
  name: 'Director Review & Approval',
  plainEnglishName: 'Review and approve',
  purpose:
    'Review the single "needs attention" queue — coach wrap-ups, parent updates, placement and curriculum drafts — and approve, reject, or apply each.',
  whyItMatters:
    'Approvals are the control point of the whole system. Nothing a coach or DONNA proposes changes real data until the director approves it here.',
  whatHappensAfter:
    'Approved items are applied (writes + audit) via execute_approved_action; parent-visible items become what families see; rejected items stop.',
  primaryRole: 'director',
  supportingRoles: [],
  primaryRoutes: ['/director/review'],
  requiredInputs: ['Pending proposed actions in the queue'],
  completionCriteria: [
    'All pending items reviewed',
    'Parent-visible items approved or deferred first',
    'Approved items applied (writes + audit)',
  ],
  missingStateChecks: [
    { id: 'pending_items', liveSignal: 'pendingReviewCount', unmetMessage: 'There are items waiting for your review.' },
    { id: 'pending_parent', liveSignal: 'pendingParentApprovals', unmetMessage: 'There are parent-visible items to review first — they affect what families see.' },
    { id: 'pending_coach', liveSignal: 'pendingCoachApprovals', unmetMessage: 'There are coach-facing items awaiting your decision.' },
  ],
  safeNextActions: [
    'Recommend reviewing parent-visible items first',
    'Explain the two-step approve → apply flow',
    'Summarise what each item type will change once applied',
  ],
  approvalRequirements: {
    requiresApproval: true,
    approvalTier: 'director_approval',
    framing: 'Your approval is required before anything changes.',
    mutationPath: 'proposed_actions → execute_approved_action() (the only execution path)',
  },
  parentPlayerVisibilityRules: {
    audience: ['director'],
    parentPlayerSafe: false,
    blockedForParentPlayer: ['internal_director_decisions', 'raw_coach_session_notes', 'internal_assessment_scores'],
    note: 'The review queue is director-only. Its contents never appear in parent/player portals.',
  },
  commonQuestions: [
    'What needs my approval?',
    'What happens when I approve?',
    'Which items should I do first?',
    'What does Apply do?',
  ],
  donnaExplanations: {
    what_needs_approval: 'DONNA lists the pending items and can prioritise parent-visible ones first.',
    on_approve: 'Approving marks the item approved; applying then writes the change and records an audit entry.',
    first: 'Start with parent-visible items — they affect what families see once approved.',
    what_apply: 'Apply executes the approved action via execute_approved_action and records the write.',
  },
  donnaDoNotSay: [
    'Do not apply or execute anything on the director’s behalf without approval.',
    'Do not expose queue contents to non-director roles.',
  ],
  failureStates: [
    'Preview mode → apply is blocked with a friendly message.',
    'Stale items (>7 days) → flagged for attention.',
  ],
  browserTestCriteria: [
    'Open /director/review, pick a pending item, Approve or Reject.',
    'For applicable types, Apply → writes + audit recorded.',
    'Confirm two-step approve→apply and assertNotPreviewMode.',
  ],
}

const LOOP_10_PARENT_PLAYER_SAFE_CLARITY: LoopKnowledge = {
  id: 10,
  name: 'Parent & Player-Safe Clarity',
  plainEnglishName: 'Parent and player updates',
  purpose:
    'Give parents and players clear, safe, approved development information — parent update drafts (director-initiated) and the parent/player portals.',
  whyItMatters:
    'Families need clarity, but only parent-safe, approved, sourced content may reach them. This loop is where trust is kept — no internal notes, scores, or other players’ data ever crosses the line.',
  whatHappensAfter:
    'A parent update is a draft that flows to Director Review & Approval (Loop 9); once approved, it becomes what the family sees. Portals render only approved, safe content.',
  primaryRole: 'parent',
  supportingRoles: ['player', 'director'],
  primaryRoutes: ['/parent', '/player/ask-donna', '/director/players/[playerId]'],
  requiredInputs: ['A guardian→player (or player→profile) link', 'Approved, parent-safe content'],
  completionCriteria: [
    'Parent update created as a draft → review (never auto-sent)',
    'Parent/player portals show only approved, parent/player-safe content',
  ],
  missingStateChecks: [
    { id: 'pending_parent_updates', liveSignal: 'pendingParentApprovals', unmetMessage: 'There are parent update drafts awaiting director review before they can be seen by families.' },
    { id: 'unlinked_parent_player', liveSignal: null, unmetMessage: 'This parent or player account is not linked to a player record yet — link it before portal data appears.' },
  ],
  safeNextActions: [
    'Explain that a parent update is a draft → review, never auto-sent',
    'Describe what a parent safely sees in the portal',
    'For a player, answer only with player-safe development guidance',
  ],
  approvalRequirements: {
    requiresApproval: true,
    approvalTier: 'director_approval',
    framing: "All changes to a child's program require director approval.",
    mutationPath: 'proposed_actions (parent_communication) → director review → dispatch',
  },
  parentPlayerVisibilityRules: {
    audience: ['parent', 'player', 'director'],
    parentPlayerSafe: true,
    blockedForParentPlayer: [
      'raw_coach_session_notes',
      'internal_assessment_scores',
      'coach_observations_verbatim',
      'other_player_data',
      'internal_director_decisions',
      'financial_information',
      'parent_guardian_communications',
    ],
    note: 'The safety line: parents/players see only approved, parent/player-safe, sourced content. Never raw notes, scores, internal decisions, or other players’ data.',
  },
  commonQuestions: [
    'How do I send a parent an update?',
    'Does the family see this immediately?',
    'What can a parent see?',
    'What can a player see?',
  ],
  donnaExplanations: {
    how_to_send: 'From the player profile, tap Initiate Parent Update — it creates a draft for you to review, not an immediate send.',
    immediate: 'No — the update is a draft that goes to review; it is never auto-sent to the family.',
    parent_sees: 'A parent sees only their own child’s approved, parent-safe development view — no internal notes or scores.',
    player_sees: 'A player sees only their own development guidance, missions, and progress — never other players’ data.',
  },
  donnaDoNotSay: [
    'Do not send or imply sending a parent update without director approval.',
    'Do not surface coach notes, internal scores, observations, or other players’ data to a parent or player.',
    'Do not present unapproved content as something the family already sees.',
  ],
  failureStates: [
    'Parent/player account unlinked → portal shows a safe empty state.',
    'Update not yet approved → not visible to the family.',
  ],
  browserTestCriteria: [
    'As director, Initiate Parent Update → confirm it creates a draft, not a send.',
    'As parent, open /parent → confirm only parent-safe data appears.',
    'As player, open /player/ask-donna → confirm only player-safe content.',
  ],
}

// ── Registry ─────────────────────────────────────────────────────────────────────

export const LOOP_KNOWLEDGE: Record<LoopId, LoopKnowledge> = {
  1: LOOP_1_ACADEMY_SETUP,
  2: LOOP_2_CURRICULUM_SETUP,
  3: LOOP_3_CLASS_TEMPLATE_SETUP,
  4: LOOP_4_SESSION_CREATION,
  5: LOOP_5_COACH_ASSIGNMENT,
  6: LOOP_6_COACH_SESSION_EXECUTION,
  7: LOOP_7_COACH_WRAP_UP,
  8: LOOP_8_PLAYER_DEVELOPMENT_EVIDENCE,
  9: LOOP_9_DIRECTOR_REVIEW_APPROVAL,
  10: LOOP_10_PARENT_PLAYER_SAFE_CLARITY,
}

/** All loop knowledge objects in canonical order. */
export const ALL_LOOP_KNOWLEDGE: LoopKnowledge[] = Object.values(LOOP_KNOWLEDGE)
