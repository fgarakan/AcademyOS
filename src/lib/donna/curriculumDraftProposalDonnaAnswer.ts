// Sprint 739 -- DONNA Curriculum Draft Proposal Answer Engine V1
// Detects curriculum change intents ("add a gate to Orange 2", "add this drill")
// and produces a structured proposed edit formatted for director review.
// Routes to curriculum builder for actual implementation -- no DB writes from DONNA.
// Pure TypeScript -- no DB, no AI, no mutations, no side effects.

import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// -- Pattern detection --------------------------------------------------------
// These patterns specifically detect CHANGE INTENT (add/modify/remove + content + level).
// They must NOT overlap with gap analysis (CAP 4) or impact questions (CAP 8).

const DRAFT_CHANGE_PATTERNS =
  /\b(add|create|insert|include).{0,20}\b(a |an )?(gate|drill|skill|mission|badge|requirement|exercise|fitness block)\b/i

const MODIFY_CHANGE_PATTERNS =
  /\b(modify|update|change|edit|revise|rewrite).{0,20}\b(gate|drill|skill|requirement|level|curriculum)\b/i

const REMOVE_CHANGE_PATTERNS =
  /\b(remove|delete|drop|take out|eliminate).{0,20}\b(gate|drill|skill|mission|badge|requirement)\b/i

const DRAFT_PROPOSAL_INTENT =
  /\b(draft|propose|suggest|create).{0,20}\b(curriculum|change|edit|update|modification|proposal)\b/i

export function isCurriculumDraftProposalIntent(text: string): boolean {
  return (
    DRAFT_CHANGE_PATTERNS.test(text) ||
    MODIFY_CHANGE_PATTERNS.test(text) ||
    REMOVE_CHANGE_PATTERNS.test(text) ||
    DRAFT_PROPOSAL_INTENT.test(text)
  )
}

// -- Change type and content extraction ---------------------------------------

type DraftChangeType =
  | 'add_gate'
  | 'add_drill'
  | 'add_skill'
  | 'add_mission'
  | 'add_badge'
  | 'modify_requirement'
  | 'remove_drill'
  | 'modify_level'
  | 'note'

function detectChangeType(text: string): DraftChangeType {
  const t = text.toLowerCase()
  if (/add.{0,20}gate|gate.{0,20}add/.test(t)) return 'add_gate'
  if (/add.{0,20}drill|drill.{0,20}add/.test(t)) return 'add_drill'
  if (/add.{0,20}skill|skill.{0,20}add/.test(t)) return 'add_skill'
  if (/add.{0,20}mission|mission.{0,20}add/.test(t)) return 'add_mission'
  if (/add.{0,20}badge|badge.{0,20}add/.test(t)) return 'add_badge'
  if (/remove|delete|drop|eliminate/.test(t)) return 'remove_drill'
  if (/modify|update|change|edit|revise/.test(t) && /level/.test(t)) return 'modify_level'
  if (/modify|update|change|edit|revise/.test(t)) return 'modify_requirement'
  return 'note'
}

const CHANGE_TYPE_LABELS: Record<DraftChangeType, string> = {
  add_gate: 'Add gate',
  add_drill: 'Add drill',
  add_skill: 'Add skill',
  add_mission: 'Add mission',
  add_badge: 'Add badge',
  modify_requirement: 'Modify requirement',
  remove_drill: 'Remove drill',
  modify_level: 'Modify level',
  note: 'Curriculum note',
}

const CHANGE_TYPE_RISK: Record<DraftChangeType, string> = {
  add_gate: 'medium',
  add_drill: 'low',
  add_skill: 'low',
  add_mission: 'low',
  add_badge: 'low',
  modify_requirement: 'medium',
  remove_drill: 'medium',
  modify_level: 'high',
  note: 'low',
}

export function extractTargetLevel(text: string): string | null {
  const t = text.toLowerCase()
  const levelPatterns: Array<[RegExp, string]> = [
    [/red.?1/i, 'Red 1'], [/red.?2/i, 'Red 2'], [/red.?3/i, 'Red 3'],
    [/orange.?1/i, 'Orange 1'], [/orange.?2/i, 'Orange 2'], [/orange.?3/i, 'Orange 3'],
    [/yellow.?1/i, 'Yellow 1'], [/yellow.?2/i, 'Yellow 2'], [/yellow.?3/i, 'Yellow 3'],
    [/hp.?1|high.?perf.?1/i, 'HP 1'], [/hp.?2|high.?perf.?2/i, 'HP 2'], [/hp.?3|high.?perf.?3/i, 'HP 3'],
    [/\bred\b/i, 'Red'], [/\borange\b/i, 'Orange'], [/\byellow\b/i, 'Yellow'],
    [/\bhp\b|\bhigh.?perf/i, 'High Performance'],
  ]

  for (const [pattern, label] of levelPatterns) {
    if (pattern.test(t)) return label
  }
  return null
}

function extractProposedContent(text: string): string {
  // Try to extract quoted content or a description after "called", "named", "that"
  const quotedMatch = text.match(/["']([^"']+)["']/)
  if (quotedMatch) return quotedMatch[1]

  const calledMatch = text.match(/called\s+([^,.\n]+)/i)
  if (calledMatch) return calledMatch[1].trim()

  const namedMatch = text.match(/named\s+([^,.\n]+)/i)
  if (namedMatch) return namedMatch[1].trim()

  const thatMatch = text.match(/that\s+([^,.\n]{10,60})/i)
  if (thatMatch) return thatMatch[1].trim()

  return '[description from your text -- add detail before submitting for review]'
}

// -- Answer builders ----------------------------------------------------------

function buildDraftProposalAnswer(
  changeType: DraftChangeType,
  targetLevel: string | null,
  proposedContent: string,
): DonnaSafeReadAnswer {
  const changeLabel = CHANGE_TYPE_LABELS[changeType]
  const riskLevel = CHANGE_TYPE_RISK[changeType]
  const levelNote = targetLevel ? ` for ${targetLevel}` : ''

  const proposalLines = [
    `**Proposed curriculum change:**`,
    '',
    `• **Change type:** ${changeLabel}`,
    `• **Target level:** ${targetLevel ?? 'Not specified -- please confirm'}`,
    `• **Proposed content:** ${proposedContent}`,
    `• **Risk level:** ${riskLevel}`,
    `• **Status:** Draft -- requires director review before any curriculum content changes`,
    '',
    '**What happens next:**',
    '1. Review the proposal above -- add detail if needed',
    '2. Go to the Curriculum Builder to formally create this change',
    '3. It will be saved as a proposed edit for your approval',
    '4. Nothing in the official curriculum changes until you explicitly approve',
    '',
    `This draft${levelNote} is ready to be submitted for review. Want me to take you to the Curriculum Builder?`,
  ]

  return {
    actionId: `curriculum_draft_${changeType}`,
    text: proposalLines.join('\n'),
    confidence: 'partial',
    sourceNote: 'Curriculum draft proposal from chat intent',
    followUp: 'Take me to Curriculum Builder',
    href: '/director/curriculum/builder',
    isAnswerable: true,
  }
}

function buildAskForLevelAnswer(): DonnaSafeReadAnswer {
  return {
    actionId: 'curriculum_draft_ask_level',
    text: 'I can draft a curriculum change for you. Which level should this apply to? (e.g., "Orange 2", "Yellow 1")',
    confidence: 'partial',
    sourceNote: 'Level context needed for curriculum draft',
    followUp: null,
    href: null,
    isAnswerable: true,
  }
}

// ── Sprint 912.8: Drill slot extraction helpers ───────────────────────────────

/**
 * Extracts a focus area from a drill creation request.
 * Supports: "focused on X", "about X", "covering X", "add a [X] drill".
 * Returns null if no focus area can be determined — caller should ask a clarifying question.
 */
export function extractFocusArea(text: string): string | null {
  // "focused on X" / "focus on X"
  const focusedOnMatch = text.match(/\bfocused?\s+on\s+([^,.\n]{3,60})/i)
  if (focusedOnMatch) return focusedOnMatch[1].trim()

  // "covering X"
  const coveringMatch = text.match(/\bcovering\s+([^,.\n]{3,60})/i)
  if (coveringMatch) return coveringMatch[1].trim()

  // "about X" (only when no level name would be consumed — checked last)
  const aboutMatch = text.match(/\babout\s+([a-z][^,.\n]{3,60})/i)
  if (aboutMatch) return aboutMatch[1].trim()

  // "add a [FOCUS] drill" / "create a [FOCUS] drill" — focus is between verb and "drill"
  // Non-greedy so we get the shortest match before "\s+drill".
  const betweenMatch = text.match(/\b(?:add|create)\s+(?:an?\s+)?(.{3,40}?)\s+drill\b/i)
  if (betweenMatch) {
    const candidate = betweenMatch[1].trim()
    if (!/^(a|an|the|new|good|great|simple|basic)$/i.test(candidate)) {
      return candidate
    }
  }

  return null
}

/**
 * Builds the DONNA summary text shown before asking for director confirmation
 * when creating a drill draft via chat.
 */
export function buildDrillConfirmationSummaryText(levelName: string, focusArea: string): string {
  return (
    `I can create a draft to add a **${focusArea}** drill to your ${levelName} curriculum. ` +
    `It will go to your Review Center for approval — nothing in the official curriculum changes until you approve it. ` +
    `Should I create this draft?`
  )
}

// -- Main entry point ---------------------------------------------------------
// Called from DonnaVoiceReadyShell dispatch chain (Sprint 739).
// Returns null if the text is not a curriculum change intent.

export function tryAnswerCurriculumDraftProposal(text: string): DonnaSafeReadAnswer | null {
  if (!isCurriculumDraftProposalIntent(text)) return null

  const changeType = detectChangeType(text)
  const targetLevel = extractTargetLevel(text)
  const proposedContent = extractProposedContent(text)

  if (!targetLevel) {
    return buildAskForLevelAnswer()
  }

  return buildDraftProposalAnswer(changeType, targetLevel, proposedContent)
}
