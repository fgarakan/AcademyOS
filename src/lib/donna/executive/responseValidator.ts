// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 10 — Response Validator.
//
// Only validated responses reach the UI. After reasoning produces text, this gate
// checks it against five dimensions and dispositions the result. Deterministic and
// fail-safe: validation never throws; on doubt it downgrades (modify) rather than
// passing unsafe text through.

import type { ExecutiveContextPacket } from './executiveContextPacket'
import { serializePacket } from './executiveContextPacket'
import type { ResolverState } from './executiveTypes'

export type ValidationDisposition = 'accepted' | 'modified' | 'rejected'

export interface ValidationResult {
  disposition: ValidationDisposition
  valid: boolean
  issues: string[]
  /** Possibly-cleaned text safe to display. */
  finalText: string
}

// Tone breaks — DONNA is an executive partner, never an "AI assistant" voice.
const FORBIDDEN_TONE = [
  'as an ai', 'as a language model', "i'm just a", 'i am just a',
  'i cannot help with that', 'i am unable to', "i don't have feelings",
  'i am a bot', 'as an assistant',
]

// Claims of having executed a mutation — DONNA proposes, the system executes.
const FORBIDDEN_EXECUTION_CLAIMS = [
  'i have approved', "i've approved", 'i have sent', "i've sent",
  'i have saved to the database', 'i have emailed', "i've emailed",
  'i have notified the parent', 'i deleted', 'i have published',
]

function extractNumbers(text: string): string[] {
  return (text.match(/\d+(?:\.\d+)?/g) ?? [])
}

export function validateExecutiveResponse(
  text: string,
  packet: ExecutiveContextPacket,
  state: ResolverState,
): ValidationResult {
  const issues: string[] = []
  let finalText = text.trim()
  let disposition: ValidationDisposition = 'accepted'

  if (!finalText) {
    return { disposition: 'rejected', valid: false, issues: ['empty response'], finalText: '' }
  }

  const lower = finalText.toLowerCase()

  // 1. Executive tone — reject AI-assistant voice outright (caller falls back).
  if (FORBIDDEN_TONE.some(p => lower.includes(p))) {
    issues.push('forbidden assistant-voice tone')
    return { disposition: 'rejected', valid: false, issues, finalText }
  }

  // 2. Permissions / execution claims — DONNA must not claim to have executed.
  if (FORBIDDEN_EXECUTION_CLAIMS.some(p => lower.includes(p))) {
    issues.push('claims to have executed a mutation (proposes, never executes)')
    return { disposition: 'rejected', valid: false, issues, finalText }
  }

  // 2.5 Executive experience gate (Mega Sprint 3751–3780) — DONNA is an Executive
  //     Operating Partner, not a workflow router. When the packet already carries
  //     real context, a menu-style ("Would you like: 1… 2… 3…"), a generic
  //     clarification ("describe what you need in your own words", "what would you
  //     like to do"), or an "I think you're trying to…" answer is Workflow-DONNA
  //     behavior and must not reach the director. Replace it with grounded executive
  //     guidance derived from the packet. Only fires when context exists — a
  //     clarifying question with NO context to ground an answer is still allowed.
  const hasContext = packet.assembled.length > 0 || packet.outstandingDecisions.length > 0
  const looksLikeMenu =
    /would you like(?: me)?(?: to)?:?\s*\n?\s*1[.)]/i.test(finalText) ||
    /(?:^|\n)\s*1[.)]\s+.+\n\s*2[.)]\s+/.test(finalText) ||
    /\bor describe what you need in your own words\b/i.test(lower) ||
    /\bplease choose an option\b/i.test(lower)
  const looksGeneric =
    /\bdescribe what you need in your own words\b/i.test(lower) ||
    /\bwhat would you like to (do|explore|start with)\b/i.test(lower) ||
    /\bwhat are you trying to (do|accomplish)\b/i.test(lower) ||
    /\bi think you(?:'re| are) (?:trying to|might be)\b/i.test(lower) ||
    /\bcould you (?:give me|tell me)(?: a bit)? more\b/i.test(lower)
  if (hasContext && (looksLikeMenu || looksGeneric)) {
    const top = packet.outstandingDecisions[0]
    const grounded = top
      ? `Here's where we stand. The first thing I'd take on is ${top.summary}.`
      : `I've reviewed the current state and the priorities in front of you.`
    const next = packet.completionContract?.nextAction ?? 'Tell me what you’d like to tackle next.'
    finalText = `${grounded} ${next}`.trim()
    issues.push('replaced workflow-menu/generic-clarification with grounded executive guidance')
    disposition = 'modified'
    // fall through: remaining dimensions validate the grounded replacement.
  }

  // 3. Hallucination risk — numbers in the answer that appear nowhere in the
  //    packet or the message. Flag (modify), do not hard-reject, since reasoning
  //    may legitimately derive a sum; the flag surfaces for review.
  const haystack = `${serializePacket(packet)} ${packet.effectiveMessage} ${state.message}`
  const stray = extractNumbers(finalText).filter(n => !haystack.includes(n))
  if (stray.length) {
    issues.push(`unverifiable figure(s): ${stray.join(', ')}`)
    disposition = 'modified'
  }

  // 4. Workflow consistency — a revision turn should reference the active draft.
  if (packet.reasoningGoal === 'revise' && packet.activeDraft) {
    const label = packet.activeDraft.label.toLowerCase()
    const refsDraft = lower.includes(label) || lower.includes('draft') || lower.includes('template')
    if (!refsDraft) {
      issues.push('revision response does not reference the active draft')
      disposition = 'modified'
    }
  }

  // 5. Completion contract — response must move work forward. If it does not end
  //    with a forward step, append the packet's completion next-action.
  const endsForward = /[?]\s*$/.test(finalText) ||
    /(next|review|approve|tell me|want me to|let me|i'll|i will|shall i)/i.test(finalText)
  if (!endsForward) {
    const next = packet.completionContract?.nextAction ?? 'Tell me what you’d like to tackle next.'
    finalText = `${finalText} ${next}`.trim()
    issues.push('appended completion next-action')
    if (disposition === 'accepted') disposition = 'modified'
  }

  // Rejected paths already returned above — anything reaching here is valid.
  return { disposition, valid: true, issues, finalText }
}
