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
  // Player profile — parameterized
  if (pathname.startsWith('/director/players/') && pathname.split('/').length >= 4) {
    return PAGE_CAPABILITY_MAP.find(m => m.route === '/director/players/[playerId]') ?? FALLBACK_MAP
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
  return `You're on the **${map.pageLabel}**. ${map.directorIntent}`
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
