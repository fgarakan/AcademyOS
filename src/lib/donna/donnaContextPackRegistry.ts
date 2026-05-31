// Sprint 1072 — DONNA Context Pack Architecture V1
//
// Additive enrichment layer on top of the existing page context registry
// (donnaPageContextRegistry.ts) and page capability map (donnaPageContextEngine.ts).
//
// Context packs provide structured, per-page intelligence that the existing systems lack:
//   - keyMetrics: what numbers DONNA should understand on this page
//   - commonQuestions: questions directors typically ask here
//   - commonCommands: navigation/action commands mapped to routes
//   - exampleAnswers: direct Q&A pairs for fast deterministic answering
//   - neverDoRules: structured prohibitions with explicit reasoning
//   - relatedRoutes: navigation graph for context-aware routing
//   - missingDataFallback: what DONNA says when data is not yet loaded
//
// Pure TypeScript — no DB calls, no API calls, no mutations, no side effects.
// Safe to import from any client or server context.
//
// Future wiring: getDonnaContextPackForRoute() + lookupAnswerInContextPack() can be
// called from handleDonnaCooPrompt in DonnaAssistantButton before the intent classifier
// for fast, zero-latency deterministic answers. Not wired in this sprint.

// ── Role type ─────────────────────────────────────────────────────────────────

export type DonnaContextPackRole =
  | 'academy_director'
  | 'head_coach'
  | 'coach'
  | 'player'
  | 'parent'

// ── Core interfaces ───────────────────────────────────────────────────────────

/**
 * A matched Q&A pair. DONNA returns `response` when any `trigger` phrase
 * is found in the director's input (case-insensitive substring match).
 */
export interface DonnaContextPackAnswer {
  /** Phrases that activate this answer — case-insensitive substring match */
  triggers: string[]
  /** DONNA's response text (markdown supported) */
  response: string
  /** Optional: route to navigate to after answering */
  nextStepHref?: string
  /** Optional: label for the next step link */
  nextStepLabel?: string
}

/**
 * A structured rule for what DONNA must never do on a given page.
 * `reason` is required — it enables future guards to explain refusals.
 */
export interface DonnaContextPackNeverDoRule {
  /** What action is forbidden */
  action: string
  /** Why it is forbidden — must be a product or safety reason, not a vague disclaimer */
  reason: string
}

/**
 * DONNA Context Pack — structured per-page intelligence for a director-facing route.
 *
 * Design rules:
 * - availableData: things the server component actually renders — never speculate
 * - keyMetrics: metrics a director would ask DONNA to explain — link to what is visible
 * - exampleAnswers: direct Q&A pairs — never fake data, never claim numbers from DB
 * - neverDoRules: product guardrails — enforce the "AI proposes, director approves" model
 * - missingDataFallback: honest, never implies data exists when it does not
 */
export interface DonnaContextPack {
  /** Primary route this pack covers. Use [param] for dynamic segments. */
  route: string
  /** Human-readable page name shown to directors */
  pageName: string
  /** Roles for which this pack is relevant */
  roles: DonnaContextPackRole[]
  /** One-sentence purpose of this page */
  pagePurpose: string
  /** Data actually rendered by the server component on this page */
  availableData: string[]
  /** Key metrics visible on this page with their definitions */
  keyMetrics: Array<{
    id: string
    label: string
    description: string
  }>
  /** Common questions directors ask when on this page */
  commonQuestions: string[]
  /** Common navigation and action commands with optional routes */
  commonCommands: Array<{
    phrase: string
    action: string
    route?: string
  }>
  /** What DONNA can safely do on this page */
  safeActions: string[]
  /** Actions that require explicit director approval before taking effect */
  approvalRequiredActions: string[]
  /** Things DONNA must never do on this page */
  neverDoRules: DonnaContextPackNeverDoRule[]
  /** Related routes for context-aware navigation suggestions */
  relatedRoutes: Array<{
    label: string
    route: string
  }>
  /** Direct Q&A pairs for common questions — checked before intent classifier */
  exampleAnswers: DonnaContextPackAnswer[]
  /** What DONNA says when page data is not yet loaded */
  missingDataFallback: string
}

// ── Context pack registry ─────────────────────────────────────────────────────

export const DONNA_CONTEXT_PACKS: DonnaContextPack[] = [

  // ── Today (Director Dashboard) ────────────────────────────────────────────
  {
    route: '/director',
    pageName: 'Today',
    roles: ['academy_director'],
    pagePurpose: 'Daily command center. Shows pending review items, session activity, attention signals, and daily brief. The director\'s primary entry point each morning.',
    availableData: [
      'pending review items count',
      'today\'s sessions count',
      'attention signal flags',
      'coach wrap-up coverage',
      'player risk flags',
      'academy setup progress',
    ],
    keyMetrics: [
      {
        id: 'pending_reviews',
        label: 'Pending Reviews',
        description: 'Items in the review queue waiting for director approval. Nothing here has taken effect yet.',
      },
      {
        id: 'sessions_today',
        label: 'Sessions Today',
        description: 'Scheduled sessions running today across all groups.',
      },
      {
        id: 'attention_signals',
        label: 'Attention Signals',
        description: 'Players or groups flagged for director awareness — absence risk, long level tenure, or curriculum gaps.',
      },
      {
        id: 'wrap_up_coverage',
        label: 'Wrap-Up Coverage',
        description: 'Recent sessions that have a submitted coach wrap-up. Low coverage means coaches need a follow-up.',
      },
    ],
    commonQuestions: [
      'What needs my attention today?',
      'What is in my review queue?',
      'What should I focus on first?',
      'Give me a daily brief.',
      'What sessions are running today?',
      'Are there any urgent items?',
      'What did coaches do this week?',
    ],
    commonCommands: [
      { phrase: 'open approvals', action: 'Navigate to Approvals', route: '/director/review' },
      { phrase: 'go to approvals', action: 'Navigate to Approvals', route: '/director/review' },
      { phrase: 'open players', action: 'Navigate to Players', route: '/director/players' },
      { phrase: 'go to sessions', action: 'Navigate to Sessions', route: '/director/sessions' },
      { phrase: 'academy health', action: 'Navigate to Academy Health', route: '/director/kpi' },
      { phrase: 'daily brief', action: 'Fetch and display daily brief' },
      { phrase: 'what needs attention', action: 'Fetch attention report' },
    ],
    safeActions: [
      'Summarise pending review queue count and categories',
      'Explain any attention signal label',
      'Describe today\'s session activity',
      'Generate a daily brief from live data',
      'Navigate to any section from this page',
    ],
    approvalRequiredActions: [
      'Approve pending coach wrap-ups',
      'Approve attendance exceptions',
      'Approve player level movements',
      'Approve parent communications',
    ],
    neverDoRules: [
      {
        action: 'Auto-approve any review item from the dashboard',
        reason: 'Every consequential action requires explicit director approval — there is no safe auto-approval path in the operating model.',
      },
      {
        action: 'Move a player level from the Today view',
        reason: 'Level changes require evidence review and go through the proposed_actions pipeline from a specific player profile or Level Up queue.',
      },
      {
        action: 'Send a parent message directly from this page',
        reason: 'Parent communications must be drafted, reviewed, and approved before delivery. The Today view is read-only for parent data.',
      },
    ],
    relatedRoutes: [
      { label: 'Approvals', route: '/director/review' },
      { label: 'Academy Health', route: '/director/kpi' },
      { label: 'Players', route: '/director/players' },
      { label: 'Sessions', route: '/director/sessions' },
      { label: 'Parent Updates', route: '/director/parents' },
    ],
    exampleAnswers: [
      {
        triggers: ['what needs attention', 'what should i focus', 'most urgent', 'biggest priority', 'what should i do first'],
        response: 'Start with your review queue — items there affect players, parents, and sessions once approved. Then check attention signals for any players with attendance gaps or long time in level. Your daily brief gives a full summary of what has happened since your last session.',
        nextStepHref: '/director/review',
        nextStepLabel: 'Open Approvals',
      },
      {
        triggers: ['daily brief', 'brief me', 'what happened today', 'catch me up', 'what\'s new', 'whats new'],
        response: 'Your daily brief covers: pending review items, sessions running today, coaches who submitted wrap-ups, and any player attention flags. Tap the "Daily Brief" chip above to generate it from live data.',
      },
      {
        triggers: ['what is in my review queue', 'what needs approval', 'pending items', 'what is pending'],
        response: 'Your review queue holds every proposed change waiting for your decision — coach wrap-ups, attendance exceptions, curriculum adjustments, and level movement proposals. Nothing in the queue has taken effect. Open Approvals to review each item.',
        nextStepHref: '/director/review',
        nextStepLabel: 'Open Approvals',
      },
    ],
    missingDataFallback: 'Dashboard data may not be loaded yet. I can explain what each section does. Start with the Approvals chip, or ask "What needs attention?"',
  },

  // ── Approvals (Review Queue) ──────────────────────────────────────────────
  {
    route: '/director/review',
    pageName: 'Approvals',
    roles: ['academy_director'],
    pagePurpose: 'Review and approval center. Every proposed change — coach wrap-ups, attendance exceptions, level movements, curriculum adjustments, parent updates — is held here until the director explicitly approves, rejects, or defers it. Nothing takes effect until the director acts.',
    availableData: [
      'pending item count by category',
      'item age (days pending)',
      'parent visibility risk flags',
      'submitting coach or system source',
      'item type: wrap-up / attendance / level movement / curriculum / parent update',
      'approval and apply status history',
    ],
    keyMetrics: [
      {
        id: 'pending_total',
        label: 'Pending Items',
        description: 'Total items waiting for director decision. Zero means the queue is clear.',
      },
      {
        id: 'parent_visible_risk',
        label: 'Parent-Visible Risk',
        description: 'Items that will affect parent-facing content once approved. Review these first.',
      },
      {
        id: 'oldest_item_days',
        label: 'Oldest Item Age',
        description: 'Days the longest-waiting item has been pending. Items beyond 7 days should be resolved.',
      },
    ],
    commonQuestions: [
      'What should I review first?',
      'Which items have parent visibility risk?',
      'What happens after I approve something?',
      'What is the difference between approve and apply?',
      'Can I reject without a reason?',
      'How do I see all wrap-ups?',
      'What is an attendance exception?',
      'How many items are pending?',
    ],
    commonCommands: [
      { phrase: 'show wrap-ups', action: 'Switch to wrap-up tab' },
      { phrase: 'show attendance exceptions', action: 'Switch to attendance tab' },
      { phrase: 'show level movements', action: 'Switch to level movement tab' },
      { phrase: 'go to today', action: 'Navigate to Today', route: '/director' },
      { phrase: 'open players', action: 'Navigate to Players', route: '/director/players' },
    ],
    safeActions: [
      'Explain what any review item type means',
      'Describe the impact of approving a specific item type',
      'Summarise the pending queue by category',
      'Explain the difference between approve and apply',
      'Explain the parent visibility risk flag',
    ],
    approvalRequiredActions: [
      'Every item in this queue requires explicit director approval — this IS the approval page',
      'Approve a coach wrap-up to mark it reviewed',
      'Apply an approved wrap-up to write session notes to the database (separate step)',
      'Approve a level movement proposal before any level change takes effect',
      'Approve a parent update before it becomes visible to parents',
    ],
    neverDoRules: [
      {
        action: 'Auto-approve items without director review',
        reason: 'The review queue is the safety layer between proposed changes and live data. Auto-approval bypasses the core "AI proposes, director approves" operating model.',
      },
      {
        action: 'Skip parent-visible items without checking the visibility risk flag',
        reason: 'Parent-visible items affect what families see. Approving without review can expose unintended content.',
      },
      {
        action: 'Apply an item before it is approved',
        reason: 'Apply executes the database change. Approval must precede apply — these are two intentionally separate steps.',
      },
      {
        action: 'Expose raw coach notes to parents through any item in the review queue',
        reason: 'Coach notes are director-visible only. Parent updates use a separate curated path with parent-safe rules applied.',
      },
    ],
    relatedRoutes: [
      { label: 'Today', route: '/director' },
      { label: 'Players', route: '/director/players' },
      { label: 'Level Up Review', route: '/director/level-up' },
      { label: 'Sessions', route: '/director/sessions' },
      { label: 'Parent Updates', route: '/director/parents' },
    ],
    exampleAnswers: [
      {
        triggers: ['what should i review first', 'where to start', 'highest priority', 'most urgent', 'which item first'],
        response: 'Start with items marked with a parent-visibility risk flag — these affect what families see once approved. Then handle attendance exceptions (time-sensitive for accuracy), then coach wrap-ups, then level movement proposals. Items older than 7 days should be resolved regardless of type.',
      },
      {
        triggers: ['what happens after i approve', 'difference between approve and apply', 'approve vs apply', 'after approval'],
        response: 'Approve records your decision — nothing changes in the database yet. Apply executes the approved action (writes session notes, records attendance, etc.). This two-step design means you can review and approve in bulk, then apply when ready. No data changes mid-session.',
      },
      {
        triggers: ['what is an attendance exception', 'attendance exception mean'],
        response: 'An attendance exception is a proposed attendance change that could not be recorded automatically — an unrostered attendee, a late arrival, or a contested absence. Review the player name, session, and reason. Approve to accept it or reject to dismiss it. Approved exceptions are applied when you click Apply.',
      },
      {
        triggers: ['can i reject without a reason', 'do i need to explain rejection', 'rejection reason'],
        response: 'You can reject without adding a reason, but a short note helps coaches understand what to change. Rejection does not delete the item — it moves it to rejected status so both you and the coach have a record of the decision.',
      },
    ],
    missingDataFallback: 'Review queue data may not be loaded yet. Nothing in this queue has taken effect — all items require your explicit decision. I can explain how the approval process works while data loads.',
  },

  // ── Academy Health (KPI Dashboard) ───────────────────────────────────────
  // Sprint 1071 intercept in handleDonnaCooPrompt already handles health questions live.
  // This pack formalises the canonical answer definition and adds related Q&A.
  {
    route: '/director/kpi',
    pageName: 'Academy Health',
    roles: ['academy_director'],
    pagePurpose: 'Academy-wide health dashboard. Three headline signals — active players, advancement readiness, and attention signals — plus a per-player KPI table showing time in level and absences. All data is live from the database.',
    availableData: [
      'active players count (from players table, is_active=true)',
      'advancement ready count (player_curriculum_states.advancement_eligible)',
      'attention signals count (absences ≥2 OR days in level ≥180)',
      'per-player: time in level (days since enrolled_at)',
      'per-player: absences in last 30 days (session_attendance)',
      'per-player: advancement eligible flag',
      'data provenance labels (Time in Level = live; Absences = demo)',
    ],
    keyMetrics: [
      {
        id: 'active_players',
        label: 'Active Players',
        description: 'Total enrolled players. The base denominator for all other KPI calculations.',
      },
      {
        id: 'advancement_ready',
        label: 'Advancement Ready',
        description: 'Players with the curriculum advancement_eligible flag set. Non-zero means the Level Up queue has items to review.',
      },
      {
        id: 'attention_signals',
        label: 'Attention Signals',
        description: 'Players with 2+ absences in 30 days OR 180+ days in current level. Each is directly actionable.',
      },
      {
        id: 'time_in_level',
        label: 'Time in Level',
        description: 'Days since the player enrolled at their current curriculum level. >180 days triggers a flag; >120 days triggers a watch.',
      },
      {
        id: 'absences_30d',
        label: 'Absences 30d',
        description: 'Count of explicitly marked absences in the last 30 days. Unmarked sessions are not counted — this is a known demo limitation.',
      },
    ],
    commonQuestions: [
      'Tell me about the health of my academy.',
      'How is my academy doing?',
      'Explain these KPIs.',
      'Which KPI needs attention?',
      'What do these signals mean?',
      'What should I do about attention signals?',
      'Why is time in level important?',
      'What does advancement ready mean?',
      'How do I act on an attention signal?',
    ],
    commonCommands: [
      { phrase: 'open approvals', action: 'Navigate to Approvals', route: '/director/review' },
      { phrase: 'go to approvals', action: 'Navigate to Approvals', route: '/director/review' },
      { phrase: 'open players', action: 'Navigate to Players', route: '/director/players' },
      { phrase: 'level up', action: 'Navigate to Level Up Review', route: '/director/level-up' },
      { phrase: 'go to sessions', action: 'Navigate to Sessions', route: '/director/sessions' },
    ],
    safeActions: [
      'Explain what each KPI signal means and what it measures',
      'Describe what healthy values look like for each metric',
      'Explain the data sources and provenance labels',
      'Identify which signals warrant director action',
      'Navigate to the player directory or Level Up queue to act on signals',
    ],
    approvalRequiredActions: [
      'Level movement based on advancement readiness signal (Level Up queue)',
      'Parent notification about attendance concerns (Parent Updates page)',
      'Curriculum adjustment driven by KPI data (Review queue)',
    ],
    neverDoRules: [
      {
        action: 'Move a player level based on KPI signals alone',
        reason: 'KPI signals are indicators, not decisions. Level movement requires coach notes, assessment evidence, and explicit director approval in the Level Up queue.',
      },
      {
        action: 'Contact a parent about an absence without director review',
        reason: 'Parent communications must be drafted, reviewed, and approved — never triggered automatically from a KPI signal.',
      },
      {
        action: 'Claim trend attribution without evidence',
        reason: 'Absence count and time-in-level are point-in-time snapshots, not causal analysis. DONNA never implies causation from KPI correlation.',
      },
    ],
    relatedRoutes: [
      { label: 'Players', route: '/director/players' },
      { label: 'Level Up Review', route: '/director/level-up' },
      { label: 'Approvals', route: '/director/review' },
      { label: 'Today', route: '/director' },
      { label: 'Sessions', route: '/director/sessions' },
    ],
    exampleAnswers: [
      {
        triggers: [
          'health of my academy', 'health of the academy', 'how is my academy', 'how is the academy doing',
          'tell me about the health', 'how healthy is', 'overall health', 'explain these kpis',
          'what do these kpis', 'what do the kpis', 'academy health', 'health score',
        ],
        response:
          'Your Academy Health dashboard shows three headline signals:\n\n' +
          '**Active Players** — your total enrolled roster. This is the base for all other measurements.\n\n' +
          '**Advancement Ready** — players whose curriculum flag is set for level advancement. ' +
          'If this count is above zero, open the Level Up queue to review evidence before approving movement.\n\n' +
          '**Attention Signals** — players with 2 or more absences in the last 30 days, or 180+ days in a curriculum level. ' +
          'Each signal is directly actionable: open the player directory to see who needs a follow-up.\n\n' +
          'The table below lists per-player indicators. Red or orange values are where to focus first. ' +
          'Absences are based on explicitly marked sessions only — unmarked sessions are not counted.',
        nextStepHref: '/director/players',
        nextStepLabel: 'View Players',
      },
      {
        triggers: ['what should i do about attention signals', 'how do i act on', 'attention signal means'],
        response: 'Each attention signal maps to a player. Open that player\'s profile to see their absence history or time-in-level context. From the profile you can draft a coach note, propose a level review, or start a parent update — all go through the review queue before taking effect.',
        nextStepHref: '/director/players',
        nextStepLabel: 'View Players',
      },
      {
        triggers: ['what does advancement ready mean', 'advancement ready', 'how do i advance a player'],
        response: 'Advancement Ready means the player\'s curriculum state has the advancement_eligible flag set — typically set after assessment evidence meets the level threshold. To act on it, go to the Level Up queue and review the evidence there. You approve or defer the movement explicitly.',
        nextStepHref: '/director/level-up',
        nextStepLabel: 'Level Up Review',
      },
      {
        triggers: ['why is time in level important', 'time in level', 'what does time in level mean'],
        response: 'Time in Level measures how long a player has been enrolled at their current curriculum level. 180+ days is a flag — it signals the player may be ready to advance or may need a reassessment conversation with their coach. It is a leading indicator, not a decision: review the player profile before acting.',
      },
    ],
    missingDataFallback: 'KPI data may not be loaded yet. The three signals — Active Players, Advancement Ready, and Attention Signals — are computed from session attendance and curriculum state records. I can explain what each means while data loads.',
  },

  // ── Fitness Builder ───────────────────────────────────────────────────────
  {
    route: '/director/fitness/templates/[templateId]',
    pageName: 'Fitness Builder',
    roles: ['academy_director', 'head_coach'],
    pagePurpose: 'Build and review fitness training templates. Each template contains exercise blocks targeting physical attributes — mobility, strength, speed, coordination, recovery, tennis transfer. Director assigns exercises per block and reviews load appropriateness before the template is used in sessions.',
    availableData: [
      'template name and target curriculum level',
      'block list with type, duration, intensity tag',
      'exercises assigned per block',
      'load check flags (Red Ball / Orange Ball age-appropriate warnings)',
      'tennis transfer connection labels',
      'stepper progress (class goal → level → session flow → load check → publish)',
    ],
    keyMetrics: [
      {
        id: 'block_count',
        label: 'Blocks',
        description: 'Number of exercise blocks. A typical 45-min template has 4–6 blocks.',
      },
      {
        id: 'total_duration',
        label: 'Total Duration (min)',
        description: 'Sum of all block durations. Should match your target session length.',
      },
      {
        id: 'load_flags',
        label: 'Load Flags',
        description: 'Blocks with age-inappropriate load intensity for the target curriculum level. Red = Review Load; Orange = Caution.',
      },
      {
        id: 'exercises_assigned',
        label: 'Exercises Assigned',
        description: 'Total exercises across all blocks. Empty blocks trigger a session flow flag.',
      },
    ],
    commonQuestions: [
      'Make this more game-based.',
      'Is this appropriate for Red Ball players?',
      'What exercises should I add to this block?',
      'How should I structure a 45-minute session?',
      'Which block should come first?',
      'What does a load flag mean?',
      'How do I add exercises?',
      'How does this connect to tennis skill development?',
      'What is the right intensity for this age group?',
    ],
    commonCommands: [
      { phrase: 'go to sessions', action: 'Navigate to Sessions', route: '/director/sessions' },
      { phrase: 'open approvals', action: 'Navigate to Approvals', route: '/director/review' },
      { phrase: 'go to fitness templates', action: 'Navigate to Fitness Templates', route: '/director/fitness/templates' },
      { phrase: 'go to class templates', action: 'Navigate to Class Templates', route: '/director/class-templates' },
    ],
    safeActions: [
      'Suggest appropriate exercises for a block type and target level',
      'Explain what each block type is for',
      'Review block sequencing for a given session duration',
      'Explain what a load flag means and how to resolve it',
      'Suggest block structure adjustments for a given age group and training goal',
      'Explain how fitness blocks connect to on-court tennis skill development',
    ],
    approvalRequiredActions: [
      'Save template changes (on-screen Save button — not via DONNA chat)',
      'Assign template to a session (session creation flow)',
      'Publish template for coaches to use in sessions',
    ],
    neverDoRules: [
      {
        action: 'Directly save or modify template blocks from DONNA chat',
        reason: 'Block mutations go through the on-screen builder UI so the director can review the full structure before saving.',
      },
      {
        action: 'Assign a fitness template to a live session without director action',
        reason: 'Session assignment must be an explicit director or head coach decision made through the session creation flow.',
      },
      {
        action: 'Use Red Ball-only exercises in Orange Ball+ templates without flagging the load mismatch',
        reason: 'Age-appropriate load intensity must be preserved. Load flags exist precisely to catch this — they require director confirmation before the template is saved.',
      },
    ],
    relatedRoutes: [
      { label: 'Fitness Templates', route: '/director/fitness/templates' },
      { label: 'Class Templates', route: '/director/class-templates' },
      { label: 'Sessions', route: '/director/sessions' },
      { label: 'Curriculum', route: '/director/curriculum' },
    ],
    exampleAnswers: [
      {
        triggers: ['make this more game-based', 'more game-based', 'add game elements', 'game like', 'game situation', 'game scenarios'],
        response:
          'To make this fitness template more game-based, focus on blocks that simulate match movement and decision patterns:\n\n' +
          '1. **Replace isolated drills with competitive movement challenges** — reaction starts, first-step split-step patterns, and directional change drills under time pressure replicate match movement without sacrificing fitness load.\n\n' +
          '2. **Add a Fitness Games block** — movement relays, agility tag circuits, and reaction cone games train the same physical attributes as drill-based blocks but with competitive engagement built in.\n\n' +
          '3. **Use cooperative pressure progressions** — shadow drills that mirror a rally partner\'s movement, or feeding patterns that simulate net approach and recovery, bridge fitness to match situations.\n\n' +
          '4. **Tennis Transfer block** — if not already included, a dedicated tennis-transfer block at the end connects the physical work directly to on-court skill. Even 8–10 minutes of structured point play after a fitness session anchors the athletic training.\n\n' +
          'Use the block controls on-screen to add, reorder, or adjust block types. Save when the structure looks right.',
      },
      {
        triggers: ['what does a load flag mean', 'load flag', 'red flag on block', 'orange flag block', 'review load'],
        response: 'A load flag means a block contains exercise intensity that may not be appropriate for the template\'s target age group. **Red (Review Load)** flags plyometrics, sprint work, or heavy resistance exercises for Red Ball (under-8) players — these require director confirmation. **Orange (Caution)** flags the same for Orange Ball players and recommends modification. Review the flagged block, swap the exercise or reduce intensity, and confirm before saving.',
      },
      {
        triggers: ['how should i structure', 'what order should blocks', 'block sequence', 'block order', 'typical structure'],
        response:
          'A standard 45-minute fitness session block sequence:\n\n' +
          '1. **Warm-Up** (5–8 min) — dynamic movement, joint mobility, light activation\n' +
          '2. **Activation / Coordination** (8–10 min) — ladder work, coordination patterns, reaction starts\n' +
          '3. **Primary Work** (15–18 min) — the main physical attribute (speed, strength, agility)\n' +
          '4. **Tennis Transfer** (8–10 min) — court movement pattern that connects the fitness work to tennis\n' +
          '5. **Recovery / Cool-Down** (5 min) — static stretch, breathing reset\n\n' +
          'Adjust durations to hit your target total. The Load Check step flags intensity sequencing issues.',
      },
    ],
    missingDataFallback: 'Template data is loading. I can suggest block structures and exercise types for common fitness session formats while the template loads.',
  },

  // ── Class Builder ─────────────────────────────────────────────────────────
  {
    route: '/director/class-templates/[templateId]',
    pageName: 'Class Builder',
    roles: ['academy_director', 'head_coach'],
    pagePurpose: 'Build and review class templates — structured session blueprints coaches use to deliver consistent, curriculum-aligned tennis training. A class template defines the session goal, curriculum level, block structure (warm-up, skill work, point play, match play), and coaching notes.',
    availableData: [
      'template name and curriculum level',
      'block list (type, drills, activities, coaching cues)',
      'session flow check results (empty blocks, blocks without cues)',
      'stepper progress: class goal → level → session flow → coach notes → publish',
      'curriculum level connection (linked level, expected drills)',
      'recent session usage count',
    ],
    keyMetrics: [
      {
        id: 'block_count',
        label: 'Blocks',
        description: 'Number of session blocks. A standard 60-min class template has 4–6 blocks.',
      },
      {
        id: 'curriculum_level',
        label: 'Curriculum Level',
        description: 'The ball-level or development stage this template targets. Required before publishing.',
      },
      {
        id: 'cue_coverage',
        label: 'Coaching Cue Coverage',
        description: 'Blocks with coaching cues assigned. Missing cues show as orange flags in the session flow check.',
      },
      {
        id: 'session_flow_flags',
        label: 'Session Flow Flags',
        description: 'Blocks that are empty or missing activities. Shown in the Session Flow step.',
      },
    ],
    commonQuestions: [
      'What blocks should a 60-minute Red 2 template have?',
      'How do I structure warm-up to match play?',
      'What is missing from this template?',
      'How do I add coaching cues?',
      'What curriculum level should I assign?',
      'How do I generate a session from this template?',
      'What is the session flow check?',
      'How does this template connect to curriculum?',
    ],
    commonCommands: [
      { phrase: 'go to session flow', action: 'Jump to Session Flow step (Step 3)' },
      { phrase: 'review coaching cues', action: 'Jump to Coach Notes step (Step 4)' },
      { phrase: 'generate a session', action: 'Open Generate Session flow' },
      { phrase: 'go to class templates', action: 'Navigate to Class Templates', route: '/director/class-templates' },
      { phrase: 'open approvals', action: 'Navigate to Approvals', route: '/director/review' },
      { phrase: 'go to sessions', action: 'Navigate to Sessions', route: '/director/sessions' },
    ],
    safeActions: [
      'Suggest typical block structures for a session length and curriculum level',
      'Explain what each block type is for',
      'Review the template for missing blocks or coaching cues',
      'Explain how curriculum level connects to block content',
      'Suggest coaching cue language for a block type',
      'Explain what the session flow check catches and why it matters',
    ],
    approvalRequiredActions: [
      'Save template changes (on-screen Save button in each step)',
      'Publish the template for coaches to use in sessions',
      'Generate a session from this template (creates a session record)',
      'Assign a curriculum level to the template',
    ],
    neverDoRules: [
      {
        action: 'Directly save block edits from DONNA chat',
        reason: 'Block changes go through the on-screen stepper so the director can review the full block structure before saving.',
      },
      {
        action: 'Publish a template without a curriculum level assigned',
        reason: 'Coaches need the curriculum context to deliver sessions aligned to player levels. A template without a level cannot be curriculum-aligned.',
      },
      {
        action: 'Auto-generate a session without director confirmation',
        reason: 'Session creation is a director action — DONNA navigates to the generate session flow; the director triggers the creation.',
      },
    ],
    relatedRoutes: [
      { label: 'Class Templates', route: '/director/class-templates' },
      { label: 'Sessions', route: '/director/sessions' },
      { label: 'Curriculum', route: '/director/curriculum' },
      { label: 'Fitness Templates', route: '/director/fitness/templates' },
    ],
    exampleAnswers: [
      {
        triggers: ['what blocks should', 'block structure for', 'typical template structure', 'structure this template'],
        response:
          'A standard 60-minute class template:\n\n' +
          '1. **Warm-Up** (8–10 min) — movement activation, dynamic footwork, coordination\n' +
          '2. **Technical Work** (15–20 min) — the core skill focus (groundstrokes, serve, net play)\n' +
          '3. **Rally Skills** (10–12 min) — cooperative drills building consistency under pressure\n' +
          '4. **Point Play** (12–15 min) — structured point formats applying the technical skill\n' +
          '5. **Match Play** (8–10 min) — free play or mini-matches for decision-making\n\n' +
          'Adjust durations in the Session Flow step to hit your target total. The session flow check flags empty blocks or blocks without coaching cues.',
      },
      {
        triggers: ['what is the session flow check', 'session flow check', 'flow check means'],
        response: 'The Session Flow Check (Step 3 of the builder) scans your block list for two issues: (1) empty blocks with no activities assigned, and (2) blocks with activities but no coaching cues. Both show as orange flags — they are not blockers, but worth resolving before publishing. Coaches rely on cues to know what to focus on in each block.',
      },
      {
        triggers: ['how do i generate a session', 'generate a session from', 'create session from template'],
        response: 'From the template detail page, use the "Generate Session" button. You set the date, group, and coach — DONNA routes you to the session creation form. The director confirms before the session record is created. Sessions are not created from DONNA chat directly.',
      },
    ],
    missingDataFallback: 'Template data is loading. I can suggest block structures and coaching cue types for common session formats while the template loads.',
  },

  // ── Players Directory ─────────────────────────────────────────────────────
  {
    route: '/director/players',
    pageName: 'Players',
    roles: ['academy_director', 'head_coach'],
    pagePurpose: 'Player directory. All enrolled players with curriculum level, development status, attention flags, and placement state. Primary entry point for navigating to individual player profiles.',
    availableData: [
      'player names and IDs',
      'current curriculum level (ball colour + stage)',
      'enrollment status: active / intake / pending placement',
      'attention flags: absence risk, extended level tenure',
      'group assignment',
      'coach assignment',
    ],
    keyMetrics: [
      {
        id: 'total_players',
        label: 'Total Players',
        description: 'All enrolled players in the directory.',
      },
      {
        id: 'active_players',
        label: 'Active',
        description: 'Players with active enrollment and a curriculum level assigned.',
      },
      {
        id: 'pending_placement',
        label: 'Pending Placement',
        description: 'Players who completed intake but need a level and group assignment.',
      },
      {
        id: 'attention_flags',
        label: 'Attention Flags',
        description: 'Players with absence risk or extended time at current level.',
      },
    ],
    commonQuestions: [
      'Which players need attention?',
      'Who is ready for a level change?',
      'Who is missing a curriculum level?',
      'How many players are in intake?',
      'Find players in the Orange track.',
      'Who has attendance concerns?',
      'Who should I check on this week?',
    ],
    commonCommands: [
      { phrase: 'show players needing attention', action: 'Filter to attention-flagged players' },
      { phrase: 'show players missing level', action: 'Filter to players without curriculum level' },
      { phrase: 'open approvals', action: 'Navigate to Approvals', route: '/director/review' },
      { phrase: 'academy health', action: 'Navigate to Academy Health', route: '/director/kpi' },
      { phrase: 'level up review', action: 'Navigate to Level Up Review', route: '/director/level-up' },
    ],
    safeActions: [
      'Identify players needing attention by flag type',
      'Summarise directory by level, group, or status',
      'Explain what each status badge and flag means',
      'Navigate to a specific player\'s profile',
      'Explain the placement queue and intake process',
    ],
    approvalRequiredActions: [
      'Player level movement (goes through proposed_actions pipeline)',
      'Player activation after placement (finalize_player_placement() only)',
      'Parent visibility changes for player data',
      'Archiving or status changes for any player',
    ],
    neverDoRules: [
      {
        action: 'Move a player to a different level from the directory view',
        reason: 'Level changes must go through the Level Up review queue with evidence attached. Directory view is read-only for level data.',
      },
      {
        action: 'Expose player development data to parents without a director-approved parent update',
        reason: 'Player data is director-visible only. Parents see a curated, approved view via the Parent Updates pathway.',
      },
      {
        action: 'Auto-assign players to groups or coaches',
        reason: 'Group and coach assignments are explicit director decisions — not automated.',
      },
    ],
    relatedRoutes: [
      { label: 'Academy Health', route: '/director/kpi' },
      { label: 'Level Up Review', route: '/director/level-up' },
      { label: 'Approvals', route: '/director/review' },
      { label: 'Sessions', route: '/director/sessions' },
      { label: 'Parent Updates', route: '/director/parents' },
    ],
    exampleAnswers: [
      {
        triggers: ['which players need attention', 'who needs attention', 'players needing attention', 'who should i check on'],
        response: 'Use the filter bar to show attention-flagged players — these have 2+ absences in 30 days or 180+ days in their current level. Open each player\'s profile to see the full context before deciding whether to act. Actions (level move, parent update, coach note) all go through the review queue.',
        nextStepHref: '/director/kpi',
        nextStepLabel: 'View Academy Health',
      },
      {
        triggers: ['who is missing a curriculum level', 'players without a level', 'missing level', 'no curriculum level assigned'],
        response: 'Players without a curriculum level show in the directory without a level badge. These are typically in intake or pending placement. Open a player\'s profile and use the curriculum level picker to assign one — or use the Placement Engine for new players going through the intake process.',
        nextStepHref: '/director/placement',
        nextStepLabel: 'Placement Engine',
      },
      {
        triggers: ['who is ready for a level change', 'ready for advancement', 'level up candidates'],
        response: 'Players with the advancement_eligible flag set on their curriculum state are candidates for level movement. The Academy Health dashboard shows a count in the Advancement Ready card. Go to the Level Up queue to see each candidate with supporting evidence before approving movement.',
        nextStepHref: '/director/level-up',
        nextStepLabel: 'Level Up Review',
      },
    ],
    missingDataFallback: 'Player list may not be loaded yet. I can explain what each column and badge means while data loads. The directory shows enrolled players with level, status, and attention flags.',
  },

  // ── Sessions Directory ────────────────────────────────────────────────────
  {
    route: '/director/sessions',
    pageName: 'Sessions',
    roles: ['academy_director', 'head_coach'],
    pagePurpose: 'Sessions directory. All scheduled, in-progress, and completed sessions. Entry point for reviewing session plans, tracking coach wrap-up coverage, and generating new sessions from templates.',
    availableData: [
      'session list with date, coach, group, and status',
      'wrap-up submission status per session',
      'template connection per session',
      'curriculum level per session',
      'player count per session',
    ],
    keyMetrics: [
      {
        id: 'sessions_this_week',
        label: 'Sessions This Week',
        description: 'Number of sessions scheduled in the current week.',
      },
      {
        id: 'wrap_up_pending',
        label: 'Wrap-Ups Pending',
        description: 'Completed sessions with no coach wrap-up submitted yet. These need a coach follow-up.',
      },
      {
        id: 'sessions_without_template',
        label: 'Without Template',
        description: 'Sessions not generated from a class template — may lack curriculum alignment.',
      },
    ],
    commonQuestions: [
      'What sessions are happening this week?',
      'Which sessions are missing wrap-ups?',
      'How do I create a new session?',
      'How does a session connect to a template?',
      'Which sessions have pending review items?',
      'What happened in yesterday\'s session?',
    ],
    commonCommands: [
      { phrase: 'show sessions this week', action: 'Filter to this week\'s sessions' },
      { phrase: 'show missing wrap-ups', action: 'Filter to sessions without submitted wrap-up' },
      { phrase: 'open approvals', action: 'Navigate to Approvals', route: '/director/review' },
      { phrase: 'go to templates', action: 'Navigate to Class Templates', route: '/director/class-templates' },
      { phrase: 'go to today', action: 'Navigate to Today', route: '/director' },
    ],
    safeActions: [
      'Summarise sessions for a given time window',
      'Explain session status labels (scheduled / in progress / completed)',
      'Identify sessions missing wrap-ups',
      'Explain how templates connect to sessions',
      'Navigate to a specific session detail page',
    ],
    approvalRequiredActions: [
      'Coach wrap-ups go to the review queue before any effects take effect',
      'Session attendance exceptions require director approval',
      'Any session modification that affects player records requires review queue action',
    ],
    neverDoRules: [
      {
        action: 'Auto-approve a coach wrap-up from the sessions list',
        reason: 'Wrap-up approval is always an explicit director action in the review queue, never automatic.',
      },
      {
        action: 'Cancel or reschedule a session from DONNA chat',
        reason: 'Session modifications affect coaches and players — must be an explicit on-screen action by the director.',
      },
      {
        action: 'Access sessions from another academy',
        reason: 'All session data is scoped to academy_id via RLS. Cross-academy access is blocked at the database level.',
      },
    ],
    relatedRoutes: [
      { label: 'Today', route: '/director' },
      { label: 'Approvals', route: '/director/review' },
      { label: 'Class Templates', route: '/director/class-templates' },
      { label: 'Players', route: '/director/players' },
    ],
    exampleAnswers: [
      {
        triggers: ['which sessions are missing wrap-ups', 'sessions without wrap-ups', 'missing wrap-up', 'wrap-up coverage'],
        response: 'Sessions with status "completed" but no submitted wrap-up are the ones to chase. Coaches submit wrap-ups from their session page. Once submitted, the wrap-up appears in your review queue for approval. The Today dashboard shows a wrap-up coverage summary across all recent sessions.',
        nextStepHref: '/director',
        nextStepLabel: 'Today Dashboard',
      },
      {
        triggers: ['how do i create a new session', 'create a session', 'new session', 'generate a session'],
        response: 'Sessions are generated from class templates. Go to Class Templates, open the template you want to use, and click "Generate Session." You set the date, group, and coach assignment before the session is created. Sessions can also be created manually from the sessions list using the New Session button.',
        nextStepHref: '/director/class-templates',
        nextStepLabel: 'Class Templates',
      },
    ],
    missingDataFallback: 'Session data may not be loaded yet. I can explain how the sessions system works. Sessions are generated from templates, delivered by coaches, and closed with a wrap-up that goes to your review queue.',
  },

  // ── Parent Updates ────────────────────────────────────────────────────────
  {
    route: '/director/parents',
    pageName: 'Parent Updates',
    roles: ['academy_director'],
    pagePurpose: 'Parent communication center. Shows parent-safe update drafts, their approval status, and which players need a parent update. No message is sent until the director explicitly approves and dispatches it. Parents see only what the director has approved.',
    availableData: [
      'pending parent update drafts',
      'draft approval status (pending / approved / sent / rejected)',
      'player names linked to each draft',
      'draft content (parent-safe only — no raw coach notes)',
      'last update sent date per player',
    ],
    keyMetrics: [
      {
        id: 'pending_drafts',
        label: 'Pending Drafts',
        description: 'Parent update drafts waiting for director review and approval.',
      },
      {
        id: 'players_without_update',
        label: 'Players Without Recent Update',
        description: 'Players whose parents have not received a progress update recently.',
      },
      {
        id: 'approved_not_sent',
        label: 'Approved But Not Sent',
        description: 'Updates approved by the director but not yet dispatched to parents.',
      },
    ],
    commonQuestions: [
      'Who needs a parent update?',
      'What parent updates are pending approval?',
      'How do I draft a parent update?',
      'What can I include in a parent update?',
      'What cannot be in a parent update?',
      'What happens after I approve a parent update?',
      'How often should parents receive updates?',
    ],
    commonCommands: [
      { phrase: 'draft a parent update', action: 'Start parent update draft from a player profile' },
      { phrase: 'show pending parent drafts', action: 'Filter to pending parent update drafts' },
      { phrase: 'open approvals', action: 'Navigate to Approvals', route: '/director/review' },
      { phrase: 'open players', action: 'Navigate to Players', route: '/director/players' },
    ],
    safeActions: [
      'Identify players who need a parent update',
      'Draft a parent-safe update from a player profile for director review',
      'Explain what content is and is not allowed in parent updates',
      'Show which updates are pending approval or approved but not yet sent',
      'Explain the parent update approval and dispatch workflow',
    ],
    approvalRequiredActions: [
      'Every parent update must be approved by the director before it is sent',
      'Dispatching the update to parents (separate step from approval)',
      'Any update referencing a level change requires the level change to be approved first',
    ],
    neverDoRules: [
      {
        action: 'Send a parent update without explicit director approval',
        reason: 'Parent communications are the academy\'s voice to families. Nothing goes out without the director\'s explicit sign-off — the two-step approve-then-dispatch design enforces this.',
      },
      {
        action: 'Include raw coach notes or internal observations in a parent update',
        reason: 'Coach notes are director-visible only. Parent updates use the parent-safe content path which strips internal signals, internal observations, and non-approved data.',
      },
      {
        action: 'Reference a level change in a parent update before the level change is formally approved',
        reason: 'Announcing a level change that has not been approved creates a trust risk with parents if the decision changes.',
      },
      {
        action: 'Expose one player\'s data to a parent not linked to that player',
        reason: 'Guardian-to-player linking is required. DONNA never surfaces one player\'s data to another player\'s parent regardless of request.',
      },
      {
        action: 'Auto-send updates on any schedule without director dispatch action',
        reason: 'No automated sends. Every communication requires explicit director dispatch. This is a core safety invariant.',
      },
    ],
    relatedRoutes: [
      { label: 'Approvals', route: '/director/review' },
      { label: 'Players', route: '/director/players' },
      { label: 'Today', route: '/director' },
    ],
    exampleAnswers: [
      {
        triggers: ['who needs a parent update', 'which players need parent update', 'players without update', 'parents who haven\'t heard'],
        response: 'Players without a recent update are shown at the top of this page. Prioritise players with recent session activity, attendance changes, or a level movement — those are what parents most want to hear about. You can ask DONNA to draft a parent-safe update from any player\'s profile page.',
        nextStepHref: '/director/players',
        nextStepLabel: 'View Players',
      },
      {
        triggers: ['what can i include in a parent update', 'what is allowed', 'what to put in'],
        response: 'Parent updates should include: general progress observations (positive framing), high-level attendance notes, goals for the coming weeks, and encouragement language. They must NOT include: raw coach notes, internal assessment scores, flags or signals, other players\' data, or any content not reviewed for parent-safety.',
      },
      {
        triggers: ['what happens after i approve a parent update', 'after approval parent', 'approved parent update'],
        response: 'After you approve a parent update, it moves to "Approved — not yet sent" status. It does not go to the parent automatically. You dispatch it manually from this page — this gives you a final review moment before the message leaves the system. Dispatching is intentionally a separate step from approving.',
      },
      {
        triggers: ['how do i draft a parent update', 'start a parent update', 'create parent update'],
        response: 'Go to a player\'s profile and ask DONNA "draft a parent-safe update." DONNA produces a draft using parent-safe rules — no raw coach notes, no internal signals, positive framing only. The draft goes to your review queue. Review and edit if needed, then approve. After approval, dispatch from this Parent Updates page.',
        nextStepHref: '/director/players',
        nextStepLabel: 'View Players',
      },
    ],
    missingDataFallback: 'Parent update data may not be loaded yet. Nothing in this queue has been sent to parents — all items require your explicit approval and dispatch. I can explain how the parent communication workflow works while data loads.',
  },

]

// ── Lookup helpers ────────────────────────────────────────────────────────────

/**
 * Find the best matching context pack for a given pathname.
 *
 * Resolution order:
 *   1. Exact route match (e.g. '/director/kpi' → Academy Health pack)
 *   2. Dynamic segment match (e.g. '/director/fitness/templates/<uuid>' →
 *      Fitness Builder pack whose route is '/director/fitness/templates/[templateId]')
 *   3. null if no pack covers this route
 *
 * Does NOT fall back to a catch-all — returns null for unknown routes so callers
 * can fall through to the existing donnaPageContextEngine instead.
 */
export function getDonnaContextPackForRoute(pathname: string): DonnaContextPack | null {
  // 1. Exact match
  const exact = DONNA_CONTEXT_PACKS.find(p => p.route === pathname)
  if (exact) return exact

  // 2. Dynamic segment match — convert '[param]' pattern to prefix + depth check
  for (const pack of DONNA_CONTEXT_PACKS) {
    if (!pack.route.includes('[')) continue
    const bracketIdx = pack.route.indexOf('[')
    const prefix = pack.route.slice(0, bracketIdx)
    const packDepth = pack.route.split('/').length
    const pathDepth = pathname.split('/').length
    if (pathname.startsWith(prefix) && pathDepth === packDepth) {
      return pack
    }
  }

  return null
}

/**
 * Find a direct answer for a director's prompt within a context pack.
 *
 * Performs case-insensitive substring match against each answer's trigger phrases.
 * Returns the first matching answer, or null if no trigger matches.
 *
 * Usage (future wiring in handleDonnaCooPrompt):
 *   const pack = getDonnaContextPackForRoute(pathname)
 *   if (pack) {
 *     const answer = lookupAnswerInContextPack(pack, text)
 *     if (answer) { // use answer.response, answer.nextStepHref }
 *   }
 */
export function lookupAnswerInContextPack(
  pack: DonnaContextPack,
  prompt: string,
): DonnaContextPackAnswer | null {
  const lower = prompt.toLowerCase().trim()
  for (const answer of pack.exampleAnswers) {
    for (const trigger of answer.triggers) {
      if (lower.includes(trigger.toLowerCase())) {
        return answer
      }
    }
  }
  return null
}
