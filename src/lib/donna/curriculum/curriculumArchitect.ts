// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1716–1745
// Curriculum Architect: the intelligence fusion engine.
//
// V1 — Deterministic: all responses are derived from loaded context via
// keyword matching, coverage analysis, and rule-based inference.
// No LLM calls. Same context always produces the same output.
//
// Core design:
//   interpretDirectorInput()  → classify intent + infer fields from context
//   assembleDraftFromContext() → build as much of CurriculumDraftObject as possible
//   generateArchitectResponse() → compose DONNA's fused intelligence response
//   getUnansweredFields()      → only return what cannot be inferred

import type { CurriculumIntelligenceContext, CurriculumLevelSummary, PlayerLevelSummary } from './curriculumIntelligenceContext'
import type { CurriculumDraftObject, CurriculumModificationIntent } from './curriculumDraftObject'
import { createEmptyDraft } from './curriculumDraftObject'
import { wasRecommendationAccepted, getMemoryForLevel } from './curriculumMemory'
import { routeDonnaIntentV1 } from '@/lib/donna/donnaIntentRouterV1'

// ── Intent interpretation ─────────────────────────────────────────────────────

export interface InterpretedIntent {
  intent: CurriculumModificationIntent
  confidence: 'high' | 'medium' | 'low'
  inferredLevel: CurriculumLevelSummary | null
  inferredContentType: string | null
  inferredTitle: string | null
  inferredTargetItemId: string | null
  inferredTargetItemTitle: string | null
  /** True when DONNA populated the draft from context without director input */
  inferenceNote: string | null
}

const CONTENT_TYPE_KEYWORDS: Record<string, string[]> = {
  drill:       ['drill', 'exercise', 'practice activity', 'feeding drill'],
  skill:       ['skill', 'technique', 'fundamental', 'mechanics'],
  game:        ['game', 'match play', 'point play', 'competitive drill', 'rally game'],
  tactical:    ['tactical', 'strategy', 'pattern', 'formation', 'decision'],
  assessment:  ['assessment', 'gate', 'test', 'evaluation', 'checkpoint'],
  fitness:     ['fitness', 'movement', 'agility', 'strength', 'physical'],
  mental_skill:['mental', 'mindset', 'focus', 'routine', 'resilience', 'pressure'],
  progression: ['progression', 'harder version', 'advanced version', 'step up'],
  regression:  ['regression', 'easier version', 'simplified version', 'step down'],
  coach_cue:   ['coach cue', 'coaching cue', 'cue', 'teaching point', 'vocabulary'],
  success_criteria: ['success criteria', 'success standard', 'mastery criteria'],
  player_mission:   ['player mission', 'homework', 'home practice', 'self-practice'],
  parent_guidance:  ['parent guidance', 'parent explanation', 'parent note'],
}

const LEVEL_NAME_PATTERNS = [
  /\b(red\s+ball\s*[123]?|rb\s*[123]?)\b/i,
  /\b(orange\s+ball\s*[123]?|ob\s*[123]?)\b/i,
  /\b(green\s+ball\s*[123]?|gb\s*[123]?)\b/i,
  /\b(yellow\s+ball\s*[123]?|yb\s*[123]?)\b/i,
  /\b(high\s+performance|hp\s*[123]?)\b/i,
]

const MODIFICATION_KEYWORDS = ['change', 'update', 'edit', 'modify', 'fix', 'adjust', 'improve']
const MOVE_KEYWORDS          = ['move', 'relocate', 'shift', 'transfer', 'place']
const EXPAND_KEYWORDS        = ['expand', 'harder version', 'easier version', 'progression', 'regression', 'variation']
const REPLACE_KEYWORDS       = ['replace', 'swap', 'swap out']
const REMOVE_KEYWORDS        = ['remove', 'delete', 'take out', 'get rid of']

function inferLevelFromText(
  text: string,
  levels: CurriculumLevelSummary[],
): CurriculumLevelSummary | null {
  const lower = text.toLowerCase()

  // Pass 1: full display name match (most reliable — "Orange Ball 2" in text)
  for (const level of levels) {
    if (lower.includes(level.displayName.toLowerCase())) return level
  }

  // Pass 2: initials abbreviation — first letter of each word joined
  // "orange ball 2" → "ob2", "red ball 1" → "rb1". More specific than a 3-char slice.
  for (const level of levels) {
    const initials = level.displayName
      .toLowerCase()
      .split(/\s+/)
      .map(w => w[0] ?? '')
      .join('')
    if (initials.length >= 2 && lower.includes(initials)) return level
  }

  // Pass 3: LEVEL_NAME_PATTERNS fallback (handles "rb2", "ob1" etc.)
  for (const pattern of LEVEL_NAME_PATTERNS) {
    if (pattern.test(lower)) {
      const match = lower.match(pattern)?.[0] ?? ''
      const found = levels.find(l =>
        l.displayName.toLowerCase().replace(/\s+/g, ' ').startsWith(match.trim()),
      )
      if (found) return found
    }
  }

  return null
}

function inferContentTypeFromText(text: string): string | null {
  const lower = text.toLowerCase()

  // Score each type by the earliest position of a matching keyword.
  // Earlier position = more likely to be the director's primary intent.
  // Ties broken by the original keyword map order.
  let bestType: string | null = null
  let bestPos = Infinity

  for (const [type, keywords] of Object.entries(CONTENT_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      const pos = lower.indexOf(kw)
      if (pos !== -1 && pos < bestPos) {
        bestPos = pos
        bestType = type
      }
    }
  }

  return bestType
}

function inferMutationIntent(text: string): CurriculumModificationIntent {
  const lower = text.toLowerCase()
  if (REMOVE_KEYWORDS.some(kw => lower.includes(kw)))  return 'remove'
  if (REPLACE_KEYWORDS.some(kw => lower.includes(kw))) return 'replace'
  if (MOVE_KEYWORDS.some(kw => lower.includes(kw)))    return 'move'
  if (EXPAND_KEYWORDS.some(kw => lower.includes(kw)))  return 'expand'
  if (MODIFICATION_KEYWORDS.some(kw => lower.includes(kw))) return 'modify'
  return 'add'
}

export function interpretDirectorInput(
  text: string,
  context: CurriculumIntelligenceContext,
): InterpretedIntent {
  const routeResult = routeDonnaIntentV1(text, '/director/curriculum/builder')

  // Map router result to mutation intent
  let intent: CurriculumModificationIntent
  switch (routeResult.intent) {
    case 'curriculum_modify':          intent = 'modify'; break
    case 'curriculum_move':            intent = 'move'; break
    case 'curriculum_expand':          intent = 'expand'; break
    case 'curriculum_replace':         intent = 'replace'; break
    case 'curriculum_remove':          intent = 'remove'; break
    case 'curriculum_draft_create':    intent = 'add'; break
    case 'curriculum_draft_follow_up': intent = 'add'; break
    default:
      // For deferred intents and unknown: fall back to keyword scan
      intent = inferMutationIntent(text)
  }

  const inferredLevel     = inferLevelFromText(text, context.levels)
  const inferredContentType = inferContentTypeFromText(text)

  // Best-guess title: extract quoted text or the main noun phrase
  const quotedMatch = text.match(/["']([^"']{3,60})["']/)
  const inferredTitle = quotedMatch ? quotedMatch[1] : null

  let inferenceNote: string | null = null
  if (inferredLevel && inferredContentType) {
    inferenceNote = `I've identified this as a ${inferredContentType} at ${inferredLevel.displayName}.`
  } else if (inferredLevel) {
    inferenceNote = `I've identified the level as ${inferredLevel.displayName}.`
  } else if (inferredContentType) {
    inferenceNote = `I've identified the content type as ${inferredContentType}.`
  }

  return {
    intent,
    confidence: routeResult.confidence,
    inferredLevel,
    inferredContentType,
    inferredTitle,
    inferredTargetItemId:    null, // V1: item lookup requires a separate query
    inferredTargetItemTitle: null,
    inferenceNote,
  }
}

// ── Draft assembly from context ───────────────────────────────────────────────

export function assembleDraftFromContext(
  interpreted: InterpretedIntent,
  context: CurriculumIntelligenceContext,
): CurriculumDraftObject {
  const draft = createEmptyDraft(interpreted.intent)

  if (interpreted.inferredLevel) {
    draft.levelId   = interpreted.inferredLevel.id
    draft.levelName = interpreted.inferredLevel.displayName
  }
  if (interpreted.inferredContentType) {
    draft.contentType = interpreted.inferredContentType
  }
  if (interpreted.inferredTitle) {
    draft.title = interpreted.inferredTitle
  }
  if (interpreted.inferredTargetItemId) {
    draft.targetItemId    = interpreted.inferredTargetItemId
    draft.targetItemTitle = interpreted.inferredTargetItemTitle ?? undefined
  }

  // Academy DNA → infer pathway
  const model = context.academyDna.inferredModel
  if (model === 'competitive_elite' || model === 'competitive_development') {
    draft.pathway = 'competition'
  } else if (model === 'recreational') {
    draft.pathway = 'mixed'
  } else {
    draft.pathway = 'skill'
  }

  return draft
}

// ── Fields still needed from director ─────────────────────────────────────────

export interface UnansweredField {
  fieldId: string
  label: string
  question: string
  hint: string
  required: boolean
}

export function getUnansweredFields(draft: CurriculumDraftObject): UnansweredField[] {
  const missing: UnansweredField[] = []

  if (draft.intent === 'modify' || draft.intent === 'move' || draft.intent === 'replace' || draft.intent === 'remove') {
    if (!draft.targetItemId && !draft.targetItemTitle) {
      missing.push({
        fieldId: 'target_item',
        label:   'Which item?',
        question: 'Which item are you changing? You can paste the name or describe it.',
        hint:    'Example: "Cross-court forehand rally at Orange Ball 2"',
        required: true,
      })
    }
  }

  if (draft.intent === 'add' || draft.intent === 'expand' || draft.intent === 'replace') {
    if (!draft.levelId) {
      missing.push({
        fieldId: 'level',
        label:   'Which level?',
        question: 'Which level does this belong to?',
        hint:    'Example: Orange Ball 2, Yellow Ball 3',
        required: true,
      })
    }
    if (!draft.title) {
      missing.push({
        fieldId: 'title',
        label:   'Name',
        question: 'What do you want to call it?',
        hint:    'Keep it concise and specific.',
        required: true,
      })
    }
  }

  if (draft.intent === 'move') {
    if (!draft.levelId) {
      missing.push({
        fieldId: 'target_level',
        label:   'Target level',
        question: 'Which level are you moving it to?',
        hint:    'Example: Green Ball 1 → Yellow Ball 1',
        required: true,
      })
    }
  }

  return missing
}

// ── Architect response composer ───────────────────────────────────────────────

export interface ArchitectResponse {
  message: string
  /** Fields DONNA pre-filled from context */
  inferenceLines: string[]
  /** Insights from other intelligence layers surfaced in this response */
  insightLines: string[]
  /** Approval gate statement always shown before save */
  approvalStatement: string
  /** Next question if any required field is still missing */
  nextQuestion: UnansweredField | null
}

function buildCoverageInsights(
  level: CurriculumLevelSummary | null,
  intent: CurriculumModificationIntent,
  context: CurriculumIntelligenceContext,
): string[] {
  const lines: string[] = []
  if (!level) return lines

  const memory = getMemoryForLevel(context.memory, level.id)
  const playerLevel = context.playerByLevel.find(p => p.levelId === level.id) ?? null

  if (intent === 'add' || intent === 'expand') {
    // Surface coverage gaps
    if (level.isEmpty) {
      lines.push(`${level.displayName} has no academy content yet — this would be the first item.`)
    } else if (level.isSparse) {
      lines.push(`${level.displayName} has only ${level.itemCount} item${level.itemCount !== 1 ? 's' : ''} — low coverage.`)
    }

    // Surface model-based content type insight
    const model = context.academyDna.inferredModel
    const byType = level.itemCountByType
    if (model === 'competitive_elite' || model === 'competitive_development') {
      const tacticalCount = (byType['tactical'] ?? 0) + (byType['game'] ?? 0)
      const technicalCount = byType['drill'] ?? 0
      if (tacticalCount === 0 && technicalCount > 0) {
        lines.push(
          `No tactical content at ${level.displayName} yet — your competitive model and stage priority weighting suggest this is worth addressing.`,
        )
      }
    }

    // Surface gate coverage
    const gatesForLevel = context.gates.filter(g => g.toLevelId === level.id)
    if (gatesForLevel.length > 0) {
      const uniqueDomains = gatesForLevel.map(g => g.domain).filter((d, i, arr) => arr.indexOf(d) === i)
      const gateDomains = uniqueDomains.join(', ')
      lines.push(`${level.displayName} has ${gatesForLevel.length} advancement gate${gatesForLevel.length !== 1 ? 's' : ''} covering: ${gateDomains}.`)
    }

    // Player evidence signals
    if (playerLevel && playerLevel.playerCount > 0) {
      lines.push(
        `${playerLevel.playerCount} player${playerLevel.playerCount !== 1 ? 's' : ''} currently at ${level.displayName}` +
        (playerLevel.advancementEligibleCount > 0
          ? ` — ${playerLevel.advancementEligibleCount} advancement-eligible`
          : '')
        + '.',
      )
      if (playerLevel.weakDomains.length > 0) {
        lines.push(`Player evidence shows weak signals in: ${playerLevel.weakDomains.slice(0, 3).join(', ')}.`)
      }
      // Surface the highest-confidence improvement suggestion
      const topSuggestion = playerLevel.improvementSuggestions
        .filter(s => s.confidenceScore >= 55)
        .sort((a, b) => b.confidenceScore - a.confidenceScore)[0]
      if (topSuggestion) {
        lines.push(
          `DONNA signals: ${topSuggestion.recommendation} ` +
          `(${topSuggestion.affectedPlayers} player${topSuggestion.affectedPlayers !== 1 ? 's' : ''}, ` +
          `confidence ${topSuggestion.confidenceScore}%).`,
        )
      }
    }
  }

  if (intent === 'modify' || intent === 'remove' || intent === 'replace') {
    // Gate dependency warning
    const gatesForLevel = context.gates.filter(g => g.fromLevelId === level.id || g.toLevelId === level.id)
    if (gatesForLevel.length > 0) {
      lines.push(
        `${level.displayName} has ${gatesForLevel.length} advancement gate${gatesForLevel.length !== 1 ? 's' : ''} — changes to items at this level may affect advancement criteria.`,
      )
    }

    // Player count awareness for disruptive changes
    if (playerLevel && playerLevel.playerCount > 0) {
      lines.push(
        `${playerLevel.playerCount} player${playerLevel.playerCount !== 1 ? 's are' : ' is'} currently at ${level.displayName} — this change affects their active curriculum.`,
      )
    }
  }

  if (intent === 'move') {
    const gatesForLevel = context.gates.filter(g => g.fromLevelId === level.id)
    if (gatesForLevel.length > 0) {
      lines.push(
        `${level.displayName} has gate criteria that depend on its content — verify the move does not create a gate gap.`,
      )
    }
  }

  // Surface relevant memory
  if (memory.length > 0) {
    const recent = memory[0]
    lines.push(`Last curriculum change at ${level.displayName}: ${recent.changeDescription} (${recent.createdAt.slice(0, 10)}).`)
  }

  return lines
}

function buildApprovalStatement(intent: CurriculumModificationIntent): string {
  if (intent === 'replace') {
    return 'This creates two review queue items — a removal and an addition. Both require your approval before anything changes.'
  }
  return 'Nothing changes until you approve the draft in your review queue.'
}

export function generateArchitectResponse(
  interpreted: InterpretedIntent,
  draft: CurriculumDraftObject,
  context: CurriculumIntelligenceContext,
): ArchitectResponse {
  const insightLines = buildCoverageInsights(interpreted.inferredLevel, interpreted.intent, context)
  const inferenceLines: string[] = []
  if (interpreted.inferenceNote) inferenceLines.push(interpreted.inferenceNote)

  const unanswered = getUnansweredFields(draft)
  const nextQuestion = unanswered[0] ?? null

  // Data gap acknowledgement
  if (context.dataGaps.includes('item_counts')) {
    insightLines.push("I couldn't load item counts for your levels — coverage insights may be incomplete.")
  }
  if (!context.academyDna.hasDna) {
    insightLines.push("Your academy profile isn't set up yet — complete onboarding to get philosophy-based recommendations.")
  }

  let message: string
  if (nextQuestion) {
    const contextPart = insightLines.length > 0
      ? `${insightLines[0]} `
      : ''
    message = `${contextPart}${nextQuestion.question}`
  } else {
    const levelName = draft.levelName ?? 'the selected level'
    const contentType = draft.contentType ?? 'item'
    message = `I've built a ${contentType} draft for ${levelName}. Review the fields below — edit anything before saving to your queue.`
  }

  return {
    message,
    inferenceLines,
    insightLines,
    approvalStatement: buildApprovalStatement(interpreted.intent),
    nextQuestion,
  }
}

// ── V2 deferred intent handler ────────────────────────────────────────────────

export function buildDeferredIntentResponse(intentType: string): string {
  return `The "${intentType.replace('curriculum_', '')}" capability is coming in the next DONNA intelligence update. For now, I can help you add, modify, move, expand, replace, or remove curriculum items.`
}

const DEFERRED_INTENTS = new Set([
  'curriculum_review',
  'curriculum_compare',
  'curriculum_explain',
  'curriculum_recommend',
  'curriculum_audit',
])

export function isV2DeferredIntent(intentType: string): boolean {
  return DEFERRED_INTENTS.has(intentType)
}

// ── Recommendation surface ────────────────────────────────────────────────────

export interface CurriculumRecommendation {
  id: string
  levelId: string
  levelName: string
  contentType: string
  rationale: string
  priority: number
  prefillIntent: CurriculumModificationIntent
}

export function buildCurriculumRecommendations(
  context: CurriculumIntelligenceContext,
): CurriculumRecommendation[] {
  const recommendations: CurriculumRecommendation[] = []
  const model = context.academyDna.inferredModel

  // Content-type emphasis by model
  const contentTypePriority: string[] =
    model === 'competitive_elite' || model === 'competitive_development'
      ? ['tactical', 'assessment', 'game', 'drill']
      : model === 'recreational'
      ? ['game', 'drill', 'fitness']
      : ['drill', 'skill', 'game']

  // Stage priority: rank 1 = highest priority stage
  const topStageKeys = Object.entries(context.academyDna.stagePriorities)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([k]) => k)

  // ── Player evidence-backed recommendations ──────────────────────────────
  // These take priority over DNA-only recommendations because they have
  // actual player signals, not just model inference.
  if (context.playerIntelligenceAvailable) {
    for (const playerLevel of context.playerByLevel) {
      if (!playerLevel.hasEvidence) continue
      if (playerLevel.playerCount === 0) continue

      const topSuggestions = playerLevel.improvementSuggestions
        .filter(s => s.confidenceScore >= 50 && !wasRecommendationAccepted(context.memory, playerLevel.levelId, s.targetDomain))
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, 2)

      for (const suggestion of topSuggestions) {
        const contentType = suggestion.targetDomain ?? 'drill'
        const isAdd = suggestion.changeType.startsWith('add_') || suggestion.changeType === 'fill_gap'

        recommendations.push({
          id:             `player_rec_${playerLevel.levelId}_${contentType}`,
          levelId:        playerLevel.levelId,
          levelName:      playerLevel.levelName,
          contentType,
          rationale:      buildPlayerEvidenceRationale(playerLevel, suggestion),
          priority:       Math.round(suggestion.confidenceScore / 10) + (playerLevel.advancementEligibleCount > 0 ? 2 : 0),
          prefillIntent:  isAdd ? 'add' : 'modify',
        })

        if (recommendations.length >= 3) break
      }
      if (recommendations.length >= 3) break
    }
  }

  // ── DNA-only recommendations to fill remaining slots ────────────────────
  for (const level of context.levels) {
    if (recommendations.length >= 3) break
    if (level.itemCount >= 5 && !level.isSparse) continue

    const levelMemory = context.memory.filter(m => m.levelId === level.id)
    if (levelMemory.length >= 3) continue

    for (const contentType of contentTypePriority.slice(0, 2)) {
      if (recommendations.length >= 3) break
      if ((level.itemCountByType[contentType] ?? 0) > 0) continue
      if (wasRecommendationAccepted(context.memory, level.id, contentType)) continue
      // Skip if we already added a player-backed rec for this level
      if (recommendations.some(r => r.levelId === level.id)) continue

      const stageMatch = topStageKeys.some(k => level.stage?.toLowerCase().includes(k.toLowerCase()))
      const priority = level.isEmpty ? 10 : level.isSparse ? 7 : stageMatch ? 5 : 3

      recommendations.push({
        id:             `rec_${level.id}_${contentType}`,
        levelId:        level.id,
        levelName:      level.displayName,
        contentType,
        rationale:      buildRecommendationRationale(level, contentType, context),
        priority,
        prefillIntent:  'add',
      })
    }
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 3)
}

function buildPlayerEvidenceRationale(
  playerLevel: PlayerLevelSummary,
  suggestion: { recommendation: string; affectedPlayers: number; confidenceScore: number },
): string {
  return (
    suggestion.recommendation +
    ` (${playerLevel.playerCount} player${playerLevel.playerCount !== 1 ? 's' : ''} at this level` +
    (suggestion.affectedPlayers > 0 ? `, ${suggestion.affectedPlayers} affected` : '') +
    `, confidence ${suggestion.confidenceScore}%).`
  )
}

function buildRecommendationRationale(
  level: CurriculumLevelSummary,
  contentType: string,
  context: CurriculumIntelligenceContext,
): string {
  if (level.isEmpty) {
    return `${level.displayName} has no content — this would establish the foundation for this level.`
  }
  const model = context.academyDna.inferredModel
  if ((model === 'competitive_elite' || model === 'competitive_development') && contentType === 'tactical') {
    return `No tactical content at ${level.displayName}. Your competitive model prioritises tactical development — this closes a coverage gap.`
  }
  if (contentType === 'assessment') {
    return `No assessment items at ${level.displayName} — advancement evidence relies on external observations only.`
  }
  return `${level.displayName} is missing ${contentType} content (${level.itemCount} item${level.itemCount !== 1 ? 's' : ''} total).`
}
