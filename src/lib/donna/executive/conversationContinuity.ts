// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 4 — Conversation continuity.
//
// Resolves follow-up references so DONNA does not restart the conversation:
//   "Create an Orange 2 template." → "Make it more competitive." → "Actually
//    focus more on transition."
//
// The job is NOT to decide the answer (OpenAI reasons over the packet for that).
// The job is to: (1) detect that a turn continues prior work, (2) bind pronouns
// like "it"/"that" to the active draft or last entity, and (3) rewrite the
// message into a self-contained form so downstream reasoning never loses the
// referent. Deterministic and fail-open: if nothing matches, the message is
// returned unchanged with isContinuation=false.

import type { ResolverState } from './executiveTypes'

export interface ContinuityResolution {
  /** True when this turn continues prior work rather than starting fresh. */
  isContinuation: boolean
  /** The bound referent, e.g. "Orange 2 — Class Template", or null. */
  referent: string | null
  /** What the turn acts on, if anything. */
  modifies: 'active_draft' | 'last_entity' | null
  /** Message rewritten to be self-contained for reasoning. */
  resolvedMessage: string
  /** Short note for provenance/audit. */
  note: string
}

// Pronouns/anaphora that need a referent to be meaningful on their own.
const PRONOUN_PATTERNS = [
  'make it ', 'make that ', 'change it', 'change that', 'update it', 'update that',
  ' it ', ' it.', ' it,', ' that ', ' that.', ' that,', ' this one', ' that one',
]

// Phrases that signal a continuation/refinement of the prior turn even without a pronoun.
const CONTINUATION_MARKERS = [
  'actually', 'instead', 'also', 'and make', 'and add', 'and focus', 'focus more',
  'lean more', 'lean it', 'more on', 'less on', 'rather than', 'on second thought',
  'keep going', 'continue', 'same but', 'but make', 'but with',
]

function startsLikeNewIntent(lower: string): boolean {
  // A fresh creation/navigation command is not a continuation even if short.
  return (
    lower.startsWith('create ') ||
    lower.startsWith('build ') ||
    lower.startsWith('make a ') ||
    lower.startsWith('new ') ||
    lower.startsWith('go to ') ||
    lower.startsWith('open ') ||
    lower.startsWith('show me ')
  )
}

export function resolveContinuity(state: ResolverState): ContinuityResolution {
  const raw = state.message.trim()
  const lower = ` ${raw.toLowerCase()} `

  const none: ContinuityResolution = {
    isContinuation: false,
    referent: null,
    modifies: null,
    resolvedMessage: raw,
    note: 'no continuation signal',
  }

  if (!raw) return none
  if (startsLikeNewIntent(raw.toLowerCase())) return none

  const hasPronoun = PRONOUN_PATTERNS.some(p => lower.includes(p))
  const hasMarker = CONTINUATION_MARKERS.some(m => lower.includes(m))
  if (!hasPronoun && !hasMarker) return none

  // Bind to the active draft first (strongest referent), then to the last entity.
  if (state.activeDraft) {
    const referent = state.activeDraft.label
    const resolved = hasPronoun
      ? raw.replace(/\b(it|that|this one|that one)\b/i, `the ${referent}`)
      : `${raw} (continuing work on the ${referent})`
    return {
      isContinuation: true,
      referent,
      modifies: 'active_draft',
      resolvedMessage: resolved,
      note: `bound to active draft: ${referent}`,
    }
  }

  if (state.lastEntityLabel) {
    const referent = state.lastEntityLabel
    const resolved = hasPronoun
      ? raw.replace(/\b(it|that|this one|that one)\b/i, referent)
      : `${raw} (referring to ${referent})`
    return {
      isContinuation: true,
      referent,
      modifies: 'last_entity',
      resolvedMessage: resolved,
      note: `bound to last entity: ${referent}`,
    }
  }

  // Continuation signal present but no referent available — still mark it a
  // continuation so the resolver pulls conversation history to recover context.
  return {
    isContinuation: true,
    referent: null,
    modifies: null,
    resolvedMessage: raw,
    note: 'continuation without bound referent — history required',
  }
}
