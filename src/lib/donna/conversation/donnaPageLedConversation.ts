// Mega Sprint 4321–4350 — DONNA Conversation Ownership V1
// Page Intent Resolver + Workflow Carry + Conversation Diagnostics.
//
// The gap this closes: when a director asks a vague-lead question
// ("who should we start with?", "what should I do here?", "guide me",
// "continue", "what next?"), DONNA used to fall through to a page-agnostic
// executive assumption or — worse — a passive clarification menu, even though
// the current PAGE + live academy STATE already reveal what to do next.
//
// This module makes DONNA own the conversation like a COO sitting beside the
// director: infer intent from the page, lead with a recommendation, explain
// briefly, name the first concrete action, and say what comes next — without
// asking the director to choose the workflow.
//
// Pure TypeScript — no DB calls, no LLM, no mutations, no React, no side
// effects. Deterministic: same (text, route, ctx) → same output. Returns null
// when neither page nor state can lead (so genuine clarification is still
// allowed downstream). Reality-grounded only: never fabricates a count or name.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'
import { getPageCapabilityMap } from '@/lib/donna/donnaPageContextEngine'
import { buildDirectorNextAction } from '@/lib/donna/directorNextActionEngine'
import { buildAcademyAttentionReport } from '@/lib/donna/proactive/academyAttentionEngine'

// ── Vague-lead intent family ────────────────────────────────────────────────────
// The exact phrasings where the director is asking DONNA to lead, not asking a
// specific data question. Specific questions (review queue, roster attention,
// daily brief, focus-today, proactive) are handled by their own engines upstream
// in the canonical router; this family is what previously fell through to the
// page-agnostic assumption / passive clarification.

export type VagueLeadKind =
  | 'who_to_start'   // "who should we start with?"
  | 'what_here'      // "what should I do here?", "what do I do on this page?"
  | 'guide_me'       // "guide me", "lead me", "walk me through this"
  | 'continue'       // "continue", "keep going", "resume"
  | 'what_next'      // "what next?", "what's next?", "where do I start?"

// Patterns are intentionally tight. The "what next / where do I start / what now"
// family is anchored to the end of the utterance so a terminal lead ("what's
// next?") matches while a specific question that merely contains those words
// ("what's the next level after Orange", "what's next on Thursday's schedule")
// does NOT — those must reach their own answer engine, not page-led guidance.
const LEAD_PATTERNS: ReadonlyArray<readonly [VagueLeadKind, RegExp]> = [
  ['who_to_start', /\bwho (should|do) (we|i) (start|begin) with\b|\bwho('?s| is) first\b|\bwho do (we|i) (start|tackle|handle) first\b/],
  ['what_here',    /\bwhat (should|do) i do (here|on this (page|screen))\b|\bwhat('?s| is) (there|this) to do here\b|\bwhat can i do (here|on this page)\b/],
  ['guide_me',     /\bguide me\b|\blead me\b|\bwalk me through (this|it)?\s*[?.!]*$|\bshow me what to do\b|\bhelp me (run|drive) this\b/],
  ['continue',     /^\s*(continue|keep going|carry on|resume|go on|next)\s*[.!]?\s*$|\bcontinue (this|the workflow|where we left off)\b|\bpick up where we left off\b/],
  ['what_next',    /\bwhat('?s| is)? ?next\s*[?.!]*$|\bwhat (should|do) i do next\s*[?.!]*$|\bwhere (do|should) i (start|begin)\s*[?.!]*$|\bwhat now\s*[?.!]*$/],
]

/** Classify a director utterance into the vague-lead family, or null. */
export function detectVagueLeadRequest(text: string): VagueLeadKind | null {
  const t = text.toLowerCase().trim()
  for (const [kind, re] of LEAD_PATTERNS) {
    if (re.test(t)) return kind
  }
  return null
}

// ── Diagnostics (Objective 7 — developer trace) ─────────────────────────────────

export interface PageLedDiagnostics {
  /** The vague-lead intent DONNA inferred from the utterance */
  inferredIntent: VagueLeadKind
  /** The page (route) DONNA used to resolve the recommendation */
  pageUsed: string
  /** Human-readable page label */
  pageLabel: string
  /** Which live state signals drove the recommendation */
  stateUsed: string[]
  /** Where the recommendation came from (which per-page resolver branch) */
  recommendationSource: string
  /** True — a passive clarification was avoided because page+state led */
  clarificationAvoided: boolean
  /** The active workflow objective DONNA is carrying */
  activeObjective: string
  /** The concrete next action DONNA named */
  nextAction: string
  /** Whether the answer was grounded in live (vs demo/insufficient) data */
  realityGrounded: boolean
}

export interface PageLedGuidance {
  answer: DonnaSafeReadAnswer
  diagnostics: PageLedDiagnostics
}

// ── Workflow carry ──────────────────────────────────────────────────────────────
// DONNA maintains the active thread so "continue" resumes the work instead of
// restarting. Derived from page + reality (no new lifecycle/persistence) — the
// same convergence principle as resumeExecutivePartnership.

export interface WorkflowThread {
  /** The objective being driven on this page right now */
  objective: string
  /** The single next item/player/page to act on */
  nextItem: string
  /** The follow-up that comes after the next item */
  followUp: string
}

// ── Internal: small helpers ─────────────────────────────────────────────────────

function confidenceOf(ctx: DirectorDonnaContext | null): DONNAConfidence {
  return ctx ? ctx.confidence : 'insufficient'
}

function demoPrefix(ctx: DirectorDonnaContext | null): string {
  return ctx && ctx.isLive ? '' : '[Demo] '
}

/** First name from a "First Last" attention item name. */
function firstNameOf(fullName: string | null): string | null {
  if (!fullName) return null
  const n = fullName.trim().split(/\s+/)[0]
  return n || null
}

/** Players who are active but carry no curriculum-level state yet. */
function noLevelCount(ctx: DirectorDonnaContext): number {
  return Math.max(0, ctx.playerCount - ctx.playerCurriculumStateCount)
}

/** Named players flagged for a decision (carry name + id for deep-link). */
function namedStarters(ctx: DirectorDonnaContext) {
  return ctx.attentionItems.filter(a => a.playerName)
}

// ── Per-page recommendation builders ─────────────────────────────────────────────
// Each returns a 5-beat led answer (What I see · What I recommend · Why ·
// First action · What comes next) plus the workflow thread it is carrying.

interface PageLed {
  beats: { see: string; recommend: string; why: string; firstAction: string; next: string }
  href: string | null
  followUp: string | null
  requiresApproval: boolean
  thread: WorkflowThread
  source: string
  stateUsed: string[]
}

// --- Players ---------------------------------------------------------------------
// Objective 5 proof: prioritize pending placement / named decisions BEFORE the
// bulk no-level assignment, name the first player, guide the level decision.
function ledPlayers(ctx: DirectorDonnaContext): PageLed {
  const named = namedStarters(ctx)
  const noLevel = noLevelCount(ctx)
  const eligible = ctx.advancementEligibleCount
  const stateUsed: string[] = []

  if (named.length > 0) {
    const first = named[0]
    const firstName = firstNameOf(first.playerName) ?? 'the first flagged player'
    stateUsed.push(`attentionItems(${named.length} named)`, `noLevel(${noLevel})`)
    const noLevelClause = noLevel > 0
      ? ` before the ${noLevel} player${noLevel !== 1 ? 's' : ''} with no curriculum level`
      : ''
    return {
      beats: {
        see: `You're on the Players directory. ${named.length} player${named.length !== 1 ? 's are' : ' is'} flagged for a decision${noLevel > 0 ? `, and ${noLevel} ${noLevel !== 1 ? 'have' : 'has'} no curriculum level yet` : ''}.`,
        recommend: `Start with the flagged player${named.length !== 1 ? 's' : ''}${noLevelClause}.`,
        why: `A named placement decision unlocks curriculum assignment for that player — it's higher leverage than the bulk no-level cleanup, which can follow.`,
        firstAction: `I'd start with ${firstName}${first.reason ? ` (${first.reason})` : ''}. Open ${firstName}'s profile and I'll guide the level decision.`,
        next: noLevel > 0
          ? `After that, we'll batch through the ${noLevel} no-level player${noLevel !== 1 ? 's' : ''} together.`
          : `After that, we'll confirm the rest of the roster is correctly levelled.`,
      },
      href: first.playerId ? `/director/players/${first.playerId}` : '/director/players',
      followUp: first.playerName ? `Open ${first.playerName}'s profile` : 'Open the first flagged player',
      requiresApproval: false,
      thread: {
        objective: 'Resolve player placements, then level the no-level players',
        nextItem: first.playerName ?? 'the first flagged player',
        followUp: noLevel > 0 ? `${noLevel} no-level players` : 'roster level confirmation',
      },
      source: 'ledPlayers.namedPlacement',
      stateUsed,
    }
  }

  if (noLevel > 0) {
    stateUsed.push(`noLevel(${noLevel})`)
    return {
      beats: {
        see: `You're on the Players directory. No players are flagged for attention, but ${noLevel} active player${noLevel !== 1 ? 's have' : ' has'} no curriculum level assigned.`,
        recommend: `Work through the ${noLevel} no-level player${noLevel !== 1 ? 's' : ''} and assign each a starting level.`,
        why: `Players without a curriculum level aren't in the development pipeline — coaches can't plan sessions for them and they can't progress.`,
        firstAction: `Open the player list and I'll surface the no-level players first so you can place them one by one.`,
        next: `Once everyone has a level, we'll check who's ready to advance.`,
      },
      href: '/director/players',
      followUp: 'Show the no-level players',
      requiresApproval: false,
      thread: {
        objective: 'Assign a starting level to every no-level player',
        nextItem: 'first no-level player',
        followUp: 'advancement-readiness check',
      },
      source: 'ledPlayers.noLevelBulk',
      stateUsed,
    }
  }

  if (eligible > 0) {
    stateUsed.push(`advancementEligible(${eligible})`)
    return {
      beats: {
        see: `You're on the Players directory. Every active player has a level, and ${eligible} ${eligible !== 1 ? 'are' : 'is'} flagged as advancement-eligible.`,
        recommend: `Review the ${eligible} advancement-eligible player${eligible !== 1 ? 's' : ''}.`,
        why: `Advancement decisions need your approval — players ready to move up stall if the decision waits.`,
        firstAction: `Open the player list; I'll surface the advancement-eligible players so you can review the evidence on each.`,
        next: `Each promotion you approve routes through review before the parent is notified.`,
      },
      href: '/director/players',
      followUp: 'Show advancement-eligible players',
      requiresApproval: true,
      thread: {
        objective: 'Review advancement-eligible players',
        nextItem: 'first advancement-eligible player',
        followUp: 'approval routing',
      },
      source: 'ledPlayers.advancement',
      stateUsed,
    }
  }

  // Clear roster — honest all-clear, still leads to the next useful thing.
  stateUsed.push('roster(clear)')
  return {
    beats: {
      see: `You're on the Players directory. Every active player has a level and none are flagged for attention right now.`,
      recommend: `Spot-check development trajectories or move on to curriculum coverage.`,
      why: `A clean roster is a good time to get ahead of curriculum gaps before they create stalls.`,
      firstAction: `Tell me a player's name to review their trajectory, or say "curriculum" and I'll take you to coverage gaps.`,
      next: `I'll keep watching the roster and flag anyone who starts to slip.`,
    },
    href: '/director/players',
    followUp: 'Review curriculum coverage',
    requiresApproval: false,
    thread: {
      objective: 'Maintain roster health',
      nextItem: 'curriculum coverage',
      followUp: 'trajectory spot-check',
    },
    source: 'ledPlayers.clear',
    stateUsed,
  }
}

// --- Today / dashboard -----------------------------------------------------------
function ledToday(ctx: DirectorDonnaContext): PageLed {
  const pending = ctx.pendingReviews
  const missing = ctx.missingWrapUps
  const sessions = ctx.todaySessions
  const stateUsed = [`pendingReviews(${pending})`, `missingWrapUps(${missing})`, `todaySessions(${sessions})`]

  if (pending > 0) {
    return {
      beats: {
        see: `You're on Today. ${sessions} session${sessions !== 1 ? 's' : ''} on the board and ${pending} item${pending !== 1 ? 's' : ''} waiting in your review queue.`,
        recommend: `Clear the ${pending} pending review item${pending !== 1 ? 's' : ''} first.`,
        why: `Review items are coach input that can't become official player evidence until you decide — they block the development pipeline.`,
        firstAction: `Open the review queue and I'll take you through them one at a time.`,
        next: missing > 0
          ? `After that, we'll chase the ${missing} missing wrap-up${missing !== 1 ? 's' : ''}.`
          : `After that, we'll scan today's sessions for anything that needs attention.`,
      },
      href: '/director/review',
      followUp: 'Open the review queue',
      requiresApproval: true,
      thread: {
        objective: "Clear today's decisions, then close wrap-up gaps",
        nextItem: `${pending} review item${pending !== 1 ? 's' : ''}`,
        followUp: missing > 0 ? `${missing} missing wrap-ups` : "today's sessions",
      },
      source: 'ledToday.pendingReviews',
      stateUsed,
    }
  }

  if (missing > 0) {
    return {
      beats: {
        see: `You're on Today. Your review queue is clear, but ${missing} session${missing !== 1 ? 's' : ''} ${missing !== 1 ? 'are' : 'is'} missing a coach wrap-up.`,
        recommend: `Follow up on the ${missing} missing wrap-up${missing !== 1 ? 's' : ''}.`,
        why: `Sessions without a wrap-up mean coach observations never reach the player record — the day's work is invisible.`,
        firstAction: `Open Sessions and I'll show you which coaches still owe a wrap-up.`,
        next: `Once they're in, anything actionable lands in your review queue.`,
      },
      href: '/director/sessions',
      followUp: 'Show missing wrap-ups',
      requiresApproval: false,
      thread: {
        objective: 'Close the wrap-up gap for today',
        nextItem: `${missing} missing wrap-up${missing !== 1 ? 's' : ''}`,
        followUp: 'review queue',
      },
      source: 'ledToday.missingWrapUps',
      stateUsed,
    }
  }

  return {
    beats: {
      see: `You're on Today. Review queue is clear and every session has a wrap-up.`,
      recommend: `Use the clear window to get ahead — check player trajectories or curriculum coverage.`,
      why: `Nothing is blocking you, so the highest-leverage move is preventing the next stall.`,
      firstAction: `Say "who needs attention" for a roster scan, or "curriculum" for coverage gaps.`,
      next: `I'll surface anything new the moment a coach submits or a signal changes.`,
    },
    href: '/director',
    followUp: 'Who needs attention?',
    requiresApproval: false,
    thread: {
      objective: 'Stay ahead of incoming signals',
      nextItem: 'roster scan',
      followUp: 'curriculum coverage',
    },
    source: 'ledToday.clear',
    stateUsed,
  }
}

// --- Approvals / Review ----------------------------------------------------------
function ledReview(ctx: DirectorDonnaContext): PageLed {
  const pending = ctx.pendingReviews
  const oldest = ctx.oldestPendingReviewAgeDays
  const stateUsed = [`pendingReviews(${pending})`, `oldestAgeDays(${oldest ?? 'n/a'})`]

  if (pending > 0) {
    const staleClause = oldest !== null && oldest >= 7
      ? ` The oldest has been waiting ${oldest} days — start there.`
      : ''
    return {
      beats: {
        see: `You're in the Review Center with ${pending} item${pending !== 1 ? 's' : ''} pending your decision.${staleClause}`,
        recommend: oldest !== null && oldest >= 7
          ? `Start with the oldest item, then work newest-last.`
          : `Work the queue top to bottom — approve, modify, or reject each.`,
        why: `Each item is coach or system input that takes effect only after you decide; clearing them keeps coaches unblocked and player records current.`,
        firstAction: `I'll open the first item and summarize what it changes and whether it carries any parent-visibility risk.`,
        next: `Nothing is sent or applied until you approve — I'll flag any item that touches a parent before you act.`,
      },
      href: '/director/review',
      followUp: 'Open the first item',
      requiresApproval: true,
      thread: {
        objective: 'Clear the review queue',
        nextItem: oldest !== null && oldest >= 7 ? 'oldest pending item' : 'first pending item',
        followUp: 'remaining queue items',
      },
      source: 'ledReview.pending',
      stateUsed,
    }
  }

  return {
    beats: {
      see: `You're in the Review Center and the queue is clear — no items need a decision.`,
      recommend: `Move to where the next decisions originate: today's sessions or the roster.`,
      why: `A clear queue means the academy is current; staying ahead of the next wave is the best use of the time.`,
      firstAction: `Say "what should I do today" for a full brief, or "who needs attention" for a roster scan.`,
      next: `I'll bring you back here the moment a new item arrives.`,
    },
    href: '/director',
    followUp: 'Give me a daily brief',
    requiresApproval: false,
    thread: {
      objective: 'Stay ahead of incoming decisions',
      nextItem: 'daily brief',
      followUp: 'roster scan',
    },
    source: 'ledReview.clear',
    stateUsed,
  }
}

// --- Curriculum ------------------------------------------------------------------
function ledCurriculum(ctx: DirectorDonnaContext): PageLed {
  const gapCount = ctx.curriculumGaps.length
  const coverageGaps = ctx.curriculumTemplateCoverageGapCount
  const draftCount = ctx.curriculumDraftCount
  const stateUsed = [`curriculumGaps(${gapCount})`, `coverageGaps(${coverageGaps})`, `curriculumDrafts(${draftCount})`]

  if (draftCount > 0) {
    return {
      beats: {
        see: `You're on Curriculum with ${draftCount} draft${draftCount !== 1 ? 's' : ''} pending review in the builder.`,
        recommend: `Clear the ${draftCount} pending curriculum draft${draftCount !== 1 ? 's' : ''} first.`,
        why: `Drafts you've started but not approved leave the curriculum spine in an in-between state — resolving them is the fastest way to a clean baseline.`,
        firstAction: `I'll open the builder to the pending drafts so you can approve or discard each.`,
        next: `Then we'll look at structural gaps across the spine.`,
      },
      href: '/director/curriculum/builder',
      followUp: 'Open pending drafts',
      requiresApproval: true,
      thread: {
        objective: 'Resolve curriculum drafts, then close gaps',
        nextItem: `${draftCount} pending draft${draftCount !== 1 ? 's' : ''}`,
        followUp: 'structural gaps',
      },
      source: 'ledCurriculum.drafts',
      stateUsed,
    }
  }

  if (gapCount > 0 || coverageGaps > 0) {
    const lead = gapCount > 0 ? ctx.curriculumGaps[0] : `${coverageGaps} level${coverageGaps !== 1 ? 's' : ''} with players but no class template`
    return {
      beats: {
        see: `You're on Curriculum. I can see ${gapCount > 0 ? `${gapCount} structural gap${gapCount !== 1 ? 's' : ''}` : ''}${gapCount > 0 && coverageGaps > 0 ? ' and ' : ''}${coverageGaps > 0 ? `${coverageGaps} template-coverage gap${coverageGaps !== 1 ? 's' : ''}` : ''}.`,
        recommend: `Start with the highest-impact gap: ${lead}.`,
        why: `Gaps where players already sit are the ones causing stalls right now — they outrank empty levels with no players.`,
        firstAction: `I'll open the curriculum status view focused on that gap and draft a fix for your review.`,
        next: `Any change I draft routes through review before it touches the live spine.`,
      },
      href: '/director/curriculum',
      followUp: 'Show the top gap',
      requiresApproval: false,
      thread: {
        objective: 'Close the highest-impact curriculum gaps',
        nextItem: lead,
        followUp: 'remaining gaps',
      },
      source: 'ledCurriculum.gaps',
      stateUsed,
    }
  }

  return {
    beats: {
      see: `You're on Curriculum and I don't see open gaps or pending drafts right now.`,
      recommend: `Review the curriculum status overview to confirm coverage across the spine.`,
      why: `Even with no flagged gaps, a periodic coverage pass catches levels drifting out of alignment with your players.`,
      firstAction: `I'll open the status overview so you can scan level health top to bottom.`,
      next: `Tell me a level and I'll go deeper on its drills and gates.`,
    },
    href: '/director/curriculum',
    followUp: 'Open curriculum status',
    requiresApproval: false,
    thread: {
      objective: 'Confirm curriculum coverage',
      nextItem: 'status overview',
      followUp: 'per-level deep dive',
    },
    source: 'ledCurriculum.clear',
    stateUsed,
  }
}

// --- Templates -------------------------------------------------------------------
function ledTemplates(ctx: DirectorDonnaContext): PageLed {
  const drafts = ctx.templateDrafts
  const coverageGaps = ctx.curriculumTemplateCoverageGapCount
  const hasTemplates = ctx.hasTemplates
  const stateUsed = [`templateDrafts(${drafts})`, `coverageGaps(${coverageGaps})`, `hasTemplates(${hasTemplates})`]

  if (drafts > 0) {
    return {
      beats: {
        see: `You're on Templates with ${drafts} template draft${drafts !== 1 ? 's' : ''} awaiting your review.`,
        recommend: `Finish the ${drafts} draft${drafts !== 1 ? 's' : ''} before creating anything new.`,
        why: `Half-built templates can't be published to coaches — completing them turns work you've already started into something usable.`,
        firstAction: `I'll open the first draft so you can review its block structure and publish or discard it.`,
        next: `Once published, coaches can run sessions from it.`,
      },
      href: '/director/templates',
      followUp: 'Open the first draft',
      requiresApproval: false,
      thread: {
        objective: 'Finish and publish template drafts',
        nextItem: `${drafts} draft${drafts !== 1 ? 's' : ''}`,
        followUp: 'coverage gaps',
      },
      source: 'ledTemplates.drafts',
      stateUsed,
    }
  }

  if (coverageGaps > 0) {
    return {
      beats: {
        see: `You're on Templates. ${coverageGaps} curriculum level${coverageGaps !== 1 ? 's have' : ' has'} active players but no class template assigned.`,
        recommend: `Create or assign a template for ${coverageGaps > 1 ? 'those levels' : 'that level'}.`,
        why: `Levels with players but no template force coaches to improvise — a template gives them a consistent, on-curriculum plan.`,
        firstAction: `I'll start a template targeted at the uncovered level; tell me the format and I'll draft the block sequence.`,
        next: `The draft goes to you for review before it's published to coaches.`,
      },
      href: '/director/templates',
      followUp: 'Cover the gap level',
      requiresApproval: false,
      thread: {
        objective: 'Cover every level with players',
        nextItem: 'first uncovered level',
        followUp: 'publish to coaches',
      },
      source: 'ledTemplates.coverage',
      stateUsed,
    }
  }

  return {
    beats: {
      see: `You're on Templates.${hasTemplates ? ' Your library is in place with no open drafts or coverage gaps.' : ' There are no templates yet.'}`,
      recommend: hasTemplates
        ? `Review which templates coaches use most and retire any that are stale.`
        : `Create your first class template so coaches have a structured session to run.`,
      why: hasTemplates
        ? `Keeping the library lean and current means coaches always reach for the right plan.`
        : `Without a template, every session is improvised — one good template raises the floor for the whole academy.`,
      firstAction: hasTemplates
        ? `I'll show you usage across the library so you can spot the unused ones.`
        : `Tell me a level and session length and I'll draft the block sequence for your review.`,
      next: `Anything I draft routes through your review before coaches see it.`,
    },
    href: '/director/templates',
    followUp: hasTemplates ? 'Show template usage' : 'Draft my first template',
    requiresApproval: false,
    thread: {
      objective: hasTemplates ? 'Keep the template library current' : 'Create the first template',
      nextItem: hasTemplates ? 'usage review' : 'first template draft',
      followUp: 'publish to coaches',
    },
    source: 'ledTemplates.library',
    stateUsed,
  }
}

// --- Onboarding ------------------------------------------------------------------
function ledOnboarding(ctx: DirectorDonnaContext, route: string): PageLed {
  const readiness = ctx.onboardingReadinessLevel
  const stateUsed = [`onboardingReadiness(${readiness})`, `hasPlayers(${ctx.hasPlayers})`, `hasCoaches(${ctx.hasCoaches})`]

  // Drive to the first incomplete setup pillar: coaches → players → curriculum.
  let recommend: string, firstAction: string, next: string, href: string, objective: string, nextItem: string
  if (!ctx.hasCoaches) {
    recommend = `Add your coaching staff first.`
    firstAction = `I'll take you to the coaches step — add each coach and their role.`
    next = `Then we'll add players and confirm your curriculum structure.`
    href = '/director/onboarding'
    objective = 'Complete academy setup'
    nextItem = 'add coaches'
  } else if (!ctx.hasPlayers) {
    recommend = `Add your players next.`
    firstAction = `I'll open the players step so you can bring your roster in.`
    next = `After that, we'll set the curriculum levels they'll progress through.`
    href = '/director/onboarding'
    objective = 'Complete academy setup'
    nextItem = 'add players'
  } else if (ctx.hasCurriculumGaps || readiness !== 'ready_signal') {
    recommend = `Confirm your curriculum structure.`
    firstAction = `I'll open the curriculum setup so you can choose the levels your players progress through.`
    next = `Once curriculum is set, the academy is ready to activate.`
    href = '/director/onboarding/curriculum'
    objective = 'Complete academy setup'
    nextItem = 'confirm curriculum'
  } else {
    recommend = `You're ready to activate — let's do a final review.`
    firstAction = `I'll walk you through the activation checklist so nothing's missed.`
    next = `After activation, coaches and players get access.`
    href = '/director/onboarding'
    objective = 'Activate the academy'
    nextItem = 'activation checklist'
  }

  return {
    beats: {
      see: `You're in academy setup (${readiness.replace('_', ' ')}).`,
      recommend,
      why: `Setup is sequential — staff, then players, then curriculum — so each step unlocks the next instead of leaving gaps.`,
      firstAction,
      next,
    },
    href: route.startsWith('/director/onboarding') ? href : '/director/onboarding',
    followUp: recommend,
    requiresApproval: false,
    thread: { objective, nextItem, followUp: 'activation' },
    source: 'ledOnboarding',
    stateUsed,
  }
}

// --- Generic (any other page) ----------------------------------------------------
// Uses the page capability map + the deterministic next-action engine so even
// pages without a bespoke builder lead instead of asking the director to choose.
function ledGeneric(ctx: DirectorDonnaContext | null, route: string): PageLed {
  const map = getPageCapabilityMap(route)
  const next = buildDirectorNextAction({ pendingReviews: ctx?.pendingReviews ?? 0, pathname: route })
  return {
    beats: {
      see: `You're on the ${map.pageLabel}. ${map.directorIntent}`,
      recommend: next.title ? `${next.nextStepLabel}.` : (map.suggestedPrompts[0] ?? 'Review what needs your attention here.'),
      why: next.why,
      firstAction: next.summary,
      next: next.requiresApproval
        ? `Nothing changes until you approve — I'll route anything actionable through review.`
        : `It's safe to start — I'll guide each step and flag anything that needs approval.`,
    },
    href: next.targetRoute || map.route,
    followUp: next.nextStepLabel,
    requiresApproval: next.requiresApproval,
    thread: {
      objective: map.directorIntent,
      nextItem: next.nextStepLabel,
      followUp: map.suggestedPrompts[0] ?? 'next step',
    },
    source: `ledGeneric(${next.id})`,
    stateUsed: [`pendingReviews(${ctx?.pendingReviews ?? 0})`, `route(${route})`],
  }
}

// --- Canonical attention fallback ------------------------------------------------
// A page's per-page "clear" branch only inspects that page's own counters
// (pending reviews, wrap-ups, level state). The canonical attention ranking
// (buildAcademyAttentionReport) sees the WHOLE academy — high-risk players,
// attendance exceptions, progress stalls. If a page builder is about to declare
// an all-clear while the canonical ranking still has a live item, surface that
// item instead so DONNA never tells the director "nothing is blocking you" when
// something is. Reuses the same engine focusTodayAnswerEngine leads with.
function ledFromTopAction(ctx: DirectorDonnaContext, route: string): PageLed | null {
  const report = buildAcademyAttentionReport(ctx)
  if (report.isEmpty || !report.topAction) return null
  const top = report.topAction
  return {
    beats: {
      see: `You're on the ${getPageCapabilityMap(route).pageLabel}, and the academy isn't fully clear: ${top.label}.`,
      recommend: `Start with ${top.label}.`,
      why: top.whyItMatters,
      firstAction: top.href ? `I'll take you there and walk you through it.` : `I'll walk you through it. ${top.evidence}`,
      next: report.totalCount > 1
        ? `After that, ${report.totalCount - 1} more item${report.totalCount - 1 !== 1 ? 's are' : ' is'} waiting in your attention queue.`
        : `That's the only open item right now — clearing it gets you to a genuine all-clear.`,
    },
    href: top.href ?? route,
    followUp: top.bestNextAction ?? top.label,
    requiresApproval: top.requiresApproval,
    thread: {
      objective: 'Clear the highest-priority academy signal',
      nextItem: top.label,
      followUp: report.totalCount > 1 ? `${report.totalCount - 1} more attention items` : 'all-clear',
    },
    source: 'ledFromTopAction',
    stateUsed: [`attentionReport(top=${top.id})`, `attentionItems(${report.totalCount})`],
  }
}

// ── Page router ─────────────────────────────────────────────────────────────────

function resolveForPage(ctx: DirectorDonnaContext | null, route: string): PageLed {
  // Player profile is a single-player surface — defer to generic page guidance.
  if (ctx) {
    let led: PageLed
    if (route === '/director/players') led = ledPlayers(ctx)
    else if (route === '/director/today' || route === '/director' || route === '/director/') led = ledToday(ctx)
    else if (route.startsWith('/director/review')) led = ledReview(ctx)
    else if (route.startsWith('/director/curriculum')) led = ledCurriculum(ctx)
    else if (route.startsWith('/director/templates') || route.startsWith('/director/class-templates')) led = ledTemplates(ctx)
    else if (route.startsWith('/director/onboarding')) led = ledOnboarding(ctx, route)
    else led = ledGeneric(ctx, route)

    // Never declare an all-clear while the canonical ranking still has a live
    // item. Onboarding is exempt — its "clear" state means setup is complete,
    // which is a different axis from operational attention signals.
    if (led.source.endsWith('.clear') && !route.startsWith('/director/onboarding')) {
      const escalated = ledFromTopAction(ctx, route)
      if (escalated) return escalated
    }
    return led
  }
  return ledGeneric(ctx, route)
}

// ── Public resolver ──────────────────────────────────────────────────────────────

export interface PageLedInput {
  text: string
  route: string
  ctx: DirectorDonnaContext | null
}

/**
 * Resolve a vague-lead director request into a page-led, state-grounded
 * recommendation that DONNA leads with — instead of a page-agnostic assumption
 * or a passive clarification menu. Returns null when the request is not a
 * vague-lead (so upstream engines keep their behavior) — callers should only
 * invoke this after confirming a route is present.
 *
 * 5-beat contract: What I see · What I recommend · Why · First action · What next.
 */
export function resolvePageLedGuidance(input: PageLedInput): PageLedGuidance | null {
  const kind = detectVagueLeadRequest(input.text)
  if (!kind) return null

  const route = input.route
  if (!route) return null

  const map = getPageCapabilityMap(route)
  const led = resolveForPage(input.ctx, route)
  const prefix = demoPrefix(input.ctx)
  const realityGrounded = !!input.ctx && input.ctx.isLive && input.ctx.confidence !== 'insufficient'

  // "continue" keeps the director moving on the current page's highest-priority
  // work. This is deliberately framed as continuing the *current* priority, not
  // as restoring a specific earlier decision — true cross-page thread resumption
  // is the brain's completion contract (resumeExecutivePartnership), which the
  // router defers to; this engine only owns the page-level priority.
  const opener = kind === 'continue'
    ? `${prefix}Let's keep moving — ${led.thread.objective.toLowerCase()}. ${led.beats.see}`
    : `${prefix}${led.beats.see}`

  const text = formatBeats(led.beats, { see: opener, includeWhy: true })

  const answer: DonnaSafeReadAnswer = {
    actionId: `page_led_${led.source.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`,
    text,
    confidence: confidenceOf(input.ctx),
    sourceNote: input.ctx
      ? (input.ctx.isLive ? `Page-led from ${map.pageLabel} + live academy state` : `Page-led from ${map.pageLabel} (demo data)`)
      : `Page-led from ${map.pageLabel}`,
    followUp: led.followUp,
    href: led.href,
    isAnswerable: true,
  }

  const diagnostics: PageLedDiagnostics = {
    inferredIntent: kind,
    pageUsed: route,
    pageLabel: map.pageLabel,
    stateUsed: led.stateUsed,
    recommendationSource: led.source,
    clarificationAvoided: true,
    activeObjective: led.thread.objective,
    nextAction: led.thread.nextItem,
    realityGrounded,
  }

  return { answer, diagnostics }
}

/**
 * Page-only lead for leaf clarifiers that have a route but no DirectorDonnaContext.
 * Returns a led recommendation string from the page capability map — never a
 * passive menu — or null when no route is available. Used to override legacy
 * clarification fallbacks so they lead from the page even without live state.
 */
export function resolvePageOnlyLead(text: string, route: string | null | undefined): string | null {
  if (!route) return null
  if (!detectVagueLeadRequest(text)) return null
  const led = ledGeneric(null, route)
  // No live context, so omit the "Why" beat — the page-only lead is shorter.
  return formatBeats(led.beats, { includeWhy: false })
}

// Single beat assembler shared by the canonical-router path (with "Why") and the
// leaf-clarifier path (without). Keeps the 5-beat wording in one place so the two
// surfaces never drift.
function formatBeats(
  beats: PageLed['beats'],
  opts: { see?: string; includeWhy: boolean },
): string {
  const lines = [
    opts.see ?? beats.see,
    `Here's what I'd do: ${beats.recommend}`,
  ]
  if (opts.includeWhy) lines.push(`Why: ${beats.why}`)
  lines.push(beats.firstAction)
  lines.push(`What comes next: ${beats.next}`)
  return lines.join('\n')
}

// ── Developer trace formatter (Objective 7) ──────────────────────────────────────

export function formatPageLedDiagnostics(d: PageLedDiagnostics): string {
  return [
    'DONNA Conversation Ownership — trace',
    `  inferred intent     : ${d.inferredIntent}`,
    `  page used           : ${d.pageUsed} (${d.pageLabel})`,
    `  state used          : ${d.stateUsed.join(', ') || 'none'}`,
    `  recommendation src  : ${d.recommendationSource}`,
    `  clarification avoided: ${d.clarificationAvoided}`,
    `  active objective    : ${d.activeObjective}`,
    `  next action         : ${d.nextAction}`,
    `  reality grounded    : ${d.realityGrounded}`,
  ].join('\n')
}
