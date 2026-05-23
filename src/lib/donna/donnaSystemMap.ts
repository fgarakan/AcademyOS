// Sprint 688 — DONNA System-Aware Academy Map V1
// Pure TS — no DB calls, no API calls, no mutations, no side effects.
// Source of truth for DONNA's understanding of AcademyOS as a connected system.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DonnaModuleDefinition {
  id: string
  label: string
  purpose: string
  userFacingExplanation: string
  directorQuestions: string[]
  safeReadActions: string[]
  reviewRequiredActions: string[]
  blockedActions: string[]
  downstreamEffects: string[]
  connectedModules: string[]
}

// ── Module registry ──────────────────────────────────────────────────────────

export const DONNA_SYSTEM_MAP: DonnaModuleDefinition[] = [
  {
    id: 'director_dashboard',
    label: 'Director Dashboard',
    purpose: 'Academy-wide command center showing today\'s priorities, signals, and pending actions.',
    userFacingExplanation: 'The dashboard is your daily starting point. It shows what needs your attention, how many items are in your review queue, and what the academy\'s health looks like at a glance.',
    directorQuestions: ['What should I do first?', 'What needs attention?', 'How healthy is the academy?'],
    safeReadActions: ['view attention signals', 'view review queue count', 'view recent coach activity'],
    reviewRequiredActions: ['approve pending items', 'publish parent updates'],
    blockedActions: ['mutate records directly from chat', 'send communications without approval'],
    downstreamEffects: ['Opening review items routes to Review Center', 'Signals can trigger coach or parent workflows'],
    connectedModules: ['review_center', 'signals', 'players', 'kpi'],
  },
  {
    id: 'kpi',
    label: 'KPI Dashboard',
    purpose: 'Tracks academy performance metrics: attendance rates, session quality, level movement velocity, parent engagement.',
    userFacingExplanation: 'KPIs show whether the academy is performing well as a system. They\'re derived from attendance records, coach activity, and assessment results — not manually entered.',
    directorQuestions: ['Why is this KPI low?', 'What is a healthy range?', 'What should I do about a bad KPI?'],
    safeReadActions: ['view metric values', 'view trend labels', 'explain what a KPI measures'],
    reviewRequiredActions: ['curriculum changes based on KPI signals', 'coach performance reviews driven by KPIs'],
    blockedActions: ['claim causation without evidence', 'move players based on KPI alone'],
    downstreamEffects: ['Low attendance KPI can surface as signal', 'Level movement rate connects to placement and level-up modules'],
    connectedModules: ['signals', 'players', 'curriculum', 'sessions', 'placement'],
  },
  {
    id: 'attention_queue',
    label: 'Attention Queue / Signals',
    purpose: 'Surfaces real-time alerts and patterns that warrant director awareness or action.',
    userFacingExplanation: 'Signals are generated automatically from attendance, coach notes, and assessment data. They\'re not judgments — they\'re prompts for the director to investigate and decide.',
    directorQuestions: ['What is this signal about?', 'How do I clear a signal?', 'Are these signals connected?'],
    safeReadActions: ['view signal labels', 'view signal urgency', 'explain signal categories'],
    reviewRequiredActions: ['acting on signals that affect player records or parent communications'],
    blockedActions: ['act on signals without review', 'expose signals to parents without approval', 'claim causation from signal correlation'],
    downstreamEffects: ['Investigating a signal may lead to review queue item', 'Cleared signals are logged to audit trail'],
    connectedModules: ['players', 'review_center', 'director_dashboard', 'kpi'],
  },
  {
    id: 'players',
    label: 'Player Directory',
    purpose: 'Central registry of all academy players with development status, level, and recent signals.',
    userFacingExplanation: 'The player directory is the source of truth for who is in the academy, what level they\'re at, and whether they need attention. Each player has a full profile with history.',
    directorQuestions: ['Who needs attention?', 'Who is ready for a level change?', 'Which players haven\'t had a note recently?'],
    safeReadActions: ['view player names', 'view current levels', 'view attention flags', 'view enrollment status'],
    reviewRequiredActions: ['level movement', 'player profile changes', 'parent-visible updates'],
    blockedActions: ['expose sibling data', 'move player levels from chat', 'publish player info externally'],
    downstreamEffects: ['Player changes feed into parent summaries and level-up queue', 'Attendance flags feed into KPI and signals'],
    connectedModules: ['player_profiles', 'level_up', 'placement', 'parent_summaries', 'assessments'],
  },
  {
    id: 'player_profiles',
    label: 'Player Profile',
    purpose: 'Full development history for a single player: notes, assessments, level history, attendance, parent summaries.',
    userFacingExplanation: 'A player profile is the most detailed view in the system. It contains coach observations, assessment scores, level changes, and parent communication history — all behind director-only access controls.',
    directorQuestions: ['What is this player\'s status?', 'Is this player ready for a level change?', 'What does the coach say?'],
    safeReadActions: ['view development stage', 'view level history', 'view attendance summary', 'read coach notes (director view)'],
    reviewRequiredActions: ['parent update publication', 'level movement', 'visibility changes'],
    blockedActions: ['expose raw coach notes to parents', 'move level from chat', 'expose sibling or other player data'],
    downstreamEffects: ['Approved parent updates reach the parent portal', 'Approved level changes trigger parent notification'],
    connectedModules: ['players', 'level_up', 'assessments', 'parent_summaries', 'coach_recaps'],
  },
  {
    id: 'curriculum',
    label: 'Curriculum',
    purpose: 'Academy\'s structured learning framework: levels, blocks, exercises, and skill progressions.',
    userFacingExplanation: 'The curriculum defines what players do in sessions at each level. It\'s the foundation for class templates and coach session planning. Changes here affect all sessions using those templates.',
    directorQuestions: ['What are the curriculum gaps?', 'How does the curriculum map to player levels?', 'What exercises are available?'],
    safeReadActions: ['view curriculum levels', 'view block types', 'view topic coverage', 'view exercise library'],
    reviewRequiredActions: ['curriculum changes', 'level mapping changes', 'publishing curriculum updates'],
    blockedActions: ['mutate curriculum from chat', 'promote global knowledge without platform-owner approval'],
    downstreamEffects: ['Curriculum changes affect all class templates at that level', 'Template changes cascade into session plans'],
    connectedModules: ['sessions', 'class_templates', 'kpi', 'players'],
  },
  {
    id: 'review_center',
    label: 'Review Center',
    purpose: 'Staging area for all pending director approvals: parent updates, level changes, coach communications, curriculum changes.',
    userFacingExplanation: 'Nothing in the review center is live until you approve it. This is where DONNA routes every sensitive action so you can review, modify, or reject it before anything reaches parents or players.',
    directorQuestions: ['What needs approval first?', 'What happens after I approve?', 'Can I modify before approving?'],
    safeReadActions: ['view pending item count', 'view item categories', 'view parent visibility risk flags'],
    reviewRequiredActions: ['every item in this queue — nothing auto-approves'],
    blockedActions: ['auto-approve without review', 'bypass visibility checks', 'send communications before approval'],
    downstreamEffects: ['Approved parent updates are published to the parent portal', 'Approved level changes notify parents and update player records'],
    connectedModules: ['parent_summaries', 'level_up', 'coach_recaps', 'curriculum', 'parent_portal'],
  },
  {
    id: 'coach_recaps',
    label: 'Coach Recaps',
    purpose: 'Post-session notes, observations, and wrap-up summaries created by coaches after each session.',
    userFacingExplanation: 'Coach recaps are the raw input that feeds DONNA\'s intelligence. They\'re written by coaches and reviewed by directors before anything reaches parents. Raw notes never reach the parent portal directly.',
    directorQuestions: ['What did the coach say about this session?', 'What notes need review?', 'Is this note safe to share?'],
    safeReadActions: ['view recap labels', 'view session attendance', 'view whether a recap exists'],
    reviewRequiredActions: ['publishing coach notes to parents', 'converting coach notes to parent summaries'],
    blockedActions: ['expose raw coach notes to parents', 'share unreviewed coach notes', 'attribute coach language in parent-facing content'],
    downstreamEffects: ['Reviewed recaps feed into parent summaries', 'Recap patterns feed into signals and KPI'],
    connectedModules: ['parent_summaries', 'review_center', 'player_profiles', 'sessions', 'signals'],
  },
  {
    id: 'parent_summaries',
    label: 'Parent Summaries / Parent Updates',
    purpose: 'Curated, approved summaries of player progress delivered to parents through the parent portal.',
    userFacingExplanation: 'Parent summaries are director-approved versions of player progress. DONNA can draft them but they go through the review center before reaching any parent. Raw coach notes are never included.',
    directorQuestions: ['What is the last update sent to this parent?', 'Is this summary parent-safe?', 'What should I include in this update?'],
    safeReadActions: ['view whether an update exists', 'view publication dates', 'view approval status'],
    reviewRequiredActions: ['all parent-facing content must be approved before publication'],
    blockedActions: ['publish updates without director approval', 'include raw coach notes', 'expose player medical or private data'],
    downstreamEffects: ['Published summaries appear in the parent portal', 'Parents see only approved content'],
    connectedModules: ['review_center', 'player_profiles', 'parent_portal', 'coach_recaps'],
  },
  {
    id: 'parent_portal',
    label: 'Parent Portal',
    purpose: 'External-facing portal where parents see approved player progress updates, session attendance, and academy communications.',
    userFacingExplanation: 'The parent portal is what parents log into. They see only what has been explicitly approved by the director. DONNA has no direct write access to the parent portal — everything goes through review.',
    directorQuestions: ['What can parents see right now?', 'When was the last update published?', 'What would this parent see if they logged in today?'],
    safeReadActions: ['view publication dates', 'view what content types are visible'],
    reviewRequiredActions: ['all content published to parent portal requires prior director approval'],
    blockedActions: ['publish to parent portal from chat', 'expose raw data', 'share sibling data across portal accounts'],
    downstreamEffects: ['Director-approved summaries appear here automatically after approval'],
    connectedModules: ['parent_summaries', 'review_center'],
  },
  {
    id: 'player_portal',
    label: 'Player Portal',
    purpose: 'Player-facing view showing their current missions, badges, session history, and progress.',
    userFacingExplanation: 'Players see their own progress, missions, and badges through the player portal. Directors control what is visible. No raw coach notes or other player\'s data appears here.',
    directorQuestions: ['What can this player see right now?', 'When were their missions last updated?', 'How do badges connect to the curriculum?'],
    safeReadActions: ['view what mission/badge types are active', 'view portal configuration'],
    reviewRequiredActions: ['changing what is visible to players', 'publishing new missions or badges'],
    blockedActions: ['expose other players\' data', 'publish without approval', 'change video visibility from chat'],
    downstreamEffects: ['Approved content changes appear to the player immediately after publishing'],
    connectedModules: ['missions', 'badges', 'player_profiles'],
  },
  {
    id: 'missions',
    label: 'Missions',
    purpose: 'Goal-based challenges assigned to players to reinforce curriculum objectives.',
    userFacingExplanation: 'Missions are structured goals tied to the curriculum. When a player completes a mission, it can trigger a badge and feeds into their development record.',
    directorQuestions: ['How do missions connect to the curriculum?', 'How does a player complete a mission?', 'What triggers a badge?'],
    safeReadActions: ['view mission types', 'view completion requirements', 'view curriculum connections'],
    reviewRequiredActions: ['creating new missions', 'assigning missions to players'],
    blockedActions: ['assign missions without curriculum alignment', 'create missions that expose other players\' data'],
    downstreamEffects: ['Mission completion can unlock badges', 'Completed missions feed into player development records'],
    connectedModules: ['badges', 'curriculum', 'player_profiles', 'player_portal'],
  },
  {
    id: 'badges',
    label: 'Badges',
    purpose: 'Recognition markers awarded to players on mission completion or milestone achievement.',
    userFacingExplanation: 'Badges are the visible reward layer on top of missions and curriculum milestones. They appear in the player portal and can be shared with parents.',
    directorQuestions: ['How are badges earned?', 'Can parents see badges?', 'How do badges connect to the curriculum?'],
    safeReadActions: ['view badge types', 'view award criteria', 'view which players have earned badges'],
    reviewRequiredActions: ['creating new badge types', 'awarding badges outside normal automation'],
    blockedActions: ['award badges bypassing mission completion', 'share badge data with non-authorized users'],
    downstreamEffects: ['Awarded badges appear in player portal and optionally in parent summaries'],
    connectedModules: ['missions', 'player_portal', 'parent_summaries', 'curriculum'],
  },
  {
    id: 'assessments',
    label: 'Assessments',
    purpose: 'Structured evaluations of player skills used for placement, level movement, and development tracking.',
    userFacingExplanation: 'Assessments are formal skill evaluations that produce placement recommendations or level-readiness signals. They\'re not subjective — they follow a defined rubric for each level.',
    directorQuestions: ['What does this assessment result mean?', 'How does an assessment lead to placement?', 'Can I override an assessment?'],
    safeReadActions: ['view assessment types', 'view result summaries', 'view rubric descriptions'],
    reviewRequiredActions: ['using assessments to trigger level movement', 'overriding recommendations'],
    blockedActions: ['expose raw assessment scores to parents without review', 'skip assessment before placement'],
    downstreamEffects: ['Assessment results feed into placement recommendations and level-up signals'],
    connectedModules: ['placement', 'level_up', 'player_profiles', 'kpi'],
  },
  {
    id: 'placement',
    label: 'Placement',
    purpose: 'Entry-level process for new players: assessment → recommendation → director approval → activation.',
    userFacingExplanation: 'Placement is how new players enter the academy at the right level. It starts with an assessment, generates a recommendation, and requires director approval before the player is activated.',
    directorQuestions: ['Who is in the placement queue?', 'How does placement work?', 'Can I override a placement?'],
    safeReadActions: ['view pending placements', 'view assessment results', 'view recommended levels'],
    reviewRequiredActions: ['confirming placements', 'activating players (only via finalize_player_placement())'],
    blockedActions: ['activate players bypassing finalize_player_placement()', 'skip assessment', 'place without evidence'],
    downstreamEffects: ['Confirmed placement activates the player record and triggers parent welcome communication'],
    connectedModules: ['assessments', 'player_profiles', 'players', 'parent_summaries'],
  },
  {
    id: 'level_up',
    label: 'Level Movement',
    purpose: 'Structured process for moving active players to a new level based on readiness signals and director approval.',
    userFacingExplanation: 'Level movement is a deliberate process. DONNA surfaces readiness signals from assessments, attendance, and coach notes — but the director makes the final call. Once approved, the player\'s level changes and parents are notified.',
    directorQuestions: ['Who is ready for a level change?', 'What evidence is there?', 'What happens after I approve?'],
    safeReadActions: ['view readiness signals', 'view coach recommendations', 'view level history'],
    reviewRequiredActions: ['all level movements — no auto-movement from chat'],
    blockedActions: ['move player level directly from chat', 'notify parents before director approval', 'skip evidence review'],
    downstreamEffects: ['Approved level movement updates player record, triggers parent notification, feeds KPI'],
    connectedModules: ['player_profiles', 'assessments', 'review_center', 'parent_summaries', 'kpi'],
  },
  {
    id: 'voice_assistant',
    label: 'DONNA Voice Assistant',
    purpose: 'Voice-capable COO assistant for the director — persistent, page-aware, review-first.',
    userFacingExplanation: 'DONNA is your always-available COO assistant. She understands the current page, can answer questions, draft proposals, and route sensitive actions through the review center. She never mutates records directly from conversation.',
    directorQuestions: ['What can DONNA do?', 'Is DONNA safe?', 'How does DONNA route sensitive requests?'],
    safeReadActions: ['answer questions', 'explain the system', 'draft proposals for review', 'surface attention items'],
    reviewRequiredActions: ['all mutations DONNA proposes go through review center'],
    blockedActions: ['direct record mutation', 'publishing to parents without approval', 'accessing another academy\'s data'],
    downstreamEffects: ['DONNA-drafted items route to review center before any effect', 'DONNA tracks last safe prompt for session continuity'],
    connectedModules: ['review_center', 'director_dashboard', 'player_profiles', 'curriculum'],
  },
  {
    id: 'demo_data',
    label: 'Demo / Seed Data',
    purpose: 'Pre-loaded demonstration data for testing and presenting AcademyOS without real player records.',
    userFacingExplanation: 'Demo data is used to show how AcademyOS works before real academy data is imported. It is not real — never treat demo data as authoritative, and never expose it as real to parents or players.',
    directorQuestions: ['Is this real data or demo?', 'How do I tell the difference?', 'What should I test first?'],
    safeReadActions: ['view demo players', 'view demo sessions', 'view demo reports'],
    reviewRequiredActions: [],
    blockedActions: ['present demo data as real to parents or players', 'make production decisions based on demo data'],
    downstreamEffects: ['Demo data flows through the same pipelines as real data for testing purposes'],
    connectedModules: ['players', 'sessions', 'assessments', 'review_center'],
  },
]

// ── Lookup ─────────────────────────────────────────────────────────────────────

export function getModuleDefinition(moduleId: string): DonnaModuleDefinition | null {
  return DONNA_SYSTEM_MAP.find(m => m.id === moduleId) ?? null
}

export function getAllModuleIds(): string[] {
  return DONNA_SYSTEM_MAP.map(m => m.id)
}

export function getConnectedModules(moduleId: string): DonnaModuleDefinition[] {
  const module = getModuleDefinition(moduleId)
  if (!module) return []
  return module.connectedModules
    .map(id => getModuleDefinition(id))
    .filter((m): m is DonnaModuleDefinition => m !== null)
}

// ── System-level question answering ──────────────────────────────────────────

export function howDoesThisSystemWork(): string {
  return `AcademyOS works as a connected director-led system:

1. **Players** are assessed and placed at the right level.
2. **Coaches** run sessions, capture recaps, and flag observations.
3. **DONNA** surfaces attention signals and drafts proposals.
4. **The director** reviews and approves everything before it takes effect.
5. **Approved items** flow to the parent portal, player portal, or player records.

Nothing reaches parents or players without explicit director approval. Every sensitive action goes through the Review Center.`
}

export function whatIsConnectedToPlayerProgress(): string {
  return `Player progress connects: **Assessments** (evidence) → **Coach Recaps** (ongoing observations) → **Signals** (DONNA-surfaced attention items) → **Level-Up** (director-approved movement) → **Parent Summaries** (approved communications) → **Parent Portal** (what parents see).

KPIs are derived from this chain. Missions and Badges can also reflect progress milestones.`
}

export function whatHappensAfterCoachRecap(): string {
  return `After a coach completes a recap:
1. The session is marked complete.
2. Any observations feed into the player\'s development record.
3. DONNA may surface an attention signal if something warrants director awareness.
4. If the director wants to share progress with parents, a parent summary is drafted and routed to the Review Center.
5. The director approves the summary before it reaches the parent portal.

Raw recap text never reaches parents directly.`
}

export function howDoesParentUpdateGetApproved(): string {
  return `A parent update follows this path:
1. A coach recap or signal triggers the need for an update.
2. DONNA drafts a parent-safe summary (no raw coach notes, no private data).
3. The draft goes to the **Review Center** as a pending item.
4. The director reviews, edits if needed, and approves.
5. After approval, the update is published to the **Parent Portal**.

Nothing is sent to parents without step 4.`
}

export function howDoMissionsAndBadgesConnectToCurriculum(): string {
  return `Missions are created from curriculum objectives — they translate curriculum goals into player-facing challenges. When a player completes a mission, it signals curriculum mastery at that point.

Badges are the recognition layer: completing a mission can award a badge that appears in the player portal. This creates a visible feedback loop: Curriculum → Mission → Badge → Player Portal.

Directors can see which curriculum objectives are covered by active missions, and which are not yet represented.`
}

export function whatShouldITestFirst(): string {
  return `For a first test of AcademyOS:
1. Open the **Director Dashboard** — check what signals and review items appear.
2. Navigate to **Players** — look at a sample player profile.
3. Open **DONNA** and ask "What needs attention?" to see how she surfaces priorities.
4. Go to the **Review Center** — see how pending items are presented.
5. Try asking DONNA: "Draft a parent update" — observe how she routes it without publishing.

Avoid testing live parent communications or level movements until you\'ve reviewed demo data carefully.`
}
