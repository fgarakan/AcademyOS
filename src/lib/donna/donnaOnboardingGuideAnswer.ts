// Sprint 912.18 — DONNA Onboarding Guide Answer Engine V1
// Answers setup-progress questions DONNA's existing MissingContext engine doesn't cover:
//   "Am I ready to launch?", "What is left in setup?", "What is this step for?"
//
// Fires AFTER detectMissingContext (which handles "walk me through setup" / navigation
// offers) and BEFORE dashboard priority. Complementary — not a replacement.
//
// Pure TypeScript — no DB calls, no mutations, no server actions.
// Reads directorCtx signals as approximations — never claims step completion.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Detection ──────────────────────────────────────────────────────────────────
// These patterns are intentionally NOT in donnaMissingContextEngine.ts.
// detectMissingContext already handles: "onboarding", "walk me through setup",
// "add coaches", "curriculum setup", etc. — those are NOT repeated here.

const SETUP_PROGRESS_PATTERNS =
  /\b(setup checklist|onboarding checklist|what.{0,12}(left|remaining).{0,12}(in )?(setup|onboarding|to complete|to finish)|am i (done|ready|finished|complete)( to (launch|go live|use))?|are we ready( to (launch|go live))?|how close.{0,10}(ready|done|finish|launch|live)|all (setup )?steps? (done|complete|finished)|what.{0,12}(need|needs).{0,12}(complete|finish|done) (before|for|to) (launch|going live|use)|finish(ed)? (the )?setup|setup (complete|done|finished)|onboarding (complete|done|finished))\b/i

const STEP_EXPLAIN_PATTERNS =
  /\b(what is this (step|stage|phase|section)|what.{0,10}(step|phase|stage|part|section) (is this|am i (in|on|doing))|explain this (step|section|part|stage)|what do i (do|fill (in|out)|enter|answer) (here|in this|on this)|help.{0,10}(with )?this (step|section|part|page))\b/i

export function detectOnboardingProgressQuestion(
  text: string,
  pathname: string,
): boolean {
  const t = text.toLowerCase().trim()
  const isOnboardingPath = pathname.startsWith('/director/onboarding')

  if (SETUP_PROGRESS_PATTERNS.test(t)) return true
  // Step-explain patterns only fire on onboarding sub-pages — too generic elsewhere
  if (isOnboardingPath && STEP_EXPLAIN_PATTERNS.test(t)) return true

  return false
}

// ── Sub-page step explanations ─────────────────────────────────────────────────

function buildInterviewStepAnswer(): DonnaSafeReadAnswer {
  return {
    actionId: 'onboarding_step_interview',
    text: "You're in the Academy Interview — 7 questions about your philosophy, player focus, competition approach, and 90-day vision. These answers shape how AcademyOS understands your academy. Take your time; you can revise before submitting. Complete all 7 and click Submit when ready.",
    confidence: 'high',
    sourceNote: 'Onboarding: Academy Interview step',
    followUp: 'Walk me through the interview',
    href: '/director/onboarding/interview',
    isAnswerable: true,
  }
}

function buildCurriculumSetupStepAnswer(ctx: DirectorDonnaContext | null): DonnaSafeReadAnswer {
  const gapNote = (ctx?.curriculumGaps.length ?? 0) > 0
    ? ` ${ctx!.curriculumGaps.length} structural gap${ctx!.curriculumGaps.length !== 1 ? 's' : ''} are flagged.`
    : ''
  return {
    actionId: 'onboarding_step_curriculum',
    text: `You're configuring the curriculum structure — choosing the level progression every coach and player will build from.${gapNote} Pick the levels that match your current players (Red → Orange → Yellow → High Performance). You can add levels later, but the foundation should reflect where your players are today.`,
    confidence: 'high',
    sourceNote: 'Onboarding: Curriculum Setup step',
    followUp: 'What curriculum should I choose?',
    href: '/director/onboarding/curriculum',
    isAnswerable: true,
  }
}

function buildPlayerPlacementStepAnswer(ctx: DirectorDonnaContext | null): DonnaSafeReadAnswer {
  const playerNote = (ctx?.playerCount ?? 0) > 0
    ? `${ctx!.playerCount} player${ctx!.playerCount !== 1 ? 's' : ''} are in the system.`
    : 'No players have been added yet.'
  return {
    actionId: 'onboarding_step_players',
    text: `Player placement is where you activate players in AcademyOS. ${playerNote} Confirm each player's starting curriculum level, then activate them. Nothing goes live until you confirm each placement — DONNA never activates players automatically.`,
    confidence: 'high',
    sourceNote: 'Onboarding: Players & Placement step',
    followUp: 'What happens after I confirm placement?',
    href: '/director/onboarding/players-placement',
    isAnswerable: true,
  }
}

function buildCoachSetupStepAnswer(ctx: DirectorDonnaContext | null): DonnaSafeReadAnswer {
  const coachNote = (ctx?.coachCount ?? 0) > 0
    ? `${ctx!.coachCount} coach${ctx!.coachCount !== 1 ? 'es are' : ' is'} in the system.`
    : 'No coaches have been added yet.'
  return {
    actionId: 'onboarding_step_coaches',
    text: `Coach setup is where you add coaches and set permissions. ${coachNote} Coaches need to be added before they can run sessions, submit wrap-ups, or see player rosters. Set view and edit permissions carefully — coaches only see what their role requires.`,
    confidence: 'high',
    sourceNote: 'Onboarding: Coaches & Permissions step',
    followUp: 'What permissions should coaches have?',
    href: '/director/onboarding/coaches-permissions',
    isAnswerable: true,
  }
}

function buildProgramsGroupsStepAnswer(): DonnaSafeReadAnswer {
  return {
    actionId: 'onboarding_step_programs',
    text: "Programs and groups let you organize players into training groups — useful when you have multiple age groups or training tracks. This step is optional for initial launch but helps coaches manage rosters. Add your primary groups here, then assign players once they are placed.",
    confidence: 'high',
    sourceNote: 'Onboarding: Programs & Groups step',
    followUp: 'How do programs connect to sessions?',
    href: '/director/onboarding/programs-groups',
    isAnswerable: true,
  }
}

// ── General onboarding progress answer ────────────────────────────────────────

function buildGeneralOnboardingAnswer(ctx: DirectorDonnaContext | null): DonnaSafeReadAnswer {
  if (!ctx) {
    return {
      actionId: 'onboarding_guide_no_ctx',
      text: "Academy setup has five core areas: academy basics (identity + interview), curriculum structure, coaches + permissions, player placement, and session templates. Complete them in that order — each builds on the previous. The progress checklist on this page is authoritative; I can guide each step but won't mark anything complete.",
      confidence: 'partial',
      sourceNote: 'Onboarding guidance (context loading)',
      followUp: 'Walk me through step by step',
      href: '/director/onboarding',
      isAnswerable: true,
    }
  }

  const prefix = ctx.isLive ? '' : '[Demo] '

  // Sprint 913.1: use pre-computed onboardingReadinessLevel and hasX booleans
  const level = ctx.onboardingReadinessLevel

  if (level === 'ready_signal') {
    return {
      actionId: 'onboarding_ready',
      text: `${prefix}Setup signals look positive — ${ctx.playerCount} player${ctx.playerCount !== 1 ? 's' : ''}, ${ctx.coachCount} coach${ctx.coachCount !== 1 ? 'es' : ''}, ${ctx.templateCount} template${ctx.templateCount !== 1 ? 's' : ''}, no curriculum gaps detected. Check the progress checklist on this page — it is the authoritative source. When all steps are green, you are ready to launch. I can see data counts but not the full step-by-step completion status.`,
      confidence: ctx.confidence,
      sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
      followUp: 'What happens after I complete setup?',
      href: '/director/onboarding',
      isAnswerable: true,
    }
  }

  if (level === 'not_started') {
    return {
      actionId: 'onboarding_not_started',
      text: `${prefix}Setup looks like it hasn't started yet — no players or coaches are in the system. Start with academy basics (identity + interview), then configure curriculum levels, add coaches, add players, and create session templates. The progress checklist on this page is authoritative.`,
      confidence: ctx.confidence,
      sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
      followUp: 'Walk me through step by step',
      href: '/director/onboarding',
      isAnswerable: true,
    }
  }

  // 'partial' or 'nearly_ready' — build incomplete list from booleans
  const incomplete: string[] = []
  if (!ctx.hasPlayers)      incomplete.push('add players')
  if (!ctx.hasCoaches)      incomplete.push('add coaches')
  if (ctx.hasCurriculumGaps) incomplete.push('resolve curriculum gaps')
  if (!ctx.hasTemplates)    incomplete.push('create session templates')

  const incompleteList = incomplete.map((s, i) => `${i + 1}. ${s}`).join(', ')
  const readinessNote = level === 'nearly_ready'
    ? 'Nearly ready — '
    : 'Setup in progress. '

  return {
    actionId: 'onboarding_in_progress',
    text: `${prefix}${readinessNote}Based on what I can see: still need to ${incompleteList}. Work through steps in order — curriculum before coaches, coaches before players. The progress checklist on this page is authoritative. I can explain any step, but I won't mark anything complete.`,
    confidence: ctx.confidence,
    sourceNote: ctx.isLive ? 'Live data' : 'Demo data',
    followUp: 'Walk me through the remaining steps',
    href: '/director/onboarding',
    isAnswerable: true,
  }
}

// ── Main entry point ───────────────────────────────────────────────────────────

export function buildOnboardingProgressAnswer(
  ctx: DirectorDonnaContext | null,
  pathname: string,
): DonnaSafeReadAnswer {
  // Route to sub-page-specific responses first
  if (pathname.includes('/interview')) return buildInterviewStepAnswer()
  if (pathname.includes('/onboarding/curriculum')) return buildCurriculumSetupStepAnswer(ctx)
  if (pathname.includes('/players-placement'))    return buildPlayerPlacementStepAnswer(ctx)
  if (pathname.includes('/coaches-permissions'))  return buildCoachSetupStepAnswer(ctx)
  if (pathname.includes('/programs-groups'))      return buildProgramsGroupsStepAnswer()

  // General onboarding page — infer progress from directorCtx
  return buildGeneralOnboardingAnswer(ctx)
}
