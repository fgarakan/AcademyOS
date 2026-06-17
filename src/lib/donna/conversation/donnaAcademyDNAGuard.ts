// Mega Sprint 2971–3000 — DONNA Live AI Conversation + Learning Router V1
// Part 6 — Academy DNA Guard
//
// Guards AI-drafted responses against the academy's declared philosophy (DNA)
// and universal AcademyOS operating model rules.
//
// Academy DNA is the supreme authority — AI suggestions are advisory only.
// When an AI draft conflicts with either:
//   (a) Universal operating model rules (always enforced), or
//   (b) DNA-sensitive topics (enforced when academyDNAContext is provided),
// the guard blocks or flags the draft and optionally provides a safer alternative.
//
// Verdict hierarchy:
//   'pass'    — no conflict detected; draft is safe to show director
//   'flagged' — draft touches a DNA-sensitive area; proceed with caution
//   'blocked' — draft contradicts operating model; use suggested alternative
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Conservative: flag rather than pass when uncertain about DNA alignment.
//   - Academy DNA context is optional — guard still enforces universal rules when absent.

// ── Guard result ──────────────────────────────────────────────────────────────

export type DNAGuardVerdict = 'pass' | 'flagged' | 'blocked'

export interface DNAGuardResult {
  verdict: DNAGuardVerdict
  reason: string | null
  suggestedAlternative: string | null
}

// ── Universal block patterns ──────────────────────────────────────────────────
// These always apply regardless of academy DNA — they contradict the AcademyOS
// operating model where AI proposes and directors approve.

const UNIVERSAL_BLOCK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\b(you should|definitely|always|never|must)\s+(change|update|move|delete|remove|reassign)\b/i,
    reason: 'AI cannot issue definitive mutation instructions — director approval required',
  },
  {
    pattern: /\b(skip|bypass|ignore)\s+(the\s+)?(review|approval|queue|workflow)\b/i,
    reason: 'AI must not suggest bypassing the approval workflow',
  },
  {
    pattern: /\bas (an|a|your) ai\b/i,
    reason: 'AI must not self-identify — DONNA is the voice; the AI is invisible',
  },
  {
    pattern: /\b(i guarantee|i promise|i confirm|this is definitely)\b/i,
    reason: 'AI cannot make guarantees — DONNA speaks with data-backed confidence only',
  },
]

// ── DNA-sensitive patterns ────────────────────────────────────────────────────
// Soft flags when academyDNAContext is provided — these topics should align with
// the academy's declared philosophy before being shown to the director.

const DNA_SENSITIVE_PATTERNS: Array<{ pattern: RegExp; topic: string }> = [
  { pattern: /\b(competition|compete|competitive|tournament)\b/i, topic: 'competition philosophy' },
  { pattern: /\b(move up|promote|advance|level up|ready to move)\b/i, topic: 'player advancement' },
  { pattern: /\b(parent|family|guardian)\s+(communication|update|message)\b/i, topic: 'parent relations' },
  { pattern: /\b(curriculum|methodology|program structure|training model)\b/i, topic: 'curriculum philosophy' },
  { pattern: /\b(fire|let go|remove|replace)\s+(coach|staff)\b/i, topic: 'staff management' },
]

// ── Guard ─────────────────────────────────────────────────────────────────────

export interface DNAGuardInput {
  aiDraft: string
  academyDNAContext?: string | null
}

/**
 * Guard an AI draft against AcademyOS operating rules and academy DNA.
 * Academy DNA always takes precedence over AI suggestions.
 */
export function checkAcademyDNAGuard(input: DNAGuardInput): DNAGuardResult {
  const { aiDraft, academyDNAContext } = input

  // 1. Universal blocks — always enforced
  for (const { pattern, reason } of UNIVERSAL_BLOCK_PATTERNS) {
    if (pattern.test(aiDraft)) {
      return {
        verdict: 'blocked',
        reason,
        suggestedAlternative: 'That requires director review. Want me to surface this in the review queue?',
      }
    }
  }

  // 2. DNA-sensitive flags — only when context provided (can't evaluate without knowing the DNA)
  if (academyDNAContext) {
    const lower = aiDraft.toLowerCase()
    for (const { pattern, topic } of DNA_SENSITIVE_PATTERNS) {
      if (pattern.test(lower)) {
        return {
          verdict: 'flagged',
          reason: `Response touches "${topic}" — verify alignment with academy philosophy.`,
          suggestedAlternative: null,
        }
      }
    }
  }

  return {
    verdict: 'pass',
    reason: null,
    suggestedAlternative: null,
  }
}
