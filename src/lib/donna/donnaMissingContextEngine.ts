// Sprint 721 — DONNA Missing Context Intelligence Engine V1
// Pure TypeScript — no DB calls, no mutations, no API calls, no UI imports.
// Generates ChatGPT-quality "missing context" answers when setup is incomplete.
//
// DONNA never says "I need more context." alone.
// Every missing-context answer explains:
//   1. What is missing
//   2. Why it matters
//   3. What the user should do next
//   4. Whether DONNA can navigate them there
//
// Safe navigation pages supported:
//   - /director/onboarding                       (Academy setup)
//   - /director/onboarding/coaches-permissions   (Add Coaches)
//   - /director/onboarding/players-placement     (Add Players)
//   - /director/onboarding/curriculum            (Curriculum Setup)
//   - /director/templates                        (Templates)
//   - /director/review                           (Review Center)
//   - /director/players                          (Players list)

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Navigation offer ──────────────────────────────────────────────────────────

export interface DonnaNavOffer {
  href: string
  label: string
  questionContext: string
}

// ── Missing context answer ────────────────────────────────────────────────────
// Extends DonnaSafeReadAnswer with an optional navigation offer.

export interface DonnaMissingContextAnswer extends DonnaSafeReadAnswer {
  navOffer: DonnaNavOffer | null
}

// ── Intent patterns ───────────────────────────────────────────────────────────

const ONBOARDING_PATTERNS = /\b(onboard|onboarding|set\s?up|setup|getting started|getting going|how to start|start using|configure academy|configure my academy|walk me through setup|help with setup|i'?m new|brand new|just starting|where do i begin|how do i begin|first time|first thing to configure|what (should|do) i configure|don'?t know where to start|just getting started)\b/i

const PLAYERS_QUESTION_PATTERNS = /\b(which players?|who needs? attention|player attention|player data|no players?|missing players?|add players?|player profile|player progress|player list|players? need|player concern|who should i focus|focus on today|prioritize (my )?players?|player priorities?)\b/i

const COACHES_QUESTION_PATTERNS = /\b(who should coach|which coach|assign coach|coach for|coach orange|coach green|coach red|coach white|coach blue|coach yellow|coaches? setup|no coaches?|add coaches?|add a coach|coach availability|coaching assignment|head coach)\b/i

const CURRICULUM_QUESTION_PATTERNS = /\b(curriculum setup|curriculum structure|set up curriculum|configure curriculum|curriculum missing|no curriculum|curriculum levels?|build curriculum|curriculum content)\b/i

const TEMPLATES_QUESTION_PATTERNS = /\b(session template|class template|plan a session|session planning|create a template|add a template|no templates?|template setup|template missing)\b/i

const NEXT_STEP_PATTERNS = /\b(what should i do (first|next|now)|what do i do (first|next)|what comes first|first step|where do i start|what do i start with|what is my first|next step)\b/i

const WHY_CANT_PATTERNS = /\b(why can'?t you|why won'?t you|why can'?t donna|why don'?t you know|why don'?t you have|why no data|what'?s missing|what are you missing|what do you need|what context)\b/i

// ── Navigation intent patterns (Sprint 730) ───────────────────────────────────
// Detects "Open the review center", "Show me the players page", etc.

const NAV_INTENT_VERBS = /\b(open|go to|show me|take me to|navigate to|bring me to|head to|jump to)\b/i

const NAV_PAGE_MAP: Array<{ pattern: RegExp; href: string; label: string }> = [
  { pattern: /\b(review center|review queue|review|pending reviews?|approvals?)\b/i, href: '/director/review', label: 'Review Center' },
  { pattern: /\b(add players?|players? (placement|setup))\b/i, href: '/director/onboarding/players-placement', label: 'Add Players' },
  { pattern: /\b(add coaches?|add a coach)\b/i, href: '/director/onboarding/coaches-permissions', label: 'Add Coaches' },
  { pattern: /\b(curriculum setup|curriculum page)\b/i, href: '/director/onboarding/curriculum', label: 'Curriculum Setup' },
  { pattern: /\b(onboard(ing)?( setup)?|academy setup)\b/i, href: '/director/onboarding', label: 'Academy Setup' },
  { pattern: /\b(templates?( page)?)\b/i, href: '/director/templates', label: 'Templates' },
  { pattern: /\b(sessions?( page| schedule)?|schedule)\b/i, href: '/director/sessions', label: 'Sessions' },
  { pattern: /\b(players?( page| list)?)\b/i, href: '/director/players', label: 'Players' },
  { pattern: /\b(dashboard|home)\b/i, href: '/director', label: 'Dashboard' },
]

function detectNavigationIntent(text: string): DonnaMissingContextAnswer | null {
  if (!NAV_INTENT_VERBS.test(text)) return null
  for (const { pattern, href, label } of NAV_PAGE_MAP) {
    if (pattern.test(text)) {
      return build(
        `Sure — I can take you to ${label}. Want me to open it?`,
        { href, label, questionContext: text },
        'navigate_direct',
        null,
      )
    }
  }
  return null
}

// ── Answer builder ────────────────────────────────────────────────────────────

function build(
  text: string,
  navOffer: DonnaNavOffer | null,
  actionId: string,
  sourceNote: string | null = 'Setup context not yet available',
): DonnaMissingContextAnswer {
  return {
    actionId,
    text,
    confidence: 'insufficient',
    sourceNote,
    followUp: navOffer ? `Take me to ${navOffer.label}` : null,
    href: navOffer?.href ?? null,
    isAnswerable: true,
    navOffer,
  }
}

// ── Scenario: Onboarding help ─────────────────────────────────────────────────

function handleOnboarding(questionContext: string): DonnaMissingContextAnswer {
  return build(
    "Yes, I can help with that. Academy setup is where you configure everything before going live — you'll answer a few questions about your academy, add coaches, configure curriculum levels, and add players. It usually takes about 10–15 minutes. I can take you to the onboarding flow right now. Want me to open it?",
    { href: '/director/onboarding', label: 'Academy Setup', questionContext },
    'navigate_onboarding',
    null,
  )
}

// ── Scenario: Players missing ─────────────────────────────────────────────────

function handleNoPlayers(questionContext: string): DonnaMissingContextAnswer {
  return build(
    "I can answer that once players are added to your academy. Right now I don't have player data — players need to be registered and placed in groups before I can track attention, progress, attendance, or curriculum readiness. This is usually done during setup. Would you like me to take you to Add Players?",
    { href: '/director/onboarding/players-placement', label: 'Add Players', questionContext },
    'navigate_add_players',
  )
}

// ── Scenario: Coaches missing ─────────────────────────────────────────────────

function handleNoCoaches(questionContext: string): DonnaMissingContextAnswer {
  return build(
    "I need coach setup first. Your academy doesn't have any coaches added yet — coaches carry session responsibilities, player assignments, and wrap-up data that I use to understand availability, role, and permissions. Add your coaches first, then I can help with assignments. Want me to take you to Add Coaches?",
    { href: '/director/onboarding/coaches-permissions', label: 'Add Coaches', questionContext },
    'navigate_add_coaches',
  )
}

// ── Scenario: Curriculum not configured ──────────────────────────────────────

function handleNoCurriculum(questionContext: string): DonnaMissingContextAnswer {
  return build(
    "I need your curriculum structure set up before I can help with that. Curriculum setup defines your development levels, ball colors, and progression paths — it's what connects every player's training to a structured development plan. Without it, I can't tell you what any player is working toward. Would you like me to take you to Curriculum Setup?",
    { href: '/director/onboarding/curriculum', label: 'Curriculum Setup', questionContext },
    'navigate_curriculum_setup',
  )
}

// ── Scenario: Templates missing ───────────────────────────────────────────────

function handleNoTemplates(questionContext: string): DonnaMissingContextAnswer {
  return build(
    "Session templates aren't set up yet. Templates define what happens in each class — the warm-up, drills, game situations, and cool-down structure. Without templates, session planning won't produce accurate or structured plans, and I won't have context about what coaches are running. Would you like me to take you to Templates?",
    { href: '/director/templates', label: 'Templates', questionContext },
    'navigate_templates',
  )
}

// ── Scenario: Early setup — what should I do next ────────────────────────────

function handleEarlySetupNextStep(
  questionContext: string,
  hasCoaches: boolean,
  hasPlayers: boolean,
): DonnaMissingContextAnswer {
  if (!hasCoaches) {
    return build(
      "Your academy is in early setup. The most important first step is adding your coaches — they run sessions, observe players, and produce the data that drives everything else in the system. Once coaches are added, you can add players and configure curriculum levels. Want me to take you to Add Coaches now?",
      { href: '/director/onboarding/coaches-permissions', label: 'Add Coaches', questionContext },
      'early_setup_add_coaches',
      'Early setup — no coaches added yet',
    )
  }

  if (!hasPlayers) {
    return build(
      "Coaches are set up — the next step is adding your players. Once players are registered and placed in curriculum levels, I can start tracking their progress, attendance, and development signals. Want me to take you to Add Players?",
      { href: '/director/onboarding/players-placement', label: 'Add Players', questionContext },
      'early_setup_add_players',
      'Early setup — no players added yet',
    )
  }

  // Has both coaches and players — this shouldn't be first-time setup
  return build(
    "Your setup looks like it's underway. The next step is usually running your first session — coaches submit wrap-ups after each session, and that data flows into your review queue and player records. Would you like to go to Sessions?",
    { href: '/director/sessions', label: 'Sessions', questionContext },
    'early_setup_run_sessions',
    'Early setup guidance',
  )
}

// ── Scenario: Why can't you answer? ──────────────────────────────────────────

function handleWhyCantAnswer(
  questionContext: string,
  ctx: DirectorDonnaContext | null,
): DonnaMissingContextAnswer {
  const hasPlayers = (ctx?.playerCount ?? 0) > 0
  const hasCoaches = (ctx?.coachCount ?? 0) > 0

  if (!hasCoaches) {
    return build(
      "I can't answer that because your academy doesn't have coaches added yet. Coach data — sessions run, observations captured, wrap-ups submitted — is the primary source I use to answer operational questions. Without coaches, most of my real-time answers are unavailable. The fix is to add coaches in onboarding.",
      { href: '/director/onboarding/coaches-permissions', label: 'Add Coaches', questionContext },
      'explain_why_no_coaches',
      'Missing dependency: no coaches',
    )
  }

  if (!hasPlayers) {
    return build(
      "I can't answer that because your academy doesn't have players added yet. Players are the central data object — attendance, observations, curriculum progress, and development signals all require players to exist. Once players are added and sessions begin, I'll be able to answer most operational questions.",
      { href: '/director/onboarding/players-placement', label: 'Add Players', questionContext },
      'explain_why_no_players',
      'Missing dependency: no players',
    )
  }

  // Has data but still can't answer — generic explanation
  return build(
    "I can't answer that because the data I'd need hasn't been captured yet. This could be because sessions haven't run yet, coaches haven't submitted wrap-ups, or this is a feature that requires more activity in the system. As coaches run sessions and submit wrap-ups, more questions will become answerable.",
    null,
    'explain_why_no_data',
    'Insufficient activity data',
  )
}

// ── Main detection function ───────────────────────────────────────────────────
// Called from DonnaVoiceReadyShell before other intercepts.
// Returns null if no missing-context scenario applies.

export function detectMissingContext(
  text: string,
  ctx: DirectorDonnaContext | null,
): DonnaMissingContextAnswer | null {
  const t = text.trim()
  const hasPlayers = (ctx?.playerCount ?? 0) > 0
  const hasCoaches = (ctx?.coachCount ?? 0) > 0
  const isFirstTimeSetup = ctx?.isFirstTimeSetup ?? (!hasPlayers && !hasCoaches)

  // ── 0. Direct navigation intent (Sprint 730) ────────────────────────────────
  // "Open the review center", "Show me the players page", "Go to templates", etc.
  // Check BEFORE onboarding so "open onboarding" doesn't become the generic
  // onboarding guidance — it becomes a direct nav offer to /director/onboarding.
  const navIntentAnswer = detectNavigationIntent(t)
  if (navIntentAnswer) return navIntentAnswer

  // ── 1. Onboarding help — always intercept ────────────────────────────────────
  if (ONBOARDING_PATTERNS.test(t)) {
    return handleOnboarding(t)
  }

  // ── 2. "Why can't you answer that?" ─────────────────────────────────────────
  if (WHY_CANT_PATTERNS.test(t)) {
    return handleWhyCantAnswer(t, ctx)
  }

  // ── 3. "What should I do next?" in early setup ───────────────────────────────
  if (NEXT_STEP_PATTERNS.test(t) && isFirstTimeSetup) {
    return handleEarlySetupNextStep(t, hasCoaches, hasPlayers)
  }

  // ── 4. Players question when no players exist ────────────────────────────────
  if (PLAYERS_QUESTION_PATTERNS.test(t) && !hasPlayers) {
    return handleNoPlayers(t)
  }

  // ── 5. Coaches question when no coaches exist ────────────────────────────────
  if (COACHES_QUESTION_PATTERNS.test(t) && !hasCoaches) {
    return handleNoCoaches(t)
  }

  // ── 6. Curriculum question in early setup ────────────────────────────────────
  if (CURRICULUM_QUESTION_PATTERNS.test(t) && isFirstTimeSetup) {
    return handleNoCurriculum(t)
  }

  // ── 7. Templates question in early setup ─────────────────────────────────────
  if (TEMPLATES_QUESTION_PATTERNS.test(t) && isFirstTimeSetup) {
    return handleNoTemplates(t)
  }

  return null
}
