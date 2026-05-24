// Sprint 754 — DONNA Site-Wide UI Guided Operators V1
// Step-by-step guided operator definitions for each major AcademyOS page domain.
// DONNA uses these to guide directors and coaches through each workflow systematically.
//
// Pure TypeScript — no DB calls, no AI calls, no mutations, no side effects.
//
// Each operator defines:
//   - The pages it operates on
//   - An ordered sequence of steps (each step = one DONNA guidance turn)
//   - What DONNA says at each step
//   - What UI action is available at each step
//   - What requires approval
//   - How to handle the "no data" state
//   - What is out of scope (DONNA must not do)
//
// Operators are consumed by:
//   - donnaUIActionDispatcher.ts (Sprint 755) — structured dispatch
//   - donnaPageContextEngine.ts — page-level capability summaries
//   - DONNA_SITE_WIDE_UI_OPERATOR_CERTIFICATION.md (Sprint 756)

import type { UIActionRole } from './donnaUIActionRegistry'

// ── Types ─────────────────────────────────────────────────────────────────────

export type OperatorStepActionType =
  | 'explain'           // DONNA explains — no UI change
  | 'navigate'          // DONNA offers to navigate
  | 'open_builder'      // DONNA offers to open a builder/wizard
  | 'filter_apply'      // DONNA offers to apply a filter
  | 'draft_submit'      // DONNA offers to draft an item for review
  | 'approval_route'    // DONNA routes to review queue — director must approve
  | 'guided_question'   // DONNA asks one clarifying question
  | 'noop_wait'         // DONNA waits for director action — no automated step

export interface OperatorStep {
  stepNumber: number
  label: string
  donnaPrompt: string         // What DONNA says when entering this step
  actionType: OperatorStepActionType
  actionId: string | null     // ID from donnaUIActionRegistry (null for explain/wait)
  requiresApproval: boolean
  approvalNote: string | null
  completionSignal: string    // How DONNA knows this step is done (UX heuristic)
  nextStepHint: string        // What DONNA says to transition to next step
}

export interface GuidedOperator {
  id: string
  label: string
  domain: string
  primaryRoutes: string[]
  allowedRoles: UIActionRole[]
  estimatedTurns: number
  entryPhrases: string[]       // Natural language phrases that invoke this operator
  openingLine: string          // First thing DONNA says when the operator starts
  steps: OperatorStep[]
  outOfScope: string[]         // What DONNA explicitly does NOT do in this operator
  noDataFallback: string       // What DONNA says if required data is not available
  approvalRequired: boolean
  approvalNote: string | null
}

// ── Operator 1: Onboarding Guided Operator ────────────────────────────────────

export const ONBOARDING_OPERATOR: GuidedOperator = {
  id: 'onboarding_operator',
  label: 'Academy Setup Guided Operator',
  domain: 'onboarding',
  primaryRoutes: ['/director/onboarding', '/director/onboarding/interview', '/director/onboarding/curriculum'],
  allowedRoles: ['academy_director'],
  estimatedTurns: 7,
  entryPhrases: [
    'help me set up the academy',
    'walk me through onboarding',
    'what do i do to get started',
    'guide me through setup',
    'how do i start',
    'academy setup',
    'how does onboarding work',
  ],
  openingLine: "Let's get your academy configured. There are 3 stages: choosing a setup mode, completing the Academy Interview, and configuring your curriculum structure. I'll guide you through each one. Which would you like to start with, or should I walk you through them in order?",
  steps: [
    {
      stepNumber: 1,
      label: 'Choose setup mode',
      donnaPrompt: "First, choose your setup mode. You have three options: Fast Start (quickest — fewer questions, you can fill in details later), Guided Setup (recommended — answers 7 key questions that shape your entire platform), and Full Setup (most control — configure every detail upfront). Which fits your current situation?",
      actionType: 'explain',
      actionId: 'explain_onboarding_step',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director selects a setup mode in the UI.',
      nextStepHint: "Great. Next is the Academy Interview — 7 questions about your philosophy and vision.",
    },
    {
      stepNumber: 2,
      label: 'Complete the Academy Interview',
      donnaPrompt: "The Academy Interview asks 7 questions about your philosophy, your players, competition approach, and your 90-day vision. I can explain any question as you go — just ask 'what does this mean?' for any question. Use the on-screen form to answer each one. I cannot answer them for you.",
      actionType: 'navigate',
      actionId: 'navigate_to_page',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director submits interview answers.',
      nextStepHint: "Interview complete. Let's move to curriculum structure.",
    },
    {
      stepNumber: 3,
      label: 'Configure curriculum structure',
      donnaPrompt: "Now choose your curriculum structure — the development levels your players progress through. Most academies start with 5–7 levels based on ball color (Red 1, Red 2, Orange 1, Orange 2, Green, Yellow). I can explain what each level means and what the common structures look like. How many levels does your academy currently have?",
      actionType: 'explain',
      actionId: 'explain_onboarding_step',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director selects curriculum structure in the UI.',
      nextStepHint: "Curriculum structure saved. Next: add your players.",
    },
    {
      stepNumber: 4,
      label: 'Place initial players',
      donnaPrompt: "Once curriculum is set, you can start placing players. Go to Players → Placement to assess each player against your levels. I can navigate you there now, or you can do this after finishing setup. Placement is required before any player appears as active.",
      actionType: 'navigate',
      actionId: 'open_placement_wizard',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director navigates to placement or explicitly skips.',
      nextStepHint: "When players are placed and ready, return here to activate the academy.",
    },
    {
      stepNumber: 5,
      label: 'Review and activate',
      donnaPrompt: "When you're ready, review your setup in the Academy Setup page and confirm everything looks right. Activating the academy makes the platform live for coaches and parents. This requires your explicit confirmation — I can navigate you to the setup review page now.",
      actionType: 'approval_route',
      actionId: 'finalize_assessment',
      requiresApproval: true,
      approvalNote: 'Academy activation requires director confirmation on the setup review page.',
      completionSignal: 'Director confirms activation.',
      nextStepHint: "Academy is live. Your coaches and parents can now be invited.",
    },
  ],
  outOfScope: [
    'DONNA cannot submit interview answers on behalf of the director',
    'DONNA cannot auto-select a setup mode',
    'DONNA cannot activate the academy without director confirmation',
    'DONNA cannot invite coaches or parents directly (requires director approval)',
  ],
  noDataFallback: "You're on the setup page. I can walk you through the three stages: choosing a setup mode, completing the Academy Interview, and configuring your curriculum. Which stage are you on?",
  approvalRequired: true,
  approvalNote: 'Academy activation and curriculum confirmation require director sign-off.',
}

// ── Operator 2: Curriculum Guided Operator ────────────────────────────────────

export const CURRICULUM_OPERATOR: GuidedOperator = {
  id: 'curriculum_operator',
  label: 'Curriculum Guided Operator',
  domain: 'curriculum',
  primaryRoutes: ['/director/curriculum', '/director/curriculum/builder'],
  allowedRoles: ['academy_director'],
  estimatedTurns: 6,
  entryPhrases: [
    'help me with curriculum',
    'walk me through curriculum',
    'explain my curriculum',
    'curriculum gaps',
    'build curriculum',
    'guide me through curriculum builder',
    'what is missing in my curriculum',
    'curriculum setup',
  ],
  openingLine: "I can help you review your curriculum structure, identify gaps, and propose changes. I'll start by explaining what you have, then surface any gaps, then help you add or modify content. Shall I start with an overview of your current levels?",
  steps: [
    {
      stepNumber: 1,
      label: 'Review current curriculum structure',
      donnaPrompt: "Let me explain your current curriculum structure. Your levels define the development path every player moves through. Each level has gates — the skills or requirements a player must demonstrate to advance. I can identify which levels have gaps (missing gates, no exercises assigned, or no players currently in them).",
      actionType: 'explain',
      actionId: 'start_guided_curriculum',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director acknowledges structure overview.',
      nextStepHint: "Now let's look at gaps — levels or gates that are incomplete.",
    },
    {
      stepNumber: 2,
      label: 'Identify curriculum gaps',
      donnaPrompt: "Based on your current curriculum, I can identify: (1) levels with no gates defined, (2) levels with no exercises or drills assigned, (3) levels with no players currently enrolled, and (4) levels where advancement criteria are unclear. Would you like me to surface these gaps now?",
      actionType: 'explain',
      actionId: 'start_guided_curriculum',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director reviews gap summary.',
      nextStepHint: "Ready to make changes? Open the builder to add or modify content.",
    },
    {
      stepNumber: 3,
      label: 'Open the curriculum builder',
      donnaPrompt: "To add or modify curriculum — new levels, gates, exercises, or structure changes — use the Curriculum Builder. I can open it now. Any changes you make there go through a draft → review process before becoming official.",
      actionType: 'open_builder',
      actionId: 'open_curriculum_builder',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director opens the curriculum builder.',
      nextStepHint: "In the builder, you can add gates and exercises. I can explain any step as you go.",
    },
    {
      stepNumber: 4,
      label: 'Draft curriculum changes',
      donnaPrompt: "Tell me what you want to add or change and I'll draft it for review. For example: 'Add a backhand consistency gate to Orange 2' or 'Create a new drill for Red 1 footwork'. I'll prepare the proposal — you review and approve it before it becomes official.",
      actionType: 'draft_submit',
      actionId: 'draft_curriculum_item',
      requiresApproval: true,
      approvalNote: 'All curriculum changes go through proposed_actions → director review before taking effect.',
      completionSignal: 'Director reviews and approves the draft in the review queue.',
      nextStepHint: "Draft submitted to your review queue. Approve it there to make it official.",
    },
    {
      stepNumber: 5,
      label: 'Review and publish',
      donnaPrompt: "Your proposed curriculum changes are in the review queue. Go to the Review Center to approve each one. Publishing curriculum changes affects all players in the affected levels — make sure everything looks right before approving.",
      actionType: 'approval_route',
      actionId: 'publish_curriculum',
      requiresApproval: true,
      approvalNote: 'Publishing curriculum requires explicit director approval in the review queue.',
      completionSignal: 'Director approves in the review queue.',
      nextStepHint: "Curriculum updated. Player assignments will reflect the new structure.",
    },
  ],
  outOfScope: [
    'DONNA cannot publish curriculum directly — director must approve in the review queue',
    'DONNA cannot move players between levels as part of a curriculum change',
    'DONNA cannot modify the official curriculum without a proposed_actions draft',
    'DONNA cannot delete curriculum levels (this is a platform-level action)',
  ],
  noDataFallback: "You're on the curriculum page. I can help you review your structure, identify gaps, draft new content, or open the builder. What would you like to do?",
  approvalRequired: true,
  approvalNote: 'All curriculum modifications require director approval via the review queue.',
}

// ── Operator 3: Template Guided Operator ──────────────────────────────────────

export const TEMPLATE_OPERATOR: GuidedOperator = {
  id: 'template_operator',
  label: 'Session Template Guided Operator',
  domain: 'templates',
  primaryRoutes: ['/director/class-templates', '/director/class-templates/[templateId]', '/director/fitness/templates'],
  allowedRoles: ['academy_director'],
  estimatedTurns: 5,
  entryPhrases: [
    'help me with templates',
    'create a template',
    'build a session template',
    'open template builder',
    'walk me through templates',
    'draft a template',
    'new session template',
    'new fitness template',
  ],
  openingLine: "I can help you build a session template. Templates define the structure for a class — warmup, main drill blocks, and cool-down — so coaches have a repeatable plan. Do you want to start a class template or a fitness template?",
  steps: [
    {
      stepNumber: 1,
      label: 'Choose template type',
      donnaPrompt: "There are two types: Class Templates (for structured tennis training sessions — warmup, technical drills, game play, cool-down) and Fitness Templates (conditioning circuits, fitness assessment blocks). Which type do you need?",
      actionType: 'guided_question',
      actionId: null,
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director specifies class or fitness.',
      nextStepHint: "Got it. Let me help you fill in the template details.",
    },
    {
      stepNumber: 2,
      label: 'Define template basics',
      donnaPrompt: "Tell me: (1) What is this template for — what age group or level? (2) How long is the session (typically 60 or 90 minutes)? (3) What is the main theme — technical, tactical, fitness, or match-play? I'll use this to draft the template structure.",
      actionType: 'guided_question',
      actionId: null,
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director provides session length, level, and theme.',
      nextStepHint: "I'll draft the template blocks based on your answers.",
    },
    {
      stepNumber: 3,
      label: 'Draft the template',
      donnaPrompt: "Based on what you've told me, I'll draft a template with warmup, drill blocks, and cool-down. The draft goes to your review queue — you can edit any block before saving it as an official template.",
      actionType: 'draft_submit',
      actionId: 'draft_class_template',
      requiresApproval: true,
      approvalNote: 'Template drafts go to proposed_actions → director review before becoming official.',
      completionSignal: 'Draft submitted and in review queue.',
      nextStepHint: "Draft is ready. Go to the Review Center to approve it.",
    },
    {
      stepNumber: 4,
      label: 'Open the template builder (alternative)',
      donnaPrompt: "If you prefer to build the template directly, I can open the Template Builder now. There you can add drill blocks, set durations, and save the template step by step.",
      actionType: 'open_builder',
      actionId: 'open_template_builder',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director opens template builder.',
      nextStepHint: "Template builder is open. Add your blocks and save when done.",
    },
    {
      stepNumber: 5,
      label: 'Review and save',
      donnaPrompt: "Your template draft is in the review queue. Review each block — name, duration, and instructions — before approving. Once approved, coaches can use this template when scheduling sessions.",
      actionType: 'approval_route',
      actionId: 'approve_review_item',
      requiresApproval: true,
      approvalNote: 'Template becomes official only after director approves in review queue.',
      completionSignal: 'Director approves the template in the review queue.',
      nextStepHint: "Template saved. Coaches can now select it when scheduling.",
    },
  ],
  outOfScope: [
    'DONNA cannot save a template without director review',
    'DONNA cannot assign a template to a session directly',
    'DONNA cannot schedule sessions as part of template creation',
  ],
  noDataFallback: "You're on the templates page. I can help you create a class template or fitness template. Would you like to build one from scratch, or should I draft one based on your description?",
  approvalRequired: true,
  approvalNote: 'All templates require director approval before they are available to coaches.',
}

// ── Operator 4: Session Guided Operator ───────────────────────────────────────

export const SESSION_OPERATOR: GuidedOperator = {
  id: 'session_operator',
  label: 'Session Guided Operator',
  domain: 'sessions',
  primaryRoutes: ['/director/sessions', '/director/sessions/[sessionId]', '/coach/sessions', '/coach/sessions/[sessionId]', '/coach/recap'],
  allowedRoles: ['academy_director', 'head_coach', 'coach'],
  estimatedTurns: 5,
  entryPhrases: [
    'help me with sessions',
    'walk me through sessions',
    'start a session',
    'plan a session',
    'session wrap-up',
    'i need to wrap up',
    'start wrap-up',
    'review session',
    'draft session plan',
    'what sessions are pending',
  ],
  openingLine: "I can help you with sessions — planning upcoming sessions, reviewing what\'s scheduled today, or completing a session wrap-up. What do you need?",
  steps: [
    {
      stepNumber: 1,
      label: 'Choose session action',
      donnaPrompt: "What would you like to do? (1) Plan a new session — draft a session with a template, group, and time; (2) Review today's sessions — see what's scheduled and which need attention; (3) Complete a wrap-up — submit session notes and attendance after a class ends.",
      actionType: 'guided_question',
      actionId: null,
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director or coach chooses an action.',
      nextStepHint: "Let's get that done.",
    },
    {
      stepNumber: 2,
      label: 'Plan a session (draft path)',
      donnaPrompt: "To plan a session: tell me the group (e.g. Orange 2), the date and time, the coach, and the template you want to use. I'll draft the session plan — it goes to the review queue before it's scheduled.",
      actionType: 'draft_submit',
      actionId: 'draft_session_plan',
      requiresApproval: true,
      approvalNote: 'Session plans go to proposed_actions → director review before the session is officially scheduled.',
      completionSignal: 'Draft submitted to review queue.',
      nextStepHint: "Session plan drafted. Review it in the queue to make it official.",
    },
    {
      stepNumber: 3,
      label: "Review today's sessions",
      donnaPrompt: "Let me pull up today's sessions. I can show you which sessions are scheduled, which coaches are leading each one, whether attendance has been submitted, and which wrap-ups are still pending. Want me to filter to today's sessions?",
      actionType: 'filter_apply',
      actionId: 'filter_sessions',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: "Filter applied — sessions list shows today.",
      nextStepHint: "Here are today's sessions. Any you want to review in detail?",
    },
    {
      stepNumber: 4,
      label: 'Complete session wrap-up',
      donnaPrompt: "To wrap up a session: confirm attendance, add any coaching notes or observations, and submit the recap. I can open the wrap-up flow now. Any observations you add go to the director's review queue — they don't become official until approved.",
      actionType: 'navigate',
      actionId: 'open_session_wrap_up',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Wrap-up flow opens.',
      nextStepHint: "Wrap-up open. Record attendance and observations, then submit.",
    },
    {
      stepNumber: 5,
      label: 'Note attendance exception',
      donnaPrompt: "If a player was absent or had an exception, I can draft an attendance exception now. Tell me the player and the reason, and I'll submit it to the review queue for director sign-off.",
      actionType: 'draft_submit',
      actionId: 'draft_attendance_exception',
      requiresApproval: true,
      approvalNote: 'Attendance exceptions go to proposed_actions → director review before official record is updated.',
      completionSignal: 'Exception draft submitted.',
      nextStepHint: "Attendance exception drafted. Director can approve it in the review queue.",
    },
  ],
  outOfScope: [
    'DONNA cannot submit official session results directly — coach must use the wrap-up flow',
    'DONNA cannot mark a session as complete without director review',
    'DONNA cannot move players between groups during session planning',
  ],
  noDataFallback: "You're on the sessions page. I can help you plan a new session, review what's scheduled, complete a wrap-up, or note an attendance exception. What do you need?",
  approvalRequired: true,
  approvalNote: 'Session plans and attendance exceptions require director approval via the review queue.',
}

// ── Operator 5: Player Profile Guided Operator ────────────────────────────────

export const PLAYER_OPERATOR: GuidedOperator = {
  id: 'player_operator',
  label: 'Player Profile Guided Operator',
  domain: 'players',
  primaryRoutes: ['/director/players', '/director/players/[playerId]', '/director/placement', '/director/level-up'],
  allowedRoles: ['academy_director'],
  estimatedTurns: 6,
  entryPhrases: [
    'walk me through this player',
    'explain this player',
    'what should i do for this player',
    'guide me through the profile',
    'player status',
    'help me with players',
    'who needs attention',
    'player advancement',
    'advance a player',
    'place a player',
    'player gaps',
  ],
  openingLine: "I can help you understand a player's current status, identify what's needed next, draft a coaching note, or propose a level change. What player and what task do you have in mind?",
  steps: [
    {
      stepNumber: 1,
      label: 'Identify the player and task',
      donnaPrompt: "Which player would you like to look at, and what do you need? Options: (1) Review development status and what's next; (2) Draft a coaching note or observation; (3) Propose a level change or advancement; (4) Check placement status for a new player; (5) Identify players who need attention across the roster.",
      actionType: 'guided_question',
      actionId: null,
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director specifies the player and task.',
      nextStepHint: "Got it. Let me pull up the relevant information.",
    },
    {
      stepNumber: 2,
      label: 'Review player development status',
      donnaPrompt: "For this player, I can summarize: their current curriculum level, recent session attendance and performance signals, outstanding coaching notes, their advancement readiness, and any flags from the attention signals system. Would you like a development summary now?",
      actionType: 'explain',
      actionId: 'start_guided_player_profile',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director reviews the summary.',
      nextStepHint: "Summary provided. Do you want to take action, or is this for information only?",
    },
    {
      stepNumber: 3,
      label: 'Draft a coaching note',
      donnaPrompt: "Tell me what you observed or want to note about this player — technical, tactical, behavioral, or attendance. I'll draft the note for review. Coaching notes go through the director review queue before becoming part of the official record.",
      actionType: 'draft_submit',
      actionId: 'draft_coach_note',
      requiresApproval: true,
      approvalNote: 'Coaching notes go to proposed_actions → director review before official record update.',
      completionSignal: 'Draft submitted to review queue.',
      nextStepHint: "Note drafted. Review it in the queue to make it official.",
    },
    {
      stepNumber: 4,
      label: 'Propose level change or advancement',
      donnaPrompt: "If this player is ready for the next level, I can submit an advancement proposal. This creates a draft in your review queue — you review the player's gate completion, approve or reject, and the level change only takes effect after your explicit approval.",
      actionType: 'draft_submit',
      actionId: 'draft_player_advancement',
      requiresApproval: true,
      approvalNote: 'Level changes require director approval. finalize_player_placement() is the only path — called only after director approves in the review queue.',
      completionSignal: 'Advancement proposal submitted to review queue.',
      nextStepHint: "Proposal in queue. Review gate completion before approving.",
    },
    {
      stepNumber: 5,
      label: 'Place a new player',
      donnaPrompt: "For a new player who hasn't been assessed yet, go to the Placement Wizard. I can navigate you there. Placement involves assessing the player against your curriculum levels and assigning them. The placement result requires director confirmation before the player is active.",
      actionType: 'navigate',
      actionId: 'open_placement_wizard',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director navigates to placement wizard.',
      nextStepHint: "Placement wizard open. Assess the player and confirm their level.",
    },
    {
      stepNumber: 6,
      label: 'Draft a parent update',
      donnaPrompt: "If you want to communicate this player's progress to their parent, I can draft a progress update. The draft is never sent automatically — you review it and send it yourself when ready.",
      actionType: 'draft_submit',
      actionId: 'draft_parent_summary',
      requiresApproval: true,
      approvalNote: 'Parent communications require director review. DONNA never sends messages directly.',
      completionSignal: 'Parent update draft in review queue.',
      nextStepHint: "Draft ready for your review. Approve and send when you're satisfied.",
    },
  ],
  outOfScope: [
    'DONNA cannot move a player to a new level without director approval',
    'DONNA cannot expose raw coach notes to parents or players',
    'DONNA cannot access player data from other academies',
    'DONNA cannot auto-send parent communications',
    'DONNA cannot delete or archive player records',
  ],
  noDataFallback: "You're on the players page. I can help you find a player, review their development status, draft a coaching note, propose advancement, or place a new player. What do you need?",
  approvalRequired: true,
  approvalNote: 'Level changes, coaching notes, and parent communications all require director approval.',
}

// ── Operator 6: Review Center Guided Operator ─────────────────────────────────

export const REVIEW_CENTER_OPERATOR: GuidedOperator = {
  id: 'review_center_operator',
  label: 'Review Center Guided Operator',
  domain: 'review_queue',
  primaryRoutes: ['/director/review'],
  allowedRoles: ['academy_director'],
  estimatedTurns: 5,
  entryPhrases: [
    'help me review the queue',
    'walk me through pending approvals',
    'what needs my review',
    'guide me through review',
    'review center',
    'what is pending',
    'what needs approval',
    'pending items',
    'approve items',
  ],
  openingLine: "Your review center is where all proposed changes wait for your sign-off. Nothing official changes until you approve it here. I can walk you through what's pending, explain any item, and navigate to details — but approval itself is your click.",
  steps: [
    {
      stepNumber: 1,
      label: 'Understand what\'s pending',
      donnaPrompt: "Let me summarize what's in your review queue. Items can include: attendance exceptions, coaching notes, session plans, template drafts, player advancement proposals, parent communication drafts, and curriculum changes. Each was proposed by DONNA or a coach. Want me to walk through them by category?",
      actionType: 'explain',
      actionId: 'start_guided_review',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director understands queue composition.',
      nextStepHint: "Let's look at the highest-priority items first.",
    },
    {
      stepNumber: 2,
      label: 'Prioritize by urgency',
      donnaPrompt: "I recommend reviewing in this order: (1) Attendance exceptions — time-sensitive, affect session records; (2) Player advancement proposals — coaches may be waiting; (3) Session plan approvals — needed before coaches can execute; (4) Parent communication drafts — time-sensitive for trust; (5) Curriculum changes — less urgent, review carefully. Want me to filter the queue to show the highest-priority type first?",
      actionType: 'filter_apply',
      actionId: 'filter_review_queue',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Filter applied to review queue.',
      nextStepHint: "Filtered. Let's look at each item.",
    },
    {
      stepNumber: 3,
      label: 'Explain a specific review item',
      donnaPrompt: "For any item in the queue, I can explain: what was proposed, why it was flagged, what the impact of approving is, and what happens if you reject it. Just tell me which item you want explained, or open it and I'll read the context.",
      actionType: 'explain',
      actionId: 'explain_onboarding_step',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director understands the item.',
      nextStepHint: "Ready to act? Approve or reject in the review queue UI.",
    },
    {
      stepNumber: 4,
      label: 'Navigate to the detail page',
      donnaPrompt: "Want to see the full context before deciding? I can open the detail page for the current item — the player profile, the session record, or the template — so you have everything in front of you.",
      actionType: 'navigate',
      actionId: 'navigate_to_page',
      requiresApproval: false,
      approvalNote: null,
      completionSignal: 'Director views the detail page.',
      nextStepHint: "Detail page open. Come back to the review queue to approve or reject.",
    },
    {
      stepNumber: 5,
      label: 'Approve or reject (director only)',
      donnaPrompt: "Approval is your click in the review queue — DONNA cannot approve on your behalf. When you click Approve, execute_approved_action() runs the change officially. When you click Reject, the proposal is discarded and nothing changes. I'll be here to explain any item you're uncertain about.",
      actionType: 'approval_route',
      actionId: 'approve_review_item',
      requiresApproval: true,
      approvalNote: 'execute_approved_action() is called only when the director explicitly clicks Approve. DONNA never triggers this function.',
      completionSignal: 'Director approves or rejects the item.',
      nextStepHint: "Item processed. Move to the next one, or I can summarize what's left.",
    },
  ],
  outOfScope: [
    'DONNA cannot approve review items — director must click Approve in the UI',
    'DONNA cannot reject items on behalf of the director',
    'DONNA cannot bulk-approve multiple items automatically',
    'DONNA cannot modify a proposed action after it has been submitted',
    'DONNA cannot see the content of rejected items after rejection',
  ],
  noDataFallback: "You're at the review center. I can explain what's pending, help prioritize, navigate to details, or explain any specific item. Approval itself is always your click.",
  approvalRequired: true,
  approvalNote: 'All approvals are director-only. DONNA navigates, explains, and routes — never executes approval.',
}

// ── Operator registry ─────────────────────────────────────────────────────────

export const DONNA_GUIDED_OPERATORS: GuidedOperator[] = [
  ONBOARDING_OPERATOR,
  CURRICULUM_OPERATOR,
  TEMPLATE_OPERATOR,
  SESSION_OPERATOR,
  PLAYER_OPERATOR,
  REVIEW_CENTER_OPERATOR,
]

// ── Lookup utilities ──────────────────────────────────────────────────────────

export function getOperatorById(id: string): GuidedOperator | undefined {
  return DONNA_GUIDED_OPERATORS.find(op => op.id === id)
}

export function getOperatorForRoute(route: string): GuidedOperator | undefined {
  return DONNA_GUIDED_OPERATORS.find(op =>
    op.primaryRoutes.some(r => {
      const pattern = r.replace(/\[.*?\]/g, '[^/]+')
      return new RegExp(`^${pattern}(/.*)?$`).test(route)
    })
  )
}

export function getOperatorForPhrase(phrase: string): GuidedOperator | undefined {
  const normalized = phrase.toLowerCase().trim()
  return DONNA_GUIDED_OPERATORS.find(op =>
    op.entryPhrases.some(p => normalized.includes(p) || p.includes(normalized))
  )
}

export function getOperatorsForRole(role: UIActionRole): GuidedOperator[] {
  return DONNA_GUIDED_OPERATORS.filter(op => op.allowedRoles.includes(role))
}

export function getOperatorStep(
  operatorId: string,
  stepNumber: number,
): OperatorStep | undefined {
  return getOperatorById(operatorId)?.steps.find(s => s.stepNumber === stepNumber)
}
