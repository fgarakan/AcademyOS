// Sprint 687 — DONNA Page-Aware Context Engine V1
// Structured per-route capability maps and COO question-answering layer.
// Pure TS — no DB calls, no API calls, no mutations, no side effects.
// Complements donnaPageContextRegistry (Sprint 625+) with explicit COO answers.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DonnaPageCapabilityMap {
  route: string
  pageLabel: string
  directorIntent: string
  safeContext: string[]
  suggestedPrompts: string[]
  allowedAnswerTypes: string[]
  reviewRequiredActions: string[]
  blocked: string[]
  dataFallback: string
}

// ── Route capability registry ─────────────────────────────────────────────────

const PAGE_CAPABILITY_MAP: DonnaPageCapabilityMap[] = [
  // ── Onboarding ──────────────────────────────────────────────────────────────
  {
    route: '/director/onboarding',
    pageLabel: 'Academy Setup',
    directorIntent: 'Configure your academy before going live — choose a setup path, answer key questions, and activate the platform.',
    safeContext: ['setup mode selection', 'onboarding progress', 'academy configuration options', 'setup step guidance'],
    suggestedPrompts: [
      'Which setup mode should I choose?',
      'What is Guided Setup?',
      'What is Fast Start?',
      'Walk me through this step.',
      'What should I do first?',
    ],
    allowedAnswerTypes: ['setup guidance', 'mode explanation', 'step-by-step walkthrough', 'onboarding navigation'],
    reviewRequiredActions: ['confirming academy curriculum setup', 'activating player placements', 'publishing academy configuration'],
    blocked: ['skip required setup steps', 'activate players before placement review', 'configure academy without director confirmation'],
    dataFallback: 'You\'re in academy setup. I can explain each setup mode and help you choose. Three paths are available: Fast Start (quickest), Guided Setup (recommended), and Full Setup (most control).',
  },
  {
    route: '/director/onboarding/interview',
    pageLabel: 'Academy Interview',
    directorIntent: 'Answer 7 questions about your academy philosophy, player focus, competition approach, and 90-day vision.',
    safeContext: ['interview questions', 'academy philosophy', 'response guidance'],
    suggestedPrompts: [
      'What does this question mean?',
      'Why is this question important?',
      'Can I change my answers later?',
      'Walk me through this interview.',
      'What is this section about?',
    ],
    allowedAnswerTypes: ['question explanation', 'interview guidance', 'answer coaching'],
    reviewRequiredActions: ['submitting interview answers'],
    blocked: ['auto-fill interview answers', 'skip interview questions'],
    dataFallback: 'You\'re in the academy interview. Answer each question about your philosophy, players, and goals. You can change answers before submitting.',
  },
  {
    route: '/director/onboarding/curriculum',
    pageLabel: 'Curriculum Setup',
    directorIntent: 'Select your academy\'s curriculum structure and development levels before going live.',
    safeContext: ['curriculum levels', 'development structure', 'starter curriculum options'],
    suggestedPrompts: [
      'What curriculum should I choose?',
      'What are the ball colors for?',
      'How many levels should I start with?',
      'What is the recommended structure?',
      'Can I change this later?',
    ],
    allowedAnswerTypes: ['curriculum guidance', 'level explanation', 'structure recommendation'],
    reviewRequiredActions: ['confirming curriculum structure'],
    blocked: ['auto-assign players to levels', 'publish curriculum without review'],
    dataFallback: 'You\'re configuring curriculum structure. Choose the level progression that matches your academy\'s current players.',
  },
  // ── Director Dashboard ─────────────────────────────────────────────────────
  {
    route: '/director',
    pageLabel: 'Director Dashboard',
    directorIntent: 'Understand today\'s academy health and decide what to act on first.',
    safeContext: ['review queue count', 'attention signals', 'pending approvals', 'recent coach activity'],
    suggestedPrompts: [
      'What should I do first today?',
      'What needs my attention right now?',
      'Explain the academy signals.',
      'What is waiting for my approval?',
      'What have coaches done this week?',
    ],
    allowedAnswerTypes: ['priority explanation', 'signal summary', 'action recommendation', 'system explanation'],
    reviewRequiredActions: ['approve pending items', 'publish parent updates', 'activate player level changes'],
    blocked: ['mutate player records directly', 'send communications without approval', 'move player levels from chat'],
    dataFallback: 'Dashboard data may not be available in demo mode. I can explain what each section does and what to check.',
  },
  {
    route: '/director/donna',
    pageLabel: 'DONNA Hub',
    directorIntent: 'Interact with DONNA directly and review past conversation context.',
    safeContext: ['current session context', 'last prompts', 'last module visited', 'DONNA capabilities'],
    suggestedPrompts: [
      'What can you help me with?',
      'How does DONNA work?',
      'What did we talk about last time?',
      'What is safe to do from here?',
      'How do I approve items?',
    ],
    allowedAnswerTypes: ['capability explanation', 'system explanation', 'session recall', 'safety explanation'],
    reviewRequiredActions: [],
    blocked: ['mutate data directly from this page', 'access player private notes', 'expose parent data'],
    dataFallback: 'I\'m available here for direct conversation. Ask me anything about the academy or how AcademyOS works.',
  },
  {
    route: '/director/kpi',
    pageLabel: 'KPI Dashboard',
    directorIntent: 'Review academy performance metrics and understand what is driving them.',
    safeContext: ['KPI values', 'trend labels', 'benchmark targets', 'what each KPI measures'],
    suggestedPrompts: [
      'Explain these KPIs like I\'m making a decision.',
      'Which KPI needs the most attention?',
      'What is causing this metric to be low?',
      'What should I do about a bad KPI?',
      'How do these connect to player progress?',
    ],
    allowedAnswerTypes: ['KPI explanation', 'trend interpretation', 'action recommendation', 'system explanation'],
    reviewRequiredActions: ['curriculum changes based on KPI signals', 'coach performance reviews'],
    blocked: ['claim trend attribution without evidence', 'move players based on KPI alone', 'publish KPI data externally'],
    dataFallback: 'KPI data may not be loaded yet. I can explain what each metric measures and what healthy ranges look like.',
  },
  {
    route: '/director/players',
    pageLabel: 'Player Directory',
    directorIntent: 'Find players, understand development status, and identify who needs attention.',
    safeContext: ['player names', 'current level', 'recent signals', 'attention risk flags'],
    suggestedPrompts: [
      'Which players need attention?',
      'Who may be ready for the next level?',
      'Which players have not had a coach note recently?',
      'Find players with attendance concerns.',
      'Who is in the development intake?',
    ],
    allowedAnswerTypes: ['player summary', 'attention flag', 'priority recommendation', 'search guidance'],
    reviewRequiredActions: ['level movement', 'player profile changes', 'parent-visible updates'],
    blocked: ['expose sibling data', 'move player levels directly from chat', 'publish player info externally'],
    dataFallback: 'Player list may not be loaded. I can help you navigate to a specific player or explain what each column means.',
  },
  {
    route: '/director/players/[playerId]',
    pageLabel: 'Player Profile',
    directorIntent: 'Review a single player\'s development history, signals, and decisions.',
    safeContext: ['player development stage', 'recent coach notes (director view only)', 'attendance patterns', 'level history', 'assessment results'],
    suggestedPrompts: [
      'Summarize this player\'s recent progress.',
      'What does the coach say about this player?',
      'Is this player ready for a level change?',
      'What should I review before updating the parent?',
      'Draft a parent-safe update for review.',
    ],
    allowedAnswerTypes: ['player summary', 'development explanation', 'readiness assessment', 'draft routing'],
    reviewRequiredActions: ['parent update publication', 'level movement', 'visibility changes'],
    blocked: ['expose raw coach notes to parents', 'move player level directly from chat', 'expose sibling data'],
    dataFallback: 'Player data for this profile may not be fully loaded. I can explain what each section means.',
  },
  {
    route: '/director/review',
    pageLabel: 'Review Center',
    directorIntent: 'Approve, modify, or reject pending action items before they take effect.',
    safeContext: ['pending item count', 'item categories', 'approval status', 'parent visibility risk flags'],
    suggestedPrompts: [
      'What needs approval first?',
      'Which items have parent visibility risk?',
      'Summarize the review queue.',
      'What happens after I approve this?',
      'Can I reject without explaining why?',
    ],
    allowedAnswerTypes: ['queue summary', 'approval explanation', 'risk explanation', 'process guidance'],
    reviewRequiredActions: ['all actions in this queue require explicit director approval before any effect'],
    blocked: ['auto-approve items without review', 'bypass visibility checks', 'send communications before approval'],
    dataFallback: 'Review queue data may not be loaded. Nothing in the queue has been approved — all items require your explicit action.',
  },
  {
    route: '/director/signals',
    pageLabel: 'Signals',
    directorIntent: 'Understand real-time academy signals and identify patterns requiring attention.',
    safeContext: ['signal categories', 'signal labels', 'urgency flags', 'connected players or groups'],
    suggestedPrompts: [
      'What are the most urgent signals right now?',
      'What does this signal mean?',
      'Which signals need director action?',
      'How do I clear a signal?',
      'Are any of these connected to each other?',
    ],
    allowedAnswerTypes: ['signal explanation', 'urgency interpretation', 'action recommendation', 'pattern observation'],
    reviewRequiredActions: ['acting on signals that affect player records', 'communicating to parents based on signals'],
    blocked: ['claim causation from correlation', 'act on signals without review', 'expose signal data externally'],
    dataFallback: 'Signal data may not be loaded yet. I can explain what types of signals AcademyOS tracks.',
  },
  {
    route: '/director/curriculum',
    pageLabel: 'Curriculum',
    directorIntent: 'Review the academy curriculum structure and identify gaps or needed updates.',
    safeContext: ['curriculum levels', 'block types', 'topic coverage', 'exercise library'],
    suggestedPrompts: [
      'Where are the curriculum gaps?',
      'What should I review before changing this?',
      'How does the curriculum connect to player levels?',
      'Which exercises are most commonly used?',
      'Draft a curriculum improvement for review.',
    ],
    allowedAnswerTypes: ['curriculum explanation', 'gap analysis', 'structure summary', 'draft routing'],
    reviewRequiredActions: ['curriculum changes', 'level mapping changes', 'publishing curriculum updates'],
    blocked: ['mutate curriculum directly from chat', 'promote global knowledge without platform-owner approval'],
    dataFallback: 'Curriculum data may not be fully loaded. I can explain how the curriculum system is structured.',
  },
  {
    route: '/director/curriculum/builder',
    pageLabel: 'Curriculum Builder',
    directorIntent: 'Build or edit curriculum templates and session block sequences.',
    safeContext: ['template structure', 'block sequences', 'available exercises', 'level assignments'],
    suggestedPrompts: [
      'What blocks should go in a 60-minute Red 2 session?',
      'How do I structure warm-up to match-play?',
      'What exercises are good for this level?',
      'Review this template structure.',
      'What is missing from this template?',
    ],
    allowedAnswerTypes: ['template guidance', 'block recommendation', 'structure review', 'gap identification'],
    reviewRequiredActions: ['saving and publishing templates', 'assigning templates to sessions'],
    blocked: ['mutate template data directly from chat', 'publish templates without review'],
    dataFallback: 'Template builder data may not be loaded. I can suggest typical block sequences for common session formats.',
  },
  {
    route: '/director/templates',
    pageLabel: 'Templates',
    directorIntent: 'Browse, create, and manage class templates — structured session plans coaches use to deliver consistent training.',
    safeContext: ['template library', 'template categories', 'fitness templates', 'session block structures', 'block sequences'],
    suggestedPrompts: [
      'Show me available templates.',
      'How do I create a new template?',
      'What is a fitness template?',
      'Which templates do coaches use most?',
      'How do coaches use templates in a session?',
    ],
    allowedAnswerTypes: ['template guidance', 'structure explanation', 'usage summary', 'creation guidance'],
    reviewRequiredActions: ['publishing templates to coaches', 'assigning templates as session defaults'],
    blocked: ['auto-assign templates to sessions without director review', 'modify template block content directly from chat'],
    dataFallback: 'Template data is loading. I can explain how the template system works and what types of templates are available.',
  },
  {
    route: '/director/placement',
    pageLabel: 'Placement',
    directorIntent: 'Review incoming player placement recommendations before activating them.',
    safeContext: ['placement recommendations', 'assessment results', 'recommended levels', 'onboarding queue'],
    suggestedPrompts: [
      'What placement decisions are pending?',
      'Explain this placement recommendation.',
      'What evidence supports this level assignment?',
      'Can I override a placement?',
      'What happens after I confirm placement?',
    ],
    allowedAnswerTypes: ['placement explanation', 'evidence summary', 'process guidance', 'override guidance'],
    reviewRequiredActions: ['confirming placements', 'activating players', 'overriding recommendations'],
    blocked: ['activate players without finalize_player_placement()', 'skip placement review', 'expose raw assessment to parents'],
    dataFallback: 'Placement data may not be loaded. I can explain how the placement process works.',
  },
  {
    route: '/director/level-up',
    pageLabel: 'Level Movement',
    directorIntent: 'Review level movement readiness signals and approve or defer individual decisions.',
    safeContext: ['readiness signals', 'coach recommendations', 'level history', 'pending movement items'],
    suggestedPrompts: [
      'Who is ready for a level change?',
      'What evidence supports this level movement?',
      'How long has this player been at this level?',
      'What happens after I approve a level change?',
      'Should I defer this movement?',
    ],
    allowedAnswerTypes: ['readiness summary', 'evidence explanation', 'process guidance', 'deferral rationale'],
    reviewRequiredActions: ['all level movements require explicit director approval', 'parent notification after approval'],
    blocked: ['move player level directly from chat', 'auto-approve without evidence', 'notify parents before approval'],
    dataFallback: 'Level movement data may not be loaded. I can explain how the level movement review process works.',
  },
  {
    route: '/director/support-diagnostics',
    pageLabel: 'Support Diagnostics',
    directorIntent: 'Diagnose platform issues, check data health, and verify system state.',
    safeContext: ['system health indicators', 'data connection status', 'recent errors', 'diagnostic outputs'],
    suggestedPrompts: [
      'Is the data loading correctly?',
      'What does this error mean?',
      'How do I reset demo data?',
      'Is the database connected?',
      'What should I check before a demo?',
    ],
    allowedAnswerTypes: ['system explanation', 'error interpretation', 'diagnostic guidance', 'demo readiness check'],
    reviewRequiredActions: [],
    blocked: ['run destructive commands', 'expose service keys', 'modify production data from diagnostics'],
    dataFallback: 'Diagnostics data may not be available. I can explain what each diagnostic checks for.',
  },
  // ── Sprint 862 — Page Context Registry Foundation ────────────────────────────
  {
    route: '/director/sessions/[sessionId]',
    pageLabel: 'Session Detail',
    directorIntent: 'Review a specific session — who attended, what was delivered, and whether the coach submitted a wrap-up.',
    safeContext: ['session name and date', 'assigned coach', 'attendance roster', 'blocks delivered', 'wrap-up status', 'pending review items for this session'],
    suggestedPrompts: [
      'Who attended this session?',
      'Did the coach submit a wrap-up?',
      'What blocks were on the plan?',
      'Is there anything pending review for this session?',
      'What curriculum levels were represented?',
    ],
    allowedAnswerTypes: ['session summary', 'attendance explanation', 'wrap-up status', 'curriculum context', 'pending item summary'],
    reviewRequiredActions: ['approving coach wrap-up submissions', 'publishing session notes to parents'],
    blocked: ['mutate session records from chat', 'auto-approve wrap-ups without director review', 'expose coach notes to parents'],
    dataFallback: 'Session context is loading. I can explain what each section means while data loads.',
  },
  {
    route: '/director/class-templates/[templateId]',
    pageLabel: 'Template Detail',
    directorIntent: 'Review or build a specific class template — its block structure, target curriculum level, and recent usage.',
    safeContext: ['template name and status', 'block sequence', 'target curriculum level', 'recent usage in sessions'],
    suggestedPrompts: [
      'Review this template structure.',
      'What curriculum level does this target?',
      'How many times has this been used recently?',
      'What blocks are in this template?',
      'What is missing from a standard session of this type?',
    ],
    allowedAnswerTypes: ['template review', 'block guidance', 'curriculum alignment', 'usage summary'],
    reviewRequiredActions: ['publishing templates to coaches', 'assigning templates to sessions'],
    blocked: ['mutate template data directly from chat', 'publish templates without director review'],
    dataFallback: 'Template data is loading. I can suggest typical block sequences for common session formats.',
  },
  {
    route: '/coach',
    pageLabel: 'Coach Hub',
    directorIntent: 'See your session schedule for today, pending wrap-ups, and items currently in director review.',
    safeContext: ['sessions today', 'pending wrap-ups', 'items in director review', 'next session'],
    suggestedPrompts: [
      'What sessions do I have today?',
      'Do I have any missing wrap-ups?',
      "What's waiting for director review?",
      'How do I submit a wrap-up?',
    ],
    allowedAnswerTypes: ['schedule summary', 'wrap-up guidance', 'review status', 'process explanation'],
    reviewRequiredActions: ['submitting wrap-ups', 'submitting observation drafts'],
    blocked: ['approve director review items', 'access other coaches\' sessions', 'modify player records directly'],
    dataFallback: 'Session context is loading. I can show you your sessions today and any pending wrap-ups.',
  },
  {
    route: '/coach/players',
    pageLabel: 'Coach Players',
    directorIntent: 'See the players you have coached recently and their current development levels.',
    safeContext: ['players from your sessions (last 30 days)', 'curriculum levels', 'session attendance counts'],
    suggestedPrompts: [
      'Show me my players.',
      'What levels are my players at?',
      'Who did I coach this month?',
    ],
    allowedAnswerTypes: ['player list summary', 'level explanation', 'session history summary'],
    reviewRequiredActions: ['any player record changes require director review'],
    blocked: ['access players from other coaches\' sessions', 'modify player records', 'expose parent data'],
    dataFallback: 'Player data is loading. I can show you the players from your recent sessions.',
  },
  {
    route: '/coach/sessions/[sessionId]',
    pageLabel: 'Coach Session',
    directorIntent: 'See your session roster, planned blocks, and player watch-fors before or during session delivery.',
    safeContext: ['session roster', 'block delivery plan', 'player curriculum levels', 'active priorities per player (summary only)'],
    suggestedPrompts: [
      'Who is on the roster today?',
      'What blocks do I deliver?',
      'What should I focus on for each player?',
      'How do I submit my wrap-up after this session?',
    ],
    allowedAnswerTypes: ['roster summary', 'block delivery guidance', 'player focus notes', 'process explanation'],
    reviewRequiredActions: ['submitting wrap-ups after session', 'observation drafts go to director review'],
    blocked: ['access other coaches\' sessions', 'modify player curriculum levels from chat', 'expose director-private notes or assessments'],
    dataFallback: 'Session data is loading. I can explain what each section means while it loads.',
  },
  {
    route: '/coach/sessions/[sessionId]/wrap-up',
    pageLabel: 'Coach Wrap-Up',
    directorIntent: 'Submit your session wrap-up — confirm who attended, what was delivered, and notes for the director.',
    safeContext: ['attendance roster', 'blocks scheduled', 'prior wrap-up submission status for this session'],
    suggestedPrompts: [
      'Who was present today?',
      'Have I already submitted a wrap-up for this session?',
      'What should I include in my wrap-up?',
      'What happens after I submit?',
    ],
    allowedAnswerTypes: ['wrap-up guidance', 'attendance summary', 'submission status', 'process explanation'],
    reviewRequiredActions: ['wrap-up submission goes to director review queue — director must approve before any effects take place'],
    blocked: ['auto-submit wrap-ups without coach input', 'modify attendance records directly', 'access other coaches\' sessions'],
    dataFallback: 'Wrap-up context is loading. I can explain what to include in your wrap-up while data loads.',
  },
  // ── Sprint 919 additions ────────────────────────────────────────────────────
  {
    route: '/director/today',
    pageLabel: "Today's Academy",
    directorIntent: 'See everything happening at your academy right now — today\'s sessions, wrap-up status, pending review items, and player attention flags.',
    safeContext: ['today\'s sessions', 'attendance counts', 'wrap-up coverage', 'pending review queue', 'player attention risk'],
    suggestedPrompts: [
      'What needs my attention today?',
      'How many sessions are running right now?',
      'Which coaches still need to submit wrap-ups?',
      'What\'s in my review queue?',
      'Give me a daily brief.',
    ],
    allowedAnswerTypes: ['daily brief', 'session summary', 'queue status', 'attention signals', 'wrap-up coverage'],
    reviewRequiredActions: ['approving wrap-up drafts', 'acting on attendance exceptions'],
    blocked: ['auto-approve review items from this page', 'modify session attendance directly'],
    dataFallback: 'Today\'s data is loading. I can show you today\'s sessions, wrap-up status, and your review queue.',
  },
  {
    route: '/parent',
    pageLabel: 'Parent Portal',
    directorIntent: 'See your child\'s current development focus, what they\'re working on, why it matters, and how you can support their progress at home.',
    safeContext: ['current curriculum level', 'active development focus', 'recent session exposure', 'coach-approved progress notes'],
    suggestedPrompts: [
      'What is my child working on right now?',
      'Why does this skill matter?',
      'How can I support practice at home?',
      'What progress have I missed?',
      'What should I ask the coach about?',
    ],
    allowedAnswerTypes: ['development summary', 'skill explanation', 'home practice guidance', 'progress context', 'parent-safe communication'],
    reviewRequiredActions: ['requesting a coach conversation', 'flagging a concern for director review'],
    blocked: ['access coach internal notes', 'see other players\' profiles', 'access session planning details', 'see assessment raw scores'],
    dataFallback: 'Your child\'s development profile is loading. I can explain what\'s generally worked on at this curriculum stage while data loads.',
  },
  {
    route: '/player',
    pageLabel: 'Player Portal',
    directorIntent: 'See your current tennis mission, what skills you\'re developing, your progress toward the next level, and a daily practice suggestion.',
    safeContext: ['current level', 'active mission', 'skills being developed', 'recent session attendance', 'practice suggestion'],
    suggestedPrompts: [
      'What am I working on right now?',
      'How do I level up?',
      'What should I practice today?',
      'What did my coach say about me?',
      'How close am I to the next level?',
    ],
    allowedAnswerTypes: ['mission summary', 'skill focus', 'practice suggestion', 'level progress', 'coach-safe encouragement'],
    reviewRequiredActions: ['coach input is reviewed before showing official progress updates'],
    blocked: ['access other players\' profiles', 'see coach internal notes or concerns', 'see assessment raw scores', 'modify personal profile data'],
    dataFallback: 'Your player profile is loading. I can tell you about your current level and what players at this stage typically work on.',
  },
  {
    route: '/director/settings',
    pageLabel: 'Academy Settings',
    directorIntent: 'Configure your academy name, billing preferences, and operational settings. Changes take effect immediately and affect the whole academy.',
    safeContext: ['academy name', 'billing status', 'operational preferences', 'feature configuration'],
    suggestedPrompts: [
      'What can I change here?',
      'Does changing a setting affect my coaches?',
      'What should I configure first?',
      'Is this change reversible?',
    ],
    allowedAnswerTypes: ['settings explanation', 'impact of changes', 'configuration guidance', 'reversibility information'],
    reviewRequiredActions: ['billing changes', 'academy deactivation', 'bulk-role assignment changes'],
    blocked: ['auto-apply billing changes', 'change academy-wide settings without confirmation', 'modify other academies\' settings'],
    dataFallback: 'Settings context is loading. I can explain what each setting controls before you make changes.',
  },
]

const FALLBACK_MAP: DonnaPageCapabilityMap = {
  route: '*',
  pageLabel: 'AcademyOS',
  directorIntent: 'Navigate the academy operating system.',
  safeContext: ['navigation', 'system structure'],
  suggestedPrompts: ['How does this system work?', 'Where should I start?'],
  allowedAnswerTypes: ['navigation guidance', 'system explanation'],
  reviewRequiredActions: [],
  blocked: ['mutate data from chat', 'expose private data'],
  dataFallback: 'I\'m not sure which page you\'re on. Let me know what you\'d like help with.',
}

// ── Lookup ─────────────────────────────────────────────────────────────────────

export function getPageCapabilityMap(pathname: string): DonnaPageCapabilityMap {
  // Exact match first
  const exact = PAGE_CAPABILITY_MAP.find(m => m.route === pathname)
  if (exact) return exact

  // Parameterized routes — matched before prefix fallback (Sprint 862 additions)
  // Player profile — /director/players/<id>
  if (pathname.startsWith('/director/players/') && pathname.split('/').length >= 4) {
    return PAGE_CAPABILITY_MAP.find(m => m.route === '/director/players/[playerId]') ?? FALLBACK_MAP
  }
  // Session detail — /director/sessions/<id>
  if (pathname.startsWith('/director/sessions/') && pathname.split('/').length >= 4) {
    return PAGE_CAPABILITY_MAP.find(m => m.route === '/director/sessions/[sessionId]') ?? FALLBACK_MAP
  }
  // Template detail — /director/class-templates/<id>
  if (pathname.startsWith('/director/class-templates/') && pathname.split('/').length >= 4) {
    return PAGE_CAPABILITY_MAP.find(m => m.route === '/director/class-templates/[templateId]') ?? FALLBACK_MAP
  }
  // Coach wrap-up — /coach/sessions/<id>/wrap-up (must match before coach session)
  if (pathname.startsWith('/coach/sessions/') && pathname.endsWith('/wrap-up')) {
    return PAGE_CAPABILITY_MAP.find(m => m.route === '/coach/sessions/[sessionId]/wrap-up') ?? FALLBACK_MAP
  }
  // Coach session — /coach/sessions/<id>
  if (pathname.startsWith('/coach/sessions/') && pathname.split('/').length >= 4) {
    return PAGE_CAPABILITY_MAP.find(m => m.route === '/coach/sessions/[sessionId]') ?? FALLBACK_MAP
  }

  // Prefix match (longest first)
  const sorted = [...PAGE_CAPABILITY_MAP].sort((a, b) => b.route.length - a.route.length)
  return sorted.find(m => pathname.startsWith(m.route)) ?? FALLBACK_MAP
}

// ── COO Question Answering ─────────────────────────────────────────────────────

function name(firstName: string | null): string {
  return firstName ? `${firstName}` : 'there'
}

export function whereAmI(pathname: string, firstName: string | null = null): string {
  const map = getPageCapabilityMap(pathname)
  const greeting = firstName ? `Hi ${firstName}, you're` : `You're`
  return `${greeting} on the **${map.pageLabel}**. ${map.directorIntent}`
}

export function whatCanYouHelpWith(pathname: string, firstName: string | null = null): string {
  const map = getPageCapabilityMap(pathname)
  const prompts = map.suggestedPrompts.slice(0, 3).map(p => `• ${p}`).join('\n')
  return `Hi ${name(firstName)}, on the **${map.pageLabel}** I can help you with:\n${prompts}\n\nI can also explain anything you see here, or route safe actions through review.`
}

export function whatShouldIInspectFirst(pathname: string): string {
  const map = getPageCapabilityMap(pathname)
  if (map.safeContext.length === 0) return 'There is nothing specific to inspect here yet.'
  return `On the **${map.pageLabel}**, start by checking: ${map.safeContext.slice(0, 3).join(', ')}. ${map.directorIntent}`
}

export function whatActionsRequireApproval(pathname: string): string {
  const map = getPageCapabilityMap(pathname)
  if (map.reviewRequiredActions.length === 0) {
    return `On the **${map.pageLabel}**, no director-approval actions have been identified. This page is primarily for reading and review.`
  }
  const items = map.reviewRequiredActions.map(a => `• ${a}`).join('\n')
  return `On the **${map.pageLabel}**, these actions require your explicit approval before anything takes effect:\n${items}`
}

export function whatShouldINotDo(pathname: string): string {
  const map = getPageCapabilityMap(pathname)
  if (map.blocked.length === 0) return `I have no specific restrictions flagged for the **${map.pageLabel}**.`
  const items = map.blocked.map(b => `• ${b}`).join('\n')
  return `On the **${map.pageLabel}**, I must not and will not:\n${items}\n\nIf you ask me to do any of these, I'll explain why and offer a safe alternative.`
}

export function dataFallbackMessage(pathname: string): string {
  return getPageCapabilityMap(pathname).dataFallback
}

// Sprint 912.14 — recommended next step
// Answers "what should I do here?" / "what's the most important task on this page?"
// Uses directorIntent + the first suggested prompt to give a concrete, actionable answer.
export function whatIsTheBestNextStep(pathname: string): string {
  const map = getPageCapabilityMap(pathname)
  const firstPrompt = map.suggestedPrompts[0] ?? null
  const base = `On the **${map.pageLabel}**: ${map.directorIntent}`
  if (firstPrompt) {
    return `${base}\n\nA good place to start: ask me "${firstPrompt}"`
  }
  return base
}

// Sprint 919 — walk me through this page
// Comprehensive structured walkthrough: what the page is, what you can do, what to check first,
// what requires approval, and the single best next step.
export function walkMeThrough(pathname: string, firstName: string | null = null): string {
  const map = getPageCapabilityMap(pathname)
  const greeting = firstName ? `Hi ${firstName}. ` : ''
  const context = map.safeContext.slice(0, 3).map(c => `• ${c}`).join('\n')
  const approvals = map.reviewRequiredActions.length > 0
    ? `\n\n**Needs your approval:** ${map.reviewRequiredActions.slice(0, 2).join('; ')}.`
    : ''
  const nextStep = map.suggestedPrompts[0]
    ? `\n\n**Start here:** Ask me "${map.suggestedPrompts[0]}"`
    : ''
  return `${greeting}**${map.pageLabel}** — ${map.directorIntent}\n\n**What you can check here:**\n${context}${approvals}${nextStep}`
}

// Sprint 919 — why does this page matter
// Explains the strategic purpose of the page in the academy operating context.
export function whyDoesThisMatter(pathname: string): string {
  const map = getPageCapabilityMap(pathname)
  const allowed = map.allowedAnswerTypes.slice(0, 3).join(', ')
  return `The **${map.pageLabel}** matters because: ${map.directorIntent}\n\nI can help you with: ${allowed}.`
}

// Sprint 919 — what should I click next
// Gives the single most actionable next step on this page.
export function whatShouldIClickNext(pathname: string): string {
  const map = getPageCapabilityMap(pathname)
  const firstPrompt = map.suggestedPrompts[0] ?? null
  const firstContext = map.safeContext[0] ?? null
  if (firstPrompt) {
    return `On the **${map.pageLabel}**, the most valuable next step: "${firstPrompt}". ${firstContext ? `Check the ${firstContext} section first.` : ''}`
  }
  return `On the **${map.pageLabel}**: ${map.directorIntent}`
}
