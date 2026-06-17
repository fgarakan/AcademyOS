// Sprint 1811–1820 — DONNA Guided Completion Engine V1
// Workflow registry: defines the 6 guided completion workflows DONNA can run.
//
// Guided completion = DONNA asks one question at a time, collects answers,
// and builds a draft toward a known end goal. No mutations without approval.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same trigger → same workflow.
//   - Every approval-gated action is named explicitly.
//   - Safe actions are read-only or draft-creation only.

// ── Workflow IDs ──────────────────────────────────────────────────────────────

export type GuidedWorkflowId =
  | 'curriculum_builder_completion'
  | 'academy_setup_completion'
  | 'player_onboarding_completion'
  | 'assessment_completion'
  | 'parent_update_completion'
  | 'template_builder_completion'
  | 'coach_creation_completion'
  | 'fitness_template_builder_completion'

// ── Step ─────────────────────────────────────────────────────────────────────

export interface GuidedCompletionStep {
  /** Unique within the workflow */
  stepId: string
  /** 1-based display order */
  order: number
  /** What DONNA asks the director */
  question: string
  /** Key used to store the answer */
  fieldId: string
  /** Optional hint shown below the question */
  hint: string | null
  required: boolean
}

// ── Workflow ──────────────────────────────────────────────────────────────────

export interface GuidedCompletionWorkflow {
  id: GuidedWorkflowId
  label: string
  /** One sentence: what does completing this workflow achieve? */
  endGoal: string
  /** Phrases that trigger this workflow (lowercase, partial match) */
  triggerPhrases: string[]
  /** Director routes where this workflow applies */
  pageRoutes: string[]
  requiredSteps: GuidedCompletionStep[]
  optionalSteps: GuidedCompletionStep[]
  /** Sentence describing what "done" looks like */
  completionCriteria: string
  /** Read-only or draft-creation actions DONNA may take without approval */
  safeActions: string[]
  /** Actions that require explicit director confirmation before executing */
  approvalGatedActions: string[]
  /** DONNA's opening message when this workflow starts */
  openingMessage: string
}

// ── Registry ──────────────────────────────────────────────────────────────────

const WORKFLOWS: GuidedCompletionWorkflow[] = [

  // ── 1. Curriculum Builder ──────────────────────────────────────────────────
  //
  // Supports 6 object types: Skill, Subskill, Drill, Tactical Concept,
  // Mental Concept, Progression.
  //
  // Type → DB content_type mapping (migration 061 taxonomy):
  //   Skill            → 'skill'        domain: Technical
  //   Subskill         → 'skill'        domain: Technical  (V1 limitation: no DB hierarchy yet;
  //                                     skillHierarchyModel.ts defines Skill→SubSkill but
  //                                     backing tables not created — Sprint 511)
  //   Drill            → 'drill'
  //   Tactical Concept → 'tactical'     domain: Tactical
  //   Mental Concept   → 'mental_skill' domain: Mentality   (distinct — do NOT collapse into tactical)
  //   Progression      → 'progression'                      (distinct — do NOT collapse into drill)
  {
    id: 'curriculum_builder_completion',
    label: 'Curriculum Item Builder',
    endGoal: 'Create a curriculum item draft (skill, subskill, drill, tactical concept, mental concept, or progression) for a specific level — ready for director review.',
    triggerPhrases: [
      'add a skill',
      'add a drill',
      'add a tactical concept',
      'add a mental concept',
      'add a progression',
      'add a subskill',
      'create a curriculum item',
      'add curriculum item',
      'build a curriculum item',
      'draft a skill',
      'draft a drill',
      'new curriculum item',
      'curriculum item',
      'walk me through curriculum builder',
      'walk me through the curriculum builder',
      'help me build curriculum',
      'build curriculum',
      'curriculum builder',
    ],
    pageRoutes: [
      '/director/curriculum',
      '/director/curriculum/builder',
    ],
    requiredSteps: [
      {
        stepId: 'object_type',
        order: 1,
        question: 'What type of curriculum item are you creating? Choose: Skill, Subskill, Drill, Tactical Concept, Mental Concept, or Progression.',
        fieldId: 'object_type',
        hint: 'Skill = technical ability · Subskill = component of a skill · Drill = practice activity · Tactical Concept = game strategy · Mental Concept = mindset/routine · Progression = harder/easier variation.',
        required: true,
      },
      {
        stepId: 'item_name',
        order: 2,
        question: 'What is the name of this item?',
        fieldId: 'item_name',
        hint: 'Keep it concise and specific. Example: "Cross-court forehand rally", "Reset mindset cue", "Approach shot progression".',
        required: true,
      },
      {
        stepId: 'curriculum_level',
        order: 3,
        question: 'Which curriculum level does this item belong to?',
        fieldId: 'curriculum_level',
        hint: 'Use the level name from your curriculum structure. Example: Orange Ball 2, Green Ball 1, Yellow Ball 3.',
        required: true,
      },
      {
        stepId: 'item_description',
        order: 4,
        question: 'Describe this item in 2–3 sentences.',
        fieldId: 'item_description',
        hint: 'What is it, and why does it matter at this level? Be specific enough for a coach to understand the intent.',
        required: true,
      },
      {
        stepId: 'coaching_cues',
        order: 5,
        question: 'What are 2–3 key coaching cues for this item?',
        fieldId: 'coaching_cues',
        hint: 'Short, actionable phrases a coach would say. Example: "Watch the ball longer", "Stay low through the contact", "Reset before the next point".',
        required: true,
      },
      {
        stepId: 'common_mistakes',
        order: 6,
        question: 'What common mistakes or errors should coaches watch for?',
        fieldId: 'common_mistakes',
        hint: 'Observable failure patterns. Example: "Early racquet drop", "Looking at opponent instead of ball", "Rushing after a mistake".',
        required: true,
      },
    ],
    optionalSteps: [
      {
        stepId: 'progression_relationship',
        order: 7,
        question: 'Does this item connect to a harder or easier version? (optional)',
        fieldId: 'progression_relationship',
        hint: 'Example: "Easier: rally to target" / "Harder: rally crosscourt under directional pressure". Leave blank if standalone.',
        required: false,
      },
    ],
    completionCriteria: 'All 6 required fields answered. Curriculum item draft is ready for director review.',
    safeActions: [
      'ask questions and collect answers',
      'build a draft in conversation memory',
      'suggest coaching cues based on object type',
      'show progress through the 6 steps',
    ],
    approvalGatedActions: [
      'save curriculum item draft to the review queue',
      'publish curriculum changes to coaches',
      'make the item visible to players or parents',
    ],
    openingMessage: "Let's create a curriculum item together. I'll ask you 6 questions — one at a time. Supported types: Skill, Subskill, Drill, Tactical Concept, Mental Concept, Progression.\n\nNothing saves until you review and approve the draft.\n\nStep 1 of 6:",
  },

  // ── 2. Academy Setup ───────────────────────────────────────────────────────
  //
  // 10-step guided setup: academy_name → timezone → program_types → levels →
  // groups → staff_plan → weekly_schedule → parent_communication_preferences →
  // curriculum_starting_point → setup_notes.
  //
  // Save path: donnaSaveAcademySetupDraftAction saves collected answers to
  // academies.settings.donna_setup_draft — never directly sets
  // director_interview_completed or any existing setup completion flag.
  //
  // Page state sync: donnaPageStateSync maps all 10 fields to setup/onboarding
  // page fields. Pages receive patches via donna:page-state-patch browser event.
  // ── 2. Academy Setup ───────────────────────────────────────────────────────
  //
  // Sprint 2961–2970 — Academy Setup Consolidation V1
  //
  // CANONICAL ROUTING (enforced in processDonnaMessage Step 0.25):
  //   Incomplete → "Let's continue Academy Onboarding." → /director/onboarding
  //   Complete   → "Academy setup is complete. You can edit details in Academy Settings." → /director/settings
  //
  // This workflow definition is kept for registry consumers (goal engine, clarification engine).
  // The 10-question DONNA draft interview (donna_setup_draft) is retired.
  // /director/setup is removed — it was a redirect-only shell to /director/onboarding.
  {
    id: 'academy_setup_completion',
    label: 'Academy Onboarding',
    endGoal: 'Route the director to Academy Onboarding (/director/onboarding) when setup is incomplete, or to Academy Settings (/director/settings) when setup is already complete.',
    // Routing authority retired.
    // Academy setup routing is owned exclusively by
    // processDonnaMessage Step 0.25.
    triggerPhrases: [],
    pageRoutes: [
      '/director/onboarding',
      '/director/onboarding/interview',
      '/director/onboarding/curriculum',
      '/director',
    ],
    requiredSteps: [
      {
        stepId: 'academy_name',
        order: 1,
        question: 'What is your academy\'s name?',
        fieldId: 'academy_name',
        hint: 'This appears in all parent and player communications.',
        required: true,
      },
      {
        stepId: 'academy_timezone',
        order: 2,
        question: 'What timezone does your academy operate in?',
        fieldId: 'academy_timezone',
        hint: 'Example: US/Eastern, US/Pacific, Europe/London. Used for scheduling and session timing.',
        required: true,
      },
      {
        stepId: 'program_types',
        order: 3,
        question: 'What types of training programs do you offer?',
        fieldId: 'program_types',
        hint: 'Examples: Junior Development, Adult, Competition Track, Private Lessons, Cardio Tennis.',
        required: true,
      },
      {
        stepId: 'levels',
        order: 4,
        question: 'What development levels or stages do you use to organize players?',
        fieldId: 'levels',
        hint: 'Examples: Red Ball 1–2, Orange Ball 1–2, Green Ball, Yellow Ball 1–3. Or your own naming.',
        required: true,
      },
      {
        stepId: 'groups',
        order: 5,
        question: 'How are your players organized into training groups or classes?',
        fieldId: 'groups',
        hint: 'Example: "3 groups per level, 6–8 players each" or "age bands: 6–9, 10–12, 13+".',
        required: true,
      },
      {
        stepId: 'staff_plan',
        order: 6,
        question: 'Tell me about your coaching staff — how many coaches and what roles do they have?',
        fieldId: 'staff_plan',
        hint: 'Example: "1 head coach, 2 assistants" or "3 coaches — I manage one group myself".',
        required: true,
      },
      {
        stepId: 'weekly_schedule',
        order: 7,
        question: 'What does a typical week of training look like?',
        fieldId: 'weekly_schedule',
        hint: 'Example: "Mon/Wed/Fri, 2 sessions per day, 60 min each" or "4 days, morning and afternoon groups".',
        required: true,
      },
      {
        stepId: 'parent_communication_preferences',
        order: 8,
        question: 'How do you prefer to communicate with parents — and how often?',
        fieldId: 'parent_communication_preferences',
        hint: 'Example: "Monthly progress updates, immediate contact for injuries" or "Weekly brief after group sessions".',
        required: true,
      },
      {
        stepId: 'curriculum_starting_point',
        order: 9,
        question: 'What curriculum framework or starting point do you use?',
        fieldId: 'curriculum_starting_point',
        hint: 'Example: ITF ball colours, USTA pathway, custom levels, or your own developed curriculum.',
        required: true,
      },
      {
        stepId: 'setup_notes',
        order: 10,
        question: 'Any other important priorities or context I should know about your academy for setup?',
        fieldId: 'setup_notes',
        hint: 'Optional but helpful. Example: "We\'re launching in 2 weeks" or "Compliance with local federation required".',
        required: true,
      },
    ],
    optionalSteps: [],
    completionCriteria: 'All 10 required answers collected. Setup draft ready for director to review and confirm before saving.',
    safeActions: [
      'route director to /director/onboarding when setup is incomplete',
      'route director to /director/settings when setup is already complete',
      'explain what each onboarding step does and why it matters',
    ],
    approvalGatedActions: [
      'activate coach accounts',
      'enable parent or player portal access',
      'publish any academy-level settings',
      'set director_interview_completed or any existing completion flag',
    ],
    openingMessage: "Let's continue Academy Onboarding. Taking you there now.",
  },

  // ── 3. Player Onboarding ───────────────────────────────────────────────────
  {
    id: 'player_onboarding_completion',
    label: 'Player Onboarding',
    endGoal: 'Collect the information needed to create a new player profile, place them at the right level, and link a parent — ready for director confirmation.',
    triggerPhrases: [
      'guide me through adding a player',
      'help me add a player',
      'onboard a new player',
      'add a new player',
      'guide me through player onboarding',
      'walk me through adding a player',
      'let\'s onboard a player',
      'player onboarding',
      'new player',
      'add player',
      'create a player',
      'register a player',
      'a new player',
    ],
    pageRoutes: [
      '/director/players',
      '/director/placement',
      '/director',
    ],
    requiredSteps: [
      {
        stepId: 'player_name',
        order: 1,
        question: 'What is the player\'s full name?',
        fieldId: 'player_name',
        hint: null,
        required: true,
      },
      {
        stepId: 'player_age',
        order: 2,
        question: 'How old is the player? (age or date of birth)',
        fieldId: 'player_age',
        hint: 'Used for appropriate level matching.',
        required: true,
      },
      {
        stepId: 'recommended_level',
        order: 3,
        question: 'Which curriculum level would you place this player at?',
        fieldId: 'recommended_level',
        hint: 'Example: Red Ball 1, Orange Ball 2. Based on your intake observation.',
        required: true,
      },
      {
        stepId: 'assigned_coach',
        order: 4,
        question: 'Which coach will work with this player?',
        fieldId: 'assigned_coach',
        hint: 'Enter the coach\'s name. You can reassign later.',
        required: true,
      },
      {
        stepId: 'assigned_group',
        order: 5,
        question: 'Which group or class should this player join?',
        fieldId: 'assigned_group',
        hint: 'Match to an existing session group. Enter the group name or session time.',
        required: true,
      },
      {
        stepId: 'parent_contact',
        order: 6,
        question: 'Is there a parent to link? If yes, what is their name and email?',
        fieldId: 'parent_contact',
        hint: 'Optional. You can link a parent later from the player profile.',
        required: true,
      },
    ],
    optionalSteps: [
      {
        stepId: 'intake_notes',
        order: 7,
        question: 'Any intake notes about this player\'s background or goals?',
        fieldId: 'intake_notes',
        hint: 'Internal only — not visible to parents or players.',
        required: false,
      },
    ],
    completionCriteria: 'All 6 required fields answered. Player profile draft ready for director confirmation before creation.',
    safeActions: [
      'collect player intake information',
      'suggest appropriate levels based on age and description',
      'build a placement draft for review',
    ],
    approvalGatedActions: [
      'create the player profile in the database',
      'activate the player (finalize_player_placement)',
      'link parent account',
      'assign player to a group or session',
    ],
    openingMessage: "Let's set up a new player together. I'll ask 6 questions — one at a time. The player profile won't be created until you confirm the draft.\n\nStep 1 of 6:",
  },

  // ── 4. Assessment ─────────────────────────────────────────────────────────
  {
    id: 'assessment_completion',
    label: 'Player Assessment',
    endGoal: 'Document a structured player assessment across the four development domains, ready for director review.',
    triggerPhrases: [
      'help me complete this assessment',
      'walk me through assessment',
      'guide me through player assessment',
      'complete an assessment',
      'help me assess a player',
      'let\'s do an assessment',
      'player assessment',
      'run an assessment',
      'fill in assessment',
    ],
    pageRoutes: [
      '/director/players',
      '/director/players/[playerId]',
      '/coach/players',
      '/coach/players/[playerId]',
    ],
    requiredSteps: [
      {
        stepId: 'player_name',
        order: 1,
        question: 'Which player is this assessment for?',
        fieldId: 'player_name',
        hint: 'Enter their name. I\'ll confirm their level and context.',
        required: true,
      },
      {
        stepId: 'assessment_domain',
        order: 2,
        question: 'Which domain are you assessing? (Skill / Fitness / Mental / Competition)',
        fieldId: 'assessment_domain',
        hint: 'You can run multiple domain assessments. Start with one.',
        required: true,
      },
      {
        stepId: 'observation',
        order: 3,
        question: 'What did you observe today? Describe the player\'s performance in 1–3 sentences.',
        fieldId: 'observation',
        hint: 'Be specific. Include context like drill name, conditions, or who they were playing with.',
        required: true,
      },
      {
        stepId: 'performance_rating',
        order: 4,
        question: 'How would you rate their performance today? (1 = far below level, 10 = exceptional)',
        fieldId: 'performance_rating',
        hint: 'This is your coaching judgement — not shown directly to parents or players.',
        required: true,
      },
      {
        stepId: 'recommendation',
        order: 5,
        question: 'What is your development recommendation based on this observation?',
        fieldId: 'recommendation',
        hint: 'Example: "Continue at Orange Ball 2. Focus on cross-court rally consistency."',
        required: true,
      },
      {
        stepId: 'parent_visibility',
        order: 6,
        question: 'Is any part of this assessment safe to share with the parent? (yes / not yet)',
        fieldId: 'parent_visibility',
        hint: 'If yes, the director will review and approve what gets shared before anything is sent.',
        required: true,
      },
    ],
    optionalSteps: [
      {
        stepId: 'level_movement_flag',
        order: 7,
        question: 'Based on this assessment, do you want to flag this player for level movement review?',
        fieldId: 'level_movement_flag',
        hint: 'Flagging creates a review item for the director — no automatic movement.',
        required: false,
      },
    ],
    completionCriteria: 'All 6 required fields answered. Assessment draft sent to director review queue.',
    safeActions: [
      'collect structured assessment observations',
      'build an assessment draft for director review',
      'explain what each domain means',
    ],
    approvalGatedActions: [
      'save assessment to the player record',
      'share any content with parent or player',
      'trigger level movement review',
      'publish assessment results',
    ],
    openingMessage: "Let's document this assessment together. I'll ask 6 questions — one at a time. Nothing saves until the director reviews the draft.\n\nStep 1 of 6:",
  },

  // ── 5. Parent Update ──────────────────────────────────────────────────────
  {
    id: 'parent_update_completion',
    label: 'Parent Update Draft',
    endGoal: 'Create a parent-safe progress update draft, queued for director approval before anything is sent.',
    triggerPhrases: [
      'create a parent update with me',
      'help me write a parent update',
      'draft a parent update',
      'write a parent message',
      'parent update',
      'let\'s write a parent update',
      'help me write to a parent',
      'compose a parent update',
      'guide me through parent update',
    ],
    pageRoutes: [
      '/director/players',
      '/director/players/[playerId]',
      '/director/review',
    ],
    requiredSteps: [
      {
        stepId: 'player_name',
        order: 1,
        question: 'Which player is this update for?',
        fieldId: 'player_name',
        hint: 'Enter the player\'s name.',
        required: true,
      },
      {
        stepId: 'main_message',
        order: 2,
        question: 'What is the main message for the parent? (1–2 sentences)',
        fieldId: 'main_message',
        hint: 'Keep it positive, specific, and parent-safe. No internal coaching jargon.',
        required: true,
      },
      {
        stepId: 'positive_progress',
        order: 3,
        question: 'What specific progress can you share that the parent will find encouraging?',
        fieldId: 'positive_progress',
        hint: 'Example: "Jamie has improved rally consistency over the past 3 sessions."',
        required: true,
      },
      {
        stepId: 'home_support',
        order: 4,
        question: 'What can the parent do at home to support this player\'s development?',
        fieldId: 'home_support',
        hint: 'Practical and achievable. Example: "Encourage 10 minutes of serve practice 3x per week."',
        required: true,
      },
      {
        stepId: 'internal_flag',
        order: 5,
        question: 'Any concerns to flag to the director? (internal only — not included in parent message)',
        fieldId: 'internal_flag',
        hint: 'This stays in the review queue for the director. It is never sent to the parent.',
        required: true,
      },
    ],
    optionalSteps: [
      {
        stepId: 'next_milestone',
        order: 6,
        question: 'Is there a milestone or upcoming event to mention? (optional)',
        fieldId: 'next_milestone',
        hint: 'Example: "Tournament in 3 weeks" or "Level review coming up."',
        required: false,
      },
    ],
    completionCriteria: 'All 5 required fields answered. Parent update draft queued for director review and approval before any send.',
    safeActions: [
      'collect parent update content',
      'apply parent-safe language rules',
      'build a draft for director review',
      'flag any internal concerns to the review queue',
    ],
    approvalGatedActions: [
      'send any communication to the parent',
      'save parent update to the player record',
      'publish any parent-visible content',
    ],
    openingMessage: "Let's draft a parent update together. I'll ask 5 questions — one at a time. Nothing is sent until the director reviews and approves.\n\nStep 1 of 5:",
  },

  // ── 6. Template Builder ───────────────────────────────────────────────────
  {
    id: 'template_builder_completion',
    label: 'Class Template Builder',
    endGoal: 'Define a complete class template — session blocks, timing, focus, and curriculum level — ready for director review.',
    triggerPhrases: [
      'walk me through template builder',
      'walk me through the template builder',
      'help me build a template',
      'build a class template',
      'create a template',
      'build a session template',
      'guide me through template builder',
      'let\'s build a template',
      'template builder',
      'help me create a class template',
    ],
    pageRoutes: [
      '/director/templates',
      '/director/curriculum/builder',
    ],
    requiredSteps: [
      {
        stepId: 'template_purpose',
        order: 1,
        question: 'What is this template for? (e.g. Orange Ball 2 — skills session, Red Ball 1 — intro match play)',
        fieldId: 'template_purpose',
        hint: 'Be specific. The level and session type help coaches choose the right template.',
        required: true,
      },
      {
        stepId: 'session_duration',
        order: 2,
        question: 'How long is this session? (45 / 60 / 90 minutes)',
        fieldId: 'session_duration',
        hint: 'This determines block timing recommendations.',
        required: true,
      },
      {
        stepId: 'session_focus',
        order: 3,
        question: 'What is the main coaching focus for this template?',
        fieldId: 'session_focus',
        hint: 'Example: "Rally consistency under movement" or "Serve + return rhythm."',
        required: true,
      },
      {
        stepId: 'block_structure',
        order: 4,
        question: 'What blocks do you want? List the block types in order. (e.g. warm-up, skill, games, cool-down)',
        fieldId: 'block_structure',
        hint: 'Standard structure: warm-up → skill → games/match play → cool-down.',
        required: true,
      },
      {
        stepId: 'key_drills',
        order: 5,
        question: 'What are the 2–3 key drills or activities for the main skill block?',
        fieldId: 'key_drills',
        hint: 'These will be linked to the curriculum drill library where available.',
        required: true,
      },
      {
        stepId: 'target_level',
        order: 6,
        question: 'Which curriculum level is this template designed for?',
        fieldId: 'target_level',
        hint: 'This links the template to the curriculum structure for coverage tracking.',
        required: true,
      },
    ],
    optionalSteps: [
      {
        stepId: 'coach_notes',
        order: 7,
        question: 'Any coaching notes or tips for using this template effectively?',
        fieldId: 'coach_notes',
        hint: 'Shown to coaches only when they open the template.',
        required: false,
      },
    ],
    completionCriteria: 'All 6 required fields answered. Template draft ready for director review before saving.',
    safeActions: [
      'collect template structure information',
      'suggest typical block timings for session duration',
      'build a template draft for review',
    ],
    approvalGatedActions: [
      'save template to the database',
      'publish template to coaches',
      'assign template to sessions or groups',
    ],
    openingMessage: "Let's build a class template together. I'll ask 6 questions — one at a time. Nothing saves until you review and confirm the draft.\n\nStep 1 of 6:",
  },

  // ── 7. Coach Creation ─────────────────────────────────────────────────────
  {
    id: 'coach_creation_completion',
    label: 'Add Coach',
    endGoal: 'Link a coach to the academy by email and assign their role — ready for director confirmation.',
    triggerPhrases: [
      'add a coach',
      'invite a coach',
      'add coach',
      'invite coach',
      'help me add a coach',
      'let\'s add a coach',
      'guide me through adding a coach',
      'create a coach',
      'onboard a coach',
      'new coach',
    ],
    pageRoutes: [
      '/director/coaches',
    ],
    requiredSteps: [
      {
        stepId: 'coach_email',
        order: 1,
        question: 'What is the coach\'s email address?',
        fieldId: 'coach_email',
        hint: 'The coach must already have an AcademyOS account. Enter their login email.',
        required: true,
      },
      {
        stepId: 'coach_role',
        order: 2,
        question: 'What role should they have? (coach / head_coach)',
        fieldId: 'coach_role',
        hint: '"coach" for regular coaches. "head_coach" for your lead coach with broader permissions.',
        required: true,
      },
    ],
    optionalSteps: [],
    completionCriteria: 'Both required fields answered. Ready for director to confirm and link the coach.',
    safeActions: [
      'collect coach email and role',
      'show what the role means',
      'build a review summary',
    ],
    approvalGatedActions: [
      'link coach to the academy',
      'assign coach role',
      'grant access to coach portal',
    ],
    openingMessage: "Let's add a coach. I'll ask 2 quick questions — then you confirm.\n\nStep 1 of 2:",
  },

  // ── 8. Fitness Template Builder ───────────────────────────────────────────
  {
    id: 'fitness_template_builder_completion',
    label: 'Fitness Template Builder',
    endGoal: 'Define a fitness template — curriculum level, fitness goal, load, and duration — ready for director review.',
    triggerPhrases: [
      'build a fitness template',
      'create a fitness template',
      'help me build a fitness template',
      'fitness template builder',
      'new fitness template',
      'guide me through fitness template',
      'let\'s build a fitness template',
      'add a fitness template',
    ],
    pageRoutes: [
      '/director/templates/fitness',
      '/director/templates',
    ],
    requiredSteps: [
      {
        stepId: 'fitness_level',
        order: 1,
        question: 'Which curriculum level is this fitness template designed for?',
        fieldId: 'fitness_level',
        hint: 'Examples: "Red Ball 1", "Orange Ball 2", "Green Ball". Links the template to the curriculum structure.',
        required: true,
      },
      {
        stepId: 'fitness_goal',
        order: 2,
        question: 'What is the fitness goal? (speed & agility / strength & power / mobility / endurance / coordination)',
        fieldId: 'fitness_goal',
        hint: 'This determines which exercise blocks are suggested.',
        required: true,
      },
      {
        stepId: 'fitness_load',
        order: 3,
        question: 'What load level should this session be? (light / moderate / high)',
        fieldId: 'fitness_load',
        hint: '"light" for younger players or recovery days. "high" for competitive-stage athletes.',
        required: true,
      },
      {
        stepId: 'fitness_duration',
        order: 4,
        question: 'How long is this fitness session? (15 / 20 / 30 / 45 minutes)',
        fieldId: 'fitness_duration',
        hint: 'Most on-court fitness blocks run 15–30 minutes.',
        required: true,
      },
    ],
    optionalSteps: [],
    completionCriteria: 'All 4 required fields answered. Fitness template draft ready for director review.',
    safeActions: [
      'collect fitness template parameters',
      'suggest exercise blocks for the chosen goal',
      'build a fitness draft for review',
    ],
    approvalGatedActions: [
      'save fitness template to the database',
      'publish template to coaches',
      'assign template to sessions',
    ],
    openingMessage: "Let's build a fitness template. I'll ask 4 quick questions — then you review.\n\nStep 1 of 4:",
  },
]

// ── Lookup helpers ────────────────────────────────────────────────────────────

const WORKFLOW_MAP = new Map<GuidedWorkflowId, GuidedCompletionWorkflow>(
  WORKFLOWS.map(w => [w.id, w]),
)

export function getWorkflow(id: GuidedWorkflowId): GuidedCompletionWorkflow | null {
  return WORKFLOW_MAP.get(id) ?? null
}

export function getAllWorkflows(): GuidedCompletionWorkflow[] {
  return WORKFLOWS
}

/** Returns the total required step count for a workflow. */
export function requiredStepCount(id: GuidedWorkflowId): number {
  return getWorkflow(id)?.requiredSteps.length ?? 0
}

// ── Intent detection ──────────────────────────────────────────────────────────

/**
 * Detects whether the user's input matches a guided completion trigger phrase.
 * Returns the matched workflow definition or null.
 * Case-insensitive, partial-match.
 */
export function detectGuidedCompletionIntent(
  text: string,
): GuidedCompletionWorkflow | null {
  const lower = text.toLowerCase().trim()
  for (const workflow of WORKFLOWS) {
    for (const phrase of workflow.triggerPhrases) {
      if (lower.includes(phrase)) return workflow
    }
  }
  return null
}

/**
 * Returns the canonical step for a given fieldId within a workflow.
 * Searches required steps first, then optional.
 */
export function getStepByFieldId(
  workflowId: GuidedWorkflowId,
  fieldId: string,
): GuidedCompletionStep | null {
  const w = getWorkflow(workflowId)
  if (!w) return null
  return (
    w.requiredSteps.find(s => s.fieldId === fieldId) ??
    w.optionalSteps.find(s => s.fieldId === fieldId) ??
    null
  )
}
