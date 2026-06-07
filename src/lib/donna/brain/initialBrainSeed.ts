// Mega Sprint 904–933B — DONNA Initial Brain Consolidation V1
//
// Canonical Global Brain seed: 21 entries consolidated from existing AcademyOS systems.
// Every entry traces to a specific existing file and symbol — nothing invented here.
//
// Entry counts:
//   Vocabulary    — 8 entries  (core academy terminology)
//   Intent        — 6 entries  (deterministic phrase detectors, already active in processDonnaMessage)
//   Decision Rule — 4 entries  (thresholds and mutation guards, already enforced in runtime)
//   Philosophy    — 3 entries  (operating model already documented in CLAUDE.md + conversation/index.ts)
//   Total         — 21 entries
//
// IDs use the format b1a00000-{category}-4000-8000-{sequence} and are stable forever.
// Category codes: 0001 = vocabulary, 0002 = intent, 0003 = decision_rule, 0004 = philosophy
//
// Governance: donnaBrainGovernance.ts
// Audit:      docs/qa/DONNA_BRAIN_INVENTORY_AUDIT_904.md
// Architecture: docs/brain/DONNA_INITIAL_BRAIN_904.md

import type {
  GlobalBrainEntry,
  GlobalBrainEntryType,
  GlobalBrainEntryStatus,
} from './donnaBrainGovernance'

// ── Source attribution (seed-only extension) ──────────────────────────────────
//
// Not part of the live GlobalBrainEntry schema — used for traceability only.
// The runtime consumable is INITIAL_BRAIN_SEED (GlobalBrainEntry[]).

export interface SeedSourceAttribution {
  /** Path relative to /workspaces/AcademyOS/src/ or /docs/ */
  file: string
  /** Specific constant name, function name, or comment line */
  symbol: string
  /** Sprint or phase that introduced this concept */
  sprint: string
  /** Verbatim value or phrase from the source — null for structural concepts */
  verbatim: string | null
}

export interface SeedBrainEntry extends GlobalBrainEntry {
  source: SeedSourceAttribution
}

// ── Shared metadata ───────────────────────────────────────────────────────────

const SEED_DATE = '2026-06-07T00:00:00.000Z'
const SEED_OWNER = 'system-initial-seed'

function entry(
  id: string,
  type: GlobalBrainEntryType,
  key: string,
  label: string,
  definition: string,
  examples: string[],
  tags: string[],
  relatedKeys: string[],
  source: SeedSourceAttribution,
): SeedBrainEntry {
  return {
    id,
    type,
    key,
    label,
    definition,
    examples,
    status: 'active' as GlobalBrainEntryStatus,
    version: 1,
    promotedAt: SEED_DATE,
    promotedBy: SEED_OWNER,
    lastModifiedAt: SEED_DATE,
    lastModifiedBy: SEED_OWNER,
    tags,
    relatedKeys,
    source,
  }
}

// ── Section 1: Vocabulary ─────────────────────────────────────────────────────
// Core academy terms DONNA uses across all roles. These are the canonical
// definitions that AcademyAlias entries may remap for a specific academy.

const VOCABULARY_SEED: SeedBrainEntry[] = [

  entry(
    'b1a00000-0001-4000-8000-000000000001',
    'vocabulary',
    'vocabulary.group',
    'Group',
    'The primary organizational unit for players. A group is a set of players at a shared curriculum level, assigned to a coach, who train together in scheduled sessions.',
    ['Red Ball 1 morning group', 'Orange 2 squad', 'Junior Elite group'],
    ['groups', 'roster', 'organization'],
    ['vocabulary.session', 'vocabulary.coach', 'vocabulary.player', 'vocabulary.level'],
    {
      file: 'lib/donna/academyKnowledge/index.ts',
      symbol: "AcademyKnowledgeArea 'groups'",
      sprint: 'Sprint 463',
      verbatim: "groups: { area: 'groups', label: 'Training Groups' }",
    },
  ),

  entry(
    'b1a00000-0001-4000-8000-000000000002',
    'vocabulary',
    'vocabulary.session',
    'Session',
    'A scheduled coaching event where a coach delivers curriculum-aligned activities to a group. A session is created from a template and results in attendance, observations, and a wrap-up.',
    ['Monday 4pm Orange Ball 2 session', 'Saturday morning Red Ball session'],
    ['sessions', 'scheduling', 'coaching'],
    ['vocabulary.group', 'vocabulary.template', 'vocabulary.wrap_up'],
    {
      file: 'lib/donna/donnaCommandRouter.ts',
      symbol: "DonnaCommandCategory 'session_actual'",
      sprint: 'Sprint 591',
      verbatim: "session_actual: { destination: 'session_actual_preview' }",
    },
  ),

  entry(
    'b1a00000-0001-4000-8000-000000000003',
    'vocabulary',
    'vocabulary.wrap_up',
    'Wrap-Up',
    'The post-session documentation step. After a session ends, the coach records who was present, what was observed, and how the session went. Wrap-ups are reviewed by the director before any content reaches parents or the review queue.',
    ['completing the wrap-up', 'session wrap-up pending', 'missing wrap-up'],
    ['wrap-up', 'sessions', 'coach', 'documentation'],
    ['vocabulary.session', 'vocabulary.coach', 'vocabulary.proposed_action'],
    {
      file: 'lib/donna/intent/donnaIntentEngine.ts',
      symbol: "session_review signals: 'wrap up', 'wrap-up'",
      sprint: 'Sprint 1831–1860',
      verbatim: "{ signal: 'wrap up', weight: 'medium' }, { signal: 'wrap-up', weight: 'medium' }",
    },
  ),

  entry(
    'b1a00000-0001-4000-8000-000000000004',
    'vocabulary',
    'vocabulary.level',
    'Level',
    'A curriculum stage representing a defined skill band and progression milestone. Levels are named by ball color and number (e.g. Red Ball 1, Orange Ball 2). A player is placed at a level and advances only after meeting the level\'s criteria.',
    ['Orange Ball 2', 'Red 1', 'Green Ball', 'Yellow Ball 3'],
    ['curriculum', 'levels', 'progression'],
    ['vocabulary.player', 'vocabulary.group', 'decision_rule.player_stall_medium'],
    {
      file: 'lib/donna/entity/donnaEntityResolver.ts',
      symbol: 'BALL_COLORS, EntityKind curriculum_level',
      sprint: 'Mega Sprint 2291–2320',
      verbatim: "BALL_COLORS = ['red', 'orange', 'green', 'yellow', 'purple', 'blue', 'white']",
    },
  ),

  entry(
    'b1a00000-0001-4000-8000-000000000005',
    'vocabulary',
    'vocabulary.template',
    'Template',
    'A reusable session plan defining block structure, timing, and curriculum level alignment. Templates are created by the director and selected by coaches when scheduling sessions.',
    ['Orange Ball 2 — Forehand Focus 60min', 'Red Ball intro matchplay template'],
    ['templates', 'curriculum', 'sessions'],
    ['vocabulary.session', 'vocabulary.level'],
    {
      file: 'components/assistant/donnaTaskContracts.ts',
      symbol: "DonnaTaskId 'create_class_template', createsDraftType: 'class_template_draft'",
      sprint: 'Sprint 264',
      verbatim: "create_class_template: { reads: ['curriculum', 'class_template'] }",
    },
  ),

  entry(
    'b1a00000-0001-4000-8000-000000000006',
    'vocabulary',
    'vocabulary.coach',
    'Coach',
    'A staff member responsible for delivering sessions to one or more groups. A coach records attendance, writes observations, and completes wrap-ups. The head coach has elevated visibility; a coach has access only to their assigned groups.',
    ['head coach', 'assigned coach', 'coach wrap-up', 'coach note'],
    ['staff', 'coach', 'roles'],
    ['vocabulary.group', 'vocabulary.session', 'vocabulary.wrap_up'],
    {
      file: 'lib/donna/academyKnowledge/index.ts',
      symbol: "AcademyKnowledgeArea 'staff', roles: ['academy_director']",
      sprint: 'Sprint 463',
      verbatim: "staff: { area: 'staff', label: 'Staff', isSensitive: true }",
    },
  ),

  entry(
    'b1a00000-0001-4000-8000-000000000007',
    'vocabulary',
    'vocabulary.player',
    'Player',
    'A student enrolled in the academy. Each player is assigned to a curriculum level and a group, has a development profile, and progresses through levels based on coach observations and director-approved assessments.',
    ['player profile', 'player progress', 'player placement', 'player stall'],
    ['players', 'development', 'curriculum'],
    ['vocabulary.level', 'vocabulary.group', 'vocabulary.coach', 'decision_rule.player_stall_medium'],
    {
      file: 'lib/donna/academyKnowledge/index.ts',
      symbol: "AcademyKnowledgeArea 'players', isSensitive: true",
      sprint: 'Sprint 463',
      verbatim: "players: { area: 'players', label: 'Players', isSensitive: true }",
    },
  ),

  entry(
    'b1a00000-0001-4000-8000-000000000008',
    'vocabulary',
    'vocabulary.proposed_action',
    'Proposed Action',
    'A DONNA-generated draft of a data mutation (e.g. attendance record, parent update, level flag) that is queued for director or head coach approval before execution. DONNA never executes mutations directly — all changes flow through proposed_actions.',
    ['proposed attendance exception', 'proposed parent update', 'proposed level flag'],
    ['approval', 'mutations', 'safety'],
    ['vocabulary.wrap_up', 'decision_rule.mutation_requires_approval', 'philosophy.ai_proposes_director_approves'],
    {
      file: 'lib/donna/donnaCommandRouter.ts',
      symbol: 'DonnaRouteResult.requiresDirectorApproval, all routes return proposals',
      sprint: 'Sprint 591',
      verbatim: 'All routes return proposals only — director approves before any action is taken.',
    },
  ),

]

// ── Section 2: Intent ─────────────────────────────────────────────────────────
// Recognised intent patterns already active in processDonnaMessage.ts.
// The examples are the actual phrases from the existing phrase detectors.

const INTENT_SEED: SeedBrainEntry[] = [

  entry(
    'b1a00000-0002-4000-8000-000000000001',
    'intent',
    'intent.review_queue',
    'Review Queue Intent',
    'The director wants to open, inspect, or act on pending approvals in the review queue.',
    [
      'show review queue', 'open review queue', 'review queue',
      'needs my review', 'needs approval', 'pending approval',
      'pending review', 'what needs approval', 'decisions are waiting',
      'pending decisions', 'needs a decision', 'what decisions',
    ],
    ['review', 'approvals', 'director'],
    ['vocabulary.proposed_action', 'intent.academy_attention'],
    {
      file: 'lib/donna/brain/processDonnaMessage.ts',
      symbol: 'isReviewQueuePhrase()',
      sprint: 'Sprint 1911–1960 (Mega Sprint 754–783 additions)',
      verbatim: "lower.includes('show review queue') || lower.includes('pending decisions')",
    },
  ),

  entry(
    'b1a00000-0002-4000-8000-000000000002',
    'intent',
    'intent.daily_brief',
    'Daily Brief Intent',
    'The director wants a summary of today\'s priorities, scheduled sessions, pending items, and key signals — a morning briefing.',
    [
      'daily brief', 'morning brief', 'brief me', 'give me a brief',
      'what is on the agenda', 'start my day', 'walk me through today',
      'what is happening today', 'what should i focus on', 'what are my priorities',
    ],
    ['brief', 'director', 'daily'],
    ['intent.today_guidance', 'intent.academy_attention'],
    {
      file: 'lib/donna/donnaIntentClassifier.ts',
      symbol: 'matchesDailyBriefIntent(), DAILY_BRIEF_PATTERNS',
      sprint: 'Sprint 592 (DAILY_BRIEF_PATTERNS registry Sprint 966)',
      verbatim: "DAILY_BRIEF_PATTERNS: ['daily brief', 'morning brief', 'brief me', ...]",
    },
  ),

  entry(
    'b1a00000-0002-4000-8000-000000000003',
    'intent',
    'intent.academy_attention',
    'Academy Attention Intent',
    'The director wants to know what is urgent or needs immediate attention across the academy.',
    [
      'what needs attention', 'anything urgent', 'what should i do first',
      'what is urgent', "what's urgent", 'urgent items',
      'needs attention', 'any urgent', 'priority items',
    ],
    ['attention', 'urgent', 'director'],
    ['intent.review_queue', 'intent.today_guidance', 'intent.coo_intelligence'],
    {
      file: 'lib/donna/brain/processDonnaMessage.ts',
      symbol: 'isAttentionPhrase()',
      sprint: 'Sprint 1911–1960',
      verbatim: "lower.includes('what needs attention') || lower.includes('anything urgent')",
    },
  ),

  entry(
    'b1a00000-0002-4000-8000-000000000004',
    'intent',
    'intent.today_guidance',
    'Today Guidance Intent',
    'The director wants DONNA to walk them through ranked priorities for today — more operational than a daily brief, more structured than an open question.',
    [
      'what do i need to do today', 'what should i do today',
      "what's on my list today", 'where should i start today',
      'give me my priorities', 'walk me through today\'s priorities',
      'what needs my attention today',
    ],
    ['today', 'priorities', 'director'],
    ['intent.daily_brief', 'intent.academy_attention'],
    {
      file: 'lib/donna/guidance/donnaTodayGuidanceLoop.ts',
      symbol: 'detectTodayGuidanceQuestion()',
      sprint: 'Sprint 1881 (referenced in processDonnaMessage Step 4)',
      verbatim: "/what (do i|should i) (need to |)do today/.test(t)",
    },
  ),

  entry(
    'b1a00000-0002-4000-8000-000000000005',
    'intent',
    'intent.coo_intelligence',
    'COO Intelligence Intent',
    'The director is asking a structured COO-dimension question about program health, player intelligence, coach intelligence, parent confidence, or director-level decisions.',
    [
      'over capacity', 'under capacity', 'group enrollment',
      'ready to move', 'who is stalled', 'who is accelerating',
      'coach support', 'coach ownership', 'parent gap', 'parent at risk',
      'biggest risk', 'biggest opportunity', 'what would you do as coo',
    ],
    ['coo', 'intelligence', 'director'],
    ['intent.academy_attention', 'intent.today_guidance'],
    {
      file: 'lib/donna/brain/processDonnaMessage.ts',
      symbol: 'isCOOIntelligencePhrase(), Step 7.5',
      sprint: 'Mega Sprint 784–813',
      verbatim: "if (lower.includes('over capacity') || lower.includes('under capacity')) return true",
    },
  ),

  entry(
    'b1a00000-0002-4000-8000-000000000006',
    'intent',
    'intent.continuity',
    'Conversation Continuity Intent',
    'The director wants to continue, resume, or revisit a prior conversation turn or goal session.',
    [
      'continue', 'resume', 'go back', 'what were we doing',
      'where were we', 'let\'s continue', 'pick up where we left off',
      'take me there', 'finish that',
    ],
    ['continuity', 'conversation', 'session'],
    ['intent.today_guidance'],
    {
      file: 'lib/donna/memory/donnaGoalMemory.ts',
      symbol: 'isContinuityPhrase(), CONTINUE_PHRASES, WHAT_WERE_WE_PHRASES',
      sprint: 'Sprint 1831–1860 (extended in Sprint 1911–1960)',
      verbatim: 'allPhrases.some(p => lower === p || lower.startsWith(p))',
    },
  ),

]

// ── Section 3: Decision Rules ─────────────────────────────────────────────────
// Thresholds and enforcement rules already live in AcademyOS runtime code.
// These make the rules explicit so DONNA can cite them in explanations.

const DECISION_RULE_SEED: SeedBrainEntry[] = [

  entry(
    'b1a00000-0003-4000-8000-000000000001',
    'decision_rule',
    'decision_rule.player_stall_medium',
    'Player Medium Stall Threshold',
    'A player who has been at their current curriculum level for 90 or more days without advancing is flagged as medium-severity stall. DONNA surfaces this player as needing director attention.',
    ['player at Orange Ball 2 for 95 days with no advancement — medium stall'],
    ['players', 'progression', 'stall'],
    ['decision_rule.player_stall_high', 'vocabulary.player', 'vocabulary.level'],
    {
      file: 'lib/donna/playerProgressStallDetector.ts',
      symbol: 'STALL_THRESHOLD_MEDIUM_DAYS',
      sprint: 'Sprint 742G',
      verbatim: 'const STALL_THRESHOLD_MEDIUM_DAYS = 90',
    },
  ),

  entry(
    'b1a00000-0003-4000-8000-000000000002',
    'decision_rule',
    'decision_rule.player_stall_high',
    'Player High Stall Threshold',
    'A player who has been at their current curriculum level for 180 or more days without advancing is flagged as high-severity stall. High stall players appear at the top of the attention queue.',
    ['player at Red Ball 1 for 200 days — high stall'],
    ['players', 'progression', 'stall'],
    ['decision_rule.player_stall_medium', 'vocabulary.player', 'vocabulary.level'],
    {
      file: 'lib/donna/playerProgressStallDetector.ts',
      symbol: 'STALL_THRESHOLD_HIGH_DAYS',
      sprint: 'Sprint 742G',
      verbatim: 'const STALL_THRESHOLD_HIGH_DAYS = 180',
    },
  ),

  entry(
    'b1a00000-0003-4000-8000-000000000003',
    'decision_rule',
    'decision_rule.assessment_overdue',
    'Player Assessment Overdue Threshold',
    'A player who has not been formally assessed in 90 or more days is flagged as overdue for assessment. This is a data quality signal surfaced by DONNA in the attention queue.',
    ['player last assessed 95 days ago — assessment overdue'],
    ['assessment', 'players', 'data-quality'],
    ['vocabulary.player', 'decision_rule.player_stall_medium'],
    {
      file: 'lib/donna/dataQualityGuardian.ts',
      symbol: 'overdueCount, 90 days threshold',
      sprint: 'Sprint 914.x (data quality guardian)',
      verbatim: 'have not been formally assessed in the last 90 days.',
    },
  ),

  entry(
    'b1a00000-0003-4000-8000-000000000004',
    'decision_rule',
    'decision_rule.mutation_requires_approval',
    'All Mutations Require Approval',
    'Every data mutation proposed by DONNA — attendance records, parent updates, level flags, curriculum adjustments — must pass through proposed_actions and require explicit director or head coach approval before execute_approved_action() is called. DONNA never writes to core tables directly.',
    [
      'DONNA drafts attendance exception → director reviews → execute_approved_action()',
      'DONNA proposes parent update → director approves → send is triggered',
    ],
    ['safety', 'mutations', 'approval', 'governance'],
    ['vocabulary.proposed_action', 'philosophy.ai_proposes_director_approves'],
    {
      file: 'lib/donna/donnaCommandRouter.ts',
      symbol: 'DonnaRouteResult.requiresDirectorApproval, all routes return proposals',
      sprint: 'Sprint 591 (architecture) + CLAUDE.md red lines',
      verbatim: 'All routes return proposals only — director approves before any action is taken.',
    },
  ),

]

// ── Section 4: Philosophy ─────────────────────────────────────────────────────
// Product operating principles documented in CLAUDE.md and conversation/index.ts.
// These are the non-negotiable principles that govern all of DONNA's reasoning.

const PHILOSOPHY_SEED: SeedBrainEntry[] = [

  entry(
    'b1a00000-0004-4000-8000-000000000001',
    'philosophy',
    'philosophy.voice_creates_ui_confirms',
    'Voice Creates — UI Confirms',
    'The primary input model: voice (or text) generates a draft or intent; the UI presents it for director confirmation; the database records the approved result; the system executes. No step is skipped. Voice never bypasses the confirmation step.',
    ['director speaks → DONNA drafts → director taps Confirm → DB writes → system acts'],
    ['voice', 'operating-model', 'product'],
    ['philosophy.ai_proposes_director_approves', 'decision_rule.mutation_requires_approval'],
    {
      file: 'CLAUDE.md',
      symbol: 'Operating model block',
      sprint: 'Product founding principle',
      verbatim: 'Voice creates → UI confirms → Database structures → System executes',
    },
  ),

  entry(
    'b1a00000-0004-4000-8000-000000000002',
    'philosophy',
    'philosophy.ai_proposes_director_approves',
    'AI Proposes — Director Approves',
    'The governing principle for all DONNA actions: DONNA proposes, the director or head coach approves, the system records, then the system executes. DONNA never makes decisions on behalf of the director. Approval is never bypassed.',
    ['DONNA recommends level change → director approves in review queue → level moves'],
    ['governance', 'operating-model', 'approval'],
    ['philosophy.voice_creates_ui_confirms', 'decision_rule.mutation_requires_approval', 'vocabulary.proposed_action'],
    {
      file: 'CLAUDE.md',
      symbol: 'Core operating model — never violate',
      sprint: 'Product founding principle',
      verbatim: 'AI proposes → Director/Head Coach approves → System records → System executes',
    },
  ),

  entry(
    'b1a00000-0004-4000-8000-000000000003',
    'philosophy',
    'philosophy.data_never_invented',
    'DONNA Never Invents Data',
    'When DONNA does not have sufficient data to answer a question, it explicitly says so and discloses the gap and its confidence level. DONNA never fabricates player names, scores, dates, or signals. All answers cite their source.',
    [
      "DONNA: 'I don't have enough attendance data to give you a reliable answer here.'",
      "DONNA: 'This is based on 3 sessions — confidence is low.'",
    ],
    ['safety', 'data-quality', 'honesty', 'product'],
    ['philosophy.ai_proposes_director_approves'],
    {
      file: 'lib/donna/conversation/index.ts',
      symbol: "DONNA_CONVERSATION_RULES[4]",
      sprint: 'Sprint 462',
      verbatim: "Say \"I don't have enough data\" when uncertain — never invent.",
    },
  ),

]

// ── Assembled seed ────────────────────────────────────────────────────────────

export const INITIAL_BRAIN_SEED: SeedBrainEntry[] = [
  ...VOCABULARY_SEED,
  ...INTENT_SEED,
  ...DECISION_RULE_SEED,
  ...PHILOSOPHY_SEED,
]

// ── Typed subset getters ──────────────────────────────────────────────────────

export function getSeedByType(type: GlobalBrainEntryType): SeedBrainEntry[] {
  return INITIAL_BRAIN_SEED.filter(e => e.type === type)
}

export function getSeedByKey(key: string): SeedBrainEntry | null {
  return INITIAL_BRAIN_SEED.find(e => e.key === key) ?? null
}

// ── Runtime-safe export ───────────────────────────────────────────────────────
// Strip source attribution for runtime consumption — GlobalBrainEntry[] only.

export const INITIAL_BRAIN_ENTRIES: GlobalBrainEntry[] = INITIAL_BRAIN_SEED.map(
  ({ source: _source, ...entry }) => entry,
)

// ── Summary stats (dev/audit use) ─────────────────────────────────────────────

export const INITIAL_BRAIN_STATS = {
  total: INITIAL_BRAIN_SEED.length,
  vocabulary: getSeedByType('vocabulary').length,
  intent: getSeedByType('intent').length,
  decision_rule: getSeedByType('decision_rule').length,
  philosophy: getSeedByType('philosophy').length,
} as const
