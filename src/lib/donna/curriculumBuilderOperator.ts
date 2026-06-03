// Curriculum Builder Operator V1
// Handles the "help me improve [level]" conversational workflow.
// Provides context-first summaries before asking any question.
//
// Rule: DONNA never starts with "What would you like to do?"
// DONNA always shows the current state first, then asks one focused question.
//
// Pure TypeScript — no DB calls, no mutations.

import type { CurriculumImprovementAnalysis, CurriculumImprovementSuggestion } from './curriculumImprovementEngine'
import { formatSuggestionForDonna } from './curriculumImprovementEngine'

// ─── Level key extraction ─────────────────────────────────────────────────────

const LEVEL_PATTERNS: Array<{ pattern: RegExp; key: string; label: string }> = [
  { pattern: /red ball? ?1|r1\b/i,        key: 'red_ball_1',    label: 'Red Ball 1' },
  { pattern: /red ball? ?2|r2\b/i,        key: 'red_ball_2',    label: 'Red Ball 2' },
  { pattern: /red ball? ?3|r3\b/i,        key: 'red_ball_3',    label: 'Red Ball 3' },
  { pattern: /red ball\b/i,               key: 'red_ball',      label: 'Red Ball' },
  { pattern: /orange ball? ?1|o1\b/i,     key: 'orange_ball_1', label: 'Orange Ball 1' },
  { pattern: /orange ball? ?2|o2\b/i,     key: 'orange_ball_2', label: 'Orange Ball 2' },
  { pattern: /orange ball? ?3|o3\b/i,     key: 'orange_ball_3', label: 'Orange Ball 3' },
  { pattern: /orange ball\b/i,            key: 'orange_ball',   label: 'Orange Ball' },
  { pattern: /green (dot|ball)? ?1|g1\b/i, key: 'green_dot_1',  label: 'Green Dot 1' },
  { pattern: /green (dot|ball)? ?2|g2\b/i, key: 'green_dot_2',  label: 'Green Dot 2' },
  { pattern: /green (dot|ball)\b/i,        key: 'green_dot',    label: 'Green Dot' },
  { pattern: /yellow ball? ?1|y1\b/i,     key: 'yellow_ball_1', label: 'Yellow Ball 1' },
  { pattern: /yellow ball? ?2|y2\b/i,     key: 'yellow_ball_2', label: 'Yellow Ball 2' },
  { pattern: /yellow ball\b/i,            key: 'yellow_ball',   label: 'Yellow Ball' },
  { pattern: /high.?perf(ormance)?\b/i,   key: 'high_performance', label: 'High Performance' },
]

export interface ExtractedLevel {
  key:   string
  label: string
}

export function extractLevelFromText(text: string): ExtractedLevel | null {
  for (const { pattern, key, label } of LEVEL_PATTERNS) {
    if (pattern.test(text)) return { key, label }
  }
  return null
}

// ─── Context-first summary builders ──────────────────────────────────────────

export interface CurriculumContextSummary {
  levelKey:     string
  levelLabel:   string
  currentState: string   // What currently exists in the curriculum
  gapSummary:   string   // What's missing or weak
  evidenceLine: string   // Evidence signal summary
  focusQuestion: string  // One focused question to the director
}

export function buildContextFirstSummary(
  level: ExtractedLevel,
  currentGoal: string | null,
  gateCount: number,
  skillCount: number,
  analysis: CurriculumImprovementAnalysis,
): CurriculumContextSummary {
  const levelLabel = level.label

  const currentState = currentGoal
    ? `Current ${levelLabel} goal: "${currentGoal}". The level has ${gateCount} gate${gateCount !== 1 ? 's' : ''} and ${skillCount} skill${skillCount !== 1 ? 's' : ''} defined.`
    : `${levelLabel} has ${gateCount} gate${gateCount !== 1 ? 's' : ''} and ${skillCount} skill${skillCount !== 1 ? 's' : ''} defined. No level goal is currently set.`

  let gapSummary: string
  if (analysis.suggestions.length === 0) {
    gapSummary = `No high-confidence improvement suggestions yet — ${analysis.totalEvidence} evidence record${analysis.totalEvidence !== 1 ? 's' : ''} analyzed. Run more assessments at this level to generate evidence-backed recommendations.`
  } else {
    const topSuggestion = analysis.suggestions[0]
    gapSummary = `${analysis.suggestions.length} improvement suggestion${analysis.suggestions.length !== 1 ? 's' : ''} identified. Top suggestion: "${topSuggestion.recommendation}" (${topSuggestion.confidence} confidence, ${topSuggestion.evidenceCount} evidence records).`
  }

  const evidenceLine = analysis.totalEvidence > 0
    ? `${analysis.totalEvidence} evidence record${analysis.totalEvidence !== 1 ? 's' : ''} analyzed from player assessments, readiness signals, and development priorities at this level.`
    : 'No evidence records available yet for this level. Complete player assessments to generate evidence-backed recommendations.'

  const focusQuestion = analysis.suggestions.length > 0
    ? `Based on this evidence, I recommend starting with "${analysis.suggestions[0].recommendation}". Would you like to see the full evidence breakdown, or draft this change now?`
    : `What aspect of ${levelLabel} would you like to improve? I can analyze any specific area once you have more assessment data.`

  return { levelKey: level.key, levelLabel, currentState, gapSummary, evidenceLine, focusQuestion }
}

// ─── Full DONNA workflow response builder ────────────────────────────────────

export interface CurriculumOperatorResponse {
  type:        'context_summary' | 'suggestion_detail' | 'draft_ready' | 'no_data'
  message:     string
  route:       string
  focusId:     string
  suggestion?: CurriculumImprovementSuggestion
  levelKey:    string
  levelLabel:  string
}

export function buildCurriculumImproveResponse(
  text: string,
  analysis: CurriculumImprovementAnalysis,
  summary: CurriculumContextSummary,
): CurriculumOperatorResponse {
  const { levelKey, levelLabel } = analysis

  // "Why are you recommending this?" or "show me the evidence"
  if (/why.{0,30}(recommend|suggest)|show me (the )?evidence|how confident|what (evidence|signals?)|what (supports?|backs?)/i.test(text)) {
    if (analysis.suggestions.length > 0) {
      const top = analysis.suggestions[0]
      return {
        type:      'suggestion_detail',
        message:   formatSuggestionForDonna(top),
        route:     `/director/curriculum?improve=${levelKey}`,
        focusId:   'donna-curriculum-context',
        suggestion: top,
        levelKey,
        levelLabel,
      }
    }
  }

  // "Draft the change" or "prepare approval"
  if (/draft (the |this )?(change|improvement|suggestion)|prepare (the )?approval|create (the )?draft/i.test(text)) {
    if (analysis.suggestions.length > 0) {
      const top = analysis.suggestions[0]
      return {
        type:    'draft_ready',
        message: `Ready to draft: "${top.recommendation}".\n\n${top.draftStarter}\n\nOnce you confirm, I'll create a draft in your Review Queue. Nothing is applied until you approve it there.`,
        route:   `/director/curriculum?improve=${levelKey}`,
        focusId: 'curriculum-review-draft',
        suggestion: top,
        levelKey,
        levelLabel,
      }
    }
  }

  // "Show impact" or "what changes?"
  if (/show (me )?(the )?impact|what (would |will )?(change|happen)|downstream/i.test(text)) {
    if (analysis.suggestions.length > 0) {
      const top = analysis.suggestions[0]
      const impact = [
        `**Impact: ${top.recommendation}**`,
        '',
        '**Will happen if approved:**',
        ...top.impactLines.map(l => `· ${l}`),
        '',
        '**Will NOT happen:**',
        ...top.wontHappenLines.map(l => `· ${l}`),
        '',
        `**Effort level:** ${top.changeType === 'add_gate' ? 'Moderate' : 'Low'}`,
        `**Affected players:** ~${top.affectedPlayers}`,
      ].join('\n')
      return {
        type:    'suggestion_detail',
        message: impact,
        route:   `/director/curriculum?improve=${levelKey}`,
        focusId: 'donna-curriculum-context',
        suggestion: top,
        levelKey,
        levelLabel,
      }
    }
  }

  // Default: context-first summary
  if (analysis.suggestions.length === 0) {
    return {
      type:      'no_data',
      message:   [
        `Here is the current state of ${levelLabel}:`,
        '',
        summary.currentState,
        '',
        summary.gapSummary,
        '',
        summary.evidenceLine,
        '',
        summary.focusQuestion,
      ].join('\n'),
      route:   `/director/curriculum?improve=${levelKey}`,
      focusId: 'donna-curriculum-context',
      levelKey,
      levelLabel,
    }
  }

  return {
    type:    'context_summary',
    message: [
      `Here is the current state of ${levelLabel}:`,
      '',
      summary.currentState,
      '',
      `**Assessment & Evidence Signals:**`,
      summary.evidenceLine,
      '',
      `**What I'm seeing:**`,
      summary.gapSummary,
      '',
      summary.focusQuestion,
    ].join('\n'),
    route:    `/director/curriculum?improve=${levelKey}`,
    focusId:  'donna-curriculum-context',
    suggestion: analysis.suggestions[0],
    levelKey,
    levelLabel,
  }
}
