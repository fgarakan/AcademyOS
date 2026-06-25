// Mega Sprint 4291–4320 — Demo signal derivation.
//
// Pure: computes the academy signal snapshot from the demo dataset using the SAME
// rules as the live getDonnaAcademySignalsAction. This is how the certification proves
// DONNA sees the demo academy exactly as production would — no fake runtime signals.

import type { AcademySignalSnapshot } from '@/lib/donna/executive/donnaExecutiveIntelligence'
import type { DemoAcademyDataset } from './demoAcademyGodModeV1'

const ASSESSMENT_STALE_DAYS = 90

/** Derive the live signal snapshot from the demo dataset (mirrors getDonnaAcademySignalsAction). */
export function deriveDemoSignals(ds: DemoAcademyDataset): AcademySignalSnapshot {
  const players = ds.players
  const activePlayers = players.filter((p) => p.status === 'active')

  const withState = activePlayers.filter((p) => p.hasCurriculumState)
  const curriculumSpineActive = players.some((p) => p.hasCurriculumState)

  return {
    onboardingComplete: ds.onboarding.complete,
    curriculumSpineActive,
    // Active players with no player_curriculum_states row.
    playersMissingCurriculumLevel: activePlayers.filter((p) => !p.hasCurriculumState).length,
    // pending_placement counts toward the intake queue (non-active).
    placementQueueCount: players.filter((p) => p.status === 'pending_placement').length,
    levelUpQueueCount: withState.filter((p) => p.advancementEligible).length,
    // Distinct active players carrying at least one active development signal.
    playersNeedingAttention: activePlayers.filter((p) => p.activeSignals.length > 0).length,
    playersWithoutAssessment: activePlayers.filter(
      (p) => p.lastAssessedDaysAgo === null || p.lastAssessedDaysAgo > ASSESSMENT_STALE_DAYS,
    ).length,
    pendingParentApprovals: ds.approvals.filter((a) => a.targetModule === 'parent_communication').length,
    pendingCoachApprovals: ds.approvals.filter((a) => a.targetModule === 'session_wrap_up_v1').length,
    activePlayerCount: activePlayers.length,
    activeCoachCount: ds.coaches.length,
    upcomingSessions: ds.sessions.filter((s) => s.scheduledInDays >= 0 && s.status !== 'completed').length,
    // sessions.coach_id is NOT NULL in schema, so the live query can never see an
    // unassigned session — kept honest at 0 (see remaining gaps in the test script).
    unassignedSessions: 0,
  }
}
