// Evidence Parent Translator — pure TypeScript, no DB calls.
// Generates parent-safe and player-safe summaries from ProgressRollup.
//
// Safety rules (enforced here):
// - NO raw assessment scores exposed to parents/players
// - NO raw coach observation text
// - NO internal disagreement or director override reasoning
// - NO delta numbers or technical scoring language
// - NO "needs work" framing — only positive development language

import type { ProgressRollup, EvidenceRecord } from './playerEvidenceTypes'
import type { ParentSafeSummary, PlayerSafeSummary } from './playerEvidenceTypes'

// ─── Parent-safe summary ──────────────────────────────────────────────────────

export function generateParentSafeSummary(
  rollup: ProgressRollup,
  playerFirstName: string | null,
  currentLevelName: string | null,
  records: EvidenceRecord[],
): ParentSafeSummary {
  const name = playerFirstName ?? 'Your child'
  const generatedFrom: string[] = []

  // Current focus — from most recent skill pathway evidence
  const skillSignal = rollup.pathwaySignals.find(s => s.pathway === 'skill')
  let currentFocus: string | null = null
  if (skillSignal?.strongestArea) {
    currentFocus = `${name} is currently developing ${skillSignal.strongestArea.toLowerCase()}.`
    generatedFrom.push('skill_evidence')
  } else if (currentLevelName) {
    currentFocus = `${name} is working through the ${currentLevelName} program.`
    generatedFrom.push('curriculum_level')
  }

  // Why it matters — contextual, non-technical
  let whyItMatters: string | null = null
  if (skillSignal?.pathway) {
    whyItMatters = `These skills build the technical foundation ${name} needs to compete and enjoy the game more fully.`
    generatedFrom.push('pathway_context')
  }

  // Recent progress — only from parent-visible evidence
  const parentVisibleRecords = records.filter(r => r.visible_to_parent)
  let recentProgress: string | null = null
  if (rollup.progressStatus === 'ready_for_review') {
    recentProgress = `${name} has been making consistent progress and may be ready for a development milestone review.`
    generatedFrom.push('progress_status')
  } else if (rollup.missionProgress.completed > 0) {
    recentProgress = `${name} recently completed a development mission.`
    generatedFrom.push('mission_completed')
  } else if (parentVisibleRecords.length > 0) {
    recentProgress = `${name} has been active in their development program recently.`
    generatedFrom.push('recent_activity')
  }

  // What helps at home
  let whatHelpsAtHome: string | null = null
  const fitnessSignal = rollup.pathwaySignals.find(s => s.pathway === 'fitness')
  const mentalSignal  = rollup.pathwaySignals.find(s => s.pathway === 'mental_performance')
  if (fitnessSignal && fitnessSignal.evidenceCount > 0) {
    whatHelpsAtHome = 'Encouraging regular physical activity and good sleep will support on-court performance.'
  } else if (mentalSignal && mentalSignal.evidenceCount > 0) {
    whatHelpsAtHome = 'Positive reinforcement after practice and helping your child reflect on what went well builds mental resilience.'
  } else {
    whatHelpsAtHome = 'Encouraging consistent attendance and a positive attitude goes a long way.'
  }
  generatedFrom.push('pathway_guidance')

  // Next check-in
  const nextCheckIn: string | null =
    rollup.assessmentFreshnessDays !== null && rollup.assessmentFreshnessDays > 60
      ? `A development check-in is coming up soon.`
      : null

  return { currentFocus, whyItMatters, recentProgress, whatHelpsAtHome, nextCheckIn, generatedFrom }
}

// ─── Player-safe summary ──────────────────────────────────────────────────────

export function generatePlayerSafeSummary(
  rollup: ProgressRollup,
  playerFirstName: string | null,
  records: EvidenceRecord[],
): PlayerSafeSummary {
  const name = playerFirstName ?? 'You'
  const generatedFrom: string[] = []

  // Active mission
  const activeMissionRecord = records.find(r =>
    r.source_type === 'mission_assigned' && r.visible_to_player
  )
  const mission: string | null = activeMissionRecord
    ? activeMissionRecord.evidence_summary.replace('Mission assigned: ', '').replace(/^"|"$|\.$/g, '')
    : null
  if (mission) generatedFrom.push('mission')

  // Progress — from completed missions or good rollup status
  let progress: string | null = null
  if (rollup.missionProgress.completed > 0) {
    progress = `${name} completed ${rollup.missionProgress.completed} mission${rollup.missionProgress.completed !== 1 ? 's' : ''} so far.`
    generatedFrom.push('mission_progress')
  } else if (rollup.progressStatus === 'on_track' || rollup.progressStatus === 'ready_for_review') {
    progress = "Keep going — you're on track."
    generatedFrom.push('progress_status')
  }

  // Encouragement — never negative
  const encouragementLines = [
    "Every practice session builds on the last. Keep showing up.",
    "Progress takes time — you're doing the work that matters.",
    "Great players are built one session at a time. Stay consistent.",
    "Focus on getting better each session, not perfect.",
  ]
  const encouragement = encouragementLines[
    Math.abs(rollup.playerId.charCodeAt(0) - 65) % encouragementLines.length
  ] ?? encouragementLines[0]

  // Next action — from active mission or general
  let nextAction: string | null = null
  if (mission) {
    nextAction = `Work on: ${mission}`
    generatedFrom.push('mission_action')
  } else if (rollup.recommendedNextAction && !rollup.recommendedNextAction.includes('director')) {
    nextAction = 'Ask your coach what to focus on at the next session.'
  }

  return { mission, progress, encouragement, nextAction, generatedFrom }
}
