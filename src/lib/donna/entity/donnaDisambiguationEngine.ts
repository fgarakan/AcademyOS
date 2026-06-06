// Mega Sprint 2291–2320 — DONNA Academy Entity Intelligence V1
// Disambiguation engine: builds clarification questions for multi-match results,
// parses the director's follow-up answer, and returns the resolved entity.
// Pure TypeScript — no DB calls, no React, no side effects.

import type { ResolvedEntityV2, EntityKind } from './donnaEntityResolver'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DisambiguationChoice {
  index:     number
  label:     string      // e.g. "Jake Barrios (Player)"
  kindLabel: string      // e.g. "Player"
  entity:    ResolvedEntityV2
}

export interface DisambiguationQuestion {
  questionText: string
  choices:      DisambiguationChoice[]
  rawInput:     string
}

// ── Kind labels ───────────────────────────────────────────────────────────────

const KIND_LABELS: Record<EntityKind, string> = {
  player:            'Player',
  coach:             'Coach',
  parent:            'Parent',
  group:             'Group',
  curriculum_level:  'Curriculum Level',
  assessment:        'Assessment',
  template:          'Template',
  session:           'Session',
  workflow:          'Workflow',
}

// ── Build disambiguation question ────────────────────────────────────────────

export function buildDisambiguationQuestion(
  candidates: ResolvedEntityV2[],
  rawInput:   string,
): DisambiguationQuestion {
  const choices: DisambiguationChoice[] = candidates.slice(0, 3).map((entity, i) => {
    const kindLabel = KIND_LABELS[entity.kind] ?? entity.kind
    return {
      index:     i + 1,
      label:     `${entity.displayName} (${kindLabel})`,
      kindLabel,
      entity,
    }
  })

  const listItems = choices.map(c => `${c.index}. ${c.label}`).join('\n')
  const questionText = `I found a few matches for "${rawInput}":\n${listItems}\n\nWhich one did you mean?`

  return { questionText, choices, rawInput }
}

// ── Ordinal patterns ──────────────────────────────────────────────────────────

const ORDINAL_PATTERNS: Array<{ re: RegExp; index: number }> = [
  { re: /\b(1|one|first|the\s+first)\b/i,  index: 0 },
  { re: /\b(2|two|second|the\s+second)\b/i, index: 1 },
  { re: /\b(3|three|third|the\s+third)\b/i, index: 2 },
]

// ── Resolve disambiguation answer ─────────────────────────────────────────────

/**
 * Given a director's answer to a disambiguation question, returns the resolved entity.
 *
 * Handles:
 *   - Numeric / ordinal: "1", "first", "the second one"
 *   - Kind reference: "the player", "the coach", "coach"
 *   - Name match: "Danny Barrios", "Danny"
 *   - Fallback: null (cannot resolve — ask again)
 */
export function resolveDisambiguationAnswer(
  answer:   string,
  question: DisambiguationQuestion,
): ResolvedEntityV2 | null {
  if (!answer.trim() || question.choices.length === 0) return null

  const lower = answer.toLowerCase().trim()

  // 1. Numeric / ordinal reference
  for (const { re, index } of ORDINAL_PATTERNS) {
    if (re.test(lower) && index < question.choices.length) {
      return question.choices[index].entity
    }
  }

  // 2. Kind reference ("the player", "a coach", "curriculum")
  for (const choice of question.choices) {
    const kindLower = choice.kindLabel.toLowerCase()
    if (lower.includes(kindLower)) return choice.entity
    // Also match EntityKind key
    if (lower.includes(choice.entity.kind.replace('_', ' '))) return choice.entity
  }

  // 3. Name match (partial display name)
  const lowerInput = lower
  let bestScore    = 0
  let bestEntity: ResolvedEntityV2 | null = null

  for (const choice of question.choices) {
    const name = choice.entity.displayName.toLowerCase()
    // Exact or starts-with
    if (name === lowerInput || name.startsWith(lowerInput) || lowerInput.includes(name)) {
      return choice.entity
    }
    // Partial word match
    const nameWords  = name.split(/\s+/)
    const inputWords = lowerInput.split(/\s+/)
    const matched    = nameWords.filter(w => inputWords.includes(w))
    const score      = matched.length / Math.max(nameWords.length, 1)
    if (score > bestScore) {
      bestScore  = score
      bestEntity = choice.entity
    }
  }

  if (bestScore >= 0.5 && bestEntity) return bestEntity

  return null
}

// ── Format choices as readable list ──────────────────────────────────────────

export function formatChoicesForDisplay(question: DisambiguationQuestion): string {
  return question.choices.map(c => `${c.index}. ${c.label}`).join('\n')
}
