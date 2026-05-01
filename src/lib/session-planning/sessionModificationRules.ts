import type { GroupNeedsResult, PlayerNeedsItem } from './groupNeedsAggregation'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SuggestionType =
  | 'add_constraint'
  | 'simplify_drill'
  | 'increase_challenge'
  | 'adjust_scoring'
  | 'add_recovery_requirement'
  | 'add_target_zone'
  | 'adjust_partner_grouping'
  | 'extend_block'
  | 'shorten_block'
  | 'add_assessment_moment'
  | 'add_watch_for_cue'
  | 'add_progression'
  | 'add_regression'

export type RiskLevel = 'low' | 'medium' | 'high'
export type Confidence = 'low' | 'medium' | 'high'

export interface SuggestionDraft {
  suggestion_type: SuggestionType
  suggested_change: string
  reason: string
  players_supported: string[]
  player_needs_considered: string[]
  curriculum_context: Record<string, string>
  risk_level: RiskLevel
  confidence: Confidence
  target_block_hint: string | null
}

export interface SessionInput {
  id: string
  group_id: string | null
  template_id: string | null
  session_notes: string | null
}

export interface BlockInput {
  id: string
  name: string
  type: string
  duration_min: number
  notes: string | null
}

export interface CurriculumContextInput {
  levelName: string | null
  levelStage: string | null
  academyVersionName: string | null
  overrideSummaryLines: string[]
}

export interface GenerateSuggestionsInput {
  session: SessionInput
  blocks: BlockInput[]
  groupNeeds: GroupNeedsResult
  curriculumContext: CurriculumContextInput | null
}

export interface GenerateSuggestionsResult {
  suggestions: SuggestionDraft[]
  warnings: string[]
}

// ─── Keyword banks ─────────────────────────────────────────────────────────────

const RECOVERY_KEYWORDS = ['recovery', 'recover', 'tired', 'fatigue', 'rest', 'stamina', 'energy']
const SPACING_KEYWORDS = ['spacing', 'contact', 'footwork', 'movement', 'positioning', 'court coverage']
const RETURN_KEYWORDS = ['return', 'return of serve', 'receive', 'receiving', 'return readiness']
const SERVE_KEYWORDS = ['serve', 'service', 'first serve', 'second serve']
const DIRECTION_KEYWORDS = ['direction', 'directional', 'down the line', 'cross court', 'target']
const RALLY_KEYWORDS = ['rally', 'rallying', 'baseline', 'groundstroke', 'consistency']
const COMPETITION_KEYWORDS = ['competition', 'game', 'match', 'points', 'score', 'live ball']
const TECHNICAL_KEYWORDS = ['technical', 'technique', 'stroke', 'swing', 'mechanics', 'form']
const SERVE_RETURN_BLOCK_TYPES = ['drill', 'game', 'competition', 'warm_up']
const GAME_BLOCK_TYPES = ['game', 'competition', 'drill']

// ─── Helper: count players matching a keyword set ─────────────────────────────

function playersMatchingNeeds(players: PlayerNeedsItem[], keywords: string[]): PlayerNeedsItem[] {
  return players.filter(p =>
    p.thingsToWorkOn.some(n => keywords.some(k => n.toLowerCase().includes(k))) ||
    (p.developmentFocus && keywords.some(k => p.developmentFocus!.toLowerCase().includes(k)))
  )
}

function playersMatchingStrengths(players: PlayerNeedsItem[], keywords: string[]): PlayerNeedsItem[] {
  return players.filter(p =>
    p.strengths.some(s => keywords.some(k => s.toLowerCase().includes(k)))
  )
}

function overridesMentionKeywords(overrides: string[], keywords: string[]): boolean {
  return overrides.some(o => keywords.some(k => o.toLowerCase().includes(k)))
}

function blocksMatchingType(blocks: BlockInput[], types: string[]): BlockInput[] {
  return blocks.filter(b => types.some(t => b.type.toLowerCase().includes(t)))
}

function blockNamesContain(block: BlockInput, keywords: string[]): boolean {
  return keywords.some(k => block.name.toLowerCase().includes(k))
}

// ─── Main function ────────────────────────────────────────────────────────────

export function generateSessionModificationSuggestions(
  input: GenerateSuggestionsInput
): GenerateSuggestionsResult {
  const { blocks, groupNeeds, curriculumContext } = input
  const suggestions: SuggestionDraft[] = []
  const warnings: string[] = [...groupNeeds.warnings]
  const players = groupNeeds.players

  if (players.length === 0) {
    return { suggestions: [], warnings: ['No players in class — cannot generate suggestions.'] }
  }

  const absentPlayers = players.filter(p => p.attendanceStatus === 'absent')
  const presentPlayers = players.filter(p => p.attendanceStatus !== 'absent')
  const activePlayers = presentPlayers.length > 0 ? presentPlayers : players

  const overrides = groupNeeds.academyOverrideSummaries
  const threshold = Math.max(2, Math.floor(activePlayers.length * 0.3))

  // ─── Rule 1: Recovery needs ──────────────────────────────────────────────

  const recoveryPlayers = playersMatchingNeeds(activePlayers, RECOVERY_KEYWORDS)
  if (recoveryPlayers.length >= threshold) {
    const targetBlock = blocksMatchingType(blocks, GAME_BLOCK_TYPES).find(
      b => !blockNamesContain(b, ['warm', 'cool'])
    )
    suggestions.push({
      suggestion_type: 'add_recovery_requirement',
      suggested_change:
        `Add a recovery break between rallies: require players to touch the back fence or baseline before the next point. Reduce continuous rally length to 4–6 balls.`,
      reason: `${recoveryPlayers.length} player${recoveryPlayers.length > 1 ? 's' : ''} in this class have recovery/stamina as a current focus area.`,
      players_supported: recoveryPlayers.map(p => p.fullName),
      player_needs_considered: ['recovery', 'stamina'],
      curriculum_context: curriculumContext ? { level: curriculumContext.levelName ?? '' } : {},
      risk_level: 'low',
      confidence: recoveryPlayers.length >= threshold + 1 ? 'high' : 'medium',
      target_block_hint: targetBlock ? targetBlock.name : null,
    })
  }

  // ─── Rule 2: Spacing / footwork needs ────────────────────────────────────

  const spacingPlayers = playersMatchingNeeds(activePlayers, SPACING_KEYWORDS)
  if (spacingPlayers.length >= threshold) {
    const targetBlock = blocksMatchingType(blocks, TECHNICAL_KEYWORDS.concat(GAME_BLOCK_TYPES)).find(
      b => !blockNamesContain(b, ['warm', 'cool'])
    ) ?? blocks[0] ?? null
    suggestions.push({
      suggestion_type: 'add_watch_for_cue',
      suggested_change:
        `Watch for: court positioning and recovery steps after each shot. Cue players to return to ready position. Consider adding a cone at the T as a positioning target.`,
      reason: `${spacingPlayers.length} player${spacingPlayers.length > 1 ? 's' : ''} in this class have spacing/footwork/positioning as a current focus area.`,
      players_supported: spacingPlayers.map(p => p.fullName),
      player_needs_considered: ['spacing', 'footwork', 'positioning'],
      curriculum_context: curriculumContext ? { level: curriculumContext.levelName ?? '' } : {},
      risk_level: 'low',
      confidence: 'medium',
      target_block_hint: targetBlock?.name ?? null,
    })
  }

  // ─── Rule 3: Return / serve readiness needs ───────────────────────────────

  const returnPlayers = playersMatchingNeeds(activePlayers, RETURN_KEYWORDS)
  const returnOverride = overridesMentionKeywords(overrides, RETURN_KEYWORDS)
  if (returnPlayers.length >= Math.max(1, threshold - 1) || returnOverride) {
    const serveReturnBlocks = blocks.filter(
      b => blockNamesContain(b, RETURN_KEYWORDS) || blockNamesContain(b, SERVE_KEYWORDS)
    )
    const targetBlock = serveReturnBlocks[0] ?? blocksMatchingType(blocks, SERVE_RETURN_BLOCK_TYPES)[0] ?? null
    suggestions.push({
      suggestion_type: 'simplify_drill',
      suggested_change:
        `Simplify return drill: start with slow, high-bouncing feeds before live serve. Allow players to catch and hold the ball after each return before playing out the point. Emphasize ready position and split step timing.`,
      reason: [
        returnPlayers.length > 0
          ? `${returnPlayers.length} player${returnPlayers.length > 1 ? 's have' : ' has'} return readiness as a current focus area.`
          : null,
        returnOverride ? 'Academy curriculum emphasizes return-of-serve work.' : null,
      ].filter(Boolean).join(' '),
      players_supported: returnPlayers.map(p => p.fullName),
      player_needs_considered: ['return of serve', 'return readiness'],
      curriculum_context: {
        ...(curriculumContext ? { level: curriculumContext.levelName ?? '' } : {}),
        ...(returnOverride ? { override: 'return of serve emphasis' } : {}),
      },
      risk_level: 'low',
      confidence: returnOverride ? 'high' : 'medium',
      target_block_hint: targetBlock?.name ?? null,
    })
  }

  // ─── Rule 4: Direction / target zone ─────────────────────────────────────

  const directionPlayers = playersMatchingNeeds(activePlayers, DIRECTION_KEYWORDS)
  const directionOverride = overridesMentionKeywords(overrides, DIRECTION_KEYWORDS)
  if (directionPlayers.length >= threshold || directionOverride) {
    const rallyBlock = blocks.find(
      b => blockNamesContain(b, RALLY_KEYWORDS) || blocksMatchingType([b], GAME_BLOCK_TYPES).length > 0
    )
    suggestions.push({
      suggestion_type: 'add_target_zone',
      suggested_change:
        `Add target zones: place cones at corners of the service box (for cross-court) and at the baseline corner (for down-the-line). Award bonus points when the ball lands within a target zone. Track which player hits the most targets.`,
      reason: [
        directionPlayers.length > 0
          ? `${directionPlayers.length} player${directionPlayers.length > 1 ? 's have' : ' has'} directional control as a current focus area.`
          : null,
        directionOverride ? 'Academy curriculum emphasizes directional work.' : null,
      ].filter(Boolean).join(' '),
      players_supported: directionPlayers.map(p => p.fullName),
      player_needs_considered: ['direction', 'target'],
      curriculum_context: {
        ...(curriculumContext ? { level: curriculumContext.levelName ?? '' } : {}),
        ...(directionOverride ? { override: 'direction emphasis' } : {}),
      },
      risk_level: 'low',
      confidence: directionOverride ? 'high' : 'medium',
      target_block_hint: rallyBlock?.name ?? null,
    })
  }

  // ─── Rule 5: Mixed levels — progression / regression pair ────────────────

  const levelNames = Object.keys(groupNeeds.curriculumLevelCounts)
  if (levelNames.length >= 2 && activePlayers.length >= 3) {
    const advancedPlayers = playersMatchingStrengths(activePlayers, ['consistency', 'spin', 'placement', 'advanced'])
    const needsRegressionPlayers = activePlayers.filter(
      p => p.thingsToWorkOn.length >= 2 && p.strengths.length <= 1
    )

    if (advancedPlayers.length > 0 && needsRegressionPlayers.length > 0) {
      suggestions.push({
        suggestion_type: 'adjust_partner_grouping',
        suggested_change:
          `Group players by level for the main drill: put players needing more challenge with each other (progression partners) and players who need consolidation together (regression partners). Assign coaches to check in with each group separately.`,
        reason: `Class has ${levelNames.length} curriculum levels represented and a mix of advanced and developing players. Grouping by level will allow each player to work at the right challenge level.`,
        players_supported: activePlayers.map(p => p.fullName),
        player_needs_considered: ['mixed levels', 'differentiation'],
        curriculum_context: { levels_present: levelNames.join(', ') },
        risk_level: 'medium',
        confidence: 'medium',
        target_block_hint: blocks.find(b => blocksMatchingType([b], GAME_BLOCK_TYPES).length > 0)?.name ?? null,
      })
    }
  }

  // ─── Rule 6: Low class size — adjust scoring ──────────────────────────────

  if (activePlayers.length <= 3 && blocks.length > 0) {
    const gameBlock = blocksMatchingType(blocks, GAME_BLOCK_TYPES)[0]
    if (gameBlock) {
      suggestions.push({
        suggestion_type: 'adjust_scoring',
        suggested_change:
          `Smaller class (${activePlayers.length} players): use Canadian doubles or round-robin format. Play to 7 points per game; rotate server after each game. This keeps all players moving and engaged.`,
        reason: `Only ${activePlayers.length} players are present. Standard doubles or group drills may not be engaging. A compact scoring format will keep intensity high.`,
        players_supported: activePlayers.map(p => p.fullName),
        player_needs_considered: ['class size', 'engagement'],
        curriculum_context: {},
        risk_level: 'low',
        confidence: 'high',
        target_block_hint: gameBlock.name,
      })
    }
  }

  // ─── Rule 7: Assessment moment — if no evidence for multiple players ───────

  const noEvidencePlayers = activePlayers.filter(p => (p.evidenceCount ?? 0) === 0)
  if (noEvidencePlayers.length >= threshold && blocks.length > 0) {
    const assessmentBlock = blocks.find(
      b => blockNamesContain(b, GAME_BLOCK_TYPES.concat(['competition', 'game'])) &&
           !blockNamesContain(b, ['warm', 'cool'])
    ) ?? blocks[Math.floor(blocks.length / 2)] ?? blocks[0]
    suggestions.push({
      suggestion_type: 'add_assessment_moment',
      suggested_change:
        `During this block, take 2 minutes to observe each player individually (30–60 seconds each). Note one strength and one development area per player in the session recap. Focus especially on ${noEvidencePlayers.slice(0, 3).map(p => p.fullName).join(', ')}.`,
      reason: `${noEvidencePlayers.length} player${noEvidencePlayers.length > 1 ? 's' : ''} in this class have no recorded coach observations. This is an opportunity to gather first-hand evidence.`,
      players_supported: noEvidencePlayers.map(p => p.fullName),
      player_needs_considered: ['evidence gap', 'observation'],
      curriculum_context: {},
      risk_level: 'low',
      confidence: 'medium',
      target_block_hint: assessmentBlock?.name ?? null,
    })
  }

  // ─── Rule 8: Academy override — add constraint per override focus ──────────

  for (const override of overrides.slice(0, 2)) {
    const lower = override.toLowerCase()
    const alreadySuggested = suggestions.some(
      s => s.curriculum_context['override'] &&
           lower.includes(s.curriculum_context['override'].toLowerCase())
    )
    if (alreadySuggested) continue

    if (lower.includes('return') && !suggestions.some(s => s.suggestion_type === 'simplify_drill' && s.player_needs_considered.includes('return of serve'))) {
      // already handled by Rule 3
      continue
    }

    suggestions.push({
      suggestion_type: 'add_constraint',
      suggested_change:
        `Apply academy customization to this session: "${override.slice(0, 120)}". Add this as a coaching emphasis cue during the main drill blocks.`,
      reason: `Active academy curriculum override for this session's curriculum level.`,
      players_supported: activePlayers.map(p => p.fullName),
      player_needs_considered: [],
      curriculum_context: { override: override.slice(0, 80) },
      risk_level: 'low',
      confidence: 'high',
      target_block_hint: null,
    })
  }

  // ─── Absent players warning ───────────────────────────────────────────────

  if (absentPlayers.length > 0) {
    warnings.push(
      `${absentPlayers.length} player${absentPlayers.length > 1 ? 's are' : ' is'} absent — suggestions are based on ${activePlayers.length} present player${activePlayers.length > 1 ? 's' : ''}.`
    )
  }

  return {
    suggestions: suggestions.slice(0, 8),
    warnings,
  }
}
