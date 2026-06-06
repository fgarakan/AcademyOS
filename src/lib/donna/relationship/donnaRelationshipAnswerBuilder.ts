// Mega Sprint 2341–2370 — DONNA Academy Relationship Intelligence V1
// Relationship answer builder: formats relationship engine results into
// DONNA COO-style responses with reasoning chains and recommended next steps.
// Pure TypeScript — no DB, no React, no side effects.

import {
  buildAcademyInsight,
  getPlayerContext,
  getPlayersNeedingAttention,
  getSharedBottleneckPlayers,
  getPlayersWithoutRecentAssessment,
} from './donnaRelationshipIntelligence'
import type {
  PlayerContextResult,
  GroupContextResult,
  LevelContextResult,
  CoGroupResult,
  AcademyInsightResult,
  StalledPlayerSignal,
  RelationshipContext,
} from './donnaRelationshipIntelligence'
import type { PlayerCurriculumStateSummary } from '@/lib/donna/extendedContextLoaders'
import type { RelationshipIntelligenceKind } from './donnaRelationshipIntentDetector'

// ── Utilities ─────────────────────────────────────────────────────────────────

function pluralise(n: number, singular: string, plural?: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural ?? singular + 's'}`
}

function nameList(names: string[], max = 4): string {
  if (names.length === 0) return 'none'
  if (names.length <= max) return names.join(', ')
  return `${names.slice(0, max - 1).join(', ')} and ${names.length - (max - 1)} more`
}

function firstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName
}

function stallSummary(signals: StalledPlayerSignal[]): string {
  if (signals.length === 0) return 'none stalled'
  const high   = signals.filter(s => s.severity === 'high').length
  const medium = signals.filter(s => s.severity === 'medium').length
  const parts: string[] = []
  if (high > 0) parts.push(`${high} high-severity`)
  if (medium > 0) parts.push(`${medium} medium-severity`)
  return `${signals.length} stalled (${parts.join(', ')})`
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/[🔴🟡✅📍📋⚠️]/g, '')
    .replace(/\n+/g, '. ')
    .trim()
}

// ── Player context answer ─────────────────────────────────────────────────────

export function buildPlayerContextAnswer(result: PlayerContextResult): string {
  const { player, group, coGroupMembers, recentAssessments, stallSignal, matchingTemplates } = result
  const name = player.playerName

  const lines: string[] = []
  lines.push(`**${name}** — ${player.currentLevelDisplayName ?? 'Level not set'}`)

  // Group
  if (group) {
    const others = coGroupMembers.length
    lines.push(`**Group:** ${group.name} (${others > 0 ? `with ${pluralise(others, 'other player')}` : 'sole player in group'})`)
  } else {
    lines.push('**Group:** No group assigned at this level')
  }

  // Stall / progress
  if (stallSignal) {
    const sev = stallSignal.severity === 'high' ? '🔴 High' : '🟡 Medium'
    lines.push(`**Progress:** ${sev} — stalled ${stallSignal.daysAtLevel} days at this level without advancing`)
    if (stallSignal.missingRecentAssessment) {
      lines.push('**Assessment:** No assessment in the last 90 days — recommend scheduling one')
    }
  } else if (player.advancementEligible) {
    lines.push('**Progress:** Ready to advance — advancement eligible flag set')
  } else {
    lines.push('**Progress:** Active — progressing normally')
  }

  // Assessments
  if (recentAssessments.length > 0) {
    const latest = recentAssessments[0]
    const score = latest.overallScore !== null ? ` (score: ${latest.overallScore})` : ''
    lines.push(`**Latest assessment:** ${latest.type}${score} on ${latest.assessedDate.split('T')[0]}`)
  }

  // Templates
  if (matchingTemplates.length > 0) {
    const names = matchingTemplates.slice(0, 2).map(t => t.name).join(', ')
    lines.push(`**Active templates:** ${names}${matchingTemplates.length > 2 ? ` (+${matchingTemplates.length - 2} more)` : ''}`)
  }

  return lines.join('\n')
}

// ── Group context answer ──────────────────────────────────────────────────────

export function buildGroupContextAnswer(result: GroupContextResult): string {
  const { group, players, stalledSignals, advancing, templates } = result

  const lines: string[] = []
  lines.push(`**${group.name}** — ${pluralise(players.length, 'player')}`)

  if (players.length > 0) {
    const names = nameList(players.map(p => firstName(p.playerName)))
    lines.push(`**Members:** ${names}`)
  }

  if (advancing.length > 0) {
    lines.push(`**Ready to advance:** ${nameList(advancing.map(p => firstName(p.playerName)))}`)
  }

  if (stalledSignals.length > 0) {
    lines.push(`**Stalled:** ${stallSummary(stalledSignals)} — ${nameList(stalledSignals.map(s => firstName(s.player.playerName)))}`)
  }

  if (templates.length > 0) {
    lines.push(`**Templates:** ${templates.slice(0, 2).map(t => t.name).join(', ')}${templates.length > 2 ? '...' : ''}`)
  }

  return lines.join('\n')
}

// ── Level context answer ──────────────────────────────────────────────────────

export function buildLevelContextAnswer(result: LevelContextResult): string {
  const { levelDisplayName, players, stalledSignals, groups, templates, assessmentCount } = result

  const lines: string[] = []
  lines.push(`**${levelDisplayName ?? 'Level'}** — ${pluralise(players.length, 'player')}`)

  const advancing = players.filter(p => p.advancementEligible)
  if (advancing.length > 0) {
    lines.push(`**Ready to advance:** ${nameList(advancing.map(p => firstName(p.playerName)))}`)
  }
  if (stalledSignals.length > 0) {
    lines.push(`**Stalled:** ${stallSummary(stalledSignals)} — ${nameList(stalledSignals.map(s => firstName(s.player.playerName)))}`)
  }
  if (groups.length > 0) {
    lines.push(`**Groups at this level:** ${groups.map(g => g.name).join(', ')}`)
  }
  if (templates.length > 0) {
    lines.push(`**Templates:** ${templates.slice(0, 2).map(t => t.name).join(', ')}${templates.length > 2 ? '...' : ''}`)
  }
  if (assessmentCount > 0) {
    lines.push(`**Assessments recorded:** ${assessmentCount}`)
  }

  return lines.join('\n')
}

// ── Co-group members answer ───────────────────────────────────────────────────

export function buildCoGroupMembersAnswer(result: CoGroupResult): string {
  const { sourcePlayer, group, members } = result

  if (!sourcePlayer) {
    return "I need to know which player you're asking about. Who should I look up?"
  }

  if (!group) {
    return `${firstName(sourcePlayer.playerName)} doesn't have a group assigned at their current level (${sourcePlayer.currentLevelDisplayName ?? 'unknown level'}).`
  }

  if (members.length === 0) {
    return `${firstName(sourcePlayer.playerName)} is the only player currently in ${group.name} at ${sourcePlayer.currentLevelDisplayName ?? 'this level'}.`
  }

  const names = nameList(members.map(p => p.playerName))
  return `**${group.name}** has ${pluralise(members.length + 1, 'player')} total.\n\nOther members alongside ${firstName(sourcePlayer.playerName)}: **${names}**`
}

// ── Shared bottleneck answer ──────────────────────────────────────────────────

export function buildSharedBottleneckAnswer(
  players: PlayerCurriculumStateSummary[],
  hotspot: { levelDisplayName: string | null; stalledCount: number; playerCount: number } | null,
): string {
  if (!hotspot) {
    return "No curriculum bottleneck detected from the currently loaded player data. The academy looks healthy."
  }

  const levelName = hotspot.levelDisplayName ?? 'the highest-risk level'

  if (players.length === 0) {
    return `**${levelName}** is the most blocked level (${hotspot.stalledCount}/${hotspot.playerCount} stalled) but I don't have individual player details loaded.`
  }

  const stalled = players.filter(p => !p.advancementEligible)
  const names   = nameList(stalled.map(p => p.playerName))

  return `**Shared bottleneck: ${levelName}**\n\n${pluralise(hotspot.stalledCount, 'player')} stalled at this level: ${names}\n\nAll ${hotspot.playerCount} players at this level share this curriculum challenge. Consider reviewing session templates or scheduling targeted assessments.`
}

// ── Players needing attention answer ─────────────────────────────────────────

export function buildPlayersNeedingAttentionAnswer(
  signals: StalledPlayerSignal[],
): string {
  if (signals.length === 0) {
    return "No players are currently stalled. Everyone is either advancing or within normal progress windows."
  }

  const urgent   = signals.filter(s => s.severity === 'high')
  const moderate = signals.filter(s => s.severity === 'medium')

  const lines: string[] = []
  lines.push(`**${pluralise(signals.length, 'player')} need${signals.length === 1 ? 's' : ''} attention:**`)

  if (urgent.length > 0) {
    lines.push('')
    lines.push('🔴 **High priority** (stalled >180 days):')
    for (const s of urgent.slice(0, 5)) {
      const level    = s.player.currentLevelDisplayName ?? 'unknown level'
      const noAssess = s.missingRecentAssessment ? ' — no recent assessment' : ''
      lines.push(`• ${s.player.playerName} — ${s.daysAtLevel} days at ${level}${noAssess}`)
    }
  }

  if (moderate.length > 0) {
    lines.push('')
    lines.push('🟡 **Medium priority** (stalled 90–180 days):')
    for (const s of moderate.slice(0, 5)) {
      const level = s.player.currentLevelDisplayName ?? 'unknown level'
      lines.push(`• ${s.player.playerName} — ${s.daysAtLevel} days at ${level}`)
    }
  }

  return lines.join('\n')
}

// ── Academy insight answer ────────────────────────────────────────────────────

export function buildAcademyInsightAnswer(insight: AcademyInsightResult): string {
  const lines: string[] = []
  lines.push('**Academy Status Overview**')
  lines.push('')

  if (insight.stalledCount === 0 && insight.urgentSignals.length === 0) {
    lines.push('✅ No stalled players detected. Academy looks healthy.')
  } else {
    if (insight.urgentSignals.length > 0) {
      lines.push(`🔴 **${pluralise(insight.urgentSignals.length, 'urgent player')}** stalled >180 days: ${nameList(insight.urgentSignals.map(s => firstName(s.player.playerName)))}`)
    }
    if (insight.moderateSignals.length > 0) {
      lines.push(`🟡 **${pluralise(insight.moderateSignals.length, 'player')}** stalled 90–180 days`)
    }
  }

  if (insight.advancingCount > 0) {
    lines.push(`✅ **${pluralise(insight.advancingCount, 'player')}** ready to advance`)
  }

  if (insight.levelHotspot) {
    const h   = insight.levelHotspot
    const pct = Math.round(h.stallRate * 100)
    lines.push(`📍 **Hotspot level:** ${h.levelDisplayName ?? h.levelId} — ${pct}% stalled (${h.stalledCount}/${h.playerCount} players)`)
  }

  if (insight.playersWithoutAssessment.length > 0) {
    lines.push(`📋 **${pluralise(insight.playersWithoutAssessment.length, 'player')}** without a recent assessment`)
  }

  if (insight.groupsAtRisk.length > 0) {
    const groupNames = insight.groupsAtRisk.map(g => g.name).join(', ')
    lines.push(`⚠️  **Groups at risk:** ${groupNames}`)
  }

  lines.push('')
  lines.push(`**Focus:** ${insight.recommendedFocusStatement}`)

  return lines.join('\n')
}

// ── COO reasoning answer ──────────────────────────────────────────────────────

export function buildCOOReasoningAnswer(
  subjectName: string | null,
  rCtx:        RelationshipContext,
): string {
  if (!subjectName) {
    const insight = buildAcademyInsight(rCtx)
    return buildAcademyInsightAnswer(insight)
  }

  const lower  = subjectName.toLowerCase()
  const player = rCtx.players.find(p => p.playerName.toLowerCase().includes(lower))

  if (!player) {
    return `I couldn't find a player named "${subjectName}" in the loaded data. Try opening their profile directly.`
  }

  const stall = rCtx.stalledPlayers.find(s => s.player.playerId === player.playerId)

  const lines: string[] = []
  lines.push(`**Why ${firstName(player.playerName)} needs attention:**`)
  lines.push('')

  if (stall) {
    lines.push(`• Stalled at ${player.currentLevelDisplayName ?? 'current level'} for **${stall.daysAtLevel} days** without advancing (${stall.severity} severity)`)
    if (stall.missingRecentAssessment) {
      lines.push('• No assessment recorded in the last 90 days — harder to confirm readiness or identify blockers')
    }
  } else if (player.advancementEligible) {
    lines.push(`• Advancement-eligible at ${player.currentLevelDisplayName ?? 'current level'} — waiting for director decision`)
  } else {
    lines.push(`• No stall detected. Progressing normally at ${player.currentLevelDisplayName ?? 'current level'}.`)
  }

  // Who else is affected at same level?
  const levelPeers = (rCtx.playersByLevelId.get(player.currentLevelId) ?? [])
    .filter(p => p.playerId !== player.playerId)

  const stalledPeers = levelPeers.filter(p =>
    rCtx.stalledPlayers.some(s => s.player.playerId === p.playerId),
  )
  if (stalledPeers.length > 0) {
    lines.push(`• ${pluralise(stalledPeers.length, 'other player')} at the same level also stalled: ${nameList(stalledPeers.map(p => firstName(p.playerName)))}`)
  }

  lines.push('')
  lines.push(`**Recommended action:** Open ${firstName(player.playerName)}'s player profile to review their assessment history and schedule a readiness evaluation.`)

  return lines.join('\n')
}

// ── Coach load honest fallback ────────────────────────────────────────────────

export function buildCoachLoadAnswer(): string {
  return "Coach-to-player assignments aren't loaded in the current session context. To compare coach loads, visit the Groups or Sessions page where player-coach assignments are visible."
}

// ── Players without assessment answer ────────────────────────────────────────

export function buildPlayersWithoutAssessmentAnswer(
  players: PlayerCurriculumStateSummary[],
): string {
  if (players.length === 0) {
    return "All loaded players have had a recent assessment (within 90 days). Assessment coverage looks good."
  }
  const names = nameList(players.map(p => p.playerName))
  return `**${pluralise(players.length, 'player')} without a recent assessment:**\n\n${names}\n\nConsider scheduling assessments to confirm their curriculum readiness.`
}

// ── Advancing players answer ──────────────────────────────────────────────────

export function buildAdvancingPlayersAnswer(
  players: PlayerCurriculumStateSummary[],
): string {
  if (players.length === 0) {
    return "No players are currently flagged as advancement-eligible. They may need assessments or their advancement readiness hasn't been reviewed yet."
  }
  const names = nameList(players.map(p => p.playerName))
  return `**${pluralise(players.length, 'player')} ready to advance:**\n\n${names}\n\nAll are flagged as advancement-eligible. Open the Players page to begin the placement review for each.`
}

// ── Dispatch: build answer for any relationship intelligence intent ─────────

export function buildRelationshipIntelligenceAnswer(
  kind:    RelationshipIntelligenceKind,
  subject: string | null,
  rCtx:    RelationshipContext,
): { message: string; spokenMessage: string } {
  let message: string

  switch (kind) {
    case 'academy_insight': {
      const insight = buildAcademyInsight(rCtx)
      message = buildAcademyInsightAnswer(insight)
      break
    }
    case 'players_needing_attention': {
      const signals = getPlayersNeedingAttention(rCtx)
      message = buildPlayersNeedingAttentionAnswer(signals)
      break
    }
    case 'stalled_players': {
      message = buildPlayersNeedingAttentionAnswer(rCtx.stalledPlayers)
      break
    }
    case 'shared_bottleneck': {
      const players = getSharedBottleneckPlayers(null, rCtx)
      message = buildSharedBottleneckAnswer(players, rCtx.levelHotspot)
      break
    }
    case 'level_health': {
      const players = rCtx.levelHotspot
        ? (rCtx.playersByLevelId.get(rCtx.levelHotspot.levelId) ?? [])
        : []
      message = buildSharedBottleneckAnswer(players, rCtx.levelHotspot)
      break
    }
    case 'coach_load': {
      message = buildCoachLoadAnswer()
      break
    }
    case 'players_without_assessment': {
      const players = getPlayersWithoutRecentAssessment(rCtx)
      message = buildPlayersWithoutAssessmentAnswer(players)
      break
    }
    case 'advancing_players': {
      message = buildAdvancingPlayersAnswer(rCtx.advancingPlayers)
      break
    }
    case 'coo_reasoning': {
      message = buildCOOReasoningAnswer(subject, rCtx)
      break
    }
    case 'player_full_context': {
      if (subject) {
        const lower  = subject.toLowerCase()
        const player = rCtx.players.find(p => p.playerName.toLowerCase().includes(lower))
        if (player) {
          const ctx = getPlayerContext(player.playerId, rCtx)
          message = ctx
            ? buildPlayerContextAnswer(ctx)
            : `Found ${player.playerName} but couldn't build their full context.`
        } else {
          message = `I couldn't find a player named "${subject}". Try opening their profile directly.`
        }
      } else {
        message = "Which player would you like the full context for?"
      }
      break
    }
    case 'co_group_members':
    case 'group_health': {
      // Handled inline in the brain step using lastRelevantEntity
      message = subject
        ? `Looking up group information for ${subject}...`
        : "To find group members, I need to know which player or group you're asking about. Try: \"Who else is in Jake's group?\""
      break
    }
    default: {
      message = "I can help with that. Could you be more specific about which player, group, or level you're asking about?"
    }
  }

  return { message, spokenMessage: stripMarkdown(message) }
}
